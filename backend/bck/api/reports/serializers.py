from rest_framework import serializers
from .models import Report, Symptom, Tag
from django.contrib.auth.models import User

class SymptomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Symptom
        fields = ["id", "name"]

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"] # Only expose basic info

class ReportSerializer(serializers.ModelSerializer):
    symptoms = SymptomSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)
    # Allow writing symptom/tag IDs on creation/update
    symptom_ids = serializers.PrimaryKeyRelatedField(
        queryset=Symptom.objects.all(), source='symptoms', many=True, write_only=True, required=False
    )
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), source='tags', many=True, write_only=True, required=False
    )

    class Meta:
        model = Report
        fields = [
            "id", "user", "symptoms", "tags", "location_details", "description", 
            "incident_datetime", "reported_datetime", "is_private",
            "symptom_ids", "tag_ids" # Add write-only fields for IDs
        ]
        read_only_fields = ["reported_datetime", "user"]

    def create(self, validated_data):
        # Handle potential user assignment if authentication is implemented
        # request = self.context.get("request")
        # if request and hasattr(request, "user") and request.user.is_authenticated:
        #     validated_data['user'] = request.user
        # else:
        #     validated_data['user'] = None # Or handle anonymous submissions differently
        
        # Pop the write-only fields before creating the report instance
        symptoms_data = validated_data.pop('symptoms', None)
        tags_data = validated_data.pop('tags', None)

        report = Report.objects.create(**validated_data)

        # Set the many-to-many relationships after the instance is created
        if symptoms_data:
            report.symptoms.set(symptoms_data)
        if tags_data:
            report.tags.set(tags_data)
            
        return report

    def update(self, instance, validated_data):
        # Handle symptom and tag updates
        symptoms_data = validated_data.pop('symptoms', None)
        tags_data = validated_data.pop('tags', None)

        # Update other fields
        instance = super().update(instance, validated_data)

        # Update many-to-many relationships if data was provided
        if symptoms_data is not None:
            instance.symptoms.set(symptoms_data)
        if tags_data is not None:
            instance.tags.set(tags_data)

        return instance

