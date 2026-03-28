import { z } from "zod";

export const ticketCategorySchema = z.enum([
	"general",
	"billing",
	"technical",
	"product",
	"account",
]);

export const ticketPrioritySchema = z.enum(["low", "medium", "high", "critical"]);

export const tenantTicketCreateSchema = z.object({
	subject: z.string().trim().min(1, "El asunto es obligatorio"),
	description: z.string().trim().min(1, "La descripción es obligatoria"),
	category: ticketCategorySchema.optional().default("general"),
	priority: ticketPrioritySchema.optional().default("medium"),
});

export const tenantTicketMessageBodySchema = z.object({
	message: z.string().trim().min(1, "El mensaje es obligatorio"),
});
