const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

/**
 * Register a new user with email and password
 * @param {Object} data - Registration data
 * @param {string} data.email - User email
 * @param {string} data.password - User password
 * @param {string} data.password_confirm - Password confirmation
 * @param {string} data.user_type - User type ('student' or 'teacher')
 * @param {string} data.first_name - Optional first name
 * @param {string} data.last_name - Optional last name
 */
export const registerUser = async (data) => {
  const response = await fetch(`${BASE_URL}/auth/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.email?.[0] || result.password?.[0] || 'Registration failed');
  }

  return result;
};

/**
 * Login with email and password
 * @param {Object} credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 */
export const loginUser = async (credentials) => {
  const response = await fetch(`${BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.non_field_errors?.[0] || 'Login failed');
  }

  return result;
};

/**
 * Login/Register with Google OAuth
 * @param {string} credentialOrToken - Google JWT credential or access token
 * @param {string} userType - User type ('student' or 'teacher') - only needed for new signups
 */
export const googleAuth = async (credentialOrToken, userType = 'student') => {
  const response = await fetch(`${BASE_URL}/auth/google/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      credential: credentialOrToken,
      user_type: userType,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Google authentication failed');
  }

  return result;
};

/**
 * Logout current user
 * @param {string} token - Auth token
 */
export const logoutUser = async (token) => {
  const response = await fetch(`${BASE_URL}/auth/logout/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || 'Logout failed');
  }

  return { message: 'Successfully logged out' };
};

/**
 * Get current user information
 * @param {string} token - Auth token
 */
export const getCurrentUser = async (token) => {
  const response = await fetch(`${BASE_URL}/auth/user/`, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch user data');
  }

  return result;
};

/**
 * Verify email with confirmation key
 * @param {string} key - Email confirmation key
 */
export const verifyEmail = async (key) => {
  const response = await fetch(`${BASE_URL}/auth/verify-email/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Email verification failed');
  }

  return result;
};

/**
 * Resend verification email
 * @param {string} email - User email
 */
export const resendVerification = async (email) => {
  const response = await fetch(`${BASE_URL}/auth/resend-verification/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to resend verification email');
  }

  return result;
};

/**
 * Request password reset
 * @param {string} email - User email
 */
export const requestPasswordReset = async (email) => {
  const response = await fetch(`${BASE_URL}/auth/password-reset/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to send password reset email');
  }

  return result;
};

/**
 * Confirm password reset with new password
 * @param {Object} data
 * @param {string} data.uid - User ID (base64 encoded)
 * @param {string} data.token - Reset token
 * @param {string} data.new_password - New password
 * @param {string} data.new_password_confirm - Password confirmation
 */
export const confirmPasswordReset = async (data) => {
  const response = await fetch(`${BASE_URL}/auth/password-reset-confirm/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to reset password');
  }

  return result;
};

/**
 * Check backend health status
 */
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${BASE_URL}/health/`);
    return response.ok;
  } catch (error) {
    return false;
  }
};
