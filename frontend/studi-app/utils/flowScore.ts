/**
 * Flow Score Algorithm
 * Calculates a 0-1000 point score for study sessions based on:
 * - Focus rating (40%)
 * - Duration patterns (25%)
 * - Break hygiene (15%)
 * - Subject switching/deep work (15%)
 * - Time of day (5% multiplier)
 */

export interface CategoryBlock {
  category_id: number | string;
  category_name?: string;
  start_time: string;
  end_time: string;
  duration: number; // in seconds
  is_break?: boolean;
}

export interface FlowScoreInput {
  start_time: string;
  end_time: string;
  focus_rating?: number; // 1-10 scale (will map from 1-5 if needed)
  category_blocks: CategoryBlock[];
  timezone?: string; // User timezone for time-of-day calculation
}

export interface FlowScoreComponents {
  focus: number;
  duration: number;
  breaks: number;
  deepWork: number;
  timeMultiplier: number;
}

export interface FlowScoreResult {
  score: number;
  components: FlowScoreComponents;
  details: {
    totalMinutes: number;
    focusMinutes: number;
    breakMinutes: number;
    subjectCount: number;
    avgBlockLength: number;
    startHour: number;
  };
}

/**
 * Main Flow Score calculation function
 */
export function calculateFlowScore(input: FlowScoreInput): FlowScoreResult {
  // Parse times and calculate durations
  const startTime = new Date(input.start_time);
  const endTime = new Date(input.end_time);
  const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  
  // Separate breaks from study blocks
  const studyBlocks = input.category_blocks.filter(b => 
    !b.is_break && b.category_name?.toLowerCase() !== 'break'
  );
  const breakBlocks = input.category_blocks.filter(b => 
    b.is_break || b.category_name?.toLowerCase() === 'break'
  );
  
  // Calculate break and focus minutes
  const breakMinutes = breakBlocks.reduce((sum, b) => sum + (b.duration / 60), 0);
  const focusMinutes = totalMinutes - breakMinutes;
  
  // Get start hour in local timezone (0-23)
  const startHour = startTime.getHours();
  
  // Component 1: Focus Score (40% weight)
  const focusScore = calculateFocusScore(input.focus_rating);
  
  // Component 2: Duration Score (25% weight)
  const durationScore = calculateDurationScore(focusMinutes);
  
  // Component 3: Break Score (15% weight)
  const breakScore = calculateBreakScore(
    focusMinutes,
    breakMinutes,
    totalMinutes,
    breakBlocks
  );
  
  // Component 4: Deep Work Score (15% weight)
  const { score: deepWorkScore, subjectCount, avgBlockLength } = calculateDeepWorkScore(
    studyBlocks,
    focusMinutes
  );
  
  // Component 5: Time of Day Multiplier
  const timeMultiplier = calculateTimeOfDayMultiplier(startHour);
  
  // Calculate base score (weighted sum)
  const baseScore = 1000 * (
    0.40 * focusScore +
    0.25 * durationScore +
    0.15 * breakScore +
    0.15 * deepWorkScore +
    0.05 * 1.0 // Placeholder for time component
  );
  
  // Apply time multiplier and clamp
  const finalScore = Math.round(
    Math.max(300, Math.min(1000, baseScore * timeMultiplier))
  );
  
  return {
    score: finalScore,
    components: {
      focus: focusScore,
      duration: durationScore,
      breaks: breakScore,
      deepWork: deepWorkScore,
      timeMultiplier
    },
    details: {
      totalMinutes: Math.round(totalMinutes),
      focusMinutes: Math.round(focusMinutes),
      breakMinutes: Math.round(breakMinutes),
      subjectCount,
      avgBlockLength: Math.round(avgBlockLength),
      startHour
    }
  };
}

/**
 * Calculate focus component (0-1)
 * Maps 1-10 rating with slight exponential bonus for high focus
 */
function calculateFocusScore(rating?: number): number {
  // Default to 6/10 if missing
  const focusRating = rating || 6;
  
  // Ensure rating is in 1-10 range
  const clampedRating = Math.max(1, Math.min(10, focusRating));
  
  // Apply exponential curve to reward high focus
  return Math.pow(clampedRating / 10, 1.2);
}

/**
 * Calculate duration component (0-1)
 * Rewards 50-90 min sessions, gentle penalties for very short/long
 */
function calculateDurationScore(focusMinutes: number): number {
  const m = focusMinutes;
  
  if (m <= 10) {
    return 0.3; // Participation credit
  } else if (m <= 50) {
    // Ramp from 0.3 to 1.0
    return 0.3 + 0.7 * (m - 10) / 40;
  } else if (m <= 90) {
    // Plateau at peak
    return 1.0;
  } else if (m <= 150) {
    // Gentle taper to 0.8
    return 1.0 - 0.2 * (m - 90) / 60;
  } else if (m <= 240) {
    // Continue gentle decline to 0.5
    return 0.8 - 0.3 * (m - 150) / 90;
  } else {
    // Floor at 0.5 for marathons
    return 0.5;
  }
}

/**
 * Calculate break hygiene score (0-1)
 * Rewards appropriate break frequency and duration
 */
