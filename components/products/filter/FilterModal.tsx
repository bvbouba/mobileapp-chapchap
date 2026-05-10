import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../Themed";
import { AttributeFilterFragment } from "../../../saleor/api.generated";
import { SectionFilter } from "./SectionFilter";

interface Props {
  isVisible: boolean;
  onClose: () => void;
  insets: { top: number; bottom: number };
  activeFilters: Record<string, string[]>;
  attributeFiltersData: AttributeFilterFragment[];
  onAddFilter: (slug: string, choice: string) => void;
  onClear: () => void;
  activeCount: number;
}

/** Avoid title / header overlapping the status bar on Android (translucent modal). */
const topInset = (safeTop: number) => {
  const status = StatusBar.currentHeight ?? 0;
  if (Platform.OS === "android") {
    return Math.max(safeTop, status) + 24;
  }
  return safeTop + 12;
};

export const FilterModal = ({
  isVisible,
  onClose,
  insets,
  activeFilters,
  attributeFiltersData,
  onAddFilter,
  onClear,
  activeCount,
}: Props) => (
  <Modal
    visible={isVisible}
    animationType="slide"
    presentationStyle="fullScreen"
    statusBarTranslucent
    navigationBarTranslucent
    onRequestClose={onClose}
  >
    <View style={styles.root}>
      <View style={[styles.modalContainer, { paddingTop: topInset(insets.top) }]}>
        <View style={[styles.modalHeader, Platform.OS === "android" && styles.modalHeaderAndroid]}>
          <View style={styles.headerSide}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.8}>
              <Ionicons name="close" size={20} color="#000000" />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalTitle}>Filtres</Text>
          <View style={[styles.headerSide, styles.headerSideRight]}>
            {activeCount > 0 ? (
              <TouchableOpacity onPress={onClear} hitSlop={8}>
                <Text style={styles.resetText}>Effacer</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </View>
        </View>

        <ScrollView
          style={styles.modalBody}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <SectionFilter
            activeFilters={activeFilters}
            clearFilters={async () => onClear()}
            attributeFiltersData={attributeFiltersData}
            addAttributeFilter={onAddFilter}
          />
        </ScrollView>

        <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity style={styles.applyButton} onPress={onClose} activeOpacity={0.9}>
            <Text style={styles.applyButtonText}>Voir les résultats</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#D7D8DB",
  },
  modalHeaderAndroid: {
    paddingTop: 8,
    minHeight: 52,
  },
  headerSide: {
    width: 80,
    justifyContent: "center",
  },
  headerSideRight: {
    alignItems: "flex-end",
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
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
  modalTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    color: "#000000",
    fontFamily: "TTNormsPro-Bold",
  },
  resetText: {
    color: "#02838A",
    fontFamily: "TTNormsPro-Bold",
    fontSize: 14,
  },
  modalBody: { flex: 1, backgroundColor: "#FFFFFF" },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#D7D8DB",
    backgroundColor: "#FFFFFF",
  },
  applyButton: {
    backgroundColor: "#EB1700",
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontFamily: "TTNormsPro-Bold",
    fontSize: 16,
  },
});
