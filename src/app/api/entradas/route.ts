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
    const search = searchParams.get("search");
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const userRole = (session.user as { role: string }).role;
    const userId = session.user.id;

    const where: Record<string, unknown> = {};

    if (eventoId) where.eventoId = eventoId;
    if (estado) where.estado = estado;

    // Search by name or DNI
    if (search) {
      where.OR = [
        { nombreInvitado: { contains: search, mode: "insensitive" } },
        { dniInvitado: { contains: search } },
      ];
    }

    // RRPP solo ve sus propias entradas
    if (userRole === "RRPP") {
      where.generadoPorId = userId;
    }

    const [entradas, total] = await Promise.all([
      prisma.entrada.findMany({
        where,
        include: {
          evento: {
            select: {
              nombre: true, fecha: true, horaApertura: true,
              brandingBgUrl: true, brandingColorPrimary: true, brandingColorText: true,
            },
          },
          generadoPor: { select: { nombre: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.entrada.count({ where }),
    ]);

    return successResponse({
      entradas,
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

    // RRPP must be assigned to the event
    const userRole = (session.user as { role: string }).role;
    if (userRole === "RRPP") {
      const isAssigned = await prisma.eventoUsuario.findUnique({
        where: { eventoId_usuarioId: { eventoId, usuarioId: session.user.id } },
      });
      if (!isAssigned) {
        return errorResponse("No tenés acceso a este evento", 403);
      }
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
        evento: {
          select: {
            nombre: true, fecha: true, horaApertura: true,
            brandingBgUrl: true, brandingColorPrimary: true, brandingColorText: true,
          },
        },
        generadoPor: { select: { nombre: true } },
      },
    });

    return successResponse(entrada, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
