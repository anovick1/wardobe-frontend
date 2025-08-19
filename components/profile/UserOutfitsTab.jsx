import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { getUserOutfits } from "../../api/social";
import { colors } from "../../styles/colors";
import { typography } from "../../styles/typography";

// Cache to store outfit data by userId
const outfitCache = new Map();

export default function UserOutfitsTab({ userId, canView }) {
  const navigation = useNavigation();
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [hasLoadedFromCache, setHasLoadedFromCache] = useState(false);

  const fetchOutfits = async (pageNum = 1, forceRefresh = false) => {
    if (!canView) {
      setLoading(false);
      return;
    }

    // Check cache first if not refreshing and on first page
    if (!forceRefresh && pageNum === 1 && !hasLoadedFromCache) {
      const cachedData = outfitCache.get(userId);
      if (cachedData) {
        setOutfits(cachedData.outfits);
        setHasMore(cachedData.hasMore);
        setPage(cachedData.page);
        setLoading(false);
        setHasLoadedFromCache(true);
        return;
      }
    }

    try {
      const response = await getUserOutfits(userId, pageNum);

      if (pageNum === 1) {
        setOutfits(response.outfits);
        // Update cache
        outfitCache.set(userId, {
          outfits: response.outfits,
          hasMore: response.page < response.total_pages,
          page: pageNum,
        });
      } else {
        setOutfits((prev) => [...prev, ...response.outfits]);
      }

      setHasMore(response.page < response.total_pages);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching outfits:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOutfits();
  }, [userId, canView]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasLoadedFromCache(false);
    fetchOutfits(1, true); // Force refresh
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchOutfits(page + 1);
    }
  };

  const renderOutfit = ({ item }) => (
    <TouchableOpacity 
      style={styles.outfitContainer}
      onPress={() => navigation.navigate("OutfitDetail", { 
        outfit: item, 
        outfitId: item.id,
        userId: userId,
        isOtherUser: true
      })}
    >
      <Image
        source={{ uri: item.composite_image_url || "https://via.placeholder.com/200" }}
        style={styles.outfitImage}
        resizeMode="contain"
      />
      <View style={styles.outfitInfo}>
        <Text style={styles.outfitName} numberOfLines={1}>
          {item.title || item.name || "Untitled Outfit"}
        </Text>
        <View style={styles.outfitStats}>
          <View style={styles.stat}>
            <Icon name="heart-outline" size={16} color={colors.gray500} />
            <Text style={styles.statText}>{item.likes_count || 0}</Text>
          </View>
          {item.occasion && (
            <Text style={styles.occasion} numberOfLines={1}>
              {item.occasion}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) return null;

    if (!canView) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="lock" size={64} color={colors.gray300} />
          <Text style={styles.emptyText}>This user's outfits are private</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Icon name="hanger" size={64} color={colors.gray300} />
        <Text style={styles.emptyText}>No outfits yet</Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading || page === 1) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  if (loading && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={outfits}
      renderItem={renderOutfit}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.3}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
      scrollEnabled={true}
      nestedScrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  row: {
    justifyContent: "space-between",
  },
  outfitContainer: {
    width: "48%",
    marginBottom: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  outfitImage: {
    width: "100%",
    aspectRatio: 0.75,
    backgroundColor: colors.gray200,
  },
  outfitInfo: {
    padding: 12,
  },
  outfitName: {
    ...typography.body2Bold,
    color: colors.text,
    marginBottom: 4,
  },
  outfitStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    ...typography.caption,
    color: colors.gray500,
    marginLeft: 4,
  },
  occasion: {
    ...typography.caption,
    color: colors.gray500,
    flex: 1,
    textAlign: "right",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyText: {
    ...typography.body1,
    color: colors.gray400,
    marginTop: 16,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
