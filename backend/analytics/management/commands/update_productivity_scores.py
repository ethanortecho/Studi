from django.core.management.base import BaseCommand
from analytics.models import DailyAggregate, CustomUser
from analytics.services.split_aggregate_service import SplitAggregateUpdateService
from datetime import date

class Command(BaseCommand):
    help = 'Update productivity scores for existing daily aggregates'

    def handle(self, *args, **options):
        self.stdout.write('Updating productivity scores for all daily aggregates...')
        
        # Get all daily aggregates
        aggregates = DailyAggregate.objects.all()
        updated_count = 0
        
        for aggregate in aggregates:
            self.stdout.write(f'Updating aggregate for {aggregate.user.username} on {aggregate.date}...')
            
            # Recalculate the aggregate data for this day
            SplitAggregateUpdateService._update_daily_aggregate(aggregate.user, aggregate.date)
            updated_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully updated {updated_count} aggregates'))
        
        # Verify update
        with_scores = DailyAggregate.objects.filter(productivity_score__isnull=False).count()
        self.stdout.write(f'Aggregates with productivity scores: {with_scores}')