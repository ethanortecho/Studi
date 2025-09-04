from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from analytics.models import Categories, StudySession, CategoryBlock, Break, CustomUser
from datetime import datetime, timedelta
from django.utils import timezone
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Setup demo data with student-friendly categories and realistic study sessions'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Setting up demo data...'))
        
        # Clear existing data
        self.stdout.write('Clearing existing data...')
        StudySession.objects.all().delete()
        CategoryBlock.objects.all().delete() 
        Break.objects.all().delete()
        Categories.objects.all().delete()
        
        # Use the applereviewer account
        demo_user = CustomUser.objects.get(username='applereviewer')
        self.stdout.write(f'Using existing user: {demo_user.email}')
        
        # Create student-friendly categories
        categories_data = [
            {'name': 'Math', 'color': '#3B82F6'},
            {'name': 'English', 'color': '#10B981'},
            {'name': 'Science', 'color': '#8B5CF6'},
            {'name': 'History', 'color': '#F59E0B'},
            {'name': 'Art', 'color': '#EC4899'},
        ]
        
        categories = []
        for cat_data in categories_data:
            category = Categories.objects.create(
                user=demo_user,
                name=cat_data['name'],
                color=cat_data['color'],
                is_active=True,
                category_type='study',
                is_system=False
            )
            categories.append(category)
            self.stdout.write(f'Created category: {category.name}')
        
        # Create realistic study sessions over the past 2 weeks
        self.create_realistic_sessions(demo_user, categories)
        
        self.stdout.write(self.style.SUCCESS('Demo data setup complete!'))
        self.stdout.write(f'Demo user credentials: demo@student.com / demopassword123')

    def create_realistic_sessions(self, user, categories):
        """Create realistic study sessions for the past 2 weeks"""
        now = timezone.now()
        
        # Generate sessions for the past 14 days
        for days_ago in range(14, 0, -1):
            session_date = now - timedelta(days=days_ago)
            
            # Skip some days (weekend study is lighter)
            if session_date.weekday() in [5, 6] and random.random() < 0.4:  # 40% chance to skip weekends
                continue
                
            # Random number of sessions per day (2-4 for weekdays, 1-2 for weekends)
            if session_date.weekday() in [5, 6]:
                sessions_today = random.randint(1, 2)  # Lighter weekends
            else:
                sessions_today = random.randint(2, 4)  # More intensive weekdays
            
            for session_num in range(sessions_today):
                # Random start time during reasonable study hours
                hour = random.randint(14, 21)  # 2 PM to 9 PM
                minute = random.randint(0, 59)
                
                session_start = session_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                
                # Session duration: 30-120 minutes (realistic study sessions for ~1hr/day avg)
                duration_minutes = random.choices(
                    [30, 45, 60, 75, 90, 120], 
                    weights=[20, 30, 25, 15, 8, 2]  # Good mix favoring 45-60min sessions
                )[0]
                
                session_end = session_start + timedelta(minutes=duration_minutes)
                
                # Create study session
                session = StudySession.objects.create(
                    user=user,
                    start_time=session_start,
                    end_time=session_end,
                    status='completed',
                    focus_rating=random.randint(3, 5)  # Good ratings for demo
                )
                
                # Create category blocks for this session
                self.create_category_blocks(session, categories, duration_minutes)
                
                self.stdout.write(f'Created session: {session.start_time.strftime("%Y-%m-%d %H:%M")} - {duration_minutes}min')

    def create_category_blocks(self, session, categories, total_duration):
        """Create realistic category blocks within a session"""
        remaining_duration = total_duration
        current_time = session.start_time
        
        # Most sessions focus on 1-2 subjects
        num_subjects = random.choices([1, 2, 3], weights=[50, 35, 15])[0]
        selected_categories = random.sample(categories, num_subjects)
        
        for i, category in enumerate(selected_categories):
            if i == len(selected_categories) - 1:
                # Last category gets remaining time
                block_duration = remaining_duration
            else:
                # Random duration for this category (minimum 10 minutes)
                max_duration = min(remaining_duration - 10, remaining_duration // (len(selected_categories) - i))
                block_duration = random.randint(10, max(10, max_duration))
            
            block_end = current_time + timedelta(minutes=block_duration)
            
            CategoryBlock.objects.create(
                study_session=session,
                category=category,
                start_time=current_time,
                end_time=block_end,
                duration=block_duration
            )
            
            current_time = block_end
            remaining_duration -= block_duration
            
            # Add short breaks between categories (except last one)
            if i < len(selected_categories) - 1 and remaining_duration > 5:
                break_duration = random.randint(2, 5)
                break_end = current_time + timedelta(minutes=break_duration)
                
                Break.objects.create(
                    study_session=session,
                    start_time=current_time,
                    end_time=break_end,
                    duration=break_duration
                )
                
                current_time = break_end
                remaining_duration -= break_duration