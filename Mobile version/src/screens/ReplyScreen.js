import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ImageBackground,
  Alert,
  TouchableOpacity,
} from "react-native";
import backgroundImage from "./lovepik-cool-city-mobile-phone-wallpaper-background-image_400521580.jpg";

export default function ReplyScreen({ route, navigation }) {
  const { task } = route.params;
  const [message, setMessage] = useState("");
  console.log("task", task);
  useEffect(() => {
    setMessage(task.response || "");
  }, [task]);
  const id = task.id;
  console.log("IDDDDDDD", id);

  const handleSendMail = async () => {
    try {
      const response = await fetch(`http://192.168.1.7:8082/send-email/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Email sent successfully!");
      } else {
        console.error("Failed to send email:", data);
        Alert.alert(
          "Error",
          `Failed to send email. Status: ${response.status} - ${
            data.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Failed to send email.");
    }
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.title}>Email Details</Text>
        <View style={styles.detailsContainer}>
          <Text style={styles.label}>
            Sender: <Text style={styles.value}>{task.receiver}</Text>
          </Text>
          <Text style={styles.label}>
            Receiver: <Text style={styles.value}>{task.sender}</Text>
          </Text>
          <Text style={styles.label}>
            Subject: <Text style={styles.value}>{task.subject}</Text>
          </Text>
          <Text style={styles.label}>Message:</Text>
          <TextInput
            style={styles.textInput}
            value={message}
            multiline
            onChangeText={setMessage}
          />
        </View>
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMail}>
          <Text style={styles.sendButtonText}>Send Mail</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
    padding: 20,
    borderRadius: 8,
    width: "90%",
    maxWidth: 500,
  },
  title: {
    fontSize: 24,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 10,
  },
  value: {
    fontWeight: "bold",
  },
  textInput: {
    height: 150,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    backgroundColor: "#fff",
    color: "#000",
    marginBottom: 20,
  },
  sendButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
