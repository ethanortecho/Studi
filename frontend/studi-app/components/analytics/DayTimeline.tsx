import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * A single day timeline row visualising study sessions along a 24-hour baseline.
 *
 * The component purposefully keeps its layout calculations identical to the existing
 * logic used in `WeeklyHeatMap`, so visual alignment stays consistent.
 */

// Session shape (duplicated from WeeklyHeatMap for now – consider extracting to a shared file)
export interface DaySession {
  startHour: number;
  endHour: number;
  startMinute: number;
  endMinute: number;
}

// Time-window description
export interface TimeWindow {
  startHour: number;
  endHour: number;
  totalHours: number;
  timeLabels: string[]; // not needed here but kept for type parity
}

interface Props {
  dayLabel: string;
  sessions: DaySession[];
  timeWindow: TimeWindow;
  /**
   * Optional press handler for future interactive tooltip support.
   * Receives the pressed session object.
   */
  onBarPress?: (session: DaySession) => void;
  /** Override default timeline width in px (defaults to 280). */
  timelineWidth?: number;
  /** Override default barHeight in px (defaults to 8). */
  barHeight?: number;
}

const DEFAULT_TIMELINE_WIDTH = 256;
const DEFAULT_BAR_HEIGHT = 8;

const TIMELINE_COLOR = '#3A3D4D';

const DayTimeline: React.FC<Props> = ({
  dayLabel,
  sessions,
  timeWindow,
  onBarPress,
  timelineWidth = DEFAULT_TIMELINE_WIDTH,
  barHeight = DEFAULT_BAR_HEIGHT,
}) => {
  /* ---------------------------------- helpers --------------------------------- */
  /**
   * Merge overlapping sessions so they render as a single, wider bar.
   */
  const mergedSessions = React.useMemo(() => {
    return sessions.reduce((acc: DaySession[], session) => {
      const sessionStart = session.startHour + session.startMinute / 60;
      const sessionEnd = session.endHour + session.endMinute / 60;

      const overlapIndex = acc.findIndex((existing) => {
        const existingStart = existing.startHour + existing.startMinute / 60;
        const existingEnd = existing.endHour + existing.endMinute / 60;
        return sessionStart < existingEnd && sessionEnd > existingStart;
      });

      if (overlapIndex !== -1) {
        // merge into existing
        const existing = acc[overlapIndex];
        const existingStart = existing.startHour + existing.startMinute / 60;
        const existingEnd = existing.endHour + existing.endMinute / 60;
        const newStart = Math.min(sessionStart, existingStart);
        const newEnd = Math.max(sessionEnd, existingEnd);

        existing.startHour = Math.floor(newStart);
        existing.startMinute = Math.round((newStart % 1) * 60);
        existing.endHour = Math.floor(newEnd);
        existing.endMinute = Math.round((newEnd % 1) * 60);
      } else {
        acc.push({ ...session });
      }

      return acc;
    }, []);
  }, [sessions]);

  /* --------------------------------- render ----------------------------------- */
  return (
    <View style={styles.rowContainer}>
      {/* Day label */}
      <Text style={styles.dayLabel}>{dayLabel}</Text>

      {/* Timeline container */}
      <View style={[styles.timelineContainer, { width: timelineWidth, height: barHeight }]}>        
        {/* Baseline line */}
        <View style={[styles.baseline, { backgroundColor: TIMELINE_COLOR }]} />

        {/* Session bars */}
        {mergedSessions.map((session, idx) => {
          const sessionStart = session.startHour + session.startMinute / 60;
          const sessionEnd = session.endHour + session.endMinute / 60;

          const startPercent = ((sessionStart - timeWindow.startHour) / timeWindow.totalHours) * 100;
          const widthPercent = ((sessionEnd - sessionStart) / timeWindow.totalHours) * 100;

          const barStyle = {
            left: `${Math.max(0, startPercent)}%`,
            width: `${Math.min(100 - Math.max(0, startPercent), widthPercent)}%`,
            height: barHeight,
          } as const;

          const BarComponent = onBarPress ? TouchableOpacity : View;

          return (
            <BarComponent
              key={idx}
              style={[styles.sessionBar, barStyle]}
              onPress={onBarPress ? () => onBarPress(session) : undefined}
            />
          );
        })}
      </View>
    </View>
  );
};

/* --------------------------------- styles ----------------------------------- */
const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20, // space between rows (tighten density)
  },
  dayLabel: {
    width: 48, // fixed column width (~"Mon" text width + padding)
    marginRight: 12,
    fontSize: 10,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  timelineContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  baseline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderRadius: 0.5,
    opacity: 0.6,
  },
  sessionBar: {
    position: 'absolute',
    backgroundColor: '#5A4FCF', // accent purple (match bg-accent tailwind class)
    borderRadius: 4,
  },
});

export default DayTimeline; 