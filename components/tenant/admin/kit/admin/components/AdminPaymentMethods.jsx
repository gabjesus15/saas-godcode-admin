"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Loader2, CheckCircle } from 'lucide-react';

const PROVIDER_LABELS = { paypal: 'PayPal', stripe: 'Stripe' };

const METHOD_LABELS = {
	pago_movil: 'Pago Móvil',
	zelle: 'Zelle',
	transferencia_bancaria: 'Transferencia bancaria',
};

const METHOD_FIELDS = {
	pago_movil: [
		{ key: 'banco', label: 'Banco' },
		{ key: 'telefono', label: 'Teléfono' },
		{ key: 'identificacion', label: 'Cédula / Identificación' },
	],
	zelle: [
		{ key: 'email', label: 'Correo Zelle' },
		{ key: 'name', label: 'Nombre titular' },
	],
	transferencia_bancaria: [
		{ key: 'banco', label: 'Banco' },
		{ key: 'tipo_cuenta', label: 'Tipo de cuenta' },
		{ key: 'nro_cuenta', label: 'Número de cuenta' },
		{ key: 'identificacion', label: 'RUT / Cédula' },
		{ key: 'titular', label: 'Nombre titular' },
		{ key: 'email', label: 'Correo (opcional)' },
	],
};

function BranchMethodForm({ methodKey, label, fields, initialValues, saving, onSave }) {
	const [values, setValues] = useState(() => {
		const o = {};
		fields.forEach((f) => { o[f.key] = initialValues[f.key] ?? ''; });
		return o;
	});
	const handleSave = () => {
		const out = {};
		Object.keys(values).forEach((k) => { if (values[k] != null && String(values[k]).trim() !== '') out[k] = String(values[k]).trim(); });
		onSave(Object.keys(out).length ? out : null);
	};
	return (
		<div style={{ marginBottom: '1rem' }}>
			<div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>{label}</div>
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
				{fields.map((f) => (
					<div key={f.key}>
						<label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>{f.label}</label>
						<input
							type="text"
							className="form-input"
							value={values[f.key] ?? ''}
							onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
							placeholder={f.label}
							style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
						/>
					</div>
				))}
			</div>
			<button
				type="button"
				className="form-input"
				style={{ marginTop: '0.5rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
				disabled={saving}
				onClick={handleSave}
			>
				{saving ? <Loader2 size={14} className="animate-spin" style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} /> : null}
				{saving ? 'Guardando…' : 'Guardar'}
			</button>
		</div>
	);
}

export default function AdminPaymentMethods({ showNotify, branches: branchesProp, companyId }) {
	const [loading, setLoading] = useState(true);
	const [connectedAccounts, setConnectedAccounts] = useState([]);
	const [branchMethods, setBranchMethods] = useState([]);
	const [branches, setBranches] = useState(branchesProp || []);
	const [saving, setSaving] = useState(null);
	const [connectingStripe, setConnectingStripe] = useState(false);
	const [connectingPayPal, setConnectingPayPal] = useState(false);
	const [paypalEmail, setPaypalEmail] = useState('');
	const [showPayPalForm, setShowPayPalForm] = useState(false);
	const [savingBranchConfig, setSavingBranchConfig] = useState(null);
	const [branchConfigVersion, setBranchConfigVersion] = useState(0);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch('/api/tenant-payment-methods', { credentials: 'include' });
			const data = await res.json();
			if (!res.ok) {
				showNotify?.(data?.error || 'Error al cargar', 'error');
				return;
			}
			setConnectedAccounts(data.connectedAccounts || []);
			setBranchMethods(data.branchMethods || []);
			if (Array.isArray(data.branches) && data.branches.length > 0) {
				setBranches(data.branches);
			}
		} catch (e) {
			showNotify?.('Error de conexión', 'error');
		} finally {
			setLoading(false);
		}
	}, [showNotify]);

	useEffect(() => {
		load();
	}, [load]);

	const isConnected = (provider) =>
		connectedAccounts.some((a) => a.provider === provider && (a.status === 'active' || a.status === 'pending'));

	const getBranchMethod = (branchId, provider) =>
		branchMethods.find((m) => m.branch_id === branchId && m.provider === provider);

	const setBranchEnabled = useCallback(
		async (branchId, provider, isEnabled) => {
			const key = `${branchId}-${provider}`;
			setSaving(key);
			try {
				const res = await fetch('/api/tenant-payment-methods', {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ branch_id: branchId, provider, is_enabled: isEnabled }),
				});
				const data = await res.json();
				if (!res.ok) {
					showNotify?.(data?.error || 'Error al guardar', 'error');
					return;
				}
				setBranchMethods((prev) => {
					const rest = prev.filter((m) => !(m.branch_id === branchId && m.provider === provider));
					return [...rest, { branch_id: branchId, provider, is_enabled: isEnabled }];
				});
				showNotify?.('Guardado');
			} catch (e) {
				showNotify?.('Error al guardar', 'error');
			} finally {
				setSaving(null);
			}
		},
		[showNotify]
	);

	const saveBranchConfig = useCallback(
		async (branchId, methodKey, values) => {
			const key = `${branchId}-${methodKey}`;
			setSavingBranchConfig(key);
			try {
				const payload = { branch_id: branchId, [methodKey]: values };
				const res = await fetch('/api/tenant-payment-methods/branch-config', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify(payload),
				});
				const data = await res.json();
				if (!res.ok) {
					showNotify?.(data?.error || 'Error al guardar', 'error');
					return;
				}
				showNotify?.('Datos guardados');
				setBranchConfigVersion((v) => v + 1);
				load();
			} catch (e) {
				showNotify?.('Error al guardar', 'error');
			} finally {
				setSavingBranchConfig(null);
			}
		},
		[showNotify, load]
	);

	if (loading) {
		return (
			<div className="settings-container animate-fade" style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
				<Loader2 size={32} className="animate-spin" />
			</div>
		);
	}

	return (
		<div className="settings-container animate-fade">
			<header className="settings-header">
				<CreditCard size={24} />
				<h1>Métodos de pago</h1>
				<p className="settings-subtitle">
					Conecta PayPal y Stripe, activa métodos por sucursal y configura los datos de pago (Pago Móvil, Zelle, transferencia). Solo el dueño o CEO puede ver y editar esta sección.
				</p>
			</header>

			<section className="settings-section" style={{ marginTop: '1.5rem' }}>
				<h2 className="section-title">Cuentas conectadas</h2>
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
					{['paypal', 'stripe'].map((provider) => {
						const account = connectedAccounts.find((a) => a.provider === provider);
						const connected = isConnected(provider);
						return (
							<div
								key={provider}
								style={{
									border: '1px solid var(--border, #e5e7eb)',
									borderRadius: '12px',
									padding: '1rem 1.25rem',
									minWidth: '200px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									gap: '0.75rem',
								}}
							>
								<div>
									<div style={{ fontWeight: 600 }}>{PROVIDER_LABELS[provider]}</div>
									{connected ? (
										<span style={{ fontSize: '0.8rem', color: 'var(--muted, #6b7280)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
											<CheckCircle size={14} />
											{account?.display_name || 'Conectado'}
										</span>
									) : (
										<span style={{ fontSize: '0.8rem', color: 'var(--muted, #6b7280)' }}>No conectado</span>
									)}
								</div>
								{connected && provider === 'paypal' && showPayPalForm ? (
									<div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-end' }}>
										<input
											type="email"
											placeholder="email@cuenta-paypal.com"
											value={paypalEmail}
											onChange={(e) => setPaypalEmail(e.target.value)}
											className="form-input"
											style={{ width: '100%', minWidth: '180px', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
										/>
										<div style={{ display: 'flex', gap: '0.35rem' }}>
											<button
												type="button"
												className="form-input"
												style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
												onClick={() => { setShowPayPalForm(false); setPaypalEmail(''); }}
											>
												Cancelar
											</button>
											<button
												type="button"
												className="form-input"
												style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
												disabled={connectingPayPal || !paypalEmail.trim()}
												onClick={async () => {
													const email = paypalEmail.trim();
													if (!email) return;
													setConnectingPayPal(true);
													try {
														const res = await fetch('/api/tenant-payment-methods/connect/paypal', {
															method: 'POST',
															headers: { 'Content-Type': 'application/json' },
															credentials: 'include',
															body: JSON.stringify({ paypal_email: email }),
														});
														const data = await res.json();
														if (!res.ok) {
															showNotify?.(data?.error || 'Error al conectar', 'error');
															return;
														}
														showNotify?.('Cuenta PayPal actualizada');
														setShowPayPalForm(false);
														setPaypalEmail('');
														load();
													} catch (e) {
														showNotify?.('Error de conexión', 'error');
													} finally {
														setConnectingPayPal(false);
													}
												}}
											>
												{connectingPayPal ? <Loader2 size={14} className="animate-spin" /> : 'Actualizar'}
											</button>
										</div>
									</div>
								) : connected ? (
									provider === 'paypal' ? (
										<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
											<span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Activo</span>
											<button
												type="button"
												className="form-input"
												style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
												onClick={() => {
													setPaypalEmail(account?.display_name || '');
													setShowPayPalForm(true);
												}}
											>
												Cambiar
											</button>
											<button
												type="button"
												className="form-input"
												style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
												onClick={async () => {
													if (!confirm('¿Desconectar esta cuenta PayPal?')) return;
													setConnectingPayPal(true);
													try {
														const res = await fetch('/api/tenant-payment-methods/connect/paypal', {
															method: 'DELETE',
															credentials: 'include',
														});
														const data = await res.json();
														if (!res.ok) {
															showNotify?.(data?.error || 'Error', 'error');
															return;
														}
														showNotify?.('Cuenta PayPal desconectada');
														load();
													} catch (e) {
														showNotify?.('Error de conexión', 'error');
													} finally {
														setConnectingPayPal(false);
													}
												}}
												disabled={connectingPayPal}
											>
												Desconectar
											</button>
										</div>
									) : (
										<span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Activo</span>
									)
								) : provider === 'stripe' ? (
									<button
										type="button"
										className="form-input"
										style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
										disabled={connectingStripe}
										onClick={async () => {
											setConnectingStripe(true);
											try {
												const res = await fetch('/api/tenant-payment-methods/connect/stripe', {
													method: 'POST',
													credentials: 'include',
												});
												const data = await res.json();
												if (!res.ok) {
													showNotify?.(data?.error || 'Error al conectar', 'error');
													return;
												}
												if (data?.url) {
													window.location.href = data.url;
													return;
												}
												showNotify?.('No se recibió enlace de Stripe', 'error');
											} catch (e) {
												showNotify?.('Error de conexión', 'error');
											} finally {
												setConnectingStripe(false);
											}
										}}
									>
										{connectingStripe ? (
											<>
												<Loader2 size={14} className="animate-spin" style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
												Conectando…
											</>
										) : (
											'Conectar'
										)}
									</button>
								) : provider === 'paypal' && showPayPalForm ? (
									<div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-end' }}>
										<input
											type="email"
											placeholder="email@cuenta-paypal.com"
											value={paypalEmail}
											onChange={(e) => setPaypalEmail(e.target.value)}
											className="form-input"
											style={{ width: '100%', minWidth: '180px', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
										/>
										<div style={{ display: 'flex', gap: '0.35rem' }}>
											<button
												type="button"
												className="form-input"
												style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
												onClick={() => { setShowPayPalForm(false); setPaypalEmail(''); }}
											>
												Cancelar
											</button>
											<button
												type="button"
												className="form-input"
												style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
												disabled={connectingPayPal || !paypalEmail.trim()}
												onClick={async () => {
													const email = paypalEmail.trim();
													if (!email) return;
													setConnectingPayPal(true);
													try {
														const res = await fetch('/api/tenant-payment-methods/connect/paypal', {
															method: 'POST',
															headers: { 'Content-Type': 'application/json' },
															credentials: 'include',
															body: JSON.stringify({ paypal_email: email }),
														});
														const data = await res.json();
														if (!res.ok) {
															showNotify?.(data?.error || 'Error al conectar', 'error');
															return;
														}
														showNotify?.('Cuenta PayPal vinculada');
														setShowPayPalForm(false);
														setPaypalEmail('');
														load();
													} catch (e) {
														showNotify?.('Error de conexión', 'error');
													} finally {
														setConnectingPayPal(false);
													}
												}}
											>
												{connectingPayPal ? <Loader2 size={14} className="animate-spin" /> : 'Vincular'}
											</button>
										</div>
									</div>
								) : provider === 'paypal' ? (
									<button
										type="button"
										className="form-input"
										style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
										onClick={() => setShowPayPalForm(true)}
									>
										Conectar
									</button>
								) : null}
							</div>
						);
					})}
				</div>
				<p className="form-hint" style={{ marginTop: '0.75rem' }}>
					Vincula tu cuenta PayPal (email donde recibes pagos) o conecta Stripe para poder aceptar estos métodos en cada sucursal.
				</p>
			</section>

			<section className="settings-section" style={{ marginTop: '1.5rem' }}>
				<h2 className="section-title">Métodos por sucursal</h2>
				<p className="form-hint" style={{ marginBottom: '1rem' }}>
					Activa qué métodos de pago acepta cada sucursal. Solo tendrán efecto cuando la cuenta correspondiente esté conectada arriba.
				</p>
				<div style={{ overflowX: 'auto' }}>
					<table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
						<thead>
							<tr style={{ borderBottom: '2px solid var(--border, #e5e7eb)' }}>
								<th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: 600 }}>Sucursal</th>
								<th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: 600 }}>PayPal</th>
								<th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: 600 }}>Stripe</th>
							</tr>
						</thead>
						<tbody>
							{branches.filter((b) => b.id && b.id !== 'all').map((branch) => (
								<tr key={branch.id} style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}>
									<td style={{ padding: '0.75rem' }}>{branch.name || 'Sin nombre'}</td>
									<td style={{ padding: '0.75rem', textAlign: 'center' }}>
										<input
											type="checkbox"
											checked={getBranchMethod(branch.id, 'paypal')?.is_enabled ?? false}
											onChange={(e) => setBranchEnabled(branch.id, 'paypal', e.target.checked)}
											disabled={saving === `${branch.id}-paypal`}
										/>
									</td>
									<td style={{ padding: '0.75rem', textAlign: 'center' }}>
										<input
											type="checkbox"
											checked={getBranchMethod(branch.id, 'stripe')?.is_enabled ?? false}
											onChange={(e) => setBranchEnabled(branch.id, 'stripe', e.target.checked)}
											disabled={saving === `${branch.id}-stripe`}
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				{branches.filter((b) => b.id && b.id !== 'all').length === 0 && (
					<p style={{ marginTop: '0.75rem', color: 'var(--muted)' }}>No hay sucursales. Crea una desde la configuración del negocio.</p>
				)}
			</section>

			<section className="settings-section" style={{ marginTop: '1.5rem' }}>
				<h2 className="section-title">Datos de pago por sucursal</h2>
				<p className="form-hint" style={{ marginBottom: '1rem' }}>
					Configura los datos de cada método que la plataforma tiene habilitado para tu negocio. Solo aparecen los métodos que te fueron activados.
				</p>
				{branches.filter((b) => b.id && b.id !== 'all').map((branch) => {
					const methods = Array.isArray(branch.payment_methods) ? branch.payment_methods : [];
					const configurable = ['pago_movil', 'zelle', 'transferencia_bancaria'].filter((m) => methods.includes(m));
					if (configurable.length === 0) {
						return (
							<div key={branch.id} style={{ marginBottom: '1.25rem', padding: '0.75rem', background: 'var(--bg-muted, #f3f4f6)', borderRadius: '8px' }}>
								<div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{branch.name || 'Sin nombre'}</div>
								<p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>No hay métodos con datos por configurar en esta sucursal (efectivo y tarjeta no requieren datos; PayPal/Stripe se configuran arriba).</p>
							</div>
						);
					}
					return (
						<div key={branch.id} style={{ marginBottom: '1.5rem', border: '1px solid var(--border, #e5e7eb)', borderRadius: '12px', overflow: 'hidden' }}>
							<div style={{ padding: '0.75rem 1rem', background: 'var(--bg-muted, #f9fafb)', fontWeight: 600 }}>
								{branch.name || 'Sin nombre'}
							</div>
							<div style={{ padding: '1rem' }}>
								{configurable.map((methodKey) => {
									const fields = METHOD_FIELDS[methodKey] || [];
									const current = branch[methodKey] && typeof branch[methodKey] === 'object' ? branch[methodKey] : {};
									const savingKey = `${branch.id}-${methodKey}`;
									return (
										<BranchMethodForm
											key={`${branch.id}-${methodKey}-${branchConfigVersion}`}
											methodKey={methodKey}
											label={METHOD_LABELS[methodKey]}
											fields={fields}
											initialValues={current}
											saving={savingBranchConfig === savingKey}
											onSave={(values) => saveBranchConfig(branch.id, methodKey, values)}
										/>
									);
								})}
							</div>
						</div>
					);
				})}
			</section>
		</div>
	);
}
