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
import { getUserWardrobe } from "../../api/social";
import { colors } from "../../styles/colors";
import { typography } from "../../styles/typography";

// Cache to store wardrobe data by userId
const wardrobeCache = new Map();

export default function UserWardrobeTab({ userId, canView }) {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [hasLoadedFromCache, setHasLoadedFromCache] = useState(false);

  const fetchWardrobe = async (pageNum = 1, forceRefresh = false) => {
    if (!canView) {
      setLoading(false);
      return;
    }

    // Check cache first if not refreshing and on first page
    if (!forceRefresh && pageNum === 1 && !hasLoadedFromCache) {
      const cachedData = wardrobeCache.get(userId);
      if (cachedData) {
        setItems(cachedData.items);
        setHasMore(cachedData.hasMore);
        setPage(cachedData.page);
        setLoading(false);
        setHasLoadedFromCache(true);
        return;
      }
    }

    try {
      const response = await getUserWardrobe(userId, pageNum);

      if (pageNum === 1) {
        setItems(response.items);
        // Update cache
        wardrobeCache.set(userId, {
          items: response.items,
          hasMore: response.page < response.total_pages,
          page: pageNum,
        });
      } else {
        setItems((prev) => [...prev, ...response.items]);
      }

      setHasMore(response.page < response.total_pages);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching wardrobe:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWardrobe();
  }, [userId, canView]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasLoadedFromCache(false);
    fetchWardrobe(1, true); // Force refresh
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchWardrobe(page + 1);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemContainer}
      onPress={() => navigation.navigate("WardrobeItemDetail", { 
        item: item,
        itemId: item.id 
      })}
    >
      <Image 
        source={{ uri: item.image_url }} 
        style={styles.itemImage} 
        resizeMode="contain"
      />
      <Text style={styles.itemName} numberOfLines={1}>
        {item.name}
      </Text>
      {item.brand && (
        <Text style={styles.itemBrand} numberOfLines={1}>
          {item.brand}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) return null;

    if (!canView) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="lock" size={64} color={colors.gray300} />
          <Text style={styles.emptyText}>This user's wardrobe is private</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Icon name="tshirt-crew" size={64} color={colors.gray300} />
        <Text style={styles.emptyText}>No wardrobe items yet</Text>
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
      data={items}
      renderItem={renderItem}
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
  itemContainer: {
    width: "48%",
    marginBottom: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: colors.gray200,
    marginBottom: 8,
  },
  itemName: {
    ...typography.body2Bold,
    color: colors.text,
    marginBottom: 2,
  },
  itemBrand: {
    ...typography.caption,
    color: colors.gray500,
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
