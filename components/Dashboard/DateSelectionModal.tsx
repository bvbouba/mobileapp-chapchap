import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Text } from '../Themed';

interface DateProps {
  visible: boolean;
  date: Date;
  onClose: () => void;
  onSelect: (date: Date) => void;
}

export const DateSelectionModal = ({ visible, date, onClose, onSelect }: DateProps) => {
  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      {/* SafeAreaView ensures content stays below the notch/status bar */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.modalContainer}>
          
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Choisir une date</Text>
            <View style={{ width: 40 }} /> 
          </View>

          {/* Picker Wrapper - Centering the calendar */}
          <View style={styles.pickerWrapper}>
            <DateTimePicker
              value={date}
              mode="date"
              display="inline" 
              minimumDate={new Date()}
              onChange={(event: DateTimePickerEvent, d?: Date) => d && onSelect(d)}
              accentColor="#E91E63"
              style={styles.datePicker} // Apply explicit style
            />
          </View>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
              <Text style={styles.confirmButtonText}>SÉLECTIONNER CETTE DATE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContainer: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  backButton: { 
    padding: 5 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold',
    color: '#333'
  },
  pickerWrapper: { 
    flex: 1, 
    alignItems: 'center',    // Centers the picker horizontally
    paddingHorizontal: 10,   // Small padding to prevent touching edges
  },
  datePicker: {
    width: '100%',           // Ensures it uses available width
    height: 400,             // Gives the calendar enough room to breathe
  },
  modalFooter: { 
    padding: 20, 
    borderTopWidth: 1, 
    borderTopColor: '#eee', 
    paddingBottom: Platform.OS === 'ios' ? 20 : 20 
  },
  confirmButton: { 
    backgroundColor: '#E91E63', 
    height: 55, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  confirmButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});