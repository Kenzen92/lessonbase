# Step-by-Step Guide: Google Cloud Console OAuth Setup

This guide provides detailed, step-by-step instructions for creating Google OAuth credentials for LessonBase.

---

## Part 1: Create or Select a Google Cloud Project

### Step 1: Access Google Cloud Console
1. Open your browser and go to: https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create a New Project (or Select Existing)

**To Create a New Project:**
1. Click the **project dropdown** at the top of the page (next to "Google Cloud")
2. Click **"NEW PROJECT"** in the top right of the modal
3. Enter project details:
   - **Project name**: `LessonBase` (or your preferred name)
   - **Organization**: Leave as "No organization" (unless you have one)
   - **Location**: Leave as default
4. Click **"CREATE"**
5. Wait for the project to be created (this takes a few seconds)
6. Once created, you'll be automatically switched to the new project

**To Select Existing Project:**
1. Click the **project dropdown** at the top
2. Find and click your existing project name

---

## Part 2: Enable Google+ API (Required for OAuth)

### Step 3: Enable Required APIs
1. In the left sidebar, click **"APIs & Services"** > **"Library"**
   - Or use the search bar at the top and search for "API Library"
2. In the API Library search box, type: **"Google+ API"**
3. Click on **"Google+ API"** from the results
4. Click the **"ENABLE"** button
5. Wait for it to enable (shows a green checkmark when done)

> **Note**: You might also want to enable "Google Identity Toolkit API" for better integration

---

## Part 3: Configure OAuth Consent Screen

### Step 4: Set Up OAuth Consent Screen
1. In the left sidebar, go to **"APIs & Services"** > **"OAuth consent screen"**
2. You'll see "User Type" options - Choose **"External"**
   - **External**: Available to any user with a Google account
   - **Internal**: Only for Google Workspace users (requires workspace)
3. Click **"CREATE"**

### Step 5: Fill Out OAuth Consent Screen - Page 1 (App Information)

**Required Fields:**

1. **App name**: `LessonBase`
   - This is what users see when they authenticate

2. **User support email**: Select your email from the dropdown
   - This is shown to users if they need help

3. **App logo**: (Optional)
   - Upload a logo image if you have one
   - Requirements: Square PNG or JPG, max 1MB
   - Skip for now if you don't have one

4. **Application home page**: (Optional)
   - Enter: `http://localhost:5173` (for development)
   - Or your production URL if deploying

5. **Application privacy policy link**: (Optional)
   - Leave blank for now or add your privacy policy URL

6. **Application terms of service link**: (Optional)
   - Leave blank for now or add your terms URL

7. **Authorized domains**:
   - Click **"+ ADD DOMAIN"**
   - For local development, you can skip this
   - For production, add your domain (e.g., `yourdomain.com`)
   - Do NOT include `http://` or `https://`, just the domain

8. **Developer contact information**:
   - Enter your email address
   - Click **"+ ADD ANOTHER EMAIL"** if you want to add more

9. Click **"SAVE AND CONTINUE"** at the bottom

### Step 6: Fill Out OAuth Consent Screen - Page 2 (Scopes)

1. Click **"ADD OR REMOVE SCOPES"**
2. A modal will appear with a list of scopes
3. Scroll down and select these scopes:
   - ✅ `.../auth/userinfo.email` - View your email address
   - ✅ `.../auth/userinfo.profile` - See your personal info
   - ✅ `openid` - Associate you with your personal info
4. You can use the filter box and search for "email" and "profile" to find them quickly
5. Click **"UPDATE"** at the bottom of the modal
6. You should see "3 scopes" selected
7. Click **"SAVE AND CONTINUE"**

### Step 7: Fill Out OAuth Consent Screen - Page 3 (Test Users)

> **Important**: While your app is in "Testing" mode, only test users can authenticate

1. Click **"+ ADD USERS"**
2. Enter email addresses of people who will test your app:
   - Add your own email
   - Add any team members' emails
   - Add test accounts if you have them
   - Example: `yourname@gmail.com`
3. Click **"ADD"**
4. Repeat for each test user
5. Click **"SAVE AND CONTINUE"**

