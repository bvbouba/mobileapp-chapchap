import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Modal, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthHero } from "../../components/account/AuthHero";
import { UserProfile } from "../../components/account/UserProfile";
import { AccountMenu } from "../../components/account/AccountMenu";
import { AccountFooter } from "../../components/account/AccountFooter";
import { LoginForm } from "../../components/account/LoginForm";
import { SignupForm } from "../../components/account/SignupForm";
import { useAuth } from "../../lib/providers/authProvider";
import { Text, colors } from "../../components/Themed";

export default function AccountScreen() {
  const { authenticated, user, logout } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const insets = useSafeAreaInsets();

  const openAuth = (authMode: "login" | "signup") => {
    setMode(authMode);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.grey100} />
      <View style={[styles.pageHeader, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.pageTitle}>Mon compte</Text>
        <Text style={styles.pageSubtitle}>
          {authenticated
            ? "Gérez votre profil et vos préférences."
            : "Connectez-vous pour retrouver vos billets partout."}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {authenticated ? (
          <UserProfile user={user} />
        ) : (
          <AuthHero onOpenAuth={openAuth} />
        )}

        <Text style={styles.sectionLabel}>Aide & informations</Text>
        <AccountMenu isAuthenticated={authenticated} onLogout={logout} />

        <AccountFooter />
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        {mode === "login" ? (
          <LoginForm
            onClose={() => setModalVisible(false)}
            onSwitchToSignup={() => setMode("signup")}
          />
        ) : (
          <SignupForm
            onClose={() => setModalVisible(false)}
            onSwitchToLogin={() => setMode("login")}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.grey100 },
  pageHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey300,
    backgroundColor: colors.grey100,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: "TTNormsPro-Bold",
    color: colors.text,
  },
  pageSubtitle: {
    fontSize: 14,
    fontFamily: "TTNormsPro-Regular",
    color: colors.grey500,
    marginTop: 6,
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "TTNormsPro-Bold",
    color: colors.grey500,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
});
