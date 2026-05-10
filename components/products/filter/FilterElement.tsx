import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Text } from "../../Themed";
import { MaterialCommunityIcons } from "@expo/vector-icons";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SECONDARY = "#02838A";
const DIVIDER = "#D7D8DB";

export interface FilterOption {
  id: string;
  label: string;
  slug: string;
  chosen: boolean;
}

interface props {
  label: string;
  attributeSlug: string;
  options?: FilterOption[];
  optionToggle: (attributeSlug: string, choiceSlug: string) => void;
}

export function FilterElement({ label, attributeSlug, options, optionToggle }: props) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(!isOpen);
  };

  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.header} onPress={toggleOpen} activeOpacity={0.7}>
        <Text style={styles.sectionTitle}>{label}</Text>
        <MaterialCommunityIcons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={22}
          color="#606060"
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.optionsBlock}>
          {options?.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionRow, index > 0 && styles.optionRowBorder]}
              onPress={() => optionToggle(attributeSlug, option.slug)}
              activeOpacity={0.75}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: option.chosen }}
            >
              <Text style={styles.optionLabel} numberOfLines={2}>
                {option.label}
              </Text>
              <View style={[styles.checkbox, option.chosen && styles.checkboxChecked]}>
                {option.chosen ? (
                  <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
    fontFamily: "TTNormsPro-Bold",
    marginRight: 8,
  },
  optionsBlock: {
    paddingBottom: 4,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 8,
    backgroundColor: "#FFFFFF",
  },
  optionRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "#E8E9EB",
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    color: "#404040",
    fontFamily: "TTNormsPro-Regular",
    paddingRight: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: SECONDARY,
    borderColor: SECONDARY,
  },
});
