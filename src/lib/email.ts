import { Resend } from "resend";

// Lazy initialization — avoids crash at build time if API key is missing
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY no está configurada en .env");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL || "Ciclosuma <onboarding@resend.dev>";

// Base URL for images hosted in the app (must be absolute for emails)
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// ============================================
// Design tokens (Ciclosuma dark)
// ============================================
const INK = "#0d0d0d";
const INK_2 = "#141414";
const INK_3 = "#1a1a1a";
const CREAM = "#ebf1e2";
const CREAM_MUTED = "#9a9f93";
const CREAM_FAINT = "#5e6258";
const LIME = "#e3fd8c";
const BORDER = "rgba(235,241,226,0.08)";
const FONT_STACK = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const LOGO_URL = `${APP_URL}/images/logo-ciclosuma-cream.png`;

// ============================================
// Entrada / QR Email
// ============================================

interface EntradaEmailData {
  to: string;
  nombreInvitado: string;
  dniInvitado: string;
  eventoNombre: string;
  eventoFecha: string;
  eventoHora: string;
  qrCode: string;
  ticketId: string;
  generadoPor: string;
  generadoPorRol?: string;
  brandingBgUrl?: string;
  brandingColorPrimary?: string;
  brandingColorText?: string;
  brandingLayout?: "banner" | "centered" | "fullbg";
}

export async function sendEntradaEmail(data: EntradaEmailData) {
  const resend = getResend();
  // QR con paleta de marca (cream bg, ink foreground)
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
    data.qrCode
  )}&bgcolor=ebf1e2&color=0d0d0d&margin=10`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: data.to,
    subject: `Tu entrada para ${data.eventoNombre} — Ciclosuma`,
    html: buildEntradaEmailHtml(data, qrImageUrl),
  });

  if (error) {
    console.error("Error sending email:", error);
    throw new Error(`Error al enviar email: ${error.message}`);
  }

  return { success: true };
}

function buildEntradaEmailHtml(
  data: EntradaEmailData,
  qrImageUrl: string
): string {
  const hasBranding = !!data.brandingBgUrl;
  const layout: "banner" | "centered" | "fullbg" =
    data.brandingLayout === "centered" || data.brandingLayout === "fullbg"
      ? data.brandingLayout
      : "banner";
  const isCentered = layout === "centered";
  const heroBg = isCentered ? (data.brandingColorPrimary || INK) : "transparent";

  // Note: email clients (Outlook in particular) don't reliably honor background-image
  // on nested containers, so fullbg in email degrades to a banner-style hero.
  // Banner / centered render via the heroBlock; fullbg uses the same hero but with
  // a stronger overlay for visual parity.
  const heroBlock = hasBranding
    ? `
      <tr>
        <td style="padding:0;">
          <div style="
            background-image:url('${data.brandingBgUrl}');
            background-size:${isCentered ? "contain" : "cover"};
            background-position:center;
            background-repeat:no-repeat;
            background-color:${heroBg};
            height:200px;
            position:relative;
          ">
            <div style="
              background:linear-gradient(180deg,rgba(13,13,13,0.3) 0%,rgba(13,13,13,0.9) 100%);
              height:100%;
              display:flex;
              flex-direction:column;
              align-items:center;
              justify-content:flex-end;
              padding:20px;
              text-align:center;
            ">
              <h1 style="
                margin:0;
                color:${CREAM};
                font-family:${FONT_STACK};
                font-size:22px;
                font-weight:700;
                letter-spacing:-0.02em;
                line-height:1.2;
              ">${escape(data.eventoNombre)}</h1>
            </div>
          </div>
        </td>
      </tr>`
    : `
      <tr>
        <td style="padding:24px 24px 20px;text-align:center;background-color:${INK};border-bottom:1px solid ${BORDER};">
          <div style="
            color:${CREAM};
            font-family:${FONT_STACK};
            font-size:22px;
            font-weight:700;
            letter-spacing:-0.02em;
            line-height:1.2;
          ">${escape(data.eventoNombre)}</div>
        </td>
      </tr>`;

  // Top brand strip — always rendered above the hero
  const topLogoBlock = `
      <tr>
        <td style="padding:20px 24px 14px;text-align:center;background-color:${INK};border-bottom:1px solid ${BORDER};">
          <img src="${LOGO_URL}" alt="Ciclosuma" width="220" height="50" style="display:inline-block;height:40px;width:auto;" />
        </td>
      </tr>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu entrada — Ciclosuma</title>
