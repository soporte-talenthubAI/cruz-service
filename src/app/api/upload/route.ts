import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import {
  successResponse,
  errorResponse,
  requireRole,
  handleApiError,
} from "@/lib/api-utils";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("No se proporcionó un archivo");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse("Tipo de archivo no permitido. Usá JPG, PNG, WebP o GIF");
    }

    if (file.size > MAX_SIZE) {
      return errorResponse("El archivo es demasiado grande (máx 5MB)");
    }

    const blob = await put(`branding/${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    return successResponse({ url: blob.url });
  } catch (error) {
    return handleApiError(error);
  }
}
