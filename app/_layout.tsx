import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { useColorScheme, LogBox } from "react-native";
import { colors } from "../components/Themed";
import SearchHeader from "../components/layout/SearchHeader";
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

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
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

  const apolloClient = new ApolloClient({
    uri: apiUrl,
    cache: new InMemoryCache(),
  });

  const baseHeaderProps = {
    headerTitle: "",
    header: () => <SimpleBackHeader />
  }

  return (
    <>
      <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <ProductsProvider>
          <CartProvider>
            <OrderProvider>
              <PaymentProvider>
                <ThemeProvider
                  value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
                >
                  <Stack >
                    <Stack.Screen name="(tabs)" options={{

                      header: () => <></>
                    }} />
                    <Stack.Screen name="cart" 
                     options={{
                      header: () => <></>
                    }}
                    />
                    <Stack.Screen name="products/results" options={{
                      headerStyle: {
                        backgroundColor: colors.header,
                      }, header: () => <TripResultHeader />
                    }} />
                    <Stack.Screen name="products/details/[id]" options={baseHeaderProps} />
                    <Stack.Screen name="checkout" options={{ ...baseHeaderProps,
                      header: () => <></>,
                      headerTitle: "Checkout", }} />
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
              </PaymentProvider>
            </OrderProvider>
          </CartProvider>
        </ProductsProvider>
        </AuthProvider>
      </ApolloProvider>
    </>
  );
}
