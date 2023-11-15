import Form from "@/app/ui/invoices/edit-form";
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import { fetchInvoiceById, fetchCustomers } from "@/app/lib/data";

// Además de searchParams, los componentes de la página también aceptan un accesorio llamado params que se puede utilizar para acceder al 'id' de la factura.
export default async function Page({ params }: { params: { id: string } }) {
	// obtenemos el id de la factura
	const id = params.id;
	// console.log(id);

	// obtener los datos de la BD con las llamadas a las funciones en @app/lib/data
	const [invoice, customers] = await Promise.all([
		fetchInvoiceById(id),
		fetchCustomers(),
	]);

	// console.log(invoice);

	return (
		<main>
			<Breadcrumbs
				breadcrumbs={[
					{ label: "Invoices", href: "/dashboard/invoices" },
					{
						label: "Edit Invoice",
						href: `/dashboard/invoices/${id}/edit`,
						active: true,
					},
				]}
			/>
			<Form invoice={invoice} customers={customers} />
		</main>
	);
}
