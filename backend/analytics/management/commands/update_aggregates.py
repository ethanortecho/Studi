from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from analytics.services.split_aggregate_service import SplitAggregateUpdateService


class Command(BaseCommand):
    help = 'Update weekly and monthly aggregates'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            help='Date to update aggregates for (YYYY-MM-DD format). Defaults to yesterday.'
        )
        parser.add_argument(
            '--weekly-only',
            action='store_true',
            help='Only update weekly aggregates'
        )
        parser.add_argument(
            '--monthly-only',
            action='store_true',
            help='Only update monthly aggregates'
        )

    def handle(self, *args, **options):
        # Determine the date to update
        if options['date']:
            try:
                update_date = date.fromisoformat(options['date'])
            except ValueError:
                self.stderr.write(
                    self.style.ERROR(f"Invalid date format: {options['date']}. Use YYYY-MM-DD.")
                )
                return
        else:
            # Default to yesterday (since daily aggregates are created when sessions complete)
            update_date = timezone.now().date() - timedelta(days=1)

        self.stdout.write(f"Updating aggregates for date: {update_date}")

        # Update weekly aggregates
        if not options['monthly_only']:
            self.stdout.write("Updating weekly aggregates...")
            try:
                SplitAggregateUpdateService.update_weekly_aggregates_for_date(update_date)
                self.stdout.write(
                    self.style.SUCCESS("✅ Weekly aggregates updated successfully")
                )
            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(f"❌ Error updating weekly aggregates: {str(e)}")
                )

        # Update monthly aggregates
        if not options['weekly_only']:
            self.stdout.write("Updating monthly aggregates...")
            try:
                SplitAggregateUpdateService.update_monthly_aggregates_for_date(update_date)
                self.stdout.write(
                    self.style.SUCCESS("✅ Monthly aggregates updated successfully")
                )
            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(f"❌ Error updating monthly aggregates: {str(e)}")
                )

        self.stdout.write(
            self.style.SUCCESS(f"🎉 Aggregate update completed for {update_date}")
        )