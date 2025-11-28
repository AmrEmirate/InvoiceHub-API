"use strict";
// Professional email templates for InvoiceHub
// These templates use inline CSS for maximum email client compatibility
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSetPasswordEmail = generateSetPasswordEmail;
exports.generateResetPasswordEmail = generateResetPasswordEmail;
const emailStyles = {
    primary: '#1e3a8a',
    primaryLight: '#3b82f6',
    accent: '#f59e0b',
    success: '#10b981',
    neutral300: '#d1d5db',
    neutral600: '#4b5563',
    neutral800: '#1f2937',
};
/**
 * Base email template wrapper
 */
function getEmailBaseTemplate(content) {
    return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>InvoiceHub</title>
      <!--[if mso]>
      <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
      </style>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <!-- Main container -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%;">
              <!-- Header with gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, ${emailStyles.primary} 0%, ${emailStyles.primaryLight} 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center">
                        <!-- Logo/Icon -->
                        <div style="display: inline-block; width: 64px; height: 64px; background-color: ${emailStyles.accent}; border-radius: 12px; margin-bottom: 16px; line-height: 64px; text-align: center;">
                          <span style="font-size: 32px; font-weight: bold; color: #ffffff;">₹</span>
                        </div>
                        <!-- Brand name -->
                        <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px;">InvoiceHub</h1>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">Professional Invoice Management</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Content area -->
              <tr>
                <td style="background-color: #ffffff; padding: 48px 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                  ${content}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 32px 20px; text-align: center;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: ${emailStyles.neutral600};">
                    © ${new Date().getFullYear()} InvoiceHub. All rights reserved.
                  </p>
                  <p style="margin: 0; font-size: 12px; color: ${emailStyles.neutral600};">
                    Anda menerima email ini karena Anda terdaftar di InvoiceHub.
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
}
/**
 * CTA Button component
 */
function getButtonHtml(url, text) {
    return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding: 32px 0;">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 16px 40px; background-color: ${emailStyles.accent}; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); transition: all 0.3s ease;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}
/**
 * Generate professional "Set Password" email for new user registration
 */
function generateSetPasswordEmail(name, setPasswordUrl) {
    const content = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td>
          <h2 style="margin: 0 0 16px 0; font-size: 28px; font-weight: bold; color: ${emailStyles.neutral800};">
            Selamat Datang di InvoiceHub! 🎉
          </h2>
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: ${emailStyles.neutral600};">
            Halo <strong>${name}</strong>,
          </p>
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: ${emailStyles.neutral600};">
            Terima kasih telah mendaftar di <strong>InvoiceHub</strong>! Kami sangat senang Anda bergabung dengan kami.
          </p>
          <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${emailStyles.neutral600};">
            Untuk mulai menggunakan akun Anda, silakan klik tombol di bawah ini untuk mengatur password Anda:
          </p>
          
          ${getButtonHtml(setPasswordUrl, 'Atur Password Saya')}
          
          <!-- Alternative link -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding: 24px 0; border-top: 1px solid ${emailStyles.neutral300};">
                <p style="margin: 0 0 12px 0; font-size: 14px; color: ${emailStyles.neutral600};">
                  Jika tombol di atas tidak berfungsi, salin dan tempel link berikut ke browser Anda:
                </p>
                <p style="margin: 0; font-size: 13px; color: ${emailStyles.primaryLight}; word-break: break-all;">
                  <a href="${setPasswordUrl}" target="_blank" style="color: ${emailStyles.primaryLight};">${setPasswordUrl}</a>
                </p>
              </td>
            </tr>
          </table>
          
          <!-- Security notice -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding: 20px; background-color: #fef3c7; border-left: 4px solid ${emailStyles.accent}; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: ${emailStyles.neutral800}; line-height: 1.5;">
                  <strong>⚠️ Catatan Keamanan:</strong><br>
                  Jika Anda tidak mendaftar di InvoiceHub, abaikan email ini. Akun tidak akan dibuat tanpa mengatur password.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
    return getEmailBaseTemplate(content);
}
/**
 * Generate professional "Reset Password" email
 */
function generateResetPasswordEmail(name, resetPasswordUrl) {
    const content = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td>
          <h2 style="margin: 0 0 16px 0; font-size: 28px; font-weight: bold; color: ${emailStyles.neutral800};">
            Reset Password Anda
          </h2>
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: ${emailStyles.neutral600};">
            Halo <strong>${name}</strong>,
          </p>
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: ${emailStyles.neutral600};">
            Kami menerima permintaan untuk mereset password akun InvoiceHub Anda.
          </p>
          <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${emailStyles.neutral600};">
            Klik tombol di bawah ini untuk membuat password baru:
          </p>
          
          ${getButtonHtml(resetPasswordUrl, 'Reset Password Saya')}
          
          <!-- Expiry notice -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding: 20px; background-color: #dbeafe; border-left: 4px solid ${emailStyles.primaryLight}; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px; color: ${emailStyles.neutral800}; line-height: 1.5;">
                  <strong>⏱️ Penting:</strong><br>
                  Link ini akan kadaluarsa dalam <strong>1 jam</strong> untuk keamanan akun Anda.
                </p>
              </td>
            </tr>
          </table>
          
          <!-- Alternative link -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding: 24px 0; border-top: 1px solid ${emailStyles.neutral300};">
                <p style="margin: 0 0 12px 0; font-size: 14px; color: ${emailStyles.neutral600};">
                  Jika tombol di atas tidak berfungsi, salin dan tempel link berikut ke browser Anda:
                </p>
                <p style="margin: 0; font-size: 13px; color: ${emailStyles.primaryLight}; word-break: break-all;">
                  <a href="${resetPasswordUrl}" target="_blank" style="color: ${emailStyles.primaryLight};">${resetPasswordUrl}</a>
                </p>
              </td>
            </tr>
          </table>
          
          <!-- Security notice -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding: 20px; background-color: #fee2e2; border-left: 4px solid #ef4444; border-radius: 8px; margin-top: 24px;">
                <p style="margin: 0; font-size: 14px; color: ${emailStyles.neutral800}; line-height: 1.5;">
                  <strong>🔒 Catatan Keamanan:</strong><br>
                  Jika Anda tidak meminta reset password, abaikan email ini atau hubungi kami segera jika Anda khawatir akan keamanan akun Anda.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
    return getEmailBaseTemplate(content);
}
