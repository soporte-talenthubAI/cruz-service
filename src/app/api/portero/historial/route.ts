import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole("ADMIN", "PORTERO");
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    const eventoId = searchParams.get("eventoId");
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      validadoPorId: userId,
      estado: "INGRESADO",
    };

    if (eventoId) where.eventoId = eventoId;

    const [entradas, total] = await Promise.all([
      prisma.entrada.findMany({
        where,
        select: {
          id: true,
          nombreInvitado: true,
          dniInvitado: true,
          fechaIngreso: true,
          evento: { select: { nombre: true, fecha: true } },
        },
        orderBy: { fechaIngreso: "desc" },
        skip,
        take: limit,
      }),
      prisma.entrada.count({ where }),
    ]);

    // Also fetch events for filter dropdown
    const eventos = await prisma.evento.findMany({
      where: {
        entradas: { some: { validadoPorId: userId } },
      },
      select: { id: true, nombre: true, fecha: true },
      orderBy: { fecha: "desc" },
    });

    return successResponse({
      entradas,
      eventos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
