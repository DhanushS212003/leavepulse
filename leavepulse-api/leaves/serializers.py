import os
from rest_framework import serializers
from .models import LeaveType, Holiday, LeaveRequest


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = [
            "id",
            "name",
            "days_per_year",
            "requires_attachment",
            "is_active"
        ]


class ActiveLeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = [
            "id",
            "name",
            "requires_attachment",
        ]


class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = [
            "id",
            "name",
            "date"
        ]


class LeaveRequestSerializer(serializers.ModelSerializer):
    def get_days(self, obj):
        return (obj.end_date - obj.start_date).days + 1

    def get_employee_name(self, obj):
        return (f"{obj.employee.user.first_name} {obj.employee.user.last_name}")

    leave_type = serializers.CharField(source="leave_type.name")
    days = serializers.SerializerMethodField()
    status = serializers.CharField(source="get_status_display")
    employee_name = serializers.SerializerMethodField()
    employee_code = serializers.CharField(source="employee.code")
    applied_at = serializers.DateTimeField(
        format="%d %b %Y, %I:%M %p"
    )
    actioned_at = serializers.DateTimeField(
        format="%d %b %Y, %I:%M %p",
        allow_null=True
    )

    class Meta:
        model = LeaveRequest
        fields = [
            "id",
            "leave_type",
            "start_date",
            "end_date",
            "days",
            "status",
            "reason",
            "attachment",
            "employee_name",
            "employee_code",
            "remark",
            "applied_at",
            "actioned_at"
        ]
