import { FC } from "react";
import { StyleSheet, Pressable, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { OrderFragment } from "../../saleor/api.generated";
import { Text, colors } from "../Themed";
import { getTripInformation } from "../../utils/attribute";
import { PLATFORM_FEE_PRODUCT_SLUG } from "../../utils/ensurePlatformFeeInCheckout";

interface Props {
    order: OrderFragment;
}

const OrderListItem: FC<Props> = ({ order }) => {
    const router = useRouter();
    const ticketLines = order.lines.filter(
        (line) => line.variant?.product?.slug !== PLATFORM_FEE_PRODUCT_SLUG
    );
    const ticketLine = ticketLines[0] ?? order.lines[0];
    const ticketCount = ticketLines.reduce((sum, line) => sum + line.quantity, 0);
    const status = getOrderStatusDisplay(order.status);
    
    const attributes = ticketLine?.variant?.attributes || [];
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
            <View style={styles.header}>
                <View style={styles.companyRow}>
                    <View style={styles.companyIcon}>
                        <MaterialCommunityIcons name="bus" size={14} color={colors.green} />
                    </View>
                    <Text style={styles.companyText}>{company || "Transport"}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.backgroundColor, borderColor: status.borderColor }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
            </View>

            <View style={styles.tripContent}>
                <View style={styles.stop}>
                    <Text style={styles.time}>{departureTimeStr}</Text>
                    <Text style={styles.city} numberOfLines={1}>{departureCity}</Text>
                </View>

                <View style={styles.pathContainer}>
                    <View style={styles.dotFilled} />
                    <View style={styles.lineDashed} />
                    <MaterialCommunityIcons name="bus" size={16} color={colors.green} style={styles.busIcon} />
                    <View style={styles.lineDashed} />
                    <View style={styles.dotOutline} />
                </View>

                <View style={[styles.stop, { alignItems: 'flex-end' }]}>
                    <Text style={styles.time}>{arrivalTimeStr}</Text>
                    <Text style={styles.city} numberOfLines={1}>{arrivalCity}</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <View style={styles.infoGroup}>
                    <MaterialCommunityIcons name="calendar-range" size={14} color="#606060" />
                    <Text style={styles.footerText}>{formattedDate}</Text>
                </View>
                <View style={styles.infoGroup}>
                    <MaterialCommunityIcons name="account-group-outline" size={14} color="#606060" />
                    <Text style={styles.footerText}>{ticketCount} billet(s)</Text>
                </View>
                <Text style={styles.priceText}>
                    {order.total.gross.amount} {order.total.gross.currency}
                </Text>
            </View>
        </Pressable>
    );
};

export default OrderListItem;

function getOrderStatusDisplay(status?: string | null) {
    const normalized = status?.toUpperCase();
    if (normalized === "UNCONFIRMED") {
        return {
            label: "En attente",
            backgroundColor: "#FFF7ED",
            borderColor: "#FED7AA",
            color: "#C2410C",
        };
    }
    if (normalized === "FULFILLED") {
        return {
            label: "Terminé",
            backgroundColor: "#ECFDF3",
            borderColor: "#BBF7D0",
            color: "#15803D",
        };
    }
    return {
        label: "Confirmé",
        backgroundColor: "#E6F5F3",
        borderColor: "#B9E6DF",
        color: colors.green,
    };
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#D7D8DB',
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
        gap: 8,
        flex: 1,
        paddingRight: 10,
    },
    companyIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#E6F5F3",
        alignItems: "center",
        justifyContent: "center",
    },
    companyText: {
        fontSize: 13,
        fontFamily: 'TTNormsPro-Bold',
        color: '#000000',
        textTransform: 'uppercase',
        flexShrink: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 11,
        fontFamily: 'TTNormsPro-Bold',
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
        fontFamily: 'TTNormsPro-Bold',
        color: '#000000',
    },
    city: {
        fontSize: 12,
        color: '#606060',
        fontFamily: 'TTNormsPro-Regular',
        marginTop: 2,
    },
    pathContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: 42,
        minHeight: 74,
    },
    lineDashed: {
        flex: 1,
        width: 1,
        minHeight: 18,
        borderLeftWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#D7D8DB',
    },
    dotFilled: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.green,
    },
    dotOutline: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#EB1700',
        backgroundColor: '#FFFFFF',
    },
    busIcon: {
        marginVertical: 4,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#D7D8DB',
    },
    infoGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        gap: 4,
    },
    footerText: {
        fontSize: 12,
        color: '#606060',
        fontFamily: 'TTNormsPro-Regular',
    },
    priceText: {
        marginLeft: 'auto',
        fontSize: 16,
        fontFamily: 'TTNormsPro-Bold',
        color: colors.green,
    },
});