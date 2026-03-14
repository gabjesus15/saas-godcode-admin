/**
 * Emails transaccionales para el flujo de onboarding.
 * Usa Resend como proveedor.
 */

const RESEND_API = "https://api.resend.com/emails";

export type OnboardingEmailType =
  | "verification"
  | "welcome"
  | "team_notification"
  | "application_confirmation"
  | "payment_reminder"
  | "plan_expiring"
  | "invoice"
  | "site_ready"
  | "status_suspended"
  | "status_reactivated";

interface BaseEmailParams {
  to: string;
  from: string;
  apiKey: string;
}

interface VerificationEmailParams extends BaseEmailParams {
  type: "verification";
  responsibleName: string;
  businessName: string;
  verifyUrl: string;
}

interface ConfirmationEmailParams extends BaseEmailParams {
  type: "application_confirmation";
  responsibleName: string;
  businessName: string;
  nextStepUrl: string;
}

interface WelcomeEmailParams extends BaseEmailParams {
  type: "welcome";
  responsibleName: string;
  businessName: string;
  panelUrl: string;
}

interface TeamNotificationParams extends BaseEmailParams {
  type: "team_notification";
  businessName: string;
  responsibleName: string;
  email: string;
  sector?: string;
  dashboardUrl: string;
}

interface PaymentReminderParams extends BaseEmailParams {
  type: "payment_reminder";
  responsibleName: string;
  businessName: string;
  amount?: string;
  paymentUrl?: string;
}

interface PlanExpiringParams extends BaseEmailParams {
  type: "plan_expiring";
  responsibleName: string;
  businessName: string;
  expiresAt: string;
  panelUrl?: string;
}

interface InvoiceParams extends BaseEmailParams {
  type: "invoice";
  responsibleName: string;
  businessName: string;
  planName: string;
  amount: string;
  date: string;
  reference?: string;
}

interface SiteReadyParams extends BaseEmailParams {
  type: "site_ready";
  responsibleName: string;
  businessName: string;
  siteUrl: string;
}

interface StatusSuspendedParams extends BaseEmailParams {
  type: "status_suspended";
  responsibleName: string;
  businessName: string;
  panelUrl?: string;
}

interface StatusReactivatedParams extends BaseEmailParams {
  type: "status_reactivated";
  responsibleName: string;
  businessName: string;
  panelUrl?: string;
}

type EmailParams =
  | VerificationEmailParams
  | ConfirmationEmailParams
  | WelcomeEmailParams
  | TeamNotificationParams
  | PaymentReminderParams
  | PlanExpiringParams
  | InvoiceParams
  | SiteReadyParams
  | StatusSuspendedParams
  | StatusReactivatedParams;

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #374151;
  max-width: 560px;
  margin: 0 auto;
`;

function buildVerificationEmail(p: VerificationEmailParams): { subject: string; html: string } {
  const subject = `Verifica tu correo - ${p.businessName}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyles} padding: 24px;">
  <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
    <h1 style="color: #111827; font-size: 20px; margin: 0 0 16px;">Hola, ${p.responsibleName}</h1>
    <p style="margin: 0 0 16px;">Gracias por tu interés en unirte. Para continuar con la solicitud de <strong>${p.businessName}</strong>, verifica tu correo haciendo clic en el enlace:</p>
    <p style="margin: 16px 0;">
      <a href="${p.verifyUrl}" style="display: inline-block; background: #111827; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Verificar mi correo</a>
    </p>
    <p style="margin: 16px 0; font-size: 13px; color: #6b7280;">Si no solicitaste esto, ignora este mensaje. El enlace expira en 24 horas.</p>
  </div>
  <p style="font-size: 12px; color: #9ca3af;">Este es un correo automático. No respondas directamente.</p>
</body>
</html>`;
  return { subject, html };
}

function buildConfirmationEmail(p: ConfirmationEmailParams): { subject: string; html: string } {
  const subject = `Solicitud recibida - ${p.businessName}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyles} padding: 24px;">
  <div style="background: #ecfdf5; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #a7f3d0;">
    <h1 style="color: #065f46; font-size: 20px; margin: 0 0 16px;">✓ Solicitud recibida</h1>
    <p style="margin: 0 0 16px;">Hola, ${p.responsibleName}.</p>
    <p style="margin: 0 0 16px;">Hemos recibido tu solicitud para <strong>${p.businessName}</strong>. Te enviamos un correo de verificación. Una vez verificado, podrás completar los datos del negocio y elegir tu plan.</p>
    <p style="margin: 16px 0;">
      <a href="${p.nextStepUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Ver correo de verificación</a>
    </p>
  </div>
  <p style="font-size: 12px; color: #9ca3af;">Este es un correo automático. No respondas directamente.</p>
