# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the LessonBase application.

## Prerequisites

- A Google Cloud Platform (GCP) account
- Access to the Google Cloud Console

## Backend Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in the required fields (App name, User support email, Developer contact)
   - Add scopes: `email`, `profile`
   - Add test users if in testing mode
6. Select **Web application** as the Application type
7. Add the following to **Authorized JavaScript origins**:
   - `http://localhost:5173` (for local development)
   - `https://yourdomain.com` (for production)
8. Add the following to **Authorized redirect URIs**:
   - `http://localhost:5173` (for local development)
   - `https://yourdomain.com` (for production)
9. Click **Create**
10. Copy the **Client ID** and **Client Secret**

### 2. Configure Backend Environment Variables

Add the following to your backend `.env` file:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Frontend URL (for email redirects)
FRONTEND_URL=http://localhost:5173
```

**For production:**
```bash
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
FRONTEND_URL=https://yourdomain.com
```

## Frontend Setup

### 1. Configure Frontend Environment Variables

Add the following to your frontend `.env` file (create one if it doesn't exist):

```bash
VITE_REACT_APP_API_URL=http://localhost:8000
VITE_REACT_APP_WEBSOCKET_URL=ws://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**For production:**
```bash
VITE_REACT_APP_API_URL=https://your-backend-api.com
VITE_REACT_APP_WEBSOCKET_URL=wss://your-backend-api.com
VITE_GOOGLE_CLIENT_ID=your_production_client_id
```

### 2. Important Notes

- The `VITE_GOOGLE_CLIENT_ID` should be the **same** Client ID you created in the Google Cloud Console
- The Client Secret is **only** needed on the backend, never expose it on the frontend
- Make sure to add your production URLs to the Google Cloud Console when deploying

## Testing Google OAuth

### Local Development

1. Start your backend server:
   ```bash
   cd backend
   python manage.py runserver
   ```

2. Start your frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to `http://localhost:5173/login` or `http://localhost:5173/signup`
4. Click the "Sign in with Google" or "Sign up with Google" button
5. You should see a Google sign-in popup
6. Select your Google account
7. You should be redirected to the dashboard upon successful authentication

### Production Deployment

1. Update the Authorized JavaScript origins and redirect URIs in Google Cloud Console with your production URLs
2. Update your environment variables with production values
3. Deploy your application
4. Test the Google OAuth flow on your production site

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- Make sure your redirect URI in the Google Cloud Console matches exactly with your frontend URL
- Check that there are no trailing slashes or protocol mismatches (http vs https)

### "Error 401: Invalid client"
- Verify that your `GOOGLE_CLIENT_ID` is correct in both backend and frontend
- Ensure the Client ID corresponds to the correct Google Cloud project

### Google Sign-In button not appearing
- Check that `VITE_GOOGLE_CLIENT_ID` is set in your frontend `.env` file
- Verify that the `@react-oauth/google` package is installed
- Check the browser console for any errors

### User cannot login after Google authentication
- Verify that the backend `/auth/google/` endpoint is accessible
- Check backend logs for any errors
- Ensure the `GOOGLE_CLIENT_SECRET` is correct in the backend environment

## Authentication Flow

### Email/Password Registration
1. User fills out registration form with email, password, and user type (student/teacher)
2. Backend creates account and sends verification email
3. User clicks verification link in email
4. User is redirected to login page
5. User logs in with email and password

### Email/Password Login
1. User enters email and password
2. Backend validates credentials and checks email verification
3. Backend returns auth token and user information
4. User is redirected to dashboard

### Google Sign Up
1. User selects account type (student/teacher)
2. User clicks "Sign up with Google"
3. Google authentication popup appears
4. User selects Google account
5. Backend creates new account or links to existing account
6. Backend returns auth token and user information
7. User is redirected to dashboard

### Google Login
1. User clicks "Sign in with Google"
2. Google authentication popup appears
3. User selects Google account
4. Backend finds existing account by email
5. Backend returns auth token and user information
6. User is redirected to dashboard

## Security Considerations

1. **Never expose your Client Secret** - It should only be stored on the backend
2. **Use HTTPS in production** - Google OAuth requires secure connections in production
3. **Validate emails** - The backend automatically marks Google accounts as verified
4. **CORS configuration** - Ensure your backend CORS settings allow requests from your frontend domain
5. **Token storage** - Auth tokens are stored in sessionStorage (cleared on browser close)

## Support

For more information, refer to:
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Django Allauth Documentation](https://django-allauth.readthedocs.io/)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)
