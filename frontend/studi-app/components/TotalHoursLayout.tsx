import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

interface TotalHoursProps {
  StudyTime: string;
}

export default function TotalHours({ StudyTime }: TotalHoursProps) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Study Time</ThemedText>
      <ThemedText style={styles.time}>{StudyTime}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: Colors.light.surface,
    borderRadius: 15,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: Colors.light.text,
  },
  time: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
  },
}); 