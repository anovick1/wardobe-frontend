import React, { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { AuthContext } from "../auth/AuthContext";
import { useWeather } from "../contexts/WeatherContext";
import typography from "../styles/typography";
import globalStyles from "../styles/global";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const { weather, error: weatherError } = useWeather();

  return (
    <SafeAreaView
      style={globalStyles.container}
      edges={["top", "left", "right"]}
    >
      <Text style={typography.title}>
        👋 Hi {user?.backend?.name || "there"}!
      </Text>

      {weather && (
        <View style={styles.weatherCard}>
          <Text style={typography.meta}>
            Weather: {weather.temperature}°F – {weather.weather_description}
          </Text>
          <Text style={typography.meta}>
            Clothing Tip: {weather.clothing_hint}
          </Text>
        </View>
      )}

      {weatherError && (
        <Text style={[typography.meta, { marginTop: 8 }]}>
          ⚠️ {weatherError}
        </Text>
      )}

      {/* Future: outfit suggestions, upcoming events, feed, etc. */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  weatherCard: {
    marginVertical: 16,
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
  },
});

// import React, { useCallback, useContext, useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   ActivityIndicator,
//   StyleSheet,
//   Image,
//   TouchableOpacity,
//   Alert,
// } from "react-native";
// import * as ImagePicker from "expo-image-picker";

// import { AuthContext } from "../auth/AuthContext";
// import { useWeather } from "../contexts/WeatherContext";
// import api from "../api";
// import cardStyles from "../styles/card";
// import typography from "../styles/typography";
// import globalStyles from "../styles/global";

// export default function HomeScreen() {
//   /* ---------- ctx + state ---------- */
//   const { user } = useContext(AuthContext);
//   const { weather, error: weatherError } = useWeather();
//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(true);

//   /* ---------- fetch wardrobe ---------- */
//   const loadItems = useCallback(async () => {
//     if (!user?.firebase?.uid) return;
//     try {
//       const { data } = await api.get("/wardrobe_items", {
//         params: { firebase_uid: user.firebase.uid },
//       });
//       setItems(data.map((i) => ({ ...i, image_url: i.image_url || null })));
//     } catch (err) {
//       console.error("Wardrobe fetch failed:", err);
//     } finally {
//       setLoading(false);
//     }
//   }, [user?.firebase?.uid]);

//   useEffect(() => {
//     loadItems();
//   }, [loadItems]);

//   /* ---------- camera OR gallery ---------- */
//   const launchCamera = async () => {
//     const { status } = await ImagePicker.requestCameraPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert("Camera permission denied");
//       return;
//     }
//     const res = await ImagePicker.launchCameraAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       quality: 1,
//     });
//     handlePickerResult(res);
//   };

//   const launchGallery = async () => {
//     const res = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       quality: 1,
//     });
//     handlePickerResult(res);
//   };

//   const handlePickerResult = (res) => {
//     if (res.canceled) return;
//     const uri = res.assets[0].uri;
//     console.log("Image URI ->", uri);
//     // TODO: navigate or upload
//     // navigation.navigate("Upload", { uri })
//   };

//   /* ---------- render ---------- */
//   const renderItem = ({ item }) => (
//     <View style={cardStyles.card}>
//       {item.image_url && (
//         <Image source={{ uri: item.image_url }} style={styles.image} />
//       )}
//       <Text style={typography.name}>{item.name ?? "Unnamed item"}</Text>
//       {!!item.description && (
//         <Text style={typography.description}>{item.description}</Text>
//       )}
//       <Text style={typography.category}>
//         {item.primary_color ?? "Unknown color"} – {item.size ?? "No size"}
//       </Text>
//       <Text style={typography.meta}>
//         Times worn: {item.times_worn} • Favorite:{" "}
//         {item.is_favorite ? "Yes" : "No"}
//       </Text>
//     </View>
//   );

//   return (
//     <View style={globalStyles.container}>
//       <Text style={typography.title}>
//         👋 Hi {user?.backend?.name || "there"}!
//       </Text>

//       {weather && (
//         <View style={styles.weatherCard}>
//           <Text style={typography.meta}>
//             Weather: {weather.temperature}°F – {weather.weather_description}
//           </Text>
//           <Text style={typography.meta}>
//             Clothing Tip: {weather.clothing_hint}
//           </Text>
//         </View>
//       )}

//       {weatherError && (
//         <Text style={[typography.meta, { marginTop: 8 }]}>
//           ⚠️ {weatherError}
//         </Text>
//       )}

//       {loading ? (
//         <ActivityIndicator size="large" style={{ marginTop: 40 }} />
//       ) : items.length === 0 ? (
//         <Text style={[typography.meta, { marginTop: 30 }]}>
//           No wardrobe items yet.
//         </Text>
//       ) : (
//         <FlatList
//           data={items}
//           keyExtractor={(item) => item.id.toString()}
//           renderItem={renderItem}
//           contentContainerStyle={globalStyles.list}
//         />
//       )}

//       {/* FABs: camera (left) + gallery (right) */}
//       <TouchableOpacity
//         style={[styles.fab, { right: 90 }]}
//         onPress={launchCamera}
//       >
//         <Text style={styles.fabIcon}>📷</Text>
//       </TouchableOpacity>
//       <TouchableOpacity style={styles.fab} onPress={launchGallery}>
//         <Text style={styles.fabIcon}>＋</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// /* ---------- styles ---------- */
// const styles = StyleSheet.create({
//   image: {
//     width: "100%",
//     height: 180,
//     borderRadius: 10,
//     marginBottom: 10,
//   },
//   weatherCard: {
//     marginVertical: 16,
//     backgroundColor: "#f0f0f0",
//     padding: 12,
//     borderRadius: 8,
//   },
//   fab: {
//     position: "absolute",
//     bottom: 30,
//     right: 20,
//     backgroundColor: "#000",
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     alignItems: "center",
//     justifyContent: "center",
//     elevation: 4,
//   },
//   fabIcon: {
//     color: "#fff",
//     fontSize: 26,
//     marginTop: -2,
//   },
// });

// // import React, { useCallback, useContext, useEffect, useState } from "react";
// // import {
// //   View,
// //   Text,
// //   FlatList,
// //   ActivityIndicator,
// //   StyleSheet,
// //   Image,
// // } from "react-native";
// // import { AuthContext } from "../auth/AuthContext";
// // import { useWeather } from "../contexts/WeatherContext";
// // import api from "../api";
// // import cardStyles from "../styles/card";
// // import typography from "../styles/typography";
// // import globalStyles from "../styles/global";

// // export default function HomeScreen() {
// //   const { user } = useContext(AuthContext);
// //   const { weather, error: weatherError } = useWeather();

// //   const [items, setItems] = useState([]);
// //   const [loading, setLoading] = useState(true);

// //   /* -----------------------------
// //    * Fetch wardrobe items + signed image URLs
// //    * ----------------------------- */
// //   const loadItems = useCallback(async () => {
// //     if (!user?.firebase?.uid) return;

// //     try {
// //       const { data } = await api.get("/wardrobe_items", {
// //         params: { firebase_uid: user.firebase.uid },
// //       });

// //       const hydrated = data.map((item) => ({
// //         ...item,
// //         image_url: item.image_url || null,
// //       }));

// //       setItems(hydrated);
// //     } catch (err) {
// //       console.error("Wardrobe fetch failed:", err);
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, [user?.firebase?.uid]);

