import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, colors } from '../../Themed';
import { AttributeFilterFragment } from '../../../saleor/api.generated';
import { SectionFilter } from './SectionFilter';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  insets: { top: number; bottom: number };
  activeFilters: Record<string, string[]>;
  attributeFiltersData: AttributeFilterFragment[];
  onAddFilter: (slug: string, choice: string) => void;
  onClear: () => void;
  activeCount: number;
}

export const FilterModal = ({ 
  isVisible, onClose, insets, activeFilters, attributeFiltersData, onAddFilter, onClear, activeCount 
}: Props) => (
  <Modal visible={isVisible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
    <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
      <View style={styles.modalHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.blue} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerCenter} pointerEvents="none">
          <Text style={styles.modalTitle}>Filtres</Text>
        </View>
        <View style={styles.headerRight}>
          {activeCount > 0 && (
            <TouchableOpacity onPress={onClear}>
              <Text style={styles.resetText}>Effacer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
        <SectionFilter
          activeFilters={activeFilters}
          clearFilters={async () => onClear()}
          attributeFiltersData={attributeFiltersData}
          addAttributeFilter={onAddFilter}
        />
      </ScrollView>

      <View style={[styles.modalFooter, { paddingBottom: insets.bottom || 20 }]}>
        <TouchableOpacity style={styles.applyButton} onPress={onClose}>
          <Text style={styles.applyButtonText}>Voir les résultats</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: 'white' },
  modalHeader: { flexDirection: 'row', height: 56, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center', position: 'relative' },
  headerLeft: { flex: 1, paddingLeft: 16 },
  headerCenter: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  headerRight: { flex: 1, paddingRight: 16, alignItems: 'flex-end' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  resetText: { color: colors.blue, fontWeight: 'bold' },
  modalBody: { flex: 1, backgroundColor: '#F8F9FA' },
  modalFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  applyButton: { backgroundColor: colors.red, padding: 16, borderRadius: 12, alignItems: 'center' },
  applyButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  backButton: { padding: 4 },
});