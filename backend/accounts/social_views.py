from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import redirect
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
import requests
import json

@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """Handle Google OAuth2 authentication"""
    access_token = request.data.get('access_token')
    
    if not access_token:
        return Response({'error': 'Access token required'}, status=400)
    
    try:
        # Verify token with Google
        response = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            params={'access_token': access_token}
        )
        
        if response.status_code != 200:
            return Response({'error': 'Invalid access token'}, status=400)
        
        user_data = response.json()
        email = user_data.get('email')
        
        if not email:
            return Response({'error': 'Email not provided by Google'}, status=400)
        
        # Find or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': user_data.get('given_name', ''),
                'last_name': user_data.get('family_name', ''),
            }
        )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            },
            'is_new_user': created
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def github_auth(request):
    """Handle GitHub OAuth2 authentication"""
    access_token = request.data.get('access_token')
    
    if not access_token:
        return Response({'error': 'Access token required'}, status=400)
    
    try:
        # Get user data from GitHub
        headers = {'Authorization': f'token {access_token}'}
        user_response = requests.get('https://api.github.com/user', headers=headers)
        email_response = requests.get('https://api.github.com/user/emails', headers=headers)
        
        if user_response.status_code != 200:
            return Response({'error': 'Invalid access token'}, status=400)
        
        user_data = user_response.json()
        emails = email_response.json()
        
        # Find primary email
        primary_email = next((email['email'] for email in emails if email['primary']), None)
        email = primary_email or user_data.get('email')
        
        if not email:
            return Response({'error': 'Email not provided by GitHub'}, status=400)
        
        # Find or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': user_data.get('login', email),
                'first_name': user_data.get('name', '').split(' ')[0] if user_data.get('name') else '',
                'last_name': ' '.join(user_data.get('name', '').split(' ')[1:]) if user_data.get('name') else '',
            }
        )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            },
            'is_new_user': created
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def apple_auth(request):
    """Handle Apple Sign In authentication"""
    # Apple Sign In is more complex and requires additional setup
    # For now, we'll return a placeholder
    return Response({
        'error': 'Apple Sign In requires additional configuration. Please use Google or GitHub for now.'
    }, status=501)