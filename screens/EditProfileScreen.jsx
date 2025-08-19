import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { updateUserProfile } from "../api/social";
import { uploadProfilePhoto } from "../api/user";
import { colors } from "../styles/colors";
import { typography } from "../styles/typography";

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { profile } = route.params;

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
    profile_photo: profile?.profile_photo || "",
    style_tags: profile?.style_tags || [],
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    try {
      setLoading(true);
      await updateUserProfile(formData);
      navigation.goBack();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    try {
      setUploading(true);
      const photoUrl = await uploadProfilePhoto(uri);
      setFormData({ ...formData, profile_photo: photoUrl });
    } catch (error) {
      console.error("Error uploading photo:", error);
      Alert.alert("Error", "Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const addStyleTag = () => {
    Alert.prompt(
      "Add Style Tag",
      "Enter a style tag",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Add",
          onPress: (tag) => {
            if (tag && tag.trim()) {
              setFormData({
                ...formData,
                style_tags: [...formData.style_tags, tag.trim()],
              });
            }
          },
        },
      ],
      "plain-text",
    );
  };

  const removeStyleTag = (index) => {
    const newTags = [...formData.style_tags];
    newTags.splice(index, 1);
    setFormData({ ...formData, style_tags: newTags });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.saveButton}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.photoSection}>
            <TouchableOpacity onPress={pickImage} disabled={uploading}>
              <Image
                source={{
                  uri:
                    formData.profile_photo || "https://via.placeholder.com/120",
                }}
                style={styles.profilePhoto}
              />
              {uploading ? (
                <View style={styles.photoOverlay}>
                  <ActivityIndicator size="small" color={colors.white} />
                </View>
              ) : (
                <View style={styles.photoOverlay}>
                  <Icon name="camera" size={24} color={colors.white} />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                placeholder="Your name"
                placeholderTextColor={colors.gray400}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={formData.username}
                onChangeText={(text) =>
                  setFormData({ ...formData, username: text.toLowerCase() })
                }
                placeholder="username"
                placeholderTextColor={colors.gray400}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                placeholder="Tell us about yourself"
                placeholderTextColor={colors.gray400}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Style Tags</Text>
                <TouchableOpacity onPress={addStyleTag}>
                  <Icon name="plus-circle" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.tagsContainer}>
                {formData.style_tags.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.tag}
                    onPress={() => removeStyleTag(index)}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                    <Icon name="close" size={16} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    paddingBottom: 40,
  },
  photoSection: {
    alignItems: "center",
    paddingVertical: 30,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray200,
  },
  photoOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  changePhotoText: {
    ...typography.body2,
    color: colors.primary,
    marginTop: 12,
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    ...typography.body2Bold,
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...typography.body1,
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    ...typography.caption,
    color: colors.primary,
    marginRight: 4,
  },
});
