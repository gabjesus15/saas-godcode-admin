export {
	formatRutOnInput as formatRut,
	normalizeChilePhoneInput,
	validateRutChile as validateRut,
	validateChileCustomerPhone,
} from "../../../../../../utils/chile-forms";

export const formatCurrency = (amount) => {
	return new Intl.NumberFormat("es-CL", {
		style: "currency",
		currency: "CLP",
	}).format(amount);
};

export const formatTimeElapsed = (dateString) => {
	const diff = new Date() - new Date(dateString);
	const minutes = Math.floor(diff / 60000);
	if (minutes < 60) return `${minutes}m`;
	return `${Math.floor(minutes / 60)}h`;
};
