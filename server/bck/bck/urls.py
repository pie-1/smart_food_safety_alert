
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
     # Include your app's URLs
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')),
    path("api/", include("api.urls")), # Include your app's URLs
]


urlpatterns += static(settings.MEDIA_URL,document_root= settings.MEDIA_ROOT)