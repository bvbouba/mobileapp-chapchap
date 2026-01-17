import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, colors } from '../../Themed';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type AttributeValueType = {
    __typename?: "AttributeValue";
    name?: string | null;
    slug?: string | null;
    value?: string | null;
}[] | undefined

interface Props {
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

// Updated Helper to map slugs to specific icons
const AmenityIcon = ({ slug }: { slug: string }) => {
    switch (slug) {
        case 'wi-fi':
            return <Ionicons name="wifi" size={16} color="#64748B" />;
        case 'climatisation':
            return <Ionicons name="snow" size={16} color="#64748B" />;
        case 'toillettes':
            return <MaterialCommunityIcons name="toilet" size={16} color="#64748B" />;
        case 'television':
            return <Ionicons name="tv-outline" size={16} color="#64748B" />;
        default:
            return <Ionicons name="checkmark-circle-outline" size={16} color="#64748B" />;
    }
};

export const TripDetailsContent = ({ data }: Props) => {
    const amenitiesList = data.ameneties || [];
    return (
                    <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
                        {/* Departure */}
                        <View style={styles.row}>
                            <View style={styles.timeline}>
                                <View style={[styles.dot, { backgroundColor: colors.red }]} />
                                <View style={styles.line} />
                            </View>
                            <View style={styles.info}>
                                <View style={styles.departureHeader}>
                                    <Text style={styles.label}>Départ</Text>
                                    <Text style={styles.inlinePrice}>{data.price}</Text>
                                </View>
                                <Text style={styles.time}>{data.departureTime}</Text>
                                <View style={styles.stationRow}>
                                    <Ionicons name="bus-outline" size={14} color="#64748B" />
                                    <Text style={styles.station}>{data.departureStation}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Duration */}
                        <View style={styles.row}>
                            <View style={styles.timeline}>
                                <View style={styles.line} />
                            </View>
                            <View style={styles.durationBox}>
                                <Text style={styles.durationText}>Voyage de {data.duration}</Text>
                            </View>
                        </View>

                        {/* Arrival */}
                        <View style={styles.row}>
                            <View style={styles.timeline}>
                                <View style={[styles.dot, { backgroundColor: colors.blue }]} />
                            </View>
                            <View style={styles.info}>
                                <Text style={styles.label}>Arrivée</Text>
                                <Text style={styles.time}>{data.arrivalTime}</Text>
                                <View style={styles.stationRow}>
                                    <Ionicons name="location-outline" size={14} color="#64748B" />
                                    <Text style={styles.station}>{data.arrivalStation}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Amenities Section: Now mapping through objects */}
                        {amenitiesList.length > 0 && (
                            <View style={styles.amenitiesContainer}>
                                <Text style={styles.amenitiesTitle}>Services à bord</Text>
                                <View style={styles.amenitiesGrid}>
                                    {amenitiesList.map((item, index) => (
                                        <View key={index} style={styles.amenityItem}>
                                            <AmenityIcon slug={item.slug || ''} />
                                            <Text style={styles.amenityText}>{item.name}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </ScrollView>
                    
    );
};

const styles = StyleSheet.create({
    scrollArea: { flex: 1 },
    row: { flexDirection: 'row', minHeight: 60 },
    timeline: { width: 20, alignItems: 'center' },
    dot: { width: 12, height: 12, borderRadius: 6, zIndex: 1 },
    line: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginVertical: -2 },
    info: { flex: 1, marginLeft: 16, paddingBottom: 20 },
    departureHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 'bold' },
    inlinePrice: { fontSize: 16, fontWeight: '800', color: colors.blue, backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    time: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginVertical: 4 },
    stationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    station: { fontSize: 14, color: '#64748B' },
    durationBox: { marginLeft: 16, paddingVertical: 10 },
    durationText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },

    // New Amenities Styles
    amenitiesContainer: {
        marginTop: 10,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    amenitiesTitle: { fontSize: 12, fontWeight: 'bold', color: '#1E293B', marginBottom: 10, textTransform: 'uppercase' },
    amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    amenityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
    amenityText: { fontSize: 12, color: '#64748B' },

});