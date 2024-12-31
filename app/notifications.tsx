import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "../config/FirebaseConfig";

// Define interfaces
interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
  projectId?: string;
}

interface Project {
  id?: string;
  title: string;
  details: string;
  dueDate: Date;
  assignedTo: string;
  createdBy: string;
  createdAt: any;
  isImportant?: boolean; // New field
}

const ChatScreen = () => {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  const flatListRef = useRef<FlatList>(null);

  // Project Assignment State
  const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
  const [isProjectDetailsModalVisible, setIsProjectDetailsModalVisible] =
    useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [project, setProject] = useState<Project>({
    title: "",
    details: "",
    dueDate: new Date(),
    assignedTo: "",
    createdBy: "",
    createdAt: null,
    isImportant: false,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Get current user
  const auth = getAuth();
  const user = auth.currentUser;

  // Fetch Users on Modal Open
  useEffect(() => {
    if (isProjectModalVisible) {
      const fetchUsers = async () => {
        const usersQuery = collection(db, "users"); // Assuming 'users' is your collection
        const snapshot = await onSnapshot(usersQuery, (querySnapshot) => {
          const fetchedUsers = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name || "Unknown User",
          }));
          setUsers(fetchedUsers);
        });
      };

      fetchUsers();
    }
  }, [isProjectModalVisible]);

  useEffect(() => {
    if (!user) {
      router.replace("/LoginScreen");
      return;
    }

    const messagesQuery = query(
      collection(db, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const fetchedMessages: Message[] = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Message)
      );
      setMessages(fetchedMessages);

      // Scroll to the latest message after updating messages
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsubscribe();
  }, [user]);

  // Send message function
  const sendMessage = async () => {
    if (user && messageText.trim() !== "") {
      try {
        // Add the message to Firestore
        await addDoc(collection(db, "messages"), {
          senderId: user.uid,
          senderName: user.displayName || user.email || "Anonymous User",
          text: messageText.trim(),
          timestamp: serverTimestamp(),
        });

        // Dismiss the keyboard
        Keyboard.dismiss();

        // Clear the message input
        setMessageText("");

        // Scroll to the bottom of the list
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        console.error("Error sending message: ", error);
      }
    }
  };

  // Assign Project function
  // Assign Project function
  const assignProject = async () => {
    if (user && project.title.trim() !== "") {
      setIsLoading(true);
      try {
        // Add project to Firestore
        const projectRef = await addDoc(collection(db, "projects"), {
          title: project.title,
          details: project.details,
          dueDate: project.dueDate,
          assignedTo: project.assignedTo,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          isImportant: project.isImportant || false, // Save important status
        });

        // Send a message about the project assignment with project ID
        const messageText = project.isImportant
          ? `🌟 Important Project Assigned: ${project.title}`
          : `📋 New Project Assigned: ${project.title}`;

        // Send a message about the project assignment with project ID
        await addDoc(collection(db, "messages"), {
          senderId: user.uid,
          senderName: user.displayName || user.email || "Anonymous User",
          text: messageText,
          timestamp: serverTimestamp(),
          projectId: projectRef.id,
        });

        // Reset and close modal
        setProject({
          title: "",
          details: "",
          dueDate: new Date(),
          assignedTo: "",
          createdBy: "",
          createdAt: null,
          isImportant: false,
        });
        setIsProjectModalVisible(false);

        // Scroll to the bottom of the list
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        console.error("Error assigning project: ", error);
        // Consider adding a user-friendly error message
        alert("Failed to assign project. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // View Project Details
  const viewProjectDetails = async (projectId: string) => {
    try {
      // Fetch the full project details from Firestore
      const projectDocRef = doc(db, "projects", projectId);
      const projectDoc = await getDoc(projectDocRef);

      if (projectDoc.exists()) {
        const projectData = projectDoc.data() as Project;
        setSelectedProject({
          id: projectId,
          ...projectData,
          dueDate:
            projectData.dueDate instanceof Date
              ? projectData.dueDate
              : new Date(projectData.dueDate.seconds * 1000),
        });

        setIsProjectDetailsModalVisible(true);
      }
    } catch (error) {
      console.error("Error viewing project details: ", error);
    }
  };

  // Render individual message item
  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === user?.uid;
    const isProjectMessage =
      item.text.startsWith("📋 New Project Assigned:") ||
      item.text.startsWith("🌟 Important Project Assigned:");

    return (
      <TouchableOpacity
        onPress={() =>
          isProjectMessage && item.projectId
            ? viewProjectDetails(item.projectId)
            : null
        }
        activeOpacity={isProjectMessage ? 0.7 : 1}
      >
        <View
          style={[
            styles.messageContainer,
            isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
            isProjectMessage && styles.projectMessageContainer,
          ]}
        >
          {!isCurrentUser && (
            <View style={styles.profileContainer}>
              <Image
                source={require("../assets/images/profile.jpg")}
                style={styles.profileIcon}
              />
            </View>
          )}
          <View style={styles.messageDetailsContainer}>
            {!isCurrentUser && (
              <Text style={styles.senderName}>{item.senderName}</Text>
            )}
            <Text
              style={[
                styles.messageText,
                isCurrentUser
                  ? styles.currentUserMessageText
                  : styles.otherUserMessageText,
                isProjectMessage && styles.projectMessageText,
              ]}
            >
              {item.text}
            </Text>
            <Text style={styles.messageTime}>
              {item.timestamp?.toDate
                ? item.timestamp.toDate().toLocaleTimeString()
                : "Just now"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Group Chat</Text>
            </View>
          </View>

          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id || Math.random().toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            inverted={false} // Keep the messages in normal order
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: true }); // Scroll to the latest message
            }}
          />

          {/* Project Assignment Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isProjectModalVisible}
            onRequestClose={() => setIsProjectModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalKeyboardContainer}
              >
                <ScrollView
                  contentContainerStyle={styles.modalScrollContainer}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Assign New Project</Text>

                    <TextInput
                      style={styles.modalInput}
                      placeholder="Project Title"
                      placeholderTextColor="#8e8e93"
                      value={project.title}
                      onChangeText={(text) =>
                        setProject({ ...project, title: text })
                      }
                    />

                    <TextInput
                      style={[styles.modalInput, styles.multilineInput]}
                      placeholder="Project Details"
                      placeholderTextColor="#8e8e93"
                      multiline
                      value={project.details}
                      onChangeText={(text) =>
                        setProject({ ...project, details: text })
                      }
                    />

                    {/* Date Picker Logic */}
                    <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                      <Text style={styles.datePickerText}>
                        Due Date: {project.dueDate.toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                      <DateTimePicker
                        value={project.dueDate}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                          setShowDatePicker(false);
                          if (selectedDate) {
                            setProject({ ...project, dueDate: selectedDate });
                          }
                        }}
                        minimumDate={new Date()}
                      />
                    )}

                    {/* User Assignment List */}
                    <Text style={styles.modalLabel}>Assign To:</Text>
                    <View style={styles.userListContainer}>
                      <ScrollView>
                        {users.map((userItem) => (
                          <TouchableOpacity
                            key={userItem.id}
                            style={[
                              styles.userItem,
                              project.assignedTo === userItem.name &&
                                styles.userItemSelected,
                            ]}
                            onPress={() =>
                              setProject({
                                ...project,
                                assignedTo: userItem.name,
                              })
                            }
                          >
                            <Text style={styles.userItemText}>
                              {userItem.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Important Project Toggle */}
                    <View style={styles.importantToggleContainer}>
                      <Text style={styles.importantLabel}>
                        Mark as Important
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.importantToggle,
                          project.isImportant
                            ? styles.importantToggleActive
                            : styles.importantToggleInactive,
                        ]}
                        onPress={() =>
                          setProject({
                            ...project,
                            isImportant: !project.isImportant,
                          })
                        }
                      >
                        <View
                          style={[
                            styles.importantToggleCircle,
                            project.isImportant
                              ? styles.importantToggleCircleActive
                              : styles.importantToggleCircleInactive,
                          ]}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.modalButtonContainer}>
                      <TouchableOpacity
                        style={styles.modalCancelButton}
                        onPress={() => setIsProjectModalVisible(false)}
                      >
                        <Text style={styles.modalButtonText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.modalAssignButton}
                        onPress={assignProject}
                        disabled={isLoading}
                      >
                        <Text style={styles.modalButtonText}>
                          {isLoading ? "Assigning..." : "Assign Project"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </View>
          </Modal>

          {/* Project Details Modal */}
<Modal
  animationType="slide"
  transparent={true}
  visible={isProjectDetailsModalVisible}
  onRequestClose={() => setIsProjectDetailsModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      {selectedProject ? (
        <>
          <Text style={styles.modalTitle}>Project Details</Text>
          <Text style={styles.modalLabel}>Title:</Text>
          <Text style={styles.projectDetailText}>{selectedProject.title}</Text>

          <Text style={styles.modalLabel}>Details:</Text>
          <Text style={styles.projectDetailText}>{selectedProject.details}</Text>

          <Text style={styles.modalLabel}>Due Date:</Text>
          <Text style={styles.projectDetailText}>
            {selectedProject.dueDate.toLocaleDateString()}
          </Text>

          <Text style={styles.modalLabel}>Assigned To:</Text>
          <Text style={styles.projectDetailText}>
            {selectedProject.assignedTo}
          </Text>

          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setIsProjectDetailsModalVisible(false)}
          >
            <Text style={styles.modalButtonText}>Close</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.projectDetailText}>Loading...</Text>
      )}
    </View>
  </View>
