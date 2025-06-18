import React from "react";
import {
  TouchableOpacity,
  View,
  Text,
  Image,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import cardStyles from "../../styles/card";
import typography from "../../styles/typography";

export default function OutfitCard({ item }) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={cardStyles.cardTouchable}
      onPress={() =>
        navigation.navigate("OutfitDetail", {
          outfitId: item.id,
        })
      }
    >
      <View style={cardStyles.card}>
        <View style={cardStyles.image}>
          {item.thumbnail_url ? (
            <Image
              source={{ uri: item.thumbnail_url }}
              style={cardStyles.image}
              resizeMode="contain"
              onError={(error) => console.log("Image load error:", error)}
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f0f0f0",
              }}
            >
              <Icon name="style" size={36} color="#ccc" />
            </View>
          )}
        </View>
        <View style={cardStyles.infoSection}>
          <Text style={typography.name} numberOfLines={1} adjustsFontSizeToFit>
            {item.title || "Untitled Outfit"}
          </Text>
          <Text style={typography.brand} numberOfLines={1} adjustsFontSizeToFit>
            {item.item_count} {item.item_count === 1 ? "item" : "items"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
