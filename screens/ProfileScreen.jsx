import React, { useContext } from "react";
import { View, Text, Button } from "react-native";
import { AuthContext } from "../auth/AuthContext";
import { signOut } from "../auth/signOut";

const WardrobeScreen = () => {
  const { setUser } = useContext(AuthContext);

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Profile Screen</Text>
      <Button title="Log Out" onPress={handleLogout} />
    </View>
  );
};

export default WardrobeScreen;
