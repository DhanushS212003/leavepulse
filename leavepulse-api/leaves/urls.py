from django.urls import path
from .views import leave_types_index_create, leave_types_update, holidays_index_create, holidays_update_delete, active_leave_types, leave_requests_create, leave_requests_update, my_leave_requests, team_leave_requests, team_leave_requests_update, calendar_events

urlpatterns = [
    path("leave_types/", leave_types_index_create),
    path("leave_types/<int:id>/", leave_types_update),
    path("active_leave_types/", active_leave_types),
    path("holidays/", holidays_index_create),
    path("holidays/<int:id>/", holidays_update_delete),
    path("leave_requests/", leave_requests_create),
    path("leave_requests/<int:id>/", leave_requests_update),
    path("my_leave_requests/", my_leave_requests),
    path("team_leave_requests/", team_leave_requests),
    path("team_leave_requests/<int:id>/", team_leave_requests_update),
    path("calendar_events/", calendar_events)
]
