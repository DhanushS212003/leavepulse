from core.models import BaseModel
from django.db import models
from rest_framework.exceptions import ValidationError
from core.utils import get_current_financial_year, calculate_leave_count
from leaves.models import LeaveType, LeaveBalance


class Organization(BaseModel):
    name = models.CharField(max_length=255, unique=True)
    leave_balance_generated_for = models.CharField(
        max_length=7,
        null=True,
        blank=True
    )
    is_active = models.BooleanField(default=True)

    def clean(self):
        if self.name.strip() == "":
            raise ValidationError("Name cannot be empty.")

        return True

    def generate_leave_balances(self):
        if self.has_leave_balance_generated_for_current_financial_year():
            raise Exception("Leaves balances has already been generated.")

        leave_types = self.leave_types.filter(
            is_active=True
        ).values_list("id", "days_per_year")

        employee_ids = self.employees.filter(
            is_active=True
        ).values_list("id", flat=True)

        financial_year = get_current_financial_year()

        for leave_type_id, days in leave_types:
            for employee_id in employee_ids:
                LeaveBalance.objects.create(
                    employee_id=employee_id,
                    leave_type_id=leave_type_id,
                    financial_year=financial_year,
                    allocated=calculate_leave_count(days)
                )

        self.leave_balance_generated_for = financial_year
        self.save()

    def has_leave_balance_generated_for_current_financial_year(self):
        return self.leave_balance_generated_for == get_current_financial_year()


class Employee(BaseModel):
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "code"],
                name="unique_employee_code_per_organizaiont"
            )
        ]

    class Role(models.IntegerChoices):
        HR = 1, "HR"
        MANAGER = 2, "Manager"
        EMPLOYEE = 3, "Employee"

    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="employee"
    )

    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="employees"
    )

    role = models.IntegerField(
        choices=Role.choices
    )

    manager = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="team_members"
    )

    code = models.CharField(max_length=20)
    joined_date = models.DateField()
    is_active = models.BooleanField(default=True)

    def clean(self):
        if not self.user:
            raise ValidationError("User must exist.")

        if self.role == self.Role.HR and self.manager:
            raise ValidationError("HR should not have a manager.")

        if self.role != self.Role.HR and not self.manager:
            raise ValidationError("Manager must exist.")

        if not self.joined_date:
            raise ValidationError("Joining date cannot be empty.")

        return True

    def generate_code(self):
        last_employee = self.organization.employees.order_by("-id").first()

        if last_employee:
            last_number = int(last_employee.code.replace("EMP", ""))
            next_number = last_number + 1
        else:
            next_number = 1

        self.code = f"EMP{next_number:03d}"

    def generate_leave_balances(self):
        if not self.organization.has_leave_balance_generated_for_current_financial_year():
            return

        leave_types = self.organization.leave_types.filter(
            is_active=True
        ).values_list("id", "days_per_year")
        financial_year = get_current_financial_year()

        for leave_type_id, days in leave_types:
            LeaveBalance.objects.create(
                employee_id=self.id,
                leave_type_id=leave_type_id,
                financial_year=financial_year,
                allocated=calculate_leave_count(days, self.joined_date)
            )
