export const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

// Helper function to ensure URL is properly formatted
const getFullUrl = (url) => {
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
};

export const apiRequest = async (url, method = "GET", body = null, navigate=null) => {
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

    if (response.status === 201) {
      return response;
    }

    if (response.status == 404) {
      return null;
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
  return await apiRequest(getFullUrl('/student'), "GET", null, navigate);
};

export const fetchSubjects = async (navigate) => {
  return await apiRequest(getFullUrl('/subjects'), "GET", null, navigate);
};

export const fetchAllSubjects = async (navigate) => {
  return await apiRequest(getFullUrl('/subjects/all'), "GET", null, navigate);
};

export const fetchAllAssignments = async (navigate) => {
  return await apiRequest(getFullUrl('/assignment'), "GET", null, navigate);
};

export const fetchAssignment = async (assignment_id, navigate) => {
    return await apiRequest(getFullUrl(`/assignment/${assignment_id}`), "GET", null, navigate);
}

export const handleCreateAssignment = async (formData, navigate) => {
  return await apiRequest(getFullUrl('/assignment/'), "POST", formData, navigate);
};

export const fetchClassEvents = async (navigate) => {
  return await apiRequest(getFullUrl('/class-event'), "GET", null, navigate);
}

export const fetchClassEventsForStudent = async (studentID, navigate) => {
  return await apiRequest(getFullUrl(`/class-event/student/${studentID}`), "GET", null, navigate);
};

export const handleCreateClassGroup = async (classGroupData, navigate) => {
  return await apiRequest(getFullUrl('/class-group/'), "POST", classGroupData, navigate);
};

export const handleUpdateClassGroup = async (classGroupData, currentClassId, navigate) => {
  return await apiRequest(getFullUrl(`/class-group/${currentClassId}/`), "PATCH", classGroupData, navigate);
};

export const fetchTeacherStatistics = async (navigate) => {
  return await apiRequest(getFullUrl(`/teacher-statistics`), "GET", null, navigate);
};  

export const fetchStudentStatistics = async (navigate) => {
  return await apiRequest(`${BASE_URL}/student-statistics`, "GET", null, navigate);
};  

export const cancelClassEvent = async (eventID, navigate) => {
  return await apiRequest(`${BASE_URL}/class-event/${eventID}/`, "DELETE", null, navigate);
}

export const createChat = async (studentID, navigate) => {
  return await apiRequest(`${BASE_URL}/chats/`, "POST", { participants: [studentID] }, navigate);
};

export const fetchChats = async (navigate) => {
  return await apiRequest(`${BASE_URL}/chats/`, "GET", null, navigate);
};

export const fetchClassGroups = async (navigate) => {
  return await apiRequest(`${BASE_URL}/class-group`, "GET", null, navigate);
};

export const editClassGroup = async (id, groupData, navigate) => {
  return await apiRequest(`${BASE_URL}/class-group/${id}/`, "PATCH", groupData, navigate);
};

export const fetchClassGroup = async (groupId, navigate) => {
  return await apiRequest(`${BASE_URL}/class-group/${groupId}`, "GET", null, navigate);
}

export const editTeacherProfile = async (id, profileData, navigate) => {
  return await apiRequest(`${BASE_URL}/teacher/${id}/`, "PATCH", profileData, navigate);
};

export const fetchProfileData = async (navigate) => {
  return await apiRequest(`${BASE_URL}/profile`, "GET", null, navigate);
};

export const fetchStudentProfile = async (id, navigate) => {
  return await apiRequest(`${BASE_URL}/student/${id}`, "GET", null, navigate);
};

export const handleDeleteStudent = async (id, navigate) => {
  return await apiRequest(`${BASE_URL}/student/${id}/`, "DELETE", null, navigate);
};

export const fetchAssignmentAttempt = async (assignmentID, studentID, navigate) => {
  return await apiRequest(
    `${BASE_URL}/assignment-attempt/${assignmentID}/students/${studentID}/attempt`, "GET", null, navigate);
};

export const submitAssignmentAttempt = async(data, navigate) => {
  return await apiRequest(`${BASE_URL}/assignment-attempt/`, "POST", data, navigate)
}

export const handleDeleteClassFile = async(deleteBody, navigate) => {
  return await apiRequest(`${BASE_URL}/class_material`, "DELETE", deleteBody, navigate)
}

export const handleDeleteAssignmentFile = async(deleteBody, navigate) => {
  return await apiRequest(`${BASE_URL}/assignment_material`, "DELETE", deleteBody, navigate)
}

export const handleSubmitAssignmentFiles = async(imageFiles, navigate) => {
  return await apiRequest(`${BASE_URL}/assignment_material`, "POST", imageFiles, navigate)
}

export const fetchCurrentUser = async() => {
  const response = await apiRequest(`${BASE_URL}/auth/user`, "GET")
  return response
}

export const handleSubmitAssignmentFeedback = async(feedbackData, navigate) => {
  const response = await apiRequest(`${BASE_URL}/feedback`, "POST", feedbackData, navigate)
}
export const fetchFeedback = async (assignment_attempt_id) => {
  return await apiRequest(`${BASE_URL}/feedback?assignment_attempt_id=${assignment_attempt_id}`)
}
