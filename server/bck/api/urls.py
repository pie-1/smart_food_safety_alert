from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportViewSet, SymptomViewSet, TagViewSet

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r"reports", ReportViewSet, basename="report")
router.register(r"symptoms", SymptomViewSet, basename="symptom")
router.register(r"tags", TagViewSet, basename="tag")

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path("", include(router.urls)),
]
