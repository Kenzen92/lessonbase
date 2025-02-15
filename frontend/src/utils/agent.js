// agent.js
export const apiRequest = async (url, method = "GET", body = null, navigate) => {
  const auth = window.sessionStorage.getItem("token");
  const headers = {
    Authorization: `Token ${auth}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    if (response.status === 401) {
      handleUnauthorizedRequest(navigate);
      return null;
    }

    if (response.status === 204) {
      return response;
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch data");
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error.message);
    throw error;
  }
};

// Custom function for handling unauthorized requests
export const handleUnauthorizedRequest = (navigate) => {
  // Clear session storage and redirect to login
  window.sessionStorage.clear();
  navigate("/login");
};
export const fetchStudents = async (navigate) => {
  return await apiRequest("http://localhost:8000/students", "GET", null, navigate);
};

export const fetchSubjects = async (navigate) => {
  return await apiRequest("http://localhost:8000/subjects", "GET", null, navigate);
};

export const fetchHomeworks = async (navigate) => {
  return await apiRequest("http://localhost:8000/assignment", "GET", null, navigate);
};

export const handleCreateAssignment = async (formData, navigate) => {
  return await apiRequest("http://localhost:8000/assignment/", "POST", formData, navigate);
};

export const fetchClassEvents = async (navigate) => {
  return await apiRequest("http://localhost:8000/class-event", "GET", null, navigate);
}

export const handleCreateClassGroup = async (classGroupData, navigate) => {
  return await apiRequest("http://localhost:8000/class-group/", "POST", classGroupData, navigate);
};

export const fetchStatistics = async (navigate) => {
  return await apiRequest("http://localhost:8000/teacher-statistics", "GET", null, navigate);
};  

export const cancelClassEvent = async (eventID, navigate) => {
  return await apiRequest(`http://localhost:8000/class-event/${eventID}/`, "DELETE", null, navigate);
}

export const createChat = async (studentID, navigate) => {
  return await apiRequest("http://localhost:8000/chats/", "POST", { participants: [studentID] }, navigate);
};

export const fetchClassGroups = async (navigate) => {
  return await apiRequest("http://localhost:8000/class-group", "GET", null, navigate);
};