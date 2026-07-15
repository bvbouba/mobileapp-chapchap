import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, colors } from '../../Themed';

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

const AmenityIcon = ({ slug }: { slug: string }) => {
    switch (slug) {
        case 'wi-fi':
            return <Ionicons name="wifi" size={14} color={colors.green} />;
        case 'climatisation':
            return <Ionicons name="snow" size={14} color={colors.green} />;
        case 'toillettes':
            return <MaterialCommunityIcons name="toilet" size={14} color={colors.green} />;
        case 'television':
            return <Ionicons name="tv-outline" size={14} color={colors.green} />;
        default:
            return <Ionicons name="checkmark-circle-outline" size={14} color={colors.green} />;
    }
};

export const TripDetailsContent = ({ data }: Props) => {
    const amenitiesList = data.ameneties || [];

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
        >
            <View style={styles.infoCard}>
                <Text style={styles.sectionTitle}>Itinéraire</Text>
                <View style={styles.stepRow}>
                    <View style={styles.timeline}>
                        <View style={styles.dot} />
                        <View style={styles.line} />
                    </View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepLabel}>Départ</Text>
                        <Text style={styles.stepTime}>{data.departureTime}</Text>
                        <Text style={styles.stepStation}>{data.departureStation}</Text>
                    </View>
                </View>
                <View style={styles.stepRow}>
                    <View style={styles.timeline}>
                        <View style={styles.dot} />
                    </View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepLabel}>Arrivée</Text>
                        <Text style={styles.stepTime}>{data.arrivalTime}</Text>
                        <Text style={styles.stepStation}>{data.arrivalStation}</Text>
                    </View>
                </View>
            </View>

            {amenitiesList.length > 0 && (
                <View style={styles.infoCard}>
                    <Text style={styles.sectionTitle}>Services à bord</Text>
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
    scrollContent: {
        paddingBottom: 16,
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E8E9EB',
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 13,
        color: '#000000',
        fontFamily: 'TTNormsPro-Bold',
        marginBottom: 10,
    },
    stepRow: {
        flexDirection: 'row',
        minHeight: 78,
    },
    timeline: {
        width: 22,
        alignItems: 'center',
        position: 'relative',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 5,
        backgroundColor: '#A1A1AA',
    },
    line: {
        width: 2,
        position: 'absolute',
        top: 10,
        bottom: -10,
        backgroundColor: '#A1A1AA',
    },
    stepContent: {
        flex: 1,
        marginLeft: 10,
        paddingBottom: 12,
    },
    stepLabel: {
        fontSize: 11,
        color: '#606060',
        textTransform: 'uppercase',
        fontFamily: 'TTNormsPro-Bold',
    },
    stepTime: {
        marginTop: 2,
        fontSize: 18,
        color: '#000000',
        fontFamily: 'TTNormsPro-Bold',
    },
    stepStation: {
        marginTop: 2,
        fontSize: 13,
        color: '#606060',
        fontFamily: 'TTNormsPro-Regular',
    },
    amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    amenityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D7D8DB',
        backgroundColor: '#F8FAFB',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 8,
    },
    amenityText: {
        marginLeft: 6,
        fontSize: 12,
        color: '#404040',
        fontFamily: 'TTNormsPro-Regular',
    },
});