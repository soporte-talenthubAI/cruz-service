import { NextResponse } from "next/server";
import { auth } from "./auth";

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function getSession() {
  return auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new AuthError("No autorizado");
  }
  return session;
}

export async function requireRole(...roles: string[]) {
  const session = await requireAuth();
  const userRole = (session.user as { role: string }).role;
  if (!roles.includes(userRole)) {
    throw new AuthError("Sin permisos para esta acción");
  }
  return session;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return errorResponse(error.message, 401);
  }
  console.error("API Error:", error);
  return errorResponse("Error interno del servidor", 500);
}
