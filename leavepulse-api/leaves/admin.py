from django.contrib import admin
from .models import LeaveType, LeaveBalance, Holiday, LeaveRequest

admin.site.register(LeaveType)
admin.site.register(LeaveBalance)
admin.site.register(Holiday)
admin.site.register(LeaveRequest)