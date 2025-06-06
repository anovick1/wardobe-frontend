import React, { useState } from "react";
import { TouchableOpacity, StyleSheet, Text } from "react-native";
import AddNewModal from "./AddNewModal";

export default function AddNewButton({
  navigation,
  onStartUpload,
  setProcessing,
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleImagePicked = (uri) => {
    setModalVisible(false);
    onStartUpload(uri); // triggers upload + modal outside
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>＋</Text>
      </TouchableOpacity>

      <AddNewModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onImagePicked={handleImagePicked}
        setProcessing={setProcessing} // ✅ forward this
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
