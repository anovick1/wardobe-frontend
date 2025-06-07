import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import WardrobeScreen from "../screens/WardrobeScreen";
import ItemReviewScreen from "../screens/ItemReviewScreen";

const Stack = createStackNavigator();

export default function WardrobeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WardrobeMain" component={WardrobeScreen} />
      <Stack.Screen name="ItemReview" component={ItemReviewScreen} />
    </Stack.Navigator>
  );
}
