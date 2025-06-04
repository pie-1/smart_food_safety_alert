from django.contrib import admin
from .models import Report, Symptom, Tag

admin.site.register(Report)
admin.site.register(Symptom)
admin.site.register(Tag)