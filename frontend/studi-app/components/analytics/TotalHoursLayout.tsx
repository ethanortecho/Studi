import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { dashboardStyles as styles } from '@/styles/dashboard';


interface TotalHoursProps {
  StudyTime: string;
}

export default function TotalHours({ StudyTime }: TotalHoursProps) {
  return (
    <View style={styles.totalTimeContainer}>
      <ThemedText style={styles.title}>You've Studied for {StudyTime}</ThemedText>
    </View>
  );
}

