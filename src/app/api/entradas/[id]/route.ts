import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  requireAuth,
  handleApiError,
} from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;

    const entrada = await prisma.entrada.findUnique({
      where: { id },
      include: {
        evento: true,
        generadoPor: { select: { id: true, nombre: true, email: true } },
      },
    });

    if (!entrada) return errorResponse("Entrada no encontrada", 404);

    return successResponse(entrada);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const entrada = await prisma.entrada.update({
      where: { id },
      data: body,
    });

    return successResponse(entrada);
  } catch (error) {
    return handleApiError(error);
  }
}