</head>
<body style="margin:0;padding:0;background-color:${INK};font-family:${FONT_STACK};color:${CREAM};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${INK};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background-color:${INK};border:1px solid ${BORDER};border-radius:14px;overflow:hidden;">

          ${topLogoBlock}
          ${heroBlock}

          <!-- Date / time strip -->
          <tr>
            <td style="background-color:${INK};padding:14px 24px;border-bottom:1px solid ${BORDER};text-align:center;">
              <span style="
                color:${CREAM_MUTED};
                font-family:${FONT_STACK};
                font-size:11px;
                font-weight:600;
                letter-spacing:0.18em;
                text-transform:uppercase;
              ">${escape(data.eventoFecha)}</span>
              <span style="color:${CREAM_FAINT};margin:0 10px;">•</span>
              <span style="
                color:${CREAM_MUTED};
                font-family:${FONT_STACK};
                font-size:11px;
                font-weight:600;
                letter-spacing:0.18em;
                text-transform:uppercase;
              ">${escape(data.eventoHora)}</span>
            </td>
          </tr>

          <!-- QR -->
          <tr>
            <td style="background-color:${INK};padding:28px 24px 8px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;background-color:${CREAM};border-radius:16px;">
                <tr>
                  <td style="padding:16px;">
                    <img src="${qrImageUrl}" alt="Código QR" width="220" height="220" style="display:block;width:220px;height:220px;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DNI -->
          <tr>
            <td style="background-color:${INK};padding:16px 24px 8px;text-align:center;">
              <div style="
                color:${CREAM_FAINT};
                font-family:${FONT_STACK};
                font-size:10px;
                font-weight:600;
                letter-spacing:0.2em;
                text-transform:uppercase;
                margin-bottom:4px;
              ">Documento</div>
              <div style="
                color:${CREAM};
                font-family:${FONT_STACK};
                font-size:26px;
                font-weight:700;
                letter-spacing:-0.02em;
              ">${escape(data.dniInvitado)}</div>
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="background-color:${INK};padding:16px 24px 24px;text-align:center;">
              <p style="
                margin:0;
                color:${CREAM_MUTED};
                font-family:${FONT_STACK};
                font-size:13px;
                line-height:1.55;
              ">
                Presentá este código en la entrada junto a tu DNI.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:${INK_2};padding:14px 24px;border-top:1px solid ${BORDER};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  ${data.generadoPorRol !== "ADMIN" ? `<td align="left" style="
                    color:${CREAM_FAINT};
                    font-family:${FONT_STACK};
                    font-size:10px;
                    letter-spacing:0.08em;
                    text-transform:uppercase;
                  ">Por ${escape(data.generadoPor)}</td>` : ""}
                  <td align="${data.generadoPorRol === "ADMIN" ? "center" : "right"}" style="
                    color:${CREAM_FAINT};
                    font-family:'SF Mono','Menlo','Consolas',monospace;
                    font-size:10px;
                  ">${escape(data.ticketId.slice(0, 12))}</td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!-- Brand mark -->
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;margin-top:20px;">
          <tr>
            <td align="center" style="padding:8px 0;">
              <img src="${LOGO_URL}" alt="Ciclosuma" width="180" height="40" style="display:inline-block;height:24px;width:auto;opacity:0.6;" />
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================
// Password Reset Email
// ============================================

