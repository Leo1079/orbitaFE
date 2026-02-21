import { z } from "zod";

export const productoSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(150, "Máximo 150 caracteres"),

  precio: z.coerce
    .number({
      required_error: "El precio es obligatorio",
      invalid_type_error: "El precio debe ser un número",
    })
    .positive("El precio debe ser mayor a 0"),

  unidad_medida: z
    .string()
    .min(1, "La unidad de medida es obligatoria")
    .max(50)
    .default("UNIDAD"),

  stock: z.coerce
    .number({ invalid_type_error: "El stock debe ser un número" })
    .int()
    .min(1, "El stock debe ser al menos 1 para registrar el producto"),

  activo: z.coerce
    .number()
    .transform((val) => val === 1)
    .optional(),
});
