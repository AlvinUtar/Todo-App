import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { db } from "../config/FirebaseConfig";

interface SubTask {
  id: number;
  name: string;
  completed: boolean;
}
interface Project {
  id?: string;
  title: string;
  details: string;
  dueDate: string;
  progress: string;
  teamMembers: string[];
  assignedBy: string;
}

const FinalYearProject = () => {
  const router = useRouter();
  
  const {
    title = "",
    details = "",
    assignedBy = "",
    dueDate = "",
    progress = "85",
    teamMembers = "[]",
    id = "", // Add project document ID
  } = useLocalSearchParams();

  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newSubTaskName, setNewSubTaskName] = useState(""); // For new subtask input
  const [isModalVisible, setModalVisible] = useState(false);
  const [delayDays, setDelayDays] = useState("");

   // Fetch existing subtasks when component mounts
   useEffect(() => {
    const fetchSubTasks = async () => {
      try {
        // Ensure we have a project ID before querying
        if (!id) return;
  
        const projectRef = doc(db, "projects", id as string);
        const projectDoc = await getDoc(projectRef);
        
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          const fetchedSubTasks: SubTask[] = (projectData.subtasks || []).map((subtask, index) => ({
            id: index.toString(), // Use index as a temporary ID
            name: subtask.name,
            completed: subtask.completed || false
          }));
  
          setSubTasks(fetchedSubTasks);
        }
      } catch (error) {
        console.error("Error fetching subtasks:", error);
      }
    };
  
    fetchSubTasks();
  }, [id]);


  const handleAddSubTask = () => {
    setModalVisible(true); // Show modal when add subtask is pressed
  };

  const handleAddSubTaskConfirm = async () => {
    if (newSubTaskName.trim() === "") return;
  
    try {
      // Reference to the project document
      const projectRef = doc(db, "projects", id as string);
      
      // Get current project data
      const projectDoc = await getDoc(projectRef);
      const projectData = projectDoc.data();
      
      // Create new subtask
      const newSubTask = {
        name: newSubTaskName,
        completed: false
      };
      
      // Update subtasks array
      const updatedSubtasks = projectData?.subtasks 
        ? [...projectData.subtasks, newSubTask]
        : [newSubTask];
      
      // Update project document with new subtasks and recalculated progress
      await updateDoc(projectRef, { 
        subtasks: updatedSubtasks,
        progress: calculateProjectProgress(updatedSubtasks)
      });
  
      // Update local state
      setSubTasks((prevSubTasks) => [
        ...prevSubTasks, 
        { 
          id: (prevSubTasks.length).toString(), 
          name: newSubTaskName, 
          completed: false 
        }
      ]);
  
      setNewSubTaskName(""); 
      setModalVisible(false);
    } catch (error) {
      console.error("Error adding subtask:", error);
      Alert.alert("Error", "Failed to add subtask");
    }
  };

  useEffect(() => {
    const fetchAssignedByDetails = async () => {
      if (!assignedBy) {
        console.log("No createdBy value provided");
        return;
      }

      try {
        console.log(`Attempting to fetch user with ID: ${assignedBy}`);
        const userDocRef = doc(db, "users", assignedBy as string);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          console.log("User document found. Full data:", userDoc.data());
          
          // Log potential name fields
          console.log("Potential name fields:", {
            name: userDoc.data().name,
            displayName: userDoc.data().displayName,
            email: userDoc.data().email
          });

          const userName = 
            userDoc.data().name || 
            userDoc.data().displayName ||
            (userDoc.data().email
              ? userDoc.data().email.split("@")[0]
              : "Unknown");
          
          console.log(`Assigned by: ${userName}`);
        } else {
          console.log(`No user document found for ID: ${assignedBy}`);
        }
      } catch (error) {
        console.error("Detailed error fetching user details:", error);
      }
    };

    fetchAssignedByDetails();
  }, [assignedBy]);

  const toggleSubTaskCompletion = async (taskId: string) => {
    try {
      // Log the received task ID and the project ID
      console.log('Toggling subtask:', {
        taskId,
        projectId: id,
        projectIdType: typeof id
      });
  
      // Validate project ID
      if (!id) {
        console.error('No project ID available');
        Alert.alert('Error', 'Project ID is missing');
        return;
      }
  
      // Reference to the project document
      const projectRef = doc(db, "projects", id as string);
      
      // Get current project data
      const projectDoc = await getDoc(projectRef);
      
      // Check if project document exists
      if (!projectDoc.exists()) {
        console.error('Project document does not exist', { id });
        Alert.alert('Error', 'Project not found');
        return;
      }
  
      const projectData = projectDoc.data();
      
      // Create a copy of subtasks and update the specific subtask
      const updatedSubtasks = (projectData?.subtasks || []).map((subtask, index) => 
        index.toString() === taskId 
          ? { ...subtask, completed: !subtask.completed } 
          : subtask
      );
      
      // Calculate new project progress
      const newProgress = calculateProjectProgress(updatedSubtasks);
      
      // Update project document
      await updateDoc(projectRef, { 
        subtasks: updatedSubtasks,
        progress: newProgress
      });
  
      // Update local state
      setSubTasks((prevSubTasks) =>
        prevSubTasks.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        )
      );
    } catch (error) {
      console.error('Detailed error toggling subtask:', {
        error,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      });
      Alert.alert('Error', 'Failed to update subtask: ' + error.message);
    }
  };

  // Helper function to calculate project progress
