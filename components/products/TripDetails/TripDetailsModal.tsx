import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Dimensions, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, colors } from '../../Themed';
import { TripDetailsContent } from './TripDetailsContent';
import { EllipsisLoader } from '../../EllipsisLoader';

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
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View style={styles.content}>
                    <View style={styles.dragHandle} />

                    <View style={styles.header}>
                        <View style={styles.titleBlock}>
                            <Text style={styles.title}>{data.company || "Compagnie"}</Text>
                            <Text style={styles.subtitle}>Détails du trajet</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.8}>
                            <Ionicons name="close" size={20} color="#000000" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.metaRow}>
                        <View style={styles.metaPill}>
                            <MaterialCommunityIcons name="clock-time-four-outline" size={14} color="#606060" />
                            <Text style={styles.metaText}>{data.duration || "Durée non disponible"}</Text>
                        </View>
                        <View style={styles.metaPill}>
                            <MaterialCommunityIcons name="cash-multiple" size={14} color={colors.green} />
                            <Text style={styles.priceText}>{data.price}</Text>
                        </View>
                    </View>

                    <View style={styles.detailsContainer}>
                        <TripDetailsContent data={data} />
                    </View>
                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={[styles.modalBookButton, loading && styles.modalBookButtonDisabled]}
                            onPress={() => {
                                onClose(); 
                                setTimeout(() => {
                                    onBook();
                                }, 100);
                            }}
                            disabled={loading}
                        >
                            {loading ? (
                                <EllipsisLoader color="#FFFFFF" dotSize={6} />
                            ) : (
                                <Text style={styles.modalBookText}>Réserver</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15,23,42,0.52)',
    },
    content: {
        backgroundColor: 'white',
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        paddingHorizontal: 16,
        height: SCREEN_HEIGHT * 0.8,
        paddingBottom: 16,
    },
    dragHandle: {
        width: 44,
        height: 4,
        backgroundColor: '#D7D8DB',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    titleBlock: {
        flex: 1,
        paddingRight: 10,
    },
    title: {
        fontSize: 20,
        color: '#000000',
        fontFamily: 'TTNormsPro-Bold',
    },
    subtitle: {
        marginTop: 2,
        fontSize: 12,
        color: '#606060',
        fontFamily: 'TTNormsPro-Regular',
    },
    closeButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F1F1',
        borderWidth: 1,
        borderColor: '#D7D8DB',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    metaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFB',
        borderWidth: 1,
        borderColor: '#E8E9EB',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    metaText: {
        marginLeft: 5,
        fontSize: 12,
        color: '#606060',
        fontFamily: 'TTNormsPro-Regular',
    },
    priceText: {
        marginLeft: 5,
        fontSize: 13,
        color: colors.green,
        fontFamily: 'TTNormsPro-Bold',
    },
    detailsContainer: {
        flex: 1,
        minHeight: 0,
    },
    modalFooter: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#D7D8DB',
        marginTop: 4,
    },
    modalBookButton: {
        width: '100%',
        backgroundColor: '#EB1700',
        height: 50,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBookButtonDisabled: {
        opacity: 0.7,
    },
    modalBookText: {
        color: 'white',
        fontFamily: 'TTNormsPro-Bold',
        fontSize: 16,
    },
});