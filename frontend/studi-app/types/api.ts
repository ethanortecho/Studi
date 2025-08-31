export interface CategoryMetadata {
  name: string;
  color: string;
}

export interface TimelineBreakdown {
  category: number | string;  // number for old API, string for new API
  start_time: string;
  end_time: string;
  duration: number;
}

export interface TimelineSession {
  start_time: string;
  end_time: string;
  breaks: any[];
  breakdowns?: TimelineBreakdown[];  // Old API format
  category_blocks?: TimelineBreakdown[];  // New API format
}

export interface DailyInsightsResponse {
  aggregate: {
    id: number;
    total_duration: string;
    category_durations: { [key: string]: number };
    start_date: string;
    end_date: string;
    session_count: number;
    break_count: number;
    time_frame: string;
    user: number;
    is_final: boolean;
    last_updated: string;
    productivity_score?: number | null;
    productivity_sessions_count?: number;
    flow_score?: number | null;
    flow_score_details?: {
      min: number;
      max: number;
      avg: number;
      count: number;
      distribution: {
        excellent: number;
        great: number;
        good: number;
        fair: number;
        poor: number;
      };
    } | null;
    flow_coaching_message?: string | null;
  };
  timeline_data: TimelineSession[];
  category_metadata: { [key: string]: CategoryMetadata };
  statistics: {
    longest_session: number | null;
    avg_break_duration: number;
  };
  all_time_avg_productivity?: number | null;
}

export interface WeeklyInsightsResponse {
  aggregate: {
    id: number;
    total_duration: string;
    category_durations: { [key: string]: number };
    start_date: string;
    end_date: string;
    session_count: number;
    break_count: number;
    time_frame: string;
    user: number;
    is_final: boolean;
    last_updated: string;
    flow_score?: number | null;
    flow_score_details?: {
      min: number;
      max: number;
      avg: number;
      daily_count: number;
    } | null;
    flow_coaching_message?: string | null;
  };
  daily_breakdown: {
    [date: string]: {
      total: number;
      categories: { [key: string]: number };
    };
  };
  category_metadata: { [key: string]: CategoryMetadata };
  session_times: Array<{
    start_time: string;
    end_time: string;
    total_duration: number;
  }>;
  statistics?: {
    longest_session: number | null;
    avg_break_duration: number;
    avg_daily_study_time: number;
  };
}

export interface MonthlyInsightsResponse {
  statistics: {
    total_hours: number;
    total_sessions: number;
  };
  monthly_aggregate: {
    id: number;
    total_duration: string;
    category_durations: { [key: string]: number };
    start_date: string;
    end_date: string;
    session_count: number;
    break_count: number;
    time_frame: string;
    user: number;
    is_final: boolean;
    last_updated: string;
    flow_score?: number | null;
    flow_score_details?: {
      min: number;
      max: number;
      avg: number;
      daily_count: number;
    } | null;
    flow_coaching_message?: string | null;
  } | null;
  daily_breakdown: Array<{
    date: string;
    total_duration: number;
    category_durations: { [key: string]: number };
  }>;
  heatmap_data: { [date: string]: number };
  category_metadata: { [key: string]: CategoryMetadata };
}