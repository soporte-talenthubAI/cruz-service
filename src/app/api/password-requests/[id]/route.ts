import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

// Admin: mark a request as resolved (or reopen)
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await request.json();

    const data: { resuelto?: boolean; resueltoAt?: Date | null } = {};
    if (typeof body.resuelto === "boolean") {
      data.resuelto = body.resuelto;
      data.resueltoAt = body.resuelto ? new Date() : null;
    }

    if (Object.keys(data).length === 0) {
      return errorResponse("Sin cambios");
    }

    const updated = await prisma.passwordResetRequest.update({
      where: { id },
      data,
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

// Admin: delete a request (cleanup)
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    await prisma.passwordResetRequest.delete({ where: { id } });
    return successResponse({ message: "Solicitud eliminada" });
  } catch (error) {
    return handleApiError(error);
  }
}
