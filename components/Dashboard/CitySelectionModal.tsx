import React, { useState } from 'react';
import {
    Modal,
    View,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Keyboard,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Themed';
import { EllipsisLoader } from '../EllipsisLoader';
import { AssignedAttributeValueFragment } from '../../saleor/api.generated';

interface CityProps {
    visible: boolean;
    title: string;
    cities: AssignedAttributeValueFragment[];
    loading?: boolean;
    errorMessage?: string;
    onClose: () => void;
    onSelect: (city: AssignedAttributeValueFragment) => void;
}

export const CitySelectionModal = ({
    visible,
    title,
    cities,
    loading = false,
    errorMessage,
    onClose,
    onSelect,
}: CityProps) => {
    const [searchText, setSearchText] = useState("");

    // 1. Sort the cities alphabetically by name
    const sortedCities = [...cities].sort((a, b) => {
        const nameA = a.name?.toLowerCase() || "";
        const nameB = b.name?.toLowerCase() || "";
        return nameA.localeCompare(nameB);
    });

    // 2. Filter the already sorted list
    const filtered = searchText.length >= 1
        ? sortedCities.filter(c => c.name?.toLowerCase().includes(searchText.toLowerCase()))
        : sortedCities;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            statusBarTranslucent
            navigationBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.8}>
                        <Ionicons name="close" size={20} color="000000" />
                    </TouchableOpacity>
                    <Text style={styles.title}>{title}</Text>
                    <View style={{ width: 36 }} />
                </View>

                <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={20} color="#606060" />
                    <TextInput
                        autoFocus
                        style={styles.input}
                        placeholder="Rechercher une ville..."
                        placeholderTextColor="#606060"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>

                {loading ? (
                    <View style={styles.stateWrap}>
                        <EllipsisLoader color="#EB1700" />
                        <Text style={styles.stateText}>Chargement des villes...</Text>
                    </View>
                ) : errorMessage ? (
                    <View style={styles.stateWrap}>
                        <Text style={styles.stateText}>Impossible de charger les villes.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filtered}
                        keyboardShouldPersistTaps="handled"
                        keyExtractor={(item, index) => item.slug || item.name || index.toString()}
                        ListEmptyComponent={
                            <View style={styles.stateWrap}>
                                <Text style={styles.stateText}>Aucune ville disponible.</Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.item}
                                onPress={() => {
                                    onSelect(item);
                                    setSearchText("");
                                    Keyboard.dismiss();
                                }}
                            >
                                <Ionicons name="location-outline" size={20} color="#EB1700" />
                                <Text style={styles.itemText}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: (StatusBar.currentHeight ?? 0) + 14,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#D7D8DB',
    },
    title: { fontSize: 19, color: '#000000', fontFamily: 'TTNormsPro-Bold' },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        // backgroundColor: "#F1F1F1",
        borderWidth: 0,
        borderColor: "#D7D8DB",
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F1F1',
        margin: 20,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#D7D8DB',
    },
    input: { flex: 1, marginLeft: 10, fontSize: 16, color: '#000000', fontFamily: 'TTNormsPro-Regular' },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F1F1',
    },
    itemText: { marginLeft: 12, fontSize: 16, color: '#000000', fontFamily: 'TTNormsPro-Regular' },
    stateWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36 },
    stateText: { marginTop: 10, color: '#606060', fontSize: 15, fontFamily: 'TTNormsPro-Regular' },
});