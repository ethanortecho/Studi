import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { TimelineSession, CategoryMetadata } from '@/types/api';
import DashboardCard from '@/components/insights/DashboardContainer';

interface Props {
  /** Raw session timeline data for a single day */
  timelineData: TimelineSession[];
  /** Needed to identify & filter out Break categories */
  categoryMetadata: { [key: string]: CategoryMetadata };
  /** Full height (in px) representing 60 minutes. Default 100. */
  height?: number;
  /** Full chart width. Default 300. */
  width?: number;
  /** When true, component should not render */
  isEmpty?: boolean;
}

/** Baseline / grid colour */
const GRID_COLOUR = '#3A3D4D';
/** Gap between bars (px) */
const BAR_GAP = 2;

const DailyHourBars: React.FC<Props> = ({
  timelineData,
  categoryMetadata,
  height = 100,
  width = 300,
  isEmpty = false,
}) => {
  // Don't render if no data available
  if (isEmpty) {
    return null;
  }
  /* ------------------------------------------------------------------ */
  /*                           Data Processing                           */
  /* ------------------------------------------------------------------ */
  type HourData = {
    totalMinutes: number;
    /** one entry per category present in that hour */
    segments: {
      categoryId: string;
      minutes: number;
      color: string;
    }[];
  };

  const hoursData: HourData[] = useMemo(() => {
    // init 24 empty hours
    const base: HourData[] = Array.from({ length: 24 }, () => ({
      totalMinutes: 0,
      segments: [],
    }));

    if (!timelineData || timelineData.length === 0) return base;

    timelineData.forEach((session) => {
      const breakdowns = session.breakdowns || session.category_blocks || [];
      breakdowns.forEach((bd) => {
        const categoryId = bd.category.toString();
        const meta = categoryMetadata?.[categoryId];
        if (meta?.name === 'Break') return; // skip breaks entirely

        const start = new Date(bd.start_time);
        const end = new Date(bd.end_time);
        let current = new Date(start);

        while (current < end) {
          const hourIdx = current.getHours();

          // End of the current hour boundary
          const nextHour = new Date(current);
          nextHour.setHours(current.getHours() + 1, 0, 0, 0);

          const segmentEnd = end < nextHour ? end : nextHour;
          const diffMinutes =
            (segmentEnd.getTime() - current.getTime()) / 60000; // ms → minutes

          // Find or push segment for that category in this hour
          const hour = base[hourIdx];
          let seg = hour.segments.find((s) => s.categoryId === categoryId);
          if (!seg) {
            seg = {
              categoryId,
              minutes: 0,
              color: meta?.color || '#5A4FCF', // fallback accent
            };
            hour.segments.push(seg);
          }
          seg.minutes += diffMinutes;

          hour.totalMinutes += diffMinutes;

          current = segmentEnd;
        }
      });
    });

    // Clamp & round
    return base.map((hour) => ({
      totalMinutes: Math.min(60, Math.round(hour.totalMinutes)),
      segments: hour.segments.map((s) => ({
        ...s,
        minutes: Math.round(s.minutes),
      })),
    }));
  }, [timelineData, categoryMetadata]);

  /* ------------------------------------------------------------------ */
  /*                               Layout                                */
  /* ------------------------------------------------------------------ */
  // Use provided width or calculate based on a default bar width of 10px
  const DEFAULT_BAR_WIDTH = 10;
  const computedWidth = width ?? DEFAULT_BAR_WIDTH * 24 + BAR_GAP * 23;
  const barWidth = (computedWidth - BAR_GAP * 23) / 24; // 23 gaps between 24 bars

  const hourLabels = ['12am', '6am', '12pm', '6pm'];
  const hourLabelPositions = [0, 6, 12, 18];

  return (
    <DashboardCard className="bg-background border  border-surface rounded-[35px]">
      {/* Title */}
      <Text className="text-xl font-semibold text-primaryText py-14 pt-10 px-8 text-center">
        Study minutes per hour
      </Text>

      <View className="px-10 pb-10">
        {/* Chart area */}
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          {/* Bars + grid */}
          <View style={{ width: computedWidth, position: 'relative' }}>
            {/* Grid lines */}
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 1,
                backgroundColor: GRID_COLOUR,
                opacity: 0.6,
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: height / 2,
                height: 1,
                backgroundColor: GRID_COLOUR,
                opacity: 0.6,
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: 1,
                backgroundColor: GRID_COLOUR,
                opacity: 0.6,
              }}
            />

            {/* Bars */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                height,
              }}
            >
              {hoursData.map((hour, idx) => {
                const barHeight = (hour.totalMinutes / 60) * height;

                // Sort segments by minutes descending for consistent stack order
                const segments = [...hour.segments].sort((a, b) => b.minutes - a.minutes);

                return (
                  <View
                    key={idx}
                    style={{
                      width: barWidth,
                      height: barHeight,
                      justifyContent: 'flex-end',
                      marginRight: idx === 23 ? 0 : BAR_GAP,
                      overflow: 'hidden',
                      borderTopLeftRadius: 4,
                      borderTopRightRadius: 4,
                    }}
                  >
                    {segments.map((seg) => {
                      const segHeight = (seg.minutes / 60) * height;
                      return (
                        <View
                          key={seg.categoryId}
                          style={{
                            width: '100%',
                            height: segHeight,
                            backgroundColor: seg.color,
                          }}
                        />
                      );
                    })}
                  </View>
                );
              })}
            </View>

            {/* Hour tick labels */}
            <View
              style={{
                flexDirection: 'row',
                position: 'absolute',
                bottom: -18, // below baseline
                width: '100%',
                justifyContent: 'space-between',
              }}
            >
              {hourLabels.map((label) => (
                <Text
                  key={label}
                  style={{ fontSize: 10, color: '#6C6C6C' }}
                >
                  {label}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </View>
    </DashboardCard>
  );
};

export default DailyHourBars; 