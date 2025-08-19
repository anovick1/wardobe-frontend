import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import DropDownPicker from "react-native-dropdown-picker";
import api, { eventsAPI } from "../api";
import { AuthContext } from "../auth/AuthContext";
import { useWeather } from "../contexts/WeatherContext";

const GenerateOutfitScreen = () => {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { weather } = useWeather();

  const [loading, setLoading] = useState(false);
  const [focusType, setFocusType] = useState("general");
  const [open, setOpen] = useState(false);
  const [event, setEvent] = useState("");
  const [location, setLocation] = useState("");
  const [dailyRoutine, setDailyRoutine] = useState("");
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [backendEvents, setBackendEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const focusOptions = [
    { label: "General Outfit", value: "general" },
    { label: "Weather-focused", value: "weather" },
    { label: "Event-focused", value: "event" },
    { label: "Location-focused", value: "location" },
    { label: "Daily Outfit", value: "daily" },
  ];

  useEffect(() => {
    const fetchBackendEvents = async () => {
      try {
        const response = await eventsAPI.getEvents();
        setBackendEvents(response.events || []);
      } catch (error) {
        console.error("Failed to fetch backend events:", error);
      }
    };

    if (user) {
      fetchBackendEvents();
    }
  }, [user]);

  const handleDateChange = (event, selectedDate) => {
    const newDate = selectedDate || currentDate;
    setShowDatePicker(Platform.OS === "ios");
    setCurrentDate(newDate);
    setCalendarEvents([{ name: "Custom Event", date: newDate.toISOString() }]);
  };

  const handleSelectBackendEvent = (selectedEvent) => {
    setSelectedEventId(selectedEvent.id);
    setEvent(selectedEvent.title);
    setLocation(selectedEvent.location || "");
    setCalendarEvents([{ 
      name: selectedEvent.title, 
      date: selectedEvent.datetime,
      location: selectedEvent.location 
    }]);
  };

  const handleGenerateOutfit = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to generate outfits.");
      return;
    }

    setLoading(true);
    try {
      const wardrobeResponse = await api.get("/wardrobe_items");
      const wardrobe = wardrobeResponse.data.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        color: item.primary_color,
        tags: item.tags,
        image_url: item.image_url,
      }));

      if (wardrobe.length === 0) {
        Alert.alert(
          "Error",
          "You need items in your wardrobe to generate an outfit."
        );
        setLoading(false);
        return;
      }

      const payload = {
        wardrobe: wardrobe,
        weather: {
          temperature: weather?.temperature,
          condition:
            weather?.weather_description?.toLowerCase().replace(/\s+/g, "_") ||
            "unknown",
          precipitation: weather?.precipitation || 0,
          humidity: weather?.humidity,
        },
        calendar_events: calendarEvents,
        focus_type: focusType,
      };

      if (focusType === "location") {
        if (!location) {
          Alert.alert(
            "Error",
            "Please provide a location for location-focused generation."
          );
          setLoading(false);
          return;
        }
        payload.location = location;
      }
      if (focusType === "daily") {
        payload.daily_routine = dailyRoutine;
      }

      const response = await api.post("/outfits/ai_generate", payload);
      Alert.alert("Success", response.data.message);
      navigation.navigate("Wardrobe", { screen: "Outfits" });
    } catch (error) {
      console.error(
        "Error generating outfit:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to generate outfit"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Generate Outfit (AI)</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Generation Focus</Text>
          <DropDownPicker
            open={open}
            value={focusType}
            items={focusOptions}
            setOpen={setOpen}
            setValue={setFocusType}
            containerStyle={{ marginTop: 8 }}
            zIndex={5000}
          />
        </View>

        {focusType === "weather" && weather && (
          <View style={styles.section}>
            <Text style={styles.label}>Current Weather</Text>
            <Text>
              {weather.weather_description}, {weather.temperature}°F —{" "}
              {weather.wind_speed} mph wind
            </Text>
          </View>
        )}

        {focusType === "event" && (
          <View style={styles.section}>
            <Text style={styles.label}>Event Details</Text>
            
            {/* Backend Events */}
            {backendEvents.length > 0 && (
              <View style={styles.eventsContainer}>
                <Text style={styles.eventsLabel}>Your Events</Text>
                {backendEvents.map((backendEvent) => (
                  <TouchableOpacity
                    key={backendEvent.id}
                    style={[
                      styles.eventCard,
                      selectedEventId === backendEvent.id && styles.eventCardSelected
                    ]}
                    onPress={() => handleSelectBackendEvent(backendEvent)}
                  >
                    <View style={styles.eventHeader}>
                      <Ionicons name="calendar-outline" size={16} color="#3b82f6" />
                      <Text style={styles.eventTitle}>{backendEvent.title}</Text>
                    </View>
                    <Text style={styles.eventDateTime}>
                      {new Date(backendEvent.datetime).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    {backendEvent.location && (
                      <Text style={styles.eventLocation}>{backendEvent.location}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Manual Event Entry */}
            <Text style={styles.orLabel}>Or create custom event:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Casual dinner, formal party, gym workout"
              value={event}
              onChangeText={(text) => {
                setEvent(text);
                setSelectedEventId(null); // Clear selected backend event
              }}
            />
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.datePickerButton}
            >
              <Text style={styles.datePickerButtonText}>Select Custom Date</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={currentDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
            {calendarEvents.length > 0 && !selectedEventId && (
              <Text style={styles.selectedDateText}>
                Selected:{" "}
                {new Date(calendarEvents[0].date).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {focusType === "location" && (
          <View style={styles.section}>
            <Text style={styles.label}>Specific Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Beach, Office, Hiking trail"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        )}

        {focusType === "daily" && (
          <View style={styles.section}>
            <Text style={styles.label}>Daily Routine/Activity</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Going to work, errands, relaxing at home"
              value={dailyRoutine}
              onChangeText={setDailyRoutine}
            />
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.generateButton,
            loading && styles.generateButtonDisabled,
          ]}
          onPress={handleGenerateOutfit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>Generate Outfit</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    zIndex: 1,
  },
  backButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: "bold" },
  content: { flex: 1, padding: 16 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    zIndex: 1000,
  },
  label: { fontSize: 16, fontWeight: "bold", marginBottom: 8, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  datePickerButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  datePickerButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  selectedDateText: { marginTop: 10, fontSize: 14, color: "#666" },
  generateButton: {
    backgroundColor: "#121416",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  generateButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  generateButtonDisabled: { opacity: 0.5 },
  eventsContainer: {
    marginBottom: 16,
  },
  eventsLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#121416",
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  eventCardSelected: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#121416",
    marginLeft: 6,
  },
  eventDateTime: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 12,
    color: "#6b7280",
  },
  orLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
    marginTop: 8,
    textAlign: "center",
  },
});

export default GenerateOutfitScreen;
