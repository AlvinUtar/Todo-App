import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  collection,
  query,
  where,
  doc,
  onSnapshot,
  getDocs,
  writeBatch,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../config/FirebaseConfig";
import AddTaskModal from "./SubTaskModal";
import { SwipeListView } from 'react-native-swipe-list-view';

// Update the interface to include tasks array and subtasks
interface Task {
  key: string;
  id: string;
  name: string;
  completed: boolean;
  tasks?: {
    name: string;
    completed: boolean;
    createdAt: Date;
  }[];
}

const DailyTask = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectTitle, setProjectTitle] = useState<string>(params.title ? String(params.title) : "FYP");
  const [isAddTaskModalVisible, setIsAddTaskModalVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  // Real-time listener for tasks
  useEffect(() => {
    const tasksQuery = query(
      collection(db, "DailyTasks"),
      where("name", "==", projectTitle)
    );

    const unsubscribe = onSnapshot(tasksQuery, (querySnapshot) => {
      const fetchedTasks: Task[] = [];
      
      querySnapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const projectTasks = (data.tasks || []).map((task: any, index: number) => ({
          key: `${docSnapshot.id}_${index}`,
          id: `${docSnapshot.id}_${index}`,
          name: task.name,
          completed: task.completed || false,
          tasks: [], // No nested tasks for now
        }));
        
        fetchedTasks.push(...projectTasks);
      });

      console.log("Fetched Tasks (Realtime):", fetchedTasks);
      setTasks(fetchedTasks);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [projectTitle]);

  // Function to delete entire project
  const deleteEntireProject = async () => {
    try {
      // Find the document for this project
      const querySnapshot = await getDocs(
        query(
          collection(db, "DailyTasks"), 
          where("name", "==", projectTitle)
        )
      );
  
      if (querySnapshot.empty) {
        Alert.alert("Error", "No project found");
        return;
      }
  
      // Get the first (and should be only) document for this project
      const docToDelete = querySnapshot.docs[0];
  
      // Delete the entire document
      await deleteDoc(doc(db, "DailyTasks", docToDelete.id));
  
      // Show success message
      Alert.alert("Success", "Project successfully deleted", [
        {
          text: "OK",
          onPress: () => router.back()
        }
      ]);
  
    } catch (error) {
      console.error("Error deleting project:", error);
      Alert.alert("Error", "Failed to delete project", [
        {
          text: "OK",
          style: "cancel"
        }
      ]);
    }
  };

  // Function to toggle task completion status
  const toggleTaskCompletion = async (taskId: string) => {
    try {
      // Find the task document and index
      const taskToUpdate = tasks.find((task) => task.id === taskId);
      if (!taskToUpdate) return;

      // Split the ID to get the document ID and task index
      const [docId, taskIndex] = taskId.split('_');

      // Get the reference to the DailyTasks document
      const taskDocRef = doc(db, "DailyTasks", docId);

      // Fetch the current document data
      const docSnapshot = await getDocs(
        query(
          collection(db, "DailyTasks"), 
          where("name", "==", projectTitle)
        )
      );

      if (docSnapshot.docs.length === 0) {
        Alert.alert("Error", "No document found");
        return;
      }

      // Get the first document (assuming one document per project)
      const docData = docSnapshot.docs[0].data();
      const currentTasks = docData.tasks || [];

      // Create a new tasks array with the updated task
      const updatedTasks = currentTasks.map((task: any, index: number) => 
        index === parseInt(taskIndex) 
          ? { ...task, completed: !task.completed } 
          : task
      );

      // Create a batch write to update the document
      const batch = writeBatch(db);
      batch.update(taskDocRef, { tasks: updatedTasks });

      // Commit the batch
      await batch.commit();

    } catch (error) {
      console.error("Error updating task:", error);
      Alert.alert("Error", "Failed to update task");
    }
  };

  // Function to delete a task
  const deleteTask = async (taskId: string) => {
    try {
      // Split the ID to get the document ID and task index
      const [docId, taskIndex] = taskId.split('_');

      // Get the reference to the DailyTasks document
      const taskDocRef = doc(db, "DailyTasks", docId);

      // Fetch the current document data
      const docSnapshot = await getDocs(
        query(
          collection(db, "DailyTasks"), 
          where("name", "==", projectTitle)
        )
      );

      if (docSnapshot.docs.length === 0) {
        Alert.alert("Error", "No document found");
        return;
      }

      // Get the first document (assuming one document per project)
      const docData = docSnapshot.docs[0].data();
      const currentTasks = docData.tasks || [];

      // Remove the task at the specified index
      const updatedTasks = currentTasks.filter((_: any, index: number) => 
        index !== parseInt(taskIndex)
      );

      // Create a batch write to update the document
      const batch = writeBatch(db);
      batch.update(taskDocRef, { tasks: updatedTasks });

      // Commit the batch
      await batch.commit();

    } catch (error) {
      console.error("Error deleting task:", error);
      Alert.alert("Error", "Failed to delete task");
    }
  };

  const handleAddTask = () => {
    setIsAddTaskModalVisible(true);
  };

  const handleTaskAdded = () => {
    setIsAddTaskModalVisible(false);
  };

  const renderTask = (data: { item: Task }, rowMap: any) => {
    const task = data.item;
    return (
      <TouchableOpacity
        style={task.completed ? styles.taskItemDone : styles.taskItem}
        onPress={() => toggleTaskCompletion(task.id)}
      >
        <Feather 
          name={task.completed ? "check-circle" : "circle"} 
          size={30} 
          color={task.completed ? "#FFFFFF" : "#FFFFFF"} 
        />
        <Text 
          style={[
            styles.taskText, 
            task.completed && styles.completedTaskText
          ]}
        >
          {task.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderHiddenItem = (data: { item: Task }, rowMap: any) => {
    return (
      <View style={styles.rowBack}>
        <TouchableOpacity 
          style={[styles.backRightBtn, styles.backRightBtnRight]}
          onPress={() => deleteTask(data.item.id)}
        >
          <Feather name="trash-2" size={25} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderMenu = () => (
    <Modal
      transparent={true}
      visible={isMenuVisible}
      animationType="fade"
      onRequestClose={() => setIsMenuVisible(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPressOut={() => setIsMenuVisible(false)}
      >
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              setIsMenuVisible(false);
              setIsDeleteModalVisible(true);
            }}
          >
            <Feather name="trash-2" size={20} color="#AA2D2D" />
            <Text style={styles.menuItemText}>Delete Project</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderDeleteConfirmationModal = () => (
    <Modal
      transparent={true}
      visible={isDeleteModalVisible}
      animationType="slide"
      onRequestClose={() => setIsDeleteModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.deleteModalContainer}>
          <Text style={styles.deleteModalTitle}>Delete Project</Text>
          <Text style={styles.deleteModalText}>
            Are you sure you want to delete this entire project? 
            All tasks will be permanently removed.
          </Text>
          
          <View style={styles.deleteModalButtonContainer}>
            <TouchableOpacity 
              style={styles.deleteModalCancelButton}
              onPress={() => setIsDeleteModalVisible(false)}
            >
              <Text style={styles.deleteModalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.deleteModalConfirmButton}
              onPress={() => {
                setIsDeleteModalVisible(false);
                deleteEntireProject();
              }}
            >
              <Text style={styles.deleteModalConfirmButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Daily Task</Text>

        {/* Three Dot Menu 
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setIsMenuVisible(true)}
        >
          <Feather name="more-vertical" size={24} color="#FFFFFF" />
        </TouchableOpacity>
*/}
        <View style={styles.leftTextContainer}>
          <Text style={styles.progressText}>
            {tasks.filter((task) => task.completed).length}/{tasks.length}
          </Text>
          <Text style={styles.titleText}>{projectTitle}</Text>
        </View>
      </View>

      <View style={styles.santaContainer}>
        <Image
          source={require("../assets/images/santa-claus.png")}
          style={styles.santaImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Ongoing Tasks</Text>
        <SwipeListView
          data={tasks.filter((task) => !task.completed)}
          renderItem={renderTask}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-75}
          disableRightSwipe
          keyExtractor={(item) => item.key}
        />
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Completed Tasks</Text>
        <SwipeListView
          data={tasks.filter((task) => task.completed)}
          renderItem={renderTask}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-75}
          disableRightSwipe
          keyExtractor={(item) => item.key}
        />
      </View>

      {/* Add Task Button */}
      <TouchableOpacity style={styles.addSubTaskButton} onPress={handleAddTask}>
        <Text style={styles.addSubTaskButtonText}>Add Task</Text>
      </TouchableOpacity>

      {/* Add Task Modal */}
      <AddTaskModal
        isVisible={isAddTaskModalVisible}
        onClose={() => setIsAddTaskModalVisible(false)}
        onTaskAdded={handleTaskAdded}
        projectTitle={projectTitle}
      />

      {/* Menu Modal */}
      {renderMenu()}

      {/* Delete Confirmation Modal */}
      {renderDeleteConfirmationModal()}
    </View>
  );
};
const styles = StyleSheet.create({
  menuButton: {
    position: 'absolute',
    top: 55,
    right: 20,
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuItemText: {
    marginLeft: 10,
    color: '#AA2D2D',
    fontSize: 16,
  },
  deleteModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#AA2D2D',
    marginBottom: 15,
  },
  deleteModalText: {
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteModalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  deleteModalCancelButton: {
    backgroundColor: '#E0E0E0',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  deleteModalCancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  deleteModalConfirmButton: {
    backgroundColor: '#AA2D2D',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  deleteModalConfirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  rowBack: {
    alignItems: 'center',
    backgroundColor: '#AA2D2D',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  backRightBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: 75,
  },
  backRightBtnRight: {
    backgroundColor: '#AA2D2D',
    right: 0,
    borderRadius: 10,
  },
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContainer: {
    backgroundColor: "#AA2D2D",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingVertical: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  leftTextContainer: {
    position: "absolute",
    left: 20,
    top: 180,
    alignItems: "flex-start",
  },
  progressText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "400",
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "800",
    marginTop: 15,
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 55,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7E1919",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 28,
    top: -60,
    fontWeight: "400",
    textAlign: "center",
  },
  santaContainer: {
    position: "absolute",
    top: 120,
    right: 10,
    width: 180,
    height: 180,
  },
  santaImage: {
    width: 180,
    height: 180,
  },
  sectionContainer: {
    marginTop: 20,
    backgroundColor: "#202020",
    borderRadius: 10,
    padding: 5,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#494949",
    padding: 20,
    borderRadius: 10,
    marginVertical: 5,
  },
  taskItemDone: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    padding: 20,
    borderRadius: 10,
    marginVertical: 5,
  },
  taskText: {
    marginLeft: 20,
    color: "#FFFFFF",
    fontSize: 16,
  },
  completedTaskText: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  subtaskItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 30,
    marginTop: 5,
  },
  subtaskText: {
    color: "#BDBDBD",
    fontSize: 14,
    marginLeft: 5,
  },
  completedSubtaskText: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  addSubTaskButton: {
    backgroundColor: "#7E1919",
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  addSubTaskButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default DailyTask;
