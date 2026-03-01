"use client";

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/formatters';
import './CashOrderDetailPanel.css';

const fmt = (n) => {
	try {
		return formatCurrency(n);
	} catch {
		return `$${(n || 0).toLocaleString('es-CL')}`;
	}
};

const STATUS_LABELS = {
	pending: 'Pendiente',
	active: 'A Cocina',
	completed: 'Completado',
	picked_up: 'Entregado',
	cancelled: 'Cancelado',
};

const PAYMENT_LABELS = {
	online: 'Transferencia',
	transfer: 'Transferencia',
	tarjeta: 'Tarjeta',
	card: 'Tarjeta',
};

function getStatusLabel(status) {
	return STATUS_LABELS[status] || 'Pendiente';
}

function getPaymentLabel(paymentType) {
	return PAYMENT_LABELS[paymentType] || 'Efectivo';
}

function getPaymentSlug(paymentType) {
	if (paymentType === 'online' || paymentType === 'transfer') return 'transfer';
	if (paymentType === 'tarjeta' || paymentType === 'card') return 'card';
	return 'cash';
}

function parseItems(raw) {
	if (Array.isArray(raw)) return raw;
	if (typeof raw === 'string') {
		try {
			const p = JSON.parse(raw);
			return Array.isArray(p) ? p : [];
		} catch {
			return [];
		}
	}
	return [];
}

export default function CashOrderDetailPanel({ order, onClose }) {
	useEffect(() => {
		const onEsc = (e) => {
			if (e.key === 'Escape') onClose();
		};
		if (order) window.addEventListener('keydown', onEsc);
		return () => window.removeEventListener('keydown', onEsc);
	}, [order, onClose]);

	if (!order || typeof document === 'undefined') return null;

	const items = parseItems(order.items);

	const panel = (
		<div
			className="cash-order-detail-overlay"
			onClick={onClose}
			role="presentation"
		>
			<div
				className="cash-order-detail-panel"
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="cash-order-detail-title"
			>
				<div className="cash-order-detail-panel-header">
					<div>
						<h3 id="cash-order-detail-title">
							Pedido #{String(order.id).slice(-4)}
						</h3>
						<span className="cash-order-detail-panel-date">
							{new Date(order.created_at).toLocaleString('es-CL')}
						</span>
					</div>
					<button
						type="button"
						className="cash-order-detail-panel-close"
						onClick={onClose}
						aria-label="Cerrar"
					>
						<X size={22} />
					</button>
				</div>

				<div className="cash-order-detail-panel-body">
					<div className="cash-order-detail-badges">
						<span
							className={`cash-order-detail-badge cash-order-detail-badge-status ${order.status === 'cancelled' ? 'cash-order-detail-badge-status--cancelled' : ''}`}
						>
							{getStatusLabel(order.status)}
						</span>
						<span
							className={`cash-order-detail-badge cash-order-detail-badge-payment cash-order-detail-badge-payment--${getPaymentSlug(order.payment_type)}`}
						>
							{getPaymentLabel(order.payment_type)}
						</span>
					</div>

					<div className="cash-order-detail-block">
						<div className="cash-order-detail-label">Cliente</div>
						<div className="cash-order-detail-value">
							{order.client_name || 'Sin nombre'}
						</div>
						{order.client_phone ? (
							<div className="cash-order-detail-sub">{order.client_phone}</div>
						) : null}
					</div>

					<div className="cash-order-detail-block">
						<div className="cash-order-detail-label">Artículos</div>
						<div className="cash-order-detail-items">
							{items.map((item, i) => {
								const q = Number(item.quantity) || 1;
								const price =
									Number(
										item.has_discount && item.discount_price
											? item.discount_price
											: item.price
									) || 0;
								return (
									<div
										key={`${item.id ?? i}-${i}`}
										className="cash-order-detail-item-row"
									>
										<span>
											{q}x {item.name || 'Producto'}
										</span>
										<strong>{fmt(q * price)}</strong>
									</div>
								);
							})}
						</div>
					</div>

					{order.note ? (
						<div className="cash-order-detail-block">
							<div className="cash-order-detail-label">Nota</div>
							<div className="cash-order-detail-note">{order.note}</div>
						</div>
					) : null}

					<div className={`cash-order-detail-summary cash-order-detail-summary--${order.status === 'cancelled' ? 'cancelled' : getPaymentSlug(order.payment_type)}`}>
						<div className="cash-order-detail-label">Total</div>
						<div className="cash-order-detail-total">
							{fmt(order.total || 0)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);

	return createPortal(panel, document.body);
}