</body>
</html>`;
  return { subject, html };
}

function buildWelcomeEmail(p: WelcomeEmailParams): { subject: string; html: string } {
  const subject = `¡Bienvenido, ${p.businessName}!`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyles} padding: 24px;">
  <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; padding: 32px; margin-bottom: 24px;">
    <h1 style="color: #1e40af; font-size: 22px; margin: 0 0 16px;">¡Bienvenido, ${p.responsibleName}!</h1>
    <p style="margin: 0 0 16px;"><strong>${p.businessName}</strong> ya está activo. Ya puedes acceder a tu panel para configurar sucursales, menú y equipo.</p>
    <p style="margin: 24px 0;">
      <a href="${p.panelUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Ir al panel</a>
    </p>
    <p style="margin: 16px 0; font-size: 14px;">Si tienes dudas, nuestro equipo de soporte está para ayudarte.</p>
  </div>
  <p style="font-size: 12px; color: #9ca3af;">Gracias por confiar en nosotros.</p>
</body>
</html>`;
  return { subject, html };
}

function buildTeamNotification(p: TeamNotificationParams): { subject: string; html: string } {
  const subject = `Nueva solicitud: ${p.businessName}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyles} padding: 24px;">
  <div style="background: #fef3c7; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #fcd34d;">
    <h1 style="color: #92400e; font-size: 18px; margin: 0 0 16px;">Nueva solicitud de onboarding</h1>
    <ul style="margin: 0; padding-left: 20px;">
      <li><strong>Negocio:</strong> ${p.businessName}</li>
      <li><strong>Responsable:</strong> ${p.responsibleName}</li>
      <li><strong>Email:</strong> ${p.email}</li>
      ${p.sector ? `<li><strong>Rubro:</strong> ${p.sector}</li>` : ""}
    </ul>
    <p style="margin: 16px 0;">
      <a href="${p.dashboardUrl}" style="display: inline-block; background: #d97706; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">Ver en el panel</a>
    </p>
  </div>
</body>
</html>`;
  return { subject, html };
}

function buildPaymentReminder(p: PaymentReminderParams): { subject: string; html: string } {
  const subject = `Recordatorio de pago - ${p.businessName}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyles} padding: 24px;">
  <div style="background: #fef3c7; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
    <h1 style="color: #92400e; font-size: 20px; margin: 0 0 16px;">Hola, ${p.responsibleName}</h1>
    <p style="margin: 0 0 16px;">Tienes un pago pendiente para <strong>${p.businessName}</strong>.</p>
    ${p.amount ? `<p style="margin: 0 0 16px;"><strong>Monto:</strong> ${p.amount}</p>` : ""}
    ${p.paymentUrl ? `<p style="margin: 16px 0;"><a href="${p.paymentUrl}" style="display: inline-block; background: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Pagar ahora</a></p>` : ""}
  </div>
</body>
</html>`;
  return { subject, html };
}

function buildPlanExpiring(p: PlanExpiringParams): { subject: string; html: string } {
  const subject = `Tu plan vence pronto - ${p.businessName}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyles} padding: 24px;">
  <div style="background: #fef3c7; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
    <h1 style="color: #92400e; font-size: 20px; margin: 0 0 16px;">Hola, ${p.responsibleName}</h1>
    <p style="margin: 0 0 16px;">La suscripción de <strong>${p.businessName}</strong> vence el <strong>${p.expiresAt}</strong>. Renueva para seguir activo.</p>
    ${p.panelUrl ? `<p style="margin: 16px 0;"><a href="${p.panelUrl}" style="display: inline-block; background: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Ir al panel</a></p>` : ""}
  </div>
