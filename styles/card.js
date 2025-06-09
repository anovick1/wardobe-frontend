import { StyleSheet } from "react-native";

export default StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 2,
    flexDirection: "column",
  },
  infoSection: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  image: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 6,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 2,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#374151",
  },
  modalSheet: {
    backgroundColor: "#fff",
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
    minHeight: 180,
  },
});
