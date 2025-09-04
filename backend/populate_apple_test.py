import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studi.settings')
django.setup()

from analytics.models import CustomUser, Categories, StudySession, CategoryBlock
from datetime import datetime, timedelta
from django.utils import timezone
import random

# Get the apple reviewer user
user = CustomUser.objects.get(username='applereviewer')
print(f"Populating data for: {user.email}")

# Create clean categories (only 5 subjects)
categories_data = [
    {'name': 'Mathematics', 'color': '#3B82F6', 'type': 'study'},
    {'name': 'English', 'color': '#10B981', 'type': 'study'},
    {'name': 'Physics', 'color': '#8B5CF6', 'type': 'study'},
    {'name': 'History', 'color': '#F59E0B', 'type': 'study'},
    {'name': 'Computer Science', 'color': '#EC4899', 'type': 'study'},
    {'name': 'Break', 'color': '#6B7280', 'type': 'break'},
]

categories = {}
for cat_data in categories_data:
    category = Categories.objects.create(
        user=user,
        name=cat_data['name'],
        color=cat_data['color'],
        category_type=cat_data['type']
    )
    categories[cat_data['name']] = category
    print(f"Created category: {cat_data['name']}")

# Create realistic study sessions over the past 10 days
study_categories = [c for c in categories.values() if c.category_type == 'study']
break_category = categories['Break']

sessions_created = 0
for day_offset in range(10):
    date = timezone.now() - timedelta(days=day_offset)
    
    # 2-3 sessions per day
    sessions_per_day = random.choice([2, 3])
    
    for session_num in range(sessions_per_day):
        # Morning, afternoon, or evening session
        hour_options = [9, 14, 19] if sessions_per_day == 3 else [10, 19]
        hour = hour_options[min(session_num, len(hour_options)-1)]
        
        start_time = date.replace(hour=hour, minute=0, second=0, microsecond=0)
        
        # Session duration between 1-2 hours
        session_duration_minutes = random.randint(60, 120)
        
        # Create session
        session = StudySession.objects.create(
            user=user,
            start_time=start_time,
            end_time=start_time + timedelta(minutes=session_duration_minutes),
            status='completed',
            focus_rating=random.randint(3, 5)
        )
        
        # Add study blocks
        current_time = start_time
        block_count = 0
        
        while current_time < start_time + timedelta(minutes=session_duration_minutes - 10):
            # Study block 20-40 minutes
            block_duration = random.randint(20, 40)
            
            # Pick a random subject
            category = random.choice(study_categories)
            
            CategoryBlock.objects.create(
                study_session=session,
                category=category,
                start_time=current_time,
                end_time=current_time + timedelta(minutes=block_duration)
            )
            
            current_time += timedelta(minutes=block_duration)
            block_count += 1
            
            # Add break if not the last block
            if current_time < start_time + timedelta(minutes=session_duration_minutes - 15):
                break_duration = random.randint(5, 10)
                CategoryBlock.objects.create(
                    study_session=session,
                    category=break_category,
                    start_time=current_time,
                    end_time=current_time + timedelta(minutes=break_duration),
                    category_type='break'
                )
                current_time += timedelta(minutes=break_duration)
        
        sessions_created += 1
        print(f"Created session on {start_time.date()} with {block_count} study blocks")

print(f"\nTotal sessions created: {sessions_created}")
print("Data population complete!")