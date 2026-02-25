import { NextRequest } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
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
    const { email, nombre, rol } = body;

    if (!email || !nombre || !rol) {
      return errorResponse("Faltan campos obligatorios");
    }

    if (!["RRPP", "PORTERO", "ADMIN"].includes(rol)) {
      return errorResponse("Rol inválido");
    }

    const exists = await prisma.usuario.findUnique({ where: { email } });
    if (exists) {
      return errorResponse("Ya existe un usuario con ese email");
    }

    // Generate a random temporary password (user will set their own via email)
    const tempPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

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

    // Create a setup token (24 hours expiry)
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.resetToken.create({
      data: {
        token,
        usuarioId: usuario.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const setupUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    // Send welcome email (don't fail the creation if email fails)
    try {
      await sendWelcomeEmail({
        to: email,
        nombre,
        rol,
        setupUrl,
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    return successResponse(usuario, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
