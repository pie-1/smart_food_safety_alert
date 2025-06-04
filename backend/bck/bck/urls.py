
from django.contrib import admin
from django.urls import path , include
from django.conf.urls.static import static
from django.conf import settings
from django.http import HttpResponse
def home(request):
    return HttpResponse('Back End is setup')
urlpatterns = [
    path('',home),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api-auth/', include('rest_framework.urls')),

]

urlpatterns += static(settings.MEDIA_URL,document_root= settings.MEDIA_ROOT)