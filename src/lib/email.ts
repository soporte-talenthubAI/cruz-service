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

const FROM_EMAIL = process.env.FROM_EMAIL || "Cruz Espacio <entradas@cruzespacio.com>";

// Base URL for images hosted in the app (needs to be absolute for emails)
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

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
}

export async function sendEntradaEmail(data: EntradaEmailData) {
  const resend = getResend();
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.qrCode)}&bgcolor=FFFFFF&color=000000`;
  const bgImageUrl = `${APP_URL}/images/cruz_espacio.jpg`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: data.to,
    subject: `Tu entrada para ${data.eventoNombre} - Cruz Espacio`,
    html: buildEntradaEmailHtml(data, qrImageUrl, bgImageUrl),
  });

  if (error) {
    console.error("Error sending email:", error);
    throw new Error(`Error al enviar email: ${error.message}`);
  }

  return { success: true };
}

function buildEntradaEmailHtml(
  data: EntradaEmailData,
  qrImageUrl: string,
  bgImageUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#000;font-family:Arial,sans-serif;">
  <div style="background-color:#000;color:#fff;max-width:600px;margin:auto;border:1px solid #333;">

    <!-- Header con imagen de fondo CRUZ ESPACIO -->
    <div style="background-image:url('${bgImageUrl}');background-size:cover;background-position:center;padding:60px 20px;text-align:center;">
    </div>

    <!-- Contenido -->
    <div style="padding:40px;text-align:center;">
      <h1 style="color:#C5A059;font-weight:300;letter-spacing:2px;margin:0 0 8px;">TU ENTRADA</h1>
      <p style="color:#aaa;margin:0 0 4px;font-size:14px;">Presentá este código en la entrada junto a tu DNI.</p>

      <!-- QR Code -->
      <div style="background-color:#fff;padding:20px;display:inline-block;margin-top:20px;border-radius:10px;">
        <img src="${qrImageUrl}" width="200" height="200" alt="Código QR" style="display:block;" />
      </div>

      <!-- Datos del invitado -->
      <div style="margin-top:24px;text-align:center;">
        <p style="font-size:18px;font-weight:700;color:#fff;margin:0;">DNI: ${data.dniInvitado}</p>
      </div>

      <!-- Info del evento -->
      <div style="margin-top:30px;border-top:1px solid #222;padding-top:20px;text-align:center;">
        <p style="color:#fff;margin:0 0 8px;font-size:14px;"><strong>Evento:</strong> ${data.eventoNombre}</p>
        <p style="color:#fff;margin:0;font-size:14px;"><strong>Fecha:</strong> ${data.eventoFecha} — ${data.eventoHora}</p>
      </div>

      <!-- Footer -->
      <div style="margin-top:24px;border-top:1px solid #222;padding-top:16px;">
        <p style="font-size:11px;color:#505050;margin:0;">Generado por ${data.generadoPor}</p>
        <p style="font-size:10px;color:#333;margin:4px 0 0;font-family:monospace;">${data.ticketId.slice(0, 12)}</p>
      </div>
    </div>

    <!-- Bottom -->
    <div style="padding:16px;text-align:center;border-top:1px solid #222;">
      <p style="font-size:10px;color:#505050;margin:0;">Cruz Espacio — Sistema de Gestión</p>
    </div>

  </div>
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
    subject: "Restablecer contraseña - Cruz Espacio",
    html: buildPasswordResetEmailHtml(data),
  });

  if (error) {
    console.error("Error sending reset email:", error);
    throw new Error(`Error al enviar email: ${error.message}`);
  }

  return { success: true };
}

// ============================================
// Welcome Email (new user setup password)
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
    subject: "Bienvenido a Cruz Espacio — Configurá tu contraseña",
    html: buildWelcomeEmailHtml({ ...data, rolDisplay: rolLabel[data.rol] || data.rol }),
  });

  if (error) {
    console.error("Error sending welcome email:", error);
    throw new Error(`Error al enviar email: ${error.message}`);
  }

  return { success: true };
}

function buildWelcomeEmailHtml(data: WelcomeEmailData & { rolDisplay: string }): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0A;padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="400" cellpadding="0" cellspacing="0" style="max-width:400px;width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding:32px 0;text-align:center;">
              <div style="font-size:28px;font-weight:700;letter-spacing:6px;color:#C5A059;">CRUZ</div>
              <div style="font-size:11px;letter-spacing:4px;color:#A0A0A0;margin-top:4px;">ESPACIO</div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#111111;border:1px solid #333;border-radius:16px;padding:32px 24px;">
              <div style="font-size:18px;font-weight:700;color:#E8E8E8;margin-bottom:12px;">Bienvenido, ${data.nombre}</div>
              <div style="font-size:14px;color:#A0A0A0;line-height:1.6;margin-bottom:8px;">
                Se creó tu cuenta en Cruz Espacio con el rol de <strong style="color:#C5A059;">${data.rolDisplay}</strong>.
              </div>
              <div style="font-size:14px;color:#A0A0A0;line-height:1.6;margin-bottom:24px;">
                Para empezar, configurá tu contraseña haciendo click en el botón:
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.setupUrl}" style="display:inline-block;background-color:#C5A059;color:#000;font-weight:bold;font-size:16px;padding:15px 30px;border-radius:5px;text-decoration:none;">
                      CONFIGURAR CONTRASEÑA
                    </a>
                  </td>
                </tr>
              </table>
              <div style="font-size:12px;color:#505050;margin-top:24px;line-height:1.5;">
                Este enlace expira en 24 horas.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 0;text-align:center;">
              <div style="font-size:10px;color:#333333;">Cruz Espacio — Sistema de Gestión</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildPasswordResetEmailHtml(data: PasswordResetEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0A;padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="400" cellpadding="0" cellspacing="0" style="max-width:400px;width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding:32px 0;text-align:center;">
              <div style="font-size:28px;font-weight:700;letter-spacing:6px;color:#C5A059;">CRUZ</div>
              <div style="font-size:11px;letter-spacing:4px;color:#A0A0A0;margin-top:4px;">ESPACIO</div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#111111;border:1px solid #333;border-radius:16px;padding:32px 24px;">
              <div style="font-size:18px;font-weight:700;color:#E8E8E8;margin-bottom:12px;">Hola ${data.nombre},</div>
              <div style="font-size:14px;color:#A0A0A0;line-height:1.6;margin-bottom:24px;">
                Recibimos una solicitud para restablecer tu contraseña. Hacé click en el botón de abajo para crear una nueva.
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.resetUrl}" style="display:inline-block;background-color:#C5A059;color:#000;font-weight:bold;font-size:16px;padding:15px 30px;border-radius:5px;text-decoration:none;">
                      RESTABLECER CONTRASEÑA
                    </a>
                  </td>
                </tr>
              </table>
              <div style="font-size:12px;color:#505050;margin-top:24px;line-height:1.5;">
                Este enlace expira en 1 hora. Si no solicitaste este cambio, ignorá este email.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 0;text-align:center;">
              <div style="font-size:10px;color:#333333;">Cruz Espacio — Sistema de Gestión</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
