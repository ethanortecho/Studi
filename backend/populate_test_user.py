#!/usr/bin/env python
"""Populate Apple reviewer test account"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studi.settings')
django.setup()

from analytics.models import Categories, StudySession, CategoryBlock, Break, CustomUser
from analytics.services.split_aggregate_service import SplitAggregateUpdateService
from datetime import datetime, timedelta
from django.utils import timezone
import random

def main():
    # Get the test user
    user = CustomUser.objects.get(username='applereviewer')
    print(f'Populating data for: {user.username}')

    # Get existing categories
    categories = list(Categories.objects.filter(user=user, category_type='study'))
    print(f'Using {len(categories)} categories: {[c.name for c in categories]}')

    # Generate sessions for the past 10 days
    now = timezone.now()
    sessions_created = 0

    for days_ago in range(10, 0, -1):
        session_date = now - timedelta(days=days_ago)
        
        # 2-3 sessions per day
        sessions_today = random.randint(2, 3)
        
        for session_num in range(sessions_today):
            # Random start time
            hour = random.randint(9, 20)
            minute = random.randint(0, 59)
            
            session_start = session_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
            # Session duration: 45-90 minutes (good for flow)
            duration_minutes = random.choice([45, 60, 75, 90])
            session_end = session_start + timedelta(minutes=duration_minutes)
            
            # Create study session
            session = StudySession.objects.create(
                user=user,
                start_time=session_start,
                end_time=session_end,
                status='completed'
            )
            
            # Create category blocks
            remaining_duration = duration_minutes
            current_time = session_start
            
            # Focus on 1-2 subjects per session
            num_subjects = random.choice([1, 2])
            selected_categories = random.sample(categories, min(num_subjects, len(categories)))
            
            for i, category in enumerate(selected_categories):
                if i == len(selected_categories) - 1:
                    # Last category gets remaining time
                    block_duration = remaining_duration
                else:
                    # Split time between categories
                    block_duration = remaining_duration // 2
                
                block_end = current_time + timedelta(minutes=block_duration)
                
                CategoryBlock.objects.create(
                    study_session=session,
                    category=category,
                    start_time=current_time,
                    end_time=block_end
                )
                
                current_time = block_end
                remaining_duration -= block_duration
                
                # Add a 5-minute break between categories
                if i < len(selected_categories) - 1 and remaining_duration > 5:
                    break_duration = 5
                    break_end = current_time + timedelta(minutes=break_duration)
                    
                    Break.objects.create(
                        study_session=session,
                        start_time=current_time,
                        end_time=break_end
                    )
                    
                    current_time = break_end
                    remaining_duration -= break_duration
            
            sessions_created += 1
            
            # Calculate flow score
            try:
                flow_score = session.calculate_flow_score()
                print(f'Session {sessions_created}: {session_start.date()} {session_start.strftime("%H:%M")} - {duration_minutes}min, flow={flow_score}')
            except Exception as e:
                print(f'Session {sessions_created}: {session_start.date()} - Could not calculate flow score: {e}')
            
            # Update aggregates
            try:
                SplitAggregateUpdateService.update_for_session(session)
            except Exception as e:
                print(f'Warning: Aggregate update failed: {e}')

    print(f'\n✅ Data population complete!')
    print(f'Created {sessions_created} sessions')
    print('Username: applereviewer')
    print('Password: TestReview2025!')

    # Summary
    from django.db.models import Sum
    total_duration = StudySession.objects.filter(user=user).aggregate(
        total=Sum('total_duration')
    )['total'] or 0
    total_hours = total_duration / 3600
    
    print(f'\nSummary:')
    print(f'- Total sessions: {sessions_created}')
    print(f'- Total study time: {total_hours:.1f} hours')
    print(f'- Categories: {len(categories)}')

if __name__ == '__main__':
    main()