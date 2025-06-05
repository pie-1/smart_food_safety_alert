from django.apps import AppConfig


class ReportsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api.reports'
    def ready(self):
        import api.reports.signals  # triggers the signal registration

