from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
from analytics.models import StudySession, CategoryBlock, Categories, CustomUser
from analytics.flow_score import calculate_flow_score


class Command(BaseCommand):
    help = 'Test flow score calculation with sample sessions'

    def handle(self, *args, **options):
        # Get or create a test user
        user, created = CustomUser.objects.get_or_create(
            username='test_flow_user',
            defaults={'timezone': 'America/New_York'}
        )
        
        # Get or create categories
        math_cat, _ = Categories.objects.get_or_create(
            user=user,
            name='Mathematics',
            defaults={'color': '#FF0000'}
        )
        
        physics_cat, _ = Categories.objects.get_or_create(
            user=user,
            name='Physics',
            defaults={'color': '#00FF00'}
        )
        
        break_cat, _ = Categories.objects.get_or_create(
            user=user,
            name='Break',
            defaults={'color': '#0000FF', 'category_type': 'break'}
        )
        
        # Create a test session
        now = timezone.now()
        start_time = now - timedelta(hours=2)
        end_time = now
        
        session = StudySession.objects.create(
            user=user,
            start_time=start_time,
            end_time=end_time,
            status='completed',
            focus_rating='4'  # Good focus
        )
        
        self.stdout.write(f"Created session {session.id} from {start_time} to {end_time}")
        
        # Create category blocks
        blocks_data = [
            # 45 minutes math
            (math_cat, start_time, start_time + timedelta(minutes=45)),
            # 15 minute break
            (break_cat, start_time + timedelta(minutes=45), start_time + timedelta(minutes=60)),
            # 35 minutes physics
            (physics_cat, start_time + timedelta(minutes=60), start_time + timedelta(minutes=95)),
            # 10 minute break
            (break_cat, start_time + timedelta(minutes=95), start_time + timedelta(minutes=105)),
            # 15 minutes math
            (math_cat, start_time + timedelta(minutes=105), start_time + timedelta(minutes=120)),
        ]
        
        for category, block_start, block_end in blocks_data:
            CategoryBlock.objects.create(
                study_session=session,
                category=category,
                start_time=block_start,
                end_time=block_end
            )
            duration_mins = (block_end - block_start).total_seconds() / 60
            self.stdout.write(f"  Created {category.name} block: {duration_mins:.0f} minutes")
        
        # Calculate flow score
        self.stdout.write("\nCalculating flow score...")
        flow_score = session.calculate_flow_score()
        
        # Display results
        self.stdout.write(self.style.SUCCESS(f"\nFlow Score: {flow_score}"))
        
        # Reload session to get the stored components
        session.refresh_from_db()
        
        if session.flow_components:
            self.stdout.write("\nComponent Breakdown:")
            self.stdout.write(f"  Focus: {session.flow_components['focus']:.2f}")
            self.stdout.write(f"  Duration: {session.flow_components['duration']:.2f}")
            self.stdout.write(f"  Breaks: {session.flow_components['breaks']:.2f}")
            self.stdout.write(f"  Deep Work: {session.flow_components['deep_work']:.2f}")
            self.stdout.write(f"  Time Multiplier: {session.flow_components['time_multiplier']:.2f}")
            
            if 'coaching_message' in session.flow_components:
                self.stdout.write(f"\nCoaching Message: {session.flow_components['coaching_message']}")
        
        # Test with different scenarios
        self.stdout.write("\n" + "="*50)
        self.stdout.write("Testing different scenarios...")
        
        # Scenario 2: Short session with poor focus
        session2 = StudySession.objects.create(
            user=user,
            start_time=now - timedelta(minutes=30),
            end_time=now,
            status='completed',
            focus_rating='2'
        )
        
        CategoryBlock.objects.create(
            study_session=session2,
            category=math_cat,
            start_time=session2.start_time,
            end_time=session2.end_time
        )
        
        flow_score2 = session2.calculate_flow_score()
        self.stdout.write(f"\nShort session (30 min, focus=2): Flow Score = {flow_score2}")
        
        # Scenario 3: Long session with excellent focus and good breaks
        session3 = StudySession.objects.create(
            user=user,
            start_time=now - timedelta(hours=3),
            end_time=now,
            status='completed',
            focus_rating='5'
        )
        
        # Create well-structured blocks
        s3_start = session3.start_time
        blocks = [
            (math_cat, s3_start, s3_start + timedelta(minutes=50)),
            (break_cat, s3_start + timedelta(minutes=50), s3_start + timedelta(minutes=60)),
            (math_cat, s3_start + timedelta(minutes=60), s3_start + timedelta(minutes=110)),
            (break_cat, s3_start + timedelta(minutes=110), s3_start + timedelta(minutes=125)),
            (math_cat, s3_start + timedelta(minutes=125), s3_start + timedelta(minutes=180)),
        ]
        
        for cat, b_start, b_end in blocks:
            CategoryBlock.objects.create(
                study_session=session3,
                category=cat,
                start_time=b_start,
                end_time=b_end
            )
        
        flow_score3 = session3.calculate_flow_score()
        self.stdout.write(f"Long session (3 hours, focus=5, good breaks): Flow Score = {flow_score3}")
        
        # Clean up test sessions
        if input("\nDelete test sessions? (y/n): ").lower() == 'y':
            StudySession.objects.filter(user=user).delete()
            self.stdout.write(self.style.SUCCESS("Test sessions deleted."))
        else:
            self.stdout.write("Test sessions kept for inspection.")