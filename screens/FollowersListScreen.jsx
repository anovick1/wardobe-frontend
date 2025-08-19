import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  getUserFollowers,
  getUserFollowing,
  followUser,
  unfollowUser,
} from "../api/social";
import { colors } from "../styles/colors";
import { typography } from "../styles/typography";

export default function FollowersListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, type } = route.params;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [followingStates, setFollowingStates] = useState({});

  const fetchUsers = async (pageNum = 1) => {
    try {
      const fetchFunction =
        type === "followers" ? getUserFollowers : getUserFollowing;
      const response = await fetchFunction(userId, pageNum);

      const data =
        type === "followers" ? response.followers : response.following;
      const followStates = {};
      data.forEach((user) => {
        followStates[user.id] = user.is_following;
      });

      if (pageNum === 1) {
        setUsers(data);
        setFollowingStates(followStates);
      } else {
        setUsers((prev) => [...prev, ...data]);
        setFollowingStates((prev) => ({ ...prev, ...followStates }));
      }

      setHasMore(response.page < response.total_pages);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [userId, type]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchUsers(1);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchUsers(page + 1);
    }
  };

  const handleFollowToggle = async (targetUserId) => {
    const isFollowing = followingStates[targetUserId];

    try {
      if (isFollowing) {
        await unfollowUser(targetUserId);
      } else {
        await followUser(targetUserId);
      }

      setFollowingStates((prev) => ({
        ...prev,
        [targetUserId]: !isFollowing,
      }));

      const updatedUsers = users.map((user) => {
        if (user.id === targetUserId) {
          return {
            ...user,
            followers_count: isFollowing
              ? user.followers_count - 1
              : user.followers_count + 1,
          };
        }
        return user;
      });
      setUsers(updatedUsers);
    } catch (error) {
      console.error("Follow/unfollow error:", error);
    }
  };

  const navigateToProfile = (profileUserId) => {
    navigation.push("UserProfile", { userId: profileUserId });
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => navigateToProfile(item.id)}
    >
      <Image
        source={{
          uri: item.profile_photo || "https://via.placeholder.com/50",
        }}
        style={styles.profilePhoto}
      />

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        {item.username && <Text style={styles.username}>@{item.username}</Text>}
      </View>

      <TouchableOpacity
        style={[
          styles.followButton,
          followingStates[item.id] && styles.followingButton,
        ]}
        onPress={() => handleFollowToggle(item.id)}
      >
        <Text
          style={[
            styles.followButtonText,
            followingStates[item.id] && styles.followingButtonText,
          ]}
        >
          {followingStates[item.id] ? "Following" : "Follow"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Icon
          name={
            type === "followers"
              ? "account-group-outline"
              : "account-multiple-outline"
          }
          size={64}
          color={colors.gray300}
        />
        <Text style={styles.emptyText}>No {type} yet</Text>
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type === "followers" ? "Followers" : "Following"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={users}
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
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  profilePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primary,
    minWidth: 90,
    alignItems: "center",
  },
  followingButton: {
    backgroundColor: colors.gray200,
  },
  followButtonText: {
    ...typography.body2Bold,
    color: colors.white,
  },
  followingButtonText: {
    color: colors.text,
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
