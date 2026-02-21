import { z } from "zod";

export const openCashRegisterSchema = z.object({
  monto_inicial: z.number().positive({
    message: "El monto inicial debe ser un número positivo",
  }),
});
