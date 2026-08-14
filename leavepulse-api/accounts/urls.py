from django.urls import path
from .views import login, refresh, me, logout

urlpatterns = [
    path("login/", login),
    path("refresh/", refresh),
    path("me/", me),
    path("logout/", logout)
]
