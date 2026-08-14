from rest_framework.permissions import BasePermission
from employees.models import Employee


class IsHRForWriteLeaveTypes(BasePermission):
    message = "Only HR can view, add and update leave types."

    def has_permission(self, request, views):
        if request.method in ["GET", "POST", "PUT", "PATCH"]:
            return request.user.employee.role == Employee.Role.HR
        else:
            return False


class IsHRForWriteHolidays(BasePermission):
    message = "Only HR can view, add and update holidays."

    def has_permission(self, request, views):
        if request.method in ["POST", "PUT", "DELETE"]:
            return request.user.employee.role == Employee.Role.HR
        elif request.method == "GET":
            return True
        else:
            return False
