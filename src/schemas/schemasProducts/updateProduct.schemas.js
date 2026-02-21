import { z } from "zod";

export const updateProductSchema = z.object({
  nombre: z.string().min(3).optional(),
  precio: z.coerce.number({ 
  invalid_type_error: "Debes ingresar un número válido" 
}).positive(),
  unidad_medida: z.string().optional(),
  stock: z.coerce.number({ 
  invalid_type_error: "Debes ingresar un número válido" 
}).int().optional(),
});

