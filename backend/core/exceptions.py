import logging

from django.http import Http404

from rest_framework import serializers
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework.exceptions import APIException, MethodNotAllowed, NotAuthenticated, PermissionDenied

logger = logging.getLogger(__name__)


def custom_exception_handler(exception, context) -> Response | None:
    if not isinstance(
        exception, serializers.ValidationError | Http404 | PermissionDenied | NotAuthenticated | MethodNotAllowed
    ):
        logger.exception(
            'An exception occurred while handling request %s',
            context['request'].get_full_path(),
            exc_info=exception,
        )

    response = exception_handler(exception, context)
    if response is None:
        return None

    if isinstance(exception, APIException):
        return Response(
            data={
                'success': False,
                'error': exception.detail if isinstance(exception.detail, str) else exception.detail,
            },
            status=response.status_code,
        )

    return Response(data={'success': False, 'error': str(exception)}, status=response.status_code)
