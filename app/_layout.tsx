import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { getMemoryAuthToken } from "../lib/authTokenMemory";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect, useMemo } from "react";
import { useColorScheme, LogBox } from "react-native";
import { Provider as PaperProvider } from "react-native-paper";
import { colors } from "../components/Themed";
import { CartProvider } from "../context/useCartContext";
import { OrderProvider } from "../context/useOrderContext";
import { PaymentProvider } from "../context/usePaymentContext";
import { ProductsProvider } from "../context/useProductContext";
export {
  ErrorBoundary
} from "expo-router";
import { getConfig } from "../config";
import SimpleBackHeader from "../components/layout/SimpleBackHeader";
import TripResultHeader from "../components/layout/TripResultHeader";
import { ConfirmationHeader } from "../components/layout/Confirmation.Header";
import { AuthProvider } from "../lib/providers/authProvider";
import { BiometricSessionUnlock } from "../components/account/BiometricSessionUnlock";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Keep native splash visible until fonts are ready (expo-router + expo-splash-screen).
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    "TTNormsPro-Regular": require("../assets/fonts/tt-norms-pro-regular.ttf"),
    "TTNormsPro-Bold": require("../assets/fonts/tt-norms-pro-bold.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // 3. Use an effect to hide the splash screen once fonts are loaded
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // 4. Return null instead of the <SplashScreen /> component
  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

LogBox.ignoreAllLogs();

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  const apiUrl = getConfig().saleorApi;

  const apolloClient = useMemo(() => {
    const authLink = setContext((_, { headers }) => {
      // Only the in-memory token (set after password login or biometric unlock).
      // Do not read SecureStore here — that would bypass the Face ID gate.
      const token = getMemoryAuthToken();
      return {
        headers: {
          ...headers,
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      };
    });

    const httpLink = new HttpLink({ uri: apiUrl });

    return new ApolloClient({
      link: from([authLink, httpLink]),
      cache: new InMemoryCache(),
    });
  }, [apiUrl]);

  const baseHeaderProps = {
    headerTitle: "",
    header: () => <SimpleBackHeader />
  }

  return (
    <>
      <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <BiometricSessionUnlock />
        <ProductsProvider>
          <CartProvider>
            <OrderProvider>
              <PaymentProvider>
                <PaperProvider>
                <ThemeProvider
                  value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
                >
                  <Stack >
                    <Stack.Screen
                      name="(tabs)"
                      options={{
                        headerShown: false,
                      }}
                    />
                    <Stack.Screen
                      name="cart"
                      options={{
                        headerShown: false,
                      }}
                    />
                    <Stack.Screen name="products/results" options={{
                      headerStyle: {
                        backgroundColor: colors.header,
                      }, header: () => <TripResultHeader />
                    }} />
                    <Stack.Screen name="products/details/[id]" options={baseHeaderProps} />
                    <Stack.Screen
                      name="checkout"
                      options={{
                        ...baseHeaderProps,
                        headerShown: false,
                        headerTitle: "Checkout",
                      }}
                    />
                    <Stack.Screen name="personalDetails" options={baseHeaderProps} />
                    <Stack.Screen name="shippingAddress" options={baseHeaderProps} />
                    <Stack.Screen name="billingAddress" options={baseHeaderProps} />
                    <Stack.Screen name="shippingMethods" options={baseHeaderProps} />
                    <Stack.Screen name="orderDetails/[id]" options={baseHeaderProps} />
                    <Stack.Screen name="orderConfirmation"  options={{ ...baseHeaderProps,
                      header: () => <ConfirmationHeader />,
                      headerTitle: "Confirmation", }}
                  
                    />
                    <Stack.Screen name="modal" options={{ presentation: "modal" }} />
                  </Stack>
                </ThemeProvider>
                </PaperProvider>
              </PaymentProvider>
            </OrderProvider>
          </CartProvider>
        </ProductsProvider>
        </AuthProvider>
      </ApolloProvider>
    </>
  );
}
