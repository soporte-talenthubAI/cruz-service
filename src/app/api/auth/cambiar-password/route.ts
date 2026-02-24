import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  requireAuth,
  handleApiError,
} from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return errorResponse("Faltan campos obligatorios");
    }

    if (newPassword.length < 6) {
      return errorResponse("La nueva contraseña debe tener al menos 6 caracteres");
    }

    const user = await prisma.usuario.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return errorResponse("Usuario no encontrado", 404);
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return errorResponse("La contraseña actual es incorrecta", 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.usuario.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return successResponse({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    return handleApiError(error);
  }
}
