from django.core.management.base import BaseCommand
from django.utils import timezone
from analytics.models import StudySession, CategoryBlock, CustomUser
from datetime import timedelta, date
from django.db.models import Count, Q

class Command(BaseCommand):
    help = 'Clean up problematic category blocks (null duration, orphaned, etc.)'

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
            help='Username to clean up category blocks for',
        )
        parser.add_argument(
            '--orphaned',
            action='store_true',
            help='Only clean orphaned blocks (linked to cancelled/deleted sessions)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        username = options['user']
        orphaned_only = options['orphaned']
        
        # Get the user
        try:
            user = CustomUser.objects.get(username=username)
        except CustomUser.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User {username} not found'))
            return

        self.stdout.write(f"Analyzing CategoryBlocks for user '{username}'...")

        # Find different types of problematic blocks
        total_blocks = CategoryBlock.objects.filter(study_session__user=user).count()
        self.stdout.write(f"Total CategoryBlocks: {total_blocks}")

        if orphaned_only:
            # Only find blocks linked to cancelled sessions (these are safe to delete)
            problematic_blocks = CategoryBlock.objects.filter(
                study_session__user=user,
                study_session__status='cancelled'
            )
            description = "orphaned (linked to cancelled sessions)"
        else:
            # Find blocks with problematic characteristics
            problematic_blocks = CategoryBlock.objects.filter(
                study_session__user=user
            ).filter(
                Q(duration__isnull=True) |  # Null duration
                Q(end_time__isnull=True) |  # No end time
                Q(study_session__status='cancelled')  # Linked to cancelled sessions
            )
            description = "problematic (null duration, no end time, or cancelled sessions)"

        problematic_count = problematic_blocks.count()
        
        if problematic_count == 0:
            self.stdout.write(self.style.SUCCESS(f"No {description} CategoryBlocks found!"))
            return

        self.stdout.write(f"Found {problematic_count} {description} CategoryBlocks")
        
        # Show some examples
        self.stdout.write(f"\nFirst 10 CategoryBlocks:")
        for block in problematic_blocks[:10]:
            duration = block.duration or 0
            end_time = block.end_time.strftime('%H:%M:%S') if block.end_time else 'None'
            session_status = block.study_session.status
            self.stdout.write(f"  ID: {block.id} | Duration: {duration}s | End: {end_time} | Session Status: {session_status}")
        
        if problematic_count > 10:
            self.stdout.write(f"  ... and {problematic_count - 10} more")

        # Show breakdown by issue type
        null_duration = CategoryBlock.objects.filter(
            study_session__user=user, duration__isnull=True
        ).count()
        null_end_time = CategoryBlock.objects.filter(
            study_session__user=user, end_time__isnull=True
        ).count()
        cancelled_session = CategoryBlock.objects.filter(
            study_session__user=user, study_session__status='cancelled'
        ).count()

        self.stdout.write(f"\nBreakdown:")
        self.stdout.write(f"  - Null duration: {null_duration}")
        self.stdout.write(f"  - Null end time: {null_end_time}")
        self.stdout.write(f"  - Linked to cancelled sessions: {cancelled_session}")

        if dry_run:
            self.stdout.write(self.style.WARNING("\n=== DRY RUN MODE ==="))
            self.stdout.write(f"Would delete {problematic_count} CategoryBlock records")
            self.stdout.write("\nRun without --dry-run to actually delete these records")
            return

        # Confirm deletion
        self.stdout.write(self.style.WARNING(f"\nThis will permanently delete {problematic_count} CategoryBlock records!"))
        confirm = input("Are you sure? Type 'DELETE' to confirm: ")
        
        if confirm != 'DELETE':
            self.stdout.write("Deletion cancelled.")
            return

        # Perform bulk deletion
        self.stdout.write("Deleting CategoryBlocks...")
        deleted_count, _ = problematic_blocks.delete()
        
        self.stdout.write(self.style.SUCCESS(f"Successfully deleted {deleted_count} CategoryBlock records"))
        
        # Show remaining count
        remaining_blocks = CategoryBlock.objects.filter(study_session__user=user).count()
        self.stdout.write(f"Remaining CategoryBlocks: {remaining_blocks}") 