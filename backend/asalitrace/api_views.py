"""
API root and public endpoints for discovery.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """
    API root endpoint - public access for API discovery.
    Note: This endpoint is public, but most data endpoints require authentication.
    """
    return Response({
        'message': 'Welcome to AsaliTrace API',
        'version': '1.0',
        'endpoints': {
            'batches': '/api/batches/',
            'lab_tests': '/api/labtests/',
            'certificates': '/api/certificates/',
            'statistics': '/api/batches/statistics/',
            'authentication': '/api/auth/',
            'admin': '/admin/',
        },
        'authentication': {
            'type': 'Bearer Token (JWT)',
            'login': '/api/auth/login/',
            'register': '/api/auth/register/',
            'note': 'Most endpoints require authentication. Include Bearer token in Authorization header.',
        },
        'public_endpoints': [
            '/api/',
            '/api/batches/statistics/',
        ],
        'note': 'To access protected endpoints, you must: 1) Login at /api/auth/login/, 2) Get access_token, 3) Include "Authorization: Bearer <token>" header in requests.',
    })
