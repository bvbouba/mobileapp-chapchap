import { useRouter } from "expo-router";
import { Platform, StyleSheet } from "react-native";
import { IconButton } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, colors } from "../Themed";
import LoadingIndicator from "./LoadingIndicator";

const SimpleBackHeader = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.outerContainer, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <IconButton
          icon="arrow-left"
          onPress={() => router.back()}
          style={styles.iconButton}
          iconColor={colors.blue}
          size={28}
        />
      </View>
      <LoadingIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 0, 
  },
  content: {
    height: 56, 
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  iconButton: {
    margin: 0,
    marginLeft: Platform.OS === "android" ? -4 : 0,
  },
});

export default SimpleBackHeader;