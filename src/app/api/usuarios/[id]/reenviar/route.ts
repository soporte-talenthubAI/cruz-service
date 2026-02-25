import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import {
  successResponse,
  errorResponse,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: { id: true, email: true, nombre: true, rol: true },
    });

    if (!usuario) {
      return errorResponse("Usuario no encontrado", 404);
    }

    // Invalidate previous tokens
    await prisma.resetToken.updateMany({
      where: { usuarioId: usuario.id, used: false },
      data: { used: true },
    });

    // Create new setup token (24 hours)
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.resetToken.create({
      data: {
        token,
        usuarioId: usuario.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const setupUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    await sendWelcomeEmail({
      to: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      setupUrl,
    });

    return successResponse({ message: "Email reenviado correctamente" });
  } catch (error) {
    return handleApiError(error);
  }
}
