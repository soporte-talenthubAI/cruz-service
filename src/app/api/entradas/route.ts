import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  requireAuth,
  handleApiError,
} from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const eventoId = searchParams.get("eventoId");
    const estado = searchParams.get("estado");

    const userRole = (session.user as { role: string }).role;
    const userId = session.user.id;

    const where: Record<string, unknown> = {};

    if (eventoId) where.eventoId = eventoId;
    if (estado) where.estado = estado;

    // RRPP solo ve sus propias entradas
    if (userRole === "RRPP") {
      where.generadoPorId = userId;
    }

    const entradas = await prisma.entrada.findMany({
      where,
      include: {
        evento: { select: { nombre: true, fecha: true } },
        generadoPor: { select: { nombre: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(entradas);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { nombreInvitado, dniInvitado, emailInvitado, eventoId } = body;

    if (!nombreInvitado || !dniInvitado || !emailInvitado || !eventoId) {
      return errorResponse("Faltan campos obligatorios");
    }

    // Verificar que el evento existe y está activo
    const evento = await prisma.evento.findUnique({
      where: { id: eventoId },
      include: { _count: { select: { entradas: true } } },
    });

    if (!evento || !evento.activo) {
      return errorResponse("Evento no encontrado o inactivo", 404);
    }

    // Verificar capacidad
    if (evento._count.entradas >= evento.capacidad) {
      return errorResponse("El evento está lleno");
    }

    const entrada = await prisma.entrada.create({
      data: {
        nombreInvitado,
        dniInvitado,
        emailInvitado,
        eventoId,
        generadoPorId: session.user.id,
        estado: "PENDIENTE",
      },
      include: {
        evento: { select: { nombre: true, fecha: true } },
        generadoPor: { select: { nombre: true } },
      },
    });

    return successResponse(entrada, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
