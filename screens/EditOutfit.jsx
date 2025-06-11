import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../auth/AuthContext';
import api from '../api';

const EditOutfit = () => {
  const [outfit, setOutfit] = useState(null);
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { outfitId } = route.params;
  const { user } = useContext(AuthContext);

  const fetchOutfitDetails = async () => {
    try {
      const response = await api.get(`/outfits/${outfitId}`);
      setOutfit(response.data);
      setSelectedItems(response.data.wardrobe_items.map((item) => item.id));
      setNotes(response.data.notes || '');
    } catch (error) {
      Alert.alert('Error', 'Failed to load outfit details');
      console.error(error);
    }
  };

  const fetchWardrobeItems = async () => {
    try {
      const response = await api.get('/wardrobe_items');
      setWardrobeItems(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load wardrobe items');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      Promise.all([fetchOutfitDetails(), fetchWardrobeItems()]);
    }
  }, [user]);

  const toggleItemSelection = (itemId) => {
    setSelectedItems((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleUpdateOutfit = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Please select at least one item for your outfit');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/outfits/${outfitId}`, {
        wardrobe_item_ids: selectedItems,
        notes: notes,
      });

      Alert.alert('Success', 'Outfit updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update outfit');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!outfit) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Outfit not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Outfit</Text>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleUpdateOutfit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.notesContainer}>
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes about this outfit..."
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.itemsContainer}>
          <Text style={styles.label}>Select Items</Text>
          <View style={styles.itemsGrid}>
            {wardrobeItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  selectedItems.includes(item.id) && styles.itemCardSelected,
                ]}
                onPress={() => toggleItemSelection(item.id)}
              >
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.itemImage}
                />
                <View style={styles.itemOverlay}>
                  {selectedItems.includes(item.id) && (
                    <View style={styles.checkmarkContainer}>
                      <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    </View>
                  )}
                </View>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
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
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  notesContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  itemsContainer: {
    padding: 16,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemCardSelected: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  itemImage: {
    width: '100%',
    height: 150,
  },
  itemOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkContainer: {
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  itemName: {
    padding: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default EditOutfit; 