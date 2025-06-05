from django.urls import path, include
from rest_framework.routers import DefaultRouter





# The API URLs are now determined automatically by the router.
urlpatterns = [
    path("reports/", include('api.reports.urls')),
    path("alerts/", include('api.alerts.urls')),
]

