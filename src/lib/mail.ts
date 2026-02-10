import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "مكن AI <noreply@makan.ai>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8055";

interface InvitationEmailParams {
  to: string;
  orgNameAr: string;
  roleTitleAr: string;
  deptNameAr?: string | null;
  inviterNameAr: string;
  token: string;
}

export async function sendInvitationEmail({
  to,
  orgNameAr,
  roleTitleAr,
  deptNameAr,
  inviterNameAr,
  token,
}: InvitationEmailParams) {
  const acceptUrl = `${APP_URL}/invitation/accept?token=${token}`;

  const deptLine = deptNameAr ? `<p style="margin:0 0 4px;color:#6B7280;font-size:14px;">القسم: <strong style="color:#1F2937;">${deptNameAr}</strong></p>` : "";

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:'Cairo','Segoe UI',Tahoma,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7C3AED,#6D28D9);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:800;">مكن<span style="font-size:14px;vertical-align:super;margin-right:2px;">AI</span></h1>
      <p style="margin:8px 0 0;color:#DDD6FE;font-size:14px;">دعوة انضمام</p>
    </div>

    <!-- Content -->
    <div style="padding:32px 24px;">
      <p style="margin:0 0 20px;color:#1F2937;font-size:16px;line-height:1.7;">
        مرحباً،<br/>
        تمت دعوتك من قبل <strong>${inviterNameAr}</strong> للانضمام إلى:
      </p>

      <div style="background:#F9FAFB;border-radius:12px;padding:16px 20px;margin:0 0 24px;border:1px solid #E5E7EB;">
        <p style="margin:0 0 4px;color:#6B7280;font-size:14px;">المؤسسة: <strong style="color:#1F2937;">${orgNameAr}</strong></p>
        ${deptLine}
        <p style="margin:0;color:#6B7280;font-size:14px;">الدور: <strong style="color:#7C3AED;">${roleTitleAr}</strong></p>
      </div>

      <p style="margin:0 0 24px;color:#6B7280;font-size:14px;line-height:1.6;">
        للقبول وإنشاء كلمة المرور الخاصة بك، اضغط على الزر أدناه:
      </p>

      <div style="text-align:center;margin:0 0 24px;">
        <a href="${acceptUrl}" style="display:inline-block;background:#7C3AED;color:#FFFFFF;text-decoration:none;padding:14px 40px;border-radius:12px;font-size:15px;font-weight:700;box-shadow:0 4px 14px rgba(124,58,237,0.25);">
          قبول الدعوة
        </a>
      </div>

      <p style="margin:0;color:#9CA3AF;font-size:12px;text-align:center;line-height:1.6;">
        هذه الدعوة صالحة لمدة 7 أيام. إذا لم تكن تتوقع هذه الرسالة، يمكنك تجاهلها.
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #E5E7EB;padding:16px 24px;text-align:center;">
      <p style="margin:0;color:#9CA3AF;font-size:11px;">منصة مكن AI — من علم وماركنير</p>
    </div>
  </div>
</body>
</html>`;

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `دعوة انضمام | ${orgNameAr} — مكن AI`,
    html,
  });

  if (error) {
    console.error("[mail] Failed to send invitation:", error);
    throw new Error(error.message || "فشل إرسال البريد الإلكتروني");
  }

  return data;
}
