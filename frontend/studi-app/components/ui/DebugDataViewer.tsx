import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';

interface DebugDataViewerProps {
  data: any;
  label?: string;
}

const DebugDataViewer: React.FC<DebugDataViewerProps> = ({ data, label = 'Debug Data' }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Convert data to formatted JSON
  const formattedData = JSON.stringify(data, null, 2);

  return (
    <>
      <TouchableOpacity 
        onPress={() => setIsVisible(true)}
        style={styles.debugButton}
      >
        <ThemedText style={styles.debugButtonText}>Show Raw Data</ThemedText>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{label}</ThemedText>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <ThemedText style={styles.closeButton}>Close</ThemedText>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.dataScrollView}>
              <ThemedText style={styles.codeText}>{formattedData}</ThemedText>
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  debugButton: {
    padding: 8,
    backgroundColor: '#444',
    borderRadius: 4,
    alignSelf: 'center',
    marginVertical: 10,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    padding: 20,
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    color: Colors.light.primary,
    fontSize: 16,
  },
  dataScrollView: {
    flex: 1,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: Colors.light.text,
  },
});

export default DebugDataViewer; 