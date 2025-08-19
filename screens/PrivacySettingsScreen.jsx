import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { updateUserProfile } from "../api/social";
import { colors } from "../styles/colors";
import { typography } from "../styles/typography";

export default function PrivacySettingsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { profile } = route.params;

  const [settings, setSettings] = useState({
    is_private: profile?.is_private || false,
    allow_wardrobe_view: profile?.allow_wardrobe_view || true,
    allow_outfit_view: profile?.allow_outfit_view || true,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateUserProfile(settings);
      Alert.alert("Success", "Privacy settings updated successfully");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      Alert.alert(
        "Error",
        "Failed to update privacy settings. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Settings</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          >
            {loading ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Privacy</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Icon name="lock" size={24} color={colors.gray500} />
              <View style={styles.textContainer}>
                <Text style={styles.settingLabel}>Private Account</Text>
                <Text style={styles.settingDescription}>
                  When your account is private, only people you approve can see
                  your wardrobe and outfits
                </Text>
              </View>
            </View>
            <Switch
              value={settings.is_private}
              onValueChange={(value) => updateSetting("is_private", value)}
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibility Settings</Text>
          <Text style={styles.sectionDescription}>
            Control what followers can see when viewing your profile
          </Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Icon name="tshirt-crew" size={24} color={colors.gray500} />
              <View style={styles.textContainer}>
                <Text style={styles.settingLabel}>Show Wardrobe</Text>
                <Text style={styles.settingDescription}>
                  Allow followers to view your wardrobe items
                </Text>
              </View>
            </View>
            <Switch
              value={settings.allow_wardrobe_view}
              onValueChange={(value) =>
                updateSetting("allow_wardrobe_view", value)
              }
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Icon name="hanger" size={24} color={colors.gray500} />
              <View style={styles.textContainer}>
                <Text style={styles.settingLabel}>Show Outfits</Text>
                <Text style={styles.settingDescription}>
                  Allow followers to view your outfit creations
                </Text>
              </View>
            </View>
            <Switch
              value={settings.allow_outfit_view}
              onValueChange={(value) =>
                updateSetting("allow_outfit_view", value)
              }
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <View style={styles.infoSection}>
          <Icon name="information-outline" size={20} color={colors.gray500} />
          <Text style={styles.infoText}>
            These settings only apply to followers. Non-followers cannot see
            your content when your account is private.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  saveButton: {
    ...typography.body1Bold,
    color: colors.primary,
  },
  saveButtonDisabled: {
    color: colors.gray400,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    ...typography.body2,
    color: colors.gray500,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  settingLabel: {
    ...typography.body1Bold,
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    ...typography.caption,
    color: colors.gray500,
  },
  infoSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 20,
    marginTop: 32,
    padding: 16,
    backgroundColor: colors.gray100,
    borderRadius: 12,
  },
  infoText: {
    ...typography.caption,
    color: colors.gray600,
    marginLeft: 8,
    flex: 1,
  },
});
