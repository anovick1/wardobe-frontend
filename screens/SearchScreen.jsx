import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import debounce from "lodash/debounce";
import { searchUsers, followUser, unfollowUser } from "../api/social";
import { colors } from "../styles/colors";
import { typography } from "../styles/typography";

export default function SearchScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [followingStates, setFollowingStates] = useState({});
  const [requestedStates, setRequestedStates] = useState({});

  const performSearch = useCallback(
    debounce(async (query, pageNum = 1) => {
      if (!query.trim()) {
        setSearchResults([]);
        setHasMore(false);
        return;
      }

      try {
        setLoading(true);
        const response = await searchUsers(query, pageNum);

        const followStates = {};
        const requestStates = {};
        response.users.forEach((user) => {
          followStates[user.id] = user.is_following;
          // For now, we don't have a way to know if there's a pending request from search
          // We'll handle this when the user actually tries to follow
          requestStates[user.id] = false;
        });

        if (pageNum === 1) {
          setSearchResults(response.users);
          setFollowingStates(followStates);
          setRequestedStates(requestStates);
        } else {
          setSearchResults((prev) => [...prev, ...response.users]);
          setFollowingStates((prev) => ({ ...prev, ...followStates }));
          setRequestedStates((prev) => ({ ...prev, ...requestStates }));
        }

        setHasMore(response.page < response.total_pages);
        setPage(pageNum);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300),
    [],
  );

  const handleSearch = (text) => {
    setSearchQuery(text);
    setPage(1);
    performSearch(text, 1);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      performSearch(searchQuery, page + 1);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    performSearch(searchQuery, 1).then(() => setRefreshing(false));
  };

  const handleFollowToggle = async (userId) => {
    const isFollowing = followingStates[userId];
    const isRequested = requestedStates[userId];

    try {
      if (isFollowing) {
        // Unfollow an existing follow relationship
        await unfollowUser(userId);
        setFollowingStates((prev) => ({
          ...prev,
          [userId]: false,
        }));

        const updatedResults = searchResults.map((user) => {
          if (user.id === userId) {
            return {
              ...user,
              followers_count: user.followers_count - 1,
            };
          }
          return user;
        });
        setSearchResults(updatedResults);
      } else if (isRequested) {
        // Cancel a pending follow request (this needs a cancel endpoint)
        // For now, we'll just reset the state - you'd need to implement cancel in backend
        setRequestedStates((prev) => ({
          ...prev,
          [userId]: false,
        }));
      } else {
        // Try to follow/request
        const response = await followUser(userId);
        
        if (response.status === "requested") {
          // Follow request sent to private account
          setRequestedStates((prev) => ({
            ...prev,
            [userId]: true,
          }));
        } else if (response.status === "following") {
          // Immediately following public account
          setFollowingStates((prev) => ({
            ...prev,
            [userId]: true,
          }));

          const updatedResults = searchResults.map((user) => {
            if (user.id === userId) {
              return {
                ...user,
                followers_count: user.followers_count + 1,
              };
            }
            return user;
          });
          setSearchResults(updatedResults);
        }
      }
    } catch (error) {
      console.error("Follow/unfollow error:", error);
    }
  };

  const navigateToProfile = (userId) => {
    navigation.navigate("UserProfile", { userId });
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => navigateToProfile(item.id)}
    >
      <Image
        source={{
          uri: item.profile_photo || "https://via.placeholder.com/60",
        }}
        style={styles.profilePhoto}
      />

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        {item.username && <Text style={styles.username}>@{item.username}</Text>}
        <View style={styles.statsRow}>
          <Text style={styles.stat}>{item.followers_count} followers</Text>
          <Text style={styles.stat}>{item.following_count} following</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.followButton,
          followingStates[item.id] && styles.followingButton,
          requestedStates[item.id] && styles.requestedButton,
        ]}
        onPress={() => handleFollowToggle(item.id)}
      >
        <Text
          style={[
            styles.followButtonText,
            followingStates[item.id] && styles.followingButtonText,
            requestedStates[item.id] && styles.requestedButtonText,
          ]}
        >
          {requestedStates[item.id] 
            ? "Requested" 
            : followingStates[item.id] 
            ? "Following" 
            : "Follow"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) return null;

    if (!searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="magnify" size={64} color={colors.gray300} />
          <Text style={styles.emptyText}>Search for users to follow</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Icon name="account-search-outline" size={64} color={colors.gray300} />
        <Text style={styles.emptyText}>No users found for "{searchQuery}"</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="magnify" size={24} color={colors.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={searchResults}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray100,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    ...typography.body1,
    color: colors.text,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  profilePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.gray200,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    ...typography.body1Bold,
    color: colors.text,
  },
  username: {
    ...typography.body2,
    color: colors.gray500,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  stat: {
    ...typography.caption,
    color: colors.gray500,
    marginRight: 12,
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primary,
    minWidth: 100,
    alignItems: "center",
  },
  followingButton: {
    backgroundColor: colors.gray200,
  },
  requestedButton: {
    backgroundColor: colors.gray300,
  },
  followButtonText: {
    ...typography.body2Bold,
    color: colors.white,
  },
  followingButtonText: {
    color: colors.text,
  },
  requestedButtonText: {
    color: colors.gray600,
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
