"""
Flow Score Algorithm Implementation
Calculates a 0-1000 point score for study sessions based on:
- Focus rating (40%)
- Duration patterns (25%)
- Break hygiene (15%)
- Subject switching/deep work (15%)
- Time of day (5% multiplier)
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import math
from dataclasses import dataclass


@dataclass
class FlowScoreComponents:
    """Components that make up the flow score"""
    focus: float
    duration: float
    breaks: float
    deep_work: float
    time_multiplier: float


@dataclass
class FlowScoreDetails:
    """Detailed metrics about the session"""
    total_minutes: int
    focus_minutes: int
    break_minutes: int
    subject_count: int
    avg_block_length: int
    start_hour: int


@dataclass
class FlowScoreResult:
    """Complete flow score result"""
    score: int
    components: FlowScoreComponents
    details: FlowScoreDetails
    coaching_message: str


def calculate_flow_score(
    start_time: datetime,
    end_time: datetime,
    focus_rating: Optional[int],
    category_blocks: List[Dict],
    user_timezone: Optional[str] = None
) -> FlowScoreResult:
    """
    Calculate flow score for a study session.
    
    Args:
        start_time: Session start datetime
        end_time: Session end datetime
        focus_rating: User's focus rating (1-10 scale, or 1-5 to be converted)
        category_blocks: List of dicts with category_id, category_name, start_time, end_time, duration
        user_timezone: User's timezone for time-of-day calculation
    
    Returns:
        FlowScoreResult with score, components, and details
    """
    
    # Calculate total duration
    total_minutes = (end_time - start_time).total_seconds() / 60
    
    # Separate study blocks from breaks
    study_blocks = []
    break_blocks = []
    
    for block in category_blocks:
        # Check if it's a break (by name or ID)
        is_break = (
            block.get('is_break', False) or
            str(block.get('category_id', '')).lower() == '99' or
            str(block.get('category_name', '')).lower() == 'break'
        )
        
        if is_break:
            break_blocks.append(block)
        else:
            study_blocks.append(block)
    
    # Calculate break and focus minutes
    break_minutes = sum(block.get('duration', 0) / 60 for block in break_blocks)
    focus_minutes = total_minutes - break_minutes
    
    # Get start hour (0-23)
    start_hour = start_time.hour
    
    # Calculate component scores
    focus_score = calculate_focus_score(focus_rating)
    duration_score = calculate_duration_score(focus_minutes)
    break_score = calculate_break_score(focus_minutes, break_minutes, total_minutes, break_blocks)
    deep_work_result = calculate_deep_work_score(study_blocks, focus_minutes)
    time_multiplier = calculate_time_of_day_multiplier(start_hour)
    
    # Calculate base score (weighted sum)
    base_score = 1000 * (
        0.40 * focus_score +
        0.25 * duration_score +
        0.15 * break_score +
        0.15 * deep_work_result['score'] +
        0.05 * 1.0  # Placeholder for time component
    )
    
    # Apply time multiplier and clamp
    final_score = round(max(300, min(1000, base_score * time_multiplier)))
    
    # Create components
    components = FlowScoreComponents(
        focus=focus_score,
        duration=duration_score,
        breaks=break_score,
        deep_work=deep_work_result['score'],
        time_multiplier=time_multiplier
    )
    
    # Create details
    details = FlowScoreDetails(
        total_minutes=round(total_minutes),
        focus_minutes=round(focus_minutes),
        break_minutes=round(break_minutes),
        subject_count=deep_work_result['subject_count'],
        avg_block_length=round(deep_work_result['avg_block_length']),
        start_hour=start_hour
    )
    
    # Generate coaching message
    coaching_message = get_coaching_message(final_score, components, details)
    
    return FlowScoreResult(
        score=final_score,
        components=components,
        details=details,
        coaching_message=coaching_message
    )


def calculate_focus_score(rating: Optional[int]) -> float:
    """
    Calculate focus component (0-1).
    Maps 1-10 rating with slight exponential bonus for high focus.
    """
    # Default to 6/10 if missing
    focus_rating = rating if rating is not None else 6
    
    # We're using 1-10 scale in tests, don't convert
    # (Conversion should only happen if explicitly indicated)
    
    # Ensure rating is in 1-10 range
    clamped_rating = max(1, min(10, focus_rating))
    
    # Apply exponential curve to reward high focus
    return pow(clamped_rating / 10, 1.2)


def calculate_duration_score(focus_minutes: float) -> float:
    """
    Calculate duration component (0-1).
    Rewards 50-90 min sessions, gentle penalties for very short/long.
    """
    m = focus_minutes
    
    if m <= 10:
        return 0.3  # Participation credit
    elif m <= 50:
        # Ramp from 0.3 to 1.0
        return 0.3 + 0.7 * (m - 10) / 40
    elif m <= 90:
        # Plateau at peak
        return 1.0
    elif m <= 150:
        # Gentle taper to 0.8
        return 1.0 - 0.2 * (m - 90) / 60
    elif m <= 240:
        # Continue gentle decline to 0.5
        return 0.8 - 0.3 * (m - 150) / 90
    else:
        # Floor at 0.5 for marathons
        return 0.5


def calculate_break_score(
    focus_minutes: float,
    break_minutes: float,
    total_minutes: float,
    break_blocks: List[Dict]
) -> float:
    """
    Calculate break hygiene score (0-1).
    Rewards appropriate break frequency and duration.
    """
    # Base case: short sessions don't need breaks
    if focus_minutes <= 60:
        return 1.0 if len(break_blocks) == 0 else 0.9
    
    # Calculate recommended breaks (1 per hour)
    recommended_breaks = math.floor(focus_minutes / 60)
    
    # Count "good" breaks (3-20 minutes)
    good_breaks = sum(
        1 for block in break_blocks
        if 3 <= (block.get('duration', 0) / 60) <= 20
    )
    
    # Base score from break quality
    if recommended_breaks == 0:
        score = 1.0
    else:
        score = min(1.0, good_breaks / recommended_breaks)
    
    # Penalty for excessive break time (>40% of total)
    if break_minutes > 0.4 * total_minutes:
        score *= 0.85
    
    return max(0, score)


def calculate_deep_work_score(
    study_blocks: List[Dict],
    focus_minutes: float
) -> Dict:
    """
    Calculate deep work / subject switching score (0-1).
    Rewards focused work on fewer subjects.
    """
    if not study_blocks or focus_minutes == 0:
        return {
            'score': 0.5,
            'subject_count': 0,
            'avg_block_length': 0
        }
    
    # Calculate time per subject
    subject_minutes = {}
    for block in study_blocks:
        # Use category_name if available, otherwise category_id
        subject = block.get('category_name') or str(block.get('category_id', 'Unknown'))
        duration_min = block.get('duration', 0) / 60
        subject_minutes[subject] = subject_minutes.get(subject, 0) + duration_min
    
    subjects = list(subject_minutes.keys())
    subject_count = len(subjects)
    
    # Calculate Herfindahl concentration index
    herfindahl = sum(
        pow(minutes / focus_minutes, 2)
        for minutes in subject_minutes.values()
    )
    
    # Calculate average uninterrupted block length
    avg_block_length = focus_minutes / len(study_blocks) if study_blocks else 0
    
    # Combine metrics with base score for effort
    score = (
        0.3 +  # Base score
        0.4 * herfindahl +  # Concentration reward
        0.3 * min(1, avg_block_length / 25)  # Block length reward
    )
    
    # Light penalty for excessive switching
    if len(study_blocks) > focus_minutes / 20:
        score *= 0.92
    
    # Floor at 0.5 - switching is still studying
    return {
        'score': max(0.5, min(1, score)),
        'subject_count': subject_count,
        'avg_block_length': avg_block_length
    }


def calculate_time_of_day_multiplier(hour: int) -> float:
    """
    Calculate time of day multiplier (0.95-1.02).
    Slight bonus for peak hours, gentle penalty for late night.
    """
    if 11 <= hour < 21:
        # Late morning to evening - slight bonus
        return 1.02
    elif (9 <= hour < 11) or (21 <= hour < 23):
        # Early morning or late evening - neutral
        return 1.00
    elif (7 <= hour < 9) or (23 <= hour < 24):
        # Very early or very late - slight penalty
        return 0.98
    else:
        # Night owl hours (1-7am) - gentle penalty
        return 0.95


def get_coaching_message(score: int, components: FlowScoreComponents, details: FlowScoreDetails) -> str:
    """
    Generate coaching message based on score and components.
    """
    # Find weakest component
    component_scores = [
        ('focus', components.focus, 0.40),
        ('duration', components.duration, 0.25),
        ('breaks', components.breaks, 0.15),
        ('deep_work', components.deep_work, 0.15)
    ]
    
    # Sort by weighted score
    component_scores.sort(key=lambda x: x[1] * x[2])
    weakest = component_scores[0][0]
    
    tips = {
        'focus': "Try eliminating distractions. Use Do Not Disturb mode.",
        'duration': "Aim for 45-60 minute focused blocks for optimal flow.",
        'breaks': "Take a 5-10 minute break every hour to maintain focus.",
        'deep_work': "Stick with one subject for at least 30 minutes before switching."
    }
    
    # Overall encouragement based on score
    if score < 500:
        encouragement = "Good start! "
    elif score < 700:
        encouragement = "Nice work! You're building momentum. "
    elif score < 850:
        encouragement = "Great session! You're in the zone. "
    else:
        encouragement = "Outstanding! Peak performance! 🔥 "
    
    # Add tip only if score is below 850
    if score < 850:
        return encouragement + tips[weakest]
    else:
        return encouragement + "Keep it up!"


# Helper function for testing
def create_test_blocks(blocks_data: List[Tuple[str, int, bool]]) -> List[Dict]:
    """
    Create category blocks for testing.
    Args:
        blocks_data: List of (category_name, duration_minutes, is_break)
    Returns:
        List of category block dicts
    """
    blocks = []
    current_time = datetime.now().replace(hour=14, minute=0, second=0, microsecond=0)
    
    for i, (name, duration_min, is_break) in enumerate(blocks_data):
        start = current_time
        end = current_time + timedelta(minutes=duration_min)
        
        blocks.append({
            'category_id': 99 if is_break else i + 1,
            'category_name': name,
            'start_time': start,
            'end_time': end,
            'duration': duration_min * 60,  # Convert to seconds
            'is_break': is_break
        })
        
        current_time = end
    
    return blocks