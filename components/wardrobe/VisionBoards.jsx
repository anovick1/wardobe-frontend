import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  FlatList,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useNavigation } from "@react-navigation/native";
import api from "../../api";
import { colors } from "../../styles/colors";
import { typography } from "../../styles/typography";

// Make sure to complete auth sessions
WebBrowser.maybeCompleteAuthSession();

const PINTEREST_CLIENT_ID = "1526909";
// Use direct app scheme for OAuth
const REDIRECT_URI = "wardrobe://pinterest-callback/";
const SCOPES = "boards:read,pins:read,user_accounts:read";

export default function VisionBoards() {
  const navigation = useNavigation();
  const [isPinterestLinked, setIsPinterestLinked] = useState(false);
  const [pinterestUsername, setPinterestUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [boards, setBoards] = useState([]);
  const [loadingBoards, setLoadingBoards] = useState(false);

  useEffect(() => {
    checkPinterestStatus();
  }, []);

  const checkPinterestStatus = async () => {
    try {
      const response = await api.get("/pinterest/status");
      setIsPinterestLinked(response.data.linked);
      setPinterestUsername(response.data.pinterest_username);

      if (response.data.linked) {
        fetchPinterestBoards();
      }
    } catch (error) {
      console.error("Error checking Pinterest status:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPinterestBoards = async () => {
    try {
      setLoadingBoards(true);
      const response = await api.get("/pinterest/boards");
      setBoards(response.data.boards || []);
    } catch (error) {
      console.error("Error fetching Pinterest boards:", error);
    } finally {
      setLoadingBoards(false);
    }
  };

  const handlePinterestAuth = async () => {
    try {
      const authUrl = `https://www.pinterest.com/oauth/?client_id=${PINTEREST_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
      )}&response_type=code&scope=${SCOPES}`;

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        REDIRECT_URI
      );

      if (result.type === "success" && result.url) {
        // Extract the code from the redirect URL
        const url = new URL(result.url);
        const code = url.searchParams.get("code");

        if (code) {
          setLoading(true);
          try {
            // Send the code to our backend
            const response = await api.post("/pinterest/link", {
              code: code,
              redirect_uri: REDIRECT_URI,
            });

            if (response.data.success) {
              Alert.alert("Success", "Pinterest account linked successfully!");
              await checkPinterestStatus();
            }
          } catch (error) {
            console.error("Error linking Pinterest:", error);
            console.error("Error response:", error.response?.data);
            const errorMessage =
              error.response?.data?.error ||
              "Failed to link Pinterest account. Please try again.";
            Alert.alert("Error", errorMessage);
          } finally {
            setLoading(false);
          }
        }
      }
    } catch (error) {
      console.error("Pinterest auth error:", error);
      Alert.alert("Error", "Failed to open Pinterest authorization.");
    }
  };

  const handleUnlinkPinterest = () => {
    Alert.alert(
      "Unlink Pinterest",
      "Are you sure you want to unlink your Pinterest account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unlink",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await api.post("/pinterest/unlink");
              setIsPinterestLinked(false);
              setPinterestUsername(null);
              Alert.alert("Success", "Pinterest account unlinked.");
            } catch (error) {
              console.error("Error unlinking Pinterest:", error);
              Alert.alert("Error", "Failed to unlink Pinterest account.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderBoardItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.boardCard}
      onPress={() => navigation.navigate("BoardDetails", { board: item })}
    >
      {item.media?.image_cover_url && (
        <Image
          source={{ uri: item.media.image_cover_url }}
          style={styles.boardImage}
          defaultSource={{
            uri: "https://via.placeholder.com/150x150/f0f0f0/999999?text=Board",
          }}
        />
      )}
      <View style={styles.boardInfo}>
        <Text style={styles.boardName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.description && (
          <Text style={styles.boardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <Text style={styles.boardStats}>{item.pin_count || 0} pins</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="push-pin" size={48} color={colors.primary} />
        <Text style={styles.title}>Vision Boards</Text>
      </View>

      {!isPinterestLinked ? (
        <View style={styles.connectSection}>
          <Text style={styles.description}>
            Connect your Pinterest account to create and sync vision boards with
            your wardrobe
          </Text>
          <TouchableOpacity
            style={styles.connectButton}
            onPress={handlePinterestAuth}
          >
            <Icon name="link" size={24} color="white" />
            <Text style={styles.connectButtonText}>Connect Pinterest</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.linkedSection}>
          <View style={styles.linkedInfo}>
            <Icon name="check-circle" size={24} color={colors.success} />
            <Text style={styles.linkedText}>
              Connected as @{pinterestUsername}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.unlinkButton}
            onPress={handleUnlinkPinterest}
          >
            <Text style={styles.unlinkButtonText}>Unlink Account</Text>
          </TouchableOpacity>

          <View style={styles.boardsSection}>
            <Text style={styles.boardsTitle}>Your Pinterest Boards</Text>

            {loadingBoards ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.boardsLoader}
              />
            ) : boards.length > 0 ? (
              <FlatList
                data={boards}
                renderItem={renderBoardItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.boardsList}
              />
            ) : (
              <Text style={styles.noBoardsText}>
                No boards found. Create some boards on Pinterest to see them
                here!
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    ...typography.title,
    marginTop: 10,
  },
  description: {
    ...typography.body,
    textAlign: "center",
    marginBottom: 30,
    color: colors.text.secondary,
  },
  connectSection: {
    alignItems: "center",
    marginTop: 20,
  },
  connectButton: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
    gap: 10,
  },
  connectButtonText: {
    ...typography.buttonText,
    color: "white",
  },
  linkedSection: {
    alignItems: "center",
    marginTop: 20,
  },
  linkedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  linkedText: {
    ...typography.body,
    color: colors.success,
  },
  unlinkButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  unlinkButtonText: {
    ...typography.body,
    color: colors.error,
  },
  comingSoonSection: {
    marginTop: 40,
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: 10,
  },
  comingSoonText: {
    ...typography.body,
    textAlign: "center",
    color: colors.text.secondary,
  },
  boardsSection: {
    marginTop: 30,
    width: "100%",
  },
  boardsTitle: {
    ...typography.subtitle,
    marginBottom: 15,
    textAlign: "center",
  },
  boardsLoader: {
    marginVertical: 20,
  },
  boardsList: {
    paddingBottom: 20,
  },
  boardCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    margin: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  boardImage: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: colors.background,
  },
  boardInfo: {
    padding: 12,
  },
  boardName: {
    ...typography.subtitle,
    fontSize: 14,
    marginBottom: 4,
  },
  boardDescription: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  boardStats: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  noBoardsText: {
    ...typography.body,
    textAlign: "center",
    color: colors.text.secondary,
    marginVertical: 20,
    paddingHorizontal: 20,
  },
});
