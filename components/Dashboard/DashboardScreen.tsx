import { StyleSheet, View, ScrollView } from "react-native";
import HeroHeader from "./HeroHeader";
import HeroSearch from "./HeroSearch";
import { useDeviceLayout } from "../../lib/layout/deviceLayout";

const DashboardScreen = () => {
  const { useTabletLayout, horizontalGutter } = useDeviceLayout();

  if (useTabletLayout) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.splitBody,
            { paddingHorizontal: horizontalGutter, paddingBottom: 28 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.splitLeft}>
            <HeroHeader compact />
          </View>
          <View style={styles.splitRight}>
            <HeroSearch flat />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeroHeader />
      <HeroSearch />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  splitBody: {
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 20,
    paddingTop: 20,
  },
  splitLeft: {
    flex: 0.42,
    minWidth: 0,
  },
  splitRight: {
    flex: 0.58,
    minWidth: 0,
    justifyContent: "center",
  },
});

export default DashboardScreen;
