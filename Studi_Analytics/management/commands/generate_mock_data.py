from django.core.management.base import BaseCommand
from django.utils import timezone
from Studi_Analytics.models import CustomUser, StudySession, Categories, StudySessionBreakdown
from faker import Faker
from datetime import timedelta, datetime, date
import random

fake = Faker()

class Command(BaseCommand):
    help = 'Generates mock data for testing'

    def handle(self, *args, **kwargs):
        # Clear existing data
        StudySessionBreakdown.objects.all().delete()
        StudySession.objects.all().delete()
        Categories.objects.all().delete()

        # Create test user if doesn't exist
        user, created = CustomUser.objects.get_or_create(
            username='testuser',
            defaults={'email': 'test@example.com'}
        )
        if created:
            user.set_password('testpass123')
            user.save()

        # Create categories
        categories = [
            'Mathematics',
            'Computer Science',
            'Physics',
            'Literature',
            'History',
            'Chemistry',
            'Biology'
        ]
        
        category_objects = []
        for cat in categories:
            category, _ = Categories.objects.get_or_create(
                user=user,
                name=cat
            )
            category_objects.append(category)

        # Set reference date (January 23, 2025)
        reference_date = date(2025, 1, 23)

        # Create study sessions over the last 30 days
        for day in range(30):
            # 1-3 study sessions per day
            for _ in range(random.randint(1, 3)):
                # Calculate the date for this session (going backwards from reference date)
                session_date = reference_date - timedelta(days=day)
                
                # Random hour between 8 AM and 8 PM (leaving room for duration)
                start_hour = random.randint(8, 20)
                start_minute = random.randint(0, 59)
                
                # Create start time
                start_time = timezone.make_aware(
                    datetime.combine(session_date, datetime.min.time().replace(hour=start_hour, minute=start_minute))
                )
                
                # Calculate maximum possible duration before midnight
                midnight = timezone.make_aware(
                    datetime.combine(session_date + timedelta(days=1), datetime.min.time())
                )
                max_duration = midnight - start_time
                
                # Duration between 30 and 180 minutes, but not exceeding time until midnight
                max_minutes = min(180, max_duration.seconds // 60)
                duration_minutes = random.randint(30, max_minutes)
                duration = timedelta(minutes=duration_minutes)
                
                # Calculate end time (guaranteed to be on same day)
                end_time = start_time + duration

                # Debug print
                self.stdout.write(f"Session: {start_time} - {end_time} | Duration: {duration}")

                session = StudySession.objects.create(
                    user=user,
                    start_time=start_time,
                    end_time=end_time,
                    total_duration=duration,
                    productivity_rating=random.choice(['Low', 'Medium', 'High'])
                )

                # Create breakdowns for the session
                current_time = start_time
                remaining_minutes = duration_minutes
                
                # Determine number of breakdowns based on session length
                max_breakdowns = min(4, remaining_minutes // 15)
                if max_breakdowns < 1:
                    max_breakdowns = 1
                num_breakdowns = random.randint(1, max_breakdowns)
                
                # Distribute time across breakdowns
                for i in range(num_breakdowns):
                    if i == num_breakdowns - 1:
                        breakdown_minutes = remaining_minutes
                    else:
                        min_remaining = 15 * (num_breakdowns - i - 1)
                        max_possible = remaining_minutes - min_remaining
                        breakdown_minutes = random.randint(15, max(16, max_possible))
                    
                    breakdown_duration = timedelta(minutes=breakdown_minutes)
                    
                    StudySessionBreakdown.objects.create(
                        study_session=session,
                        category=random.choice(category_objects),
                        start_time=current_time,
                        end_time=current_time + breakdown_duration,
                        duration=breakdown_duration
                    )

                    current_time += breakdown_duration
                    remaining_minutes -= breakdown_minutes

        self.stdout.write(self.style.SUCCESS('Successfully generated mock data')) 