# Email Setup Guide - Gmail SMTP

This guide will help you set up email notifications for Signify so that recipients automatically receive signing invitations when you publish a document.

## Overview

When you publish a document with recipients in Signify, the system will **automatically send emails** to all recipients with a link to sign the document.

## Step 1: Enable Gmail App Password

Google has disabled the ability to use your regular Gmail password for third-party applications for security reasons. Instead, you need to create an **App Password**.

### Prerequisites:
- A Gmail account
- **2-Step Verification** must be enabled on your Gmail account

### Enable 2-Step Verification (if not already enabled):

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click "Security" in the left menu
3. Scroll down to "Two-Step Verification"
4. Click "Get Started" and follow the prompts
5. Verify your phone number and set up your preferred verification method

### Create an App Password:

1. Go to [Google Account Security Settings](https://myaccount.google.com/security)
2. Ensure 2-Step Verification is enabled
3. Scroll down to "App passwords" (only appears if 2-Step Verification is on)
4. Select:
   - **App**: "Mail"
   - **Device**: "Windows Computer" (or your device type)
5. Click "Generate"
6. Google will show you a 16-character password that looks like: `xxxx xxxx xxxx xxxx`
7. **Copy this password** (without spaces)

## Step 2: Configure Environment Variables

### In the Backend (`server/.env`):

Create or update `server/.env` with your Gmail credentials:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxxxxxxxxxx

# Other configurations
JWT_SECRET=your-secret-key-here
MONGODB_URI=mongodb://localhost:27017/signify
REACT_APP_SIGNING_URL=http://localhost:3000/sign
```

**Important:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `xxxxxxxxxxxx` with the 16-character App Password you generated (without spaces)
- **Do NOT commit this file to Git** - it contains sensitive credentials

### Add to `.gitignore`:

Make sure `server/.env` is in your `.gitignore` file:

```
server/.env
.env
*.env
```

## Step 3: Test Email Configuration

1. **Restart your backend server:**
   ```bash
   cd c:\Rameses\Signify\server
   npm run dev
   ```

2. **You should see in the console:**
   ```
   Connected to signify database
   ```

3. **Publish a test document** with a recipient email address
4. **Check the recipient's inbox** for the signing invitation email

## Email Features

When a document is published, recipients will receive an email with:

- **Professional template** with your document name
- **Direct link** to sign the document
- **Expiration information** (30 days default, customizable)
- **Company branding** (Signify signature)

## Troubleshooting

### Email not sending?

1. **Check backend console** for error messages
2. **Verify Gmail credentials:**
   - Is EMAIL_USER the correct Gmail address?
   - Is EMAIL_PASSWORD the correct 16-character App Password?
3. **Check if 2-Step Verification is enabled**
4. **Try generating a new App Password** if the current one isn't working
5. **Check your Gmail account** for any security alerts

### "SMTP connect ECONNREFUSED" error?

- This usually means the email service isn't connecting
- Verify your `EMAIL_USER` and `EMAIL_PASSWORD` are correct
- Make sure you're using the **App Password**, not your regular password

### Email marked as spam?

- Gmail's email might initially be marked as spam
- Ask recipients to mark it as "Not Spam"
- In production, use a domain-specific email (e.g., accounts@your-company.com)

## Production Setup

For production, you should:

1. **Use a professional email account** (e.g., noreply@your-domain.com)
2. **Consider switching to SendGrid or Mailgun** for better deliverability
3. **Add DKIM/SPF records** to your domain
4. **Use environment variables** in your hosting platform (AWS, Heroku, etc.)
5. **Monitor email delivery** for bounces and failures

### Switch to SendGrid (Optional):

If you want better email reliability in production:

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key
3. Update `.env`:
   ```env
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=your-sendgrid-key
   ```
4. We can update the code to support SendGrid if needed

## Email Variables

You can customize emails by editing the `sendSigningInvitationEmail` function in `server/index.js`:

- **Subject line**: Customize greeting
- **Email template**: Add company logo, custom colors, footer
- **Expiration time**: Change from 30 days to something else
- **Link text**: Customize button text

## Security Notes

⚠️ **Important Security Reminders:**

- **Never commit `.env` files** to version control
- **Never share** your Gmail App Password
- **Use environment variables** in production (not hardcoded)
- **Consider rotating** app passwords periodically
- If you suspect a password was compromised, delete the app password and generate a new one

## Additional Resources

- [Google Account Security](https://myaccount.google.com/security)
- [Gmail App Passwords Help](https://support.google.com/accounts/answer/185833)
- [Nodemailer Documentation](https://nodemailer.com/)
- [SendGrid Email Sending](https://sendgrid.com/)