</Modal>


          {/* Message Input */}
          <View style={styles.messageInputContainer}>
            {/* Project Assignment Button */}
            <TouchableOpacity
              onPress={() => setIsProjectModalVisible(true)}
              style={styles.projectButton}
            >
              <Feather name="plus" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              placeholderTextColor="#8e8e93"
              value={messageText}
              onChangeText={setMessageText}
              multiline
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={messageText.trim() === ""}
            >
              <Feather
                name="send"
                size={24}
                color={messageText.trim() !== "" ? "#FFFFFF" : "#8e8e93"}
                style={styles.sendIcon}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c1c1e",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: "#1c1c1e",
    borderBottomWidth: 1,
    borderBottomColor: "#2c2c2e",
    position: "relative",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7E1919",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  titleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "400",
    color: "#ffffff",
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 8,
    alignItems: "flex-end",
  },
  currentUserMessage: {
    justifyContent: "flex-end",
    alignSelf: "flex-end",
  },
  otherUserMessage: {
    justifyContent: "flex-start",
    alignSelf: "flex-start",
  },
  profileContainer: {
    marginRight: 8,
  },
  profileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  messageDetailsContainer: {
    maxWidth: "80%",
  },
  senderName: {
    fontSize: 12,
    color: "#8e8e93",
    marginBottom: 4,
  },
  messageText: {
    padding: 10,
    borderRadius: 12,
    fontSize: 15,
  },
  currentUserMessageText: {
    backgroundColor: "#007AFF",
    color: "#FFFFFF",
    alignSelf: "flex-end",
  },
  otherUserMessageText: {
    backgroundColor: "#2c2c2e",
    color: "#FFFFFF",
    alignSelf: "flex-start",
  },
  messageTime: {
    fontSize: 10,
    color: "#8e8e93",
    marginTop: 4,
  },
  messageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#2c2c2e",
    borderTopWidth: 1,
    borderTopColor: "#3c3c3e",
  },
  messageInput: {
    flex: 1,
    backgroundColor: "#3c3c3e",
    color: "#FFFFFF",
    borderRadius: 8,
    padding: 10,
    maxHeight: 100,
  },
  sendIcon: {
    marginLeft: 8,
    alignSelf: "center",
  },
  // New styles for Project Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: 300,
    backgroundColor: "#2c2c2e",
    borderRadius: 12,
    padding: 20,
    maxHeight: "120%",
  },
  modalTitle: {
    fontSize: 22,
    color: "#FFFFFF",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: "#3c3c3e",
    color: "#FFFFFF",
    borderRadius: 8,
    padding: 10,
    marginTop: 15,
    marginBottom: 15,
  },
  multilineInput: {
    minHeight: 100,
  },
  datePickerText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#7E1919",
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center", // Center content horizontally
    justifyContent: "center", // Center content vertically
  },
  modalAssignButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 1,
    borderRadius: 8,
    alignItems: "center", // Center content horizontally
    justifyContent: "center", // Center content vertically
  },
  modalButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
  },
  projectButton: {
    backgroundColor: "#007AFF",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  // New styles for Project Messages and Details
  projectMessageContainer: {
    backgroundColor: "rgba(0, 122, 255, 0.1)", // Light blue background
    borderRadius: 15,
  },
  projectMessageText: {
    fontWeight: "bold",
  },
  projectDetailLabel: {
    fontSize: 14,
    color: "#8e8e93",
    marginTop: 15,
    marginBottom: 5,
  },
  projectDetailText: {
    fontSize: 24,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 30,
  },
  modalCloseButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  modalKeyboardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    width: "100%",
    alignItems: "center",
  },
  importantToggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 15,
  },
  importantLabel: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  importantToggle: {
    width: 50,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    padding: 2,
  },
  importantToggleActive: {
    backgroundColor: "#007AFF",
  },
  importantToggleInactive: {
    backgroundColor: "#8e8e93",
  },
  importantToggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  importantToggleCircleActive: {
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-end",
  },
  importantToggleCircleInactive: {
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
  },
  userListContainer: {
    maxHeight: 250,
    marginVertical: 15,
    backgroundColor: "#2c2c2e",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  userItem: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#3c3c3e",
  },
  userItemText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  userItemSelected: {
    backgroundColor: "rgba(0, 122, 255, 0.2)",
  },
  modalLabel: {
    color: "#fff",
    fontWeight:300,
  },
});

export default ChatScreen;
