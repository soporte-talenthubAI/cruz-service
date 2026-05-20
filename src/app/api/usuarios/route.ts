import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

export async function GET() {
  try {
    await requireRole("ADMIN");

    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
        _count: { select: { entradas: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(usuarios);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await request.json();
    const { email, nombre, rol, password } = body;

    if (!email || !nombre || !rol || !password) {
      return errorResponse("Faltan campos obligatorios");
    }

    if (!["RRPP", "PORTERO", "ADMIN"].includes(rol)) {
      return errorResponse("Rol inválido");
    }

    if (typeof password !== "string" || password.length < 6) {
      return errorResponse("La contraseña debe tener al menos 6 caracteres");
    }

    const exists = await prisma.usuario.findUnique({ where: { email } });
    if (exists) {
      return errorResponse("Ya existe un usuario con ese email");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const usuario = await prisma.usuario.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        rol,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    });

    return successResponse(usuario, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
