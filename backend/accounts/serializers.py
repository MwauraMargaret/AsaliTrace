from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=False)  # Optional for API compatibility
    is_superuser = serializers.BooleanField(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'is_superuser', 'is_staff', 'password', 'password2')
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'username': {'required': False},  # Will be generated from email if not provided
        }

    def validate(self, attrs):
        # If password2 is provided, validate match
        if 'password2' in attrs and attrs.get('password2'):
            if attrs['password'] != attrs['password2']:
                raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        # Use email as username if username not provided
        username = validated_data.get('username') or validated_data['email']
        
        # Remove password2 from validated_data
        validated_data.pop('password2', None)
        password = validated_data.pop('password')
        
        user = User.objects.create(
            username=username,
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        user.is_superuser = validated_data.get('is_superuser', False)
        user.is_staff = validated_data.get('is_staff', False)
        user.set_password(password)
        user.save()
        return user