import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const { searchParams } = new URL(request.url);
    const eventoId = searchParams.get("eventoId");

    if (!eventoId) {
      return errorResponse("eventoId es requerido");
    }

    // Get event with RRPP assignments
    const evento = await prisma.evento.findUnique({
      where: { id: eventoId },
      select: {
        id: true,
        nombre: true,
        fecha: true,
        rrppAsignados: {
          include: {
            usuario: { select: { id: true, nombre: true, email: true } },
          },
        },
      },
    });

    if (!evento) {
      return errorResponse("Evento no encontrado", 404);
    }

    // Get all entradas for this event, grouped by generadoPorId
    const entradas = await prisma.entrada.findMany({
      where: { eventoId },
      select: {
        generadoPorId: true,
        estado: true,
      },
    });

    // Group by RRPP
    const porRrpp: Record<string, { total: number; ingresadas: number }> = {};
    for (const entrada of entradas) {
      if (!porRrpp[entrada.generadoPorId]) {
        porRrpp[entrada.generadoPorId] = { total: 0, ingresadas: 0 };
      }
      porRrpp[entrada.generadoPorId].total++;
      if (entrada.estado === "INGRESADO") {
        porRrpp[entrada.generadoPorId].ingresadas++;
      }
    }

    // Build liquidaciones from RRPP assignments
    const liquidaciones = evento.rrppAsignados.map((asignado) => {
      const stats = porRrpp[asignado.usuario.id] || { total: 0, ingresadas: 0 };
      return {
        rrpp: {
          id: asignado.usuario.id,
          nombre: asignado.usuario.nombre,
          email: asignado.usuario.email,
        },
        montoPorQr: asignado.montoPorQr,
        totalGeneradas: stats.total,
        totalIngresadas: stats.ingresadas,
        montoAPagar: stats.ingresadas * asignado.montoPorQr,
      };
    });

    const totales = {
      totalIngresadas: liquidaciones.reduce((sum, l) => sum + l.totalIngresadas, 0),
      montoTotal: liquidaciones.reduce((sum, l) => sum + l.montoAPagar, 0),
    };

    return successResponse({
      evento: { nombre: evento.nombre, fecha: evento.fecha },
      liquidaciones,
      totales,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
