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

const BAR_GAP = 4;

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
  // Use surface color for grid lines
  const gridColor = '#262748';
  
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

  const DEFAULT_BAR_WIDTH = 8; // Slimmer bars like Apple
  const computedWidth = width ?? DEFAULT_BAR_WIDTH * 24 + BAR_GAP * 23;
  const barWidth = (computedWidth - BAR_GAP * 23) / 24;

  // Updated to match Apple's style - no 12am at the end
  const hourLabels = ['12 AM', '6 AM', '12 PM', '6 PM'];
  const hourLabelPositions = [0, 6, 12, 18];

  return (
    <View className="pb-4">
      {/* Chart area with Y-axis labels */}
      <View style={{ flexDirection: 'row' }}>
        {/* Y-axis labels */}
        <View style={{ width: 40, height, justifyContent: 'space-between', marginRight: 8 }}>
          <Text style={{ fontSize: 10, color: '#6B7280', textAlign: 'right' }}>60m</Text>
          <Text style={{ fontSize: 10, color: '#6B7280', textAlign: 'right' }}>30m</Text>
          <Text style={{ fontSize: 10, color: '#6B7280', textAlign: 'right' }}>0</Text>
        </View>
        
        {/* Chart with bars and grid */}
        <View style={{ width: computedWidth, position: 'relative' }}>
          {/* Horizontal grid lines - 5 lines total like Apple */}
          {[0, 0.25, 0.5, 0.75, 1].map((position, index) => (
            <View
              key={`h-grid-${index}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: height * position,
                height: 1,
                backgroundColor: gridColor,
                opacity: 1,
              }}
            />
          ))}

          {/* Vertical dotted lines at time markers - more subtle */}
          {hourLabelPositions.map((hourPosition, index) => {
            const xPosition = (hourPosition / 24) * computedWidth;
            // Create dotted effect with multiple small views
            return (
              <View
                key={`vertical-grid-${index}`}
                style={{
                  position: 'absolute',
                  left: xPosition,
                  top: 0,
                  bottom: 0,
                  width: 1,
                }}
              >
                {Array.from({ length: 10 }).map((_, dotIndex) => (
                  <View
                    key={`dot-${dotIndex}`}
                    style={{
                      height: height / 20,
                      backgroundColor: gridColor,
                      opacity: 0.8,
                      marginBottom: height / 20,
                    }}
                  />
                ))}
              </View>
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
                    borderTopLeftRadius: 2,
                    borderTopRightRadius: 2,
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
              position: 'absolute',
              bottom: -20,
              width: '100%',
            }}
          >
            {hourLabels.map((label, index) => {
              const xPosition = (hourLabelPositions[index] / 24) * computedWidth;
              return (
                <Text
                  key={`${label}-${index}`}
                  style={{ 
                    fontSize: 10, 
                    color: '#6B7280',
                    position: 'absolute',
                    left: xPosition - 20, // Center the label
                    width: 40,
                    textAlign: 'center'
                  }}
                >
                  {label}
                </Text>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};

export default DailyHourBarsInner;