### Step 8: Review and Complete
1. Review the summary page
2. Click **"BACK TO DASHBOARD"** at the bottom

> **Note**: Your app is now in "Testing" mode. To make it available to everyone, you'll need to submit for verification (do this later when ready for production)

---

## Part 4: Create OAuth 2.0 Client ID

### Step 9: Create OAuth Credentials
1. In the left sidebar, click **"APIs & Services"** > **"Credentials"**
2. Click the **"+ CREATE CREDENTIALS"** button at the top
3. Select **"OAuth client ID"** from the dropdown

### Step 10: Configure OAuth Client ID

1. **Application type**: Select **"Web application"**

2. **Name**: Enter a descriptive name
   - Example: `LessonBase Web Client`
   - This is for your reference only

3. **Authorized JavaScript origins**:
   - Click **"+ ADD URI"**
   - Enter: `http://localhost:5173`
   - Click **"+ ADD URI"** again
   - Enter your production URL (e.g., `https://lessonbase.vercel.app`)
   - Enter your backend URL if different (e.g., `https://your-backend.fly.dev`)
   
   > **Important**: 
   > - Do NOT add trailing slashes
   > - Match the protocol exactly (http for local, https for production)
   > - These are the domains where your app will run

4. **Authorized redirect URIs**:
   - Click **"+ ADD URI"**
   - Enter: `http://localhost:5173`
   - Click **"+ ADD URI"** again
   - Enter your production frontend URL (e.g., `https://lessonbase.vercel.app`)
   
   > **Note**: For @react-oauth/google, the redirect URI should match your site URL

5. Click **"CREATE"** at the bottom

### Step 11: Copy Your Credentials

A modal will appear with your credentials:

1. **Your Client ID**: 
   - It looks like: `123456789-abc123def456.apps.googleusercontent.com`
   - Click the **copy icon** next to it
   - Save this - you'll need it for both frontend and backend!

2. **Your Client Secret**:
   - It looks like: `GOCSPX-abc123def456xyz789`
   - Click the **copy icon** next to it
   - Save this - you'll need it for the backend only!

3. Click **"OK"** to close the modal

> **Security Warning**: 
> - Keep your Client Secret SECURE
> - Never commit it to git
> - Never expose it in frontend code
> - Only use it in backend environment variables

---

## Part 5: Configure Your Application

### Step 12: Add Credentials to Frontend

1. Navigate to your frontend folder: `kennysolutions/frontend/`
2. Create or edit the `.env` file:

```bash
VITE_REACT_APP_API_URL=http://localhost:8000
VITE_REACT_APP_WEBSOCKET_URL=ws://localhost:8000
VITE_GOOGLE_CLIENT_ID=paste_your_client_id_here
```

3. **Replace** `paste_your_client_id_here` with the Client ID you copied
4. Save the file

### Step 13: Add Credentials to Backend

1. Navigate to your backend folder: `kennysolutions/backend/`
2. Create or edit the `.env` file:

```bash
GOOGLE_CLIENT_ID=paste_your_client_id_here
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
FRONTEND_URL=http://localhost:5173
```

3. **Replace** the placeholders with your actual credentials
4. Save the file

### Step 14: Restart Your Servers

```bash
# Stop both servers (Ctrl+C)

# Restart Backend
cd backend
python manage.py runserver

# Restart Frontend (in a new terminal)
cd frontend
npm run dev
```

---

## Part 6: Test Your Setup

### Step 15: Test Google Sign-In

1. Open your browser and go to: `http://localhost:5173/signup`
2. You should see the **"Sign up with Google"** button
3. Click the button
4. A Google sign-in popup should appear
5. Select your Google account (must be a test user you added)
6. Grant permissions to the app
7. You should be redirected to the dashboard

**If it works**: ✅ Congratulations! OAuth is set up correctly!

**If it doesn't work**: See troubleshooting below

---

## Troubleshooting Common Issues

### Issue 1: "Error 400: redirect_uri_mismatch"

**Problem**: Your redirect URI doesn't match what's configured in Google Console

