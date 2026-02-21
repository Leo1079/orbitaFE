import { z } from "zod";

export const salesSchema = z.object({
  id_caja: z.number().int().positive({ message: "ID de caja inválido" }),
  metodo_pago: z.enum(["EFECTIVO", "TARJETA", "TRANSFERENCIA"], { message: "Método de pago inválido" }),
  detalles: z.array(
    z.object({
      id_producto: z.number().int().positive({ message: "ID de producto inválido" }),
      cantidad: z.number().int().positive({ message: "Cantidad debe ser positiva" })
    })
  ).nonempty({ message: "La venta debe tener al menos un producto" })
});
