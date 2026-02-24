import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || "Cruz Espacio <entradas@cruzespacio.com>";

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
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.qrCode)}&bgcolor=FFFFFF&color=000000`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: data.to,
    subject: `Tu entrada para ${data.eventoNombre} - Cruz Espacio`,
    html: buildEntradaEmailHtml(data, qrImageUrl),
  });

  if (error) {
    console.error("Error sending email:", error);
    throw new Error(`Error al enviar email: ${error.message}`);
  }

  return { success: true };
}

function buildEntradaEmailHtml(data: EntradaEmailData, qrImageUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0A;padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="400" cellpadding="0" cellspacing="0" style="max-width:400px;width:100%;">

          <!-- Card -->
          <tr>
            <td style="background-color:#111111;border:1px solid rgba(245,158,11,0.3);border-radius:16px;overflow:hidden;">

              <!-- Background header with texture overlay -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#0A0A0A;background-image:url('cid:cruz-bg');background-size:cover;background-position:center;padding:32px 24px;text-align:center;">
                    <div style="font-size:28px;font-weight:700;letter-spacing:6px;color:#D4A848;font-family:'Helvetica Neue',Arial,sans-serif;">CRUZ</div>
                    <div style="font-size:11px;letter-spacing:4px;color:#A0A0A0;margin-top:4px;font-family:'Helvetica Neue',Arial,sans-serif;">ESPACIO</div>
                  </td>
                </tr>
              </table>

              <!-- Event info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 24px 8px;">
                    <div style="font-size:18px;font-weight:700;color:#E8E8E8;">${data.eventoNombre}</div>
                    <div style="margin-top:6px;">
                      <span style="font-size:14px;color:#F59E0B;font-weight:500;">${data.eventoFecha}</span>
                      <span style="color:#333333;margin:0 8px;">•</span>
                      <span style="font-size:14px;color:#F59E0B;font-weight:500;">${data.eventoHora}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:16px 24px;">
                    <div style="height:1px;background:linear-gradient(to right,transparent,rgba(245,158,11,0.3),transparent);"></div>
                  </td>
                </tr>
              </table>

              <!-- QR Code -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 24px 16px;">
                    <div style="background-color:#FFFFFF;border-radius:12px;padding:16px;display:inline-block;">
                      <img src="${qrImageUrl}" alt="QR Code" width="200" height="200" style="display:block;border-radius:8px;" />
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Guest info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 24px;">
                    <div style="font-size:20px;font-weight:700;color:#E8E8E8;">${data.nombreInvitado}</div>
                    <div style="font-size:13px;color:#707070;margin-top:4px;">DNI: ${data.dniInvitado}</div>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:16px 24px;border-top:1px solid rgba(255,255,255,0.06);">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:11px;color:#505050;">Generado por ${data.generadoPor}</td>
                        <td align="right" style="font-size:11px;color:#333333;font-family:monospace;">${data.ticketId.slice(0, 12)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Bottom text -->
          <tr>
            <td style="padding:20px 0;text-align:center;">
              <div style="font-size:11px;color:#505050;">Presentá este QR en la entrada del evento</div>
              <div style="font-size:10px;color:#333333;margin-top:4px;">Cruz Espacio — Sistema de Gestión</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
