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
import useCachedImage from "../../hooks/useCachedImage";
import cardStyles from "../../styles/card";
import typography from "../../styles/typography";

export default function WardrobeItemCard({ item, onItemDeleted }) {
  const navigation = useNavigation();
  const { uri, loading, error } = useCachedImage(item.image_url, item.id);

  return (
    <TouchableOpacity
      style={cardStyles.cardTouchable}
      onPress={() =>
        navigation.navigate("WardrobeItemDetail", {
          item,
          onDelete: () => {
            onItemDeleted?.(item.id);
          },
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
          ) : (
            <Image source={{ uri }} style={cardStyles.image} />
          )}
        </View>
        <View style={cardStyles.infoSection}>
          <Text style={typography.name} numberOfLines={1} adjustsFontSizeToFit>
            {item.name || "Unnamed item"}
          </Text>
          {item.brand && (
            <Text
              style={typography.brand}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {item.brand}
            </Text>
          )}
          {item.tags && item.tags.length > 0 && (
            <View style={cardStyles.tagsRow}>
              {item.tags.map((tag, idx) => (
                <View key={idx} style={[cardStyles.tag, tagColorStyle(tag)]}>
                  <Text style={cardStyles.tagText} numberOfLines={1}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function tagColorStyle(tag) {
  if (/work/i.test(tag)) return { backgroundColor: "#e0f2fe" };
  if (/elegant/i.test(tag)) return { backgroundColor: "#fce7f3" };
  if (/casual/i.test(tag)) return { backgroundColor: "#e0e7ff" };
  if (/basics?/i.test(tag)) return { backgroundColor: "#ccfbf1" };
  if (/cozy/i.test(tag)) return { backgroundColor: "#fef3c7" };
  if (/winter/i.test(tag)) return { backgroundColor: "#e5e7eb" };
  return { backgroundColor: "#f1f5f9" };
}
