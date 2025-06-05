from django.urls import path
from . import views

urlpatterns = [
    path('subscribe/', views.subscribe, name='subscribe'),
    path('nearby-reports/', views.nearby_reports, name='nearby_reports'),
]