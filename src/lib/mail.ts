import nodemailer from "nodemailer";

// ─── Transport Setup ────────────────────────────────────────────
// Uses SMTP if SMTP_USER is set, otherwise falls back to Resend API.

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM_EMAIL || SMTP_USER;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8055";

// Detect SMTP host from email domain
function getSmtpConfig() {
  if (!SMTP_USER || !SMTP_PASS) return null;

  const domain = SMTP_USER.split("@")[1]?.toLowerCase() || "";

  if (domain.includes("gmail")) {
    return { host: "smtp.gmail.com", port: 587, secure: false };
  }
  if (domain.includes("outlook") || domain.includes("hotmail") || domain.includes("live")) {
    return { host: "smtp-mail.outlook.com", port: 587, secure: false };
  }
  if (domain.includes("yahoo")) {
    return { host: "smtp.mail.yahoo.com", port: 587, secure: false };
  }
  // Generic SMTP — try common ports
  return { host: `smtp.${domain}`, port: 587, secure: false };
}

const smtpConfig = getSmtpConfig();

const transporter = smtpConfig
  ? nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: { user: SMTP_USER!, pass: SMTP_PASS! },
    })
  : null;

const FROM_ADDRESS = SMTP_FROM || "مكن AI <noreply@makan.ai>";

// ─── Core send function ─────────────────────────────────────────

async function sendMail(to: string, subject: string, html: string) {
  if (transporter) {
    // SMTP
    const info = await transporter.sendMail({
      from: `"مكن AI" <${FROM_ADDRESS}>`,
      to,
      subject,
      html,
    });
    console.log(`[mail/smtp] Sent to ${to}: ${info.messageId}`);
    return { id: info.messageId };
  }

  // Fallback: Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("[mail] No SMTP or Resend config. Email not sent.");
    throw new Error("No email transport configured");
  }

  const { Resend } = await import("resend");
  const resend = new Resend(resendKey);
  const from = process.env.EMAIL_FROM || FROM_ADDRESS;

  const { data, error } = await resend.emails.send({ from, to, subject, html });
  if (error) {
    console.error("[mail/resend] Failed:", error);
    throw new Error(error.message || "فشل إرسال البريد الإلكتروني");
  }
  console.log(`[mail/resend] Sent to ${to}: ${data?.id}`);
  return data;
}

// ─── Invitation Email ───────────────────────────────────────────

interface InvitationEmailParams {
  to: string;
  orgNameAr: string;
  roleTitleAr: string;
  deptNameAr?: string | null;
  inviterNameAr: string;
  token: string;
}

