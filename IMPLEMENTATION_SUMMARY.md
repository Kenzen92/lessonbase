# Django Allauth Frontend Implementation Summary

## Overview
This document summarizes the complete implementation of django-allauth on the frontend with Google OAuth support, proper teacher/student account type handling, and email verification flows.

## What Was Implemented

### 1. **Authentication Service** (`frontend/src/services/authService.js`)
A centralized service handling all authentication operations:
- `registerUser()` - Email/password registration
- `loginUser()` - Email/password login
- `googleAuth()` - Google OAuth authentication
- `logoutUser()` - User logout
- `getCurrentUser()` - Fetch current user data
- `verifyEmail()` - Email verification
- `resendVerification()` - Resend verification email
- `requestPasswordReset()` - Request password reset
- `confirmPasswordReset()` - Confirm password reset
- `checkBackendHealth()` - Health check

### 2. **Enhanced Auth Context** (`frontend/src/contexts/auth_context.jsx`)
Updated authentication context with:
- Token management
- User type tracking (teacher/student)
- Full user object storage
- Loading state
- `login()` and `logout()` helper functions

### 3. **Updated Login Component** (`frontend/src/screens/login.jsx`)
Features:
- Google Sign-In button (automatic user type detection)
- Email/password login form
- Backend health check on mount
- Forgot password link
- Loading states and error handling
- Automatic redirect to dashboard on success

### 4. **Updated Signup Component** (`frontend/src/screens/signup.jsx`)
Features:
- User type selection (Teacher/Student) with toggle buttons
- Google Sign-Up button (uses selected user type)
- Email/password registration form with first/last name
- Password confirmation validation
- Email verification notification
- Redirect to login after successful registration

### 5. **Email Verification Page** (`frontend/src/screens/verify-email.jsx`)
Features:
- Automatic verification on page load
- Success/error states with visual feedback
- Auto-redirect to login after successful verification
- Manual redirect button

### 6. **Password Reset Flow**
Two new components:

**Forgot Password** (`frontend/src/screens/forgot-password.jsx`):
- Email input form
- Send reset link
- Success confirmation
- Retry option

**Reset Password** (`frontend/src/screens/reset-password.jsx`):
- New password form with confirmation
- Token validation
- Success confirmation with auto-redirect
- Password strength requirements

### 7. **Updated Routes** (`frontend/src/App.jsx`)
New routes added:
- `/auth/verify-email/:key` - Email verification
- `/forgot-password` - Password reset request
- `/auth/reset-password/:uid/:token` - Password reset confirmation

### 8. **Google OAuth Integration** (`frontend/src/main.jsx`)
- Wrapped app with `GoogleOAuthProvider`
- Configured with `VITE_GOOGLE_CLIENT_ID` environment variable

### 9. **Backend Updates**

**Updated `auth_views.py`**:
- Modified `google_login()` to accept both `access_token` and `credential` (JWT)
- Handles Google JWT verification via tokeninfo endpoint
- Tracks `is_new_user` flag for new signups

**Updated `auth_serializers.py`**:
- `SocialAuthSerializer` now accepts both `access_token` and `credential`
- Validation ensures at least one is provided

### 10. **Environment Configuration**
Updated `.env.template` with:
```bash
VITE_GOOGLE_CLIENT_ID=
```

## User Flows

### Email/Password Registration Flow
1. User navigates to `/signup`
2. User selects account type (Student/Teacher)
3. User fills out registration form (email, password, optional name)
4. Backend creates account and sends verification email
5. User receives email with verification link
6. User clicks link → redirected to `/auth/verify-email/:key`
7. Email is verified automatically
8. User is redirected to login page
9. User can now log in

### Email/Password Login Flow
1. User navigates to `/login`
2. User enters email and password
3. Backend validates credentials and checks email verification
4. If verified, backend returns auth token and user info
5. User is redirected to `/dashboard`

### Google Sign-Up Flow
1. User navigates to `/signup`
2. User selects account type (Student/Teacher)
3. User clicks "Sign up with Google"
4. Google authentication popup appears
5. User selects Google account
6. Frontend sends JWT credential to backend with selected user type
7. Backend verifies credential with Google
8. Backend creates new account (Teacher or Student) or links to existing
9. Email is automatically marked as verified
10. Backend returns auth token and user info
11. User is redirected to `/dashboard`

### Google Login Flow
1. User navigates to `/login`
2. User clicks "Sign in with Google"
3. Google authentication popup appears
4. User selects Google account
5. Frontend sends JWT credential to backend
6. Backend finds existing account by email
7. Backend returns auth token and user info
8. User is redirected to `/dashboard`

### Password Reset Flow
1. User clicks "Forgot Password?" on login page
2. User enters email address
3. Backend sends password reset email
4. User receives email with reset link
5. User clicks link → redirected to `/auth/reset-password/:uid/:token`
6. User enters new password and confirmation
7. Backend validates token and updates password
8. User is redirected to login page
9. User can log in with new password

