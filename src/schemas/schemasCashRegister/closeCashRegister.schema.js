import {z} from "zod"

export const closeCashRegisterSchema = z.object({
  id_caja: z.number().int().positive({
    message: "El id de la caja debe ser un número positivo",
  }),
  monto_final: z.number().nonnegative({
    message: "El monto final debe ser un número mayor o igual a 0",
  }),
  notas: z.string().optional(),
});