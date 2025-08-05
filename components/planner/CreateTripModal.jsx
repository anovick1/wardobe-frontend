import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { tripsAPI, packingListsAPI } from "../../api";
import LocationSelector from "../common/LocationSelector";

export default function CreateTripModal({ visible, onClose, onTripCreated }) {
  const [title, setTitle] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [creating, setCreating] = useState(false);

  const resetForm = () => {
    setTitle("");
    setSelectedLocation(null);
    setNotes("");
    setStartDate(new Date());
    setEndDate(new Date());
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleStartDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setStartDate(selectedDate);
      // If end date is before start date, adjust it
      if (selectedDate > endDate) {
        setEndDate(selectedDate);
      }
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const handleCreateTrip = async () => {
    if (!title.trim()) {
      Alert.alert("Trip Title Required", "Please enter a title for your trip.");
      return;
    }

    if (!selectedLocation) {
      Alert.alert("Location Required", "Please select a destination for your trip.");
      return;
    }

    if (startDate > endDate) {
      Alert.alert("Invalid Dates", "Start date must be before or equal to end date.");
      return;
    }

    setCreating(true);
    try {
      // Format dates to local YYYY-MM-DD to avoid timezone issues
      const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const tripData = {
        title: title.trim(),
        location_id: selectedLocation?.id || null,
        start_date: formatLocalDate(startDate),
        end_date: formatLocalDate(endDate),
        notes: notes.trim() || null
      };

      const newTrip = await tripsAPI.createTrip(tripData);
      
      // Auto-generate packing list for the new trip
      try {
        await packingListsAPI.generateAIPackingList(newTrip.id);
      } catch (packingError) {
        console.warn("Failed to generate packing list:", packingError);
        // Don't fail trip creation if packing list generation fails
      }
      
      Alert.alert("Success!", "Your trip and packing list have been created ✈️");
      
      if (onTripCreated) {
        onTripCreated(newTrip);
      }
      
      handleClose();
    } catch (error) {
      console.error("Error creating trip:", error);
      Alert.alert(
        "Error", 
        error.response?.data?.error || "Failed to create trip. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.cancelButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Trip</Text>
          <TouchableOpacity
            onPress={handleCreateTrip}
            style={[styles.createButton, creating && styles.createButtonDisabled]}
            disabled={creating}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.createButtonText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Trip Title */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Trip Title *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Paris Vacation, Business Trip to NYC"
              placeholderTextColor="#9ca3af"
              maxLength={100}
            />
          </View>

          {/* Location */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Destination *</Text>
            <LocationSelector
              selectedLocation={selectedLocation}
              onLocationSelect={setSelectedLocation}
              placeholder="e.g. San Francisco, CA"
            />
          </View>

          {/* Dates */}
          <View style={styles.dateContainer}>
            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>Start Date *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Icon name="calendar-today" size={20} color="#6b7280" />
                <Text style={styles.dateButtonText}>
                  {formatDate(startDate)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>End Date *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Icon name="calendar-today" size={20} color="#6b7280" />
                <Text style={styles.dateButtonText}>
                  {formatDate(endDate)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Duration Info */}
          <View style={styles.durationInfo}>
            <Icon name="schedule" size={16} color="#6b7280" />
            <Text style={styles.durationText}>
              {Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1} days
            </Text>
          </View>

          {/* Notes */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about your trip..."
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
          </View>
        </ScrollView>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <Modal
            transparent={true}
            animationType="fade"
            visible={showStartDatePicker}
            onRequestClose={() => setShowStartDatePicker(false)}
          >
            <View style={styles.datePickerOverlay}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity
                    onPress={() => setShowStartDatePicker(false)}
                    style={styles.datePickerButton}
                  >
                    <Text style={styles.datePickerButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>Start Date</Text>
                  <TouchableOpacity
                    onPress={() => setShowStartDatePicker(false)}
                    style={styles.datePickerButton}
                  >
                    <Text style={[styles.datePickerButtonText, styles.datePickerDoneText]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.datePickerWrapper}>
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="spinner"
                    onChange={handleStartDateChange}
                    minimumDate={new Date()}
                    style={styles.datePicker}
                    locale="en-US"
                    textColor="#000000"
                  />
                </View>
              </View>
            </View>
          </Modal>
        )}

        {showEndDatePicker && (
          <Modal
            transparent={true}
            animationType="fade"
            visible={showEndDatePicker}
            onRequestClose={() => setShowEndDatePicker(false)}
          >
            <View style={styles.datePickerOverlay}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity
                    onPress={() => setShowEndDatePicker(false)}
                    style={styles.datePickerButton}
                  >
                    <Text style={styles.datePickerButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>End Date</Text>
                  <TouchableOpacity
                    onPress={() => setShowEndDatePicker(false)}
                    style={styles.datePickerButton}
                  >
                    <Text style={[styles.datePickerButtonText, styles.datePickerDoneText]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.datePickerWrapper}>
                  <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="spinner"
                    onChange={handleEndDateChange}
                    minimumDate={startDate}
                    style={styles.datePicker}
                    locale="en-US"
                    textColor="#000000"
                  />
                </View>
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
    backgroundColor: "#f8fafc",
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
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#007AFF",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  createButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#121416",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: "#121416",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    shadowColor: "#1f2937",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  notesInput: {
    height: 100,
    textAlignVertical: "top",
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    shadowColor: "#1f2937",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: "#121416",
    flex: 1,
  },
  durationInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 6,
  },
  durationText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  datePickerContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    shadowColor: "#1f2937",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#121416",
  },
  datePickerButton: {
    padding: 8,
    minWidth: 60,
    alignItems: "center",
  },
  datePickerButtonText: {
    fontSize: 16,
    color: "#007AFF",
  },
  datePickerDoneText: {
    fontWeight: "600",
  },
  datePickerWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  datePicker: {
    backgroundColor: "#fff",
    width: "100%",
  },
});