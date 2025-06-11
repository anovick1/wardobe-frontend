import React from 'react';
import { View, StyleSheet } from 'react-native';
import OutfitsScreen from '../../screens/OutfitsScreen';

export default function Outfits() {
  return (
    <View style={styles.container}>
      <OutfitsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
