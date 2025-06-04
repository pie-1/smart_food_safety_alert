from rest_framework import serializers
from .models import Report

class ReportSerializer(serializers.HyperlinkedModelSerializer):
    image = serializers.ImageField(max_length=None, allow_empty_file=False, allow_null=True, required=False)
    severity = serializers.CharField(read_only=True)

    class Meta:
        model = Report
        fields = ['id', 'vendor', 'text', 'type', 'severity', 'image', 'timestamp', 'created_at', 'updated_at']