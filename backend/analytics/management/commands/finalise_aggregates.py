from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from analytics.models import Aggregate
from analytics.services.date_utils import is_current_period


class Command(BaseCommand):
    help = "Mark completed periods (daily / weekly / monthly) as is_final=True."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show how many aggregates would be finalised without modifying them.",
        )
        parser.add_argument(
            "--timeframes",
            nargs="*",
            choices=["daily", "weekly", "monthly"],
            default=["daily", "weekly", "monthly"],
            help="Limit to specific timeframes (default: all).",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        timeframes = options["timeframes"]

        today = timezone.now().date()
        total_updated = 0

        for timeframe in timeframes:
            queryset = Aggregate.objects.filter(time_frame=timeframe, is_final=False)
            to_update = []

            for agg in queryset.iterator():
                if not is_current_period(agg.start_date, timeframe):
                    to_update.append(agg.id)

            if dry_run:
                self.stdout.write(
                    self.style.WARNING(
                        f"[{timeframe}] Would finalise {len(to_update)} aggregates"
                    )
                )
            else:
                updated = (
                    Aggregate.objects.filter(id__in=to_update).update(is_final=True)
                )
                total_updated += updated
                self.stdout.write(
                    self.style.SUCCESS(f"[{timeframe}] Finalised {updated} aggregates")
                )

        if dry_run:
            self.stdout.write(self.style.SUCCESS("Dry run complete."))
        else:
            self.stdout.write(
                self.style.SUCCESS(f"Done. Total aggregates finalised: {total_updated}")
            ) 