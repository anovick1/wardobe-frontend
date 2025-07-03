import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import colors from "../../styles/colors";
import typography from "../../styles/typography";

export default function InsufficientWardrobeModal({
  visible,
  onClose,
  validationMessage,
}) {
  const navigation = useNavigation();

  const handleAddItems = () => {
    onClose();
    // Navigate to wardrobe tab and show add modal
    navigation.navigate("Wardrobe", {
      screen: "WardrobeHome",
      params: {
        initialTab: "Wardrobe",
        showAddModal: true,
      },
    });
  };

  const formatRule = (rule) => {
    return rule.join(" + ");
  };

  if (!validationMessage) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={styles.iconContainer}>
                <Ionicons
                  name="shirt-outline"
                  size={48}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.title}>{validationMessage.title}</Text>
              <Text style={styles.message}>{validationMessage.message}</Text>
              {validationMessage.subMessage && (
                <Text style={styles.subMessage}>
                  {validationMessage.subMessage}
                </Text>
              )}

              {validationMessage.rules && (
                <View style={styles.rulesContainer}>
                  <Text style={styles.rulesTitle}>Required outfit combinations:</Text>
                  <View style={styles.rulesGrid}>
                    {validationMessage.rules.map((rule, index) => (
                      <View key={index} style={styles.ruleItem}>
                        <Text style={styles.ruleText}>{formatRule(rule)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddItems}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={24}
                    color={colors.white}
                  />
                  <Text style={styles.addButtonText}>
                    Add Items to Wardrobe
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Maybe Later</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1,
  },
  iconContainer: {
    backgroundColor: colors.background,
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    ...typography.subtitle,
    fontSize: 20,
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 4,
  },
  subMessage: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  rulesContainer: {
    marginBottom: 24,
    alignItems: "center",
    width: "100%",
  },
  rulesTitle: {
    ...typography.small,
    color: colors.text,
    marginBottom: 12,
    fontWeight: "600",
  },
  rulesGrid: {
    width: "100%",
    gap: 8,
  },
  ruleItem: {
    backgroundColor: colors.background,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "center",
  },
  ruleText: {
    ...typography.body,
    color: colors.text,
    fontSize: 14,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  addButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  addButtonText: {
    ...typography.buttonText,
    color: colors.white,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
