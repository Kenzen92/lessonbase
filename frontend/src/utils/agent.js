// agent.js
export const fetchStudents = async (navigate) => {
    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch("http://localhost:8000/students", {
        method: "GET",
        headers: {
          Authorization: `Token ${auth}`,
          "Content-Type": "application/json",
        },
      });
  
      if (response.status === 401) {
        handleUnauthorizedRequest(navigate); // Custom handler for unauthorized requests
        return null;
      }
  
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }
  
      return await response.json();
    } catch (error) {
      console.error("Error fetching students:", error.message);
      throw error;
    }
  };
  
  export const fetchSubjects = async (navigate) => {
    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch("http://localhost:8000/subjects", {
        method: "GET",
        headers: {
          Authorization: `Token ${auth}`,
          "Content-Type": "application/json",
        },
      });
  
      if (response.status === 401) {
        handleUnauthorizedRequest(navigate);
        return null;
      }
  
      if (!response.ok) {
        throw new Error("Failed to fetch subjects");
      }
  
      return await response.json();
    } catch (error) {
      console.error("Error fetching subjects:", error.message);
      throw error;
    }
  };

  export const fetchHomeworks = async () => {
    try {
      const auth = window.sessionStorage.getItem("token");
      const response = await fetch("http://localhost:8000/assignment ", {
        method: "GET",
        headers: {
          Authorization: `Token ${auth}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        handleUnauthorizedRequest(navigate);
      }

      if (!response.ok) {
        throw new Error("Failed to fetch subjects");
      }
  
      return await response.json();
    } catch (error) {
      console.error("Error fetching homeworks:", error.message);
      throw error;
    }
  };

 
export const handleCreateAssignment = async (formData) => {
  const auth = window.sessionStorage.getItem("token");
  try {
    const response = await fetch("http://localhost:8000/assignment/", {
      method: "POST",
      headers: {
        Authorization: `Token ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.detail || "Failed to create assignment" };
    }

    return { success: true, message: "Assignment created successfully!" };
  } catch (error) {
    return { success: false, message: error.message || "An error occurred" };
  }
};
  
  // Custom function for handling unauthorized requests
  export const handleUnauthorizedRequest = (navigate) => {
    // Clear session storage and redirect to login
    window.sessionStorage.clear();
    navigate("/login");
  };
  