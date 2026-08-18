import { StyleSheet } from "react-native";
import { colors, spacing } from "./tokens";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.xl,
  },
  list: {
    paddingBottom: 100,
  },
});
