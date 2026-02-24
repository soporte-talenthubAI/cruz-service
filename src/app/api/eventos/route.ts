import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  requireAuth,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

export async function GET() {
  try {
    await requireAuth();

    const eventos = await prisma.evento.findMany({
      where: { activo: true },
      include: {
        _count: { select: { entradas: true } },
      },
      orderBy: { fecha: "desc" },
    });

    return successResponse(eventos);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await request.json();
    const { nombre, fecha, horaApertura, tipo, capacidad, flyerUrl } = body;

    if (!nombre || !fecha || !horaApertura || !capacidad) {
      return errorResponse("Faltan campos obligatorios");
    }

    const evento = await prisma.evento.create({
      data: {
        nombre,
        fecha: new Date(fecha),
        horaApertura,
        tipo: tipo || "NORMAL",
        capacidad: Number(capacidad),
        flyerUrl,
      },
    });

    return successResponse(evento, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
