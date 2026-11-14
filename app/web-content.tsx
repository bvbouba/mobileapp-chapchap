import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { IconButton } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Text, colors } from "../components/Themed";
import {
  STOREFRONT_PAGE_TITLES,
  getStorefrontPageUrl,
  type StorefrontPageKey,
} from "../lib/storefrontContent";

const PAGE_KEYS = new Set<StorefrontPageKey>([
  "faq",
  "contact",
  "about",
  "terms",
  "privacy",
]);

function isStorefrontPageKey(value: string): value is StorefrontPageKey {
  return PAGE_KEYS.has(value as StorefrontPageKey);
}

export default function WebContentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ page?: string | string[] }>();
  const [loading, setLoading] = useState(true);

  const pageKey = useMemo(() => {
    const raw = Array.isArray(params.page) ? params.page[0] : params.page;
    if (raw && isStorefrontPageKey(raw)) return raw;
    return "about" as StorefrontPageKey;
  }, [params.page]);

  const title = STOREFRONT_PAGE_TITLES[pageKey];
  const uri = getStorefrontPageUrl(pageKey);

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
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.webWrap}>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.green} size="large" />
          </View>
        ) : null}
        <WebView
          source={{ uri }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          startInLoadingState={false}
          style={styles.webview}
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
          originWhitelist={["https://*", "http://*"]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.grey300,
  },
  backButton: {
    margin: 0,
    marginLeft: Platform.OS === "android" ? -4 : 0,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: "TTNormsPro-Bold",
    color: colors.text,
    textAlign: "center",
  },
  headerSpacer: {
    width: 48,
  },
  webWrap: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    zIndex: 1,
  },
});
