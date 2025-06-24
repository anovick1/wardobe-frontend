import React from "react";
import {
  TouchableOpacity,
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import cardStyles from "../../styles/card";
import typography from "../../styles/typography";
import useCachedImage from "../../hooks/useCachedImage";

export default function OutfitCard({ item }) {
  const navigation = useNavigation();

  const { uri, loading, error } = useCachedImage(
    item.composite_image_url,
    item.id
  );

  // Determine outfit type and corresponding icon/badge
  const isDailyOutfit = item.is_daily_outfit;
  const isAIGenerated = item.generated_by === "chatgpt" && !isDailyOutfit;
  const isUserGenerated = item.generated_by === "manual";

  const getOutfitTypeInfo = () => {
    if (isDailyOutfit) {
      return {
        icon: "event",
        text: "Daily",
        color: "#FF6B6B",
        backgroundColor: "#FFE8E8",
      };
    } else if (isAIGenerated) {
      return {
        icon: "auto-awesome",
        text: "AI",
        color: "#4ECDC4",
        backgroundColor: "#E8FFFE",
      };
    } else {
      return {
        icon: "person",
        text: "You",
        color: "#45B7D1",
        backgroundColor: "#E8F4FD",
      };
    }
  };

  const typeInfo = getOutfitTypeInfo();

  return (
    <TouchableOpacity
      style={cardStyles.cardTouchable}
      onPress={() =>
        navigation.navigate("OutfitDetail", {
          outfit: item,
        })
      }
    >
      <View style={cardStyles.card}>
        <View style={cardStyles.image}>
          {loading ? (
            <ActivityIndicator style={{ flex: 1 }} />
          ) : error ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="error" size={36} color="#dc2626" />
            </View>
          ) : uri ? (
            <Image
              source={{ uri }}
              style={cardStyles.image}
              resizeMode="contain"
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
          
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: typeInfo.backgroundColor },
              ]}
            >
              <Icon name={typeInfo.icon} size={12} color={typeInfo.color} />
              <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>
                {typeInfo.text}
              </Text>
            </View>
            
            {/* Worn Status Badge */}
            {item.is_worn && (
              <View style={styles.wornBadge}>
                <Icon name="check-circle" size={10} color="#10b981" />
                <Text style={styles.wornBadgeText}>
                  Worn {item.times_worn ? `${item.times_worn}x` : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 3,
  },
  wornBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#dcfce7",
  },
  wornBadgeText: {
    fontSize: 9,
    fontWeight: "500",
    color: "#10b981",
    marginLeft: 2,
  },
});
