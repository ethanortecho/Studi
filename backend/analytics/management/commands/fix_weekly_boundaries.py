from django.core.management.base import BaseCommand
from django.core.management import call_command
from analytics.models import Aggregate

class Command(BaseCommand):
    help = (
        "Rebuild weekly aggregates using the updated Sunday→Saturday week boundaries. "
        "It deletes all existing weekly Aggregate rows then invokes the standard "
        "'aggregate_data' command to regenerate fresh data."
    )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Deleting existing weekly aggregates…"))
        deleted, _ = Aggregate.objects.filter(time_frame='weekly').delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {deleted} weekly aggregate rows."))

        # Re-run aggregation command (creates daily, weekly, monthly)
        self.stdout.write(self.style.WARNING("Rebuilding aggregates via 'aggregate_data' command…"))
        call_command('aggregate_data')
        self.stdout.write(self.style.SUCCESS("Weekly aggregates rebuilt successfully.")) 