const calculateProjectProgress = (subtasks: any[]) => {
  const totalSubTasks = subtasks.length;
  const completedSubTasks = subtasks.filter((task) => task.completed).length;
  return totalSubTasks > 0 
    ? Math.round((completedSubTasks / totalSubTasks) * 100) 
    : 0;
};

  const updateProjectProgress = async () => {
    try {
      // Recalculate completion percentage
      const totalSubTasks = subTasks.length;
      const completedSubTasks = subTasks.filter((task) => task.completed).length;
      const completionPercentage = totalSubTasks > 0 
        ? Math.round((completedSubTasks / totalSubTasks) * 100) 
        : 0;

      // Update project document in Firestore
      if (id) {
        const projectRef = doc(db, "projects", id as string);
        await updateDoc(projectRef, {
          progress: completionPercentage
        });
      }
    } catch (error) {
      console.error("Error updating project progress:", error);
    }
  };

   const sortedSubTasks = [...subTasks].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  const totalSubTasks = subTasks.length;
  const completedSubTasks = subTasks.filter((task) => task.completed).length;
  const completionPercentage = totalSubTasks > 0 
    ? (completedSubTasks / totalSubTasks) * 100 
    : 0;

  // Parse team members
  const parsedTeamMembers = JSON.parse(teamMembers as string);

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.projectTitle}>{title}</Text>

        {/* Project Details Section */}
        <View style={styles.projectDetailsContainer}>
          <Text style={styles.sectionSubtitle}>About the Project</Text>
          <Text style={styles.projectDescription}>{details}</Text>
        </View>

        {/* Completion Section */}
        <View style={styles.completionContainer}>
          <Text style={styles.completionText}>
            Completion: {completionPercentage.toFixed(0)}%
          </Text>
          <Text style={styles.completionText}>
            {completedSubTasks}/{totalSubTasks}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressBarFill, { width: `${completionPercentage}%` }]}
          />
        </View>

        {/* Assigned By & Due Date */}
        <Text style={styles.sectionText}>Assigned by: {assignedBy}</Text>
        <View style={styles.dueDateContainer}>
          <Text style={styles.sectionText}>Due Date: {dueDate}</Text>
          {/* <TouchableOpacity
            style={styles.delayButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.delayButtonText}>Delay</Text>
          </TouchableOpacity>*/}
        </View>
        <Text style={styles.sectionSubtitle}>Assigned To</Text>

        <View style={styles.assignedToContainer}>
          {parsedTeamMembers.map((member: string, index: number) => (
            <View key={index} style={styles.profileContainer}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={{ uri: "https://via.placeholder.com/50" }}
                  style={styles.profileImage}
                />
                <Text style={styles.profileName}>{member}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Subtasks section */}
        <View style={styles.projectDetailsContainer}>
          <Text style={styles.sectionSubtitle}>Sub-Tasks</Text>

          <ScrollView style={styles.tasksScrollContainer}>
            {sortedSubTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={task.completed ? styles.taskItemDone : styles.taskItem}
                onPress={() => toggleSubTaskCompletion(task.id)}
              >
                <Feather
                  name={task.completed ? "check-circle" : "circle"}
                  size={20}
                  color={task.completed ? "#4CAF50" : "#FFFFFF"}
                  style={styles.checkCircle}
                />
                <Text
                  style={[styles.taskText, task.completed && styles.completedTaskText]}
                >
                  {task.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

         {/* Add Subtask Button */}
         <TouchableOpacity
            style={styles.addSubTaskButton}
            onPress={handleAddSubTask}
          >
            <Text style={styles.addSubTaskButtonText}>Add Subtask</Text>
          </TouchableOpacity>
        </View>

        {/* Modal for Adding Subtask */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Enter Subtask Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter subtask name"
                placeholderTextColor="#AAA"
                value={newSubTaskName}
                onChangeText={setNewSubTaskName}
              />
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleAddSubTaskConfirm}
                >
                  <Text style={styles.modalButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#121212", // Matches the app's theme
  },
  container: {
    flex: 1,
    padding: 14,
  },
  tasksScrollContainer: {
    maxHeight: 200, // Set a fixed height for scrolling (adjust as needed)
    marginBottom: 10, // Space between tasks and the Add Subtask button
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: "#1c1c1e",
    borderBottomWidth: 1,
    borderBottomColor: "#2c2c2e",
    position: "relative", // Keeps it as a relative container for positioning
  },
  backButton: {
    width: 40, // Increased width for easier touch area
    height: 40, // Increased height for easier touch area
    borderRadius: 30, // Adjusted for a more circular button
    backgroundColor: "#7E1919", // Red background
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    left: 16,
    top: 10, // Adjusted to make it easier to click (if needed)
    zIndex: 10, // Ensures it stays on top of other elements
  },
  
  projectTitle: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  projectDetailsContainer: {
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  projectDescription: {
    fontSize: 14,
    color: "#C1C1C1",
  },
  completionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  completionText: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#333",
    borderRadius: 5,
    marginBottom: 10,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FB5356",
    borderRadius: 5,
  },
  sectionText: {
    fontSize: 12,
    color: "#C1C1C1",
    marginTop: 20,
  },
  dueDateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  delayButton: {
    backgroundColor: "#FE8F90",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 10,
  },
  delayButtonText: {
    color: "#000000",
    fontSize: 14,
  },
  assignedToContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  profileContainer: {
    alignItems: "center",
    marginRight: 15,
  },
  // Container for profile image and its frame (rectangle shape)
  profileImageContainer: {
    backgroundColor: "#353535", // Rectangle background color
    padding: 12, // Make the rectangle slightly bigger
    borderRadius: 12, // Rounded corners for the rectangle
    alignItems: "center", // Center the image and name
    justifyContent: "center",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25, // Circle image
  },
  profileName: {
    color: "#FFFFFF", // Color for the name text (remains white)
    fontSize: 12,
    marginTop: 10,
    marginBottom: 5, // Add a little space between image and name
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#494949",
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
  },
  taskText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 15,
    textAlign: "center", // Center the task text
    flex: 1, // Allow the text to take up available space
  },
  taskItemDone: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#292929",
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
  },
  completedTaskText: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  checkCircle: {
    marginRight: 15, // Space between circle and text
  },
  addSubTaskButton: {
    backgroundColor: "#9ACEAA",
    paddingVertical: 10, // Keep vertical padding to maintain height
    paddingHorizontal: 25, // Horizontal padding to make it shorter
    borderRadius: 10,
    alignSelf: "center", // Centers the button, but won't stretch its width
    marginTop: 20,
    width: "60%", // Set a percentage width (adjust as needed)
  },

  addSubTaskButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center", // Ensure text is centered
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  modalDescription: {
    fontSize: 14,
    color: "#AAAAAA",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 40,
    backgroundColor: "#333333",
    borderRadius: 5,
    paddingHorizontal: 10,
    color: "#FFFFFF",
    marginBottom: 20,
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#7E1919",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});

export default FinalYearProject;
