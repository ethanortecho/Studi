from django.core.management.base import BaseCommand
from django.utils import timezone
from analytics.models import StudySession, CategoryBlock, CustomUser
from datetime import timedelta, date
from django.db.models import Count, Q

class Command(BaseCommand):
    help = 'Clean up duplicate study sessions created by infinite loop bug'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )
        parser.add_argument(
            '--user',
            type=str,
            default='ethanortecho',
            help='Username to clean up sessions for',
        )
        parser.add_argument(
            '--date',
            type=str,
            default=None,
            help='Date to clean up (YYYY-MM-DD format). Defaults to today.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        username = options['user']
        target_date = options['date']
        
        # Get the user
        try:
            user = CustomUser.objects.get(username=username)
        except CustomUser.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User {username} not found'))
            return

        # Parse date or use today
        if target_date:
            try:
                cleanup_date = timezone.datetime.strptime(target_date, '%Y-%m-%d').date()
            except ValueError:
                self.stdout.write(self.style.ERROR('Invalid date format. Use YYYY-MM-DD'))
                return
        else:
            cleanup_date = date.today()

        self.stdout.write(f"Analyzing sessions for user '{username}' on {cleanup_date}...")

        # Find problematic sessions (created with null duration or very short durations)
        problematic_sessions = StudySession.objects.filter(
            user=user,
            start_time__date=cleanup_date,
            status='active'  # Usually the duplicate ones are still 'active'
        ).filter(
            Q(total_duration__isnull=True) |  # Null duration (from infinite loop)
            Q(total_duration__lt=300)  # Or less than 5 minutes
        ).order_by('start_time')

        total_count = problematic_sessions.count()
        
        if total_count == 0:
            self.stdout.write(self.style.SUCCESS("No problematic sessions found!"))
            return

        self.stdout.write(f"Found {total_count} problematic sessions")
        
        # Show some examples
        self.stdout.write("\nFirst 10 sessions:")
        for session in problematic_sessions[:10]:
            duration = session.total_duration or 0
            self.stdout.write(f"  ID: {session.id} | Start: {session.start_time} | Duration: {duration}s | Status: {session.status}")
        
        if total_count > 10:
            self.stdout.write(f"  ... and {total_count - 10} more")

        # Also count related CategoryBlocks that will be deleted
        related_blocks = CategoryBlock.objects.filter(study_session__in=problematic_sessions)
        blocks_count = related_blocks.count()
        
        self.stdout.write(f"\nThis will also delete {blocks_count} related CategoryBlock records")

        if dry_run:
            self.stdout.write(self.style.WARNING("\n=== DRY RUN MODE ==="))
            self.stdout.write(f"Would delete {total_count} StudySession records")
            self.stdout.write(f"Would delete {blocks_count} CategoryBlock records")
            self.stdout.write("\nRun without --dry-run to actually delete these records")
            return

        # Confirm deletion
        self.stdout.write(self.style.WARNING(f"\nThis will permanently delete {total_count} sessions and {blocks_count} category blocks!"))
        confirm = input("Are you sure? Type 'DELETE' to confirm: ")
        
        if confirm != 'DELETE':
            self.stdout.write("Deletion cancelled.")
            return

        # Perform bulk deletion
        self.stdout.write("Deleting CategoryBlocks...")
        deleted_blocks, _ = related_blocks.delete()
        
        self.stdout.write("Deleting StudySessions...")
        deleted_sessions, _ = problematic_sessions.delete()
        
        self.stdout.write(self.style.SUCCESS(f"Successfully deleted:"))
        self.stdout.write(f"  - {deleted_sessions} StudySession records")
        self.stdout.write(f"  - {deleted_blocks} CategoryBlock records")
        
        # Show remaining sessions for the day
        remaining_sessions = StudySession.objects.filter(
            user=user,
            start_time__date=cleanup_date
        ).count()
        
        self.stdout.write(f"\nRemaining sessions for {cleanup_date}: {remaining_sessions}") 