</body>
</html>`;
  return { subject, html };
}

function buildInvoice(p: InvoiceParams): { subject: string; html: string } {
  const subject = `Factura / Resumen de pago - ${p.businessName}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyles} padding: 24px;">
  <div style="background: #f0fdf4; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #86efac;">
    <h1 style="color: #166534; font-size: 20px; margin: 0 0 16px;">Resumen de pago</h1>
    <p style="margin: 0 0 8px;">Hola, ${p.responsibleName}.</p>
    <p style="margin: 0 0 16px;">Detalle del pago para <strong>${p.businessName}</strong>:</p>
    <ul style="margin: 0; padding-left: 20px;">
      <li><strong>Plan:</strong> ${p.planName}</li>
      <li><strong>Monto:</strong> ${p.amount}</li>
      <li><strong>Fecha:</strong> ${p.date}</li>
      ${p.reference ? `<li><strong>Referencia:</strong> ${p.reference}</li>` : ""}
    </ul>
  </div>
</body>
</html>`;
  return { subject, html };
}

function buildSiteReady(p: SiteReadyParams): { subject: string; html: string } {
  const subject = `Tu sitio está listo - ${p.businessName}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyles} padding: 24px;">
  <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 32px; margin-bottom: 24px;">
    <h1 style="color: #065f46; font-size: 22px; margin: 0 0 16px;">¡Todo listo, ${p.responsibleName}!</h1>
    <p style="margin: 0 0 16px;">La página de <strong>${p.businessName}</strong> ya está configurada y lista para funcionar.</p>
    <p style="margin: 24px 0;"><a href="${p.siteUrl}" style="display: inline-block; background: #059669; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Ver mi sitio</a></p>
  </div>
</body>
</html>`;
  return { subject, html };
}

function buildStatusSuspended(p: StatusSuspendedParams): { subject: string; html: string } {
  const subject = `Suscripción suspendida - ${p.businessName}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyles} padding: 24px;">
  <div style="background: #fef2f2; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #fecaca;">
    <h1 style="color: #991b1b; font-size: 20px; margin: 0 0 16px;">Hola, ${p.responsibleName}</h1>
    <p style="margin: 0 0 16px;">La suscripción de <strong>${p.businessName}</strong> ha sido suspendida. Para reactivar, contacta a soporte o renueva tu plan.</p>
    ${p.panelUrl ? `<p style="margin: 16px 0;"><a href="${p.panelUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Ir al panel</a></p>` : ""}
  </div>
</body>
</html>`;
  return { subject, html };
}

function buildStatusReactivated(p: StatusReactivatedParams): { subject: string; html: string } {
  const subject = `Cuenta reactivada - ${p.businessName}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyles} padding: 24px;">
  <div style="background: #ecfdf5; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #a7f3d0;">
    <h1 style="color: #065f46; font-size: 20px; margin: 0 0 16px;">Hola, ${p.responsibleName}</h1>
    <p style="margin: 0 0 16px;">La cuenta de <strong>${p.businessName}</strong> ha sido reactivada. Ya puedes acceder de nuevo.</p>
    ${p.panelUrl ? `<p style="margin: 16px 0;"><a href="${p.panelUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Ir al panel</a></p>` : ""}
  </div>
</body>
</html>`;
  return { subject, html };
}

export async function sendOnboardingEmail(params: EmailParams): Promise<{ ok: boolean; error?: string }> {
  const apiKey = params.apiKey;
  const from = params.from;

  if (!apiKey || !from) {
    return { ok: false, error: "Email provider not configured" };
  }

  let subject: string;
  let html: string;

  switch (params.type) {
    case "verification":
      ({ subject, html } = buildVerificationEmail(params));
      break;
    case "application_confirmation":
      ({ subject, html } = buildConfirmationEmail(params));
      break;
    case "welcome":
      ({ subject, html } = buildWelcomeEmail(params));
      break;
    case "team_notification":
      ({ subject, html } = buildTeamNotification(params));
      break;
    case "payment_reminder":
      ({ subject, html } = buildPaymentReminder(params));
      break;
    case "plan_expiring":
      ({ subject, html } = buildPlanExpiring(params));
      break;
    case "invoice":
      ({ subject, html } = buildInvoice(params));
      break;
    case "site_ready":
      ({ subject, html } = buildSiteReady(params));
      break;
    case "status_suspended":
      ({ subject, html } = buildStatusSuspended(params));
      break;
    case "status_reactivated":
      ({ subject, html } = buildStatusReactivated(params));
      break;
    default:
      return { ok: false, error: "Unknown email type" };
  }

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: params.to, subject, html }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text || "Email send failed" };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: msg };
  }
}
