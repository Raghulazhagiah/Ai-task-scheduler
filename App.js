import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AuthScreen from "./src/screens/AuthScreen"; // Updated path
import TaskListScreen from "./src/screens/TaskListScreen"; // Updated path
import ReplyScreen from "./src/screens/ReplyScreen"; // Updated path

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Auth">
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ title: "Login / Sign Up" }}
        />
        <Stack.Screen name="TaskListScreen" component={TaskListScreen} />
        <Stack.Screen
          name="Reply"
          component={ReplyScreen}
          options={{ title: "Reply to Task" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
