from django.core.management.base import BaseCommand
from django.utils import timezone
from analytics.models import CustomUser, StudySession, Categories, CategoryBlock
from analytics.flow_score import calculate_flow_score
from analytics.services.split_aggregate_service import SplitAggregateUpdateService
from faker import Faker
from datetime import timedelta, datetime, date
import random

fake = Faker()

class Command(BaseCommand):
    help = 'Generates mock data for testing'

    def add_arguments(self, parser):
        """Add optional CLI arguments to specify user and date range."""
        parser.add_argument(
            '--user',
            type=str,
            dest='user_identifier',
            help='Username or email of user to generate data for (defaults to ethanortecho).'
        )
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
        parser.add_argument(
            '--skip-aggregates',
            action='store_true',
            help='Skip automatic aggregate recalculation after generating data.'
        )

    def handle(self, *args, **kwargs):
        # Get user identifier from arguments
        user_identifier = kwargs.get('user_identifier', 'ethanortecho')
        
        # Find user by username or email
        try:
            if '@' in user_identifier:
                # It's an email
                user = CustomUser.objects.get(email=user_identifier)
                username_display = user.username if user.username else 'No Username'
                self.stdout.write(f'Found user by email: {username_display} ({user.email})')
            else:
                # It's a username
                user = CustomUser.objects.get(username=user_identifier)
                self.stdout.write(f'Found user by username: {user.username} ({user.email})')
        except CustomUser.DoesNotExist:
            self.stderr.write(
                self.style.ERROR(f'User not found: {user_identifier}')
            )
            self.stderr.write('Available users:')
            for u in CustomUser.objects.all()[:10]:  # Show first 10 users
                self.stderr.write(f'  - {u.username} ({u.email})')
            return
        
        # Clear existing data for this specific user
        username_display = user.username if user.username else 'No Username'
        self.stdout.write(f'Clearing existing data for user: {username_display}')
        CategoryBlock.objects.filter(study_session__user=user).delete()
        StudySession.objects.filter(user=user).delete()
        Categories.objects.filter(user=user).delete()

        # Create categories (limited to 5) with frontend-matching colors
        categories = [
            'Finance',
            'Marketing',
            'Calculus',
            'English',
            'Comp Sci',
        ]
        color_mapping = {
            'Finance': '#5A4FCF',      # Purple
            'Marketing': '#4F9DDE', # Blue  
            'Calculus': '#F3C44B',          # Yellow
            'English': '#F46D75',       # Coral
            'Comp Sci': '#2EC4B6',          # Teal
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

                # Generate 1-5 focus rating and convert to 1-10 scale for flow score algorithm
                focus_rating_5_scale = random.choice([1, 2, 3, 4, 5])
                focus_rating_10_scale = focus_rating_5_scale * 2  # Convert to 1-10 scale
                
                session = StudySession.objects.create(
                    user=user,
                    start_time=start_time,
                    end_time=end_time,
                    total_duration=int(duration.total_seconds()),  # Convert to integer seconds
                    status='completed',  # Ensure all mock sessions are completed
                    focus_rating=str(focus_rating_5_scale)  # Store as string (1-5 scale)
                )

                # Create breakdowns for the session
                current_time = start_time
                remaining_duration = duration  # Use timedelta for precision
                
                # Determine number of breakdowns based on session length
                max_breakdowns = min(4, duration_minutes // 15)
                if max_breakdowns < 1:
                    max_breakdowns = 1
                num_breakdowns = random.randint(1, max_breakdowns)
                
                # Distribute time across breakdowns with exact precision
                breakdown_durations = []
                total_minutes_allocated = 0
                
                # Generate breakdown durations ensuring they sum to exactly session duration
                for i in range(num_breakdowns):
                    if i == num_breakdowns - 1:
                        # Last breakdown gets exactly the remaining time
                        breakdown_minutes = duration_minutes - total_minutes_allocated
                    else:
                        # Calculate min/max for this breakdown
                        min_remaining = 15 * (num_breakdowns - i - 1)  # Reserve 15min per remaining breakdown
                        max_remaining = duration_minutes - total_minutes_allocated
                        max_for_this = max_remaining - min_remaining
                        
                        breakdown_minutes = random.randint(15, max(15, max_for_this))
                        total_minutes_allocated += breakdown_minutes
                    
                    breakdown_durations.append(breakdown_minutes)
                
                # Create CategoryBlocks with exact durations
                category_blocks_data = []
                for breakdown_minutes in breakdown_durations:
                    breakdown_duration = timedelta(minutes=breakdown_minutes)
                    selected_category = random.choice(category_objects)
                    
                    block = CategoryBlock.objects.create(
                        study_session=session,
                        category=selected_category,
                        start_time=current_time,
                        end_time=current_time + breakdown_duration,
                        duration=int(breakdown_duration.total_seconds())  # Convert to integer seconds
                    )
                    
                    # Collect block data for flow score calculation
                    category_blocks_data.append({
                        'category_id': selected_category.id,
                        'category_name': selected_category.name,
                        'start_time': current_time,
                        'end_time': current_time + breakdown_duration,
                        'duration': int(breakdown_duration.total_seconds()),
                        'is_break': False
                    })

                    current_time += breakdown_duration
                
                # Calculate and save flow score using the real algorithm (only for sessions 15+ minutes)
                if duration_minutes >= 15:
                    try:
                        flow_result = calculate_flow_score(
                            start_time=start_time,
                            end_time=end_time,
                            focus_rating=focus_rating_10_scale,
                            category_blocks=category_blocks_data
                        )
                        session.flow_score = flow_result.score
                        session.save(update_fields=['flow_score'])
                        
                        self.stdout.write(f"  → Flow score: {flow_result.score}/1000")
                    except Exception as e:
                        self.stdout.write(f"  → Flow score calculation failed: {e}")
                        session.flow_score = None
                        session.save(update_fields=['flow_score'])
                else:
                    session.flow_score = None
                    session.save(update_fields=['flow_score'])

        username_display = user.username if user.username else 'No Username'
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully generated mock data for {username_display} ({user.email}) '
                f'from {start_date} to {end_date} ({total_days} day{"s" if total_days != 1 else ""}).'
            )
        )
        
        # Update aggregates unless explicitly skipped
        if not kwargs.get('skip_aggregates', False):
            self.stdout.write('\n' + '='*50)
            self.stdout.write('🔄 Updating aggregates for generated data...')
            self.stdout.write('='*50)
            
            # Update aggregates for each day in the range
            current_date = start_date
            successful_updates = 0
            failed_updates = 0
            
            while current_date <= end_date:
                try:
                    self.stdout.write(f'Updating aggregates for {current_date}...')
                    
                    # Update daily aggregates
                    SplitAggregateUpdateService._update_daily_aggregate(
                        user=user,
                        date=current_date
                    )
                    
                    # Update weekly aggregates (only do this once per week to avoid redundancy)
                    if current_date.weekday() == 6:  # Sunday (end of week)
                        SplitAggregateUpdateService.update_weekly_aggregates_for_date(current_date)
                    
                    # Update monthly aggregates (only do this on last day of month)
                    if current_date == end_date or (current_date + timedelta(days=1)).month != current_date.month:
                        SplitAggregateUpdateService.update_monthly_aggregates_for_date(current_date)
                    
                    successful_updates += 1
                    
                except Exception as e:
                    self.stderr.write(f'❌ Failed to update aggregates for {current_date}: {e}')
                    failed_updates += 1
                
                current_date += timedelta(days=1)
            
            # Final aggregate update summary
            self.stdout.write('\n' + '='*50)
            if successful_updates > 0:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Aggregate updates completed: {successful_updates} successful, {failed_updates} failed'
                    )
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f'❌ All aggregate updates failed ({failed_updates} failures)')
                )
            self.stdout.write('='*50)
        else:
            self.stdout.write('\n⚠️  Aggregate recalculation skipped. Run manually with:')
            self.stdout.write(f'   python manage.py update_aggregates --user {user.username or user.email}')
        
        self.stdout.write(
            self.style.SUCCESS(f'\n🎉 Mock data generation completed!')
        ) 