from rest_framework import serializers
from .models import Report, Symptom, Tag

class SymptomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Symptom
        fields = ["id", "name"]

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]

class ReportSerializer(serializers.ModelSerializer):
    # Write fields: expect lists of IDs for ManyToMany
    symptoms = serializers.PrimaryKeyRelatedField(
        queryset=Symptom.objects.all(),
        many=True,
        required=False
    )
    tags = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        required=False
    )

    # Read-only nested serializers to display full info
    symptoms_read = SymptomSerializer(source="symptoms", many=True, read_only=True)
    tags_read = TagSerializer(source="tags", many=True, read_only=True)
    image = serializers.ImageField(max_length=None,allow_empty_file=False,allow_null=True,required=False)
    class Meta:
        model = Report
        fields = [
            "id",
            "title",
            "image",
            "description",
            "location",
            "business_name",
            "symptoms",       # write field (expects IDs)
            "tags",           # write field (expects IDs)
            "symptoms_read",  # read-only nested data
            "tags_read",      # read-only nested data
            "created_at",
            "updated_at"
        ]
        read_only_fields = ["created_at", "updated_at", "symptoms_read", "tags_read"]

    def create(self, validated_data):
        symptoms_data = validated_data.pop("symptoms", [])
        tags_data = validated_data.pop("tags", [])
        report = Report.objects.create(**validated_data)
        if symptoms_data:
            report.symptoms.set(symptoms_data)
        if tags_data:
            report.tags.set(tags_data)
        return report

    def update(self, instance, validated_data):
        symptoms_data = validated_data.pop("symptoms", None)
        tags_data = validated_data.pop("tags", None)

        # Update regular fields
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get("description", instance.description)
        instance.location = validated_data.get("location", instance.location)
        instance.business_name = validated_data.get("business_name", instance.business_name)
        instance.save()

        # Update ManyToMany fields if provided
        if symptoms_data is not None:
            instance.symptoms.set(symptoms_data)
        if tags_data is not None:
            instance.tags.set(tags_data)

        return instance