export async function sendInvitationEmail({
  to, orgNameAr, roleTitleAr, deptNameAr, inviterNameAr, token,
}: InvitationEmailParams) {
  const acceptUrl = `${APP_URL}/invitation/accept?token=${token}`;
  const deptLine = deptNameAr ? `<p style="margin:0 0 4px;color:#6B7280;font-size:14px;">القسم: <strong style="color:#1F2937;">${deptNameAr}</strong></p>` : "";

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:'Cairo','Segoe UI',Tahoma,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;">
    <div style="background:linear-gradient(135deg,#7C3AED,#6D28D9);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:800;">مكن<span style="font-size:14px;vertical-align:super;margin-right:2px;">AI</span></h1>
      <p style="margin:8px 0 0;color:#DDD6FE;font-size:14px;">دعوة انضمام</p>
    </div>
    <div style="padding:32px 24px;">
      <p style="margin:0 0 20px;color:#1F2937;font-size:16px;line-height:1.7;">مرحباً،<br/>تمت دعوتك من قبل <strong>${inviterNameAr}</strong> للانضمام إلى:</p>
      <div style="background:#F9FAFB;border-radius:12px;padding:16px 20px;margin:0 0 24px;border:1px solid #E5E7EB;">
        <p style="margin:0 0 4px;color:#6B7280;font-size:14px;">المؤسسة: <strong style="color:#1F2937;">${orgNameAr}</strong></p>
        ${deptLine}
        <p style="margin:0;color:#6B7280;font-size:14px;">الدور: <strong style="color:#7C3AED;">${roleTitleAr}</strong></p>
      </div>
      <p style="margin:0 0 24px;color:#6B7280;font-size:14px;line-height:1.6;">للقبول وإنشاء كلمة المرور الخاصة بك، اضغط على الزر أدناه:</p>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${acceptUrl}" style="display:inline-block;background:#7C3AED;color:#FFFFFF;text-decoration:none;padding:14px 40px;border-radius:12px;font-size:15px;font-weight:700;box-shadow:0 4px 14px rgba(124,58,237,0.25);">قبول الدعوة</a>
      </div>
      <p style="margin:0;color:#9CA3AF;font-size:12px;text-align:center;line-height:1.6;">هذه الدعوة صالحة لمدة 7 أيام. إذا لم تكن تتوقع هذه الرسالة، يمكنك تجاهلها.</p>
    </div>
    <div style="border-top:1px solid #E5E7EB;padding:16px 24px;text-align:center;">
      <p style="margin:0;color:#9CA3AF;font-size:11px;">منصة مكن AI — من علم وماركنير</p>
    </div>
  </div>
</body>
</html>`;

  return sendMail(to, `دعوة انضمام | ${orgNameAr} — مكن AI`, html);
}

// ─── Judge Invitation Email ─────────────────────────────────────

interface JudgeInvitationEmailParams {
  to: string;
  eventNameAr: string;
  trackNameAr?: string | null;
  inviterNameAr: string;
  token: string;
}

export async function sendJudgeInvitationEmail({
  to, eventNameAr, trackNameAr, inviterNameAr, token,
}: JudgeInvitationEmailParams) {
  const acceptUrl = `${APP_URL}/judge/accept?token=${token}`;
  const trackLine = trackNameAr ? `<p style="margin:0 0 4px;color:#6B7280;font-size:14px;">المسار: <strong style="color:#1F2937;">${trackNameAr}</strong></p>` : "";

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:'Cairo','Segoe UI',Tahoma,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;">
    <div style="background:linear-gradient(135deg,#7C3AED,#6D28D9);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:800;">مكن<span style="font-size:14px;vertical-align:super;margin-right:2px;">AI</span></h1>
      <p style="margin:8px 0 0;color:#DDD6FE;font-size:14px;">دعوة تحكيم</p>
    </div>
    <div style="padding:32px 24px;">
      <p style="margin:0 0 20px;color:#1F2937;font-size:16px;line-height:1.7;">مرحباً،<br/>تمت دعوتك من قبل <strong>${inviterNameAr}</strong> للمشاركة كمحكّم في:</p>
      <div style="background:#F9FAFB;border-radius:12px;padding:16px 20px;margin:0 0 24px;border:1px solid #E5E7EB;">
        <p style="margin:0 0 4px;color:#6B7280;font-size:14px;">الفعالية: <strong style="color:#1F2937;">${eventNameAr}</strong></p>
        ${trackLine}
        <p style="margin:0;color:#6B7280;font-size:14px;">الدور: <strong style="color:#7C3AED;">محكّم</strong></p>
      </div>
      <p style="margin:0 0 24px;color:#6B7280;font-size:14px;line-height:1.6;">للقبول وإنشاء حسابك، اضغط على الزر أدناه:</p>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${acceptUrl}" style="display:inline-block;background:#7C3AED;color:#FFFFFF;text-decoration:none;padding:14px 40px;border-radius:12px;font-size:15px;font-weight:700;box-shadow:0 4px 14px rgba(124,58,237,0.25);">قبول الدعوة</a>
      </div>
      <p style="margin:0;color:#9CA3AF;font-size:12px;text-align:center;line-height:1.6;">هذه الدعوة صالحة لمدة 7 أيام. إذا لم تكن تتوقع هذه الرسالة، يمكنك تجاهلها.</p>
    </div>
    <div style="border-top:1px solid #E5E7EB;padding:16px 24px;text-align:center;">
      <p style="margin:0;color:#9CA3AF;font-size:11px;">منصة مكن AI — من علم وماركنير</p>
    </div>
  </div>
</body>
</html>`;

  return sendMail(to, `دعوة تحكيم | ${eventNameAr} — مكن AI`, html);
}