## Key Features

### ✅ Account Type Handling
- **Signup**: User must select account type (Teacher/Student) before signing up
- **Login**: Automatic detection - user type is stored in backend and returned on login
- **Google OAuth**: Selected user type is sent to backend during signup
- **Existing Accounts**: If email exists, Google account is linked regardless of original signup method
- **Single Type**: One account cannot be both teacher and student

### ✅ Email Verification
- **Email/Password**: Email verification required before login
- **Google OAuth**: Automatically verified (Google already verified the email)
- **Verification Link**: Sent via email, handled by `/auth/verify-email/:key` route
- **Resend Option**: Available if user doesn't receive email

### ✅ Security
- **Token Storage**: Stored in sessionStorage (cleared on browser close)
- **Password Validation**: Backend enforces password strength
- **Google JWT**: Verified server-side using Google's tokeninfo endpoint
- **Protected Routes**: Use `PrivateRoutes` component for authentication checking

### ✅ User Experience
- **Loading States**: Shown during async operations
- **Error Handling**: Clear error messages for all failure scenarios
- **Auto-redirect**: Successful operations redirect appropriately
- **Backend Health**: Checked on login page mount
- **Responsive Design**: Material-UI components work on all screen sizes

## Environment Variables

### Frontend (`.env`)
```bash
VITE_REACT_APP_API_URL=http://localhost:8000
VITE_REACT_APP_WEBSOCKET_URL=ws://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Backend (`.env`)
```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
FRONTEND_URL=http://localhost:5173
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd frontend
npm install @react-oauth/google
```

### 2. Configure Google OAuth
Follow the guide in `GOOGLE_OAUTH_SETUP.md` to:
- Create Google OAuth credentials
- Configure authorized origins and redirect URIs
- Get Client ID and Client Secret

### 3. Set Environment Variables
Copy `.env.template` to `.env` and fill in the values:
```bash
cp .env.template .env
# Edit .env with your values
```

### 4. Run the Application
```bash
# Backend
cd backend
python manage.py runserver

# Frontend
cd frontend
npm run dev
```

### 5. Test the Flows
- Visit `http://localhost:5173/signup` to test registration
- Visit `http://localhost:5173/login` to test login
- Try both email/password and Google OAuth
- Test password reset flow

## API Endpoints Used

All endpoints are in the `/auth/` namespace:

- `POST /auth/register/` - Register with email/password
- `POST /auth/login/` - Login with email/password
- `POST /auth/logout/` - Logout (requires auth)
- `POST /auth/google/` - Google OAuth login/signup
- `GET /auth/user/` - Get current user (requires auth)
- `POST /auth/verify-email/` - Verify email with key
- `POST /auth/resend-verification/` - Resend verification email
- `POST /auth/password-reset/` - Request password reset
- `POST /auth/password-reset-confirm/` - Confirm password reset

## Files Created/Modified

### Created
- `frontend/src/services/authService.js`
- `frontend/src/screens/verify-email.jsx`
- `frontend/src/screens/forgot-password.jsx`
- `frontend/src/screens/reset-password.jsx`
- `GOOGLE_OAUTH_SETUP.md`

### Modified
- `frontend/src/contexts/auth_context.jsx`
- `frontend/src/screens/login.jsx`
- `frontend/src/screens/signup.jsx`
- `frontend/src/App.jsx`
- `frontend/src/main.jsx`
- `frontend/.env.template`
- `backend/lessonbase/backend/auth_views.py`
- `backend/lessonbase/backend/auth_serializers.py`

## Notes

1. **Google Client ID**: The same Client ID is used in both frontend and backend
2. **JWT vs Access Token**: Frontend sends JWT credential; backend verifies it with Google
3. **User Type on Login**: Not needed - backend automatically returns the correct user type
4. **Account Linking**: If someone signs up with email, they can later link Google account
5. **No Password for Google Users**: Google users don't have a password in the system
6. **Email Uniqueness**: One email = one account (but can have multiple auth methods)

## Troubleshooting

See `GOOGLE_OAUTH_SETUP.md` for common issues and solutions.

## Next Steps

1. **Get Google OAuth Credentials**: Follow the setup guide
2. **Configure Environment Variables**: Add Client ID to both frontend and backend
3. **Test All Flows**: Ensure everything works before deploying
4. **Update Production URLs**: Add production URLs to Google Console before deploying
5. **Enable HTTPS**: Google OAuth requires HTTPS in production

## Business Logic Compliance

✅ **Account Type Selection**: Required on signup, automatic on login
✅ **Teacher/Student Separation**: One account type per user, no dual accounts
✅ **Email Verification**: Required for email/password, automatic for Google
✅ **Account Linking**: Google connects to existing email accounts
✅ **Dashboard Redirect**: Both user types go to `/dashboard`
✅ **Google OAuth**: Fully integrated with proper credential handling
