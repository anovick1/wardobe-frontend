import React, { useEffect, useState, useCallback } from "react";
import { TouchableOpacity, StyleSheet, Text } from "react-native";
import AddNewModal from "./AddNewModal";

export default function AddNewButton({ navigation, handleImagePicked }) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleModalImagePicked = (uri) => {
    setModalVisible(false);
    handleImagePicked(uri);
  };

  return (
    <>
      <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>＋</Text>
      </TouchableOpacity>

      <AddNewModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onImagePicked={handleModalImagePicked}
        navigation={navigation}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    bottom: 25,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 30,
    marginBottom: 2,
  },
});
