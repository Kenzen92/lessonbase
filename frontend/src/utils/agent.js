import { getToken, clearAuth } from "./tokenStorage";

export const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

// Helper function to ensure URL is properly formatted
const getFullUrl = (url) => {
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
};

export const apiRequest = async (url, method = "GET", body = null, navigate=null) => {
  const auth = getToken();
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
      return await response.json();
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
  // Clear persisted auth and redirect to login
  clearAuth();
  navigate("/login");
};
export const fetchStudents = async (navigate) => {
  return await apiRequest(getFullUrl('/student/'), "GET", null, navigate);
};

export const fetchSubjects = async (navigate) => {
  return await apiRequest(getFullUrl('/subjects/'), "GET", null, navigate);
};

export const fetchAllSubjects = async (navigate) => {
  return await apiRequest(getFullUrl('/subjects/all/'), "GET", null, navigate);
};

export const fetchAllAssignments = async (navigate) => {
  return await apiRequest(getFullUrl('/assignment/'), "GET", null, navigate);
};

export const fetchAssignment = async (assignment_id, navigate) => {
    return await apiRequest(getFullUrl(`/assignment/${assignment_id}/`), "GET", null, navigate);
}

export const handleCreateAssignment = async (formData, navigate) => {
  return await apiRequest(getFullUrl('/assignment/'), "POST", formData, navigate);
};

export const fetchClassEvents = async (navigate) => {
  return await apiRequest(getFullUrl('/class-event/'), "GET", null, navigate);
}

export const fetchClassEventsForStudent = async (studentID, navigate) => {
  return await apiRequest(getFullUrl(`/class-event/student/${studentID}/`), "GET", null, navigate);
};

export const handleCreateClassGroup = async (classGroupData, navigate) => {
  return await apiRequest(getFullUrl('/class-group/'), "POST", classGroupData, navigate);
};

export const handleUpdateClassGroup = async (classGroupData, currentClassId, navigate) => {
  return await apiRequest(getFullUrl(`/class-group/${currentClassId}/`), "PATCH", classGroupData, navigate);
};

export const fetchTeacherStatistics = async (navigate) => {
  return await apiRequest(getFullUrl(`/teacher-statistics/`), "GET", null, navigate);
};

export const fetchStudentStatistics = async (navigate) => {
  return await apiRequest(`${BASE_URL}/student-statistics/`, "GET", null, navigate);
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
  return await apiRequest(`${BASE_URL}/class-group/`, "GET", null, navigate);
};

export const editClassGroup = async (id, groupData, navigate) => {
  return await apiRequest(`${BASE_URL}/class-group/${id}/`, "PATCH", groupData, navigate);
};

export const fetchClassGroup = async (groupId, navigate) => {
  return await apiRequest(`${BASE_URL}/class-group/${groupId}/`, "GET", null, navigate);
}

export const editTeacherProfile = async (id, profileData, navigate) => {
  return await apiRequest(`${BASE_URL}/teacher/${id}/`, "PATCH", profileData, navigate);
};

export const fetchProfileData = async (navigate) => {
  return await apiRequest(`${BASE_URL}/profile/`, "GET", null, navigate);
};

export const submitSessionFeedback = async (classEventId, rating, comment, navigate) => {
  return await apiRequest(
    getFullUrl("/session-feedback/"),
    "POST",
    { class_event: classEventId, rating, comment: comment || "" },
    navigate,
  );
};

export const fetchSessionFeedbackAggregate = async (classEventId, navigate) => {
  return await apiRequest(
    getFullUrl(`/session-feedback/${classEventId}/aggregate/`),
    "GET",
    null,
    navigate,
  );
};

export const fetchStudentProfile = async (id, navigate) => {
  return await apiRequest(`${BASE_URL}/student/${id}/`, "GET", null, navigate);
};

export const handleDeleteStudent = async (id, navigate) => {
  return await apiRequest(`${BASE_URL}/student/${id}/`, "DELETE", null, navigate);
};

export const fetchSubmission = async (assignmentID, studentID, navigate) => {
  return await apiRequest(
    `${BASE_URL}/submission/by-assignment/${assignmentID}/student/${studentID}/`,
    "GET",
    null,
    navigate
  );
};

export const fetchAssignmentSubmissions = async (assignmentID, navigate) => {
  return await apiRequest(
    `${BASE_URL}/assignment/${assignmentID}/submissions/`,
    "GET",
    null,
    navigate
  );
};

export const fetchFeedback = async (submissionID, navigate) => {
  return await apiRequest(
    `${BASE_URL}/submission/${submissionID}/feedback/`,
    "GET",
    null,
    navigate
  );
};

export const fetchCurrentUser = async () => {
  return await apiRequest(`${BASE_URL}/auth/user/`, "GET");
};

export const fetchResources = async (params = {}, navigate) => {
  const query = new URLSearchParams(params).toString();
  return await apiRequest(`${BASE_URL}/resources/${query ? "?" + query : ""}`, "GET", null, navigate);
};

export const fetchSharedResources = async (navigate) => {
  return await apiRequest(`${BASE_URL}/resources/shared/`, "GET", null, navigate);
};
