import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEntradaEmail } from "@/lib/email";
import {
  successResponse,
  errorResponse,
  requireAuth,
  handleApiError,
} from "@/lib/api-utils";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const entrada = await prisma.entrada.findUnique({
      where: { id },
      include: {
        evento: true,
        generadoPor: { select: { nombre: true } },
      },
    });

    if (!entrada) {
      return errorResponse("Entrada no encontrada", 404);
    }

    if (entrada.estado === "INVALIDADO") {
      return errorResponse("No se puede enviar una entrada invalidada");
    }

    // Format date in Spanish
    const fecha = new Date(entrada.evento.fecha);
    const fechaFormateada = fecha.toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    await sendEntradaEmail({
      to: entrada.emailInvitado,
      nombreInvitado: entrada.nombreInvitado,
      dniInvitado: entrada.dniInvitado,
      eventoNombre: entrada.evento.nombre,
      eventoFecha: fechaFormateada,
      eventoHora: entrada.evento.horaApertura,
      qrCode: entrada.qrCode,
      ticketId: entrada.id,
      generadoPor: entrada.generadoPor.nombre,
      brandingBgUrl: entrada.evento.brandingBgUrl || undefined,
      brandingColorPrimary: entrada.evento.brandingColorPrimary || undefined,
      brandingColorText: entrada.evento.brandingColorText || undefined,
    });

    // Update entrada status and email tracking
    const updated = await prisma.entrada.update({
      where: { id },
      data: {
        estado: "ENVIADO",
        emailEnviado: true,
        fechaEnvio: new Date(),
      },
    });

    return successResponse({
      message: "Email enviado correctamente",
      entrada: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
