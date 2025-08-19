import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "../auth/AuthContext";
import { signOut } from "../auth/signOut";
import { getCurrentUser } from "../api/user";
import { getFollowRequests } from "../api/followRequests";
import { colors } from "../styles/colors";
import { typography } from "../styles/typography";

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user: authUser, setUser: setAuthUser } = useContext(AuthContext);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followRequestsCount, setFollowRequestsCount] = useState(0);

  const fetchProfile = async () => {
    try {
      const profileData = await getCurrentUser();
      setUserProfile(profileData);
      
      // Fetch follow requests count if user has private account
      if (profileData?.is_private) {
        try {
          const requestsData = await getFollowRequests(1, 1);
          setFollowRequestsCount(requestsData.total || 0);
        } catch (error) {
          console.error("Error fetching follow requests count:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, []),
  );

  const handleLogout = async () => {
    try {
      await signOut();
      setAuthUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const navigateToEdit = () => {
    navigation.navigate("EditProfile", { profile: userProfile });
  };

  const navigateToFollowers = () => {
    navigation.navigate("FollowersList", {
      userId: userProfile.id,
      type: "followers",
    });
  };

  const navigateToFollowing = () => {
    navigation.navigate("FollowersList", {
      userId: userProfile.id,
      type: "following",
    });
  };

  const navigateToPrivacySettings = () => {
    navigation.navigate("PrivacySettings", { profile: userProfile });
  };

  const navigateToFollowRequests = () => {
    navigation.navigate("FollowRequests");
  };

  const navigateToWardrobe = () => {
    navigation.navigate("Wardrobe");
  };

  const navigateToOutfits = () => {
    navigation.navigate("Wardrobe");
  };

  const renderOutfitItem = ({ item, key }) => (
    <TouchableOpacity 
      key={key} 
      style={styles.gridItem}
      onPress={() => navigation.navigate("OutfitDetail", { 
        outfit: item, 
        outfitId: item.id 
      })}
    >
      <Image
        source={{ uri: item.composite_image_url || "https://via.placeholder.com/150/cccccc/666666?text=Outfit" }}
        style={styles.gridImage}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );

  const renderWardrobeItem = ({ item, key }) => (
    <TouchableOpacity 
      key={key} 
      style={styles.gridItem}
      onPress={() => navigation.navigate("WardrobeItemDetail", { 
        item: item,
        itemId: item.id 
      })}
    >
      <Image
        source={{ uri: item.image_url || "https://via.placeholder.com/150" }}
        style={styles.gridImage}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );

  const renderGrid = (items, renderItem) => {
    const rows = [];
    for (let i = 0; i < items.length; i += 3) {
      const rowItems = items.slice(i, i + 3);
      rows.push(
        <View key={i} style={styles.gridRow}>
          {rowItems.map((item, index) => renderItem({ item, index: i + index, key: item.id }))}
          {/* Fill empty spaces in incomplete rows */}
          {rowItems.length < 3 &&
            Array.from({ length: 3 - rowItems.length }).map((_, emptyIndex) => (
              <View
                key={`empty-${i}-${emptyIndex}`}
                style={[styles.gridItem, { backgroundColor: "transparent" }]}
              />
            ))}
        </View>
      );
    }
    return rows;
  };

  const renderContentSection = () => {
    const hasOutfits = userProfile?.recent_outfits?.length > 0;
    const hasItems = userProfile?.recent_wardrobe_items?.length > 0;

    if (!hasOutfits && !hasItems) {
      return (
        <View style={styles.emptyContent}>
          <Icon name="tshirt-crew-outline" size={64} color={colors.gray300} />
          <Text style={styles.emptyText}>Start building your wardrobe!</Text>
          <Text style={styles.emptySubtext}>
            Add items and create outfits to see them here
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.contentSections}>
        {hasOutfits && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Outfits</Text>
              <TouchableOpacity onPress={navigateToOutfits}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.gridContainer}>
              {renderGrid(userProfile.recent_outfits, renderOutfitItem)}
            </View>
          </View>
        )}

        {hasItems && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Items</Text>
              <TouchableOpacity onPress={navigateToWardrobe}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.gridContainer}>
              {renderGrid(userProfile.recent_wardrobe_items, renderWardrobeItem)}
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {userProfile?.is_private && followRequestsCount > 0 && (
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={navigateToFollowRequests}
            >
              <Icon name="bell" size={24} color={colors.text} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{followRequestsCount}</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={navigateToPrivacySettings}
          >
            <Icon name="cog" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

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

            <View style={styles.stat}>
              <Text style={styles.statNumber}>
                {userProfile?.wardrobe_items_count || 0}
              </Text>
              <Text style={styles.statLabel}>Items</Text>
            </View>

            <View style={styles.stat}>
              <Text style={styles.statNumber}>
                {userProfile?.outfits_count || 0}
              </Text>
              <Text style={styles.statLabel}>Outfits</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editButton} onPress={navigateToEdit}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.privacySection}>
          <Text style={styles.sectionTitle}>Privacy</Text>

          <View style={styles.privacyItem}>
            <View style={styles.privacyInfo}>
              <Icon name="lock" size={20} color={colors.gray500} />
              <Text style={styles.privacyLabel}>Private Account</Text>
            </View>
            <Text style={styles.privacyValue}>
              {userProfile?.is_private ? "On" : "Off"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.privacyItem}
            onPress={navigateToPrivacySettings}
          >
            <View style={styles.privacyInfo}>
              <Icon name="shield-account" size={20} color={colors.gray500} />
              <Text style={styles.privacyLabel}>Privacy Settings</Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        <View style={styles.tagsSection}>
          {userProfile?.style_tags && userProfile.style_tags.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Style Tags</Text>
              <View style={styles.tagsContainer}>
                {userProfile.style_tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {renderContentSection()}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  notificationButton: {
    padding: 8,
    position: "relative",
  },
  settingsButton: {
    padding: 8,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "bold",
    fontSize: 12,
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
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  stat: {
    alignItems: "center",
    flex: 1,
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
  editButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
  },
  editButtonText: {
    ...typography.body1Bold,
    color: colors.white,
  },
  privacySection: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 16,
  },
  privacyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  privacyInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  privacyLabel: {
    ...typography.body1,
    color: colors.text,
    marginLeft: 12,
  },
  privacyValue: {
    ...typography.body1,
    color: colors.gray500,
  },
  tagsSection: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
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
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    paddingVertical: 16,
    marginHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  logoutText: {
    ...typography.body1Bold,
    color: colors.error,
    marginLeft: 8,
  },
  contentSections: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  seeAllText: {
    ...typography.body2Bold,
    color: colors.primary,
  },
  gridContainer: {
    width: "100%",
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  gridItem: {
    width: (Dimensions.get("window").width - 60) / 3,
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.gray100,
  },
  gridImage: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.gray200,
  },
  emptyContent: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    ...typography.body2,
    color: colors.gray500,
    textAlign: "center",
  },
});
