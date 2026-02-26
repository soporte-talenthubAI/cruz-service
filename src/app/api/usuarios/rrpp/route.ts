import { prisma } from "@/lib/prisma";
import {
  successResponse,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

export async function GET() {
  try {
    await requireRole("ADMIN");

    const rrpps = await prisma.usuario.findMany({
      where: { rol: "RRPP", activo: true },
      select: { id: true, nombre: true, email: true },
      orderBy: { nombre: "asc" },
    });

    return successResponse(rrpps);
  } catch (error) {
    return handleApiError(error);
  }
}
