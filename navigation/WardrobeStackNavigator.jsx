import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import WardrobeScreen from "../screens/WardrobeScreen";
import ItemReviewScreen from "../screens/ItemReviewScreen";
import AddLinkScreen from '../screens/AddLinkScreen';
import WardrobeItemDetail from "../screens/WardrobeItemDetail";

const Stack = createStackNavigator();

export default function WardrobeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WardrobeMain" component={WardrobeScreen} />
      <Stack.Screen name="ItemReview" component={ItemReviewScreen} />
      <Stack.Screen name="WardrobeItemDetail" component={WardrobeItemDetail} />
       <Stack.Screen name="AddLink" component={AddLinkScreen} />
    </Stack.Navigator>
  );
}
