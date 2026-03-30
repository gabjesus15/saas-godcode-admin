/**
 * Re-export del contrato de delivery alineado con el panel admin.
 * @deprecated Preferir importar desde `lib/delivery-settings`.
 */
export {
	normalizeDeliverySettings,
	normalizeDeliverySettings as parseDeliverySettings,
	computeDeliveryFee,
	effectiveDeliveryPricingMode,
	orderItemsSubtotalFromPayload,
	type DeliverySettingsNormalized,
	type DeliveryNamedArea,
	type DeliveryPricingStrategy,
	type NamedAreaResolution,
} from "./delivery-settings";
