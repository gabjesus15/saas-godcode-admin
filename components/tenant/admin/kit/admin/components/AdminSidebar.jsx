"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChefHat, ShoppingBag, BarChart3, Users, UserPlus, List, LogOut, DollarSign, Store, ChevronDown, ClipboardList } from 'lucide-react';
const cashIcon = '/tenant/cash.svg';
const categoryIcon = '/tenant/category.svg';

const CashIcon = ({ size }) => (
    <img 
        src={cashIcon} 
        alt="Caja" 
        style={{ 
            width: size, 
            height: size, 
            filter: 'brightness(0) invert(1)',
            opacity: 0.9 
        }} 
    />
);

const CategoryIcon = ({ size }) => (
    <img 
        src={categoryIcon} 
        alt="Categorías" 
        style={{ 
            width: size, 
            height: size, 
            filter: 'brightness(0) invert(1)',
            opacity: 0.9 
        }} 
    />
);

const AdminSidebar = ({ activeTab, setActiveTab, isMobile, kanbanColumns, userRole, onLogout, userEmail, branchName, logoUrl, canAccessTab, onDeniedAccess }) => {
    const router = useRouter();
    const pathname = usePathname();
    const pendingCount = kanbanColumns?.pending?.length || 0;
    const isTabAllowed = (tabId) => (typeof canAccessTab === 'function' ? canAccessTab(tabId) : true);

    const storeHomePath = useMemo(() => {
        const currentPath = String(pathname || '/');
        const normalized = currentPath.replace(/\/+$/, '');
        const withoutAdmin = normalized.replace(/\/admin(?:\/.*)?$/i, '');
        return withoutAdmin || '/';
    }, [pathname]);

    const menuItems = useMemo(() => {
        const items = [
            { 
                id: 'orders', 
                label: 'Pedidos', 
                icon: ChefHat, 
                badge: pendingCount > 0 ? pendingCount : null 
            },
            {
                id: 'sales-group',
                label: 'Ventas',
                icon: DollarSign,
                isGroup: true,
                children: [
                    { id: 'caja', label: 'Caja', icon: CashIcon },
                    { id: 'analytics', label: 'Reportes', icon: BarChart3 }
                ]
            },
            {
                id: 'menu-group',
                label: 'Menú',
                icon: List,
                isGroup: true,
                children: [
                    { id: 'categories', label: 'Categorías', icon: CategoryIcon },
                    { id: 'products', label: 'Productos', icon: ShoppingBag },
                    { id: 'inventory', label: 'Inventario', icon: ClipboardList }
                ]
            },
            { id: 'clients', label: 'Clientes', icon: Users }
        ];
        if (userRole === 'ceo') {
            items.push({ id: 'users', label: 'Equipo', icon: UserPlus });
        }
        return items;
    }, [pendingCount, userRole]);

    const hasRestrictedItems = useMemo(() => (
        menuItems.some((item) => {
            if (item.isGroup) {
                return item.children?.some((child) => !isTabAllowed(child.id));
            }
            return !isTabAllowed(item.id);
        })
    ), [menuItems, canAccessTab]);

    const [expandedGroups, setExpandedGroups] = useState(() => {
        const activeGroup = menuItems.find(item => item.isGroup && item.children?.some(child => child.id === activeTab));
        return activeGroup ? { [activeGroup.id]: true } : {};
    });

    useEffect(() => {
        const activeGroup = menuItems.find(item => item.isGroup && item.children?.some(child => child.id === activeTab));
        if (activeGroup) {
            const timer = setTimeout(() => {
                setExpandedGroups(prev => {
                    if (prev[activeGroup.id]) return prev;
                    return { ...prev, [activeGroup.id]: true };
                });
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [activeTab, menuItems]);

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    return (
        <aside className="admin-sidebar glass">
            <div className="sidebar-top">
                {!isMobile && <div className="logo-circle"><img src={logoUrl || '/tenant/logo-placeholder.svg'} alt="Logo" /></div>}
                {!isMobile && (
                    <div className="brand-info">
                        <h3 className="brand-title">Admin del local</h3>
                        {userEmail && <span className="user-email">{userEmail}</span>}
                        {branchName && <span className="branch-name-badge">{branchName}</span>}
                    </div>
                )}
            </div>
            
            <nav className="sidebar-menu">
                {menuItems.map(item => {
                    if (item.isGroup) {
                        if (isMobile) {
                            return item.children.map(child => (
                                (() => {
                                    const disabled = !isTabAllowed(child.id);
                                    return (
                                <button 
                                    key={child.id}
                                    onClick={() => {
                                        if (disabled) {
                                            onDeniedAccess?.();
                                            return;
                                        }
                                        setActiveTab(child.id);
                                    }}
                                    className={`nav-item ${activeTab === child.id ? 'active' : ''}`}
                                    title={disabled ? 'Necesitas un rol diferente para acceder.' : undefined}
                                    style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                                >
                                    <child.icon size={20} />
                                    <span className="nav-label-mobile">{child.label}</span>
                                </button>
                                    );
                                })()
                            ));
                        }

                        const isExpanded = expandedGroups[item.id];
                        const isActiveGroup = item.children.some(child => child.id === activeTab);
                        
                        return (
                            <div key={item.id} className="nav-group-wrapper">
                                <button 
                                    onClick={() => toggleGroup(item.id)} 
                                    className={`nav-item nav-group-header ${isActiveGroup ? 'active-group' : ''}`}
                                >
                                    <div className="nav-item-inner">
                                        <item.icon size={22} />
                                        <span className="nav-text">{item.label}</span>
                                    </div>
                                    <ChevronDown 
                                        size={16} 
                                        className={`nav-chevron ${isExpanded ? 'expanded' : ''}`} 
                                    />
                                </button>
                                
                                <div className={`nav-sub-menu ${isExpanded ? 'expanded' : ''}`}>
                                    {item.children.map(child => (
                                        (() => {
                                            const disabled = !isTabAllowed(child.id);
                                            return (
                                        <button 
                                            key={child.id}
                                            onClick={() => {
                                                if (disabled) {
                                                    onDeniedAccess?.();
                                                    return;
                                                }
                                                setActiveTab(child.id);
                                            }}
                                            className={`nav-item ${activeTab === child.id ? 'active' : ''}`}
                                            title={disabled ? 'Necesitas un rol diferente para acceder.' : undefined}
                                            style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                                        >
                                            <child.icon size={18} />
                                            <span className="nav-text">{child.label}</span>
                                        </button>
                                            );
                                        })()
                                    ))}
                                </div>
                            </div>
                        );
                    } else {
                        const disabled = !isTabAllowed(item.id);
                        return (
                            <button 
                                key={item.id}
                                onClick={() => {
                                    if (disabled) {
                                        onDeniedAccess?.();
                                        return;
                                    }
                                    setActiveTab(item.id);
                                }} 
                                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                                title={disabled ? 'Necesitas un rol diferente para acceder.' : undefined}
                                style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                            >
                                <item.icon size={isMobile ? 20 : 22} /> 
                                {isMobile ? (
                                    <span className="nav-label-mobile">{item.label}</span>
                                ) : (
                                    <span className="nav-text">{item.label}</span>
                                )}
                                {item.badge && <span className="badge-count">{item.badge}</span>}
                            </button>
                        );
                    }
                })}

                <button onClick={() => router.push(storeHomePath)} className="nav-item" style={!isMobile ? { marginTop: 'auto', marginBottom: 10 } : {}}>
                    <Store size={isMobile ? 20 : 22} />
                    {isMobile ? <span className="nav-label-mobile">Tienda</span> : <span className="nav-text">Ver Tienda</span>}
                </button>
                <button onClick={onLogout} className="nav-item logout">
                    <LogOut size={isMobile ? 20 : 22} />
                    {isMobile ? <span className="nav-label-mobile">Salir</span> : <span className="nav-text">Cerrar Sesión</span>}
                </button>

                {hasRestrictedItems && !isMobile && (
                    <p style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                        Las opciones en gris requieren un rol diferente.
                    </p>
                )}
            </nav>
        </aside>
    );
};

export default AdminSidebar;
