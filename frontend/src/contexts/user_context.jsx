// This file stores data related to the current user
import { createContext, useContext, useState, useEffect } from "react";
import { fetchProfileData } from "../utils/agent";
import { FaCommentsDollar } from "react-icons/fa";

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

  const getUser = async () => {
    // Make a request to the profile endpoint and set the user data that comes back
    fetchProfileData()
      .then((data) => {
        setUser(data);
      })
      .catch((err) => {
        console.error("Failed to fetch user data", err);
        // Consider what should happen on failure - maybe clear token or set error state
      });
  };

  useEffect(() => {
    const token = window.sessionStorage.getItem("token");

    if (token && userId === null) {
      // Check if token exists and user ID hasn't been set yet
      fetchProfileData()
        .then((data) => {
          setUser(data);
        })
        .catch((err) => {
          console.error("Failed to fetch user data", err);
        });
    }
  }, [userId]);

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
        setUser,
        getUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
