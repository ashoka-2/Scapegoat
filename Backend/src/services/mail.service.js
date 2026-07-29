import { google } from 'googleapis';
import { config } from '../config/config.js';
const OAuth2 = google.auth.OAuth2;

// Gmail API aur OAuth2 ko initialize kar rahe hain
const createGmailClient = () => {
    const oauth2Client = new OAuth2(
        (config.GOOGLE_CLIENT_ID || "").trim(),
        (config.GOOGLE_CLIENT_SECRET || "").trim(),
        "https://developers.google.com/oauthplayground"
    );

    // Refresh token set kar rahe hain taaki login baar-baar na mangna pade or app publish bhi kar diya hai google console mein
    oauth2Client.setCredentials({
        refresh_token: (config.GOOGLE_REFRESH_TOKEN || "").trim()
    });

    return google.gmail({ version: 'v1', auth: oauth2Client });
};

const makeBody = (to, from, subject, message) => {
    const str = [
        `To: ${to}`,
        `From: ${from}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=utf-8`,
        '',
        message
    ].join('\n');

    // Gmail API ko base64 format mein hi data chahiye hota hai
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

export async function sendEmail({ to, subject, html, text = "" }) {
    try {
        console.log(`Trying to send the email: ${to}`);
        
        const gmail = createGmailClient();
        const rawMessage = makeBody(to, config.GOOGLE_USER, subject, html || text);

        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: rawMessage
            }
        });

        console.log("Email sent successfully via Gmail HTTP API! ID:", res.data.id);
        return { success: true, message: "Email sent" };
    } catch (error) {
        console.error("Gmail HTTP API Error:", error.message);
        return { error: true, message: error.message };
    }
}
