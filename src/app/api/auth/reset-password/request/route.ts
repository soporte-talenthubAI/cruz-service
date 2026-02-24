import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return errorResponse("El email es obligatorio");
    }

    // Always return success to not leak whether the email exists
    const user = await prisma.usuario.findUnique({
      where: { email },
    });

    if (user && user.activo) {
      // Invalidate previous tokens
      await prisma.resetToken.updateMany({
        where: { usuarioId: user.id, used: false },
        data: { used: true },
      });

      // Create new token (expires in 1 hour)
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.resetToken.create({
        data: {
          token,
          usuarioId: user.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

      await sendPasswordResetEmail({
        to: user.email,
        nombre: user.nombre,
        resetUrl,
      });
    }

    return successResponse({
      message: "Si el email existe, recibirás un enlace para restablecer tu contraseña",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
