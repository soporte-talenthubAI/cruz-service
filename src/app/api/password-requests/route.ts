import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

// Public: a user submits a password reset request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, nota } = body;

    if (!email || typeof email !== "string") {
      return errorResponse("Email requerido");
    }

    // Look up user (don't reveal whether it exists in the response)
    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    });

    // Throttle: avoid duplicate pending requests for the same email in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await prisma.passwordResetRequest.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        resuelto: false,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (!recent) {
      await prisma.passwordResetRequest.create({
        data: {
          email: email.toLowerCase().trim(),
          nota: typeof nota === "string" && nota.trim() ? nota.trim().slice(0, 280) : null,
          usuarioId: usuario?.id,
        },
      });
    }

    // Always return success to avoid leaking user existence
    return successResponse({ message: "Solicitud registrada" });
  } catch (error) {
    return handleApiError(error);
  }
}

// Admin: list password reset requests
export async function GET(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const { searchParams } = new URL(request.url);
    const includeResolved = searchParams.get("includeResolved") === "true";

    const requests = await prisma.passwordResetRequest.findMany({
      where: includeResolved ? {} : { resuelto: false },
      orderBy: [{ resuelto: "asc" }, { createdAt: "desc" }],
      include: {
        usuario: {
          select: { id: true, nombre: true, email: true, rol: true, activo: true },
        },
      },
      take: 100,
    });

    return successResponse(requests);
  } catch (error) {
    return handleApiError(error);
  }
}
