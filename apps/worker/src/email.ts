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
    const apiKey = process.env.BREVO_API_KEY;
    const senderName = process.env.BREVO_USER_NAME;
    const senderEmail = process.env.BREVO_USER_EMAIL;

    if (!apiKey || !senderName || !senderEmail) {
      console.error("Missing Brevo configuration (API Key, Name, or Email)");
      return { success: false, error: "Brevo configuration missing" };
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: to,
            name: to.split("@")[0],
          },
        ],
        subject: subject || "Notification from Flowentis",
        htmlContent: `<div>${body}</div>`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Brevo API error:", errorData);
      return { success: false, error: errorData };
    }

    const data = await response.json();
    return { success: true, response: data };
  } catch (error: unknown) {
    console.error("Error Sending email:", error);
    return { success: false, error };
  }
}
