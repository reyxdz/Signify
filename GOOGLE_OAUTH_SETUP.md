# Google OAuth Setup Guide for Signify

This guide will help you set up Google Sign-In functionality for the Signify application.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Your development environment running on `http://localhost:3000`

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "NEW PROJECT"
4. Enter project name (e.g., "Signify")
5. Click "CREATE"

### 2. Enable Google+ API

1. In Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and select "ENABLE"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "CREATE CREDENTIALS" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - Select "External" user type
   - Fill in the required fields (app name, user support email, etc.)
   - Save and continue
4. Back to "Create OAuth client ID":
   - Select "Web application"
   - Name it (e.g., "Signify Web")

### 4. Configure Authorized Origins and Redirects

In the OAuth client ID settings, add the following under "Authorized JavaScript origins":
- `http://localhost:3000`

And add these under "Authorized redirect URIs":
- `http://localhost:3000`

### 5. Copy Your Client ID

1. Your OAuth client ID will be displayed. Copy it.
2. Open the `.env` file in your `signify` folder
3. Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Client ID
4. Save the file

```env
REACT_APP_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

### 6. Restart Your Application

After updating the `.env` file, restart your React development server:

```bash
npm start
```

## Testing Google Sign-In

1. Navigate to the login or signup page
2. You should see "Sign in with Google" or "Continue with Google" buttons
3. Click the button and follow the Google authentication flow
4. Upon successful authentication, you'll be logged into Signify

## Deployment

When deploying to production, make sure to:

1. Update your Google OAuth application with your production domain
2. Add your production domain to "Authorized JavaScript origins"
3. Update the `REACT_APP_GOOGLE_CLIENT_ID` environment variable with your production Client ID
4. Also update any API URLs from localhost to your production backend URL

## Troubleshooting

### "Callback failed" or "Invalid Client ID" error

- Ensure your Client ID is correctly copied to the `.env` file
- Check that localhost:3000 is added to authorized origins in Google Cloud Console
- Make sure you've enabled the Google+ API

### Google button not appearing

- Verify that `REACT_APP_GOOGLE_CLIENT_ID` is set in your `.env` file
- Restart the development server after changing `.env`
- Check browser console for any error messages

### User data not loading after login

- Ensure your backend is running on `http://localhost:5000`
- Check that the `/google-login` and `/google-signup` endpoints are properly configured
- Check backend logs for any errors

## Additional Resources

- [Google Cloud Console](https://console.cloud.google.com/)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
