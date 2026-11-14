import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useColorScheme, StyleSheet, View as RNView } from 'react-native';

import { Text, View } from '../../components/Themed';
import Colors from '../../constants/Colors';
import { useDeviceLayout } from '../../lib/layout/deviceLayout';
import { TabletNavRail } from '../../components/layout/TabletNavRail';

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  number?: number
}) {
  return <View style={{ position: "relative" }}>
    <Ionicons size={24} style={{ marginBottom: -3 }} {...props} />
    {props.number && <Text style={styles.cartCountIcon}>{props.number}</Text>}
  </View>

}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { useTabletLayout } = useDeviceLayout();

  return (
    <RNView style={{ flex: 1, flexDirection: useTabletLayout ? "row" : "column" }}>
      {useTabletLayout ? <TabletNavRail /> : null}
      <RNView style={{ flex: 1, minWidth: 0 }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
            tabBarInactiveTintColor: "#606060",
            tabBarStyle: useTabletLayout
              ? { display: "none", height: 0 }
              : {
                  backgroundColor: "#FFFFFF",
                  borderTopColor: "#D7D8DB",
                },
            tabBarLabelStyle: {
              fontFamily: 'TTNormsPro-Regular',
              fontWeight: "600",
              fontSize: 12,
            },
            headerStyle: {
            }
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Recherche',
              headerShown: false,
              tabBarIcon: ({ color }) => <TabBarIcon name="search-outline" color={color} />,
            }}
          />
          <Tabs.Screen
            name="trips"
            options={{
              title: 'Mes Voyages',
              headerShown: false,
              tabBarIcon: ({ color }) => {
                return <TabBarIcon name="ticket-outline"
                  color={color}
                />
              },
            }}
          />
          <Tabs.Screen
            name="account"
            options={{
              title: 'Profil',
              headerShown: false,
              tabBarIcon: ({ color }) => <TabBarIcon name="person-outline" color={color} />,
            }}
          />
        </Tabs>
      </RNView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  cartCountIcon: {
    position: 'absolute',
    right: -20
  },
});
