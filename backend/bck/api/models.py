from django.db import models
from django.contrib.auth.models import User

class Symptom(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Report(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    symptoms = models.ManyToManyField(Symptom, blank=True)
    location_details = models.TextField(blank=True, null=True)
    description = models.TextField()
    incident_datetime = models.DateTimeField(null=True, blank=True)
    reported_datetime = models.DateTimeField(auto_now_add=True)
    is_private = models.BooleanField(default=False)
    # Add fields for image/video references later if needed
    # image_url = models.URLField(blank=True, null=True)
    # video_url = models.URLField(blank=True, null=True)
    tags = models.ManyToManyField(Tag, blank=True)

    def __str__(self):
        return f"Report {self.id} - {self.description[:50]}"

