import { Resend } from 'resend';
import type { ProductIdea } from '@/types/ideas';

const resendApiKey = process.env.RESEND_API_KEY;

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  if (!resendClient) {
    resendClient = new Resend(resendApiKey);
  }

  return resendClient;
}

export function generateEmailTemplate(
  ideas: ProductIdea[],
  unsubscribeToken: string,
  baseUrl: string
): string {
  const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${unsubscribeToken}`;

  const ideasList = ideas
    .map(
      (idea) =>
        `<li style="margin-bottom: 1rem;">
          <strong>${escapeHtml(idea.title)}</strong> — ${escapeHtml(idea.elevatorPitch)}
        </li>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #111827; margin-bottom: 1.5rem;">Fresh ideas from Pain2Gain</h2>
        <ul style="list-style: none; padding: 0;">
          ${ideasList}
        </ul>
        <p style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
          <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
        </p>
      </body>
    </html>
  `;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export async function sendDigestEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

