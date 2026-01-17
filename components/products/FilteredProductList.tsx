import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProductCollection } from './ProductCollection';
import { Text, colors } from '../Themed';

import { AssignedAttributeValueFragment, AttributeFilterFragment, OrderDirection, ProductVariantSortField, ProductVariantWhereInput } from '../../saleor/api.generated';
import { SortModal } from './sort/SortModal';
import { FilterModal } from './filter/FilterModal';
import { getSortingOptions } from '../../utils/sorting';


interface Props {
    originData: AssignedAttributeValueFragment | null | undefined;
    destinationData: AssignedAttributeValueFragment | null | undefined;
    selectedDate: string;
    attributeFiltersData: AttributeFilterFragment[];
}

export const FilteredProductList = ({ originData, destinationData, selectedDate, attributeFiltersData }: Props) => {
    const insets = useSafeAreaInsets();
    const [showFilter, setShowFilter] = useState(false);
    const [showSort, setShowSort] = useState(false);
    const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
    const [sortBy, setSortBy] = useState<{
        field: ProductVariantSortField;
        direction: OrderDirection;
    } | null>(null);

    const currentSortLabel = useMemo(() => {
        if (!sortBy) return "Popularité";
        const options = getSortingOptions(sortBy);
        return options.find(o => o.chosen)?.label || "Trier";
    }, [sortBy]);

    const productVariantsWhere: ProductVariantWhereInput = useMemo(() => ({
        attributes: Object.entries(activeFilters)
            .filter(([_, values]) => values.length > 0)
            .map(([slug, values]) => ({ slug, value: { slug: { oneOf: values } } }))
    }), [activeFilters]);

    const activeFilterCount = Object.values(activeFilters).flat().length;

    const handleAddFilter = (slug: string, choice: string) => {
        setActiveFilters(prev => {
            const vals = prev[slug] || [];
            return { ...prev, [slug]: vals.includes(choice) ? vals.filter(v => v !== choice) : [...vals, choice] };
        });
    };

    if (!originData || !destinationData) return null;

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.barBtn} onPress={() => setShowFilter(true)}>
                    <MaterialCommunityIcons name="filter-variant" size={20} color={colors.blue} />
                    <Text style={[styles.btnText, activeFilterCount > 0 && { color: colors.blue }]}>Filtrer</Text>
                    {activeFilterCount > 0 && (
                        <View style={styles.badge}><Text style={styles.badgeText}>{activeFilterCount}</Text></View>
                    )}
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.barBtn} onPress={() => setShowSort(true)}>
                    <MaterialCommunityIcons name="sort-variant" size={20} color={colors.blue} />
                    <Text style={[styles.btnText, sortBy && { color: colors.blue }]}>
                        {currentSortLabel}
                    </Text>
                </TouchableOpacity>
            </View>

            <ProductCollection
                where={productVariantsWhere}
                sortBy={sortBy ? { field: sortBy.field, direction: sortBy.direction } : undefined}
                originSlug={originData.slug ?? ""}
                destinationSlug={destinationData.slug ?? ""}
                date={selectedDate}
            />

            <FilterModal
                isVisible={showFilter}
                onClose={() => setShowFilter(false)}
                insets={insets}
                activeFilters={activeFilters}
                attributeFiltersData={attributeFiltersData}
                onAddFilter={handleAddFilter}
                onClear={() => setActiveFilters({})}
                activeCount={activeFilterCount}
            />

            <SortModal
                isVisible={showSort}
                onClose={() => setShowSort(false)}
                currentSort={sortBy} // This is { field, direction } or null
                onSelect={(field, direction) => {
                    // If field is undefined (Popularité), we set sortBy to null
                    setSortBy(field && direction ? { field, direction } : null);
                }}
                insetsBottom={insets.bottom}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBar: { flexDirection: 'row', height: 50, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
    barBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: '100%' },
    btnText: { marginLeft: 8, fontWeight: '600', color: '#333', fontSize: 13, textTransform: "uppercase" },
    divider: { width: 1, height: '50%', backgroundColor: '#eee' },
    badge: { backgroundColor: colors.blue, borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
    badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
});