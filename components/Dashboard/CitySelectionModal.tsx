import React, { useState } from 'react';
import { Modal, View, TextInput, TouchableOpacity, FlatList, StyleSheet, Keyboard } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../Themed';
import { AssignedAttributeValueFragment } from '../../saleor/api.generated';

interface CityProps {
    visible: boolean;
    title: string;
    cities: AssignedAttributeValueFragment[];
    onClose: () => void;
    onSelect: (city: AssignedAttributeValueFragment) => void;
}

export const CitySelectionModal = ({ visible, title, cities, onClose, onSelect }: CityProps) => {
    const [searchText, setSearchText] = useState("");

    // 1. Sort the cities alphabetically by name
    const sortedCities = [...cities].sort((a, b) => {
        const nameA = a.name?.toLowerCase() || "";
        const nameB = b.name?.toLowerCase() || "";
        return nameA.localeCompare(nameB);
    });

    // 2. Filter the already sorted list
    const filtered = searchText.length >= 1
        ? sortedCities.filter(c => c.name?.toLowerCase().includes(searchText.toLowerCase())).slice(0, 10)
        : sortedCities.slice(0, 10); // Changed from 5 to 10 for better UX in a sorted list

    return (
        <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
            {/* ... Rest of your component remains exactly the same ... */}
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>{title}</Text>
                    <View style={{ width: 28 }} />
                </View>

                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#999" />
                    <TextInput
                        autoFocus
                        style={styles.input}
                        placeholder="Rechercher une ville..."
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>

                <FlatList
                    data={filtered}
                    // "handled" means the tap will trigger the item's onPress 
                    // even if the keyboard is open.
                    keyboardShouldPersistTaps="handled"
                    keyExtractor={(item, index) => item.slug || item.name || index.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.item}
                            onPress={() => {
                                onSelect(item);
                                setSearchText(""); 
                                Keyboard.dismiss();
                            }}
                        >
                            <MaterialCommunityIcons name="map-marker-outline" size={22} color="#666" />
                            <Text style={styles.itemText}>{item.name}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', paddingTop: 50 },
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
    title: { fontSize: 18, fontWeight: 'bold' },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', margin: 20, padding: 12, borderRadius: 10 },
    input: { flex: 1, marginLeft: 10, fontSize: 16 },
    item: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    itemText: { marginLeft: 15, fontSize: 16 }
});