import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from "react-native";
import { Text, colors } from "../../Themed";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface FilterOption {
	id: string;
	label: string;
	slug: string;
	chosen: boolean;
}

interface props {
    label: string;
	attributeSlug: string;
	options?: FilterOption[];
	optionToggle: (attributeSlug: string, choiceSlug: string) => void;
}

export function FilterElement({ label, attributeSlug, options, optionToggle }: props) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(!isOpen);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={toggleOpen}>
        <Text style={styles.label}>{label}</Text>
        <MaterialCommunityIcons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#666" 
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.optionsContainer}>
          {options?.map((option) => (
            <TouchableOpacity 
              key={option.id} 
              style={[styles.optionRow, option.chosen && styles.optionRowActive]}
              onPress={() => optionToggle(attributeSlug, option.slug)}
            >
              <Text style={[styles.optionLabel, option.chosen && styles.optionLabelActive]}>
                {option.label}
              </Text>
              {option.chosen && (
                <MaterialCommunityIcons name="check" size={18} color={colors.blue} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: 'white', borderRadius: 8, marginBottom: 12, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  optionsContainer: { paddingHorizontal: 16, paddingBottom: 12 },
  optionRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  optionRowActive: { backgroundColor: '#f0f7ff', marginHorizontal: -16, paddingHorizontal: 16 },
  optionLabel: { fontSize: 14, color: '#666' },
  optionLabelActive: { color: colors.blue, fontWeight: '600' }
});