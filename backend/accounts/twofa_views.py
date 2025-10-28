from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_otp.plugins.otp_totp.models import TOTPDevice
from django.contrib.auth.models import User  # Fixed import
from rest_framework_simplejwt.tokens import RefreshToken
import qrcode
import qrcode.image.svg
from io import BytesIO
import base64

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def setup_2fa(request):
    """Generate QR code for 2FA setup"""
    user = request.user
    
    # Delete existing device
    TOTPDevice.objects.filter(user=user).delete()
    
    # Create new device
    device = TOTPDevice.objects.create(user=user, confirmed=False)
    
    # Generate QR code
    config_url = device.config_url
    factory = qrcode.image.svg.SvgImage
    img = qrcode.make(config_url, image_factory=factory)
    
    # Convert to base64
    buffer = BytesIO()
    img.save(buffer)
    qr_code = base64.b64encode(buffer.getvalue()).decode()
    
    return Response({
        'qr_code': f"data:image/svg+xml;base64,{qr_code}",
        'secret': device.bin_key.hex(),
        'config_url': config_url
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_2fa_setup(request):
    """Verify 2FA setup with token"""
    user = request.user
    token = request.data.get('token')
    
    try:
        device = TOTPDevice.objects.get(user=user, confirmed=False)
        if device.verify_token(token):
            device.confirmed = True
            device.save()
            return Response({'success': True, 'message': '2FA setup successful'})
        else:
            return Response({'success': False, 'message': 'Invalid token'}, status=400)
    except TOTPDevice.DoesNotExist:
        return Response({'success': False, 'message': 'No 2FA device found'}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disable_2fa(request):
    """Disable 2FA for user"""
    user = request.user
    TOTPDevice.objects.filter(user=user).delete()
    return Response({'success': True, 'message': '2FA disabled'})

@api_view(['POST'])
def verify_2fa_login(request):
    """Verify 2FA token during login"""
    from .serializers import UserSerializer  # Import here to avoid circular imports
    
    user_id = request.data.get('user_id')
    token = request.data.get('token')
    
    try:
        user = User.objects.get(id=user_id)
        device = TOTPDevice.objects.get(user=user, confirmed=True)
        if device.verify_token(token):
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
        else:
            return Response({'error': 'Invalid 2FA token'}, status=400)
    except (User.DoesNotExist, TOTPDevice.DoesNotExist):
        return Response({'error': 'Invalid request'}, status=400)