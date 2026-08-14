from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
from .permissions import IsHRForWriteEmployee, IsHRForWriteOrganization
from django.db import transaction
from .models import Employee, Organization
from .serializers import EmployeeSerializer, OrganizationSerializer
from accounts.models import User


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated, IsHRForWriteEmployee])
def employees_index_create(request):
    if request.method == "GET":
        employees = request.user.employee.organization.employees.order_by("id")
        serialized_employees = EmployeeSerializer(employees, many=True).data

        return Response(
            {"employees": serialized_employees},
            status=status.HTTP_200_OK
        )
    else:
        first_name = request.data.get("first_name").strip()
        last_name = request.data.get("last_name").strip()
        email = request.data.get("email").strip()
        role = request.data.get("role")
        manager_code = request.data.get("manager_code")
        password = request.data.get("password")
        joining_date = request.data.get("joining_date").strip()
        manager = None

        if role not in Employee.Role.values:
            return Response(
                {"message": "Invalid role."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if role != Employee.Role.HR:
            try:
                manager = request.user.employee.organization.employees.get(
                    code=manager_code
                )
            except Employee.DoesNotExist:
                return Response(
                    {"message": "Invalid Manager code"},
                    status=status.HTTP_404_NOT_FOUND,
                )

        user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            username=email
        )
        user.set_password(password)

        try:
            with transaction.atomic():
                user.full_clean()
                user.save()

                employee = Employee(
                    user=user,
                    organization=request.user.employee.organization,
                    role=role,
                    manager=manager,
                    joined_date=joining_date,
                )

                employee.generate_code()
                employee.full_clean()
                employee.save()

                employee.generate_leave_balances()
        except ValidationError as e:
            message = e.message_dict["__all__"][0]

            return Response(
                {"message": message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"message": "Employee has been created successfully."},
            status=status.HTTP_201_CREATED
        )


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated, IsHRForWriteEmployee])
def employees_show_update(request, id):
    try:
        employee = request.user.employee.organization.employees.get(
            id=id
        )
    except Employee.DoesNotExist:
        return Response(
            {"message": "Employee not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        if employee != request.user.employee:
            return Response(
                {"message": "You do not have permission to access this employee."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(
            {"employee": EmployeeSerializer(employee).data},
            status=status.HTTP_200_OK,
        )
    elif request.method == "PUT":
        first_name = request.data.get("first_name").strip()
        last_name = request.data.get("last_name").strip()
        email = request.data.get("email").strip()
        role = request.data.get("role")
        manager_code = request.data.get("manager_code")
        joining_date = request.data.get("joining_date").strip()
        manager = None

        if role not in Employee.Role.values:
            return Response(
                {"message": "Invalid role."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if role != Employee.Role.HR:
            try:
                manager = request.user.employee.organization.employees.get(
                    code=manager_code
                )
            except Employee.DoesNotExist:
                return Response(
                    {"message": "Invalid Manager code"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if manager.id == employee.id:
                return Response(
                    {"message": "Employee cannot be their own manager."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        employee.user.first_name = first_name
        employee.user.last_name = last_name
        employee.user.email = email
        employee.user.username = email

        employee.role = role
        employee.manager = manager
        employee.joined_date = joining_date
    else:
        is_active = request.data.get("is_active")

        employee.user.is_active = is_active
        employee.is_active = is_active

    try:
        with transaction.atomic():
            employee.user.full_clean()
            employee.user.save()

            employee.full_clean()
            employee.save()
    except ValidationError as e:
        message = e.message_dict["__all__"][0]

        return Response(
            {"message": message},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {"message": "Employee has been updated successfully."},
        status=status.HTTP_200_OK
    )


@api_view(["PATCH"])
def employees_profile_update(request, id):
    try:
        employee = request.user.employee.organization.employees.get(
            id=id
        )
    except Employee.DoesNotExist:
        return Response(
            {"message": "Employee not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if employee != request.user.employee:
        return Response(
            {"message": "You do not have permission to access this employee."},
            status=status.HTTP_403_FORBIDDEN,
        )

    first_name = request.data.get("first_name").strip()
    last_name = request.data.get("last_name").strip()

    employee.user.first_name = first_name
    employee.user.last_name = last_name

    try:
        employee.user.full_clean()
        employee.user.save()
    except ValidationError as e:
        message = e.message_dict["__all__"][0]

        return Response(
            {"message": message},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {"employee": EmployeeSerializer(employee).data},
        status=status.HTTP_200_OK,
    )


@api_view(["PATCH"])
def employees_password_update(request, id):
    try:
        employee = request.user.employee.organization.employees.get(
            id=id
        )
    except Employee.DoesNotExist:
        return Response(
            {"message": "Employee not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if employee != request.user.employee:
        return Response(
            {"message": "You do not have permission to access this employee."},
            status=status.HTTP_403_FORBIDDEN,
        )

    password = request.data.get("password")

    employee.user.set_password(password)

    try:
        employee.user.full_clean()
        employee.user.save()
    except ValidationError as e:
        message = e.message_dict["__all__"][0]

        return Response(
            {"message": message},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {"message": "Password has been changed successfully."},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def employees_leave_summary(request, id):
    try:
        employee = request.user.employee.organization.employees.get(
            id=id
        )
    except Employee.DoesNotExist:
        return Response(
            {"message": "Employee not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if employee != request.user.employee:
        return Response(
            {"message": "You do not have permission to access this employee's leave summary."},
            status=status.HTTP_403_FORBIDDEN,
        )

    summary = []
    balances = employee.leave_balances.all()

    for balance in balances:
        summary.append(
            {
                'leave': balance.leave_type.name,
                'available': balance.allocated - balance.used,
                'used': balance.used
            }
        )

    return Response(
        {"summary": summary},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def team_members(request):
    if request.user.employee.role == Employee.Role.EMPLOYEE:
        return Response(
            {"message": "You do not have permission to access team members."},
            status=status.HTTP_403_FORBIDDEN,
        )

    employees = request.user.employee.team_members.filter(
        is_active=True).order_by("id")
    serialized_employees = EmployeeSerializer(employees, many=True).data

    return Response(
        {"team_members": serialized_employees},
        status=status.HTTP_200_OK
    )


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated, IsHRForWriteOrganization])
def organizations_show_update(request, id):
    try:
        organization = Organization.objects.get(id=id)
    except Organization.DoesNotExist:
        return Response(
            {"message": "Organization not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if organization != request.user.employee.organization:
        return Response(
            {"message": "You do not have permission to access this Organization."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "GET":
        return Response(
            {"organization": OrganizationSerializer(organization).data},
            status=status.HTTP_200_OK,
        )
    else:
        name = request.data.get("name").strip()

        organization.name = name

    try:
        organization.full_clean()
        organization.save()
    except ValidationError as e:
        message = e.message_dict["__all__"][0]

        return Response(
            {"message": message},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {"organization": OrganizationSerializer(organization).data},
        status=status.HTTP_200_OK
    )


@api_view(["POST"])
def organizations_generate_leave_balances(request, id):
    try:
        organization = Organization.objects.get(id=id)
    except Organization.DoesNotExist:
        return Response(
            {"message": "Organization not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if organization != request.user.employee.organization:
        return Response(
            {"message": "You do not have permission to access this Organization."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.user.employee.role != Employee.Role.HR:
        return Response(
            {"message": "You do not have permission to generate leave balances."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        with transaction.atomic():
            organization.generate_leave_balances()
    except Exception as e:
        return Response(
            {"message": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {"message": "Leaves balances have been generated successfully."},
        status=status.HTTP_201_CREATED,
    )
