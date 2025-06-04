from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Report, Symptom, Tag
from .serializers import ReportSerializer, SymptomSerializer, TagSerializer

class SymptomViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint that allows symptoms to be viewed."""
    queryset = Symptom.objects.all()
    serializer_class = SymptomSerializer
    permission_classes = [permissions.AllowAny] # Allow anyone to view symptoms

class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint that allows tags to be viewed."""
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.AllowAny] # Allow anyone to view tags

class ReportViewSet(viewsets.ModelViewSet):
    """API endpoint that allows reports to be viewed or edited."""
    serializer_class = ReportSerializer
    permission_classes = [permissions.AllowAny] # Allow anyone for now, adjust later if auth needed
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["tags", "symptoms"] # Allow filtering by tags and symptoms
    search_fields = ["location_details", "description", "tags__name", "symptoms__name"] # Allow searching
    ordering_fields = ["reported_datetime", "incident_datetime"]
    ordering = ["-reported_datetime"] # Default ordering

    def get_queryset(self):
        """Optionally restricts the returned reports to public ones, unless user is authenticated (future)."""
        # For now, show all non-private reports. Add user check later if needed.
        return Report.objects.filter(is_private=False).prefetch_related("symptoms", "tags").select_related("user")

    # Override perform_create if user association is needed based on request.user
    # def perform_create(self, serializer):
    #     if self.request.user.is_authenticated:
    #         serializer.save(user=self.request.user)
    #     else:
    #         serializer.save() # Allow anonymous reports

