import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, colors } from '../../Themed';
import { TripDetailsContent } from './TripDetailsContent';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type AttributeValueType = {
    __typename?: "AttributeValue";
    name?: string | null;
    slug?: string | null;
    value?: string | null;
}[] | undefined

interface TripDetailsProps {
    isVisible: boolean;
    onClose: () => void;
    onBook: () => void;
    loading?: boolean;
    data: {
        departureTime: string;
        arrivalTime: string;
        departureStation: string;
        arrivalStation: string;
        duration: string;
        company: string;
        price: string;
        ameneties: AttributeValueType;
    };
}

export const TripDetailsModal = ({ isVisible, onClose, onBook, data, loading }: TripDetailsProps) => {

    return (
        <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.content}>
                    <View style={styles.dragHandle} />

                    <View style={styles.header}>
                        <Text style={styles.title}>Itinéraire - {data.company}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <TripDetailsContent data={data} />
                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={styles.modalBookButton}
                            onPress={() => {
                                onClose(); 
                                setTimeout(() => {
                                    onBook();
                                }, 100);
                            }}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.modalBookText}>Réserver</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    content: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        height: SCREEN_HEIGHT * 0.55, // Increased slightly to accommodate amenities
        paddingBottom: 30,
    },
    dragHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 10 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
    
    modalFooter: { justifyContent: 'center', alignItems: 'center', paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    modalBookButton: { backgroundColor: colors.red, paddingVertical: 14, paddingHorizontal: 60, borderRadius: 12 },
    modalBookText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});