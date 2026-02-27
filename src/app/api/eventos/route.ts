import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  requireAuth,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userRole = (session.user as { role: string }).role;
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all"; // upcoming | past | all
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "10")));
    const skip = (page - 1) * limit;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build where clause
    const where: Record<string, unknown> = {};

    // Month/year filter for calendar view
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    if (monthParam && yearParam) {
      const m = Number(monthParam);
      const y = Number(yearParam);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0, 23, 59, 59);
      where.fecha = { gte: startDate, lte: endDate };
      where.activo = true;
    } else if (status === "upcoming") {
      where.fecha = { gte: today };
      where.activo = true;
    } else if (status === "past") {
      where.fecha = { lt: today };
    }

    // RRPP solo ve eventos asignados
    if (userRole === "RRPP") {
      where.rrppAsignados = { some: { usuarioId: userId } };
    }

    const orderBy = status === "upcoming"
      ? { fecha: "asc" as const }
      : { fecha: "desc" as const };

    const [eventos, total] = await Promise.all([
      prisma.evento.findMany({
        where,
        include: {
          _count: { select: { entradas: true } },
          entradas: {
            select: { estado: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.evento.count({ where }),
    ]);

    // Map events to include stats
    const eventosConStats = eventos.map((evento) => {
      const estadoCounts = evento.entradas.reduce(
        (acc, e) => {
          acc[e.estado] = (acc[e.estado] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Remove raw entradas array, keep only stats
      const { entradas: _, ...eventoSinEntradas } = evento;

      return {
        ...eventoSinEntradas,
        stats: {
          total: evento._count.entradas,
          pendientes: estadoCounts.PENDIENTE || 0,
          enviadas: estadoCounts.ENVIADO || 0,
          ingresadas: estadoCounts.INGRESADO || 0,
          invalidadas: estadoCounts.INVALIDADO || 0,
        },
      };
    });

    return successResponse({
      eventos: eventosConStats,
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
    await requireRole("ADMIN");

    const body = await request.json();
    const {
      nombre, fecha, horaApertura, tipo, capacidad, flyerUrl,
      rrppAsignados, brandingBgUrl, brandingColorPrimary, brandingColorText,
    } = body;

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
        brandingBgUrl: brandingBgUrl || undefined,
        brandingColorPrimary: brandingColorPrimary || undefined,
        brandingColorText: brandingColorText || undefined,
      },
    });

    // Assign RRPP if provided
    if (rrppAsignados && Array.isArray(rrppAsignados) && rrppAsignados.length > 0) {
      await prisma.eventoUsuario.createMany({
        data: rrppAsignados.map((asignado: { usuarioId: string; montoPorQr?: number }) => ({
          eventoId: evento.id,
          usuarioId: asignado.usuarioId,
          montoPorQr: asignado.montoPorQr || 0,
        })),
      });
    }

    return successResponse(evento, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
