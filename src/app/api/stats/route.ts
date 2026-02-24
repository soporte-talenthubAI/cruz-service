import { prisma } from "@/lib/prisma";
import {
  successResponse,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

export async function GET() {
  try {
    await requireRole("ADMIN");

    const [
      totalEventos,
      eventosActivos,
      totalEntradas,
      entradasPorEstado,
      totalUsuarios,
      usuariosPorRol,
    ] = await Promise.all([
      prisma.evento.count(),
      prisma.evento.count({ where: { activo: true } }),
      prisma.entrada.count(),
      prisma.entrada.groupBy({
        by: ["estado"],
        _count: { _all: true },
      }),
      prisma.usuario.count({ where: { activo: true } }),
      prisma.usuario.groupBy({
        by: ["rol"],
        _count: { _all: true },
        where: { activo: true },
      }),
    ]);

    const entradasHoy = await prisma.entrada.count({
      where: {
        fechaIngreso: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    const estadoMap = Object.fromEntries(
      entradasPorEstado.map((e) => [e.estado, e._count._all])
    );

    const rolMap = Object.fromEntries(
      usuariosPorRol.map((u) => [u.rol, u._count._all])
    );

    return successResponse({
      eventos: {
        total: totalEventos,
        activos: eventosActivos,
      },
      entradas: {
        total: totalEntradas,
        hoy: entradasHoy,
        pendientes: estadoMap.PENDIENTE || 0,
        enviadas: estadoMap.ENVIADO || 0,
        ingresadas: estadoMap.INGRESADO || 0,
        invalidadas: estadoMap.INVALIDADO || 0,
      },
      usuarios: {
        total: totalUsuarios,
        admins: rolMap.ADMIN || 0,
        rrpp: rolMap.RRPP || 0,
        porteros: rolMap.PORTERO || 0,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
