from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class BackupCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="backup_codes")
    code_hash = models.CharField(max_length=128)
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"BackupCode(user={self.user.email}, used={self.used})"
