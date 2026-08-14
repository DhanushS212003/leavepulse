from rest_framework.urls import path
from .views import employees_index_create, employees_show_update, organizations_show_update, employees_profile_update, employees_password_update, organizations_generate_leave_balances, employees_leave_summary, team_members

urlpatterns = [
    path("employees/", employees_index_create),
    path("employees/<int:id>/", employees_show_update),
    path("employees/<int:id>/profile_update/", employees_profile_update),
    path("employees/<int:id>/password_update/", employees_password_update),
    path("employees/<int:id>/leave_summary/", employees_leave_summary),
    path("team_members/", team_members),
    path("organizations/<int:id>/", organizations_show_update),
    path("organizations/<int:id>/generate_leave_balances/",
         organizations_generate_leave_balances)
]
