import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import HomeScreen from "../screens/HomeScreen";
import PlannerScreen from "../screens/PlannerScreen";
import FeedScreen from "../screens/FeedScreen";
import ProfileScreen from "../screens/ProfileScreen";
import WardrobeStackNavigator from "./WardrobeStackNavigator"; // ✅ stack wrapper

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          switch (route.name) {
            case "Home":
              iconName = "home";
              break;
            case "Wardrobe":
              iconName = "tshirt-crew";
              break;
            case "Planner":
              iconName = "calendar-month";
              break;
            case "Feed":
              iconName = "newspaper-variant-outline";
              break;
            case "Profile":
              iconName = "account-circle";
              break;
            default:
              iconName = "circle";
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#1877f3",
        tabBarInactiveTintColor: "#888",
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Wardrobe" component={WardrobeStackNavigator} options={{ unmountOnBlur: true }} />
      <Tab.Screen name="Planner" component={PlannerScreen} />
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
