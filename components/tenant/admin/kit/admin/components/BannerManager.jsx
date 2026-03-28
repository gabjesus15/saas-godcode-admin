"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Trash2, ChevronUp, ChevronDown, Clock, AlertTriangle, ImageIcon, Loader2, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TABLES } from '../../lib/supabaseTables';
import { uploadImage, validateImageFile } from '../../shared/utils/cloudinary';

const MAX_BANNERS = 8;

function daysUntil(dateStr) {
	const diff = new Date(dateStr).getTime() - Date.now();
	return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ expiresAt }) {
	const days = daysUntil(expiresAt);
	if (days < 0) return <span className="banner-expiry banner-expiry--expired">Expirado</span>;
	if (days === 0) return <span className="banner-expiry banner-expiry--today">Expira hoy</span>;
	if (days <= 3) return <span className="banner-expiry banner-expiry--soon">{days}d restante{days > 1 ? 's' : ''}</span>;
	return <span className="banner-expiry banner-expiry--ok">{days} dias</span>;
}

const BannerManager = ({ branchId, companyId, showNotify }) => {
	const [banners, setBanners] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [expiresAt, setExpiresAt] = useState('');
	const [bannerImageFile, setBannerImageFile] = useState(null);
	const [bannerPreviewUrl, setBannerPreviewUrl] = useState('');
	const addFileInputRef = useRef(null);
	const [uploadingBannerId, setUploadingBannerId] = useState(null);
	const bannersRef = useRef([]);
	bannersRef.current = banners;
	const submitLockRef = useRef(false);
	const expireDebounceRef = useRef(null);
	const draftFileRef = useRef(null);
	const draftPreviewRef = useRef(null);
	draftFileRef.current = bannerImageFile;
	draftPreviewRef.current = bannerPreviewUrl;

	const loadBanners = useCallback(async () => {
		if (!branchId || branchId === 'all') { setBanners([]); setLoading(false); return; }
		setLoading(true);
		try {
			const { data, error } = await supabase
				.from(TABLES.hero_banners)
				.select('id, sort_order, expires_at, is_active, image_url')
				.eq('branch_id', branchId)
				.order('sort_order');
			if (error) throw error;
			setBanners(data || []);
		} catch (err) {
			showNotify?.('Error al cargar banners: ' + (err.message || err), 'error');
		} finally {
			setLoading(false);
		}
	}, [branchId, showNotify]);

	useEffect(() => { loadBanners(); }, [loadBanners]);

	const submitNewBanner = useCallback(async (file, expiresAtLocal, objectPreviewUrl) => {
		if (!file || !expiresAtLocal || submitLockRef.current) return;
		submitLockRef.current = true;
		setSaving(true);
		try {
			const { valid, error: vErr } = validateImageFile(file);
			if (!valid) {
				showNotify?.(vErr || 'Imagen no válida', 'error');
				setSaving(false);
				return;
			}
			const imageUrl = await uploadImage(file, 'menu');
			const list = bannersRef.current;
			const maxOrder = list.reduce((max, b) => Math.max(max, b.sort_order ?? 0), 0);
			const { error } = await supabase
				.from(TABLES.hero_banners)
				.insert({
					branch_id: branchId,
					company_id: companyId,
					image_url: imageUrl,
					sort_order: maxOrder + 1,
					expires_at: new Date(expiresAtLocal).toISOString(),
					is_active: true,
				});
			if (error) throw error;
			showNotify?.('Banner publicado en el menú');
			if (objectPreviewUrl) URL.revokeObjectURL(objectPreviewUrl);
			setExpiresAt('');
			setBannerImageFile(null);
			setBannerPreviewUrl('');
			await loadBanners();
		} catch (err) {
			showNotify?.('Error: ' + (err.message || err), 'error');
		} finally {
			submitLockRef.current = false;
			setSaving(false);
		}
	}, [branchId, companyId, showNotify, loadBanners]);

	const onPickAddImage = useCallback((e) => {
		const file = e.target.files?.[0];
		e.target.value = '';
		if (!file) return;
		const { valid, error: vErr } = validateImageFile(file);
		if (!valid) {
			showNotify?.(vErr || 'Imagen no válida', 'error');
			return;
		}
		if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl);
		const nextPreview = URL.createObjectURL(file);
		setBannerImageFile(file);
		setBannerPreviewUrl(nextPreview);
		if (expiresAt) {
			void submitNewBanner(file, expiresAt, nextPreview);
		}
	}, [bannerPreviewUrl, expiresAt, showNotify, submitNewBanner]);

	const handleReplaceImage = useCallback(async (bannerId, file) => {
		if (!file) return;
		const { valid, error: vErr } = validateImageFile(file);
		if (!valid) {
			showNotify?.(vErr || 'Imagen no válida', 'error');
			return;
		}
		setUploadingBannerId(bannerId);
		try {
			const url = await uploadImage(file, 'menu');
			const { error } = await supabase
				.from(TABLES.hero_banners)
				.update({ image_url: url })
				.eq('id', bannerId);
			if (error) throw error;
			showNotify?.('Imagen actualizada');
			await loadBanners();
		} catch (err) {
			showNotify?.('Error: ' + (err.message || err), 'error');
		} finally {
			setUploadingBannerId(null);
		}
	}, [showNotify, loadBanners]);

	const handleDelete = useCallback(async (bannerId) => {
		if (!window.confirm('¿Eliminar este banner?')) return;
		try {
			const { error } = await supabase.from(TABLES.hero_banners).delete().eq('id', bannerId);
			if (error) throw error;
			showNotify?.('Banner eliminado');
			await loadBanners();
		} catch (err) {
			showNotify?.('Error: ' + (err.message || err), 'error');
		}
	}, [showNotify, loadBanners]);

	const handleReorder = useCallback(async (bannerId, direction) => {
		const idx = banners.findIndex(b => b.id === bannerId);
		if (idx < 0) return;
		const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
		if (swapIdx < 0 || swapIdx >= banners.length) return;

		const updated = [...banners];
		[updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
		const updates = updated.map((b, i) => ({ id: b.id, sort_order: i }));

		setBanners(updated.map((b, i) => ({ ...b, sort_order: i })));
		try {
			await Promise.all(
				updates.map(u =>
					supabase.from(TABLES.hero_banners).update({ sort_order: u.sort_order }).eq('id', u.id)
				)
			);
		} catch (err) {
			showNotify?.('Error al reordenar: ' + (err.message || err), 'error');
			await loadBanners();
		}
	}, [banners, showNotify, loadBanners]);

	const minDate = useMemo(() => {
		const d = new Date();
		d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
		return d.toISOString().slice(0, 16);
	}, []);

	if (!branchId || branchId === 'all') {
		return (
			<div className="banner-manager-empty">
				<AlertTriangle size={18} />
				<span>Selecciona una sucursal para gestionar banners del menú.</span>
			</div>
		);
	}

	return (
		<div className="banner-manager">
			<div className="banner-manager-header">
				<div className="banner-manager-title">
					<ImageIcon size={18} />
					<span>Banners del menú</span>
					<span className="banner-count">{banners.length}/{MAX_BANNERS}</span>
				</div>
			</div>

			{banners.length < MAX_BANNERS && (
				<div className="banner-add-form glass">
					<p className="banner-add-intro">
						Sube una imagen y la fecha y hora en que debe dejar de mostrarse. Se publica en cuanto ambos estén listos.
					</p>
					<div className="banner-add-row">
						<label className="banner-add-label">
							Dejar de mostrar el
							<input
								type="datetime-local"
								value={expiresAt}
								onChange={e => {
									const v = e.target.value;
									setExpiresAt(v);
									if (expireDebounceRef.current) {
										clearTimeout(expireDebounceRef.current);
										expireDebounceRef.current = null;
									}
									if (!draftFileRef.current || !v) return;
									expireDebounceRef.current = setTimeout(() => {
										expireDebounceRef.current = null;
										const f = draftFileRef.current;
										const p = draftPreviewRef.current;
										if (f && v) void submitNewBanner(f, v, p);
									}, 550);
								}}
								min={minDate}
								className="banner-add-input"
								disabled={saving}
							/>
						</label>
						{saving && (
							<span className="banner-add-saving">
								<Loader2 size={16} className="spin" />
								Subiendo…
							</span>
						)}
					</div>
					<div className="banner-add-image-row">
						<input
							ref={addFileInputRef}
							type="file"
							accept="image/*"
							className="banner-file-input-hidden"
							onChange={onPickAddImage}
							disabled={saving}
						/>
						<button
							type="button"
							className="btn btn-sm btn-secondary banner-pick-image-btn"
							onClick={() => addFileInputRef.current?.click()}
							disabled={saving}
						>
							<Upload size={14} />
							{bannerPreviewUrl ? 'Otra imagen' : 'Elegir imagen'}
						</button>
						{!bannerPreviewUrl && (
							<span className="banner-add-hint">JPG o PNG según límites del panel.</span>
						)}
						{bannerPreviewUrl && (
							<div className="banner-add-preview-wrap">
								<Image src={bannerPreviewUrl} alt="" width={200} height={90} className="banner-add-preview" unoptimized />
								<button
									type="button"
									className="btn-text-sm"
									onClick={() => {
										if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl);
										setBannerImageFile(null);
										setBannerPreviewUrl('');
									}}
									disabled={saving}
								>
									Quitar imagen
								</button>
							</div>
						)}
					</div>
				</div>
			)}

			{loading ? (
				<div className="banner-manager-loading"><Loader2 size={24} className="spin" /></div>
			) : banners.length === 0 ? (
				<div className="banner-manager-empty">
					<ImageIcon size={20} style={{ opacity: 0.4 }} />
					<p>No hay banners todavía. Usa el formulario de arriba: imagen + fecha de fin.</p>
				</div>
			) : (
				<div className="banner-list">
					{banners.map((banner, idx) => {
						const isExpired = daysUntil(banner.expires_at) < 0;
						return (
							<div key={banner.id} className={`banner-card glass ${isExpired ? 'banner-card--expired' : ''}`}>
								<div className="banner-card-thumb">
									{banner.image_url ? (
										<Image
											src={banner.image_url}
											alt="Banner"
											width={80}
											height={45}
											className="banner-card-img"
											unoptimized
										/>
									) : (
										<div className="banner-card-img-placeholder"><ImageIcon size={20} /></div>
									)}
								</div>
								<div className="banner-card-info">
									<div className="banner-card-meta">
										<Clock size={12} />
										<ExpiryBadge expiresAt={banner.expires_at} />
									</div>
									<div className="banner-card-image-actions">
										<label className="banner-mini-upload">
											<input
												type="file"
												accept="image/*"
												className="banner-file-input-hidden"
												disabled={uploadingBannerId === banner.id}
												onChange={e => {
													const f = e.target.files?.[0];
													e.target.value = '';
													if (f) handleReplaceImage(banner.id, f);
												}}
											/>
											{uploadingBannerId === banner.id ? (
												<Loader2 size={12} className="spin" />
											) : (
												<>
													<Upload size={12} />
													Cambiar imagen
												</>
											)}
										</label>
									</div>
								</div>
								<div className="banner-card-actions">
									<button
										className="btn-icon-sm"
										onClick={() => handleReorder(banner.id, 'up')}
										disabled={idx === 0}
										title="Subir"
									>
										<ChevronUp size={16} />
									</button>
									<button
										className="btn-icon-sm"
										onClick={() => handleReorder(banner.id, 'down')}
										disabled={idx === banners.length - 1}
										title="Bajar"
									>
										<ChevronDown size={16} />
									</button>
									<button
										className="btn-icon-sm btn-danger"
										onClick={() => handleDelete(banner.id)}
										title="Eliminar"
									>
										<Trash2 size={14} />
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default BannerManager;
