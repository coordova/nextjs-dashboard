"use server";

import { signIn } from "@/auth";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const FormSchema = z.object({
	id: z.string(),
	customerId: z.string({
		invalid_type_error: "Please select a customer.",
	}),
	amount: z.coerce.number().gt(0, {
		message: "Please enter an amount greater than $0.",
	}),
	status: z.enum(["pending", "paid"], {
		invalid_type_error: "Please select an invoice status",
	}),
	date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

// This is temporary until @types/react-dom is updated
export type State = {
	errors?: {
		customerId?: string[];
		amount?: string[];
		status?: string[];
	};
	message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
	// const { customerId, amount, status } = CreateInvoice.parse({

	// Validate form using Zod
	const validatedFields = CreateInvoice.safeParse({
		customerId: formData.get("customerId"),
		amount: formData.get("amount"),
		status: formData.get("status"),
	});
	// console.log(validatedFields);

	// If form validation fails, return errors early. Otherwise, continue.
	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
			message: "Missing Fields. Failed to Create Invoice.",
		};
	}
	// Prepare data for insertion into the database
	const { customerId, amount, status } = validatedFields.data;
	// convirtiendo a cents para mas precision en numeros
	const amountInCents = amount * 100;
	// crear new dates en formato yyyy-mm-dd
	const date = new Date().toISOString().split("T")[0];

	// Insert data into the database
	try {
		// sql para insertar a la BD
		await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
	} catch (error) {
		// If a database error occurs, return a more specific error.
		return {
			message: "Database Error: Failed to Create Invoice",
		};
	}

	// revalidar
	revalidatePath("/dashboard/invoices");
	//  y redirigir
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

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// ...

export async function updateInvoice(
	id: string,
	prevState: State,
	formData: FormData
) {
	/* const { customerId, amount, status } = UpdateInvoice.parse({
		customerId: formData.get("customerId"),
		amount: formData.get("amount"),
		status: formData.get("status"),
	}); */

	// Validate form using Zod
	const validatedFields = UpdateInvoice.safeParse({
		customerId: formData.get("customerId"),
		amount: formData.get("amount"),
		status: formData.get("status"),
	});
	// If form validation fails, return errors early. Otherwise, continue.
	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
			message: "Missing Fields. Failed to Update Invoice.",
		};
	}
	// Prepare data for insertion into the database
	const { customerId, amount, status } = validatedFields.data;

	const amountInCents = amount * 100;

	try {
		await sql`
			UPDATE invoices
			SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
			WHERE id = ${id}
		`;
	} catch (error) {
		return {
			message: "Database Error: Failed to Update Invoice",
		};
	}

	// Llamar revalidatePathpara borrar el caché del cliente y realizar una nueva solicitud al servidor.
	revalidatePath("/dashboard/invoices");
	// Llamando redirectpara redirigir al usuario a la página de la factura.
	redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
	throw new Error("Failed to Delete Invoice");

	try {
		await sql`DELETE FROM invoices WHERE id = ${id}`;
		revalidatePath("/dashboard/invoices");

		return {
			message: "Deleted Invoice.",
		};
	} catch (error) {
		return {
			message: "Database Error: Failed to Delete Invoice",
		};
	}
}

/*---------------------------*/

export async function authenticate(
	prevState: string | undefined,
	formData: FormData
) {
	try {
		await signIn("credentials", Object.fromEntries(formData));
	} catch (error) {
		if ((error as Error).message.includes("CredentialsSignin")) {
			return "CredentialsSignin";
		}
		throw error;
	}
}
