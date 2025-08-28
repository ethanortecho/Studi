"""
Test suite for Flow Score algorithm
Run with: python backend/analytics/test_flow_score.py
"""

from datetime import datetime, timedelta
from .flow_score import (
    calculate_flow_score,
    create_test_blocks,
    FlowScoreResult
)
#fart

def run_test(name: str, description: str, start_time: datetime, end_time: datetime,
             focus_rating: int, blocks_data: list, expected_range: tuple) -> dict:
    """Run a single test case"""
    
    blocks = create_test_blocks(blocks_data)
    result = calculate_flow_score(start_time, end_time, focus_rating, blocks)
    
    in_range = expected_range[0] <= result.score <= expected_range[1]
    
    return {
        'name': name,
        'description': description,
        'passed': in_range,
        'score': result.score,
        'expected': expected_range,
        'components': result.components,
        'details': result.details,
        'message': result.coaching_message
    }


def print_test_result(result: dict):
    """Print formatted test result"""
    status = "✅ PASS" if result['passed'] else "❌ FAIL"
    print(f"\n{status} {result['name']}")
    print(f"   {result['description']}")
    print(f"   Score: {result['score']} (expected {result['expected'][0]}-{result['expected'][1]})")
    print(f"   Components:")
    print(f"     - Focus: {result['components'].focus:.0%}")
    print(f"     - Duration: {result['components'].duration:.0%}")
    print(f"     - Breaks: {result['components'].breaks:.0%}")
    print(f"     - Deep Work: {result['components'].deep_work:.0%}")
    print(f"     - Time Multiplier: {result['components'].time_multiplier:.2f}x")
    print(f"   Details: {result['details'].focus_minutes}min study, "
          f"{result['details'].break_minutes}min break, "
          f"{result['details'].subject_count} subjects")
    print(f"   Coach: {result['message']}")


def main():
    """Run all test cases"""
    
    print("\n🧪 Flow Score Algorithm Test Results (Python)")
    print("=" * 60)
    
    # Define test cases
    test_cases = [
        # Edge cases
        {
            'name': "Minimal Session",
            'description': "5 minute session with low focus",
            'duration': 5,
            'focus': 3,
            'blocks': [("Math", 5, False)],
            'expected': (350, 450),
            'hour': 14
        },
        {
            'name': "Marathon Session",
            'description': "6 hour session with few breaks",
            'duration': 360,
            'focus': 6,
            'blocks': [
                ("Math", 110, False),
                ("Break", 10, True),
                ("Physics", 110, False),
                ("Break", 10, True),
                ("Chemistry", 120, False)
            ],
            'expected': (450, 550),
            'hour': 14
        },
        {
            'name': "Perfect Session",
            'description': "Optimal everything - 60 min, perfect focus, one break",
            'duration': 70,
            'focus': 10,
            'blocks': [
                ("Math", 50, False),
                ("Break", 10, True),
                ("Math", 10, False)
            ],
            'expected': (950, 1000),
            'hour': 14
        },
        
        # Realistic patterns
        {
            'name': "Classic Pomodoro",
            'description': "4 pomodoros with proper breaks",
            'duration': 115,
            'focus': 8,
            'blocks': [
                ("Math", 25, False),
                ("Break", 5, True),
                ("Math", 25, False),
                ("Break", 5, True),
                ("Math", 25, False),
                ("Break", 5, True),
                ("Math", 25, False)
            ],
            'expected': (800, 900),
            'hour': 14
        },
        {
            'name': "Morning Review",
            'description': "Quick 30 min high-focus review",
            'duration': 30,
            'focus': 9,
            'blocks': [("Math", 30, False)],
            'expected': (750, 850),
            'hour': 8
        },
        {
            'name': "Homework Juggling",
            'description': "Multiple subjects, 30 min each",
            'duration': 100,
            'focus': 7,
            'blocks': [
                ("Math", 30, False),
                ("Break", 5, True),
                ("English", 30, False),
                ("Break", 5, True),
                ("Science", 30, False)
            ],
            'expected': (700, 800),
            'hour': 19
        },
        {
            'name': "Late Night Cramming",
            'description': "3 hours, minimal breaks, tired",
            'duration': 180,
            'focus': 5,
            'blocks': [
                ("Biology", 90, False),
                ("Break", 5, True),
                ("Biology", 85, False)
            ],
            'expected': (500, 600),
            'hour': 23
        },
        {
            'name': "Rapid Switching",
            'description': "Switching subjects every 10 minutes",
            'duration': 60,
            'focus': 7,
            'blocks': [
                ("Math", 10, False),
                ("Physics", 10, False),
                ("Chemistry", 10, False),
                ("Biology", 10, False),
                ("English", 10, False),
                ("History", 10, False)
            ],
            'expected': (550, 650),
            'hour': 14
        },
        {
            'name': "Excessive Breaks",
            'description': "Session with 40% break time",
            'duration': 100,
            'focus': 7,
            'blocks': [
                ("Math", 20, False),
                ("Break", 15, True),
                ("Math", 20, False),
                ("Break", 15, True),
                ("Math", 20, False),
                ("Break", 10, True)
            ],
            'expected': (550, 650),
            'hour': 14
        },
        {
            'name': "Deep Work Session",
            'description': "90 minute focused session with one break",
            'duration': 100,
            'focus': 9,
            'blocks': [
                ("Physics", 45, False),
                ("Break", 10, True),
                ("Physics", 45, False)
            ],
            'expected': (850, 950),
            'hour': 14
        }
    ]
    
    # Run tests
    results = []
    passed = 0
    failed = 0
    
    for test in test_cases:
        # Create start and end times
        start = datetime.now().replace(hour=test['hour'], minute=0, second=0, microsecond=0)
        end = start + timedelta(minutes=test['duration'])
        
        result = run_test(
            test['name'],
            test['description'],
            start,
            end,
            test['focus'],
            test['blocks'],
            test['expected']
        )
        
        results.append(result)
        if result['passed']:
            passed += 1
        else:
            failed += 1
        
        print_test_result(result)
    
    # Summary
    print("\n" + "=" * 60)
    print(f"\n📊 Test Summary: {passed} passed, {failed} failed")
    
    # Score distribution
    scores = [r['score'] for r in results]
    avg_score = sum(scores) / len(scores)
    min_score = min(scores)
    max_score = max(scores)
    
    print(f"\n📈 Score Distribution:")
    print(f"   Average: {avg_score:.0f}")
    print(f"   Range: {min_score} - {max_score}")
    
    # Component averages
    avg_focus = sum(r['components'].focus for r in results) / len(results)
    avg_duration = sum(r['components'].duration for r in results) / len(results)
    avg_breaks = sum(r['components'].breaks for r in results) / len(results)
    avg_deep_work = sum(r['components'].deep_work for r in results) / len(results)
    
    print(f"\n🎯 Average Components:")
    print(f"   Focus: {avg_focus:.0%}")
    print(f"   Duration: {avg_duration:.0%}")
    print(f"   Breaks: {avg_breaks:.0%}")
    print(f"   Deep Work: {avg_deep_work:.0%}")
    
    return passed, failed


if __name__ == "__main__":
    passed, failed = main()
    exit(0 if failed == 0 else 1)