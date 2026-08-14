from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from employees.models import Employee


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    email = request.data.get("email").strip()
    password = request.data.get("password")

    user = authenticate(username=email, password=password)

    if user is None:
        return Response(
            {"message": "Invalid email or password"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    refresh = RefreshToken.for_user(user)

    response = Response({"access": str(refresh.access_token)})

    response.set_cookie(
        key="refresh_token",
        value=str(refresh),
        httponly=True,
        secure=False,
        samesite="Lax",
    )

    return response


@api_view(["POST"])
@permission_classes([AllowAny])
def refresh(request):
    refresh_token = request.COOKIES.get("refresh_token")

    if not refresh_token:
        return Response(
            {"message": "Refresh token not found."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    try:
        refresh = RefreshToken(refresh_token)
        access_token = str(refresh.access_token)

        return Response(
            {"access": access_token},
            status=status.HTTP_200_OK
        )
    except TokenError:
        return Response(
            {"message": "Invalid or expired refresh token."},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(["GET"])
def me(request):
    user = request.user
    is_hr = Employee.Role(user.employee.role).name == "HR"
    is_manager = Employee.Role(user.employee.role).name == "MANAGER"

    return Response(
        {
            "id": user.employee.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.employee.get_role_display(),
            "org_id": user.employee.organization_id,
            "access": {
                "manage_leave_types": is_hr,
                "manage_employees": is_hr,
                "manage_org": is_hr,
                "manage_team_leaves": is_hr or is_manager
            }
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def logout(request):
    response = Response(
        {"message": "Logged out successfully."},
        status=status.HTTP_200_OK,
    )

    response.delete_cookie("refresh_token")

    return response
