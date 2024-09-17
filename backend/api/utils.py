import jwt

from django.conf import settings
from django.utils import timezone


def generate_access_token(user):
    payload = {
        'user_id': user.id,
        'iat': timezone.now(),
        'exp': timezone.now() + settings.JWT_AUTH['JWT_EXPIRATION_DELTA'],
    }
    return jwt.encode(payload, settings.JWT_AUTH['JWT_SECRET_KEY'], algorithm=settings.JWT_AUTH['JWT_ALGORITHM'])


def generate_refresh_token(user):
    payload = {
        'user_id': user.id,
        'iat': timezone.now(),
        'exp': timezone.now() + settings.JWT_AUTH['JWT_REFRESH_EXPIRATION_DELTA'],
    }
    return jwt.encode(payload, settings.JWT_AUTH['JWT_SECRET_KEY'], algorithm=settings.JWT_AUTH['JWT_ALGORITHM'])
