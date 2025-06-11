import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../api';
import { AuthContext } from '../auth/AuthContext';

const GenerateOutfitScreen = () => {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [focusType, setFocusType] = useState('general');
  const [weather, setWeather] = useState('');
  const [event, setEvent] = useState('');
  const [location, setLocation] = useState('');
  const [dailyRoutine, setDailyRoutine] = useState('');
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleDateChange = (event, selectedDate) => {
    const newDate = selectedDate || currentDate;
    setShowDatePicker(Platform.OS === 'ios');
    setCurrentDate(newDate);
    // For simplicity, we'll add the selected date as a calendar event note
    setCalendarEvents([{ name: 'Custom Event', date: newDate.toISOString() }]);
  };

  const handleGenerateOutfit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to generate outfits.');
      return;
    }

    setLoading(true);
    try {
      // Fetch user wardrobe items for the prompt
      const wardrobeResponse = await api.get('/wardrobe_items');
      const wardrobe = wardrobeResponse.data.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        color: item.primary_color,
        tags: item.tags,
        image_url: item.image_url,
      }));

      if (wardrobe.length === 0) {
        Alert.alert('Error', 'You need items in your wardrobe to generate an outfit.');
        setLoading(false);
        return;
      }

      const payload = {
        wardrobe: wardrobe,
        weather: weather,
        calendar_events: calendarEvents, // This will be dynamic based on user input or actual calendar
        focus_type: focusType,
      };

      if (focusType === 'location') {
        if (!location) {
          Alert.alert('Error', 'Please provide a location for location-focused generation.');
          setLoading(false);
          return;
        }
        payload.location = location;
      }
      if (focusType === 'daily') {
        payload.daily_routine = dailyRoutine;
      }

      const response = await api.post('/outfits/ai_generate', payload);
      Alert.alert('Success', response.data.message);
      navigation.navigate('OutfitDetail', { outfitId: response.data.outfit.id });
    } catch (error) {
      console.error('Error generating outfit:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.error || 'Failed to generate outfit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Generate Outfit (AI)</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Generation Focus</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={focusType}
              onValueChange={(itemValue) => setFocusType(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="General Outfit" value="general" />
              <Picker.Item label="Weather-focused" value="weather" />
              <Picker.Item label="Event-focused" value="event" />
              <Picker.Item label="Location-focused" value="location" />
              <Picker.Item label="Daily Outfit" value="daily" />
            </Picker>
          </View>
        </View>

        {focusType === 'weather' && (
          <View style={styles.section}>
            <Text style={styles.label}>Current Weather</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Sunny, 25°C, light breeze"
              value={weather}
              onChangeText={setWeather}
            />
          </View>
        )}

        {focusType === 'event' && (
          <View style={styles.section}>
            <Text style={styles.label}>Event Details</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Casual dinner, formal party, gym workout"
              value={event}
              onChangeText={setEvent}
            />
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
              <Text style={styles.datePickerButtonText}>Select Event Date</Text>
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
            {calendarEvents.length > 0 && (
              <Text style={styles.selectedDateText}>Selected: {new Date(calendarEvents[0].date).toLocaleDateString()}</Text>
            )}
          </View>
        )}

        {focusType === 'location' && (
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

        {focusType === 'daily' && (
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
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleGenerateOutfit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>Generate Outfit</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 1,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  datePickerButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  datePickerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedDateText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  generateButton: {
    backgroundColor: '#121416',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
});

export default GenerateOutfitScreen; 