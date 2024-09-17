import shortuuid

from django.db import models
from django.core.validators import FileExtensionValidator


class Admin(models.Model):
    id = models.CharField('identifier', max_length=50, primary_key=True)
    email = models.EmailField('email address', unique=True, null=False, blank=False)
    created_at = models.DateTimeField('created at', auto_now_add=True)

    def save(self, *args, **kwargs) -> None:
        if not self.id:
            self.id = f'admin_{shortuuid.uuid()}'

        return super().save(*args, **kwargs)

    @property
    def is_authenticated(self):
        return True


class VoterUpload(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )
    id = models.CharField('identifier', max_length=50, primary_key=True)

    updated_at = models.DateTimeField(auto_now=True)
    processed_records = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(Admin, on_delete=models.CASCADE)
    total_records = models.IntegerField(null=True, blank=True)
    file = models.FileField(
        upload_to='voters',
        blank=False,
        null=False,
        validators=[FileExtensionValidator(allowed_extensions=['csv', 'xls', 'xlsx'])],
    )
    reason = models.TextField(default='')  # only when the status is failed
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    def __str__(self):
        return f'Upload {self.id} - {self.status}'

    def save(self, *args, **kwargs) -> None:
        if not self.id:
            self.id = f'upload_{shortuuid.uuid()}'

        return super().save(*args, **kwargs)


class Voter(models.Model):
    id = models.CharField('identifier', max_length=50, primary_key=True)
    added_by = models.ForeignKey(Admin, on_delete=models.CASCADE)

    email = models.EmailField(unique=True)
    gender = models.CharField(max_length=1)
    full_name = models.CharField(max_length=200)
    department = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    matriculation_number = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return f'{self.matriculation_number} - {self.full_name}'

    def save(self, *args, **kwargs) -> None:
        if not self.id:
            self.id = f'voter_{shortuuid.uuid()}'

        return super().save(*args, **kwargs)
