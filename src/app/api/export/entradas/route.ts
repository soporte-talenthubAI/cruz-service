import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const { searchParams } = new URL(request.url);
    const eventoId = searchParams.get("eventoId");
    const estado = searchParams.get("estado");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (eventoId) where.eventoId = eventoId;
    if (estado) where.estado = estado;

    if (search) {
      where.OR = [
        { nombreInvitado: { contains: search, mode: "insensitive" } },
        { dniInvitado: { contains: search } },
      ];
    }

    const entradas = await prisma.entrada.findMany({
      where,
      include: {
        evento: { select: { nombre: true, fecha: true } },
        generadoPor: { select: { nombre: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10000,
    });

    return successResponse({ entradas });
  } catch (error) {
    return handleApiError(error);
  }
}
