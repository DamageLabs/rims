import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

function formatCode(code: string): string {
  // Format as XXXX-XXXX for readability
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  const formattedCode = formatCode(code);
  const fromEmail = process.env.EMAIL_FROM || 'noreply@example.com';

  if (!resend) {
    console.warn('RESEND_API_KEY not configured. Email not sent.');
    console.log(`Verification code for ${to}: ${formattedCode}`);
    return;
  }

  await resend.emails.send({
    from: fromEmail,
    to,
    subject: 'Your verification code - RIMS',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your verification code</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">RIMS</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">React Inventory Management System</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Your verification code</h2>

          <p>Thanks for signing up for RIMS! Enter the code below to verify your email address and activate your account.</p>

          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; padding: 20px; display: inline-block;">
              <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #0d6efd;">${formattedCode}</span>
            </div>
          </div>

          <p style="color: #666; font-size: 14px; text-align: center;">Enter this code on the verification page</p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

          <p style="color: #999; font-size: 12px; margin-bottom: 0;">
            This code will expire in 24 hours. If you didn't create an account with RIMS, you can safely ignore this email.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
Your verification code for RIMS

Thanks for signing up for RIMS! Enter the code below to verify your email address and activate your account:

${formattedCode}

This code will expire in 24 hours. If you didn't create an account with RIMS, you can safely ignore this email.
    `.trim(),
  });
}
