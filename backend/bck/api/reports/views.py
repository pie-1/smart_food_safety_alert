# api/reports/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Report
from .serializers import ReportSerializer
from .classifier import classify_severity  # ⬅️ Import classifier

class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all().order_by('-updated_at')
    serializer_class = ReportSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        text = data.get('text', '')

        try:
            severity = classify_severity(text)
        except Exception as e:
            print("Error classifying severity:", e)
            severity = 'medium'

        data['severity'] = severity  # Set severity automatically
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
