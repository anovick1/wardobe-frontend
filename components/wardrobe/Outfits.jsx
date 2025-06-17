import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import OutfitCard from "./OutfitCard";
import api from "../../api";
import globalStyles from "../../styles/global";

export default function Outfits() {
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const navigation = useNavigation();

  const fetchOutfits = async (pageNum = 1, isRefresh = false) => {
    try {
      if (pageNum === 1 && !isRefresh) {
        setLoading(true);
      } else if (pageNum > 1) {
        setLoadingMore(true);
      }

      const response = await api.get(`/outfits/?page=${pageNum}`);
      const { outfits: newOutfits, pagination } = response.data;

      if (pageNum === 1) {
        setOutfits(newOutfits);
      } else {
        setOutfits((prev) => [...prev, ...newOutfits]);
      }

      setHasMore(pagination.has_next);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch outfits:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const generateOutfitWithAI = async () => {
    if (!prompt.trim()) {
      Alert.alert("Error", "Please enter a prompt for the outfit");
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post("/outfits/ai_generate_hybrid", {
        prompt: prompt.trim(),
      });

      const { outfit } = response.data;

      // Close modal and reset prompt
      setModalVisible(false);
      setPrompt("");

      // Navigate to outfit detail
      navigation.navigate("OutfitDetail", { outfitId: outfit.id });

      // Refresh outfits list
      fetchOutfits(1, true);
    } catch (error) {
      console.error("Failed to generate outfit:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error ||
          "Failed to generate outfit. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchOutfits(1);
    }, [])
  );

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchOutfits(page + 1);
    }
  };

  const renderItem = ({ item }) => <OutfitCard item={item} />;

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        style={styles.generateButton}
        onPress={() => setModalVisible(true)}
        disabled={generating}
      >
        <Icon name="auto-awesome" size={24} color="#007AFF" />
        <Text style={styles.generateButtonText}>Generate Outfit with AI</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.container} edges={["left", "right"]}>
      {loading ? (
        <ActivityIndicator
          testID="outfits-loading"
          size="large"
          style={{ marginTop: 40 }}
        />
      ) : outfits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No outfits yet.</Text>
        </View>
      ) : (
        <FlatList
          data={outfits}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListHeaderComponent={renderHeader}
        />
      )}

      {/* AI Generate Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generate Outfit with AI</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.promptLabel}>
              Describe the outfit you want:
            </Text>

            <TextInput
              style={styles.promptInput}
              placeholder="e.g., Casual summer outfit for a coffee date"
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.generateActionButton,
                  generating && styles.buttonDisabled,
                ]}
                onPress={generateOutfitWithAI}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="auto-awesome" size={20} color="#fff" />
                    <Text style={styles.generateActionButtonText}>
                      Generate
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    // borderBottomWidth: 1,
    // borderBottomColor: "#e5e7eb",
    // backgroundColor: "#fff",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e0f2fe",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  generateButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  columnWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  listContent: {
    paddingHorizontal: 15,
    paddingTop: 0,
    paddingBottom: 16,
  },
  emptyText: {
    color: "#6a7681",
    textAlign: "center",
    marginTop: 30,
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 40,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#121416",
  },
  closeButton: {
    padding: 4,
  },
  promptLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "500",
  },
  generateActionButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  generateActionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
