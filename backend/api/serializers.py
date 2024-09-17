from pathlib import Path

from rest_framework import serializers

from .models import Voter, VoterUpload


class RequestOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)


class VoterUploadSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = VoterUpload
        fields = [
            'id',
            'file',
            'status',
            'processed_records',
            'total_records',
            'created_at',
            'updated_at',
            'reason',
            'status',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_file(self, instance):
        return Path(instance.file.name).name


class VoterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voter
        fields = [
            'id',
            'email',
            'gender',
            'full_name',
            'department',
            'created_at',
            'matriculation_number',
        ]
