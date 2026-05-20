import { prisma } from "@/lib/prisma";
import {
  successResponse,
  requireAuth,
  handleApiError,
} from "@/lib/api-utils";

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [total, hoy] = await Promise.all([
      prisma.entrada.count({
        where: { generadoPorId: userId },
      }),
      prisma.entrada.count({
        where: {
          generadoPorId: userId,
          createdAt: { gte: startOfDay },
        },
      }),
    ]);

    return successResponse({ total, hoy });
  } catch (error) {
    return handleApiError(error);
  }
}
