# Quick Start Guide - Google OAuth Implementation

## Immediate Setup Steps

### 1. Get Your Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select existing)
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Configure OAuth consent screen (if first time)
6. Choose **Web application**
7. Add authorized JavaScript origins:
   - `http://localhost:5173`
   - Your production URL (when ready)
8. Add authorized redirect URIs:
   - `http://localhost:5173`
   - Your production URL (when ready)
9. Click **Create** and copy the Client ID and Client Secret

### 2. Configure Frontend Environment

Create or update `frontend/.env`:

```bash
VITE_REACT_APP_API_URL=http://localhost:8000
VITE_REACT_APP_WEBSOCKET_URL=ws://localhost:8000
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_FROM_STEP_1
```

### 3. Configure Backend Environment

Update your `backend/.env` or environment variables:

```bash
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_FROM_STEP_1
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_FROM_STEP_1
FRONTEND_URL=http://localhost:5173
```

### 4. Install Dependencies (Already Done)

The required package `@react-oauth/google` is already installed.

### 5. Start Your Application

```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 6. Test It!

1. Navigate to `http://localhost:5173/signup`
2. You should see:
   - User type toggle (Student/Teacher)
   - "Sign up with Google" button
   - Email/password form
3. Try signing up with Google
4. You should be redirected to dashboard on success

## What to Test

### Email/Password Flow
- [ ] Sign up with email/password
- [ ] Receive verification email
- [ ] Click verification link
- [ ] Log in with verified credentials
- [ ] Check redirect to dashboard

### Google OAuth Flow
- [ ] Select "Student" and sign up with Google
- [ ] Verify redirect to dashboard
- [ ] Log out
- [ ] Sign in with Google again (should work without selecting type)
- [ ] Try signing up as "Teacher" with different Google account

### Password Reset Flow
- [ ] Click "Forgot Password?" on login page
- [ ] Enter email
- [ ] Receive reset email
- [ ] Click reset link
- [ ] Enter new password
- [ ] Log in with new password

### Account Linking
- [ ] Sign up with email/password
- [ ] Verify email
- [ ] Try signing in with Google using same email
- [ ] Should link accounts and log in successfully

## Common Issues & Solutions

### "Google Sign-In button not appearing"
- Check that `VITE_GOOGLE_CLIENT_ID` is set in frontend `.env`
- Restart the dev server after adding env variables
- Check browser console for errors

### "Error 400: redirect_uri_mismatch"
- Ensure `http://localhost:5173` is added to authorized JavaScript origins in Google Console
- No trailing slashes
- Match the protocol exactly (http vs https)

### "Invalid Google credential"
- Client ID in frontend must match Client ID in backend
- Client ID must match the one from Google Console
- Check that you copied the full Client ID

### Email verification not working
- Check backend email settings in `settings.py`
- Check that `FRONTEND_URL` is set correctly in backend
- Look at backend terminal for email sending errors

### User created but can't login
- Email/password users need to verify email first
- Check that verification email was sent
- Check spam folder
- Try resending verification from login page

## File Structure Overview

```
frontend/
├── src/
│   ├── services/
│   │   └── authService.js          # All auth API calls
│   ├── contexts/
│   │   └── auth_context.jsx        # Auth state management
│   ├── screens/
│   │   ├── login.jsx               # Login page with Google
│   │   ├── signup.jsx              # Signup page with Google
│   │   ├── verify-email.jsx        # Email verification handler
│   │   ├── forgot-password.jsx     # Password reset request
│   │   └── reset-password.jsx      # Password reset confirmation
│   ├── App.jsx                     # Routes updated
│   └── main.jsx                    # GoogleOAuthProvider added
└── .env                            # Environment variables

backend/
└── lessonbase/
    └── backend/
        ├── auth_views.py           # Updated google_login
        └── auth_serializers.py     # Updated SocialAuthSerializer
```

## API Endpoints Reference

All endpoints start with your `VITE_REACT_APP_API_URL`:

```
POST /auth/register/              - Email/password signup
POST /auth/login/                 - Email/password login
POST /auth/google/                - Google OAuth (login/signup)
POST /auth/logout/                - Logout (requires token)
GET  /auth/user/                  - Get current user (requires token)
POST /auth/verify-email/          - Verify email with key
POST /auth/resend-verification/   - Resend verification email
POST /auth/password-reset/        - Request password reset
POST /auth/password-reset-confirm/ - Confirm password reset
```

## Next Steps After Setup

1. **Test all flows** thoroughly
2. **Customize UI** as needed (colors, text, layout)
3. **Add production URLs** to Google Console
4. **Configure production environment variables**
5. **Test on production** before launching
6. **Monitor Google OAuth quota** (free tier limits)

## Need Help?

- Full documentation: `IMPLEMENTATION_SUMMARY.md`
- Google setup guide: `GOOGLE_OAUTH_SETUP.md`
- Check backend logs for detailed error messages
- Check browser console for frontend errors

## Success Checklist

✅ Google OAuth credentials created
✅ Frontend `.env` configured with Client ID
✅ Backend `.env` configured with Client ID and Secret
✅ Can see Google Sign-In button on login/signup
✅ Email/password signup sends verification email
✅ Email verification link works
✅ Google signup redirects to dashboard
✅ Google login works for existing accounts
✅ Password reset flow works end-to-end
✅ Account linking works (Google + email/password)

Once all items are checked, you're ready to go! 🚀
