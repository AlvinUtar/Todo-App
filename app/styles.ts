// styles.ts
import { Italic } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  scrollContainer: {
    flex: 1,
    padding: 15,
  },
  fixedHeightContainer: {
    height: 160, // Adjust height to match the size of your task cards // Space between daily tasks and ongoing projects
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Align items in the header horizontally
    marginBottom: 30,
    marginTop: 40,
  },
  greeting: {
    fontSize: 20,
    color: '#FFFFFF',
    opacity: 0.7,
    left:15,
    top:10,
    marginBottom: 5,
  },
  userName: {
    fontSize: 50,
    left:15,
    top:10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileIconContainer: {
  flexDirection: 'row', // Align profile icon and name horizontally
  alignItems: 'center',
  justifyContent: 'flex-start', // Align profile icon to the left for Daily Tasks
},
  profileIcon: {
    width: 50,
    height: 50,
    top:3,
    right:10,
    borderRadius: 50,
    marginBottom: 15, // Adjusted space between profile pic and user name
  },
  bellIconContainer: {
    position: 'absolute', 
    top: 35,
    right:10,
    backgroundColor: '#8C1A11', // Color same as the daily task background
    width: 50,  // Same size as profile icon
    height: 50, // Same size as profile icon
    borderRadius: 50, // Circular shape
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    color: '#FFFFFF', // White icon color
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
    marginTop: 15,
  },
  tasksScrollView: {
    marginBottom: 10,
  },
  projectsScrollView: {
    marginBottom: 20, // space between Ongoing Projects and the floating button
  },
  taskCard: {
    width: 140,
    height: 140,
    borderRadius: 15,
    backgroundColor: '#6082B6',
    padding: 15,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskIcon: {
    width: 50, // Adjust size as needed
    height: 50, // Adjust size as needed
    marginBottom: 8, // Adds spacing between icon and text
  },
  taskTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 8,
  },
  taskCount: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAll: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: 14,
  },
  projectCard: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  highPriority: {
    backgroundColor: '#8C1A11',
  },
  mediumPriority: {
    backgroundColor: '#D39C27',
  },
  lowPriority: {
    backgroundColor: '#9ACEAA', // Distinct background color for Low priority
  },
  priorityContainer: {
    alignSelf: "flex-start", // Ensures the container size adjusts to the text
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  highPriorityContainer: {
    backgroundColor: "#FF4444", // Example high-priority background color
  },
  mediumPriorityContainer: {
    backgroundColor: "#FFC107", // Example medium-priority background color
  },
  lowPriorityContainer: {
    backgroundColor: "#33A877", // Example container color for Low priority
  },
  priorityTag: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  projectTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 15,
  },
  timeText: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: 12,
    marginBottom: 5,
  },
  dateText: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: 12,
    marginBottom: 15,
  },
  assignedByText: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: 14,
    marginBottom: 10, // Adds spacing before team members
  },
  progressText: {
    position: 'absolute',
    right: 20,
    top: 50,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  teamMembersContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align the avatars to the right
    marginTop: 10,
  },
  teamMember: {
    width: 40,
    height: 40,
    borderRadius: 105,
    backgroundColor: '#FFFFFF',
    marginLeft: -10, // Negative margin to reduce the space between the avatars
    borderWidth: 2,
    borderColor: '#461111',
  },
  assignedByContainer: {
    flexDirection: 'row', // Align the "Assigned by" text and team members horizontally
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10, // Adds spacing between the text and team members
  },
  teamMembersInlineContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Center the container horizontally
    alignItems: 'center',     // Center the items vertically
  },
  teamMemberCircle: {
    width: 40,
    height: 40,
    borderRadius: 20, // Makes it a perfect circle
    backgroundColor: 'rgba(255,255,255,0.2)', // Translucent background
    justifyContent: 'center', // Center text vertically
    alignItems: 'center',      // Center text horizontally
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  teamMemberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  fab: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff4d4d',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    fontSize: 38,
    color: '#FFFFFF',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  refreshButtonText: {
    marginLeft: 10,
    fontWeight: 'bold',
  },
  noProjectsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noProjectsText: {
    fontSize: 16,
    color: '#888',
  },
  importantProjectCard: {
    borderColor: '#FF4444',
    borderWidth: 2,
  },
  importantBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  importantBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
  overdueProjectCard: {
    backgroundColor: '#E0E0E0', // Slightly darker grey for full card
    opacity: 0.7, // Slightly adjusted opacity
  },
  overdueProjectPriorityContainer: {
    backgroundColor: '#A0A0A0', // Grey priority container
  },
  overdueBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  overdueBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  overdueDateText: {
    color: '#666666', // Muted text color
    textDecorationLine: 'line-through', // Strike-through effect
  },
  overdueProgressText: {
    color: '#666666', // Muted text color
  },
  completedProjectCard: {
    opacity: 0.5, // Make completed projects look slightly faded
    backgroundColor: '#333333', // Darker background to distinguish
  },
  completedProgressText: {
    color: '#00FF00', // Green color to signify completion
  },
});
