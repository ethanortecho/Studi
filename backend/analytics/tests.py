import unittest
from datetime import date

from analytics.services.date_utils import get_week_boundaries


class DateUtilsTestCase(unittest.TestCase):
    """Tests for date utility functions"""

    def test_get_week_boundaries_sunday_start(self):
        """Given any date, the week should start on the preceding (or same) Sunday and end on Saturday."""
        # Example: A Wednesday
        wednesday = date(2025, 6, 11)  # Wed
        week_start, week_end = get_week_boundaries(wednesday)
        self.assertEqual(week_start, date(2025, 6, 8))  # Sunday
        self.assertEqual(week_end, date(2025, 6, 14))  # Saturday

        # Example: Already Sunday
        sunday = date(2025, 6, 8)
        week_start, week_end = get_week_boundaries(sunday)
        self.assertEqual(week_start, sunday)
        self.assertEqual(week_end, date(2025, 6, 14))

        # Example: Monday should map to previous day (Sun)
        monday = date(2025, 6, 9)
        week_start, week_end = get_week_boundaries(monday)
        self.assertEqual(week_start, date(2025, 6, 8))
        self.assertEqual(week_end, date(2025, 6, 14))
