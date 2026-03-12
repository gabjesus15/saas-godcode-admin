"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./admin-sidebar.module.css";
import { AnimatedLogo } from "./AnimatedLogo";
import {
	BarChart3,
	Building2,
	ChefHat,
	ClipboardList,
	DollarSign,
	LogOut,
	Settings,
	ShoppingBag,
	Store,
	Tag,
	Users,
	ChevronDown,
	List,
	type LucideIcon,
} from "lucide-react";

interface AdminSidebarProps {
	activeTab: string;
	onTabChange(tabId: string): void;
	isMobile: boolean;
	pendingCount?: number;
	userEmail?: string | null;
	branchName?: string | null;
	onLogout: () => void;
	logoUrl?: string | null;
	showCompanyTab?: boolean;
	userRole?: string | null;
}

type MenuChild = {
	id: string;
	label: string;
	icon: LucideIcon;
};

type MenuItem = {
	id: string;
	label: string;
	icon: LucideIcon;
	badge?: number | null;
	isGroup?: boolean;
	children?: MenuChild[];
};

export function AdminSidebar({
	activeTab,
	onTabChange,
	isMobile,
	pendingCount = 0,
	userEmail,
	branchName,
	onLogout,
	showCompanyTab = true,
	userRole,
	}: AdminSidebarProps) {
		const menuItems = useMemo<MenuItem[]>(() => {
			// Staff: por defecto solo Pedidos y Caja (el resto lo define roleNavPermissions)
			if (userRole === "cashier" || userRole === "staff") {
				return [
					{
						id: "orders",
						label: "Pedidos",
						icon: ChefHat,
						badge: pendingCount > 0 ? pendingCount : null,
					},
					{
						id: "caja",
						label: "Caja",
						icon: DollarSign,
					},
				];
			}
			// Default: all items
			const items = [
				{
					id: "orders",
					label: "Pedidos",
					icon: ChefHat,
					badge: pendingCount > 0 ? pendingCount : null,
				},
				{
					id: "sales-group",
					label: "Ventas",
					icon: DollarSign,
					isGroup: true,
					children: [
						{ id: "caja", label: "Caja", icon: DollarSign },
						{ id: "analytics", label: "Reportes", icon: BarChart3 },
					],
				},
				{
					id: "menu-group",
					label: "Menú",
					icon: List,
					isGroup: true,
					children: [
						{ id: "categories", label: "Categorías", icon: Tag },
						{ id: "products", label: "Productos", icon: ShoppingBag },
						{ id: "inventory", label: "Inventario", icon: ClipboardList },
					],
				},
				{ id: "clients", label: "Clientes", icon: Users },
				{ id: "settings", label: "Herramientas", icon: Settings },
			];
			if (showCompanyTab) {
				items.push({ id: "company", label: "Datos de la empresa", icon: Building2 });
			}
			return items;
		}, [pendingCount, showCompanyTab, userRole]);

	const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

	useEffect(() => {
		const activeGroup = menuItems.find(
			(item) => item.isGroup && item.children?.some((child) => child.id === activeTab)
		);

		if (activeGroup) {
			const timer = window.setTimeout(() => {
				setExpandedGroups((prev) => ({ ...prev, [activeGroup.id]: true }));
			}, 50);

			return () => window.clearTimeout(timer);
		}

		return undefined;
	}, [activeTab, menuItems]);

	const toggleGroup = (groupId: string) => {
		setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
	};

	return (
		<aside className="admin-sidebar glass">
			<div className="sidebar-top">
				{!isMobile ? (
					<div className="logo-circle">
						<div className={styles.logoCenter}>
							<AnimatedLogo />
							<div className={styles.logoSlogan}>Tu visión, nuestro código.</div>
						</div>
					</div>
				) : null}
				{/* Eliminado avatar SG y textos Super Admin/Multi-Tenant SaaS por petición del usuario */}
			</div>

			<nav className="sidebar-menu">
				{menuItems.map((item) => {
					if (item.isGroup) {
						const groupChildren = item.children ?? [];
						if (isMobile) {
							return groupChildren.map((child) => {
								const ChildIcon = child.icon;
								return (
									<button
										key={child.id}
										onClick={() => onTabChange(child.id)}
										className={`nav-item ${activeTab === child.id ? "active" : ""}`}
									>
										<ChildIcon size={20} />
										<span className="nav-label-mobile">{child.label}</span>
									</button>
								);
							});
						}

						const isExpanded = expandedGroups[item.id];
						const isActiveGroup = groupChildren.some((child) => child.id === activeTab);
						const GroupIcon = item.icon;

						return (
							<div key={item.id} className="nav-group-wrapper">
								<button
									onClick={() => toggleGroup(item.id)}
									className={`nav-item nav-group-header ${isActiveGroup ? "active-group" : ""}`}
								>
									<div className="nav-item-inner">
										<GroupIcon size={22} />
										<span className="nav-text">{item.label}</span>
									</div>
									<ChevronDown size={16} className={`nav-chevron ${isExpanded ? "expanded" : ""}`} />
								</button>

								<div className={`nav-sub-menu ${isExpanded ? "expanded" : ""}`}>
									{groupChildren.map((child) => {
										const ChildIcon = child.icon;
										return (
											<button
												key={child.id}
												onClick={() => onTabChange(child.id)}
												className={`nav-item ${activeTab === child.id ? "active" : ""}`}
											>
												<ChildIcon size={18} />
												<span className="nav-text">{child.label}</span>
											</button>
										);
									})}
								</div>
							</div>
						);
					}

					const ItemIcon = item.icon;
					return (
						<button
							key={item.id}
							onClick={() => onTabChange(item.id)}
							className={`nav-item ${activeTab === item.id ? "active" : ""}`}
						>
							<ItemIcon size={isMobile ? 20 : 22} />
							{isMobile ? (
								<span className="nav-label-mobile">{item.label}</span>
							) : (
								<span className="nav-text">{item.label}</span>
							)}
							{item.badge ? <span className="badge-count">{item.badge}</span> : null}
						</button>
					);
				})}

				<button
					onClick={() => onTabChange("store")}
					className={`nav-item ${isMobile ? "" : "store-link"}`}
				>
					<Store size={isMobile ? 20 : 22} />
					{isMobile ? <span className="nav-label-mobile">Tienda</span> : <span className="nav-text">Ver Tienda</span>}
				</button>
				<button onClick={onLogout} className="nav-item logout">
					<LogOut size={isMobile ? 20 : 22} />
					{isMobile ? <span className="nav-label-mobile">Salir</span> : <span className="nav-text">Cerrar Sesión</span>}
				</button>
			</nav>
		</aside>
	);
}
