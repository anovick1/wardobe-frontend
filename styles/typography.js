import { StyleSheet, PixelRatio } from "react-native";

const baseFontSize = 16;
const nameFontSize = Math.round(baseFontSize * PixelRatio.getFontScale());

export const typography = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  name: {
    color: "#121416",
    fontWeight: "bold",
    fontSize: 15,
    marginTop: 0,
    marginBottom: 2,
    textAlign: "left",
    lineHeight: 18,
    flexShrink: 1,
  },
  category: {
    fontSize: 14,
    color: "#777",
    marginTop: 4,
  },
  brand: {
    color: "#6a7681",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 0,
    textAlign: "left",
    lineHeight: 15,
  },
  price: {
    color: "#6a7681",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 0,
    textAlign: "left",
    lineHeight: 15,
  },
  description: {
    color: "#6a7681",
    fontSize: 11,
    marginTop: 2,
    marginBottom: 0,
    textAlign: "left",
    lineHeight: 14,
  },
  modalOption: {
    fontSize: 18,
    fontWeight: "500",
    color: "#121416",
    letterSpacing: 0.1,
    paddingVertical: 10,
    textAlign: "center",
  },
  modalOptionCancel: {
    fontSize: 18,
    fontWeight: "500",
    color: "#888",
    letterSpacing: 0.1,
    paddingVertical: 10,
    textAlign: "center",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default typography;
