import { prisma } from "@/lib/prisma";
import {
  successResponse,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

export async function GET() {
  try {
    const session = await requireRole("ADMIN", "PORTERO");
    const userId = session.user.id;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [estaNoche, totalValidadas, ultimosEscaneos, eventoActivo] =
      await Promise.all([
        // Entries validated tonight by this user
        prisma.entrada.count({
          where: {
            validadoPorId: userId,
            fechaIngreso: { gte: todayStart },
          },
        }),

        // Total entries ever validated by this user
        prisma.entrada.count({
          where: { validadoPorId: userId },
        }),

        // Last 10 scans tonight
        prisma.entrada.findMany({
          where: {
            validadoPorId: userId,
            fechaIngreso: { gte: todayStart },
          },
          select: {
            id: true,
            nombreInvitado: true,
            dniInvitado: true,
            fechaIngreso: true,
            evento: { select: { nombre: true } },
          },
          orderBy: { fechaIngreso: "desc" },
          take: 10,
        }),

        // Next active event
        prisma.evento.findFirst({
          where: {
            activo: true,
            fecha: { gte: todayStart },
          },
          orderBy: { fecha: "asc" },
          include: {
            _count: { select: { entradas: true } },
          },
        }),
      ]);

    // Get stats for the active event if exists
    let eventoStats = null;
    if (eventoActivo) {
      const [total, ingresadas, pendientes] = await Promise.all([
        prisma.entrada.count({ where: { eventoId: eventoActivo.id } }),
        prisma.entrada.count({
          where: { eventoId: eventoActivo.id, estado: "INGRESADO" },
        }),
        prisma.entrada.count({
          where: {
            eventoId: eventoActivo.id,
            estado: { in: ["PENDIENTE", "ENVIADO"] },
          },
        }),
      ]);
      eventoStats = {
        id: eventoActivo.id,
        nombre: eventoActivo.nombre,
        fecha: eventoActivo.fecha,
        horaApertura: eventoActivo.horaApertura,
        capacidad: eventoActivo.capacidad,
        total,
        ingresadas,
        pendientes,
      };
    }

    return successResponse({
      estaNoche,
      totalValidadas,
      ultimosEscaneos,
      eventoActivo: eventoStats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
