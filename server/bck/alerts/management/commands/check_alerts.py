from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from twilio.rest import Client
from django.conf import settings
from alerts.models import Subscription
from api.models import Report
from datetime import timedelta
from django.utils import timezone
import math

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
            return lat, lon
        return None, None
    except (ValueError, AttributeError):
        return None, None

class Command(BaseCommand):
    help = 'Check for nearby reports and send notifications'

    def handle(self, *args, **kwargs):
        subscriptions = Subscription.objects.all()
        recent_reports = Report.objects.filter(
            created_at__gte=timezone.now() - timedelta(hours=24)
        )

        for subscription in subscriptions:
            for report in recent_reports:
                report_lat, report_lon = parse_location(report.location)
                if report_lat is not None and report_lon is not None:
                    distance = haversine(
                        subscription.latitude, subscription.longitude,
                        report_lat, report_lon
                    )
                    if distance <= 5:
                        message = f"New food safety alert near your location: {report.title}\n{report.description}"
                        if subscription.email:
                            send_mail(
                                'Food Safety Alert',
                                message,
                                settings.EMAIL_HOST_USER,
                                [subscription.email],
                                fail_silently=True,
                            )
                        if subscription.phone:
                            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                            client.messages.create(
                                body=message,
                                from_=settings.TWILIO_PHONE_NUMBER,
                                to=subscription.phone
                            )