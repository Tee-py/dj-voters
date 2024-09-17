import secrets

from django.core.cache import cache

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.generics import ListAPIView, GenericAPIView
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.permissions import IsAuthenticated

from .tasks import send_email
from .utils import generate_access_token, generate_refresh_token
from .models import Admin, Voter, VoterUpload
from .serializers import VoterSerializer, VerifyOTPSerializer, RequestOTPSerializer, VoterUploadSerializer


class UserOnePerMinuteThrottle(UserRateThrottle):
    rate = '1/minute'


class AnonOnePerMinuteThrottle(AnonRateThrottle):
    rate = '1/minute'


class RequestOtpAPIView(GenericAPIView):
    serializer_class = RequestOTPSerializer
    throttle_classes = [UserOnePerMinuteThrottle, AnonOnePerMinuteThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        Admin.objects.get_or_create(email=email)

        otp = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
        cache.set(f'otp:{email}', otp, timeout=900)  # 15 minutes

        email_subject = 'Your Verification Code for Secure Access'
        email_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Verification Code for Your Account</h2>
            <p>Hello,</p>
            <p>You've requested a verification code to access your account. Here's your 6-digit code:</p>
            <h1 style="font-size: 32px; background-color: #f0f0f0; padding: 10px; text-align: center; letter-spacing: 5px;">{otp}</h1>
            <p>This code will expire in 15 minutes for security reasons.</p>
            <p><strong>Important:</strong> If you didn't request this code, please ignore this email. Your account security is important to us.</p>
            <p>Thank you for using our service.</p>
            <p>Best regards,<br>Your Support Team</p>
        </body>
        </html>
        """  # noqa: E501

        send_email(to=email, subject=email_subject, html=email_body)

        return Response(
            data={'success': True, 'message': 'Verification code sent to your email address'},
            status=status.HTTP_200_OK,
        )


class VerifyOtpAPIView(GenericAPIView):
    serializer_class = VerifyOTPSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']

        cached_otp = cache.get(f'otp:{email}', default=None)
        if cached_otp is None:
            return Response(data={'success': False, 'error': 'invalid otp'}, status=status.HTTP_400_BAD_REQUEST)

        if cached_otp != otp:
            return Response(data={'success': False, 'error': 'invalid otp'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = Admin.objects.get(email=email)
        except Admin.DoesNotExist:
            return Response(data={'success': False, 'error': 'invalid otp'}, status=status.HTTP_400_BAD_REQUEST)

        access_token = generate_access_token(user)
        refresh_token = generate_refresh_token(user)
        return Response(
            status=status.HTTP_200_OK,
            data={'success': True, 'data': {'access_token': access_token, 'refresh_token': refresh_token}},
        )


class VoterUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [FormParser, MultiPartParser]

    def post(self, request, *args, **kwargs):
        file = request.data.get('file')
        if not file:
            return Response({'success': False, 'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        VoterUpload.objects.create(
            file=file,
            user=request.user,
        )

        return Response(
            data={'success': True},
            status=status.HTTP_200_OK,
        )


class VotersAPIView(ListAPIView):
    serializer_class = VoterSerializer
    permission_classes = [IsAuthenticated]
    queryset = Voter.objects.get_queryset()

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.filter(added_by__email=self.request.user.email)

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return Response({'success': True, 'data': response.data}, status=response.status_code)


class VoterUploadListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = VoterUploadSerializer
    queryset = VoterUpload.objects.get_queryset()

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.filter(user__email=self.request.user.email).order_by('-created_at')

    def list(self, request, *args, **kwargs):
        # typically the data should be paginated but since tanstack can handle ~100k entries
        # we'll send all the voters info to the client.
        response = super().list(request, *args, **kwargs)
        return Response({'success': True, 'data': response.data}, status=response.status_code)
