import { z } from "zod";

export const expensesSchema = z.object({
  id_caja: z.number().int().positive({ message: "ID de caja inválido" }),
  monto: z.number().positive({ message: "El monto debe ser positivo" }),
  descripcion: z.string().min(5, { message: "La descripción debe tener al menos 5 caracteres" })
});
