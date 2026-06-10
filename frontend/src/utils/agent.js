import { getToken, clearAuth } from "./tokenStorage";

export const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

// Helper function to ensure URL is properly formatted
const getFullUrl = (url) => {
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
};

// Safely read a response body. Tolerates empty bodies (e.g. a 201/204 with no
// content) and non-JSON payloads without throwing "Unexpected end of JSON input".
const parseBody = async (response) => {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

// Shared core: performs the fetch and normalises the result into a predictable
// envelope `{ ok, status, data, error }`. Never throws on an HTTP error status;
// a network failure resolves to `{ ok: false, status: 0 }`.
const rawRequest = async (url, method, body, navigate) => {
  const auth = getToken();
  const headers = {
    Authorization: `Token ${auth}`,
    "Content-Type": "application/json",
  };

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });
  } catch (error) {
    console.error(`Network error requesting ${url}:`, error.message);
    return { ok: false, status: 0, data: null, error: error.message || "Network error" };
  }

  if (response.status === 401) {
    handleUnauthorizedRequest(navigate);
    return { ok: false, status: 401, data: null, error: "Unauthorized" };
  }

  const data = await parseBody(response);

  if (!response.ok) {
    const error =
      (data && (data.detail || data.message)) ||
      response.statusText ||
      "Request failed";
    return { ok: false, status: response.status, data, error };
  }

  return { ok: true, status: response.status, data, error: null };
};

// Read-style request (back-compat contract): resolves to the parsed body on
// success, `null` on 401/404, and throws on other errors so existing callers'
// try/catch error handling keeps working. Used by all GET wrappers.
export const apiRequest = async (url, method = "GET", body = null, navigate = null) => {
  const result = await rawRequest(url, method, body, navigate);
  if (result.status === 401 || result.status === 404) return null;
  if (!result.ok) {
    const error = new Error(result.error || "Failed to fetch data");
    console.error(`Error fetching data from ${url}:`, error.message);
    throw error;
  }
  return result.data;
};

// Mutation-style request: never throws on an HTTP error and always resolves to
// the `{ ok, status, data, error }` envelope. An empty / non-JSON success body
// (201/204 with no content) resolves to `{ ok: true, data: null }` instead of
// throwing. Callers branch on `result.ok`.
export const apiMutate = async (url, method = "POST", body = null, navigate = null) => {
  return rawRequest(url, method, body, navigate);
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

export const fetchTags = async (query = "", kind = "", navigate) => {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (kind) params.set("kind", kind);
  const qs = params.toString();
  return await apiRequest(getFullUrl(`/tags/${qs ? `?${qs}` : ""}`), "GET", null, navigate);
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
  return await apiMutate(getFullUrl('/assignment/'), "POST", formData, navigate);
};

export const handleUpdateAssignment = async (assignmentId, formData, navigate) => {
  return await apiMutate(getFullUrl(`/assignment/${assignmentId}/`), "PATCH", formData, navigate);
};

export const handleCreateClassEvent = async (eventData, navigate) => {
  return await apiMutate(getFullUrl('/class-event/'), "POST", eventData, navigate);
};

export const handleUpdateClassEvent = async (eventId, eventData, navigate) => {
  return await apiMutate(getFullUrl(`/class-event/${eventId}/`), "PUT", eventData, navigate);
};

export const fetchClassEvents = async (navigate) => {
  return await apiRequest(getFullUrl('/class-event/'), "GET", null, navigate);
}

// Range-scoped, paginated class events for the Luminous dashboard. Resolves to
// the DRF envelope `{ count, next, previous, results }`.
export const fetchClassEventsPaged = async ({ range, limit = 15, offset = 0 }, navigate) => {
  const params = new URLSearchParams({
    range,
    limit: String(limit),
    offset: String(offset),
  });
  return await apiRequest(getFullUrl(`/class-event/?${params.toString()}`), "GET", null, navigate);
};

// A single class event by id — used to resolve dashboard deep-links without
// loading the full list.
export const fetchClassEvent = async (eventId, navigate) => {
  return await apiRequest(getFullUrl(`/class-event/${eventId}/`), "GET", null, navigate);
};

export const fetchClassEventsForStudent = async (studentID, navigate) => {
  return await apiRequest(getFullUrl(`/class-event/student/${studentID}/`), "GET", null, navigate);
};

export const handleCreateClassGroup = async (classGroupData, navigate) => {
  return await apiMutate(getFullUrl('/class-group/'), "POST", classGroupData, navigate);
};

export const handleUpdateClassGroup = async (classGroupData, currentClassId, navigate) => {
  return await apiMutate(getFullUrl(`/class-group/${currentClassId}/`), "PATCH", classGroupData, navigate);
};

export const fetchTeacherStatistics = async (navigate) => {
  return await apiRequest(getFullUrl(`/teacher-statistics/`), "GET", null, navigate);
};

export const fetchStudentStatistics = async (navigate) => {
  return await apiRequest(`${BASE_URL}/student-statistics/`, "GET", null, navigate);
};

export const fetchStorageUsage = async (navigate) => {
  return await apiRequest(getFullUrl(`/resources/storage/`), "GET", null, navigate);
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

export const fetchSubmissionDetails = async (submissionID, navigate) => {
  return await apiRequest(
    `${BASE_URL}/submission/${submissionID}/`,
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
