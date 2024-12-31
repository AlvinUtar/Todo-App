import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  StyleSheet, 
  Alert 
} from 'react-native';
import { 
    doc, 
    updateDoc, 
    arrayUnion,
    collection,
    where,
    query,
    getDocs
  } from "firebase/firestore";
import { db } from '../config/FirebaseConfig';

interface TaskModalProps {
  isVisible: boolean;
  onClose: () => void;
  projectTitle: string;
}

const AddTaskModal: React.FC<TaskModalProps> = ({ 
  isVisible, 
  onClose, 
  projectTitle 
}) => {
  const [taskName, setTaskName] = useState<string>('');

  const handleSaveTask = async () => {
    // Validate task name
    if (!taskName.trim()) {
      Alert.alert("Error", "Please enter a task name");
      return;
    }

    try {
      // Query to find the document with the project title
      const tasksQuery = query(
        collection(db, "DailyTasks"),
        where("name", "==", projectTitle)
      );

      const querySnapshot = await getDocs(tasksQuery);

      if (querySnapshot.empty) {
        Alert.alert("Error", "No project found");
        return;
      }

      // Iterate through the documents and add the task to each matching document
      querySnapshot.forEach(async (document) => {
        const projectDocRef = doc(db, "DailyTasks", document.id);

        // Update the document to add the task to its existing tasks array
        await updateDoc(projectDocRef, {
          tasks: arrayUnion({
            name: taskName,
            completed: false,
            createdAt: new Date(),
          }),
        });
      });

      // Reset and close
      setTaskName("");
      onClose();

      Alert.alert("Success", "Task added successfully");
    } catch (error) {
      console.error("Error adding task:", error);
      Alert.alert("Error", "Failed to add task");
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Add Task to {projectTitle}</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter Task Name"
            placeholderTextColor="#666"
            value={taskName}
            onChangeText={setTaskName}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSaveTask}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#202020',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    color: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#666',
    marginBottom: 20,
    paddingVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#330000',
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ff4d4d',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#ff4d4d',
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default AddTaskModal;