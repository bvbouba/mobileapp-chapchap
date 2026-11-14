import React from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Image,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, colors } from "../../Themed";
import { TripDetailsContent, type TripDetailsData } from "./TripDetailsContent";
import { EllipsisLoader } from "../../EllipsisLoader";
import { useDeviceLayout } from "../../../lib/layout/deviceLayout";

interface TripDetailsProps {
  isVisible: boolean;
  onClose: () => void;
  onBook: () => void;
  loading?: boolean;
  data: TripDetailsData;
}

export const TripDetailsModal = ({
  isVisible,
  onClose,
  onBook,
  data,
  loading,
}: TripDetailsProps) => {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { useTabletLayout } = useDeviceLayout();

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.overlay,
          useTabletLayout && styles.overlayTablet,
        ]}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.content,
            {
              paddingBottom: Math.max(insets.bottom, 12) + 4,
              height: useTabletLayout
                ? Math.min(screenHeight * 0.88, 760)
                : screenHeight * 0.86,
            },
            useTabletLayout && styles.contentTablet,
          ]}
        >
          {!useTabletLayout ? <View style={styles.dragHandle} /> : null}

          <View style={styles.closeRow}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <Ionicons name="close" size={20} color="#000000" />
            </TouchableOpacity>
          </View>

          <View style={styles.brandRow}>
            {data.logoUrl ? (
              <Image
                source={{ uri: data.logoUrl }}
                style={styles.logo}
                resizeMode="cover"
                accessibilityLabel={`Logo ${data.company}`}
              />
            ) : (
              <View style={styles.logoFallback}>
                <MaterialCommunityIcons name="bus" size={22} color={colors.green} />
              </View>
            )}
            <View style={styles.brandText}>
              <Text style={styles.title} numberOfLines={1}>
                {data.company || "Compagnie"}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                Détails du voyage
              </Text>
              <Text style={styles.priceLine}>{data.price} / passager</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsContainer}>
            <TripDetailsContent data={data} />
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.modalBookButton,
                loading && styles.modalBookButtonDisabled,
              ]}
              onPress={() => {
                onClose();
                setTimeout(() => {
                  onBook();
                }, 100);
              }}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={`Réserver ce voyage, ${data.price}`}
            >
              {loading ? (
                <EllipsisLoader color="#FFFFFF" dotSize={6} />
              ) : (
                <Text style={styles.modalBookText}>
                  Réserver ce voyage — {data.price}
                </Text>
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
    justifyContent: "flex-end",
  },
  overlayTablet: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.52)",
  },
  content: {
    backgroundColor: "white",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 16,
  },
  contentTablet: {
    width: "100%",
    maxWidth: 560,
    borderRadius: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
  },
  dragHandle: {
    width: 44,
    height: 4,
    backgroundColor: "#D7D8DB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },  closeRow: {
    alignItems: "flex-end",
    marginBottom: 4,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F1F1",
    borderWidth: 1,
    borderColor: "#D7D8DB",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F1F1F1",
    borderWidth: 1,
    borderColor: "#E8E9EC",
  },
  logoFallback: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F1F5EB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DCE8C8",
  },
  brandText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 20,
    color: "#111111",
    fontFamily: "TTNormsPro-Bold",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#606060",
    fontFamily: "TTNormsPro-Regular",
  },
  priceLine: {
    marginTop: 4,
    fontSize: 15,
    color: colors.green,
    fontFamily: "TTNormsPro-Bold",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E8E9EC",
    marginBottom: 10,
  },
  detailsContainer: {
    flex: 1,
    minHeight: 0,
  },
  modalFooter: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#D7D8DB",
    marginTop: 4,
  },
  modalBookButton: {
    width: "100%",
    backgroundColor: colors.primary,
    minHeight: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  modalBookButtonDisabled: {
    opacity: 0.7,
  },
  modalBookText: {
    color: "white",
    fontFamily: "TTNormsPro-Bold",
    fontSize: 15,
    textAlign: "center",
  },
});
