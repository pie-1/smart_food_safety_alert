from django.db import models
from django.utils import timezone

class Report(models.Model):
    TYPE_CHOICES = [
        ('contamination', 'Contamination'),
        ('illness', 'Illness'),
        ('hygiene', 'Hygiene'),
        ('other', 'Other'),
    ]

    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    id = models.AutoField(primary_key=True)
    vendor = models.CharField(max_length=100)
    text = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='medium')
    image = models.ImageField(upload_to='reports/', null=True, blank=True)
    timestamp = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.vendor} - {self.type} ({self.severity})"

    class Meta:
        ordering = ['-timestamp']