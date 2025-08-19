import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { getUserProfile, followUser, unfollowUser } from "../api/social";
import UserWardrobeTab from "../components/profile/UserWardrobeTab";
import UserOutfitsTab from "../components/profile/UserOutfitsTab";
import { colors } from "../styles/colors";
import { typography } from "../styles/typography";

export default function UserProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params;

  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [routes] = useState([
    { key: "wardrobe", title: "Wardrobe" },
    { key: "outfits", title: "Outfits" },
  ]);

  const fetchProfile = async () => {
    try {
      const profileData = await getUserProfile(userId);
      setUserProfile(profileData);
      setIsFollowing(profileData.is_following);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
        setUserProfile((prev) => ({
          ...prev,
          followers_count: prev.followers_count - 1,
        }));
      } else if (isRequested) {
        // Cancel follow request (for now just reset state)
        setIsRequested(false);
      } else {
        const response = await followUser(userId);
        
        if (response.status === "requested") {
          setIsRequested(true);
        } else if (response.status === "following") {
          setIsFollowing(true);
          setUserProfile((prev) => ({
            ...prev,
            followers_count: prev.followers_count + 1,
          }));
        }
      }
    } catch (error) {
      console.error("Follow/unfollow error:", error);
    }
  };

  const navigateToFollowers = () => {
    navigation.navigate("FollowersList", { userId, type: "followers" });
  };

  const navigateToFollowing = () => {
    navigation.navigate("FollowersList", { userId, type: "following" });
  };

  const renderScene = SceneMap({
    wardrobe: () => (
      <UserWardrobeTab
        userId={userId}
        canView={userProfile?.can_view_wardrobe}
      />
    ),
    outfits: () => (
      <UserOutfitsTab userId={userId} canView={userProfile?.can_view_outfits} />
    ),
  });

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: colors.primary }}
      style={{ backgroundColor: colors.background }}
      labelStyle={{ ...typography.body2Bold, color: colors.text }}
      activeColor={colors.primary}
      inactiveColor={colors.gray500}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isPrivateAndNotFollowing =
    userProfile?.is_private && !userProfile?.is_followed_by;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.profileSection}>
          <Image
            source={{
              uri:
                userProfile?.profile_photo || "https://via.placeholder.com/120",
            }}
            style={styles.profilePhoto}
          />

          <Text style={styles.name}>{userProfile?.name || "User"}</Text>
          {userProfile?.username && (
            <Text style={styles.username}>@{userProfile.username}</Text>
          )}

          {userProfile?.bio && (
            <Text style={styles.bio}>{userProfile.bio}</Text>
          )}

          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.stat} onPress={navigateToFollowers}>
              <Text style={styles.statNumber}>
                {userProfile?.followers_count || 0}
              </Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.stat} onPress={navigateToFollowing}>
              <Text style={styles.statNumber}>
                {userProfile?.following_count || 0}
              </Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.followButton, 
              isFollowing && styles.followingButton,
              isRequested && styles.requestedButton,
            ]}
            onPress={handleFollowToggle}
          >
            <Text
              style={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText,
                isRequested && styles.requestedButtonText,
              ]}
            >
              {isRequested ? "Requested" : isFollowing ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>

          {userProfile?.style_tags && userProfile.style_tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {userProfile.style_tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {isPrivateAndNotFollowing ? (
          <View style={styles.privateContainer}>
            <Icon name="lock" size={64} color={colors.gray300} />
            <Text style={styles.privateTitle}>This Account is Private</Text>
            <Text style={styles.privateText}>
              Follow to see their wardrobe and outfits
            </Text>
          </View>
        ) : (
          <View style={styles.tabViewContainer}>
            <TabView
              navigationState={{ index: tabIndex, routes }}
              renderScene={renderScene}
              onIndexChange={setTabIndex}
              renderTabBar={renderTabBar}
              lazy
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                />
              }
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray200,
    marginBottom: 16,
  },
  name: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 4,
  },
  username: {
    ...typography.body1,
    color: colors.gray500,
    marginBottom: 8,
  },
  bio: {
    ...typography.body2,
    color: colors.text,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  stat: {
    alignItems: "center",
    marginHorizontal: 30,
  },
  statNumber: {
    ...typography.h3,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.gray500,
    marginTop: 4,
  },
  followButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 60,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
  },
  followingButton: {
    backgroundColor: colors.gray200,
  },
  requestedButton: {
    backgroundColor: colors.gray300,
  },
  followButtonText: {
    ...typography.body1Bold,
    color: colors.white,
  },
  followingButtonText: {
    color: colors.text,
  },
  requestedButtonText: {
    color: colors.gray600,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 8,
  },
  tag: {
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
  },
  privateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  privateTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  privateText: {
    ...typography.body2,
    color: colors.gray500,
  },
  tabViewContainer: {
    flex: 1,
  },
});
