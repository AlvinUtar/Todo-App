import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { styles } from "./styles"; // Your custom styles
import { useRouter } from "expo-router";
import { 
  collection, 
  query, 
  where, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../config/FirebaseConfig";

interface TaskCardProps {
  title: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({ title }) => {
  const router = useRouter();
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    // Real-time listener for tasks
    const tasksQuery = query(
      collection(db, "DailyTasks"),
      where("name", "==", title)
    );

    const unsubscribe = onSnapshot(tasksQuery, (querySnapshot) => {
      let totalTasks = 0;
      
      querySnapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const projectTasks = (data.tasks || []);
        totalTasks += projectTasks.length;
      });

      setTaskCount(totalTasks);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [title]);

  const handlePress = () => {
    router.push({
      pathname: "/dailytask",
      params: {
        title,
        priority: "High",
        progress: 75,
        time: "10:00 AM - 06:00 PM",
        dueDate: "25 December 2025",
        teamMembers: ["Sandra", "David"],
        notes: "Lorem ipsum testing testing testing",
      },
    });
  };

  return (
    <TouchableOpacity
      style={styles.taskCard}
      onPress={handlePress}
    >
      <View style={styles.taskContent}>
        <Image
          source={require("../assets/images/cat.png")}
          style={styles.taskIcon}
          resizeMode="contain"
        />
        <Text style={styles.taskTitle}>{title}</Text>
        <Text style={styles.taskCount}>{taskCount} Task{taskCount !== 1 ? 's' : ''}</Text>
      </View>
    </TouchableOpacity>
  );
};