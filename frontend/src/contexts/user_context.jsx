// This file stores data related to the current user
import { createContext, useContext, useState } from 'react';

export const UserContext = createContext(null);

export function UserProvider({ children }) {
    const [id, setId] = useState(null);
    const [username, setUsername] = useState(null);
    const [firstName, setFirstName] = useState(null);
    const [lastName, setLastName] = useState(null);
    const [enrollmentDate, setEnrollmentDate] = useState(null);
    const [profilePicture, setProfilePicture] = useState(null);
    const [classGroups, setClassGroups] = useState([]);
    const [subjects, setSubjects] = useState([]);

    const setUser = (userData) => {
        setId(userData.id);
        setUsername(userData.username);
        setFirstName(userData.first_name);
        setLastName(userData.last_name);
        setEnrollmentDate(userData.enrollment_date);
        setProfilePicture(userData.profile_picture);
        setClassGroups(userData.class_groups || []);
        setSubjects(userData.subjects || []);
      };

      return (
        <UserContext.Provider
          value={{
            id,
            username,
            firstName,
            lastName,
            enrollmentDate,
            profilePicture,
            classGroups,
            subjects,
            setUser,
          }}
        >
          {children}
        </UserContext.Provider>
      );
    }

export const useUser = () => useContext(UserContext);
