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
  };
  timeline_data: TimelineSession[];
  category_metadata: { [key: string]: CategoryMetadata };
  statistics: {
    longest_session: number | null;
    avg_break_duration: number;
  };
} 