import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const RequestIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/u)
  .openapi({ example: "7b5b7a89-0d1a-4f8b-8f5b-cc6e2e55c31d" });

export const LegacyHealthResponseSchema = z
  .object({ status: z.literal("ok") })
  .strict()
  .openapi("LegacyHealthResponse");

export const HealthResponseSchema = z
  .object({ status: z.literal("ok"), service: z.literal("api") })
  .strict()
  .openapi("HealthResponse");

export const DependencyHealthSchema = z
  .object({
    status: z.enum(["ok", "unavailable"]),
    latencyMs: z.number().int().nonnegative().max(60_000)
  })
  .strict()
  .openapi("DependencyHealth");

export const ReadinessResponseSchema = z
  .object({
    status: z.enum(["ready", "not_ready"]),
    dependencies: z.object({ database: DependencyHealthSchema }).strict()
  })
  .strict()
  .openapi("ReadinessResponse");

export const ErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: z
          .string()
          .min(1)
          .max(64)
          .regex(/^[a-z][a-z0-9_]*$/u),
        message: z.string().min(1).max(240),
        requestId: RequestIdSchema
      })
      .strict()
  })
  .strict()
  .openapi("ErrorResponse");

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type ReadinessResponse = z.infer<typeof ReadinessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
