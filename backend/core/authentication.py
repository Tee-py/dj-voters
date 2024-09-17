import jwt

from django.conf import settings

from rest_framework.exceptions import AuthenticationFailed
from rest_framework.authentication import BaseAuthentication

from api.models import Admin


class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None

        try:
            token = auth_header.split()[1]
            payload = jwt.decode(
                jwt=token,
                key=settings.JWT_AUTH['JWT_SECRET_KEY'],
                algorithms=[settings.JWT_AUTH['JWT_ALGORITHM']],
            )
        except jwt.ExpiredSignatureError as e:
            msg = 'Token has expired'
            raise AuthenticationFailed(msg) from e
        except jwt.InvalidTokenError as e:
            msg = 'Invalid token'
            raise AuthenticationFailed(msg) from e

        try:
            user = Admin.objects.get(id=payload['user_id'])
        except Admin.DoesNotExist as e:
            msg = 'User not found'
            raise AuthenticationFailed(msg) from e

        return (user, token)
