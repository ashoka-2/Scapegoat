export const getVerificationEmailTemplate = (username, verificationLink) => {
    return `
      <div style="background-color: #f3f4f6; padding: 40px 20px; font-family: sans-serif; min-height: 100%;">
        <div style="background-color: #ffffff; max-width: 500px; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="padding: 32px; text-align: center;">
            <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 16px;">Verify your email</h1>
            <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 32px;">
              Welcome to <strong>Scapegoat</strong>, ${username}! Please click below to verify your account.
            </p>
            <a href="${verificationLink}" 
               style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; text-decoration: none;">
              Verify Email Address
            </a>
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 13px; line-height: 20px; margin: 0;">
                If you didn't create an account, you can safely ignore this email. The link is valid for 1 hour.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
};
