import React, { useMemo } from "react";
import { StyleSheet, View, Pressable, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { colors, Text } from "../Themed";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  useCurrentUserQuery,
  useShopContactQuery,
} from "../../saleor/api.generated";
import { formatMoneyLabel, toWhatsAppUrl } from "../../utils/formatAccountPhone";
import type { StorefrontPageKey } from "../../lib/storefrontContent";

interface Props {
  isAuthenticated: boolean;
  onLogout: () => void;
}

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type MenuItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon: IconName;
  onPress: () => void;
};

function MenuSection({ title, items }: { title: string; items: MenuItem[] }) {
  if (!items.length) return null;
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.card}>
        {items.map((item, index) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.item,
              index < items.length - 1 && styles.borderBottom,
              pressed && styles.pressedItem,
            ]}
          >
            <View style={styles.itemLeft}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name={item.icon} size={20} color={colors.blue} />
              </View>
              <View style={styles.itemText}>
                <Text style={styles.title}>{item.title}</Text>
                {item.subtitle ? (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.grey300} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export const AccountMenu = ({ isAuthenticated, onLogout }: Props) => {
  const router = useRouter();
  const { data: shopData } = useShopContactQuery();
  const { data: meData } = useCurrentUserQuery({
    skip: !isAuthenticated,
    fetchPolicy: "cache-and-network",
  });

  const openStorefrontPage = (page: StorefrontPageKey) => {
    router.push({ pathname: "/web-content", params: { page } });
  };

  const avoirsSubtitle = useMemo(() => {
    const edges = meData?.me?.giftCards?.edges ?? [];
    const active = edges.filter((e) => e.node.isActive);
    const total = active.reduce((sum, e) => sum + (e.node.currentBalance?.amount ?? 0), 0);
    const currency = active[0]?.node.currentBalance?.currency || "XOF";
    if (total <= 0) return "Aucun avoir disponible";
    return `${formatMoneyLabel(total, currency)} disponible`;
  }, [meData]);

  const giftCardLines = useMemo(() => {
    const edges = meData?.me?.giftCards?.edges ?? [];
    return edges
      .filter((e) => e.node.isActive && (e.node.currentBalance?.amount ?? 0) > 0)
      .map((e) => {
        const bal = formatMoneyLabel(
          e.node.currentBalance.amount,
          e.node.currentBalance.currency,
        );
        return `• ${e.node.displayCode} — ${bal}`;
      });
  }, [meData]);

  const openWhatsAppSupport = async () => {
    const phone = shopData?.shop?.companyAddress?.phone;
    if (!phone) {
      Alert.alert(
        "Assistance",
        "Le numéro WhatsApp n'est pas disponible pour le moment. Réessayez plus tard.",
      );
      return;
    }
    const wa = toWhatsAppUrl(phone);
    const tel = `tel:${phone.replace(/\s/g, "")}`;

    Alert.alert("Assistance client", "Comment souhaitez-vous nous contacter ?", [
      {
        text: "WhatsApp",
        onPress: async () => {
          if (!wa) return;
          const can = await Linking.canOpenURL(wa);
          if (can) await Linking.openURL(wa);
          else Alert.alert("Erreur", "Impossible d'ouvrir WhatsApp.");
        },
      },
      {
        text: "Appeler",
        onPress: async () => {
          const can = await Linking.canOpenURL(tel);
          if (can) await Linking.openURL(tel);
          else Alert.alert("Erreur", "Impossible de lancer l'appel.");
        },
      },
      { text: "Annuler", style: "cancel" },
    ]);
  };

  const showAvoirs = () => {
    if (!giftCardLines.length) {
      Alert.alert(
        "Mes avoirs",
        "Vous n'avez pas d'avoir disponible. Les remboursements d'annulation apparaissent ici sous forme de crédit boutique.",
      );
      return;
    }
    Alert.alert("Mes avoirs & remboursements", giftCardLines.join("\n"));
  };

  const transportItems: MenuItem[] = isAuthenticated
    ? [
        {
          id: "avoirs",
          title: "Mes avoirs & remboursements",
          subtitle: avoirsSubtitle,
          icon: "ticket-percent-outline",
          onPress: showAvoirs,
        },
      ]
    : [];

  const settingsItems: MenuItem[] = isAuthenticated
    ? [
        {
          id: "notifications",
          title: "Notifications & SMS",
          subtitle: "Bientôt disponible",
          icon: "bell-outline",
          onPress: () =>
            Alert.alert(
              "Notifications",
              "La gestion des notifications et SMS sera bientôt disponible.",
            ),
        },
        {
          id: "security",
          title: "Sécurité & Confidentialité",
          subtitle: "Mot de passe, données, suppression",
          icon: "shield-lock-outline",
          onPress: () => router.push("/account-security"),
        },
      ]
    : [
        {
          id: "notifications",
          title: "Notifications & SMS",
          subtitle: "Bientôt disponible",
          icon: "bell-outline",
          onPress: () =>
            Alert.alert(
              "Notifications",
              "La gestion des notifications et SMS sera bientôt disponible.",
            ),
        },
      ];

  const helpItems: MenuItem[] = [
    {
      id: "faq",
      title: "FAQ & Centre d'aide",
      icon: "help-circle-outline",
      onPress: () => openStorefrontPage("faq"),
    },
    {
      id: "contact",
      title: "Nous contacter",
      icon: "message-text-outline",
      onPress: () => openStorefrontPage("contact"),
    },
    {
      id: "whatsapp",
      title: "WhatsApp / Appeler",
      icon: "whatsapp",
      onPress: openWhatsAppSupport,
    },
    {
      id: "about",
      title: "À propos de ChapChap",
      icon: "information-outline",
      onPress: () => openStorefrontPage("about"),
    },
  ];

  const legalItems: MenuItem[] = [
    {
      id: "cgu",
      title: "Conditions générales d'utilisation",
      icon: "file-document-outline",
      onPress: () => openStorefrontPage("terms"),
    },
    {
      id: "privacy",
      title: "Politique de confidentialité",
      icon: "shield-lock-outline",
      onPress: () => openStorefrontPage("privacy"),
    },
  ];

  const handleLogoutPress = () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", onPress: onLogout, style: "destructive" },
    ]);
  };

  return (
    <View>
      <MenuSection title="Mes services transport" items={transportItems} />
      <MenuSection title="Paramètres" items={settingsItems} />
      <MenuSection title="Aide" items={helpItems} />
      <MenuSection title="Légal" items={legalItems} />

      {isAuthenticated ? (
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressedItem]}
          onPress={handleLogoutPress}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.red} />
          <Text style={styles.logoutTitle}>Se déconnecter</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionBlock: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "TTNormsPro-Bold",
    color: colors.grey500,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
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
  subtitle: {
    fontSize: 12,
    fontFamily: "TTNormsPro-Regular",
    color: colors.grey500,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.grey300,
  },
  logoutTitle: {
    fontSize: 15,
    fontFamily: "TTNormsPro-Regular",
    color: colors.red,
  },
});
