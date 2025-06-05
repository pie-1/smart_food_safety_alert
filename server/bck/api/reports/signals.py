from django.db.models.signals import post_save
from django.dispatch import receiver

from server.bck.bck.settings import EMAIL_HOST_USER
from ..alerts.models import Report
from api.alerts.models import Subscription  # adjust import as needed
from api.alerts.views import haversine, parse_location  # reuse your logic
from django.core.mail import send_mail  # or any other method

@receiver(post_save, sender=Report)
def send_alert_to_subscribers(sender, instance, created, **kwargs):
    if not created:
        return  # Only alert on new reports

    report_lat, report_lon = parse_location(instance.location)
    if report_lat is None or report_lon is None:
        return

    nearby_subscribers = []
    for sub in Subscription.objects.all():
        dist = haversine(report_lat, report_lon, sub.latitude, sub.longitude)
        if dist <= 5:  # or adjust radius
            nearby_subscribers.append(sub)

    for sub in nearby_subscribers:
        # Example: send email (use Celery for production!)
        send_mail(
            subject="🚨 Nearby Alert: " + instance.title,
            message=f"A food-related alert was reported near your area:\n\n{instance.description}",
            from_email=EMAIL_HOST_USER
            recipient_list=[sub.email],
            fail_silently=True,
        )
