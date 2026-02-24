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

    const evento = await prisma.evento.update({
      where: { id },
      data: body,
    });

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