// ─── Phase Advancement Email ────────────────────────────────────

interface PhaseAdvancementEmailParams {
  to: string;
  teamName: string;
  eventName: string;
  phaseName: string;
  nextPhaseName?: string | null;
}

export async function sendPhaseAdvancementEmail({
  to, teamName, eventName, phaseName, nextPhaseName,
}: PhaseAdvancementEmailParams) {
  const nextLine = nextPhaseName ? `<p style="margin:16px 0 0;color:#065F46;font-size:14px;line-height:1.6;">المرحلة القادمة: <strong>${nextPhaseName}</strong></p>` : "";

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:'Cairo','Segoe UI',Tahoma,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;">
    <div style="background:linear-gradient(135deg,#059669,#047857);padding:32px 24px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">&#127881;</div>
      <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:800;">تهانينا! تأهل فريقكم</h1>
      <p style="margin:8px 0 0;color:#A7F3D0;font-size:14px;">نتائج ${phaseName}</p>
    </div>
    <div style="padding:32px 24px;">
      <p style="margin:0 0 20px;color:#1F2937;font-size:16px;line-height:1.7;">مرحباً بأعضاء فريق <strong style="color:#059669;">${teamName}</strong>،</p>
      <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.7;">يسعدنا إبلاغكم بأن فريقكم قد اجتاز <strong>${phaseName}</strong> بنجاح في فعالية <strong>${eventName}</strong>!</p>
      <div style="background:#ECFDF5;border-radius:12px;padding:20px;margin:0 0 24px;border:1px solid #A7F3D0;text-align:center;">
        <p style="margin:0;color:#065F46;font-size:18px;font-weight:700;">متأهل للمرحلة التالية</p>
        ${nextLine}
      </div>
      <p style="margin:0;color:#6B7280;font-size:14px;line-height:1.6;">نتمنى لكم التوفيق والنجاح في المراحل القادمة. استمروا في العمل الرائع!</p>
    </div>
    <div style="border-top:1px solid #E5E7EB;padding:16px 24px;text-align:center;">
      <p style="margin:0;color:#9CA3AF;font-size:11px;">منصة مكن AI — من علم وماركنير</p>
    </div>
  </div>
</body>
</html>`;

  return sendMail(to, `تهانينا! تأهل فريق ${teamName} | ${eventName} — مكن AI`, html);
}

// ─── Phase Elimination Email ────────────────────────────────────

interface PhaseEliminationEmailParams {
  to: string;
  teamName: string;
  eventName: string;
  phaseName: string;
  feedback?: string | null;
}

export async function sendPhaseEliminationEmail({
  to, teamName, eventName, phaseName, feedback,
}: PhaseEliminationEmailParams) {
  const feedbackLine = feedback
    ? `<div style="background:#F3F4F6;border-radius:12px;padding:16px 20px;margin:0 0 24px;border:1px solid #E5E7EB;">
        <p style="margin:0 0 4px;color:#6B7280;font-size:13px;font-weight:600;">ملاحظات:</p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">${feedback}</p>
      </div>`
    : "";

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:'Cairo','Segoe UI',Tahoma,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;">
    <div style="background:linear-gradient(135deg,#4B5563,#374151);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:800;">شكراً لمشاركتكم</h1>
      <p style="margin:8px 0 0;color:#D1D5DB;font-size:14px;">نتائج ${phaseName}</p>
    </div>
    <div style="padding:32px 24px;">
      <p style="margin:0 0 20px;color:#1F2937;font-size:16px;line-height:1.7;">أعضاء فريق <strong>${teamName}</strong> الكرام،</p>
      <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.7;">نشكركم على مشاركتكم المميزة في <strong>${phaseName}</strong> ضمن فعالية <strong>${eventName}</strong>. للأسف، لم يتأهل الفريق للمرحلة التالية هذه المرة.</p>
      ${feedbackLine}
      <div style="background:#EFF6FF;border-radius:12px;padding:20px;margin:0 0 24px;border:1px solid #BFDBFE;">
        <p style="margin:0;color:#1E40AF;font-size:14px;line-height:1.7;">لا تيأسوا! كل تجربة هي فرصة للتعلم والنمو. نتطلع لرؤيتكم في فعاليات قادمة بإذن الله.</p>
      </div>
      <p style="margin:0;color:#6B7280;font-size:14px;line-height:1.6;">نتمنى لكم كل التوفيق في مسيرتكم المهنية.</p>
    </div>
    <div style="border-top:1px solid #E5E7EB;padding:16px 24px;text-align:center;">
      <p style="margin:0;color:#9CA3AF;font-size:11px;">منصة مكن AI — من علم وماركنير</p>
    </div>
  </div>
</body>
</html>`;

  return sendMail(to, `نتائج ${phaseName} | ${eventName} — مكن AI`, html);
}

