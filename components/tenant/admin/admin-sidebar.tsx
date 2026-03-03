"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

interface AdminSidebarProps {
	activeTab: string;
	onTabChange: (id: string) => void;
	isMobile: boolean;
	pendingCount?: number;
	userEmail?: string | null;
	branchName?: string | null;
	onLogout: () => void;
	logoUrl?: string | null;
	showCompanyTab?: boolean;
}

export function AdminSidebar({
	activeTab,
	onTabChange,
	isMobile,
	pendingCount = 0,
	userEmail,
	branchName,
	onLogout,
	logoUrl,
	showCompanyTab = true,
	userRole,
	}: AdminSidebarProps & { userRole?: string | null }) {
		const menuItems = useMemo(() => {
			// Staff: por defecto solo Pedidos y Caja (el resto lo define roleNavPermissions)
			if (userRole === "staff") {
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
			(item: any) => item.isGroup && item.children?.some((child: any) => child.id === activeTab)
		) as any;

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
						<img
							src={logoUrl || "/tenant/logo-placeholder.svg"}
							alt="Logo"
							onError={(event) => {
								(event.currentTarget as HTMLImageElement).src =
									"/tenant/logo-placeholder.svg";
							}}
						/>
					</div>
				) : null}
				{!isMobile ? (
					<div className="brand-info">
						<h3 className="brand-title">Admin del local</h3>
						{userEmail ? <span className="user-email">{userEmail}</span> : null}
						{branchName ? <span className="branch-name-badge">{branchName}</span> : null}
					</div>
				) : null}
			</div>

			<nav className="sidebar-menu">
				{menuItems.map((item: any) => {
					if (item.isGroup) {
						if (isMobile) {
							return item.children.map((child: any) => {
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
						const isActiveGroup = item.children.some((child: any) => child.id === activeTab);
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
									{item.children.map((child: any) => {
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
					className="nav-item"
					style={!isMobile ? { marginTop: "auto", marginBottom: 10 } : undefined}
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
