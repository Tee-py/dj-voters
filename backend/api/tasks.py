import logging

import pandas as pd
import requests
import shortuuid
from huey import crontab
from huey.contrib.djhuey import task, db_task, lock_task, db_periodic_task

from django.db import transaction
from django.conf import settings
from django.core.exceptions import ValidationError

from .models import Voter, VoterUpload

logger = logging.getLogger(__name__)

BATCH_SIZE = 1000
PROGRESS_UPDATE_COUNT = 20
REQUIRED_COLUMNS = ['email', 'gender', 'full_name', 'department', 'matriculation_number']


@db_periodic_task(crontab(minute='*/1'))
@lock_task('fetch-all-pending-uploads-lock')
def fetch_all_pending_uploads():
    try:
        pending_uploads = VoterUpload.objects.filter(status='pending')
        for upload in pending_uploads:
            logger.info(f'Initiating processing for upload {upload.id}')
            process_upload.schedule((upload.id,), delay=1)
            upload.status = 'processing'
            upload.save(update_fields=['status'])
    except Exception:
        logger.exception('Error in fetch_all_pending_uploads')


@db_task()
def process_upload(upload_id: str):
    upload = VoterUpload.objects.get(id=upload_id)
    logger.info(f'Processing upload {upload_id}')

    try:
        file_extension = upload.file.name.split('.')[-1].lower()

        if file_extension == 'csv':
            df = pd.read_csv(upload.file)
        elif file_extension in ['xls', 'xlsx']:
            df = pd.read_excel(upload.file)
        else:
            msg = f'Unsupported file type: {file_extension}'
            raise ValueError(msg)

        if set(REQUIRED_COLUMNS) != set(df.columns):
            msg = f"Column mismatch. Expected: {', '.join(REQUIRED_COLUMNS)}"
            raise ValueError(msg)

        valid_records = 0
        voters_to_create = []
        total_records = len(df)

        upload.total_records = total_records
        upload.save(update_fields=['total_records'])

        for index, row in df.iterrows():
            try:
                voter_data = {
                    'email': row['email'],
                    'gender': row['gender'],
                    'added_by_id': upload.user.id,
                    'full_name': row['full_name'],
                    'department': row['department'],
                    'id': f'voter_{shortuuid.uuid()}',
                    'matriculation_number': str(row['matriculation_number']),
                }

                voters_to_create.append(Voter(**voter_data))

                if len(voters_to_create) >= BATCH_SIZE:
                    valid_records += batch_create_voters(voters_to_create)
                    voters_to_create = []

                if (index + 1) % PROGRESS_UPDATE_COUNT == 0:
                    logger.info(f'Processed {index + 1} records for upload {upload.id}')
                    upload.processed_records = valid_records
                    upload.save(update_fields=['processed_records'])

            except ValidationError as e:
                logger.warning(f'Invalid data in row {index + 1} of upload {upload.id}: {e!s}')

        if voters_to_create:
            valid_records += batch_create_voters(voters_to_create)

        upload.processed_records = valid_records
        upload.status = 'completed'
        upload.save(update_fields=['processed_records', 'status'])

        send_email(
            to=upload.user.email,
            subject='Voter Upload Processed Successfully',
            html=f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>Voter Upload Processed Successfully</h2>
                    <p>Your voter upload has been processed successfully. Here are the details:</p>
                    <ul>
                        <li><strong>Upload ID:</strong> {upload_id}</li>
                        <li><strong>File Name:</strong> {upload.file.name}</li>
                        <li><strong>Total Records:</strong> {total_records}</li>
                        <li><strong>Valid Records Processed:</strong> {valid_records}</li>
                        <li><strong>Invalid Records:</strong> {total_records - valid_records}</li>
                    </ul>
                    <p>If you have any questions or concerns, please contact our support team.</p>
                    <p>Thank you for using our service!</p>
                </body>
            </html>
            """,
        )

        logger.info(
            f'Completed processing upload {upload_id}. '
            f'Total records: {total_records}, Valid records: {valid_records}'
        )
    except Exception as e:
        logger.exception(f'Error processing upload {upload_id}')
        upload.status = 'failed'
        upload.reason = str(e)
        upload.save(update_fields=['status', 'reason'])


@task()
def send_email(to: str | list[str], subject: str, html: str) -> dict:
    """
    Send an email using the Resend API.

    Args:
        to (str or list): The recipient's email address(es).
        subject (str): The subject of the email.
        html (str): The HTML content of the email.
    """
    logger.info(f'Sending email to {to} with subject: {subject}')

    url = 'https://api.resend.com/emails'
    headers = {'Authorization': f'Bearer {settings.RESEND_API_KEY}', 'Content-Type': 'application/json'}

    payload = {
        'from': 'DWST-Task <onboarding@resend.dev>',
        'to': to if isinstance(to, list) else [to],
        'subject': subject,
        'html': html,
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        response.raise_for_status()
        logger.info(f'Email sent successfully to {to}')
    except requests.RequestException:
        logger.exception('Failed to send email')


@transaction.atomic
def batch_create_voters(voters):
    return len(Voter.objects.bulk_create(voters, ignore_conflicts=True))
