import { z } from 'zod';
import { isValidUruguayMobile } from '@/lib/commercial/contact';

export const leadFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "El nombre es demasiado largo").regex(/^[a-zA-ZáéíóúÁÃ‰ÃÃ“ÃšÃ±Ã‘\s\.]+$/, "El nombre contiene caracteres inválidos"),
  phone: z.string().refine(val => isValidUruguayMobile(val), {
    message: "Debe ser un número celular de Uruguay válido (ej: 091234567)"
  }),
  eventType: z.string().min(1, "Seleccioná el tipo de evento"),
  eventDate: z.string().optional(),
  guests: z.string().optional(),
  message: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;
