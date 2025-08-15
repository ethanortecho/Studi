import React, { useMemo, useContext } from 'react';
import { View, Text } from 'react-native';
import { TimelineSession, CategoryMetadata } from '@/types/api';
import { StudySessionContext } from '@/context/StudySessionContext';
import { getLocalDateComponents } from '@/utils/timezoneUtils';

interface Props {
  timelineData: TimelineSession[];
  categoryMetadata: { [key: string]: CategoryMetadata };
  categoryDurations?: { [key: string]: number };
  height?: number;
  width?: number;
  isEmpty?: boolean;
}

const GRID_COLOUR = '#3A3D4D';
const BAR_GAP = 2;

/**
 * DailyHourBarsInner - Inner component without DashboardCard wrapper
 * Used inside MultiChartContainer
 */
const DailyHourBarsInner: React.FC<Props> = ({
  timelineData,
  categoryMetadata,
  height = 100,
  width = 300,
  isEmpty = false,
}) => {
  const { userTimezone } = useContext(StudySessionContext);
  
  if (isEmpty) {
    return null;
  }

  type HourData = {
    totalMinutes: number;
    segments: {
      categoryId: string;
      minutes: number;
      color: string;
    }[];
  };

  const hoursData: HourData[] = useMemo(() => {
    const categoryNameToMeta = Object.entries(categoryMetadata).reduce((acc, [id, meta]: [string, any]) => {
      acc[meta.name] = meta;
      return acc;
    }, {} as { [key: string]: { color: string; name: string } });

    const base: HourData[] = Array.from({ length: 24 }, () => ({
      totalMinutes: 0,
      segments: [],
    }));

    if (!timelineData || timelineData.length === 0) return base;

    timelineData.forEach((session) => {
      // Handle both 'breakdowns' (old API) and 'category_blocks' (new API)
      const breakdowns = session.breakdowns || session.category_blocks || [];
      breakdowns.forEach((bd) => {
        // Handle both formats: 
        // Old API: category is an ID number
        // New API: category is the name string directly
        let categoryName: string;
        let meta: any;
        
        if (typeof bd.category === 'string') {
          // New API format - category is already the name
          categoryName = bd.category;
          // Find metadata by name
          meta = Object.values(categoryMetadata).find((m: any) => m.name === categoryName);
        } else {
          // Old API format - category is an ID
          const categoryId = bd.category.toString();
          categoryName = categoryMetadata[categoryId]?.name;
          meta = categoryMetadata[categoryId];
        }
        
        if (!categoryName || categoryName === 'Break') return;
        if (!meta) return;

        const startComponents = getLocalDateComponents(bd.start_time, userTimezone);
        const endComponents = getLocalDateComponents(bd.end_time, userTimezone);
        
        const start = new Date(startComponents.year, startComponents.month, startComponents.day, startComponents.hour, startComponents.minute);
        const end = new Date(endComponents.year, endComponents.month, endComponents.day, endComponents.hour, endComponents.minute);
        
        let current = new Date(start);

        while (current < end) {
          const hourIdx = current.getHours();
          const nextHour = new Date(current);
          nextHour.setHours(current.getHours() + 1, 0, 0, 0);

          const segmentEnd = end < nextHour ? end : nextHour;
          const diffMinutes = (segmentEnd.getTime() - current.getTime()) / 60000;

          const hour = base[hourIdx];
          let seg = hour.segments.find((s) => s.categoryId === categoryName);
          if (!seg) {
            seg = {
              categoryId: categoryName,
              minutes: 0,
              color: meta?.color || '#E5E7EB',
            };
            hour.segments.push(seg);
          }
          seg.minutes += diffMinutes;
          hour.totalMinutes += diffMinutes;
          current = segmentEnd;
        }
      });
    });

    return base.map((hour) => ({
      totalMinutes: Math.min(60, Math.round(hour.totalMinutes)),
      segments: hour.segments.map((s) => ({
        ...s,
        minutes: Math.round(s.minutes),
      })),
    }));
  }, [timelineData, categoryMetadata, userTimezone]);

  const DEFAULT_BAR_WIDTH = 10;
  const computedWidth = width ?? DEFAULT_BAR_WIDTH * 24 + BAR_GAP * 23;
  const barWidth = (computedWidth - BAR_GAP * 23) / 24;

  const hourLabels = ['12am', '6am', '12pm', '6pm', '12am'];
  const hourLabelPositions = [0, 6, 12, 18, 24];

  return (
    <View className="px-6 pb-4">
      {/* Chart area */}
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <View style={{ width: computedWidth, position: 'relative' }}>
          {/* Horizontal grid lines */}
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

          {/* Vertical grid lines at time markers */}
          {hourLabelPositions.map((hourPosition, index) => {
            const xPosition = (hourPosition / 24) * computedWidth;
            return (
              <View
                key={`vertical-grid-${index}`}
                style={{
                  position: 'absolute',
                  left: xPosition,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  backgroundColor: GRID_COLOUR,
                  opacity: 0.4,
                  borderStyle: 'dashed',
                }}
              />
            );
          })}

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
              bottom: -18,
              width: '100%',
              justifyContent: 'space-between',
            }}
          >
            {hourLabels.map((label, index) => (
              <Text
                key={`${label}-${index}`}
                style={{ fontSize: 10, color: '#6C6C6C' }}
              >
                {label}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

export default DailyHourBarsInner;