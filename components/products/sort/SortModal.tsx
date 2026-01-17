import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Text as RNText } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../Themed';
import { ProductVariantSortField, OrderDirection } from '../../../saleor/api.generated';
import { getSortingOptions } from '../../../utils/sorting';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  currentSort: { field: ProductVariantSortField, direction: OrderDirection } | null;
  onSelect: (field?: ProductVariantSortField, direction?: OrderDirection) => void;
  insetsBottom: number;
}
export type SortOption = { label: string; field: ProductVariantSortField; direction: OrderDirection };


export const SortModal = ({ isVisible, onClose, currentSort, onSelect, insetsBottom }: Props) => {
  // Logic from Next.js: compute options based on current selection
  const options = getSortingOptions(currentSort);

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.container, { paddingBottom: insetsBottom + 20 }]}>
          
          <View style={styles.header}>
            <View style={styles.handle} />
            <RNText style={styles.title}>Trier par</RNText>
          </View>

          {options.map((option) => (
            <TouchableOpacity 
              key={option.label} 
              style={styles.option} 
              onPress={() => { 
                // Call onSelect with undefined for the default option (Popularité)
                onSelect(option.field, option.direction); 
                onClose(); 
              }}
            >
              <RNText style={[
                styles.optionText, 
                option.chosen && styles.activeText
              ]}>
                {option.label}
              </RNText>
              
              {option.chosen && (
                <MaterialCommunityIcons name="check" size={22} color={colors.blue} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    justifyContent: 'flex-end' 
  },
  container: { 
    backgroundColor: 'white', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    paddingHorizontal: 20,
    // Add shadow for better mobile feel
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20
  },
  header: { 
    paddingVertical: 15, 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    marginBottom: 10
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  option: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f9f9f9',
    alignItems: 'center'
  },
  optionText: { fontSize: 16, color: '#444' },
  activeText: { color: colors.blue, fontWeight: 'bold' },
});