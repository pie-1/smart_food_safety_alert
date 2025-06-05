from django.contrib import admin

from .models import Report ,Tag , Symptom

# Register your models here.
admin.site.register(Report)
admin.site.register(Tag)
admin.site.register(Symptom)