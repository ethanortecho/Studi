from django.core.management.base import BaseCommand
from django.utils import timezone
from analytics.models import CustomUser, StudySession, Categories, CategoryBlock
from faker import Faker
from datetime import timedelta, datetime, date
import random

fake = Faker()

class Command(BaseCommand):
    help = 'Generates mock data for testing'

    def add_arguments(self, parser):
        """Add optional CLI arguments to specify a custom date range."""
        parser.add_argument(
            '--start-date',
            type=str,
            dest='start_date',
            help='Inclusive start date for data generation in YYYY-MM-DD format.'
        )
        parser.add_argument(
            '--end-date',
            type=str,
            dest='end_date',
            help='Inclusive end date for data generation in YYYY-MM-DD format.'
        )

    def handle(self, *args, **kwargs):
        # Clear existing data
        CategoryBlock.objects.all().delete()
        StudySession.objects.all().delete()
        Categories.objects.all().delete()

        # Create test user if doesn't exist
        user, created = CustomUser.objects.get_or_create(
            username='ethanortecho',
            defaults={'email': 'ethan@example.com'}
        )
        if created:
            user.set_password('EthanVer2010!')
            user.save()

        # Create categories (limited to 5) with frontend-matching colors
        categories = [
            'Mathematics',
            'Computer Science',
            'Physics',
            'Literature',
            'History'
        ]
        color_mapping = {
            'Mathematics': '#5A4FCF',      # Purple
            'Computer Science': '#4F9DDE', # Blue  
            'Physics': '#F3C44B',          # Yellow
            'Literature': '#F46D75',       # Coral
            'History': '#2EC4B6',          # Teal
        }
        
        category_objects = []
        for cat in categories:
            category, _ = Categories.objects.get_or_create(
                user=user,
                name=cat
            )
            category.color = color_mapping.get(cat, "#000000")
            category.save()
            category_objects.append(category)

        # Determine the date range for which to generate data
        start_date_str = kwargs.get('start_date')
        end_date_str = kwargs.get('end_date')

        if start_date_str and end_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            except ValueError:
                self.stderr.write(self.style.ERROR('Invalid date format. Use YYYY-MM-DD.'))
                return

            if start_date > end_date:
                self.stderr.write(self.style.ERROR('--start-date must be earlier than or equal to --end-date.'))
                return
        elif not start_date_str and not end_date_str:
            # Default behaviour ‒ last 30 days ending today
            end_date = date.today()
            start_date = end_date - timedelta(days=29)
        else:
            self.stderr.write(self.style.ERROR('You must provide either both --start-date and --end-date, or neither.'))
            return

        total_days = (end_date - start_date).days + 1  # inclusive

        # Create study sessions, iterating backwards from end_date
        for day in range(total_days):
            # 1-3 study sessions per day, with higher probability for recent days
            sessions_count = random.randint(1, 3)
            
            # Add some probability that older days have no sessions
            if total_days >= 30 and day > 20 and random.random() < 0.3:
                sessions_count = 0
            
            for _ in range(sessions_count):
                # Calculate the date for this session (going backwards from reference date)
                session_date = end_date - timedelta(days=day)
                
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
                    
                    CategoryBlock.objects.create(
                        study_session=session,
                        category=random.choice(category_objects),
                        start_time=current_time,
                        end_time=current_time + breakdown_duration,
                        duration=breakdown_duration
                    )

                    current_time += breakdown_duration
                    remaining_minutes -= breakdown_minutes

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully generated mock data from {start_date} to {end_date} '
                f'({total_days} day{"s" if total_days != 1 else ""}).'
            )
        ) 