from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import Report, Symptom, Tag
from .serializers import ReportSerializer, SymptomSerializer, TagSerializer

class SymptomViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing Symptoms.
    ReadOnly since symptoms likely don't change often.
    """
    queryset = Symptom.objects.all()
    serializer_class = SymptomSerializer
    permission_classes = [permissions.AllowAny]  # Allow anyone to view symptoms
    pagination_class = None  # No pagination for symptoms list

class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing Tags.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.AllowAny]  # Allow anyone to view tags
    pagination_class = None  # No pagination for tags list

class ReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for creating, listing, retrieving, updating, and deleting Reports.
    """
    queryset = Report.objects.all().order_by("-created_at")  # Show newest first
    serializer_class = ReportSerializer
    permission_classes = [permissions.AllowAny]  # Allow anyone to create/view reports for now
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["tags", "symptoms", "location", "business_name"]  # Allow filtering on these fields

    # If you want to customize create/update behavior, you can override:
    # def perform_create(self, serializer):
    #     serializer.save()

    # def perform_update(self, serializer):
    #     serializer.save()
