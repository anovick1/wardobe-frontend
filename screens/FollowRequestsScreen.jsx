import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { getFollowRequests, approveFollowRequest, denyFollowRequest } from "../api/followRequests";
import { colors } from "../styles/colors";
import { typography } from "../styles/typography";

export default function FollowRequestsScreen() {
  const navigation = useNavigation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequests, setProcessingRequests] = useState(new Set());

  const fetchRequests = async () => {
    try {
      const response = await getFollowRequests();
      setRequests(response.requests || []);
    } catch (error) {
      console.error("Error fetching follow requests:", error);
      Alert.alert("Error", "Failed to load follow requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleApproveRequest = async (requestId) => {
    if (processingRequests.has(requestId)) return;

    setProcessingRequests(prev => new Set(prev).add(requestId));
    
    try {
      await approveFollowRequest(requestId);
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error("Error approving request:", error);
      Alert.alert("Error", "Failed to approve follow request");
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleDenyRequest = async (requestId) => {
    if (processingRequests.has(requestId)) return;

    setProcessingRequests(prev => new Set(prev).add(requestId));
    
    try {
      await denyFollowRequest(requestId);
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error("Error denying request:", error);
      Alert.alert("Error", "Failed to deny follow request");
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const renderRequestItem = ({ item }) => {
    const isProcessing = processingRequests.has(item.id);
    const requester = item.requester;

    return (
      <View style={styles.requestItem}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => navigation.navigate("UserProfile", { userId: requester.id })}
        >
          <Image
            source={{ uri: requester.profile_photo || "https://via.placeholder.com/50" }}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.name}>{requester.name}</Text>
            {requester.username && (
              <Text style={styles.username}>@{requester.username}</Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.denyButton]}
            onPress={() => handleDenyRequest(item.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.denyButtonText}>Deny</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApproveRequest(item.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.approveButtonText}>Accept</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="account-heart" size={64} color={colors.gray300} />
      <Text style={styles.emptyTitle}>No follow requests</Text>
      <Text style={styles.emptySubtitle}>
        When someone wants to follow your private account, their request will appear here
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Follow Requests</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Follow Requests</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.gray200,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    ...typography.body1Bold,
    color: colors.text,
  },
  username: {
    ...typography.body2,
    color: colors.gray500,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
    minWidth: 80,
    alignItems: "center",
  },
  denyButton: {
    backgroundColor: colors.gray200,
  },
  approveButton: {
    backgroundColor: colors.primary,
  },
  denyButtonText: {
    ...typography.body2Bold,
    color: colors.text,
  },
  approveButtonText: {
    ...typography.body2Bold,
    color: colors.white,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...typography.body2,
    color: colors.gray500,
    textAlign: "center",
    lineHeight: 22,
  },
});