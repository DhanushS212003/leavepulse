from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from datetime import date
from .permissions import IsHRForWriteLeaveTypes, IsHRForWriteHolidays
from .models import LeaveType, Holiday, LeaveRequest
from .serializers import LeaveTypeSerializer, ActiveLeaveTypeSerializer, HolidaySerializer, LeaveRequestSerializer
from employees.models import Employee


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated, IsHRForWriteLeaveTypes])
def leave_types_index_create(request):
    if request.method == "GET":
        leave_types = request.user.employee.organization.leave_types.order_by(
            "id")

        serialized_leave_types = LeaveTypeSerializer(
            leave_types, many=True
        ).data

        return Response(
            {"leave_types": serialized_leave_types},
            status=status.HTTP_200_OK
        )
    else:
        name = request.data.get("name").strip()
        days = request.data.get("days")
        attachment_required = request.data.get("attachment_required")

        try:
            leave_type = LeaveType(
                organization=request.user.employee.organization,
                name=name,
                days_per_year=days,
                requires_attachment=attachment_required,
            )

            with transaction.atomic():
                leave_type.full_clean()
                leave_type.save()

                leave_type.generate_leave_balances()
        except ValidationError as e:
            message = e.message_dict["__all__"][0]

            return Response(
                {"message": message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"leave_type": LeaveTypeSerializer(leave_type).data},
            status=status.HTTP_201_CREATED
        )


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated, IsHRForWriteLeaveTypes])
def leave_types_update(request, id):
    try:
        leave_type = request.user.employee.organization.leave_types.get(
            id=id
        )
    except LeaveType.DoesNotExist:
        return Response(
            {"message": "Leave type not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "PUT":
        name = request.data.get("name").strip()
        days = request.data.get("days")
        attachment_required = request.data.get("attachment_required")

        leave_type.name = name
        leave_type.days_per_year = days
        leave_type.requires_attachment = attachment_required
    else:
        is_active = request.data.get("is_active")

        leave_type.is_active = is_active

    try:
        leave_type.full_clean()
        leave_type.save()
    except ValidationError as e:
        message = e.message_dict["__all__"][0]

        return Response(
            {"message": message},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {"leave_type": LeaveTypeSerializer(leave_type).data},
        status=status.HTTP_200_OK
    )


@api_view(["GET"])
def active_leave_types(request):
    leave_types = request.user.employee.organization.leave_types.filter(
        is_active=True
    ).order_by("id")

    serialized_leave_types = ActiveLeaveTypeSerializer(
        leave_types, many=True
    ).data

    return Response(
        {"leave_types": serialized_leave_types},
        status=status.HTTP_200_OK
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated, IsHRForWriteHolidays])
def holidays_index_create(request):
    if request.method == "GET":
        if request.query_params.get("mode") == "upcoming":
            holidays = request.user.employee.organization.holidays.filter(
                date__gte=date.today()
            ).order_by("id")
        else:
            holidays = request.user.employee.organization.holidays.order_by(
                "id"
            )

        serialized_holidays = HolidaySerializer(
            holidays, many=True
        ).data

        return Response(
            {"holidays": serialized_holidays},
            status=status.HTTP_200_OK
        )
    else:
        name = request.data.get("name").strip()
        holiday_date = request.data.get("date")

        try:
            holiday = Holiday(
                organization=request.user.employee.organization,
                name=name,
                date=holiday_date
            )

            holiday.full_clean()
            holiday.save()
        except ValidationError as e:
            message = e.message_dict["__all__"][0]

            return Response(
                {"message": message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"holiday": HolidaySerializer(holiday).data},
            status=status.HTTP_201_CREATED
        )


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated, IsHRForWriteHolidays])
def holidays_update_delete(request, id):
    try:
        holiday = request.user.employee.organization.holidays.get(
            id=id
        )
    except Holiday.DoesNotExist:
        return Response(
            {"message": "Holiday not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "PUT":
        name = request.data.get("name").strip()
        date = request.data.get("date")

        holiday.name = name
        holiday.date = date

        try:
            holiday.full_clean()
            holiday.save()
        except ValidationError as e:
            message = e.message_dict["__all__"][0]

            return Response(
                {"message": message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"holiday": HolidaySerializer(holiday).data},
            status=status.HTTP_200_OK
        )
    else:
        try:
            holiday.delete()
        except ValidationError as e:
            message = e.message_dict["__all__"][0]

            return Response(
                {"message": message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"message": "Holiday has been deleted successfully."},
            status=status.HTTP_200_OK
        )


@api_view(["POST"])
def leave_requests_create(request):
    leave_type = request.data.get("leave_type")
    start_date = request.data.get("start_date")
    end_date = request.data.get("end_date")
    attachment = request.FILES.get("attachment")
    reason = request.data.get("reason")
    reason = reason.strip() if reason is not None else None

    try:
        leave_type = request.user.employee.organization.leave_types.filter(is_active=True).get(
            id=leave_type
        )
    except LeaveType.DoesNotExist:
        return Response(
            {"message": "Invalid Leave type"},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        leave_request = LeaveRequest(
            employee=request.user.employee,
            leave_type=leave_type,
            start_date=start_date,
            end_date=end_date,
            reason=reason,
        )

        is_hr = request.user.employee.role == Employee.Role.HR

        if is_hr:
            leave_request.status = LeaveRequest.Status.APPROVED

        if attachment:
            leave_request.attachment = attachment

        with transaction.atomic():
            leave_request.full_clean()
            leave_request.save()

            if is_hr:
                leave_request.update_leave_balances(
                    LeaveRequest.Status.PENDING
                )
    except ValidationError as e:
        message = e.message_dict["__all__"][0]

        return Response(
            {"message": message},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {"message": "Leave Request has been created successfully."},
        status=status.HTTP_201_CREATED
    )


@api_view(["PUT", "PATCH"])
def leave_requests_update(request, id):
    try:
        leave_request = request.user.employee.leave_requests.get(
            id=id
        )
    except LeaveRequest.DoesNotExist:
        return Response(
            {"message": "Leave Request not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "PUT":
        leave_type = request.data.get("leave_type")
        start_date = request.data.get("start_date")
        end_date = request.data.get("end_date")
        attachment = request.FILES.get("attachment")
        reason = request.data.get("reason")
        reason = reason.strip() if reason is not None else None

        try:
            leave_type = request.user.employee.organization.leave_types.filter(is_active=True).get(
                id=leave_type
            )
        except LeaveType.DoesNotExist:
            return Response(
                {"message": "Invalid Leave type"},
                status=status.HTTP_404_NOT_FOUND,
            )

        leave_request.leave_type = leave_type
        leave_request.start_date = start_date
        leave_request.end_date = end_date
        leave_request.reason = reason
        leave_request.applied_at = timezone.now()

        if leave_request.attachment:
            leave_request.attachment.delete(save=False)

        if attachment:
            leave_request.attachment = attachment

        try:
            leave_request.full_clean()
            leave_request.save()
        except ValidationError as e:
            message = e.message_dict["__all__"][0]

            return Response(
                {"message": message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"leave_request": LeaveRequestSerializer(leave_request).data},
            status=status.HTTP_200_OK
        )
    else:
        new_status = request.data.get("status")

        if new_status not in LeaveRequest.Status.names:
            return Response(
                {"message": "Invalid status."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from_status = leave_request.status
        leave_request.status = LeaveRequest.Status[new_status]

        try:
            leave_request.full_clean()

            with transaction.atomic():
                leave_request.save()
                leave_request.update_leave_balances(from_status)

        except ValidationError as e:
            message = e.message_dict["__all__"][0]

            return Response(
                {"message": message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"leave_request": LeaveRequestSerializer(leave_request).data},
            status=status.HTTP_200_OK
        )


@api_view(["GET"])
def my_leave_requests(request):
    requests = LeaveRequestSerializer(
        request.user.employee.leave_requests.all(), many=True
    ).data

    return Response(
        {"leave_requests": requests},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def team_leave_requests(request):
    if request.user.employee.role == Employee.Role.EMPLOYEE:
        return Response(
            {"message": "You do not have permission to access team leaves."},
            status=status.HTTP_403_FORBIDDEN,
        )

    team_members = request.user.employee.team_members.all()
    leave_requests = LeaveRequest.objects.filter(
        employee__in=team_members,
    ).exclude(status=LeaveRequest.Status.CANCELLED)

    requests = LeaveRequestSerializer(
        leave_requests, many=True
    ).data

    return Response(
        {"leave_requests": requests},
        status=status.HTTP_200_OK,
    )


@api_view(["PATCH"])
def team_leave_requests_update(request, id):
    try:
        leave_request = LeaveRequest.objects.get(id=id)
    except LeaveRequest.DoesNotExist:
        return Response(
            {"message": "LeaveRequest not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.user.employee != leave_request.employee.manager:
        return Response(
            {"message": "You do not have permission to access this request."},
            status=status.HTTP_403_FORBIDDEN,
        )

    new_status = request.data.get("status")
    remark = request.data.get("remark")
    remark = remark.strip() if remark is not None else None

    if new_status not in LeaveRequest.Status.names:
        return Response(
            {"message": "Invalid status."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    from_status = leave_request.status
    leave_request.status = LeaveRequest.Status[new_status]
    leave_request.remark = remark
    leave_request.actioned_at = timezone.now()

    try:
        leave_request.full_clean()

        with transaction.atomic():
            leave_request.save()
            leave_request.update_leave_balances(from_status)
    except ValidationError as e:
        message = e.messages[0]

        return Response(
            {"message": message},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {"leave_request": LeaveRequestSerializer(leave_request).data},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def calendar_events(request):
    my_requests = [
        {
            "type": "request",
            "leave_type": leave_request.leave_type.name,
            "start_date": leave_request.start_date,
            "end_date": leave_request.end_date
        }
        for leave_request in request.user.employee.leave_requests.all().exclude(
            status=LeaveRequest.Status.CANCELLED
        )
    ]

    if request.user.employee.role != Employee.Role.EMPLOYEE:
        team_requests = [
            {
                "type": "team_request",
                "leave_type": leave_request.leave_type.name,
                "start_date": leave_request.start_date,
                "end_date": leave_request.end_date,
                "employee_name": f"{leave_request.employee.user.first_name} {leave_request.employee.user.last_name}"
            }
            for leave_request in LeaveRequest.objects.filter(
                employee__in=request.user.employee.team_members.all(),
            ).exclude(status=LeaveRequest.Status.CANCELLED)
        ]

        holidays = [
            {
                "type": "holiday",
                "name": holiday.name,
                "date": holiday.date
            }
            for holiday in request.user.employee.organization.holidays.all()
        ]

    return Response(
        {
            "my_requests": my_requests,
            "team_requests": team_requests,
            "holidays": holidays
        },
        status=status.HTTP_200_OK,
    )