interface PasswordResetEmailData {
  to: string;
  nombre: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData) {
  const resend = getResend();

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: data.to,
    subject: "Restablecer contraseña — Ciclosuma",
    html: buildPasswordResetEmailHtml(data),
  });

  if (error) {
    console.error("Error sending reset email:", error);
    throw new Error(`Error al enviar email: ${error.message}`);
  }

  return { success: true };
}

// ============================================
// Welcome Email
// ============================================

interface WelcomeEmailData {
  to: string;
  nombre: string;
  rol: string;
  setupUrl: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const resend = getResend();

  const rolLabel: Record<string, string> = {
    RRPP: "RRPP",
    PORTERO: "Seguridad",
    ADMIN: "Administrador",
  };

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: data.to,
    subject: "Bienvenido a Ciclosuma — Configurá tu contraseña",
    html: buildWelcomeEmailHtml({ ...data, rolDisplay: rolLabel[data.rol] || data.rol }),
  });

  if (error) {
    console.error("Error sending welcome email:", error);
    throw new Error(`Error al enviar email: ${error.message}`);
  }

  return { success: true };
}

// ============================================
// Helpers
// ============================================

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildAuthEmailShell({
  heading,
  body,
  ctaLabel,
  ctaUrl,
  fineprint,
}: {
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  fineprint: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:${INK};font-family:${FONT_STACK};color:${CREAM};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${INK};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="460" cellpadding="0" cellspacing="0" border="0" style="max-width:460px;width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding:8px 0 28px;text-align:center;">
              <img src="${LOGO_URL}" alt="Ciclosuma" width="240" height="54" style="display:inline-block;height:36px;width:auto;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="
              background-color:${INK_3};
              border:1px solid ${BORDER};
              border-radius:14px;
              padding:32px 28px;
            ">
              <div style="
                color:${CREAM};
                font-family:${FONT_STACK};
                font-size:20px;
                font-weight:700;
                letter-spacing:-0.02em;
                margin-bottom:14px;
              ">${heading}</div>

              <div style="
                color:${CREAM_MUTED};
                font-family:${FONT_STACK};
                font-size:14px;
                line-height:1.6;
                margin-bottom:28px;
              ">${body}</div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}" style="
                      display:inline-block;
                      background-color:${LIME};
                      color:${INK};
                      font-family:${FONT_STACK};
                      font-weight:600;
                      font-size:15px;
                      letter-spacing:-0.01em;
                      padding:14px 28px;
                      border-radius:10px;
                      text-decoration:none;
                    ">${ctaLabel}</a>
                  </td>
                </tr>
              </table>

              <div style="
                color:${CREAM_FAINT};
                font-family:${FONT_STACK};
                font-size:12px;
                line-height:1.5;
                margin-top:24px;
                text-align:center;
              ">${fineprint}</div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 0 8px;text-align:center;">
              <div style="
                color:${CREAM_FAINT};
                font-family:${FONT_STACK};
                font-size:10px;
                letter-spacing:0.2em;
                text-transform:uppercase;
              ">Ciclosuma</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildWelcomeEmailHtml(
  data: WelcomeEmailData & { rolDisplay: string }
): string {
  return buildAuthEmailShell({
    heading: `Bienvenido, ${escape(data.nombre)}`,
    body: `Se creó tu cuenta en Ciclosuma con el rol de <strong style="color:${CREAM};">${escape(
      data.rolDisplay
    )}</strong>. Para empezar, configurá tu contraseña haciendo click en el botón.`,
    ctaLabel: "Configurar contraseña",
    ctaUrl: data.setupUrl,
    fineprint: "Este enlace expira en 24 horas.",
  });
}

function buildPasswordResetEmailHtml(data: PasswordResetEmailData): string {
  return buildAuthEmailShell({
    heading: `Hola ${escape(data.nombre)}`,
    body: "Recibimos una solicitud para restablecer tu contraseña. Hacé click en el botón de abajo para crear una nueva.",
    ctaLabel: "Restablecer contraseña",
    ctaUrl: data.resetUrl,
    fineprint:
      "Este enlace expira en 1 hora. Si no solicitaste este cambio, ignorá este email.",
  });
}
