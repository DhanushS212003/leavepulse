from rest_framework import serializers
from .models import Employee, Organization


class EmployeeSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")
    email = serializers.CharField(source="user.email")
    role = serializers.CharField(source="get_role_display")
    manager = serializers.CharField(source="manager.code", allow_null=True)

    class Meta:
        model = Employee
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "role",
            "code",
            "manager",
            "joined_date",
            "is_active"
        ]


class OrganizationSerializer(serializers.ModelSerializer):
    is_leave_balance_generated = serializers.BooleanField(
        source="has_leave_balance_generated_for_current_financial_year")

    class Meta:
        model = Organization
        fields = [
            "id",
            "name",
            "is_leave_balance_generated"
        ]
