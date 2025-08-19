import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AppNavigator from "./AppNavigator"; // your Tab Navigator
import UserProfileScreen from "../screens/UserProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import PrivacySettingsScreen from "../screens/PrivacySettingsScreen";
import FollowersListScreen from "../screens/FollowersListScreen";
import FollowRequestsScreen from "../screens/FollowRequestsScreen";
import OutfitDetail from "../screens/OutfitDetail";
import WardrobeItemDetail from "../screens/WardrobeItemDetail";
import BoardDetailsScreen from "../screens/BoardDetailsScreen";

const Stack = createStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={AppNavigator} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
        <Stack.Screen name="FollowersList" component={FollowersListScreen} />
        <Stack.Screen name="FollowRequests" component={FollowRequestsScreen} />
        <Stack.Screen name="OutfitDetail" component={OutfitDetail} />
        <Stack.Screen name="WardrobeItemDetail" component={WardrobeItemDetail} />
        <Stack.Screen name="BoardDetails" component={BoardDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
