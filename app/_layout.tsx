import { Slot, useRouter, useSegments, usePathname } from "expo-router";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/FirebaseConfig";
import { useState } from "react";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    }, (error) => {
      console.error("Auth state change error:", error);
      setIsAuthenticated(false);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (
      // If the user is not signed in and not already on the login page
      !isAuthenticated && 
      !inAuthGroup && 
      pathname !== "/LoginScreen"
    ) {
      // Redirect to login
      router.replace("/LoginScreen");
    } else if (
      // If the user is signed in and on the login page
      isAuthenticated && 
      (pathname === "/LoginScreen" || inAuthGroup)
    ) {
      // Redirect to index
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, pathname, segments, router]);

  // Render nothing until authentication state is determined
  if (isLoading) {
    return null;
  }

  // Render the app
  return <Slot />;
}