import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "AUB Club Portal <noreply@aubclubportal.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${APP_URL}/auth/verify?token=${token}`;
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your AUB Club Portal account",
    html: `
      <p>Hello,</p>
      <p>Click the link below to verify your email address:</p>
      <p><a href="${link}">${link}</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });
}

export async function sendMeetingInviteEmail(
  to: string,
  scheduledAt: string,
  location?: string,
  meetingLink?: string
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Your AUB Club Portal interview is scheduled",
    html: `
      <p>Hello,</p>
      <p>Your interview has been scheduled for <strong>${scheduledAt}</strong>.</p>
      ${location ? `<p>Location: ${location}</p>` : ""}
      ${meetingLink ? `<p>Meeting link: <a href="${meetingLink}">${meetingLink}</a></p>` : ""}
      <p>Good luck!</p>
    `,
  });
}

export async function sendDecisionEmail(
  to: string,
  accepted: boolean
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: accepted
      ? "Congratulations — You've been accepted!"
      : "Your AUB Club Portal application update",
    html: accepted
      ? `<p>Congratulations! We are thrilled to welcome you to the club. We will be in touch with next steps.</p>`
      : `<p>Thank you for your interest. After careful consideration, we are unable to offer you a position at this time. We encourage you to apply again in the future.</p>`,
  });
}
