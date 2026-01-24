import { FC } from "react";
import { StyleSheet, Pressable, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { OrderFragment } from "../../saleor/api.generated";
import { Text, colors } from "../Themed";
import { getTripInformation } from "../../utils/attribute";

interface Props {
    order: OrderFragment;
}

const OrderListItem: FC<Props> = ({ order }) => {
    const router = useRouter();
    
    const attributes = order.lines[0]?.variant?.attributes || [];
    const {
        departureCity,
        arrivalCity,
        formattedDate,
        departureTimeStr,
        arrivalTimeStr,
        company
    } = getTripInformation({ attributes });

    const onPress = () => router.push({
        pathname: `/orderDetails/${order.id}`,
    });

   

    return (
        <Pressable onPress={onPress} style={({ pressed }) => [
            styles.card,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
        ]}>
            {/* Header: Compagnie & Statut */}
            <View style={styles.header}>
                <View style={styles.companyRow}>
                    <MaterialCommunityIcons name="bus" size={16} color={colors.blue} />
                    <Text style={styles.companyText}>{company || "Transport"}</Text>
                </View>
      
            </View>

            {/* Corps: Trajet & Heures */}
            <View style={styles.tripContent}>
                <View style={styles.stop}>
                    <Text style={styles.time}>{departureTimeStr}</Text>
                    <Text style={styles.city} numberOfLines={1}>{departureCity}</Text>
                </View>

                <View style={styles.pathContainer}>
                    <View style={styles.dot} />
                    <View style={styles.line} />
                    <MaterialCommunityIcons name="chevron-right" size={16} color="#CBD5E1" />
                    <View style={styles.line} />
                    <View style={[styles.dot, styles.dotEnd]} />
                </View>

                <View style={[styles.stop, { alignItems: 'flex-end' }]}>
                    <Text style={styles.time}>{arrivalTimeStr}</Text>
                    <Text style={styles.city} numberOfLines={1}>{arrivalCity}</Text>
                </View>
            </View>

            {/* Footer: Date & Nombre de passagers */}
            <View style={styles.footer}>
                <View style={styles.infoGroup}>
                    <MaterialCommunityIcons name="calendar-range" size={14} color="#94A3B8" />
                    <Text style={styles.footerText}>{formattedDate}</Text>
                </View>
                <View style={styles.infoGroup}>
                    <MaterialCommunityIcons name="account-group-outline" size={14} color="#94A3B8" />
                    <Text style={styles.footerText}>{order.lines.length} billet(s)</Text>
                </View>
                <Text style={styles.priceText}>
                    {order.total.gross.amount} {order.total.gross.currency}
                </Text>
            </View>
        </Pressable>
    );
};

export default OrderListItem;

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 16,
        padding: 16,
        // Ombre iOS
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        // Ombre Android
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    companyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    companyText: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.blue,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    tripContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    stop: {
        flex: 1,
    },
    time: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
    },
    city: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 2,
    },
    pathContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        flex: 0.8,
    },
    line: {
        flex: 1,
        height: 1.5,
        backgroundColor: '#E2E8F0',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.blue,
    },
    dotEnd: {
        backgroundColor: colors.red,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    infoGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        gap: 4,
    },
    footerText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    priceText: {
        marginLeft: 'auto',
        fontSize: 15,
        fontWeight: '800',
        color: colors.blue,
    },
});