"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const FormSchema = z.object({
	id: z.string(),
	customerId: z.string(),
	amount: z.coerce.number(),
	status: z.enum(["pending", "paid"]),
	date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
	const { customerId, amount, status } = CreateInvoice.parse({
		customerId: formData.get("customerId"),
		amount: formData.get("amount"),
		status: formData.get("status"),
	});
	// convirtiendo a cents para mas precision en numeros
	const amountInCents = amount * 100;
	// crear new dates en formato yyyy-mm-dd
	const date = new Date().toISOString().split("T")[0];
	// sql para insertar a la BD
	await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;

	// revalidar y redirigir
	revalidatePath("/dashboard/invoices");
	// redirigir
	redirect("/dashboard/invoices");

	/* const rawFormData = {
		cutomerId: formData.get("customerId"),
		amount: formData.get("amount"),
		status: formData.get("status"),
	}; */

	// otra forma directa
	// const rawFormData2 = Object.fromEntries(formData.entries());

	// probamos
	// console.log(rawFormData);
	// console.log(typeof rawFormData.amount);
}
