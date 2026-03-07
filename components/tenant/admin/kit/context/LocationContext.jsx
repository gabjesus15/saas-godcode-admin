"use client";

import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const LocationContext = createContext(null);

const getPublicCompanySlug = () => (
    process.env.NEXT_PUBLIC_PUBLIC_COMPANY_SLUG || process.env.NEXT_PUBLIC_COMPANY_SLUG || ''
).trim();

function getInitialBranch() {
    if (typeof window === 'undefined') {
        return { branch: null, hasValidBranch: false };
    }
    try {
        const saved = window.localStorage.getItem('selectedBranch');
        if (!saved) return { branch: null, hasValidBranch: false };
        const parsed = JSON.parse(saved);
        const hasValid = !!(parsed && parsed.id && String(parsed.id).length > 0);
        return { branch: hasValid ? parsed : null, hasValidBranch: hasValid };
    } catch {
        return { branch: null, hasValidBranch: false };
    }
}

export const LocationProvider = ({ children }) => {
    const initial = getInitialBranch();
    const [selectedBranch, setSelectedBranch] = useState(initial.branch);
    const [allBranches, setAllBranches] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(!initial.hasValidBranch);
    const publicCompanySlug = getPublicCompanySlug();

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                if (!publicCompanySlug) {
                    setAllBranches([]);
                    setLoadingBranches(false);
                    return;
                }

                const { data, error } = await supabase.rpc('get_public_branches', {
                    p_company_slug: publicCompanySlug
                });

                if (error) throw error;

                const mappedBranches = (data || []).map((b) => ({
                    ...b,
                    whatsappUrl: b.whatsapp_url,
                    instagramUrl: b.instagram_url,
                    mapUrl: b.map_url
                }));

                setAllBranches(mappedBranches);

                setSelectedBranch((prev) => {
                    if (!prev?.id) return prev;
                    const valid = mappedBranches.some((b) => b.id === prev.id);
                    if (!valid) {
                        try { window.localStorage.removeItem('selectedBranch'); } catch {}
                        return null;
                    }
                    return prev;
                });
            } catch {
            } finally {
                setLoadingBranches(false);
            }
        };

        fetchBranches();
    }, [publicCompanySlug]);

    useEffect(() => {
        if (!selectedBranch) {
            setIsLocationModalOpen(true);
        }
    }, [selectedBranch]);

    const selectBranch = (branch) => {
        setSelectedBranch(branch);
        try { window.localStorage.setItem('selectedBranch', JSON.stringify(branch)); } catch {}
        setIsLocationModalOpen(false);
    };

    const clearBranch = () => {
        setSelectedBranch(null);
        try { window.localStorage.removeItem('selectedBranch'); } catch {}
        setIsLocationModalOpen(true);
    };

    return (
        <LocationContext.Provider value={{
            selectedBranch,
            selectBranch,
            clearBranch,
            isLocationModalOpen,
            setIsLocationModalOpen,
            allBranches,
            loadingBranches
        }}>
            {children}
        </LocationContext.Provider>
    );
};
