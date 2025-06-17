import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screen imports
import WardrobeScreen from "../screens/WardrobeScreen";
import OutfitDetail from "../screens/OutfitDetail";
import CreateOutfit from "../screens/CreateOutfit";
import EditOutfit from "../screens/EditOutfit";
import GenerateOutfitScreen from "../screens/GenerateOutfitScreen";
import WardrobeItemDetail from "../screens/WardrobeItemDetail";
import MultiUploadScreen from "../screens/MultiUploadScreen";
import ItemReviewScreen from "../screens/ItemReviewScreen";
import WebViewScreen from "../screens/WebViewScreen";

const Stack = createNativeStackNavigator();

export default function WardrobeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Main wardrobe screens */}
      <Stack.Screen name="WardrobeHome" component={WardrobeScreen} />

      {/* Outfit screens */}
      <Stack.Screen name="OutfitDetail" component={OutfitDetail} />
      <Stack.Screen name="CreateOutfit" component={CreateOutfit} />
      <Stack.Screen name="EditOutfit" component={EditOutfit} />
      <Stack.Screen name="GenerateOutfit" component={GenerateOutfitScreen} />

      {/* Wardrobe item screens */}
      <Stack.Screen name="WardrobeItemDetail" component={WardrobeItemDetail} />

      {/* Upload and review screens */}
      <Stack.Screen name="MultiUpload" component={MultiUploadScreen} />
      <Stack.Screen name="ItemReview" component={ItemReviewScreen} />
      <Stack.Screen name="WebView" component={WebViewScreen} />
    </Stack.Navigator>
  );
}
