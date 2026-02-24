import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
        _count: { select: { entradas: true } },
      },
    });

    if (!usuario) return errorResponse("Usuario no encontrado", 404);

    return successResponse(usuario);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await request.json();

    // Si se cambia la contraseña, hashearla
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 12);
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: body,
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
      },
    });

    return successResponse(usuario);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    await prisma.usuario.update({
      where: { id },
      data: { activo: false },
    });

    return successResponse({ message: "Usuario desactivado" });
  } catch (error) {
    return handleApiError(error);
  }
}
