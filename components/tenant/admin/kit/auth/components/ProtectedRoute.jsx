"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
    const router = useRouter();
	const [session, setSession] = useState(null);
	const [isAdmin, setIsAdmin] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		const checkAdminAccess = async () => {
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();

			if (cancelled) return;
			if (userError || !user?.email) {
				setSession(null);
				setIsAdmin(false);
				setLoading(false);
				return;
			}

			const { data: isAdmin, error } = await supabase.rpc('is_admin');

			if (cancelled) return;
			if (error) {
				setIsAdmin(false);
			} else {
				setIsAdmin(!!isAdmin);
			}
			setSession({ user });
			setLoading(false);
		};

		checkAdminAccess()
			.catch(() => {
				if (!cancelled) {
					setSession(null);
					setIsAdmin(false);
					setLoading(false);
				}
			});

		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
			if (cancelled) return;
			// Revalidar siempre contra servidor para evitar sesion stale de storage local.
			if (nextSession) {
				checkAdminAccess();
				return;
			}
			setSession(null);
			setIsAdmin(false);
			setLoading(false);
		});

		return () => {
			cancelled = true;
			subscription?.unsubscribe();
		};
	}, []);

	useEffect(() => {
		if (!loading && (!session || !isAdmin)) {
			router.push('/login');
		}
	}, [loading, session, isAdmin, router]);

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#050505' }}>
				<Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
			</div>
		);
	}

	if (!session || !isAdmin) {
		return null;
	}

	return children;
};

export default ProtectedRoute;
