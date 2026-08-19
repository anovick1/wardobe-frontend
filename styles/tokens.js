import { Platform } from "react-native";

export const colors = {
  paper: "#F6F1E6",
  surface: "#FFFFFF",
  surfaceSunken: "#ECE1CD",
  surfaceRaised: "#FFFFFF",
  surfaceTranslucent: "rgba(255, 255, 255, 0.9)",

  ink: "#2B2620",
  inkSecondary: "#756C5D",
  inkMuted: "#A1957F",
  inkInverse: "#F6F1E6",

  accent: "#B0523A",
  accentPressed: "#8A3D29",
  accentSubtle: "#F0DFD8",
  onAccent: "#FFFFFF",

  border: "#E2D6C0",
  borderStrong: "#DDD0B8",

  success: "#5B6A4B",
  successSubtle: "#E5E8DE",
  danger: "#A33B2A",
  dangerSubtle: "#F3DED9",
  warning: "#7F6228",
  warningSubtle: "#F2E7CE",

  tagWork: { bg: "#F0DFD8", fg: "#9A4530" },
  tagElegant: { bg: "#EFE0E4", fg: "#8C4A5A" },
  tagCasual: { bg: "#E5E8DE", fg: "#5B6A4B" },
  tagBasics: { bg: "#E8E2D2", fg: "#6D6247" },
  tagCozy: { bg: "#F2E7CE", fg: "#7F6228" },
  tagWinter: { bg: "#E4E6EA", fg: "#4F5A66" },
  tagDefault: { bg: "#ECE1CD", fg: "#6A6255" },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 30,
  pill: 999,
};

const fontFamily = {
  display: Platform.select({
    ios: "Optima",
    android: "sans-serif",
    default: "sans-serif",
  }),
  body: Platform.select({
    ios: "Avenir Next",
    android: "sans-serif",
    default: "sans-serif",
  }),
};

const fontSize = {
  caption: 11,
  small: 12,
  footnote: 13,
  body: 15,
  callout: 16,
  title3: 20,
  title2: 25,
  title1: 30,
};

const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};

export const typography = {
  fontFamily,
  fontSize,
  fontWeight,

  itemName: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    lineHeight: 20,
    color: colors.ink,
  },
  brand: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    lineHeight: 16,
    color: colors.inkSecondary,
  },
  price: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
    lineHeight: 16,
    color: colors.ink,
  },
  sectionTitle: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.title3,
    fontWeight: fontWeight.semibold,
    lineHeight: 26,
    color: colors.ink,
  },
  screenTitle: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.title1,
    fontWeight: fontWeight.bold,
    lineHeight: 36,
    color: colors.ink,
  },
  bodyText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.callout,
    fontWeight: fontWeight.regular,
    lineHeight: 24,
    color: colors.ink,
  },
  caption: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.regular,
    lineHeight: 15,
    color: colors.inkSecondary,
  },
};

export const shadow = {
  sm: {
    shadowColor: "#3C301E",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#3C301E",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: "#3C301E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 12,
  },
};

export default { colors, spacing, radius, typography, shadow };
