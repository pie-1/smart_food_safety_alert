from rest_framework import serializers, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Subscription
from api.models import Report, Symptom, Tag
import math
from datetime import timedelta
from django.utils import timezone

class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ['username', 'email', 'phone', 'latitude', 'longitude']

class SymptomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Symptom
        fields = ['name']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['name']

class ReportSerializer(serializers.ModelSerializer):
    symptoms = SymptomSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Report
        fields = ['title', 'description', 'location', 'business_name', 'symptoms', 'tags']

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def parse_location(location):
    try:
        if location and ',' in location:
            lat, lon = map(float, location.split(','))
            if -90 <= lat <= 90 and -180 <= lon <= 180:
                return lat, lon
        return None, None
    except (ValueError, AttributeError, TypeError):
        return None, None

@api_view(['POST'])
def subscribe(request):
    serializer = SubscriptionSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Subscription successful'}, status=status.HTTP_201_CREATED)
    return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def nearby_reports(request):
    latitude = request.GET.get('latitude')
    longitude = request.GET.get('longitude')

    if latitude is None or longitude is None:
        return Response({'error': 'Latitude and longitude are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        latitude = float(latitude)
        longitude = float(longitude)
        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            return Response({'error': 'Latitude and longitude values are out of valid range'}, status=status.HTTP_400_BAD_REQUEST)
    except ValueError:
        return Response({'error': 'Latitude and longitude must be valid numbers'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        reports = Report.objects.filter(
            created_at__gte=timezone.now() - timedelta(hours=24)
        )
        nearby = []
        for report in reports:
            report_lat, report_lon = parse_location(report.location)
            if report_lat is not None and report_lon is not None:
                distance = haversine(latitude, longitude, report_lat, report_lon)
                if distance <= 5:
                    serialized_report = ReportSerializer(report).data
                    serialized_report['latitude'] = report_lat
                    serialized_report['longitude'] = report_lon
                    nearby.append(serialized_report)
        return Response(nearby)
    except Exception as e:
        return Response({'error': f'Server error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)