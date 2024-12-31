import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import {
  User,
  Cake,
  Mail,
  Phone,
  Globe,
  Calendar,
  MoreVertical,
  LogOut,
  Save,
} from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { logout } from "../context/Auth";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { ReactNode } from "react";
import { Feather } from "@expo/vector-icons";


// Utility function to format creation date
const formatCreationDate = (timestamp?: number | string) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Define types for InfoItem props
interface InfoItemProps {
  icon: ReactNode;
  label: string;
  value: string;
  verified?: boolean;
}

// Info Item Component with Type Annotations
const InfoItem: React.FC<InfoItemProps> = ({
  icon,
  label,
  value,
  verified = false,
}) => (
  <View style={styles.infoItem}>
    <View style={styles.iconContainer}>{icon}</View>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.valueContainer}>
      <Text style={styles.value}>{value || "Not set"}</Text>
      {verified && <Text style={styles.verifiedBadge}>✓</Text>}
    </View>
  </View>
);

// Main Profile Component
const Profile: React.FC = () => {
  const router = useRouter();
  const auth = getAuth();
  const firestore = getFirestore();
  const currentUser = auth.currentUser;

  // State for modal and user details
  const [isModalVisible, setModalVisible] = useState(false);
  const [userDetails, setUserDetails] = useState({
    name: "",
    age: "",
    contact: "",
    region: "",
  });

  // Fetch user details from Firestore
  const fetchUserDetails = async () => {
    if (!currentUser) return;

    try {
      const userDocRef = doc(firestore, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserDetails({
          name: data.name || "",
          age: data.age || "",
          contact: data.contact || "",
          region: data.region || "",
        });
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  // Use useFocusEffect to refresh user details when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUserDetails();
    }, [currentUser?.uid])
  );

  // Save user details to Firestore
  const saveUserDetails = async () => {
    if (!currentUser) return;

    try {
      const userDocRef = doc(firestore, "users", currentUser.uid);
      await setDoc(userDocRef, userDetails, { merge: true });

      Alert.alert("Success", "Profile updated successfully");
      setModalVisible(false);
    } catch (error) {
      console.error("Error saving user details:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/LoginScreen");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Open modal and fetch existing details
  const openEditModal = () => {
    fetchUserDetails();
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
      <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Profile</Text>
          <TouchableOpacity onPress={handleLogout}>
            <LogOut color="white" size={22} />
          </TouchableOpacity>
        </View>

        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImageBorder}>
            <Image
              source={require("../assets/images/profile.jpg")}
              style={styles.profileImage}
            />
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderText}>Info</Text>
            <TouchableOpacity onPress={openEditModal}>
              <MoreVertical color="white" size={20} />
            </TouchableOpacity>
          </View>

          {/* Info Items */}
          <View style={styles.infoContainer}>
            <InfoItem
              icon={<User color="white" size={20} />}
              label="Name"
              value={userDetails.name}
              verified
            />
            <InfoItem
              icon={<Cake color="white" size={20} />}
              label="Age"
              value={userDetails.age}
            />
            <InfoItem
              icon={<Mail color="white" size={20} />}
              label="Email"
              value={currentUser?.email || ""}
            />
            <InfoItem
              icon={<Phone color="white" size={20} />}
              label="Contact"
              value={userDetails.contact}
            />
            <InfoItem
              icon={<Globe color="white" size={20} />}
              label="Region"
              value={userDetails.region}
            />
            <InfoItem
              icon={<Calendar color="white" size={20} />}
              label="Account Created"
              value={formatCreationDate(
                currentUser?.metadata.creationTime
                  ? new Date(currentUser.metadata.creationTime).getTime()
                  : undefined
              )}
            />
          </View>
        </View>

        {/* Edit Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Profile</Text>

              <TextInput
                style={styles.input}
                placeholder="Name"
                value={userDetails.name}
                onChangeText={(text) =>
                  setUserDetails({ ...userDetails, name: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Age"
                keyboardType="numeric"
                value={userDetails.age}
                onChangeText={(text) =>
                  setUserDetails({ ...userDetails, age: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Contact Number"
                keyboardType="phone-pad"
                value={userDetails.contact}
                onChangeText={(text) =>
                  setUserDetails({ ...userDetails, contact: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Region"
                value={userDetails.region}
                onChangeText={(text) =>
                  setUserDetails({ ...userDetails, region: text })
                }
              />

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={saveUserDetails}
                >
                  <Save color="white" size={20} />
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};
// Styles for the Profile Component
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "black", // Background color for safe area
  },
  container: {
    flex: 1,
    padding: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerText: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center", // Center text horizontally
    flex: 1, // Allow the text to take up the available space
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileImageBorder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "white",
    padding: 8,
    borderWidth: 2,
    borderColor: "#991B1B", // red-800
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  card: {
    backgroundColor: "#991B1B", // red-800
    borderRadius: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between", // Space between "Info" text and the three-dot icon
    alignItems: "center",
    marginBottom: 16,
  },
  cardHeaderText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center", // Align text to the left (no need to center it now)
    flex: 1, // This ensures that the text takes up only the required space
  },
  infoContainer: {
    gap: 16,
    marginTop: 30,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 15,
  },
  iconContainer: {
    marginRight: 12,
  },
  label: {
    color: "#C1C1C1",
    width: 100,
  },
  valueContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  value: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  verifiedBadge: {
    color: "#60A5FA", // blue-400
    marginLeft: 4,
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
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    marginBottom: 15,
    borderRadius: 10,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flexDirection: "row",
    backgroundColor: "#991B1B",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "45%",
  },
  modalButtonText: {
    color: "white",
    marginLeft: 5,
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 5,
    zIndex:10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7E1919",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Profile;
