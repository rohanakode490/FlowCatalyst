import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  try {
    const response = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to,
      subject: subject || "Auto Generated",
      html: `<div>${body}</div>`,
    });

    console.log("response", response);
    return { success: true, response };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}
