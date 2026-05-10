import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../Themed';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  count: number;
  onConfirm: (newQty: number) => void; // Renamed for clarity
}

export const PassengerModal = ({ isVisible, onClose, count, onConfirm }: Props) => {
  const insets = useSafeAreaInsets();
  const [localCount, setLocalCount] = useState(count);

  useEffect(() => {
    if (isVisible) setLocalCount(count);
  }, [isVisible, count]);

  const handleConfirm = () => {
    onConfirm(localCount);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalOverlay} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.dragHandle} />
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>Nombre de passagers</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.8}>
              <Ionicons name="close" size={18} color="#000000" />
            </TouchableOpacity>
          </View>

          <Text style={styles.helperText}>Ajoutez ou retirez des passagers pour ce trajet.</Text>

          <View style={styles.counterContainer}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => setLocalCount(Math.max(1, localCount - 1))}
              activeOpacity={0.85}
            >
              <Ionicons name="remove" size={20} color="#000000" />
            </TouchableOpacity>

            <Text style={styles.counterText}>{localCount}</Text>

            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => setLocalCount(localCount + 1)}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={20} color="#000000" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.9}>
            <Text style={styles.confirmBtnText}>Appliquer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.5)',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#D7D8DB',
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    minHeight: 280,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D7D8DB',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F1F1',
    borderWidth: 1,
    borderColor: '#D7D8DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    color: '#000000',
    fontFamily: 'TTNormsPro-Bold',
  },
  helperText: {
    marginTop: 4,
    color: '#606060',
    fontSize: 13,
    fontFamily: 'TTNormsPro-Regular',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginTop: 26,
    marginBottom: 26,
  },
  circleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F1F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D7D8DB',
  },
  counterText: {
    fontSize: 34,
    color: '#000000',
    fontFamily: 'TTNormsPro-Bold',
    minWidth: 34,
    textAlign: 'center',
  },
  confirmBtn: {
    backgroundColor: '#EB1700',
    width: '100%',
    height: 50,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom:10
  },
  confirmBtnText: {
    color: 'white',
    fontFamily: 'TTNormsPro-Bold',
    fontSize: 16,
  },
});