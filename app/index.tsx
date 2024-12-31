import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { styles } from "./styles";
import { useRouter } from "expo-router";
import { TaskCard } from "./taskcard";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/FirebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface TaskCardProps {
  title: string;
  count: number;
}

interface ProjectCardProps {
  id?: string;
  title: string;
  details: string;
  priority: "High" | "Medium" | "Low";
  progress: number;
  dueDate: string;
  assignedBy: string;
  teamMembers?: string[];
  rawDueDate: Date; // Add this to help with sorting
  isImportant?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  id,
  title,
  details,
  priority,
  progress,
  dueDate,
  assignedBy,
  teamMembers = [],
  isImportant,
  rawDueDate
}) => {
  const router = useRouter();
  const today = new Date();
  const isOverdue = rawDueDate < today;

  // Determine card style based on overdue status, importance, and priority
  const cardStyles = [
    styles.projectCard,
    isOverdue && styles.overdueProjectCard, // Add overdue style
    !isOverdue && isImportant && styles.importantProjectCard,
    !isOverdue && (
      priority === "High"
        ? styles.highPriority
        : priority === "Medium"
        ? styles.mediumPriority
        : priority === "Low"
        ? styles.lowPriority
        : null
    )
  ];

  const priorityContainerStyles = [
    styles.priorityContainer,
    isOverdue && styles.overdueProjectPriorityContainer, // Add overdue priority container style
    !isOverdue && (
      priority === "High"
        ? styles.highPriorityContainer
        : priority === "Medium"
        ? styles.mediumPriorityContainer
        : styles.lowPriorityContainer
    )
  ];

  return (
    <TouchableOpacity
      style={cardStyles}
      onPress={() =>
        router.push({
          pathname: "/ongoingtask",
          params: {
            id: id, 
            title,
            details,
            priority,
            progress,
            dueDate,
            assignedBy,
            teamMembers: JSON.stringify(teamMembers),
            isImportant: isImportant ? "true" : "false",
            isOverdue: isOverdue ? "true" : "false",
            notes: "Lorem ipsum testing testing testing",
          },
        })
      }
      >{isImportant && (
        <View style={styles.importantBadge}>
          <Text style={styles.importantBadgeText}>Important</Text>
        </View>
      )}
      <View>
        <View style={priorityContainerStyles}>
          <Text style={styles.priorityTag}>
            {isOverdue ? "Overdue" : priority}
          </Text>
        </View>

        <Text style={styles.projectTitle}>{title}</Text>
        <Text style={[
          styles.dateText, 
          isOverdue && styles.overdueDateText
        ]}>
          Due Date: {dueDate}
        </Text>

        <View style={styles.assignedByContainer}>
          <Text style={styles.assignedByText}>Assigned by: {assignedBy}</Text>
          {teamMembers.length > 0 && (
            <View style={styles.teamMembersInlineContainer}>
              {teamMembers.map((member, index) => (
                <View key={index} style={styles.teamMemberCircle}>
                  <Text style={styles.teamMemberText}>
                    {member}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
      <Text style={[
        styles.progressText,
        isOverdue && styles.overdueProgressText
      ]}>
        {progress}%
      </Text>
    </TouchableOpacity>
  );
};

export default function Index() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskCardProps[]>([]);
  const [projects, setProjects] = useState<ProjectCardProps[]>([]);
  const [completedProjects, setCompletedProjects] = useState<ProjectCardProps[]>([]);
  const [userName, setUserName] = useState<string>("User");
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchData = async (currentUser) => {
    if (!currentUser) {
      setIsInitialLoading(false);
      return { tasks: [], projects: [], userName: "User" };
    }
  
    try {
      // Concurrent data fetching
      const [tasksSnapshot, projectsSnapshot] = await Promise.all([
        getDocs(query(collection(db, "DailyTasks"))),
        getDocs(query(collection(db, "projects"))),
      ]);
  
      // Process tasks and sort by createdAt field
      const fetchedTasks: TaskCardProps[] = [];
      tasksSnapshot.forEach((doc) => {
        const taskData = doc.data();
        if (taskData.name) {
          fetchedTasks.push({
            title: taskData.name,
            count: (taskData.count || 0),
            createdAt: taskData.createdAt.toDate(), // Assuming createdAt is a Firestore Timestamp field
          });
        }
      });
  
      // Sort tasks by createdAt field (latest first)
      const sortedTasks = fetchedTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
      // Process projects
      // In the fetchData function within the existing code, modify the projects fetching part:

// Modify the project processing in the fetchedProjects mapping
const fetchedProjects: ProjectCardProps[] = await Promise.all(
  projectsSnapshot.docs.map(async (docSnapshot) => {
    const projectData = docSnapshot.data();
    const rawDueDate = projectData.dueDate.toDate();
    const dueDate = rawDueDate.toLocaleDateString();
    const today = new Date();
    const daysDiff =
      (rawDueDate.getTime() - today.getTime()) / (1000 * 3600 * 24);

    // Determine priority based on due date and important flag
    let priority: "High" | "Medium" | "Low";
    if (projectData.isImportant) {
      priority = "High"; // Important projects are always high priority
    } else {
      priority = daysDiff <= 7 ? "High" : daysDiff <= 30 ? "Medium" : "Low";
    }

    let assignedBy = currentUser?.email?.split("@")[0] || "Unknown";

    try {
      if (projectData.createdBy) {
        const userDocRef = doc(db, "users", projectData.createdBy);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          assignedBy =
            userDoc.data().displayName ||
            userDoc.data().name ||
            userDoc.data().email?.split("@")[0] ||
            "Unknown";
        }
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }

    // Calculate progress from subtasks stored in project document
    let progressPercentage = 0;
    const subtasks = projectData.subtasks || [];
    if (subtasks.length > 0) {
      const completedSubtasks = subtasks.filter(task => task.completed).length;
      progressPercentage = Math.round((completedSubtasks / subtasks.length) * 100);
    }

    return {
      id: docSnapshot.id, // Add document ID
      title: projectData.title,
      details: projectData.details || "No details available",
      priority,
      progress: progressPercentage,
      dueDate,
      rawDueDate,
      assignedBy,
      teamMembers: projectData.assignedTo ? [projectData.assignedTo] : [],
      isImportant: projectData.isImportant || false,
    };
  })
);
  
      // Sort projects with custom sorting logic
      const sortedProjects = fetchedProjects.sort((a, b) => {
        // Define priority order
        const priorityOrder = { 
          "Important": 4, 
          "High": 3, 
          "Medium": 2, 
          "Low": 1 
        };  
        // First, sort by importance and priority
      if (b.isImportant !== a.isImportant) {
        return (b.isImportant ? 1 : 0) - (a.isImportant ? 1 : 0);
      }

      // If importance is the same, sort by priority
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }

      // If priorities are the same, sort by due date (latest first)
      return a.rawDueDate.getTime() - b.rawDueDate.getTime();
    });
  
      const emailLocalPart = currentUser.email?.split("@")[0] || "";
      const displayName =
        emailLocalPart
          .split(/[\.\s]+/)
          .slice(0, 3)
          .join(" ") || "User";
  
      return {
        tasks: sortedTasks,
        projects: sortedProjects,
        userName: displayName,
      };
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Refresh Failed", "Unable to load data. Please try again.");
      return { tasks: [], projects: [], userName: "User" };
    }
  };
  

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        console.log(
          "Auth State Changed:",
          currentUser ? "User logged in" : "No user"
        );
  
        setUser(currentUser);
  
        if (currentUser) {
          try {
            const { tasks, projects, userName } = await fetchData(currentUser);
  
            // Separate completed and ongoing projects
            const ongoingProjects = projects.filter(project => project.progress < 100);
            const doneProjects = projects.filter(project => project.progress === 100);
  
            console.log("Fetched Tasks:", tasks);
            console.log("Fetched Projects:", projects);
  
            setTasks(tasks);
            setProjects(ongoingProjects); // Only ongoing projects
            setCompletedProjects(doneProjects);
            setUserName(userName);
          } catch (error) {
            console.error("Data Fetch Error:", error);
            Alert.alert("Error", "Failed to load user data");
          } finally {
            setIsInitialLoading(false);
          }
        } else {
          setIsInitialLoading(false);
        }
      },
      (error) => {
        console.error("Auth State Change Error:", error);
        setIsInitialLoading(false);
      }
    );
  
    return () => unsubscribe();
  }, []);
  

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      if (user) {
        const { tasks, projects, userName } = await fetchData(user);
        
        // Separate completed and ongoing projects
        const ongoingProjects = projects.filter(project => project.progress < 100);
        const doneProjects = projects.filter(project => project.progress === 100);

        setTasks(tasks);
        setProjects(ongoingProjects);
        setCompletedProjects(doneProjects);
        setUserName(userName);
      }
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  if (isInitialLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {/* Header Section (Static) */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi,</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <View style={styles.profileIcon}>
          <TouchableOpacity onPress={() => router.push("/profile")}>
            <Image
              source={require("../assets/images/profile.jpg")}
              style={styles.profileIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/notifications")}>
            <View style={styles.bellIconContainer}>
              <MaterialCommunityIcons
                name="chat"
                size={30}
                color="#FFFFFF"
                style={styles.bellIcon}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <View style={styles.scrollContainer}>
        {/* Daily Tasks Section (Horizontal Scroll) */}
        <Text style={styles.sectionTitle}>Your Daily Task</Text>
        <View style={styles.fixedHeightContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tasksScrollView}
          >
            {tasks.map((task, index) => (
              <TaskCard key={index} title={task.title} count={task.count} />
            ))}
          </ScrollView>
        </View>

        {/* Ongoing Projects Section (Vertical Scroll) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ongoing Project</Text>
          <TouchableOpacity onPress={() => router.push("/calendar")}>
            <Text style={styles.seeAll}>See Calendar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.projectsScrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#FF4444"]} // Customize the loading indicator color
              tintColor={"#FF4444"} // iOS loading indicator color
            />
          }
        >
          {projects.map((project, index) => (
            <ProjectCard key={index} {...project} />
          ))}
          {/* Done Projects Section */}
        {completedProjects.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Completed Projects</Text>
            </View>

            <ScrollView
              style={styles.projectsScrollView}
              showsVerticalScrollIndicator={false}
            >
              {completedProjects.map((project, index) => (
                <ProjectCard key={index} {...project} />
              ))}
            </ScrollView>
          </>
        )}
        </ScrollView>

        
      </View>
      
      

      {/* Floating Action Button (Static) */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push("/add")}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