// //   useEffect(() => {
// //     loadItems();
// //   }, [loadItems]);

// //   /* ---------- Render item card ---------- */
// //   const renderItem = ({ item }) => (
// //     <View style={cardStyles.card}>
// //       {item.image_url && (
// //         <Image
// //           source={{ uri: item.image_url }}
// //           style={styles.image}
// //           resizeMode="cover"
// //         />
// //       )}
// //       <Text style={typography.name}>{item.name ?? "Unnamed item"}</Text>
// //       {!!item.description && (
// //         <Text style={typography.description}>{item.description}</Text>
// //       )}
// //       <Text style={typography.category}>
// //         {item.primary_color ?? "Unknown color"} – {item.size ?? "No size"}
// //       </Text>
// //       <Text style={typography.meta}>
// //         Times worn: {item.times_worn} • Favorite:{" "}
// //         {item.is_favorite ? "Yes" : "No"}
// //       </Text>
// //     </View>
// //   );

// //   return (
// //     <View style={globalStyles.container}>
// //       <Text style={typography.title}>
// //         👋 Hi {user?.backend?.name || "there"}!
// //       </Text>

// //       {weather && (
// //         <View style={styles.weatherCard}>
// //           <Text style={typography.meta}>
// //             Weather: {weather.temperature}°F – {weather.weather_description}
// //           </Text>
// //           <Text style={typography.meta}>
// //             Clothing Tip: {weather.clothing_hint}
// //           </Text>
// //         </View>
// //       )}

// //       {weatherError && (
// //         <Text style={[typography.meta, { marginTop: 8 }]}>
// //           ⚠️ {weatherError}
// //         </Text>
// //       )}

// //       {loading ? (
// //         <ActivityIndicator size="large" style={{ marginTop: 40 }} />
// //       ) : items.length === 0 ? (
// //         <Text style={[typography.meta, { marginTop: 30 }]}>
// //           No wardrobe items yet.
// //         </Text>
// //       ) : (
// //         <FlatList
// //           data={items}
// //           keyExtractor={(item) => item.id.toString()}
// //           renderItem={renderItem}
// //           contentContainerStyle={globalStyles.list}
// //         />
// //       )}
// //     </View>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   image: {
// //     width: "100%",
// //     height: 180,
// //     borderRadius: 10,
// //     marginBottom: 10,
// //   },
// //   weatherCard: {
// //     marginVertical: 16,
// //     backgroundColor: "#f0f0f0",
// //     padding: 12,
// //     borderRadius: 8,
// //   },
// // });
