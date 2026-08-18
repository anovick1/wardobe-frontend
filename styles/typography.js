import { StyleSheet } from "react-native";
import { colors, typography as tokens } from "./tokens";

const { fontFamily, fontSize, fontWeight } = tokens;

export const typography = StyleSheet.create({
  title: {
    ...tokens.screenTitle,
    marginBottom: 20,
  },
  name: {
    ...tokens.itemName,
    marginTop: 0,
    marginBottom: 2,
    textAlign: "left",
    flexShrink: 1,
  },
  category: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.footnote,
    color: colors.inkSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  brand: {
    ...tokens.brand,
    marginBottom: 0,
    textAlign: "left",
  },
  price: {
    ...tokens.price,
    marginBottom: 0,
    textAlign: "left",
  },
  description: {
    ...tokens.caption,
    marginTop: 2,
    marginBottom: 0,
    textAlign: "left",
  },
  modalOption: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.title3,
    fontWeight: fontWeight.medium,
    lineHeight: 26,
    color: colors.ink,
    letterSpacing: 0.1,
    paddingVertical: 10,
    textAlign: "center",
  },
  modalOptionCancel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.title3,
    fontWeight: fontWeight.medium,
    lineHeight: 26,
    color: colors.inkSecondary,
    letterSpacing: 0.1,
    paddingVertical: 10,
    textAlign: "center",
  },
  body: tokens.bodyText,
  buttonText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.callout,
    fontWeight: fontWeight.semibold,
    lineHeight: 22,
    color: colors.ink,
  },
});

export default typography;
