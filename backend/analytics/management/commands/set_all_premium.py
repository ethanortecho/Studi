from django.core.management.base import BaseCommand
from analytics.models import CustomUser


class Command(BaseCommand):
    help = 'Set all users to premium status (for testing phase)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--undo',
            action='store_true',
            help='Remove premium from all users',
        )

    def handle(self, *args, **options):
        if options['undo']:
            # Remove premium from all users
            updated = CustomUser.objects.filter(is_premium=True).update(is_premium=False)
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully removed premium status from {updated} users'
                )
            )
        else:
            # Grant premium to all users
            updated = CustomUser.objects.filter(is_premium=False).update(is_premium=True)
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully granted premium status to {updated} users'
                )
            )
            
            # Show total premium users
            total_premium = CustomUser.objects.filter(is_premium=True).count()
            total_users = CustomUser.objects.count()
            self.stdout.write(
                self.style.SUCCESS(
                    f'Total: {total_premium}/{total_users} users now have premium access'
                )
            )