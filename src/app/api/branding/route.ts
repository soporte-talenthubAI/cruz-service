import { prisma } from "@/lib/prisma";
import {
  successResponse,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

export async function GET() {
  try {
    await requireRole("ADMIN");

    // Get unique branding URLs from existing events
    const eventos = await prisma.evento.findMany({
      where: {
        brandingBgUrl: { not: null },
      },
      select: {
        brandingBgUrl: true,
        nombre: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Deduplicate by URL, keep the first event name as label
    const seen = new Set<string>();
    const imagenes = eventos
      .filter((e) => {
        if (!e.brandingBgUrl || seen.has(e.brandingBgUrl)) return false;
        seen.add(e.brandingBgUrl);
        return true;
      })
      .map((e) => ({
        url: e.brandingBgUrl!,
        usedIn: e.nombre,
      }));

    return successResponse(imagenes);
  } catch (error) {
    return handleApiError(error);
  }
}
