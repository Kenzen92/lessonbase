// This file stores data related to the current user
import { createContext, useContext, useState, useEffect } from "react";
import { fetchProfileData } from "../utils/agent";

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [firstName, setFirstName] = useState(null);
  const [lastName, setLastName] = useState(null);
  const [enrollmentDate, setEnrollmentDate] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [classGroups, setClassGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Rewritten setUser function
  const setUser = (userData) => {
    if (!userData) {
      // Handle case where userData might be null or undefined
      console.warn("setUser called with no data");
      // Optionally reset all state here if setting to null means logging out
      // or clear specific fields if appropriate.
      return;
    }

    // Check if each property exists before setting the state
    if (userData.id !== undefined) {
      console.log("setting user id: ", userData.id);
      setUserId(userData.id);
    }
    if (userData.username !== undefined) {
      setUsername(userData.username);
    }
    if (userData.first_name !== undefined) {
      setFirstName(userData.first_name);
    }
    if (userData.last_name !== undefined) {
      setLastName(userData.last_name);
    }
    if (userData.enrollment_date !== undefined) {
      setEnrollmentDate(userData.enrollment_date);
    }
    if (userData.profile_picture !== undefined) {
      setProfilePicture(userData.profile_picture);
    }
    // For arrays, it's still a good practice to use || [] if the key exists but value might be null
    // However, the check `!== undefined` ensures we only try to set it if the key is present.
    if (userData.class_groups !== undefined) {
      // Use the value if present, otherwise default to [] if the value was null/undefined
      setClassGroups(userData.class_groups || []);
    }
    if (userData.subjects !== undefined) {
      // Use the value if present, otherwise default to [] if the value was null/undefined
      setSubjects(userData.subjects || []);
    }

    // Note: The 'students' and 'user_type' fields from your API response
    // are not currently represented in your UserProvider state.
    // If you need them, you would need to add state variables and setters for them
    // and add checks for them here as well.
  };

  useEffect(() => {
    const token = window.sessionStorage.getItem("token");
    // A more robust check than just !id might be needed if the API never returns id.
    // Checking if essential info like username is null might be better.
    // However, keeping !id as per original logic, but be mindful of its limitation if ID is missing.
    if (token && userId === null) {
      // Check if token exists and user ID hasn't been set yet
      fetchProfileData()
        .then((data) => {
          console.log("user data received: ", data); // Log the received data
          setUser(data);
          // Note: State updates from setId, setUsername, etc. are asynchronous.
          // Logging the state variables (id, username, etc.) immediately here
          // might show their *previous* values, not the values just set by setUser.
          // To see the state after update, use React DevTools or another useEffect hook.
        })
        .catch((err) => {
          console.error("Failed to fetch user data", err);
          // Consider what should happen on failure - maybe clear token or set error state
        });
    }
  }, [userId]); // Added 'id' to dependencies. This effect runs on mount, and if 'id' ever changes from null to a value.

  return (
    <UserContext.Provider
      value={{
        userId,
        username,
        firstName,
        lastName,
        enrollmentDate,
        profilePicture,
        classGroups,
        subjects,
        setUser, // Still expose setUser if other parts of the app need to manually set user data
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
