import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import api from "../api";
import { colors } from "../styles/colors";
import { typography } from "../styles/typography";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 30) / 2;

export default function BoardDetailsScreen({ route, navigation }) {
  const { board } = route.params;
  const [boardDetails, setBoardDetails] = useState(board);
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPins, setLoadingPins] = useState(true);

  useEffect(() => {
    fetchBoardData();
  }, []);

  const fetchBoardData = async () => {
    try {
      setLoading(true);
      const [detailsResponse, pinsResponse] = await Promise.all([
        api.get(`/pinterest/boards/${board.id}`),
        api.get(`/pinterest/boards/${board.id}/pins`),
      ]);

      if (detailsResponse.data.board) {
        setBoardDetails(detailsResponse.data.board);
      }

      setPins(pinsResponse.data.pins || []);
    } catch (error) {
      console.error("Error fetching board data:", error);
    } finally {
      setLoading(false);
      setLoadingPins(false);
    }
  };

  const renderPinItem = ({ item }) => {
    const imageHeight = item.media?.images?.["400x300"]?.height || 200;
    const aspectRatio = COLUMN_WIDTH / imageHeight;

    return (
      <TouchableOpacity style={[styles.pinCard, { aspectRatio }]}>
        {item.media?.images?.["400x300"]?.url && (
          <Image
            source={{ uri: item.media.images["400x300"].url }}
            style={styles.pinImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.pinOverlay}>
          {item.title && (
            <Text style={styles.pinTitle} numberOfLines={2}>
              {item.title}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.headerSection}>
      {boardDetails.media?.image_cover_url && (
        <Image
          source={{ uri: boardDetails.media.image_cover_url }}
          style={styles.headerImage}
        />
      )}
      <View style={styles.boardInfoContainer}>
        <Text style={styles.boardTitle}>{boardDetails.name}</Text>
        {boardDetails.description && (
          <Text style={styles.boardDescription}>
            {boardDetails.description}
          </Text>
        )}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="push-pin" size={20} color={colors.primary} />
            <Text style={styles.statText}>
              {boardDetails.pin_count || 0} pins
            </Text>
          </View>
          {boardDetails.follower_count !== undefined && (
            <View style={styles.statItem}>
              <Icon name="people" size={20} color={colors.primary} />
              <Text style={styles.statText}>
                {boardDetails.follower_count} followers
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Pins</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Board Details</Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={pins}
        renderItem={renderPinItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.pinsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loadingPins ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.pinsLoader}
            />
          ) : (
            <Text style={styles.noPinsText}>
              No pins in this board yet. Add some pins on Pinterest!
            </Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...typography.title,
    fontSize: 18,
  },
  headerSection: {
    marginBottom: 20,
  },
  headerImage: {
    width: "100%",
    height: 200,
    backgroundColor: colors.surface,
  },
  boardInfoContainer: {
    padding: 20,
    backgroundColor: colors.surface,
    marginBottom: 10,
  },
  boardTitle: {
    ...typography.title,
    fontSize: 24,
    marginBottom: 10,
  },
  boardDescription: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: "row",
    gap: 20,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statText: {
    ...typography.body,
    color: colors.text.primary,
  },
  sectionTitle: {
    ...typography.subtitle,
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 10,
  },
  pinsList: {
    paddingBottom: 20,
  },
  pinCard: {
    flex: 1,
    margin: 5,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  pinImage: {
    width: "100%",
    height: "100%",
  },
  pinOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  pinTitle: {
    ...typography.caption,
    color: "white",
    fontWeight: "600",
  },
  pinsLoader: {
    marginVertical: 40,
  },
  noPinsText: {
    ...typography.body,
    textAlign: "center",
    color: colors.text.secondary,
    marginVertical: 40,
    paddingHorizontal: 40,
  },
});