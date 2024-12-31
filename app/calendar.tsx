import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import * as Haptics from "expo-haptics";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import moment from "moment";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import * as Permissions from "expo-permissions";


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});


// Updated Task type definition
interface Task {
  id: string;
  month: string;
  date: number;
  name: string;
  start: string;
  end: string;
}

const NumberPicker = () => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(15);
  const [tasks, setTasks] = useState<{ [key: string]: Task[] }>({});
  const [isModalVisible, setModalVisible] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [isStartTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("November");
  const [isMonthDropdownVisible, setMonthDropdownVisible] = useState(false);

  const dates = Array.from({ length: 30 }, (_, i) => i + 1);
  const MONTHS = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }
    };
    requestPermissions();
    
  }, []);
  
  const handleScroll = (e: any) => {
    const newSelectedDate =
      dates[Math.floor(e.nativeEvent.contentOffset.x / 90)];
    if (newSelectedDate !== selectedDate) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedDate(newSelectedDate);
    }
  };

  const handleSaveTask = async () => {
    if (taskName && startTime && endTime) {
      const monthDateKey = `${selectedMonth}-${selectedDate}`;
      const newTask: Task = {
        id: `${monthDateKey}-${Date.now()}`,
        month: selectedMonth,
        date: selectedDate,
        name: taskName,
        start: startTime,
        end: endTime,
      };

      setTasks((prevTasks) => {
        const updatedTasks = { ...prevTasks };
        if (!updatedTasks[monthDateKey]) {
          updatedTasks[monthDateKey] = [];
        }
        updatedTasks[monthDateKey].push(newTask);
        return updatedTasks;
      });

      // Schedule a notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Task Reminder 🎉",
          body: `${taskName} (${startTime} - ${endTime})`,
          sound: "default",
        },
        trigger: { seconds: 1 }, // Notification after 1 second
      });
      

      // Reset modal state
      setTaskName("");
      setStartTime(null);
      setEndTime(null);
      setModalVisible(false);
    }
  };

  const handleTimeConfirm =
    (setter: React.Dispatch<React.SetStateAction<string | null>>) =>
    (time: Date) => {
      setter(moment(time).format("hh:mm A"));
      setStartTimePickerVisible(false);
      setEndTimePickerVisible(false);
    };

  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
    setMonthDropdownVisible(false);
  };

  // Get tasks for the current month and date
  const currentMonthDateTasks = useMemo(() => {
    const monthDateKey = `${selectedMonth}-${selectedDate}`;
    const tasksForDate = tasks[monthDateKey] || [];
    
    // Sort tasks by start time
    return tasksForDate.sort((a, b) => {
      // Convert times to 24-hour format for accurate comparison
      const parseTime = (time: string) => moment(time, "hh:mm A").format("HH:mm");
      return parseTime(a.start).localeCompare(parseTime(b.start));
    });
  }, [tasks, selectedMonth, selectedDate]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.dateContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.monthSelector}
          onPress={() => setMonthDropdownVisible(!isMonthDropdownVisible)}
        >
          <Text style={styles.monthText}>{selectedMonth}</Text>
          <Text style={styles.dropdownIcon}>▼</Text>
        </TouchableOpacity>
        {isMonthDropdownVisible && (
          <View style={styles.monthDropdown}>
            {MONTHS.map((month) => (
              <TouchableOpacity
                key={month}
                onPress={() => handleMonthSelect(month)}
                style={styles.monthDropdownItem}
              >
                <Text style={styles.monthDropdownItemText}>{month}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          snapToInterval={90}
          snapToAlignment="center"
          contentContainerStyle={styles.scrollContainer}
        >
          {dates.map((date) => (
            <View
              key={date}
              style={[
                styles.dateItem,
                selectedDate === date && styles.selectedDate,
              ]}
            >
              <Text
                style={[
                  styles.dateText,
                  selectedDate === date && styles.selectedDateText,
                ]}
              >
                {date}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.addButton}
      >
        <Text style={styles.addButtonText}>Add Task</Text>
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
          
            <Text style={styles.modalTitle}>Add Task for {selectedMonth} {selectedDate}</Text>
            <TextInput
              placeholder="Task Name"
              style={styles.input}
              value={taskName}
              onChangeText={setTaskName}
            />
            <TouchableOpacity
              onPress={() => setStartTimePickerVisible(true)}
              style={styles.timePickerButton}
            >
              <Text style={styles.timePickerText}>
                {startTime || "Select Start Time"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEndTimePickerVisible(true)}
              style={styles.timePickerButton}
            >
              <Text style={styles.timePickerText}>
                {endTime || "Select End Time"}
              </Text>
            </TouchableOpacity>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={handleSaveTask}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <DateTimePickerModal
  isVisible={isStartTimePickerVisible}
  mode="time"
  minimumDate={new Date()} // Prevent past time selection
  onConfirm={handleTimeConfirm(setStartTime)}
  onCancel={() => setStartTimePickerVisible(false)}
/>

<DateTimePickerModal
  isVisible={isEndTimePickerVisible}
  mode="time"
  minimumDate={
    startTime ? moment(startTime, "hh:mm A").toDate() : new Date()
  } // Prevent selecting time before Start Time
  onConfirm={handleTimeConfirm(setEndTime)}
  onCancel={() => setEndTimePickerVisible(false)}
/>


      <FlatList
        data={currentMonthDateTasks}
        keyExtractor={(item) => item.id}
        // Inside the FlatList renderItem
        renderItem={({ item }) => (
          <View style={styles.taskCalendarItem}>
            <View style={styles.timeColumn}>
              <View style={styles.timeDot}></View>
              <View style={styles.timeLine}></View>
            </View>
            <View style={styles.taskContent}>
              <Text style={styles.startTimeText}>{item.start}</Text>
              <View style={styles.taskNameContainer}>
                <Text style={styles.taskName}>{item.name}</Text>
              </View>
              <Text style={styles.endTimeText}>{item.end}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.noTasksText}>No tasks added for this date.</Text>
        }
        contentContainerStyle={styles.taskList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1e1e",
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  dateContainer: {
    marginBottom: 20,
  },

  // Month Selector Styles
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#444",
    paddingBottom: 20,
  },
  monthText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
  },
  dropdownIcon: {
    color: "#fff",
    marginLeft: 10,
    fontSize: 18,
  },
  monthDropdown: {
    position: "absolute",
    top: 70,
    width: "100%",
    backgroundColor: "#333",
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  monthDropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
    backgroundColor: "#444",
    alignItems: "center",
  },
  monthDropdownItemText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "600",
  },
  monthDropdownItemSelected: {
    backgroundColor: "#e53935",
    borderBottomWidth: 0,
  },

  // Date Picker Styles
  scrollContainer: { alignItems: "center" },
  dateItem: {
    width: 80,
    marginHorizontal: 10,
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "#444",
    borderRadius: 10,
    elevation: 3,
    marginBottom: 10,
  },
  selectedDate: { backgroundColor: "#e53935" },
  dateText: { color: "#fff", fontSize: 18 },
  selectedDateText: { color: "#fff", fontWeight: "bold" },

  // Add Task Button
  addButton: {
    backgroundColor: "#1e88e5",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 3,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    width: 400,
    padding: 20,
    backgroundColor: "#333",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    height: 45,
    borderColor: "#555",
    borderWidth: 1,
    borderRadius: 8,
    color: "#fff",
    paddingHorizontal: 12,
    marginBottom: 20,
    backgroundColor: "#444",
  },
  timePickerButton: {
    padding: 14,
    backgroundColor: "#555",
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
  },
  timePickerText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  saveButton: {
    backgroundColor: "#81c784",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    width: "48%",
    elevation: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  cancelButton: {
    backgroundColor: "#e53935",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    width: "48%",
    elevation: 4,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  closeModalButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#444",
    padding: 8,
    borderRadius: 12,
  },
  closeModalText: { color: "#fff", fontSize: 24 },

  // Task List Styles
  taskItem: {
    backgroundColor: "#2c2c2c",
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#3a3a3a",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 5,
  },
  taskHeader: { flexDirection: "row", justifyContent: "space-between" },
  taskIconContainer: {
    marginRight: 15,
    backgroundColor: "rgba(30, 136, 229, 0.2)",
    borderRadius: 10,
    padding: 10,
  },
  taskDetails: {
    flex: 1,
  },
  taskName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  taskTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  taskTimeLabel: {
    color: "#888",
    fontSize: 14,
    marginRight: 5,
  },
  taskTime: {
    color: "#bbb",
    fontSize: 14,
    marginRight: 10,
  },
  noTasksText: {
    color: "#666",
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    fontStyle: "italic",
  },
  taskList: { marginBottom: 20 },
  backButton: {
    position: "absolute",
    left: 20,
    top: 1,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7E1919",
    justifyContent: "center",
    alignItems: "center",
  },
  taskCalendarItem: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingRight: 20,
  },
  timeColumn: {
    width: 50,
    alignItems: 'center',
    marginRight: 15,
  },
  timeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1e88e5',
    marginBottom: 5,
  },
  timeLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#444',
  },
  taskContent: {
    flex: 1,
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#1e88e5',
  },
  startTimeText: {
    color: '#81c784',
    fontSize: 14,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  endTimeText: {
    color: '#e53935',
    fontSize: 14,
    marginTop: 10,
    fontWeight: 'bold',
  },
  taskNameContainer: {
    backgroundColor: '#333',
    borderRadius: 6,
    padding: 10,
    marginVertical: 10,
  },
});

export default NumberPicker;