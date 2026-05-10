import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../../Themed';
import { AttributeFilterFragment } from '../../../saleor/api.generated';
import { FilterElement } from './FilterElement';

interface Props {
  activeFilters: Record<string, string[]>;
  clearFilters: () => Promise<void>;
  attributeFiltersData: AttributeFilterFragment[];
  addAttributeFilter: (attributeSlug: string, choiceSlug: string) => void;
}

export const SectionFilter = ({ activeFilters, clearFilters, attributeFiltersData, addAttributeFilter }: Props) => {
  const hasActiveFilters = Object.values(activeFilters).flat().length > 0;

  return (
    <View style={styles.container}>
      {/* {hasActiveFilters && (
        <TouchableOpacity onPress={clearFilters} style={styles.resetBtn}>
          <Text style={styles.resetText}>Réinitialiser tous les filtres</Text>
        </TouchableOpacity>
      )} */}

      {attributeFiltersData.map((attribute) => {
        const selectedChoices = activeFilters[attribute.slug!] || [];
        
        // Transform choices to FilterOption format
        const options = attribute.choices?.edges.map(edge => ({
          id: edge.node.id,
          label: edge.node.name || "",
          slug: edge.node.slug || "",
          chosen: selectedChoices.includes(edge.node.slug || "")
        }));

        return (
          <FilterElement
            key={attribute.id}
            label={attribute.name || ""}
            attributeSlug={attribute.slug!}
            optionToggle={addAttributeFilter}
            options={options}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 24,
  },
  resetBtn: { marginBottom: 20 },
  resetText: { color: "#E91E63", fontWeight: "600" },
});