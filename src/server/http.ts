import { ZodError } from "zod";

export function apiError(error: unknown) {
  if (error instanceof Response) return error;
  if (error instanceof ZodError) {
    return Response.json(
      { error: "Validation failed", fields: error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  if (error instanceof Error) {
    if (error.message === "FORBIDDEN") return Response.json({ error: "Forbidden" }, { status: 403 });
    if (error.message === "NOT_FOUND") return Response.json({ error: "Record not found" }, { status: 404 });
    if (error.message === "CONFLICT") return Response.json({ error: "Record already exists" }, { status: 409 });
    if (error.message.startsWith("POLICY:")) {
      return Response.json({ error: error.message.slice(7) }, { status: 409 });
    }
    console.error(error);
  }
  return Response.json({ error: "Unexpected server error" }, { status: 500 });
}

export async function readJson(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Response("Content-Type must be application/json", { status: 415 });
  }
  return request.json();
}
