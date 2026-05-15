import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Themed';

interface DateProps {
  visible: boolean;
  date: Date;
  onClose: () => void;
  onSelect: (date: Date) => void;
}

export const DateSelectionModal = ({ visible, date, onClose, onSelect }: DateProps) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = React.useState(
    new Date(date.getFullYear(), date.getMonth(), 1)
  );

  React.useEffect(() => {
    if (!visible) return;
    setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  }, [visible, date]);

  const monthLabel = currentMonth.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  const monthLabelFormatted = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedDateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  const firstDayIndex = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();
  const leadingEmpty = (firstDayIndex + 6) % 7;
  const totalCells = Math.ceil((leadingEmpty + daysInMonth) / 7) * 7;

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="fullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'left', 'bottom']}>
        <View style={styles.modalContainer}>
          
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Ionicons name="close" size={20} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Choisir une date</Text>
            <View style={{ width: 36 }} /> 
          </View>

          {/* Picker Wrapper - Centering the calendar */}
          <View style={styles.pickerWrapper}>
            <View style={styles.datePicker}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthNavButton}>
                  <Ionicons name="chevron-back" size={20} color="#EB1700" />
                </TouchableOpacity>
                <Text style={styles.monthLabel}>{monthLabelFormatted}</Text>
                <TouchableOpacity onPress={goToNextMonth} style={styles.monthNavButton}>
                  <Ionicons name="chevron-forward" size={20} color="#EB1700" />
                </TouchableOpacity>
              </View>

              <View style={styles.weekdayRow}>
                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                  <Text key={d} style={styles.weekdayText}>{d}</Text>
                ))}
              </View>

              <View style={styles.grid}>
                {Array.from({ length: totalCells }).map((_, idx) => {
                  const dayNum = idx - leadingEmpty + 1;
                  const isCurrentMonthDay = dayNum > 0 && dayNum <= daysInMonth;
                  if (!isCurrentMonthDay) {
                    return (
                      <View key={`empty-${idx}`} style={styles.dayCellShell}>
                        <View style={styles.dayCellInnerEmpty} />
                      </View>
                    );
                  }

                  const dayDate = new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth(),
                    dayNum
                  );
                  const isPast = dayDate < startOfToday;
                  const isSelected = isSameDay(dayDate, selectedDateStart);
                  const isToday = isSameDay(dayDate, startOfToday);

                  return (
                    <View
                      key={`${currentMonth.getMonth()}-${dayNum}`}
                      style={styles.dayCellShell}
                    >
                      <TouchableOpacity
                        style={[
                          styles.dayCellInner,
                          isSelected && styles.dayCellSelected,
                          isToday && !isSelected && styles.dayCellToday,
                        ]}
                        disabled={isPast}
                        onPress={() => onSelect(dayDate)}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isPast && styles.dayTextDisabled,
                            isSelected && styles.dayTextSelected,
                            isToday && !isSelected && styles.dayTextToday,
                          ]}
                        >
                          {dayNum}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
              <Text style={styles.confirmButtonText}>Valider la date</Text>
            </TouchableOpacity>
          </View>
        </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalContainer: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1, 
    borderBottomColor: '#D7D8DB' 
  },
  backButton: { 
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    // backgroundColor: "#F1F1F1",
    borderWidth: 0,
    borderColor: "#D7D8DB",
  },
  modalTitle: { 
    fontSize: 18, 
    color: '#000000',
    fontFamily: 'TTNormsPro-Bold',
  },
  pickerWrapper: { 
    flex: 1, 
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  datePicker: {
    width: '100%',
    borderWidth: 0,
    borderColor: "#D7D8DB",
    borderRadius: 16,
    paddingBottom: 14,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  monthNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F1F1",
  },
  monthLabel: {
    color: "#000000",
    fontSize: 18,
    fontFamily: "TTNormsPro-Bold",
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCellShell: {
    width: "14.2857%",
    aspectRatio: 1,
    padding: 3,
  },
  dayCellInner: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  dayCellInnerEmpty: {
    width: "100%",
    height: "100%",
  },
  dayCellSelected: {
    backgroundColor: "#EB1700",
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: "#02838A",
  },
  dayText: {
    color: "#000000",
    fontSize: 15,
    fontFamily: "TTNormsPro-Regular",
  },
  dayTextDisabled: {
    color: "#D7D8DB",
  },
  dayTextSelected: {
    color: "#FFFFFF",
    fontFamily: "TTNormsPro-Bold",
  },
  dayTextToday: {
    color: "#02838A",
  },
  modalFooter: { 
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 0, 
    borderTopColor: '#D7D8DB', 
  },
  confirmButton: { 
    backgroundColor: '#EB1700', 
    height: 55, 
    borderRadius: 999, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  confirmButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontFamily: 'TTNormsPro-Bold',
  },
});