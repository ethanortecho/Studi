import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SessionStats {
  duration: number; // in seconds
  categoryName: string;
  categoryColor: string;
  startTime: Date;
  endTime: Date;
}

interface SessionStatsModalProps {
  visible: boolean;
  stats: SessionStats | null;
  onClose: () => void;
  onReturnHome: () => void;
}

export default function SessionStatsModal({ visible, stats, onClose, onReturnHome }: SessionStatsModalProps) {
  if (!stats) return null;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        {/* Header */}
        <View style={{
          alignItems: 'center',
          padding: 24,
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
          backgroundColor: 'white'
        }}>
          <Text style={{ fontSize: 24, fontWeight: '600', color: '#1f2937' }}>
            Session Complete
          </Text>
        </View>

        <View style={{ flex: 1, padding: 24 }}>
          {/* Main Stats Card */}
          <View style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 32,
            marginBottom: 24,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3
          }}>
            {/* Duration */}
            <Text style={{
              fontSize: 48,
              fontWeight: '300',
              color: '#1f2937',
              marginBottom: 8
            }}>
              {formatDuration(stats.duration)}
            </Text>
            
            {/* Category */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 24
            }}>
              <View style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: stats.categoryColor,
                marginRight: 8
              }} />
              <Text style={{
                fontSize: 18,
                fontWeight: '500',
                color: '#374151'
              }}>
                {stats.categoryName}
              </Text>
            </View>

            {/* Time Range */}
            <View style={{
              backgroundColor: '#f3f4f6',
              borderRadius: 12,
              padding: 16,
              width: '100%'
            }}>
              <Text style={{
                fontSize: 14,
                color: '#6b7280',
                textAlign: 'center',
                marginBottom: 4
              }}>
                Study Session
              </Text>
              <Text style={{
                fontSize: 16,
                fontWeight: '500',
                color: '#374151',
                textAlign: 'center'
              }}>
                {formatTime(stats.startTime)} - {formatTime(stats.endTime)}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{
          padding: 24,
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          gap: 12
        }}>
          <Pressable
            onPress={onReturnHome}
            style={{
              width: '100%',
              paddingVertical: 16,
              backgroundColor: '#10b981',
              borderRadius: 16
            }}
          >
            <Text style={{
              textAlign: 'center',
              fontSize: 18,
              fontWeight: '500',
              color: 'white'
            }}>
              Return Home
            </Text>
          </Pressable>
          
          <Pressable
            onPress={onClose}
            style={{
              width: '100%',
              paddingVertical: 12
            }}
          >
            <Text style={{
              textAlign: 'center',
              fontSize: 16,
              color: '#6b7280'
            }}>
              Close
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
} 