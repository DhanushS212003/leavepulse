from rest_framework.permissions import BasePermission
from .models import Employee


class IsHRForWriteEmployee(BasePermission):
    message = "Only HR can add or update employees."

    def has_permission(self, request, views):
        if request.method in ["POST", "PUT", "PATCH"]:
            return request.user.employee.role == Employee.Role.HR
        elif request.method == "GET":
            return True
        else:
            return False


class IsHRForWriteOrganization(BasePermission):
    message = "Only HR can view and update organization."

    def has_permission(self, request, views):
        if request.method in ["GET", "PATCH"]:
            return request.user.employee.role == Employee.Role.HR
        else:
            return False
