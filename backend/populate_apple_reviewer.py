"""
Script to populate Apple reviewer test account with realistic study data
"""
import os
import sys
import django
from datetime import datetime, timedelta
from django.utils import timezone
import random

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studi.settings')
django.setup()

from analytics.models import CustomUser, Categories, StudySession, CategoryBlock, Break
from analytics.services.split_aggregate_service import SplitAggregateUpdateService

def create_study_data():
    # Get the test user
    user = CustomUser.objects.get(username='applereviewer')
    print(f"Populating data for user: {user.username}")
    
    # Create categories
    categories_data = [
        {'name': 'Mathematics', 'color': '#3B82F6', 'category_type': 'study'},
        {'name': 'Literature', 'color': '#10B981', 'category_type': 'study'},
        {'name': 'Physics', 'color': '#8B5CF6', 'category_type': 'study'},
        {'name': 'Computer Science', 'color': '#F59E0B', 'category_type': 'study'},
        {'name': 'History', 'color': '#EC4899', 'category_type': 'study'},
        {'name': 'Break', 'color': '#6B7280', 'category_type': 'break'},
    ]
    
    categories = {}
    for cat_data in categories_data:
        category, created = Categories.objects.get_or_create(
            user=user,
            name=cat_data['name'],
            defaults={'color': cat_data['color'], 'category_type': cat_data['category_type']}
        )
        categories[category.name] = category
        if created:
            print(f"Created category: {category.name}")
    
    # Create sessions for the past 10 days
    now = timezone.now()
    study_categories = [c for name, c in categories.items() if c.category_type != 'break']
    
    for days_ago in range(10):
        date = now - timedelta(days=days_ago)
        
        # 2-3 sessions per day
        num_sessions = random.randint(2, 3)
        
        for session_num in range(num_sessions):
            # Morning, afternoon, or evening session
            if session_num == 0:
                hour = random.randint(9, 11)  # Morning
            elif session_num == 1:
                hour = random.randint(14, 16)  # Afternoon
            else:
                hour = random.randint(19, 21)  # Evening
            
            start_time = date.replace(hour=hour, minute=random.randint(0, 30), second=0, microsecond=0)
            
            # Session duration: 45-120 minutes
            session_duration = random.randint(45, 120)
            end_time = start_time + timedelta(minutes=session_duration)
            
            # Create session
            session = StudySession.objects.create(
                user=user,
                start_time=start_time,
                end_time=end_time,
                total_duration=session_duration * 60,  # Convert to seconds
                is_completed=True
            )
            
            # Add category blocks
            current_time = start_time
            blocks_created = 0
            
            while current_time < end_time - timedelta(minutes=10):
                # Block duration: 15-45 minutes
                block_duration = min(
                    random.randint(15, 45),
                    int((end_time - current_time).total_seconds() / 60)
                )
                
                if block_duration < 5:
                    break
                
                # Choose a random category
                category = random.choice(study_categories)
                
                block_end = current_time + timedelta(minutes=block_duration)
                
                CategoryBlock.objects.create(
                    session=session,
                    category=category,
                    start_time=current_time,
                    end_time=block_end,
                    duration=block_duration * 60  # Convert to seconds
                )
                blocks_created += 1
                
                current_time = block_end
                
                # Maybe add a break (30% chance)
                if random.random() < 0.3 and current_time < end_time - timedelta(minutes=15):
                    break_duration = random.randint(5, 15)
                    break_end = current_time + timedelta(minutes=break_duration)
                    
                    Break.objects.create(
                        session=session,
                        start_time=current_time,
                        end_time=break_end,
                        duration=break_duration * 60  # Convert to seconds
                    )
                    
                    # Also create a break category block
                    CategoryBlock.objects.create(
                        session=session,
                        category=categories['Break'],
                        start_time=current_time,
                        end_time=break_end,
                        duration=break_duration * 60
                    )
                    
                    current_time = break_end
            
            print(f"Created session on {start_time.date()} with {blocks_created} blocks")
            
            # Update aggregates for this session
            SplitAggregateUpdateService.update_for_session(session)
    
    print("\nData population complete!")
    print(f"Username: applereviewer")
    print(f"Password: TestReview2025!")
    
    # Show summary
    total_sessions = StudySession.objects.filter(user=user).count()
    total_hours = StudySession.objects.filter(user=user).aggregate(
        total=models.Sum('total_duration')
    )['total'] or 0
    total_hours = total_hours / 3600  # Convert to hours
    
    print(f"\nSummary:")
    print(f"- Total sessions: {total_sessions}")
    print(f"- Total study time: {total_hours:.1f} hours")
    print(f"- Categories created: {len(categories)}")

if __name__ == "__main__":
    from django.db import models
    create_study_data()