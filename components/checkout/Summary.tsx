import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Divider, PaddedView, colors } from '../Themed';
import { getTripInformation } from '../../utils/attribute';

interface SummaryProps {
    lines: any[];
    totalPrice?: {
        gross: { currency: string; amount: number; };
    };
    editable?: boolean;
    voucherCode?: string | null;
    giftCards?: any[];
    shippingPrice?: any;
}

export const Summary: React.FC<SummaryProps> = ({
    lines,
    totalPrice,
    editable = true,
}) => {
    const [isOpen, setIsOpen] = useState(true);

    // Assuming we take trip info from the first line for the summary
    const line = lines?.[0];
    const {
        departureCity,
        departureTimeStr,
        arrivalCity,
        arrivalTimeStr,
        formattedDate,
        departureStation,
        arrivalStation
    } = getTripInformation({ attributes: line?.variant?.attributes || [] });

    const passengerCount = lines.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    const amount = totalPrice?.gross?.amount ?? 0;
    const currency = totalPrice?.gross?.currency ?? "XOF";

    return (
        <View style={styles.container}>
            {/* Summary Header (Toggle) */}
            <TouchableOpacity 
                style={styles.header} 
                onPress={() => setIsOpen(!isOpen)}
                activeOpacity={0.7}
            >
                <Text style={styles.title}>Résumé du voyage</Text>
                <Ionicons 
                    name={isOpen ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#1E293B" 
                />
            </TouchableOpacity>

            {isOpen && (
                <PaddedView style={styles.content}>
                    {/* Departure Info */}
                    <View style={styles.tripPoint}>
                        <View style={styles.dot} />
                        <View>
                            <Text style={styles.cityLabel}>Départ: {departureCity?.toUpperCase()}</Text>
                            <Text style={styles.timeLabel}>{departureTimeStr} • {formattedDate}</Text>
                            <Text style={styles.stationLabel}>{departureStation}</Text>
                        </View>
                    </View>

                    {/* Path Line */}
                    <View style={styles.verticalLine} />

                    {/* Arrival Info */}
                    <View style={styles.tripPoint}>
                        <View style={[styles.dot, { backgroundColor: colors.red }]} />
                        <View>
                            <Text style={styles.cityLabel}>Arrivée: {arrivalCity?.toUpperCase()}</Text>
                            <Text style={styles.timeLabel}>{arrivalTimeStr} • {formattedDate}</Text>
                            <Text style={styles.stationLabel}>{arrivalStation}</Text>
                        </View>
                    </View>

                    <Divider style={styles.divider} />

                    {/* Pricing Breakdown */}
                    <View style={styles.row}>
                        <Text style={styles.label}>Frais de plateforme</Text>
                        <Text style={styles.value}>0 {currency}</Text>
                    </View>

                    <View style={[styles.row, { marginTop: 10 }]}>
                        <View>
                            <Text style={styles.totalLabel}>Total du voyage</Text>
                            <Text style={styles.passengerSub}>Pour {passengerCount} voyageur(s)</Text>
                        </View>
                        <Text style={styles.totalValue}>{amount} {currency}</Text>
                    </View>
                </PaddedView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    content: {
        paddingTop: 0,
        paddingBottom: 20,
    },
    tripPoint: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.blue,
        marginTop: 6,
    },
    verticalLine: {
        width: 2,
        height: 20,
        backgroundColor: '#E2E8F0',
        marginLeft: 4,
        marginVertical: 2,
    },
    cityLabel: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    timeLabel: { fontSize: 13, color: '#475569', marginVertical: 2 },
    stationLabel: { fontSize: 12, color: '#94A3B8' },
    divider: { marginVertical: 16 },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: { fontSize: 14, color: '#64748B' },
    value: { fontSize: 14, color: '#1E293B', fontWeight: '500' },
    totalLabel: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    passengerSub: { fontSize: 12, color: '#94A3B8' },
    totalValue: { fontSize: 20, fontWeight: '900', color: colors.blue },
});