import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, colors } from '../Themed';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  isVisible: boolean;
  onClose: () => void;
  count: number;
  onConfirm: (newQty: number) => void; // Renamed for clarity
}

export const PassengerModal = ({ isVisible, onClose, count, onConfirm }: Props) => {
  const [localCount, setLocalCount] = useState(count);

  useEffect(() => {
    if (isVisible) setLocalCount(count);
  }, [isVisible, count]);

  const handleConfirm = () => {
    onConfirm(localCount);
    onClose();
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
          <Text style={styles.modalTitle}>Modifier les passagers</Text>
          
          <View style={styles.counterContainer}>
            <TouchableOpacity 
              style={styles.circleBtn} 
              onPress={() => setLocalCount(Math.max(1, localCount - 1))}
            >
              <Ionicons name="remove" size={24} color="#1E293B" />
            </TouchableOpacity>
            
            <Text style={styles.counterText}>{localCount}</Text>

            <TouchableOpacity 
              style={styles.circleBtn} 
              onPress={() => setLocalCount(localCount + 1)}
            >
              <Ionicons name="add" size={24} color="#1E293B" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmBtnText}>Valider</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', width: SCREEN_WIDTH * 0.85, borderRadius: 24, padding: 30, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 30 },
  counterContainer: { flexDirection: 'row', alignItems: 'center', gap: 40, marginBottom: 35 },
  circleBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  counterText: { fontSize: 32, fontWeight: 'bold', color: '#1E293B' },
  confirmBtn: { backgroundColor: colors.blue, width: '100%', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  confirmBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});