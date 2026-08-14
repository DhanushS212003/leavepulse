from core.models import BaseModel
from django.db import models
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from core.utils import get_current_financial_year, calculate_leave_count


class LeaveType(BaseModel):
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "name"],
                name="unique_leave_type_name_per_organization"
            )
        ]

    organization = models.ForeignKey(
        "employees.Organization",
        on_delete=models.PROTECT,
        related_name="leave_types"
    )

    name = models.CharField(max_length=255)
    days_per_year = models.PositiveSmallIntegerField()
    requires_attachment = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    def clean(self):
        if self.name.strip() == "":
            raise ValidationError("Name cannot be empty.")

        if self.days_per_year <= 0:
            raise ValidationError("Days per year must be greater than 0.")

        return True

    def generate_leave_balances(self):
        employee_ids = self.organization.employees.filter(
            is_active=True
        ).values_list("id", flat=True)
        financial_year = get_current_financial_year()

        for employee_id in employee_ids:
            LeaveBalance.objects.create(
                employee_id=employee_id,
                leave_type_id=self.id,
                financial_year=financial_year,
                allocated=calculate_leave_count(self.days_per_year)
            )


class LeaveRequest(BaseModel):
    class Status(models.IntegerChoices):
        PENDING = 1, "Pending"
        APPROVED = 2, "Approved"
        REJECTED = 3, "Rejected"
        CANCELLED = 4, "Cancelled"

    employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.PROTECT,
        related_name="leave_requests"
    )

    leave_type = models.ForeignKey(
        LeaveType,
        on_delete=models.PROTECT,
    )

    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(null=True, blank=True)

    attachment = models.FileField(
        upload_to="leave_attachments/",
        validators=[
            FileExtensionValidator(
                allowed_extensions=["pdf", "jpg", "png"]
            )
        ],
        null=True,
        blank=True
    )

    status = models.IntegerField(
        choices=Status.choices,
        default=Status.PENDING
    )

    applied_at = models.DateTimeField(default=timezone.now)
    actioned_at = models.DateTimeField(null=True, blank=True)
    remark = models.TextField(null=True, blank=True)

    def clean(self):
        if not self.leave_type:
            raise ValidationError("Leave Type must exist.")

        if not self.start_date:
            raise ValidationError("Start Date cannot be empty.")

        if not self.end_date:
            raise ValidationError("End Date cannot be empty.")

        if self.end_date < self.start_date:
            raise ValidationError("End Date cannot be before Start Date.")

        if self.leave_type.requires_attachment and not self.attachment:
            raise ValidationError(
                f"Attachment required for {self.leave_type.name} leave.")

    def update_leave_balances(self, from_status):
        if self.status == from_status:
            return

        try:
            leave_balance = self.employee.leave_balances.get(
                leave_type=self.leave_type,
                financial_year=get_current_financial_year(),
            )
        except LeaveBalance.DoesNotExist:
            raise ValidationError(
                "Leave balance does not exist for the current financial year."
            )

        leave_days = (self.end_date - self.start_date).days + 1

        if self.status == LeaveRequest.Status.APPROVED:
            new_used = leave_balance.used + leave_days

            if new_used > leave_balance.allocated:
                exceeding_days = new_used - leave_balance.allocated

                raise ValidationError(
                    f"Request has exceeding the leave limit by {exceeding_days} day(s)."
                )

            leave_balance.used = new_used
            leave_balance.save()
        elif self.status == LeaveRequest.Status.CANCELLED and from_status == LeaveRequest.Status.APPROVED:
            leave_balance.used -= leave_days
            leave_balance.save()


class LeaveBalance(BaseModel):
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["employee", "leave_type", "financial_year"],
                name="unique_employee_leave_balance"
            )
        ]

    employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.PROTECT,
        related_name="leave_balances"
    )

    leave_type = models.ForeignKey(
        LeaveType,
        on_delete=models.PROTECT,
    )

    financial_year = models.CharField(max_length=7)
    allocated = models.PositiveSmallIntegerField()
    used = models.PositiveSmallIntegerField(default=0)


class Holiday(BaseModel):
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "date"],
                name="unique_holiday_date_per_organization"
            )
        ]

    organization = models.ForeignKey(
        "employees.Organization",
        on_delete=models.PROTECT,
        related_name="holidays"
    )

    name = models.CharField(max_length=255)
    date = models.DateField()

    def clean(self):
        if self.name.strip() == "":
            raise ValidationError("Name cannot be empty.")

        if not self.date:
            raise ValidationError("Date cannot be empty.")
