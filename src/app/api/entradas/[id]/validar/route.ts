import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("ADMIN", "PORTERO");
    const { id } = await params;

    // Buscar entrada por qrCode o por id
    const entrada = await prisma.entrada.findFirst({
      where: {
        OR: [{ id }, { qrCode: id }],
      },
      include: {
        evento: { select: { nombre: true, fecha: true, activo: true } },
        generadoPor: { select: { nombre: true } },
      },
    });

    if (!entrada) {
      return errorResponse("QR inválido — entrada no encontrada", 404);
    }

    if (!entrada.evento.activo) {
      return errorResponse("El evento ya no está activo");
    }

    if (entrada.estado === "INVALIDADO") {
      return errorResponse("Esta entrada fue invalidada");
    }

    if (entrada.estado === "INGRESADO") {
      return successResponse(
        {
          status: "already_used",
          message: "Esta entrada ya fue utilizada",
          entrada,
        },
        409
      );
    }

    // Marcar como ingresado
    const updated = await prisma.entrada.update({
      where: { id: entrada.id },
      data: {
        estado: "INGRESADO",
        fechaIngreso: new Date(),
        validadoPorId: session.user.id,
      },
      include: {
        evento: { select: { nombre: true } },
        generadoPor: { select: { nombre: true } },
      },
    });

    return successResponse({
      status: "valid",
      message: "Entrada válida",
      entrada: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
