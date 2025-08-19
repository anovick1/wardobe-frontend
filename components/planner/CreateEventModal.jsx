import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/MaterialIcons";
import { eventsAPI } from "../../api";
import colors from "../../styles/colors";
import typography from "../../styles/typography";

export default function CreateEventModal({ visible, onClose, onEventCreated }) {
  const [eventTitle, setEventTitle] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDate, setEventDate] = useState(new Date());
  const [eventTime, setEventTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateEvent = async () => {
    if (!eventTitle.trim()) {
      Alert.alert("Error", "Please enter an event title");
      return;
    }

    setIsLoading(true);

    try {
      // Create a new date using the selected date and time components
      // This ensures we're working in the user's local timezone
      const eventDateTime = new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate(),
        eventTime.getHours(),
        eventTime.getMinutes(),
        0, // seconds
        0  // milliseconds
      );

      // Format as local datetime string instead of UTC ISO string
      const year = eventDateTime.getFullYear();
      const month = String(eventDateTime.getMonth() + 1).padStart(2, '0');
      const day = String(eventDateTime.getDate()).padStart(2, '0');
      const hours = String(eventDateTime.getHours()).padStart(2, '0');
      const minutes = String(eventDateTime.getMinutes()).padStart(2, '0');
      
      const localDateTimeString = `${year}-${month}-${day}T${hours}:${minutes}:00`;

      const eventData = {
        title: eventTitle.trim(),
        datetime: localDateTimeString,
        location: eventLocation.trim() || null,
        source: "manual",
      };

      const response = await eventsAPI.createEvent(eventData);
      
      Alert.alert("Success", "Event created successfully!");
      
      // Reset form
      setEventTitle("");
      setEventLocation("");
      setEventDate(new Date());
      setEventTime(new Date());
      
      // Notify parent component
      if (onEventCreated) {
        onEventCreated(response);
      }
      
      onClose();
    } catch (error) {
      console.error("Error creating event:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to create event"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    return time.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={24} color="#121416" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Create Event</Text>
              <View style={styles.closeButton} />
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Event Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Event Title</Text>
                <TextInput
                  style={styles.input}
                  value={eventTitle}
                  onChangeText={setEventTitle}
                  placeholder="Enter event title"
                  placeholderTextColor="#9ca3af"
                  maxLength={100}
                />
              </View>

              {/* Date Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => {
                    setShowTimePicker(false);
                    setShowDatePicker(true);
                  }}
                >
                  <Icon name="event" size={20} color="#6b7280" />
                  <Text style={styles.dateTimeText}>{formatDate(eventDate)}</Text>
                </TouchableOpacity>
              </View>

              {/* Time Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Time</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => {
                    setShowDatePicker(false);
                    setShowTimePicker(true);
                  }}
                >
                  <Icon name="schedule" size={20} color="#6b7280" />
                  <Text style={styles.dateTimeText}>{formatTime(eventTime)}</Text>
                </TouchableOpacity>
              </View>

              {/* Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={eventLocation}
                  onChangeText={setEventLocation}
                  placeholder="Enter location"
                  placeholderTextColor="#9ca3af"
                  maxLength={200}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!eventTitle.trim() || isLoading) && styles.submitButtonDisabled,
                ]}
                onPress={handleCreateEvent}
                disabled={!eventTitle.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name="add-circle" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Create Event</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>

        {/* Date Picker Modal for iOS */}
        {Platform.OS === "ios" && showDatePicker && (
          <Modal
            transparent={true}
            animationType="slide"
            visible={showDatePicker}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <TouchableOpacity
              style={styles.pickerModalOverlay}
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
            >
              <View style={styles.pickerModalContent}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowDatePicker(false);
                      setEventDate(new Date());
                    }}
                  >
                    <Text style={styles.pickerCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerTitle}>Select Date</Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.pickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={eventDate}
                    mode="date"
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setEventDate(selectedDate);
                      }
                    }}
                    minimumDate={new Date()}
                    style={styles.datePicker}
                  />
                </View>
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {/* Time Picker Modal for iOS */}
        {Platform.OS === "ios" && showTimePicker && (
          <Modal
            transparent={true}
            animationType="slide"
            visible={showTimePicker}
            onRequestClose={() => setShowTimePicker(false)}
          >
            <TouchableOpacity
              style={styles.pickerModalOverlay}
              activeOpacity={1}
              onPress={() => setShowTimePicker(false)}
            >
              <View style={styles.pickerModalContent}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowTimePicker(false);
                      setEventTime(new Date());
                    }}
                  >
                    <Text style={styles.pickerCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerTitle}>Select Time</Text>
                  <TouchableOpacity
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={styles.pickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={eventTime}
                    mode="time"
                    display="spinner"
                    onChange={(event, selectedTime) => {
                      if (selectedTime) {
                        setEventTime(selectedTime);
                      }
                    }}
                    style={styles.datePicker}
                  />
                </View>
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {/* Android Date/Time Pickers */}
        {Platform.OS === "android" && showDatePicker && (
          <DateTimePicker
            value={eventDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setEventDate(selectedDate);
              }
            }}
            minimumDate={new Date()}
          />
        )}

        {Platform.OS === "android" && showTimePicker && (
          <DateTimePicker
            value={eventTime}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                setEventTime(selectedTime);
              }
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#121416",
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#121416",
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateTimeText: {
    fontSize: 16,
    color: "#121416",
    marginLeft: 12,
    flex: 1,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#121416",
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  pickerModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  pickerModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#121416",
  },
  pickerCancelText: {
    fontSize: 16,
    color: "#6b7280",
  },
  pickerDoneText: {
    fontSize: 16,
    color: "#3b82f6",
    fontWeight: "600",
  },
  datePickerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  datePicker: {
    backgroundColor: "#fff",
    height: 200,
    width: "100%",
  },
});