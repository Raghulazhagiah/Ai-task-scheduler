import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import backgroundImage from "../assets/HD-wallpaper-iphone-14-iphone-apple-thumbnail.jpg"; // Updated path
import Icon from "react-native-vector-icons/MaterialIcons";

export default function TaskListScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [name, setName] = useState("");
  const [task, setTask] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    summary: false,
    to_do_list: false,
  });

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const email = await AsyncStorage.getItem("email_id");
        if (email !== null) {
          const response = await fetch(`http://192.168.1.7:3002/get/${email}`);
          const data = await response.json();
          setTasks(data);
        } else {
          console.warn("No email found in AsyncStorage");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchTasks();
  }, []);

  const handleSubmit = async () => {
    if (!name || !task) return;

    try {
      const email_id = await AsyncStorage.getItem("email_id");
      const createdDate = new Date().toISOString();
      const response = await fetch("http://192.168.1.7:3002/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, task, email: "0", createdDate, email_id }),
      });
      const data = await response.json();
      if (data.id) {
        setTasks([...tasks, { name, task, email: "0", id: data.id }]);
        setName("");
        setTask("");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDelete = async (name) => {
    try {
      const response = await fetch("http://192.168.1.7:3002/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (data.message === "Record deleted successfully") {
        setTasks(tasks.filter((task) => task.name !== name));
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const toggleExpandTask = (id) => {
    setExpandedTaskId(expandedTaskId === id ? null : id);
    if (expandedTaskId !== id)
      setExpandedSections({
        summary: false,
        to_do_list: false,
      });
  };

  const toggleExpandSection = (section) => {
    setExpandedSections((prevState) => ({
      ...prevState,
      [section]: !prevState[section],
    }));
  };

  const renderItem = ({ item }) => (
    <View style={styles.taskItem}>
      <Text style={styles.taskText}>
        {item.name}: {item.task}
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.name)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
        {item.email == "1" && (
          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => navigation.navigate("Reply", { task: item })}
          >
            <Text style={styles.replyButtonText}>Reply</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => toggleExpandTask(item.id)}>
          <Icon
            name={expandedTaskId === item.id ? "expand-less" : "expand-more"}
            size={24}
            color="#f9db8d"
          />
        </TouchableOpacity>
      </View>
      {item.email == "1" && expandedTaskId === item.id && (
        <>
          <View style={styles.buttonContainer}>
            {item.summary && (
              <TouchableOpacity onPress={() => toggleExpandSection("summary")}>
                <Icon
                  name={
                    expandedSections.summary ? "expand-less" : "expand-more"
                  }
                  size={24}
                  color="#f9db8d"
                />
                <Text style={styles.buttonText}>Summary</Text>
              </TouchableOpacity>
            )}
            {item.to_do_list && (
              <TouchableOpacity
                onPress={() => toggleExpandSection("to_do_list")}
              >
                <Icon
                  name={
                    expandedSections.to_do_list ? "expand-less" : "expand-more"
                  }
                  size={24}
                  color="#f9db8d"
                />
                <Text style={styles.buttonText}>To-Do List</Text>
              </TouchableOpacity>
            )}
          </View>
          {expandedSections.summary && item.summary && (
            <TextInput
              style={styles.textArea}
              value={item.summary}
              multiline
              editable={false}
            />
          )}
          {expandedSections.to_do_list && item.to_do_list && (
            <TextInput
              style={styles.textArea}
              value={item.to_do_list}
              multiline
              editable={false}
            />
          )}
        </>
      )}
    </View>
  );

  return (
    <ImageBackground source={backgroundImage} style={styles.background}>
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Task Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Task Description"
            value={task}
            onChangeText={setTask}
          />
          <Button title="Add Task" onPress={handleSubmit} />
        </View>
        <FlatList
          data={tasks}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
        />
      </View>
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover", // Ensures the image covers the entire background
  },
  container: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent background to overlay on the image
  },
  formContainer: {
    padding: 20,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  input: {
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  taskItem: {
    padding: 20,
    marginBottom: 10,
    backgroundColor: "#333",
    borderRadius: 5,
  },
  taskText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 10, // Space below the task text
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#f9db8d",
    fontSize: 18,
  },
  textArea: {
    height: 200,
    borderColor: "#ddd",
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 10,
    backgroundColor: "#000000",
    color: "#ffffff",
  },
  deleteButton: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    marginRight: 10, // Add margin-right to create space between buttons
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  replyButton: {
    backgroundColor: "#007bff", // Blue background color
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    width: 100,
  },
  replyButtonText: {
    color: "#fff",
    fontSize: 14,
  },
});
