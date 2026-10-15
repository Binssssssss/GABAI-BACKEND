import { sendEmail } from "@/services/email.service";
import { sendPushNotificationSafely } from "@/services/push-notification.service";

/**
 * "Password changed" alert: an email (reaches the owner even if someone
 * else changed it) plus a push / 🔔 notification on their devices.
 */
export async function notifyPasswordChanged(user: {
  id: string;
  email: string;
  fullName: string;
}): Promise<void> {
  const when = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const firstName =
    user.fullName.trim().split(/\s+/)[0]?.replace(/[<>&"]/g, "") || "there";

  try {
    await sendEmail({
      to: user.email,
      subject: "Your GabAi password was changed",
      text: [
        `Hi ${firstName},`,
        "",
        `The password for your GabAi account was changed on ${when} (Philippine time).`,
        "",
        "If this was you, no action is needed.",
        "If this wasn't you, reset your password right away using \"Forgot Password\" on the GabAi login screen.",
        "",
        "— GabAi Team",
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; background:#F4F1EC; padding:24px;">
          <div style="max-width:440px; margin:0 auto; background:#FFFFFF; border:1px solid #E8E0D6; border-radius:14px; padding:28px; color:#29231E;">
            <div style="font-size:22px; font-weight:800;">Gab<span style="color:#A97C50;">Ai</span></div>
            <p style="font-size:14px; line-height:22px; margin-top:18px;">Hi ${firstName},</p>
            <p style="font-size:14px; line-height:22px;">The password for your GabAi account was changed on <b>${when}</b> (Philippine time).</p>
            <p style="font-size:14px; line-height:22px;">If this was you, no action is needed.</p>
            <p style="font-size:14px; line-height:22px; color:#B42318;"><b>If this wasn't you</b>, reset your password right away using "Forgot Password" on the GabAi login screen.</p>
            <p style="font-size:12px; color:#8A7D72; margin-top:16px;">— GabAi Team</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("[Security] Password changed email failed:", error);
  }

  await sendPushNotificationSafely({
    userId: user.id,
    title: "🔒 Password changed",
    message: "Your GabAi password was updated just now. If this wasn't you, reset it right away.",
    type: "security_password_changed",
    icon: "lock",
    iconColor: "#A97C50",
  });
}
