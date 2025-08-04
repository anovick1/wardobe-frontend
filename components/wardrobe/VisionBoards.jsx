import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import api from '../../api';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';

// Make sure to complete auth sessions
WebBrowser.maybeCompleteAuthSession();

const PINTEREST_CLIENT_ID = '1526909';
// Use direct app scheme for OAuth
const REDIRECT_URI = 'wardrobe://pinterest-callback';
const SCOPES = 'boards:read,pins:read,user_accounts:read';

export default function VisionBoards() {
  const [isPinterestLinked, setIsPinterestLinked] = useState(false);
  const [pinterestUsername, setPinterestUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPinterestStatus();
  }, []);

  const checkPinterestStatus = async () => {
    try {
      const response = await api.get('/pinterest/status');
      setIsPinterestLinked(response.data.linked);
      setPinterestUsername(response.data.pinterest_username);
    } catch (error) {
      console.error('Error checking Pinterest status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePinterestAuth = async () => {
    try {
      console.log('Pinterest Redirect URI:', REDIRECT_URI);
      const authUrl = `https://www.pinterest.com/oauth/?client_id=${PINTEREST_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${SCOPES}`;
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);
      
      if (result.type === 'success' && result.url) {
        // Extract the code from the redirect URL
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        
        if (code) {
          setLoading(true);
          try {
            // Send the code to our backend
            const response = await api.post('/pinterest/link', {
              code: code,
              redirect_uri: REDIRECT_URI
            });
            
            if (response.data.success) {
              Alert.alert('Success', 'Pinterest account linked successfully!');
              await checkPinterestStatus();
            }
          } catch (error) {
            console.error('Error linking Pinterest:', error);
            console.error('Error response:', error.response?.data);
            const errorMessage = error.response?.data?.error || 'Failed to link Pinterest account. Please try again.';
            Alert.alert('Error', errorMessage);
          } finally {
            setLoading(false);
          }
        }
      }
    } catch (error) {
      console.error('Pinterest auth error:', error);
      Alert.alert('Error', 'Failed to open Pinterest authorization.');
    }
  };

  const handleUnlinkPinterest = () => {
    Alert.alert(
      'Unlink Pinterest',
      'Are you sure you want to unlink your Pinterest account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.post('/pinterest/unlink');
              setIsPinterestLinked(false);
              setPinterestUsername(null);
              Alert.alert('Success', 'Pinterest account unlinked.');
            } catch (error) {
              console.error('Error unlinking Pinterest:', error);
              Alert.alert('Error', 'Failed to unlink Pinterest account.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="push-pin" size={48} color={colors.primary} />
        <Text style={styles.title}>Vision Boards</Text>
      </View>

      {!isPinterestLinked ? (
        <View style={styles.connectSection}>
          <Text style={styles.description}>
            Connect your Pinterest account to create and sync vision boards with your wardrobe
          </Text>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={handlePinterestAuth}
          >
            <Icon name="link" size={24} color="white" />
            <Text style={styles.connectButtonText}>Connect Pinterest</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.linkedSection}>
          <View style={styles.linkedInfo}>
            <Icon name="check-circle" size={24} color={colors.success} />
            <Text style={styles.linkedText}>
              Connected as @{pinterestUsername}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.unlinkButton}
            onPress={handleUnlinkPinterest}
          >
            <Text style={styles.unlinkButtonText}>Unlink Account</Text>
          </TouchableOpacity>

          <View style={styles.comingSoonSection}>
            <Text style={styles.comingSoonText}>
              🚀 Coming Soon: Board syncing, likes, and comments!
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20,
    backgroundColor: colors.background
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30
  },
  title: {
    ...typography.title,
    marginTop: 10
  },
  description: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: 30,
    color: colors.text.secondary
  },
  connectSection: {
    alignItems: 'center',
    marginTop: 20
  },
  connectButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    gap: 10
  },
  connectButtonText: {
    ...typography.buttonText,
    color: 'white'
  },
  linkedSection: {
    alignItems: 'center',
    marginTop: 20
  },
  linkedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20
  },
  linkedText: {
    ...typography.body,
    color: colors.success
  },
  unlinkButton: {
    paddingVertical: 10,
    paddingHorizontal: 20
  },
  unlinkButtonText: {
    ...typography.body,
    color: colors.error
  },
  comingSoonSection: {
    marginTop: 40,
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: 10
  },
  comingSoonText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.text.secondary
  }
});