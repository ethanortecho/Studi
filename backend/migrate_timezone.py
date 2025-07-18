#!/usr/bin/env python
"""
Django management command to migrate existing session times from EST to UTC

This script converts all existing StudySession and CategoryBlock timestamps
from EST (stored without timezone info) to proper UTC timestamps.

Usage:
    python migrate_timezone.py --dry-run  # Test run
    python migrate_timezone.py           # Execute migration
"""

import os
import sys
import django
from datetime import datetime
import pytz

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studi.settings')
django.setup()

# Now import Django models
from analytics.models import StudySession, CategoryBlock

def add_four_hours_to_utc(datetime_obj):
    """
    Add 4 hours to datetime objects that were stored as EDT but labeled as UTC
    Simple fix: just add 4 hours to convert EDT-stored-as-UTC to proper UTC
    """
    if not datetime_obj:
        return None
    
    from datetime import timedelta
    return datetime_obj + timedelta(hours=4)

def migrate_sessions(dry_run=True):
    """Migrate StudySession timestamps from July 17, 2025 and earlier"""
    from datetime import date
    
    print("📊 Migrating StudySession records...")
    
    # Only migrate sessions from July 17, 2025 and earlier
    cutoff_date = date(2025, 7, 18)  # Anything before July 18
    sessions = StudySession.objects.filter(start_time__date__lt=cutoff_date)
    
    print(f"Found {sessions.count()} sessions from July 17 and earlier to migrate")
    
    migrated_count = 0
    
    for session in sessions:
        old_start = session.start_time
        old_end = session.end_time
        
        # Add 4 hours to start_time
        if session.start_time:
            new_start = add_four_hours_to_utc(session.start_time)
            
            if dry_run:
                print(f"  Session {session.id}:")
                print(f"    Start: {old_start} → {new_start}")
            else:
                session.start_time = new_start
        
        # Add 4 hours to end_time
        if session.end_time:
            new_end = add_four_hours_to_utc(session.end_time)
            
            if dry_run:
                if not session.start_time:  # Only print header if we didn't already
                    print(f"  Session {session.id}:")
                print(f"    End: {old_end} → {new_end}")
            else:
                session.end_time = new_end
        
        # Save changes
        if not dry_run:
            session.save()
            migrated_count += 1
    
    if not dry_run:
        print(f"✅ Migrated {migrated_count} sessions")

def migrate_category_blocks(dry_run=True):
    """Migrate CategoryBlock timestamps from July 17, 2025 and earlier"""
    from datetime import date
    
    print("\n📋 Migrating CategoryBlock records...")
    
    # Only migrate blocks from July 17, 2025 and earlier
    cutoff_date = date(2025, 7, 18)  # Anything before July 18
    blocks = CategoryBlock.objects.filter(start_time__date__lt=cutoff_date)
    
    print(f"Found {blocks.count()} category blocks from July 17 and earlier to migrate")
    
    migrated_count = 0
    
    for block in blocks:
        old_start = block.start_time
        old_end = block.end_time
        
        # Add 4 hours to start_time
        if block.start_time:
            new_start = add_four_hours_to_utc(block.start_time)
            
            if dry_run:
                print(f"  Block {block.id} (Session {block.study_session_id}):")
                print(f"    Start: {old_start} → {new_start}")
            else:
                block.start_time = new_start
        
        # Add 4 hours to end_time
        if block.end_time:
            new_end = add_four_hours_to_utc(block.end_time)
            
            if dry_run:
                if not block.start_time:  # Only print header if we didn't already
                    print(f"  Block {block.id} (Session {block.study_session_id}):")
                print(f"    End: {old_end} → {new_end}")
            else:
                block.end_time = new_end
        
        # Save changes
        if not dry_run:
            block.save()
            migrated_count += 1
    
    if not dry_run:
        print(f"✅ Migrated {migrated_count} category blocks")

def main():
    """Main migration function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Migrate timezone data from EST to UTC')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Show what would be changed without making changes')
    parser.add_argument('--sessions-only', action='store_true',
                       help='Only migrate sessions, skip category blocks')
    parser.add_argument('--blocks-only', action='store_true', 
                       help='Only migrate category blocks, skip sessions')
    
    args = parser.parse_args()
    
    print("🚀 Starting timezone migration: Adding 4 hours to July 17 and earlier sessions...")
    print("📅 This fixes sessions that were stored as EDT but labeled as UTC")
    
    if args.dry_run:
        print("🧪 DRY RUN MODE - No changes will be made")
    else:
        print("⚠️  LIVE MODE - Changes will be saved to database")
        print("⚠️  This will add 4 hours to all sessions/blocks from July 17, 2025 and earlier")
        response = input("Are you sure you want to continue? (yes/no): ")
        if response.lower() != 'yes':
            print("❌ Migration cancelled")
            return
    
    print(f"📅 Migration started at: {datetime.now()}")
    
    try:
        # Migrate sessions unless blocks-only flag is set
        if not args.blocks_only:
            migrate_sessions(dry_run=args.dry_run)
        
        # Migrate category blocks unless sessions-only flag is set
        if not args.sessions_only:
            migrate_category_blocks(dry_run=args.dry_run)
        
        print(f"\n🎉 Migration completed successfully!")
        
        if args.dry_run:
            print("\n📝 Next steps:")
            print("1. Review the changes above")
            print("2. Run without --dry-run to execute the migration")
            print("3. Test your frontend charts after migration")
        else:
            print("\n📝 Migration complete! Next steps:")
            print("1. Test that frontend charts now display correct times")
            print("2. Create a new session to verify UTC storage is working")
            print("3. Check that existing sessions show at correct times")
    
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()