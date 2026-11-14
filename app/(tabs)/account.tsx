import React, { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, StatusBar, BackHandler } from "react-native";
import { Portal } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthHero } from "../../components/account/AuthHero";
import { UserProfile } from "../../components/account/UserProfile";
import { AccountMenu } from "../../components/account/AccountMenu";
import { AccountFooter } from "../../components/account/AccountFooter";
import { LoginForm } from "../../components/account/LoginForm";
import { SignupForm } from "../../components/account/SignupForm";
import { useAuth } from "../../lib/providers/authProvider";
import { Text, colors } from "../../components/Themed";
import { useDeviceLayout } from "../../lib/layout/deviceLayout";
import { TabletContentShell } from "../../components/layout/TabletSplitView";

export default function AccountScreen() {
  const { authenticated, user, logout } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const insets = useSafeAreaInsets();
  const { useTabletLayout } = useDeviceLayout();

  const openAuth = (authMode: "login" | "signup") => {
    setMode(authMode);
    setModalVisible(true);
  };

  useEffect(() => {
    if (!modalVisible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setModalVisible(false);
      return true;
    });
    return () => sub.remove();
  }, [modalVisible]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.grey100} />
      <TabletContentShell>
      <View
        style={[
          styles.pageHeader,
          { paddingTop: insets.top + 16 },
          useTabletLayout && { paddingHorizontal: 0 },
        ]}
      >
        <Text style={styles.pageTitle}>Mon Compte</Text>
        <Text style={styles.pageSubtitle}>
          {authenticated
            ? "Gérez vos informations, avoirs et préférences."
            : "Connectez-vous pour retrouver vos billets partout."}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 32 },
          useTabletLayout && { maxWidth: 720, alignSelf: "center", width: "100%" },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {authenticated ? (
          <UserProfile user={user} />
        ) : (
          <AuthHero onOpenAuth={openAuth} />
        )}

        <AccountMenu isAuthenticated={authenticated} onLogout={logout} />

        <AccountFooter />
      </ScrollView>
      </TabletContentShell>

      {/* Portal so country picker Modal is not nested (Android fullscreen). */}
      <Portal>
        {modalVisible ? (
          <View style={styles.authOverlay} accessibilityViewIsModal>
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
          </View>
        ) : null}
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.grey100 },
  authOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    zIndex: 1000,
    elevation: 1000,
  },
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
});
