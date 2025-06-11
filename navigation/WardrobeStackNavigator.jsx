import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import WardrobeScreen from "../screens/WardrobeScreen";
import ItemReviewScreen from "../screens/ItemReviewScreen";
import AddLinkScreen from "../screens/AddLinkScreen";
import WardrobeItemDetail from "../screens/WardrobeItemDetail";
import MultiUploadScreen from "../screens/MultiUploadScreen";
import OutfitsScreen from '../screens/OutfitsScreen';
import OutfitDetail from '../screens/OutfitDetail';
import CreateOutfit from '../screens/CreateOutfit';
import EditOutfit from '../screens/EditOutfit';
import GenerateOutfitScreen from '../screens/GenerateOutfitScreen';

const Stack = createStackNavigator();

const WardrobeStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="WardrobeHome" component={WardrobeScreen} />
      <Stack.Screen name="ItemReview" component={ItemReviewScreen} />
      <Stack.Screen name="WardrobeItemDetail" component={WardrobeItemDetail} />
      <Stack.Screen name="AddLink" component={AddLinkScreen} />
      <Stack.Screen name="MultiUpload" component={MultiUploadScreen} />
      <Stack.Screen name="Outfits" component={OutfitsScreen} />
      <Stack.Screen name="OutfitDetail" component={OutfitDetail} />
      <Stack.Screen name="CreateOutfit" component={CreateOutfit} />
      <Stack.Screen name="EditOutfit" component={EditOutfit} />
      <Stack.Screen name="GenerateOutfit" component={GenerateOutfitScreen} />
    </Stack.Navigator>
  );
};

export default WardrobeStackNavigator;
