import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Text, colors } from "../Themed";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAccountUpdateMutation } from "../../saleor/api.generated";
import { useAuth } from "../../lib/providers/authProvider";

interface Props {
  visible: boolean;
  onClose: () => void;
  firstName: string;
  lastName: string;
}

export const EditProfileModal = ({
  visible,
  onClose,
  firstName: initialFirst,
  lastName: initialLast,
}: Props) => {
  const { refreshUser } = useAuth();
  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [error, setError] = useState<string | null>(null);
  const [accountUpdate, { loading }] = useAccountUpdateMutation();

  useEffect(() => {
    if (visible) {
      setFirstName(initialFirst);
      setLastName(initialLast);
      setError(null);
    }
  }, [visible, initialFirst, initialLast]);

  const handleSave = async () => {
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) {
      setError("Veuillez renseigner votre nom et prénom.");
      return;
    }
    setError(null);
    try {
      const { data } = await accountUpdate({
        variables: { input: { firstName: fn, lastName: ln } },
      });
      const errors = data?.accountUpdate?.errors ?? [];
      if (errors.length) {
        setError(errors.map((e) => e.message).filter(Boolean).join(" ") || "Erreur");
        return;
      }
      await refreshUser();
      onClose();
    } catch {
      setError("Impossible de mettre à jour le profil.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdropTap} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Modifier le profil</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
              <MaterialCommunityIcons name="close" size={24} color={colors.grey500} />
            </Pressable>
          </View>

          <Text style={styles.label}>Prénom</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            placeholder="Prénom"
            placeholderTextColor={colors.grey500}
          />

          <Text style={styles.label}>Nom</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            placeholder="Nom"
            placeholderTextColor={colors.grey500}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && styles.savePressed]}
            onPress={handleSave}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Enregistrer</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: "TTNormsPro-Bold",
    color: colors.text,
  },
  label: {
    fontSize: 13,
    fontFamily: "TTNormsPro-Bold",
    color: colors.grey500,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.grey300,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "TTNormsPro-Regular",
    color: colors.text,
    backgroundColor: colors.grey100,
    marginBottom: 12,
  },
  error: {
    fontSize: 13,
    fontFamily: "TTNormsPro-Regular",
    color: colors.red,
    marginBottom: 8,
  },
  saveBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  savePressed: { opacity: 0.85 },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "TTNormsPro-Bold",
  },
});
