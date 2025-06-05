from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import subscribe , nearby_reports , SubscriptionViewSet

router = DefaultRouter()
router.register(r"subscription", SubscriptionViewSet, basename="subscription")


urlpatterns = [
    path('subscribe/', subscribe, name='subscribe'),
    path('nearby-reports/', nearby_reports, name='nearby_reports'),
]