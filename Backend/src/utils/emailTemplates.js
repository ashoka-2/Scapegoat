/**
 * Email Templates for ScapeGoat
 * Modern luxury dark-mode theme aligned with brand colors (#0A0A0A, #1A1A1A, #FA6A65, #FFD700)
 */

export const getVerificationEmailTemplate = (username, verificationLink) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your ScapeGoat Account</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0a0a0a; padding: 40px 15px;">
            <tr>
              <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #141414; border: 1px solid #262626; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
                  
                  <!-- Header Logo Banner -->
                  <tr>
                    <td align="center" style="padding: 40px 32px 24px; border-bottom: 1px solid #262626; background: linear-gradient(180deg, #1f1414 0%, #141414 100%);">
                      <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: #FA6A65; text-shadow: 0 0 20px rgba(250, 106, 101, 0.4);">
                        SCAPEGOAT.
                      </h1>
                      <p style="margin: 6px 0 0; font-size: 11px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #888888;">
                        Exclusive Fashion Vault
                      </p>
                    </td>
                  </tr>

                  <!-- Body Content -->
                  <tr>
                    <td style="padding: 40px 36px; text-align: center;">
                      <div style="width: 56px; h-height: 56px; width: 56px; height: 56px; border-radius: 50%; background: rgba(250, 106, 101, 0.12); border: 1px solid rgba(250, 106, 101, 0.3); margin: 0 auto 24px; display: inline-flex; align-items: center; justify-content: center; line-height: 56px; font-size: 24px;">
                        ✉️
                      </div>

                      <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                        Verify Your Email Address
                      </h2>
                      <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.6; color: #a3a3a3;">
                        Welcome to ScapeGoat, <strong style="color: #ffffff;">${username}</strong>! You're one step away from unlocking exclusive drops. Please confirm your email address below.
                      </p>

                      <!-- CTA Button -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <a href="${verificationLink}" 
                               target="_blank"
                               style="display: inline-block; background: linear-gradient(135deg, #FA6A65 0%, #e04e49 100%); color: #ffffff; padding: 16px 40px; border-radius: 14px; font-size: 14px; font-weight: 800; tracking: 0.05em; text-transform: uppercase; text-decoration: none; box-shadow: 0 8px 24px rgba(250, 106, 101, 0.35); transition: all 0.3s ease;">
                              Verify Email Now
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 0; font-size: 12px; color: #737373; line-height: 1.5;">
                        This verification link will expire in <strong style="color: #a3a3a3;">1 hour</strong>. If you did not sign up for ScapeGoat, please ignore this email.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 36px; background-color: #0d0d0d; border-top: 1px solid #262626; text-align: center;">
                      <p style="margin: 0 0 8px; font-size: 11px; color: #525252; font-weight: 600;">
                        &copy; ${new Date().getFullYear()} ScapeGoat Inc. All rights reserved.
                      </p>
                      <p style="margin: 0; font-size: 10px; color: #404040;">
                        Automated security notification • Do not reply directly to this email
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
};

export const getPasswordResetEmailTemplate = (username, resetLink) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your ScapeGoat Password</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0a0a0a; padding: 40px 15px;">
            <tr>
              <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #141414; border: 1px solid #262626; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
                  
                  <!-- Header Logo Banner -->
                  <tr>
                    <td align="center" style="padding: 40px 32px 24px; border-bottom: 1px solid #262626; background: linear-gradient(180deg, #1f1a14 0%, #141414 100%);">
                      <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: #FFD700; text-shadow: 0 0 20px rgba(255, 215, 0, 0.35);">
                        SCAPEGOAT.
                      </h1>
                      <p style="margin: 6px 0 0; font-size: 11px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #888888;">
                        Security & Authentication
                      </p>
                    </td>
                  </tr>

                  <!-- Body Content -->
                  <tr>
                    <td style="padding: 40px 36px; text-align: center;">
                      <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(255, 215, 0, 0.12); border: 1px solid rgba(255, 215, 0, 0.3); margin: 0 auto 24px; display:flex; align-items: center; justify-content: center; line-height: 56px; font-size: 24px;">
                        🔐
                      </div>

                      <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                        Reset Your Password
                      </h2>
                      <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.6; color: #a3a3a3;">
                        Hello <strong style="color: #ffffff;">${username}</strong>, we received a request to reset the password for your ScapeGoat account. Click below to choose a new password.
                      </p>

                      <!-- CTA Button -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <a href="${resetLink}" 
                               target="_blank"
                               style="display: inline-block; background: linear-gradient(135deg, #FFD700 0%, #e0bd00 100%); color: #0a0a0a; padding: 16px 40px; border-radius: 14px; font-size: 14px; font-weight: 900; tracking: 0.05em; text-transform: uppercase; text-decoration: none; box-shadow: 0 8px 24px rgba(255, 215, 0, 0.3); transition: all 0.3s ease;">
                              Reset My Password
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 0; font-size: 12px; color: #737373; line-height: 1.5;">
                        For your protection, this link expires in <strong style="color: #a3a3a3;">15 minutes</strong>. If you did not request a password reset, your account is safe and no further action is needed.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 36px; background-color: #0d0d0d; border-top: 1px solid #262626; text-align: center;">
                      <p style="margin: 0 0 8px; font-size: 11px; color: #525252; font-weight: 600;">
                        &copy; ${new Date().getFullYear()} ScapeGoat Inc. All rights reserved.
                      </p>
                      <p style="margin: 0; font-size: 10px; color: #404040;">
                        Automated security notification • Do not reply directly to this email
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
};