function calculateBreakScore(
  focusMinutes: number,
  breakMinutes: number,
  totalMinutes: number,
  breakBlocks: CategoryBlock[]
): number {
  // Base case: short sessions don't need breaks
  if (focusMinutes <= 60) {
    return breakBlocks.length === 0 ? 1.0 : 0.9;
  }
  
  // Calculate recommended breaks (1 per hour)
  const recommendedBreaks = Math.floor(focusMinutes / 60);
  
  // Count "good" breaks (3-20 minutes)
  const goodBreaks = breakBlocks.filter(b => {
    const minutes = b.duration / 60;
    return minutes >= 3 && minutes <= 20;
  }).length;
  
  // Base score from break quality
  let score = recommendedBreaks === 0 ? 1.0 :
    Math.min(1.0, goodBreaks / recommendedBreaks);
  
  // Penalty for excessive break time (>40% of total)
  if (breakMinutes > 0.4 * totalMinutes) {
    score *= 0.85;
  }
  
  return Math.max(0, score);
}

/**
 * Calculate deep work / subject switching score (0-1)
 * Rewards focused work on fewer subjects
 */
function calculateDeepWorkScore(
  studyBlocks: CategoryBlock[],
  focusMinutes: number
): { score: number; subjectCount: number; avgBlockLength: number } {
  if (studyBlocks.length === 0 || focusMinutes === 0) {
    return { score: 0.5, subjectCount: 0, avgBlockLength: 0 };
  }
  
  // Calculate time per subject
  const subjectMinutes: { [key: string]: number } = {};
  studyBlocks.forEach(block => {
    const subject = block.category_name || block.category_id.toString();
    subjectMinutes[subject] = (subjectMinutes[subject] || 0) + (block.duration / 60);
  });
  
  const subjects = Object.keys(subjectMinutes);
  const subjectCount = subjects.length;
  
  // Calculate Herfindahl concentration index
  const herfindahl = subjects.reduce((sum, subject) => {
    const proportion = subjectMinutes[subject] / focusMinutes;
    return sum + Math.pow(proportion, 2);
  }, 0);
  
  // Calculate average uninterrupted block length
  const avgBlockLength = focusMinutes / studyBlocks.length;
  
  // Combine metrics with base score for effort
  let score = 0.3 + // Base score
    0.4 * herfindahl + // Concentration reward
    0.3 * Math.min(1, avgBlockLength / 25); // Block length reward
  
  // Light penalty for excessive switching
  if (studyBlocks.length > focusMinutes / 20) {
    score *= 0.92;
  }
  
  // Floor at 0.5 - switching is still studying
  return {
    score: Math.max(0.5, Math.min(1, score)),
    subjectCount,
    avgBlockLength
  };
}

/**
 * Calculate time of day multiplier (0.95-1.02)
 * Slight bonus for peak hours, gentle penalty for late night
 */
function calculateTimeOfDayMultiplier(hour: number): number {
  if (hour >= 11 && hour < 21) {
    // Late morning to evening - slight bonus
    return 1.02;
  } else if ((hour >= 9 && hour < 11) || (hour >= 21 && hour < 23)) {
    // Early morning or late evening - neutral
    return 1.00;
  } else if ((hour >= 7 && hour < 9) || (hour >= 23 && hour < 24)) {
    // Very early or very late - slight penalty
    return 0.98;
  } else {
    // Night owl hours (1-7am) - gentle penalty
    return 0.95;
  }
}

/**
 * Helper function to convert 1-5 rating to 1-10 scale
 */
export function convertFocusRating(rating5: number): number {
  // Map 1-5 to 1-10: 1→1, 2→3.25, 3→5.5, 4→7.75, 5→10
  return (rating5 - 1) * 2.25 + 1;
}

/**
 * Get coaching message based on score components
 */
export function getFlowCoachingMessage(result: FlowScoreResult): string {
  const { components, details } = result;
  
  // Find weakest component
  const componentScores = [
    { name: 'focus', score: components.focus, weight: 0.40 },
    { name: 'duration', score: components.duration, weight: 0.25 },
    { name: 'breaks', score: components.breaks, weight: 0.15 },
    { name: 'deepWork', score: components.deepWork, weight: 0.15 }
  ];
  
  const weakest = componentScores.sort((a, b) => 
    (a.score * a.weight) - (b.score * b.weight)
  )[0];
  
  const tips: { [key: string]: string } = {
    focus: "Try eliminating distractions. Use Do Not Disturb mode.",
    duration: "Aim for 45-60 minute focused blocks for optimal flow.",
    breaks: "Take a 5-10 minute break every hour to maintain focus.",
    deepWork: "Stick with one subject for at least 30 minutes before switching."
  };
  
  // Overall encouragement based on score
  let encouragement = "";
  if (result.score < 500) {
    encouragement = "Good start! ";
  } else if (result.score < 700) {
    encouragement = "Nice work! You're building momentum. ";
  } else if (result.score < 850) {
    encouragement = "Great session! You're in the zone. ";
  } else {
    encouragement = "Outstanding! Peak performance! 🔥 ";
  }
  
  return encouragement + (result.score < 850 ? tips[weakest.name] : "Keep it up!");
}