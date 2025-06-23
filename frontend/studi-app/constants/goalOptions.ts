export interface WeeklyGoalOption {
  /**
   * Target study time in minutes for the whole ISO week.
   */
  minutes: number;
  /**
   * Short label shown in the picker (e.g., "3h").
   */
  label: string;
  /**
   * Optional descriptive subtitle (e.g., "Small steps").
   */
  description?: string;
}

/**
 * Preset weekly-goal buckets, aligned with backend expectations (integer minutes).
 */
export const WEEKLY_GOAL_OPTIONS: WeeklyGoalOption[] = [
  {
    minutes: 180, // 3 hours
    label: '3h',
    description: 'Small steps',
  },
  {
    minutes: 420, // 7 hours
    label: '7h',
    description: 'Strong start',
  },
  {
    minutes: 600, // 10 hours
    label: '10h',
    description: 'Clearly committed',
  },
  {
    minutes: 900, // 15 hours
    label: '15h',
    description: 'Unstoppable',
  },
]; 