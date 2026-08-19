import { StyleSheet } from "react-native";
import { colors, radius, shadow, spacing, typography } from "./tokens";

export default StyleSheet.create({
  cardTouchable: {
    width: "46%",
    marginHorizontal: "1%",
    marginBottom: spacing.lg,
    minWidth: 0,
  },
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    overflow: "hidden",
    flexDirection: "column",
    width: "100%",
  },
  // iOS clips a layer shadow to a view with overflow: "hidden", so the card's
  // elevation has to sit on a wrapper view rather than on `card` itself.
  cardElevation: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    ...shadow.md,
  },
  infoSection: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  image: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
    backgroundColor: colors.surfaceSunken,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  tag: {
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginRight: spacing.xs,
    marginBottom: 2,
  },
  tagText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium,
    lineHeight: 15,
    color: colors.tagDefault.fg,
  },
  modalSheet: {
    backgroundColor: colors.surface,
    padding: spacing.xxl,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    ...shadow.lg,
    shadowOffset: { width: 0, height: -2 },
    minHeight: 180,
  },
  modalSheetCentered: {
    backgroundColor: colors.surfaceTranslucent,
    padding: spacing.xxl,
    borderRadius: radius.xxl,
  },
});
