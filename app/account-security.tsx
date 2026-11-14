import React from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { IconButton } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, colors } from "../components/Themed";
import {
  getAccountDeletionUrl,
  getPasswordResetUrl,
} from "../lib/storefrontContent";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type Row = {
  id: string;
  title: string;
  subtitle?: string;
  icon: IconName;
  onPress: () => void;
  destructive?: boolean;
};

export default function AccountSecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const openExternal = async (url: string, errorMessage: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Erreur", errorMessage);
    }
  };

  const openPasswordReset = () => {
    Alert.alert(
      "Modifier le mot de passe",
      "Vous allez être redirigé vers le site ChapChap pour réinitialiser votre mot de passe.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Continuer",
          onPress: () =>
            openExternal(
              getPasswordResetUrl(),
              "Impossible d'ouvrir la page de réinitialisation.",
            ),
        },
      ],
    );
  };

  const openPrivacy = () => {
    router.push({ pathname: "/web-content", params: { page: "privacy" } });
  };

  const openAccountDeletion = () => {
    Alert.alert(
      "Supprimer mon compte",
      "Cette action est irréversible. Vous allez être redirigé vers le site ChapChap pour confirmer la suppression de votre compte et de vos données personnelles.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Continuer",
          style: "destructive",
          onPress: () =>
            openExternal(
              getAccountDeletionUrl(),
              "Impossible d'ouvrir le site ChapChap.",
            ),
        },
      ],
    );
  };

  const securityRows: Row[] = [
    {
      id: "password",
      title: "Modifier le mot de passe",
      subtitle: "Réinitialisation sécurisée sur le site",
      icon: "lock-reset",
      onPress: openPasswordReset,
    },
    {
      id: "privacy",
      title: "Confidentialité des données",
      subtitle: "Politique de confidentialité",
      icon: "shield-account-outline",
      onPress: openPrivacy,
    },
  ];

  const dangerRows: Row[] = [
    {
      id: "delete",
      title: "Supprimer mon compte",
      subtitle: "Suppression définitive du compte et des données",
      icon: "account-remove-outline",
      onPress: openAccountDeletion,
      destructive: true,
    },
  ];

  const renderRows = (rows: Row[]) => (
    <View style={styles.card}>
      {rows.map((item, index) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          onPress={item.onPress}
          style={({ pressed }) => [
            styles.item,
            index < rows.length - 1 && styles.borderBottom,
            pressed && styles.pressedItem,
          ]}
        >
          <View style={styles.itemLeft}>
            <View
              style={[
                styles.iconWrap,
                item.destructive && styles.iconWrapDanger,
              ]}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={20}
                color={item.destructive ? colors.red : colors.blue}
              />
            </View>
            <View style={styles.itemText}>
              <Text
                style={[styles.title, item.destructive && styles.titleDanger]}
              >
                {item.title}
              </Text>
              {item.subtitle ? (
                <Text style={styles.subtitle} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              ) : null}
            </View>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={colors.grey300}
          />
        </Pressable>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          onPress={() => router.back()}
          style={styles.backButton}
          iconColor={colors.blue}
          size={28}
          accessibilityLabel="Retour"
        />
        <Text style={styles.headerTitle} numberOfLines={1}>
          Sécurité & Confidentialité
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Gérez la sécurité de votre compte et le traitement de vos données
          personnelles.
        </Text>

        <Text style={styles.sectionLabel}>Sécurité</Text>
        {renderRows(securityRows)}

        <Text style={[styles.sectionLabel, styles.dangerSectionLabel]}>
          Zone sensible
        </Text>
        {renderRows(dangerRows)}

        <Text style={styles.footnote}>
          La suppression du compte est définitive. Vos billets et historique ne
          seront plus accessibles.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grey100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey300,
    backgroundColor: colors.background,
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontFamily: "TTNormsPro-Bold",
    color: colors.text,
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  intro: {
    fontSize: 14,
    fontFamily: "TTNormsPro-Regular",
    color: colors.grey500,
    lineHeight: 20,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "TTNormsPro-Bold",
    color: colors.grey500,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  dangerSectionLabel: {
    marginTop: 24,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.grey300,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: colors.background,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
    paddingRight: 8,
  },
  itemText: {
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E6F5F3",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapDanger: {
    backgroundColor: "#FDECEC",
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.grey300,
  },
  pressedItem: {
    backgroundColor: colors.grey100,
  },
  title: {
    fontSize: 15,
    fontFamily: "TTNormsPro-Regular",
    color: colors.text,
  },
  titleDanger: {
    color: colors.red,
    fontFamily: "TTNormsPro-Bold",
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "TTNormsPro-Regular",
    color: colors.grey500,
    marginTop: 2,
  },
  footnote: {
    marginTop: 16,
    fontSize: 12,
    fontFamily: "TTNormsPro-Regular",
    color: colors.grey500,
    lineHeight: 18,
  },
});
