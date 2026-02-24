import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return errorResponse("Faltan campos obligatorios");
    }

    if (newPassword.length < 6) {
      return errorResponse("La contraseña debe tener al menos 6 caracteres");
    }

    const resetToken = await prisma.resetToken.findUnique({
      where: { token },
      include: { usuario: true },
    });

    if (!resetToken) {
      return errorResponse("Token inválido", 400);
    }

    if (resetToken.used) {
      return errorResponse("Este enlace ya fue utilizado", 400);
    }

    if (resetToken.expiresAt < new Date()) {
      return errorResponse("Este enlace expiró. Solicitá uno nuevo.", 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: resetToken.usuarioId },
        data: { password: hashedPassword },
      }),
      prisma.resetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return successResponse({ message: "Contraseña restablecida correctamente" });
  } catch (error) {
    return handleApiError(error);
  }
}
