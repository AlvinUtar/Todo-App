import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../config/FirebaseConfig";
import { Feather } from "@expo/vector-icons";

export default function AddTask() {
  const router = useRouter();
  const [state, setState] = useState({
    taskName: "",
    selectedDate: "Today",
    selectedTaskType: "",
    customDate: new Date(),
    showCustomDatePicker: false,
    taskTypes: ["Design", "Testing"],
    showAddTypeModal: false,
    newTaskType: "",
  });

  const updateState = (newState: Partial<typeof state>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  const onDateChange = (event: any, date?: Date) => {
    if (date) {
      updateState({
        customDate: date,
        selectedDate: "Custom",
        showCustomDatePicker: false,
      });
    }
  };

  const handleCreateTask = async () => {
    const { taskName, selectedDate, selectedTaskType, customDate } = state;

    if (!taskName.trim()) {
      return Alert.alert("Error", "Please enter a task name");
    }

    if (!selectedTaskType) {
      return Alert.alert("Error", "Please select a task type");
    }

    try {
      await addDoc(collection(db, "DailyTasks"), {
        name: taskName,
        date:
          selectedDate === "Custom"
            ? customDate.toLocaleDateString()
            : selectedDate,
        type: selectedTaskType,
        completed: false,
        createdAt: new Date(),
      });

      Alert.alert("Success", "Task created successfully", [
        { text: "OK", onPress: () => router.push("/") },
      ]);
    } catch (error) {
      console.error("Error adding task: ", error);
      Alert.alert("Error", "Failed to create task");
    }
  };

  const handleAddNewTaskType = () => {
    const trimmedType = state.newTaskType.trim();

    if (!trimmedType) {
      return Alert.alert("Invalid Input", "Please enter a task type.");
    }

    if (state.taskTypes.includes(trimmedType)) {
      return Alert.alert("Duplicate Type", "This task type already exists.");
    }

    updateState({
      taskTypes: [...state.taskTypes, trimmedType],
      selectedTaskType: trimmedType,
      newTaskType: "",
      showAddTypeModal: false,
    });
  };

  const renderDateButtons = () => {
    return ["Today", "Tomorrow", "Custom"].map((date) => (
      <View key={date} style={styles.dateButtonContainer}>
        <TouchableOpacity
          style={[
            styles.dateButton,
            state.selectedDate === date && styles.selectedDateButton,
          ]}
          onPress={() => {
            Keyboard.dismiss();
            updateState({
              selectedDate: date,
              showCustomDatePicker: date === "Custom",
              
              
            });
          }}
        >
          <Text
            style={[
              styles.dateText,
              state.selectedDate === date && styles.selectedDateText,
            ]}
          >
            {date}
          </Text>
        </TouchableOpacity>
        <View
          style={[
            styles.dateUnderline,
            {
              borderBottomColor:
                state.selectedDate === date ? "#ff4d4d" : "#858585",
            },
          ]}
        />
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Feather name="arrow-left" size={20} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add a Task</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Task Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={state.taskName}
              onChangeText={(text) => updateState({ taskName: text })}
              placeholder="Enter Task Name"
              placeholderTextColor="#666"
              selectionColor="#ff4d4d"
            />
            <View style={styles.inputUnderline} />
          </View>

          <Text style={styles.label}>Task Date</Text>
          <View style={styles.dateContainer}>{renderDateButtons()}</View>

          {state.selectedDate === "Custom" && state.showCustomDatePicker && (
            <View style={styles.customDatePickerContainer}>
              <DateTimePicker
                value={state.customDate}
                mode="date"
                display="inline"
                onChange={onDateChange}
                style={styles.customDatePicker}
                accentColor="#ff4d4d"
                minimumDate={new Date()} // Prevents selecting previous dates
              />
            </View>
          )}

          {state.selectedDate === "Custom" && !state.showCustomDatePicker && (
            <View style={styles.selectedDateContainer}>
              <Text style={styles.customSelectedDateText}>
                Selected: {state.customDate.toLocaleDateString()}
              </Text>
              <TouchableOpacity
                onPress={() => updateState({ showCustomDatePicker: true })}
                style={styles.editDateButton}
              >
                <Text style={styles.editDateButtonText}>Change Date</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.label}>Task Type</Text>
          <View style={styles.taskTypeContainer}>
            {state.taskTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.taskTypeButton,
                  state.selectedTaskType === type &&
                    styles.selectedTaskTypeButton,
                ]}
                onPress={() => updateState({ selectedTaskType: type })}
              >
                <Text
                  style={[
                    styles.taskTypeText,
                    state.selectedTaskType === type &&
                      styles.selectedTaskTypeText,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addTypeButton}
              onPress={() => updateState({ showAddTypeModal: true })}
            >
              <Text style={styles.addTypeText}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateTask}
          >
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={state.showAddTypeModal}
        onRequestClose={() => updateState({ showAddTypeModal: false })}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add New Task Type</Text>
            <TextInput
              style={styles.modalInput}
              value={state.newTaskType}
              onChangeText={(text) => updateState({ newTaskType: text })}
              placeholder="Enter New Task Type"
              placeholderTextColor="#55"
              selectionColor="#ff4d4d"
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => updateState({ showAddTypeModal: false })}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalAddButton}
                onPress={handleAddNewTaskType}
              >
                <Text style={styles.modalAddButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between", // Ensures header and footer are not affected
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "600",
    textAlign: "center",
    flex: 1, // Ensures title is centered in header
  },
  menuIcon: {
    color: "#fff",
    fontSize: 26,
  },
  label: {
    color: "#C1C1C1",
    fontSize: 16,
    fontWeight: 300,
    marginTop: 20,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 10,
  },
  input: {
    color: "#fff",
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  inputUnderline: {
    height: 1,
    backgroundColor: "#858585",
    marginTop: 4,
    marginBottom: 10,
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dateButtonContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  dateButton: {
    paddingVertical: 8,
    marginTop: 10,
  },
  selectedDateButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#8C1A11",
  },
  dateText: {
    color: "#666",
    fontSize: 20,
    fontWeight: 600,
  },
  selectedDateText: {
    color: "#fff",
  },
  dateUnderline: {
    height: 1,
    width: "100%",
    marginTop: 4,
  },
  taskTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 10,
  },
  taskTypeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#330000",
    borderRadius: 10,
  },
  selectedTaskTypeButton: {
    backgroundColor: "#ff4d4d",
  },
  taskTypeText: {
    color: "#ff4d4d",
    fontSize: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedTaskTypeText: {
    color: "#fff",
  },
  addTypeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#330000",
    borderRadius: 10,
  },
  addTypeText: {
    color: "#ff4d4d",
    fontSize: 14,
    textAlign: "center",
  },
  createButton: {
    marginTop: "auto", // Ensures the button is at the bottom of the form
    marginBottom: 80,
    padding: 15,
    backgroundColor: "#7E1919",
    borderRadius: 8,
    alignItems: "center",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  floatingCloseButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "#ff4d4d",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  floatingCloseButtonText: {
    color: "#fff",
    fontSize: 20,
  },

  // Form Container with Centering
  formContainer: {
    flex: 1,
    justifyContent: "flex-start",
  },
  customSelectedDateText: {
    color: "#fff", // White text color
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center", // Center the text within the container
    textTransform: "capitalize", // Make the first letter of each word capitalized
  },
  fab: {
    position: "absolute",
    bottom: -15,
    alignSelf: "center",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ff4d4d",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    fontSize: 30,
    color: "#FFFFFF",
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 65,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7E1919",
    justifyContent: "center",
    alignItems: "center",
  },
  customDatePickerContainer: {
    backgroundColor: "#330000",
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
    marginBottom: 20,
  },
  customDatePicker: {
    backgroundColor: "#330000",
    width: "100%",
  },
  selectedDateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    backgroundColor: "#7E1919",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  editDateButton: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  editDateButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  // New Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    backgroundColor: "#330000",
    padding: 20,
    width: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: "#7E1919",
    color: "#fff",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    flex: 1,
    marginRight: 10,
    padding: 15,
    backgroundColor: "#330000",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ff4d4d",
  },
  modalCancelButtonText: {
    color: "#ff4d4d",
    fontSize: 16,
    textAlign: "center",
  },
  modalAddButton: {
    flex: 1,
    padding: 15,
    backgroundColor: "#ff4d4d",
    borderRadius: 10,
  },
  modalAddButtonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
});
