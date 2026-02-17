from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer
from django.contrib.auth.models import User

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response(
            {'error': 'Email and password are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Authenticate user - Django User model uses username, but we allow email login
    # Try email first, then username
    user = authenticate(username=email, password=password)
    
    # If email login fails, try to find user by email and authenticate with username
    if user is None:
        try:
            user_obj = User.objects.get(email=email)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            user = None
    
    if user is not None:
        # Check if user has 2FA enabled
        try:
            from django_otp.plugins.otp_totp.models import TOTPDevice
            has_2fa = TOTPDevice.objects.filter(user=user, confirmed=True).exists()
        except:
            has_2fa = False
        
        if has_2fa:
            # Return user ID for 2FA verification step
            return Response({
                'requires_2fa': True,
                'user_id': user.id,
                'message': '2FA verification required'
            })
        else:
            # No 2FA - return tokens directly
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
                'requires_2fa': False
            })
    else:
        return Response(
            {'error': 'Invalid credentials'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    # Handle both frontend format (email, password, first_name, last_name)
    # and traditional format (username, password, password2)
    data = request.data.copy()
    
    # If username not provided, use email as username
    if 'username' not in data and 'email' in data:
        data['username'] = data['email']
    
    # If password2 not provided, set it to password (for validation)
    if 'password2' not in data and 'password' in data:
        data['password2'] = data['password']
    
    serializer = UserSerializer(data=data)
    
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request):
    return Response(UserSerializer(request.user).data)
