export interface CategoryMetadata {
  name: string;
  color: string;
}

export interface TimelineBreakdown {
  category: number;
  start_time: string;
  end_time: string;
  duration: number;
}

export interface TimelineSession {
  start_time: string;
  end_time: string;
  breaks: any[];
  breakdowns: TimelineBreakdown[];
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
  };
  timeline_data: TimelineSession[];
  category_metadata: { [key: string]: CategoryMetadata };
  statistics: {
    longest_session: number | null;
    avg_break_duration: number;
  };
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
  } | null;
  daily_breakdown: Array<{
    date: string;
    total_duration: number;
    category_durations: { [key: string]: number };
  }>;
  heatmap_data: { [date: string]: number };
  category_metadata: { [key: string]: CategoryMetadata };
}