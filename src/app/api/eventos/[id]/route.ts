import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  requireAuth,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;

    const evento = await prisma.evento.findUnique({
      where: { id },
      include: {
        entradas: {
          orderBy: { createdAt: "desc" },
          include: { generadoPor: { select: { nombre: true } } },
        },
        _count: { select: { entradas: true } },
        rrppAsignados: {
          include: {
            usuario: { select: { id: true, nombre: true, email: true } },
          },
        },
      },
    });

    if (!evento) return errorResponse("Evento no encontrado", 404);

    return successResponse(evento);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await request.json();

    // Whitelist allowed fields
    const { rrppAsignados, ...rest } = body;
    const allowed: Record<string, unknown> = {};
    const allowedFields = [
      "nombre", "fecha", "horaApertura", "tipo", "capacidad",
      "flyerUrl", "activo", "brandingBgUrl", "brandingColorPrimary", "brandingColorText",
    ];
    for (const key of allowedFields) {
      if (rest[key] !== undefined) {
        allowed[key] = key === "fecha" ? new Date(rest[key]) : rest[key];
      }
    }

    const evento = await prisma.evento.update({
      where: { id },
      data: allowed,
    });

    // Update RRPP assignments if provided
    if (rrppAsignados && Array.isArray(rrppAsignados)) {
      await prisma.$transaction([
        prisma.eventoUsuario.deleteMany({ where: { eventoId: id } }),
        prisma.eventoUsuario.createMany({
          data: rrppAsignados.map((a: { usuarioId: string; montoPorQr?: number }) => ({
            eventoId: id,
            usuarioId: a.usuarioId,
            montoPorQr: a.montoPorQr || 0,
          })),
        }),
      ]);
    }

    return successResponse(evento);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    await prisma.evento.update({
      where: { id },
      data: { activo: false },
    });

    return successResponse({ message: "Evento desactivado" });
  } catch (error) {
    return handleApiError(error);
  }
}
