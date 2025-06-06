import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';

interface CancelSessionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function CancelSessionModal({ visible, onClose, onConfirm, isLoading }: CancelSessionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white rounded-lg p-6 w-full max-w-sm">
          <Text className="text-xl font-bold mb-4 text-center">Cancel Session?</Text>
          
          <Text className="text-gray-700 mb-6 text-center">
            Are you sure you want to cancel this study session?{'\n\n'}
            <Text className="font-semibold text-red-600">
              All session data will be lost and cannot be recovered.
            </Text>
          </Text>
          
          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              disabled={isLoading}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg"
            >
              <Text className="text-center text-gray-700">Keep Session</Text>
            </Pressable>
            
            <Pressable
              onPress={onConfirm}
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-red-500 rounded-lg"
            >
              <Text className="text-center text-white">
                {isLoading ? 'Cancelling...' : 'Cancel Session'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
} 