import { formatCurrency } from '../../shared/utils/formatters';

export const printOrderTicket = (order, branchName = 'NOMBRE DEL LOCAL', logoUrl = null) => {
	const escapeHtml = (value) =>
		String(value)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');

	// Solo HTTPS (y http en desarrollo) para evitar data:/blob: y posibles abusos
	const safeLogoUrl = (() => {
		if (!logoUrl) return '';
		try {
			const parsed = new URL(logoUrl, window.location.origin);
			if (parsed.protocol === 'https:') return parsed.href;
			if (process.env.NODE_ENV !== 'production' && parsed.protocol === 'http:') return parsed.href;
			return '';
		} catch {
			return '';
		}
	})();

	// Ancho típico para impresoras térmicas 58mm/80mm (aprox. 280px útil)
	const receiptWidth = 280;
	const logoMaxWidth = 180;
	const logoMaxHeight = 48;

	const printWindow = window.open('', '', `width=${receiptWidth + 40},height=600`);
	if (!printWindow) {
		return;
	}

	const itemsHtml = (order.items || []).map(item => {
		const price = (item.has_discount && item.discount_price > 0)
			? Number(item.discount_price)
			: Number(item.price);

		const subtotal = price * (item.quantity || 1);
		const safeQuantity = Number(item.quantity) || 1;
		const safeName = escapeHtml(item.name || '');
		const safeDescription = item.description ? escapeHtml(item.description) : '';

		return `
		<div class="item">
			<div class="row">
				<span class="qty">${safeQuantity}</span>
				<span class="name">${safeName}</span>
				<span class="price">${formatCurrency(subtotal)}</span>
			</div>
			${safeDescription ? `<div class="note">(${safeDescription})</div>` : ''}
		</div>
	`;
	}).join('');

	const safeBranchName = escapeHtml(branchName || 'NOMBRE DEL LOCAL');
	const safeOrderId = escapeHtml(String(order.id || 'PRE').slice(-4));
	const safeClientName = escapeHtml(order.client_name || 'Mostrador');
	const safeOrderNote = order.note ? escapeHtml(order.note) : '';

	const html = `
		<html>
		<head>
			<title>Comanda #${safeOrderId}</title>
			<style>
				@page { margin: 0; }
				body { font-family: 'Courier New', monospace; font-size: 11px; width: 100%; max-width: ${receiptWidth}px; margin: 0 auto; padding: 8px; color: black; background: white; line-height: 1.1; box-sizing: border-box; }
				.header { text-align: center; margin-bottom: 6px; border-bottom: 1px dashed #000; padding-bottom: 6px; }
				.logo { max-width: ${logoMaxWidth}px; max-height: ${logoMaxHeight}px; width: auto; height: auto; display: block; margin: 0 auto 4px; object-fit: contain; filter: grayscale(100%) contrast(1.1); }
				.title { font-size: 14px; font-weight: bold; margin: 0; text-transform: uppercase; }
				.info { font-size: 10px; margin: 0; }
				.items { margin-top: 5px; }
				.item { margin-bottom: 3px; }
				.row { display: flex; justify-content: space-between; align-items: flex-start; }
				.qty { font-weight: bold; margin-right: 5px; min-width: 15px; }
				.name { flex: 1; font-weight: 600; }
				.price { margin-left: 5px; white-space: nowrap; font-size: 11px; }
				.note { font-size: 9px; font-style: italic; margin-left: 20px; margin-top: 0; }
				.total { border-top: 1px dashed #000; margin-top: 5px; padding-top: 5px; text-align: right; font-size: 14px; font-weight: bold; }
				.order-note { margin-top: 6px; font-size: 11px; font-weight: bold; border: 1px solid #000; padding: 3px; text-align: center; }
				.footer { text-align: center; margin-top: 8px; font-size: 9px; }
			</style>
		</head>
		<body>
			<div class="header">
				${safeLogoUrl ? `<img src="${safeLogoUrl}" class="logo" />` : ''}
				<h1 class="title">${safeBranchName}</h1>
				<div style="display: flex; justify-content: space-between; margin-top: 2px;">
					<span class="info">${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
					<span class="info">#${safeOrderId}</span>
				</div>
				<p class="info" style="text-align: left; margin-top: 2px; font-weight: 600;">Cli: ${safeClientName}</p>
			</div>
			<div class="items">${itemsHtml}</div>
			<div class="total">TOTAL: ${formatCurrency(order.total || 0)}</div>
			${safeOrderNote ? `<div class="order-note">NOTA: ${safeOrderNote}</div>` : ''}
			<div class="footer"><p>*** COMANDA ***</p></div>
		</body>
		</html>
	`;

	printWindow.document.write(html);
	printWindow.document.close();

	// Esperar a que el logo cargue antes de imprimir (impresoras térmicas capturan el documento al imprimir)
	const runPrint = () => {
		printWindow.print();
		printWindow.close();
	};
	if (safeLogoUrl) {
		const img = printWindow.document.querySelector('.logo');
		if (img) {
			if (img.complete && img.naturalWidth > 0) {
				setTimeout(runPrint, 100);
			} else {
				const timeout = setTimeout(runPrint, 2000);
				img.onload = () => {
					clearTimeout(timeout);
					setTimeout(runPrint, 150);
				};
				img.onerror = () => {
					clearTimeout(timeout);
					setTimeout(runPrint, 150);
				};
			}
		} else {
			setTimeout(runPrint, 400);
		}
	} else {
		setTimeout(runPrint, 300);
	}
};