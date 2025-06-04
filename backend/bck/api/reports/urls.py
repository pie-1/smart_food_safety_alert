from unittest.mock import patch
from rest_framework import routers

from .models import Report
from .import views
from django.urls import path, include
router = routers.DefaultRouter()
router.register(r'', views.ReportViewSet)
urlpatterns = [
    path('',include(router.urls))
]