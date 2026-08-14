from django.contrib.auth.models import AbstractUser
from django.db import models
from rest_framework.exceptions import ValidationError


class User(AbstractUser):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.first_name.strip() == "":
            raise ValidationError("First name cannot be empty.")

        if self.last_name.strip() == "":
            raise ValidationError("Last name cannot be empty.")

        if self.email.strip() == "":
            raise ValidationError("Email cannot be empty.")

        if self.username.strip() == "":
            raise ValidationError("User name cannot be empty.")

        if self.password.strip() == "":
            raise ValidationError("Password cannot be empty.")

        return True
