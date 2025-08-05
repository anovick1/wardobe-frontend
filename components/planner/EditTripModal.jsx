import React, { useState, useEffect } from "react";
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
import { tripsAPI } from "../../api";
import LocationSelector from "../common/LocationSelector";

export default function EditTripModal({ visible, onClose, trip, onTripUpdated }) {
  const [tripTitle, setTripTitle] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [tripNotes, setTripNotes] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible && trip) {
      setTripTitle(trip.title || "");
      
      // Set location based on trip data
      if (trip.location_id && trip.location) {
        setSelectedLocation({
          id: trip.location_id,
          display_name: trip.location
        });
      } else {
        setSelectedLocation(null);
      }
      
      setTripNotes(trip.notes || "");
      
      const tripStartDate = new Date(trip.start_date);
      const tripEndDate = new Date(trip.end_date);
      
      setStartDate(tripStartDate);
      setEndDate(tripEndDate);
    }
  }, [visible, trip]);

  const handleSave = async () => {
    if (!tripTitle.trim()) {
      Alert.alert("Error", "Please enter a trip title");
      return;
    }

    if (startDate > endDate) {
      Alert.alert("Error", "Start date cannot be after end date");
      return;
    }

    setIsLoading(true);
    try {
      // Format dates to local YYYY-MM-DD to avoid timezone issues
      const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const updatedTrip = await tripsAPI.updateTrip(trip.id, {
        title: tripTitle.trim(),
        location_id: selectedLocation?.id || null,
        notes: tripNotes.trim() || null,
        start_date: formatLocalDate(startDate),
        end_date: formatLocalDate(endDate),
      });

      Alert.alert("Success", "Trip updated successfully");
      if (onTripUpdated) {
        onTripUpdated(updatedTrip);
      }
      onClose();
    } catch (error) {
      console.error("Error updating trip:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to update trip. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(Platform.OS === "ios");
    setStartDate(currentDate);
    
    // If start date is after end date, update end date
    if (currentDate > endDate) {
      setEndDate(currentDate);
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(Platform.OS === "ios");
    setEndDate(currentDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
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
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Trip</Text>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveButton}
              disabled={isLoading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Trip Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Trip Title</Text>
              <TextInput
                style={styles.textInput}
                value={tripTitle}
                onChangeText={setTripTitle}
                placeholder="Enter trip title"
                placeholderTextColor="#9ca3af"
                autoFocus
              />
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <LocationSelector
                selectedLocation={selectedLocation}
                onLocationSelect={setSelectedLocation}
                placeholder="Enter destination"
              />
            </View>

            {/* Date Range */}
            <View style={styles.dateSection}>
              <Text style={styles.label}>Travel Dates</Text>
              
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Icon name="event" size={20} color="#6b7280" />
                  <View style={styles.dateTextContainer}>
                    <Text style={styles.dateLabel}>Start Date</Text>
                    <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Icon name="event" size={20} color="#6b7280" />
                  <View style={styles.dateTextContainer}>
                    <Text style={styles.dateLabel}>End Date</Text>
                    <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                value={tripNotes}
                onChangeText={setTripNotes}
                placeholder="Add any notes about your trip"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <Modal transparent={true} animationType="fade" visible={showStartDatePicker}>
            <View style={styles.datePickerOverlay}>
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="spinner"
                  onChange={handleStartDateChange}
                />
                <TouchableOpacity
                  style={styles.datePickerDone}
                  onPress={() => setShowStartDatePicker(false)}
                >
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {showEndDatePicker && (
          <Modal transparent={true} animationType="fade" visible={showEndDatePicker}>
            <View style={styles.datePickerOverlay}>
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="spinner"
                  onChange={handleEndDateChange}
                  minimumDate={startDate}
                />
                <TouchableOpacity
                  style={styles.datePickerDone}
                  onPress={() => setShowEndDatePicker(false)}
                >
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 16,
    color: "#6b7280",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#121416",
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3b82f6",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#121416",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#121416",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  notesInput: {
    height: 80,
    textAlignVertical: "top",
  },
  dateSection: {
    marginBottom: 24,
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 12,
  },
  dateTextContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#121416",
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  datePickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    margin: 20,
    minWidth: 300,
  },
  datePickerDone: {
    alignSelf: "flex-end",
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#3b82f6",
    borderRadius: 8,
  },
  datePickerDoneText: {
    color: "#fff",
    fontWeight: "600",
  },
});