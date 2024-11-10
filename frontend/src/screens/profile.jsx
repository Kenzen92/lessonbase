// Login.js
import React, { useState, useEffect } from "react";
import Navigation from "../components/main_navigation";
import Select from "react-select";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import { Box, FormControl, FormGroup, FormLabel, Input, Tooltip, Typography, Button } from "@mui/material";

function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [userProfileURL, setProfileURL] = useState(null);
  const [userName, setName] = useState(null);
  const navigate = useNavigate();

  const loadUserData = () => {
    const userData = window.sessionStorage.getItem("user");

    if (userData) {
      // Parse the JSON string to get the JavaScript object
      const user = JSON.parse(userData);
      setName(user.first_name);
      setProfileURL(user.profile_picture);
    }
  };

  const handleAvatarClick = () => {
    navigate("/profile");
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  // Define fetchClassEvents function
  const fetchProfileData = async () => {
    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch("http://localhost:8000/profile", {
        method: "GET",
        headers: {
          Authorization: `Token ${auth}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status == 401) {
        handleUnautherizedRequest(navigate);
      }

      if (!response.ok) {
        throw new Error("Failed to fetch class events");
      }

      const data = await response.json();
      let profile_subjects = data["subjects"];
      let profile_subjects_for_list = [];
      for (let subject of profile_subjects) {
        const subject_option = { value: subject.id, label: subject.name };
        profile_subjects_for_list.push(subject_option);
      }
      console.log(profile_subjects_for_list);
      await setSelectedSubjects(profile_subjects_for_list);
      console.log(selectedSubjects);
      setProfileData(data);
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchSubjects = async () => {
    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch("http://localhost:8000/subjects/all", {
        method: "GET",
        headers: {
          Authorization: `Token ${auth}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch subjects");
      }

      const data = await response.json();
      let subject_options = [];
      for (let subject of data) {
        const subject_option = { value: subject.id, label: subject.name };
        subject_options.push(subject_option);
      }
      setSubjects(subject_options);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchProfileData();
    fetchSubjects();
    loadUserData();
    loadUserData();
    // Add a storage event listener
    const handleStorageChange = () => {
      console.log("Storage event detected");
      loadUserData();
    };

    window.addEventListener("storage", handleStorageChange);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleReloadData = () => {
    // Call  to fetch updated data
    fetchProfileData();
  };

  // Function to handle changes in form fields
  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
  };

  const handleFileChange = (event) => {
    setProfilePicture(event.target.files[0]);
  };

  // Function to handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    const url = "http://localhost:8000/profile/";
    // Create a FormData object to handle file upload
    const formData = new FormData();
    formData.append("username", profileData.username);
    formData.append("first_name", profileData.first_name);
    formData.append("last_name", profileData.last_name);
    formData.append("email", profileData.email);
    if (profilePicture) {
      formData.append("profile_picture", profilePicture);
    }
    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Token ${auth}`,
        },
        body: formData,
      });

      if (!response.ok) {
        console.error("Network response was not ok.");
        return;
      }
      const data = await response.json();
      const newURL = data["profile_picture"];

      let userData = await JSON.parse(window.sessionStorage.getItem("user"));

      if (!userData) {
        console.error("No user data found in session storage.");
        return;
      }
      if (newURL) userData["profile_picture"] = newURL;

      await window.sessionStorage.setItem("user", JSON.stringify(userData));
      console.log("User data updated in session storage.");
    } catch (error) {
      console.error("Error:", error.message);
    }

    const subject_url = "http://localhost:8000/subjects/";
    const subject_data = selectedSubjects.map((entry) => entry.value);
    const data_to_send = { subjects: subject_data };
    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch(subject_url, {
        method: "POST",
        headers: {
          Authorization: `Token ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data_to_send),
      });

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.log("Error: " + error.message);
    }

    handleReloadData();
    toast.success("Profile data updated");
    navigate("/dashboard");
  };

  return (
    <>
      <Navigation />
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>

        <Box sx={{ marginLeft: 'auto', marginRight: 'auto', flex: 1, justifyItems: 'center' }}>
          <Avatar
            alt={userName}
            src={userProfileURL}
            className="profile-icon"
            onClick={handleAvatarClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {userName ? userName[0] : null}
          </Avatar>
          <Tooltip >
            <Typography sx={{}}>{userName}</Typography>
          </Tooltip>
        </Box>
        <Typography variant={'h5'}>Your Profile</Typography>
        {profileData ? (
            <form className="profile-form" onSubmit={handleSubmit}>
              <Box sx={{ maxWidth: '40rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '40rem' }}>
              <FormControl fullWidth>
                <FormLabel htmlFor="username" sx={{ color: 'white', marginTop: '2rem' }}>Username</FormLabel>
                <Input
                  type="text"
                  id="username"
                  name="username"
                  value={profileData["username"]}
                  onChange={handleChange}
                  sx={{ color: 'white' }}
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="subjects" sx={{ color: 'white' }}>Subjects:</FormLabel>
                <Select
                  id="subjects"
                  defaultValue={selectedSubjects}
                  onChange={setSelectedSubjects}
                  options={subjects}
                  isMulti={true}
                  fullWidth={true}
                  styles={{
                    menu: (provided) => ({
                      ...provided,
                      backgroundColor: "#333", // Change menu background color
                    }),

                    option: (provided) => ({
                      ...provided,
                      color: "#ccc", // Change option font color
                    }),
                  }}
                />
              </FormControl>
              
              <FormControl>
              <FormLabel htmlFor="first_name"  sx={{ color: 'white' }}>First Name:</FormLabel>
              <Input
                type="text"
                id="first_name"
                name="first_name"
                fullWidth={true}
                value={profileData["first_name"]}
                onChange={handleChange}
                sx={{ color: 'white' }}
              />
              </FormControl>

              <FormControl>
              <FormLabel htmlFor="last_name" sx={{ color: 'white' }}>Last Name:</FormLabel>
              <Input
                type="text"
                id="last_name"
                name="last_name"
                fullWidth={true}
                value={profileData["last_name"]}
                onChange={handleChange}
                sx={{ color: 'white' }}
              />
              </FormControl>

              <FormControl> 
                <FormLabel htmlFor="email" sx={{ color: 'white' }}>Email:</FormLabel>
              <Input
                type="email"
                id="email"
                name="email"
                value={profileData["email"]}
                onChange={handleChange}
                sx={{ color: 'white' }}
              />
              </FormControl>

              <FormControl>
              <FormLabel htmlFor="profile_picture" sx={{ color: 'white' }}>Profile Picture:</FormLabel>
              <Input
                type="file"
                id="profile_picture"
                name="profile_picture"
                accept="image/*"
                sx={{ color: 'white' }}
                onChange={handleFileChange}
              />
              </FormControl>

              <Button className="submit-button" type="submit">
                Submit
              </Button>
              </Box>
            </form>
        ) : (
          <div>
            <p>Loading...</p>
          </div>
        )}

      </Box>
    </>
  );
}

export default Profile;
