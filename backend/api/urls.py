from django.urls import path

from .views import VotersAPIView, VoterUploadView, VerifyOtpAPIView, RequestOtpAPIView, VoterUploadListView

urlpatterns = [
    path('voters', VotersAPIView.as_view(), name='voters'),
    path('auth/verify-otp', VerifyOtpAPIView.as_view(), name='verify-otp'),
    path('voters/uploads', VoterUploadView.as_view(), name='upload-voters'),
    path('auth/request-otp', RequestOtpAPIView.as_view(), name='request-otp'),
    path('voters/uploads/status', VoterUploadListView.as_view(), name='voters-upload-job'),
]