**Solution**:
1. Go back to Google Cloud Console > Credentials
2. Click on your OAuth 2.0 Client ID
3. Check **Authorized JavaScript origins** includes: `http://localhost:5173`
4. Check **Authorized redirect URIs** includes: `http://localhost:5173`
5. Make sure there are NO trailing slashes
6. Click **"SAVE"**
7. Wait a few minutes for changes to propagate
8. Try again

### Issue 2: "Error 401: Invalid client"

**Problem**: Client ID mismatch

**Solution**:
1. Verify your Client ID in frontend `.env` matches exactly what's in Google Console
2. Verify your Client ID in backend `.env` matches exactly what's in Google Console
3. Restart both servers after changing `.env` files

### Issue 3: "Error 403: access_denied"

**Problem**: User is not a test user OR app is not published

**Solution**:
1. Go to Google Cloud Console > OAuth consent screen
2. Scroll to "Test users"
3. Add the Google account you're trying to use
4. Click **"SAVE"**
5. Try signing in again with that account

### Issue 4: Google Sign-In Button Not Appearing

**Problem**: Client ID not configured correctly in frontend

**Solution**:
1. Check that `VITE_GOOGLE_CLIENT_ID` is set in `frontend/.env`
2. Make sure there are no spaces or quotes around the value
3. Restart the frontend dev server: `npm run dev`
4. Check browser console for errors (F12)

### Issue 5: "App not verified" Warning

**Problem**: Your app is still in testing mode

**Solution**:
- This is NORMAL during development
- Click "Advanced" → "Go to LessonBase (unsafe)" to continue
- For production, you'll need to submit for Google verification

---

## Production Deployment Checklist

When you're ready to deploy to production:

### Step 16: Update OAuth Configuration for Production

1. Go to Google Cloud Console > Credentials
2. Click your OAuth 2.0 Client ID
3. Add your production URLs:

**Authorized JavaScript origins**:
- ✅ `https://lessonbase.vercel.app` (your frontend)
- ✅ `https://your-api-domain.com` (your backend)

**Authorized redirect URIs**:
- ✅ `https://lessonbase.vercel.app`

4. Click **"SAVE"**

### Step 17: Update Environment Variables

**Frontend Production (.env.production)**:
```bash
VITE_REACT_APP_API_URL=https://your-api-domain.com
VITE_REACT_APP_WEBSOCKET_URL=wss://your-api-domain.com
VITE_GOOGLE_CLIENT_ID=same_client_id_as_development
```

**Backend Production**:
```bash
GOOGLE_CLIENT_ID=same_client_id_as_development
GOOGLE_CLIENT_SECRET=same_client_secret_as_development
FRONTEND_URL=https://lessonbase.vercel.app
```

### Step 18: Submit for Verification (Optional)

To remove the "unverified app" warning:

1. Go to OAuth consent screen
2. Click **"PUBLISH APP"**
3. Click **"Prepare for verification"**
4. Follow Google's verification process (can take several weeks)

> **Note**: You can use the app in testing mode indefinitely for up to 100 test users

---

## Quick Reference

### Where to Find Your Credentials

1. Google Cloud Console: https://console.cloud.google.com/
2. Navigate to: **APIs & Services** > **Credentials**
3. Your OAuth 2.0 Client ID is listed under "OAuth 2.0 Client IDs"
4. Click the name to view/edit configuration
5. Client ID and Secret are shown at the top

### Key URLs for Local Development

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Google Console: https://console.cloud.google.com/

### Test Users Management

To add/remove test users:
1. Go to **OAuth consent screen**
2. Scroll to **Test users** section
3. Click **"+ ADD USERS"** to add
4. Click **X** next to a user to remove

---

## Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In for Websites](https://developers.google.com/identity/sign-in/web/sign-in)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)

---

## Summary

You've completed:
✅ Created Google Cloud Project
✅ Enabled required APIs
✅ Configured OAuth consent screen
✅ Added test users
✅ Created OAuth 2.0 credentials
✅ Configured authorized origins and redirect URIs
✅ Added credentials to your application
✅ Tested the implementation

Your Google OAuth setup is complete! 🎉

If you encounter any issues not covered here, check the browser console and backend logs for detailed error messages.