// ─── Team Edit Request Email ────────────────────────────────────

interface TeamEditRequestEmailParams {
  to: string;
  teamNameAr: string;
  eventNameAr: string;
  adminNameAr: string;
  token: string;
}

export async function sendTeamEditRequestEmail({
  to, teamNameAr, eventNameAr, adminNameAr, token,
}: TeamEditRequestEmailParams) {
  const editUrl = `${APP_URL}/team-edit?token=${token}`;

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:'Cairo','Segoe UI',Tahoma,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;">
    <div style="background:linear-gradient(135deg,#7C3AED,#6D28D9);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:800;">مكن<span style="font-size:14px;vertical-align:super;margin-right:2px;">AI</span></h1>
      <p style="margin:8px 0 0;color:#DDD6FE;font-size:14px;">طلب تعديل بيانات الفريق</p>
    </div>
    <div style="padding:32px 24px;">
      <p style="margin:0 0 20px;color:#1F2937;font-size:16px;line-height:1.7;">مرحباً،<br/>طلب منك <strong>${adminNameAr}</strong> تعديل بيانات فريقك:</p>
      <div style="background:#F9FAFB;border-radius:12px;padding:16px 20px;margin:0 0 24px;border:1px solid #E5E7EB;">
        <p style="margin:0 0 4px;color:#6B7280;font-size:14px;">الفريق: <strong style="color:#1F2937;">${teamNameAr}</strong></p>
        <p style="margin:0;color:#6B7280;font-size:14px;">الفعالية: <strong style="color:#7C3AED;">${eventNameAr}</strong></p>
      </div>
      <p style="margin:0 0 24px;color:#6B7280;font-size:14px;line-height:1.6;">يمكنك تعديل بيانات الفريق من خلال الرابط أدناه. يرجى تسجيل الدخول أولاً ثم الضغط على الزر:</p>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${editUrl}" style="display:inline-block;background:#7C3AED;color:#FFFFFF;text-decoration:none;padding:14px 40px;border-radius:12px;font-size:15px;font-weight:700;box-shadow:0 4px 14px rgba(124,58,237,0.25);">تعديل بيانات الفريق</a>
      </div>
      <p style="margin:0;color:#9CA3AF;font-size:12px;text-align:center;line-height:1.6;">هذا الرابط صالح لمدة 7 أيام ويمكن استخدامه مرة واحدة فقط. إذا لم تكن تتوقع هذه الرسالة، يمكنك تجاهلها.</p>
    </div>
    <div style="border-top:1px solid #E5E7EB;padding:16px 24px;text-align:center;">
      <p style="margin:0;color:#9CA3AF;font-size:11px;">منصة مكن AI — من علم وماركنير</p>
    </div>
  </div>
</body>
</html>`;

  return sendMail(to, `طلب تعديل بيانات الفريق | ${eventNameAr} — مكن AI`, html);
}
