import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  Alert,
  ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authorize } from "react-native-app-auth"; // Ensure this package is installed
import backgroundImage from "./HD-wallpaper-iphone-14-iphone-apple-thumbnail.jpg"; // Update the path to your background image

// Import OAuth configuration
const oauthConfig = require("./oauthConfig.json"); // Ensure this JSON file is correctly configured

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();

  // Function to handle OAuth login
  const handleOAuthLogin = async () => {
    try {
      const result = await authorize(oauthConfig);
      console.log(result); // Token details

      // Store OAuth tokens in AsyncStorage
      await AsyncStorage.setItem("accessToken", result.accessToken);
      await AsyncStorage.setItem("refreshToken", result.refreshToken);

      Alert.alert("Login successful!");
      navigation.navigate("TaskListScreen"); // Navigate to TaskListScreen after successful login
    } catch (error) {
      console.error("OAuth Error:", error);
      Alert.alert("Failed to login");
    }
  };

  // Function to handle email/password login
  const handleLogin = async () => {
    if (!email || !password) return;

    try {
      const response = await fetch("http://192.168.1.7:3002/signin", {
        // Update to your server's IP address
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_id: email, password: password }), // Use your API's parameter names
      });

      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem("email_id", email); // Save email to AsyncStorage
        Alert.alert("Login successful!");
        navigation.navigate("TaskListScreen", { email }); // Navigate to TaskListScreen with email
      } else {
        Alert.alert("Error", data.error || "Failed to login");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Failed to login");
    }
  };

  // Function to handle sign-up
  const handleSignUp = async () => {
    if (!email || !password) return;

    try {
      const response = await fetch("http://192.168.1.7:3002/signup", {
        // Update to your server's IP address
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_id: email, password: password }), // Use your API's parameter names
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Account created successfully", [
          { text: "OK", onPress: () => setIsLogin(true) }, // Switch to login screen
        ]);
      } else {
        Alert.alert("Error", data.error || "Failed to sign up");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Failed to sign up");
    }
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.title}>{isLogin ? "Login" : "Sign Up"}</Text>
        {isLogin && (
          <>
            <Button title="Login with Google" onPress={handleOAuthLogin} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </>
        )}
        {!isLogin && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </>
        )}
        <Button
          title={isLogin ? "Login" : "Sign Up"}
          onPress={isLogin ? handleLogin : handleSignUp}
        />
        <Button
          title={
            isLogin
              ? "Don't have an account? Sign Up"
              : "Already have an account? Login"
          }
          onPress={() => setIsLogin(!isLogin)}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover", // Ensures the image covers the entire background
    justifyContent: "center", // Center content vertically
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: "rgba(255, 255, 255,0.5)", // Slightly transparent white background to make text input readable
    borderRadius: 10, // Optional: Adds rounded corners to the container
    marginHorizontal: 40,
    marginVertical: 170, // Optional: Adds horizontal margin to avoid content touching screen edges
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    backgroundColor: "#fff", // Ensures the text input is readable against the background
  },
});
