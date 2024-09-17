import csv
import logging
import secrets
from pathlib import Path

from faker import Faker
from openpyxl import Workbook

logger = logging.getLogger(__name__)


def generate_random_voters(num_entries: int) -> list[dict[str, str]]:
    """
    Generate a list of random voter information.

    Args:
        num_entries (int): Number of voter entries to generate.

    Returns:
        list[dict[str, str]]: List of dictionaries containing voter information.
    """
    fake = Faker()
    voters = []

    departments = [
        'Computer Science',
        'Electrical Engineering',
        'Mechanical Engineering',
        'Civil Engineering',
        'Chemical Engineering',
        'Biology',
        'Physics',
        'Mathematics',
        'Economics',
        'Business Administration',
    ]

    for _ in range(num_entries):
        voter = {
            'email': fake.email(),
            'full_name': fake.name(),
            'gender': secrets.choice(['M', 'F']),
            'department': secrets.choice(departments),
            'matriculation_number': f'{fake.random_int(min=1000000, max=9999999)}',
        }
        voters.append(voter)

    return voters


def save_to_csv(voters: list[dict[str, str]], filename: str):
    """
    Save the generated voter information to a CSV file.

    Args:
        voters (list[dict[str, str]]): List of dictionaries containing voter information.
        filename (str): Name of the CSV file to save the data to.
    """
    fieldnames = ['email', 'gender', 'full_name', 'department', 'matriculation_number']

    with Path(filename).open(mode='w', encoding='utf-8', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for voter in voters:
            writer.writerow(voter)


def save_to_excel(voters: list[dict[str, str]], filename: str):
    """
    Save the generated voter information to an Excel file.

    Args:
        voters (list[dict[str, str]]): List of dictionaries containing voter information.
        filename (str): Name of the Excel file to save the data to.
    """
    wb = Workbook()
    ws = wb.active
    ws.title = 'Voters'

    # Write header
    header = ['email', 'gender', 'full_name', 'department', 'matriculation_number']
    ws.append(header)

    # Write data
    for voter in voters:
        ws.append([voter[field] for field in header])

    wb.save(filename)


def main():
    num_entries = int(input('How many entries would you like to generate? '))
    file_type = input('Enter the output file type (csv/excel): ').strip().lower()

    if file_type == 'csv':
        default_filename = 'random_voters.csv'
    elif file_type == 'excel':
        default_filename = 'random_voters.xlsx'
    else:
        logger.debug('Invalid file type. Defaulting to CSV.')
        file_type = 'csv'
        default_filename = 'random_voters.csv'

    filename = input(f'Enter the output filename (default: {default_filename}): ').strip() or default_filename

    logger.debug(f'Generating {num_entries} random voter entries...')
    voters = generate_random_voters(num_entries)

    if file_type == 'csv':
        save_to_csv(voters, filename)
    else:
        save_to_excel(voters, filename)

    logger.debug(f'Random voter data has been saved to {filename}')


if __name__ == '__main__':
    main()
