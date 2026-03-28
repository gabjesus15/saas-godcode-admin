"use client";

import React from 'react';
import {
  Loader2, Search, Filter, CheckCircle2, AlertCircle,
  Package, PlusCircle, X, Trash2, Plus, Edit, RefreshCw, List, ShoppingBag, Tag, LayoutGrid, ArrowUpDown, Eye, EyeOff, MapPin, Upload
} from 'lucide-react';
import ProductModal from '../../products/components/ProductModal';
import CategoryModal from '../../products/components/CategoryModal';
import AdminSidebar from '../components/AdminSidebar';
import AdminKanban from '../components/AdminKanban';
import ManualOrderModal from '../components/ManualOrderModal';
import BannerManager from '../components/BannerManager';
import InventoryCard from '../components/InventoryCard';
import ClientDetailsPanel from '../components/ClientDetailsPanel';
import ScopeSelectionModal from '../components/ScopeSelectionModal';
import TenantTicketsPanel from '../components/TenantTicketsPanel';

const AdminAnalytics = React.lazy(() => import('../components/AdminAnalytics'));
const AdminClients = React.lazy(() => import('../components/AdminClients'));
const AdminInventory = React.lazy(() => import('../components/AdminInventory'));
const AdminHistoryTable = React.lazy(() => import('../components/AdminHistoryTable'));
const CashManager = React.lazy(() => import('../components/caja/CashManager'));
const AdminPaymentMethods = React.lazy(() => import('../components/AdminPaymentMethods'));

const TabFallback = () => <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}><Loader2 size={32} /></div>;
import { supabase } from '../../lib/supabase';
import { AdminProvider, useAdmin } from './AdminProvider';

export const AdminPage = ({ companyName, logoUrl, userEmail: initialEmail, primaryColor }) => {
  void companyName;
  const {
    navigate,
    activeTab, setActiveTab,
    products,
    categories,
    orders,
    clients,
    branches,
    selectedBranch, setSelectedBranch,
    isBranchLocked,
    isHistoryView, setIsHistoryView,
    mobileTab, setMobileTab,
    searchQuery, setSearchQuery,
    filterCategory, setFilterCategory,
    filterStatus, setFilterStatus,
    viewMode, setViewMode,
    sortOrder, setSortOrder,
    refreshing,
    isMobile,
    isModalOpen, setIsModalOpen,
    editingProduct, setEditingProduct,
    isCategoryModalOpen, setIsCategoryModalOpen,
    editingCategory, setEditingCategory,
    notification,
    receiptModalOrder, setReceiptModalOrder,
    receiptPreview, setReceiptPreview,
    isManualOrderModalOpen, setIsManualOrderModalOpen,
    uploadingReceipt,
    selectedClient, setSelectedClient,
    selectedClientOrders,
    clientHistoryLoading,
    showNotify,
    cashSystem,
    loadData,
    handleSelectClient,
    moveOrder,
    uploadReceiptToOrder,
    handleReceiptFileChange,
    handleSaveProduct,
    deleteProduct,
    toggleProductActive,
    scopeModal,
    handleScopeConfirm,
    setScopeModal,
    handleSaveCategory,
    deleteCategory,
    categoryToDelete,
    setCategoryToDelete,
    confirmDeleteCategory,
    kanbanColumns,
    processedProducts,
    productStats,
    userRole,
    userEmail,
    dynamicModules,
    canAccessTab,
    productToDelete,
    setProductToDelete,
    confirmDeleteProduct,
    reorderCategories,
    toggleCategoryActive,
  } = useAdmin();

  const nextCategoryOrder = React.useMemo(() => {
    const maxOrder = categories.reduce((maxValue, cat) => {
      const value = Number(cat.order);
      if (!Number.isFinite(value)) return maxValue;
      return Math.max(maxValue, value);
    }, 0);
    return maxOrder + 1;
  }, [categories]);

  const sortedCategories = React.useMemo(() => (
    [...categories].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
  ), [categories]);

  const companyIdForClients = React.useMemo(() => {
    if (selectedBranch && selectedBranch.id !== 'all' && selectedBranch.company_id) {
      return selectedBranch.company_id;
    }
    const fallback = (branches || []).find(b => b.id !== 'all' && b.company_id);
    return fallback?.company_id || null;
  }, [selectedBranch, branches]);

  const [dragCategoryId, setDragCategoryId] = React.useState(null);
  const [dragOverCategoryId, setDragOverCategoryId] = React.useState(null);
  const dragEnabled = !isMobile;

  const [teamUsers, setTeamUsers] = React.useState([]);
  const [teamLoading, setTeamLoading] = React.useState(false);
  const [teamModalOpen, setTeamModalOpen] = React.useState(false);
  const [teamUserToEdit, setTeamUserToEdit] = React.useState(null);
  const [teamForm, setTeamForm] = React.useState({ email: '', password: '', role: 'cashier', branch_id: '', allowed_tabs: ['orders', 'caja'] });
  const [teamSubmitting, setTeamSubmitting] = React.useState(false);
  const [teamUserToDelete, setTeamUserToDelete] = React.useState(null);
  const [teamDeleting, setTeamDeleting] = React.useState(false);
  const [broadcasts, setBroadcasts] = React.useState([]);
  const [broadcastsLoading, setBroadcastsLoading] = React.useState(false);
  const [ackingId, setAckingId] = React.useState(null);

  const dynamicModuleByTab = React.useMemo(() => {
    const map = new Map();
    (dynamicModules || []).forEach((module) => {
      if (module?.tabId) {
        map.set(module.tabId, module);
      }
    });
    return map;
  }, [dynamicModules]);

  const activeDynamicModule = dynamicModuleByTab.get(activeTab) || null;

  const TAB_LABELS = { orders: 'Pedidos', caja: 'Caja', analytics: 'Reportes', categories: 'Categorías', products: 'Productos', inventory: 'Inventario', clients: 'Clientes', payment_methods: 'Métodos de pago' };
  const ALL_TABS = ['orders', 'caja', 'analytics', 'categories', 'products', 'inventory', 'clients', 'payment_methods'];

  const loadBroadcasts = React.useCallback(async () => {
    setBroadcastsLoading(true);
    try {
      const res = await fetch('/api/tenant-broadcasts', { cache: 'no-store', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al cargar comunicados');
      }
      setBroadcasts(data.broadcasts || []);
    } catch {
      setBroadcasts([]);
    } finally {
      setBroadcastsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadBroadcasts();
  }, [loadBroadcasts]);

  const acknowledgeBroadcast = async (broadcastId) => {
    if (!broadcastId) return;

    setAckingId(broadcastId);
    try {
      const res = await fetch('/api/tenant-broadcasts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ broadcastId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo registrar el acuse');
      }

      setBroadcasts((prev) => prev.map((item) => (
        item.id === broadcastId
          ? { ...item, readAt: new Date().toISOString() }
          : item
      )));
      showNotify('Comunicado marcado como leído.');
    } catch (err) {
      showNotify(err instanceof Error ? err.message : 'No se pudo registrar el acuse', 'error');
    } finally {
      setAckingId(null);
    }
  };

  const fetchTeamUsers = React.useCallback(async () => {
    setTeamLoading(true);
    try {
      const res = await fetch('/api/tenant-staff', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setTeamUsers(data.users || []);
      else showNotify(data.error || 'Error al cargar equipo', 'error');
    } catch {
      showNotify('Error al cargar equipo', 'error');
    } finally {
      setTeamLoading(false);
    }
  }, [showNotify]);

  React.useEffect(() => {
    if (activeTab === 'users') fetchTeamUsers();
  }, [activeTab, fetchTeamUsers]);

  const openTeamCreateModal = () => {
    setTeamUserToEdit(null);
    setTeamForm({ email: '', password: '', role: 'cashier', branch_id: '', allowed_tabs: ['orders', 'caja'] });
    setTeamModalOpen(true);
  };

  const openTeamEditModal = (u) => {
    setTeamUserToEdit(u);
    setTeamForm({
      email: u.email || '',
      password: '',
      role: ((u.role || 'cashier').toLowerCase() === 'staff' ? 'cashier' : (u.role || 'cashier').toLowerCase()),
      branch_id: u.branch_id || '',
      allowed_tabs: Array.isArray(u.allowed_tabs) && u.allowed_tabs.length ? u.allowed_tabs : ['orders', 'caja'],
    });
    setTeamModalOpen(true);
  };

  const handleSaveTeamUser = async (e) => {
    e.preventDefault();
    const isEdit = Boolean(teamUserToEdit?.id);
    if (!isEdit && !teamForm.password) {
      showNotify('Email y contraseña son obligatorios', 'error');
      return;
    }
    if (!teamForm.email.trim()) {
      showNotify('El correo es obligatorio', 'error');
      return;
    }
    setTeamSubmitting(true);
    try {
      const payload = {
        email: teamForm.email.trim(),
        role: ((teamForm.role || 'cashier').toLowerCase() === 'staff' ? 'cashier' : (teamForm.role || 'cashier').toLowerCase()),
        branch_id: teamForm.branch_id || null,
        allowed_tabs: teamForm.allowed_tabs?.length ? teamForm.allowed_tabs : null,
      };
      if (isEdit) {
        payload.id = teamUserToEdit.id;
        if (teamForm.password) payload.password = teamForm.password;
      } else {
        payload.password = teamForm.password;
      }
      const res = await fetch('/api/tenant-staff', {
        method: isEdit ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        showNotify(isEdit ? 'Usuario actualizado.' : 'Usuario creado. Puede iniciar sesión con su correo y contraseña.');
        setTeamModalOpen(false);
        setTeamUserToEdit(null);
        setTeamForm({ email: '', password: '', role: 'cashier', branch_id: '', allowed_tabs: ['orders', 'caja'] });
        fetchTeamUsers();
      } else {
        showNotify(data.error || (isEdit ? 'Error al actualizar usuario' : 'Error al crear usuario'), 'error');
      }
    } catch {
      showNotify(isEdit ? 'Error al actualizar usuario' : 'Error al crear usuario', 'error');
    } finally {
      setTeamSubmitting(false);
    }
  };

  const toggleTeamTab = (tabId) => {
    setTeamForm(prev => ({
      ...prev,
      allowed_tabs: prev.allowed_tabs?.includes(tabId)
        ? prev.allowed_tabs.filter(t => t !== tabId)
        : [...(prev.allowed_tabs || []), tabId],
    }));
  };

  const handleDeleteTeamUser = async () => {
    if (!teamUserToDelete?.id) return;
    setTeamDeleting(true);
    try {
      const res = await fetch('/api/tenant-staff', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: teamUserToDelete.id }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotify('Usuario eliminado.');
        setTeamUserToDelete(null);
        fetchTeamUsers();
      } else {
        showNotify(data.error || 'Error al eliminar usuario', 'error');
      }
    } catch {
      showNotify('Error al eliminar usuario', 'error');
    } finally {
      setTeamDeleting(false);
    }
  };

  const handleDragStart = (categoryId) => {
    setDragCategoryId(categoryId);
  };

  const handleDragOver = (event, categoryId) => {
    event.preventDefault();
    if (categoryId !== dragOverCategoryId) {
      setDragOverCategoryId(categoryId);
    }
  };

  const handleDragLeave = (categoryId) => {
    if (dragOverCategoryId === categoryId) {
      setDragOverCategoryId(null);
    }
  };

  const handleDrop = async (event, categoryId) => {
    event.preventDefault();
    if (!dragCategoryId || dragCategoryId === categoryId) {
      setDragCategoryId(null);
      setDragOverCategoryId(null);
      return;
    }

    const ids = sortedCategories.map(cat => cat.id);
    const fromIndex = ids.indexOf(dragCategoryId);
    const toIndex = ids.indexOf(categoryId);
    if (fromIndex === -1 || toIndex === -1) {
      setDragCategoryId(null);
      setDragOverCategoryId(null);
      return;
    }

    const nextIds = [...ids];
    const [moved] = nextIds.splice(fromIndex, 1);
    nextIds.splice(toIndex, 0, moved);

    await reorderCategories(nextIds);
    setDragCategoryId(null);
    setDragOverCategoryId(null);
  };

  return (
    <div className="admin-layout">
      {notification && (
        <div className={`admin-notification ${notification.type} animate-slide-up`}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {productToDelete && (
        <div className="admin-modal-overlay" onClick={() => setProductToDelete(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="admin-confirm-modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', padding: 24, borderRadius: 12, maxWidth: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <p style={{ margin: '0 0 16px', fontSize: 16 }}>¿Eliminar producto?</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="admin-btn secondary" onClick={() => setProductToDelete(null)}>Cancelar</button>
              <button type="button" className="admin-btn danger" onClick={confirmDeleteProduct}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {categoryToDelete && (
        <div className="admin-modal-overlay" onClick={() => setCategoryToDelete(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="admin-confirm-modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', padding: 24, borderRadius: 12, maxWidth: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <p style={{ margin: '0 0 16px', fontSize: 16 }}>¿Eliminar categoría &quot;{categoryToDelete.name}&quot;? Los productos quedarán sin categoría.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="admin-btn secondary" onClick={() => setCategoryToDelete(null)}>Cancelar</button>
              <button type="button" className="admin-btn danger" onClick={confirmDeleteCategory}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobile={isMobile}
        kanbanColumns={kanbanColumns}
        userRole={userRole}
        canAccessTab={canAccessTab}
        onDeniedAccess={() => showNotify('Necesitas un rol diferente para acceder a esta sección.', 'error')}
        userEmail={userEmail || initialEmail}
        branchName={selectedBranch?.name}
        logoUrl={logoUrl}
        dynamicModules={dynamicModules}
        onLogout={async () => {
          await supabase.auth.signOut();
          navigate('/login');
        }}
      />

      <main className="admin-content">
        {broadcasts.length > 0 ? (
          <div className="glass" style={{ marginBottom: 18, padding: 12, borderRadius: 12, display: 'grid', gap: 10 }}>
            {broadcasts.map((item) => {
              const isCritical = item.priority === 'critical' || item.priority === 'high';
              const isRead = Boolean(item.readAt);
              return (
                <div
                  key={item.id}
                  style={{
                    border: isCritical ? '1px solid rgba(239,68,68,0.55)' : '1px solid rgba(255,255,255,0.12)',
                    background: isCritical ? 'rgba(127,29,29,0.22)' : 'rgba(255,255,255,0.03)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.09em', opacity: 0.75 }}>
                      {item.broadcastType} · prioridad {item.priority}
                    </p>
                    <h3 style={{ margin: '5px 0 0', fontSize: 16, fontWeight: 800 }}>{item.title}</h3>
                    <p style={{ margin: '6px 0 0', opacity: 0.9 }}>{item.message}</p>
                    <p style={{ margin: '7px 0 0', fontSize: 12, opacity: 0.65 }}>
                      Desde {new Date(item.startsAt).toLocaleString('es-CL')}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    {isRead ? (
                      <span style={{ fontSize: 12, color: '#86efac', fontWeight: 700 }}>Leído</span>
                    ) : (
                      <span style={{ fontSize: 12, color: '#facc15', fontWeight: 700 }}>Pendiente</span>
                    )}
                    {!isRead ? (
                      <button
                        type="button"
                        className="admin-btn secondary"
                        onClick={() => acknowledgeBroadcast(item.id)}
                        disabled={ackingId === item.id}
                        style={{ fontSize: 12, padding: '6px 10px' }}
                      >
                        {ackingId === item.id ? 'Guardando...' : 'Marcar leído'}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {broadcastsLoading ? (
          <div className="glass" style={{ marginBottom: 18, padding: 10, borderRadius: 10, opacity: 0.8 }}>
            Cargando comunicados...
          </div>
        ) : null}

        <header className="content-header">
          <h1>
            {activeTab === 'orders' ? (isHistoryView ? 'Historial' : 'Cocina en Vivo') :
              activeTab === 'products' ? 'Inventario' :
                activeTab === 'analytics' ? 'Rendimiento' :
                  activeTab === 'clients' ? 'Clientes' :
                    activeTab === 'caja' ? 'Caja y Turnos' :
                      activeTab === 'users' ? 'Equipo' :
                        activeTab === 'payment_methods' ? 'Métodos de pago' :
                          activeDynamicModule ? activeDynamicModule.label : 'Categorías'}
          </h1>

          <div className="header-actions">
            <button onClick={() => loadData(true)} className="btn-icon-refresh" disabled={refreshing}>
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>

            {/* SELECTOR DE SUCURSAL */}
            <div className="branch-selector-wrapper" style={{ marginRight: 10 }}>
              <div className="glass" style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderRadius: 8, gap: 8 }}>
                <MapPin size={16} className="text-accent" />
                <select 
                  value={selectedBranch?.id || ''} 
                  onChange={(e) => {
                    if (e.target.value === 'all') {
                      setSelectedBranch({ id: 'all', name: 'Todas las sucursales' });
                    } else {
                      const branch = branches.find(b => b.id === e.target.value);
                      setSelectedBranch(branch);
                    }
                  }}
                  disabled={isBranchLocked}
                  title={isBranchLocked ? 'Tu correo está bloqueado a una sucursal específica.' : undefined}
                  style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', cursor: isBranchLocked ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: isBranchLocked ? 0.7 : 1 }}
                >
                  {branches.map(b => <option key={b.id} value={b.id} style={{color: 'black'}}>{b.name}</option>)}
                  {activeTab === 'analytics' && (
                    <option value="all" style={{color: 'black', fontWeight: 'bold'}}>Todas las sucursales</option>
                  )}
                </select>
              </div>
            </div>

            {activeTab === 'orders' && (
              <>
                <button className={`btn ${isHistoryView ? 'btn-primary' : 'btn-secondary'}`} 
                        onClick={() => setIsHistoryView(!isHistoryView)}
                        style={!isHistoryView ? { background: 'white', color: '#1a1a1a', border: '1px solid #e5e7eb' } : {}}
                >
                  {isHistoryView ? 'Ver Tablero' : 'Ver Historial'}
                </button>
                <button
                  onClick={() => setIsManualOrderModalOpen(true)}
                  className="btn btn-primary"
                  disabled={selectedBranch?.id === 'all' || !selectedBranch}
                  title={selectedBranch?.id === 'all' ? 'Selecciona una sucursal' : undefined}
                >
                  <PlusCircle size={18} /> Pedido Manual
                </button>
              </>
            )}
            {activeTab === 'products' && (
              <button
                onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                className="btn btn-primary"
                disabled={!selectedBranch || selectedBranch.id === 'all'}
                title={selectedBranch?.id === 'all' ? 'Selecciona una sucursal' : undefined}
              >
                <Plus size={18} /> Nuevo Plato
              </button>
            )}
            {activeTab === 'categories' && (
              <button
                onClick={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }}
                className="btn btn-primary"
                disabled={!selectedBranch || selectedBranch.id === 'all'}
                title={selectedBranch?.id === 'all' ? 'Selecciona una sucursal' : undefined}
              >
                <Plus size={18} /> Nueva Categ.
              </button>
            )}
            {activeTab === 'users' && (
              <button
                onClick={openTeamCreateModal}
                className="btn btn-primary"
              >
                <Plus size={18} /> Crear usuario
              </button>
            )}
          </div>
        </header>

        {/* 1. PEDIDOS */}
        {activeTab === 'orders' && (
          !isHistoryView ? (
            <AdminKanban
              columns={kanbanColumns}
              isMobile={isMobile}
              mobileTab={mobileTab}
              setMobileTab={setMobileTab}
              moveOrder={moveOrder}
              setReceiptModalOrder={setReceiptModalOrder}
              branch={selectedBranch}
              clients={clients}
              logoUrl={logoUrl}
            />
          ) : (
            <React.Suspense fallback={<TabFallback />}>
              <AdminHistoryTable orders={kanbanColumns.history} setReceiptModalOrder={setReceiptModalOrder} />
            </React.Suspense>
          )
        )}

        {/* 2. INVENTARIO */}
        {activeTab === 'products' && (
          <div className="products-view animate-fade">

            <BannerManager
              branchId={selectedBranch?.id}
              companyId={companyIdForClients}
              showNotify={showNotify}
            />

            {/* BARRA DE ESTADÍSTICAS */}
            <div className="stats-bar glass" style={{ display: 'flex', gap: 20, padding: '15px 20px', marginBottom: 20, borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 8 }}><Package size={18} /></div>
                <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af' }}>Total Platos</span><strong style={{ fontSize: '1.1rem' }}>{productStats.total}</strong></div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'rgba(37, 211, 102, 0.1)', color: '#25d366', padding: 8, borderRadius: 8 }}><Eye size={18} /></div>
                <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af' }}>Activos</span><strong style={{ fontSize: '1.1rem', color: '#25d366' }}>{productStats.active}</strong></div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: 8, borderRadius: 8 }}><EyeOff size={18} /></div>
                <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af' }}>Pausados</span><strong style={{ fontSize: '1.1rem', color: '#ef4444' }}>{productStats.paused}</strong></div>
              </div>
            </div>

            <div className="admin-toolbar glass">
              <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                <div className="search-box" style={{ flex: 1 }}>
                  <Search size={18} />
                  <input placeholder="Buscar plato..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                
                <div className="filter-box">
                  <Filter size={18} />
                  <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="all">Todas las categorías</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="filter-box">
                  <Eye size={18} />
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="all">Todos los estados</option>
                    <option value="active">Solo Activos</option>
                    <option value="paused">Solo Pausados</option>
                  </select>
                </div>
              </div>

              <div className="admin-toolbar-actions" style={{ display: 'flex', gap: 8, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 10 }}>
                 <div className="filter-box" style={{ minWidth: 'auto' }}>
                    <ArrowUpDown size={18} />
                    <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                      <option value="name-asc">Nombre (A-Z)</option>
                      <option value="price-asc">Precio (Menor a Mayor)</option>
                      <option value="price-desc">Precio (Mayor a Menor)</option>
                    </select>
                 </div>
                 <button className={`btn-icon-toggle ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Vista Grilla">
                    <LayoutGrid size={18} />
                 </button>
                 <button className={`btn-icon-toggle ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="Vista Lista">
                    <List size={18} />
                 </button>
              </div>
            </div>
            
            <div className={`inventory-grid ${viewMode === 'list' ? 'list-mode' : ''}`}>
              {processedProducts.map(p => (
                  <InventoryCard
                    key={p.id}
                    product={p}
                    viewMode={viewMode}
                    toggleProductActive={toggleProductActive}
                    setEditingProduct={setEditingProduct}
                    setIsModalOpen={setIsModalOpen}
                    deleteProduct={deleteProduct}
                  />
                ))
              }
            </div>
          </div>
        )}

        {/* 2.5 NUEVO INVENTARIO (INSUMOS) */}
        {activeTab === 'inventory' && (
          <React.Suspense fallback={<TabFallback />}>
            <AdminInventory showNotify={showNotify} branchId={selectedBranch?.id} branches={branches} companyId={companyIdForClients} />
          </React.Suspense>
        )}

        {/* 3. REPORTES */}
        {activeTab === 'analytics' && (
          <React.Suspense fallback={<TabFallback />}>
            <AdminAnalytics 
              orders={orders} 
              products={products} 
              clients={clients} 
              branches={branches.filter(b => b.id !== 'all')}
            />
          </React.Suspense>
        )}

        {/* 4. CLIENTES */}
        {activeTab === 'clients' && (
          <React.Suspense fallback={<TabFallback />}>
            <AdminClients
              clients={clients}
              orders={orders}
              onSelectClient={handleSelectClient}
              onClientCreated={() => loadData(true)}
              showNotify={showNotify}
              companyId={companyIdForClients}
            />
          </React.Suspense>
        )}

        {/* EQUIPO (solo CEO) */}
        {activeTab === 'users' && (
          <div className="admin-toolbar glass" style={{ marginBottom: 20 }}>
            <p style={{ margin: 0, opacity: 0.9 }}>Usuarios que pueden entrar al panel de este local. Crea staff y asígnales las pestañas que podrán ver.</p>
          </div>
        )}
        {activeTab === 'payment_methods' && (
          <React.Suspense fallback={<TabFallback />}>
            <AdminPaymentMethods
              showNotify={showNotify}
              branches={branches}
              companyId={companyIdForClients}
            />
          </React.Suspense>
        )}

        {activeTab === 'users' && (
          <div className="glass staff-table-glass" style={{ padding: 20, borderRadius: 12 }}>
            {teamLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 size={32} className="animate-spin" /></div>
            ) : teamUsers.length === 0 ? (
              <p style={{ margin: 0, opacity: 0.8 }}>Aún no hay usuarios. Crea uno con &quot;Crear usuario&quot;.</p>
            ) : (
              <div className="staff-table-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table className="staff-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 320 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>Correo</th>
                      <th style={{ padding: '10px 12px' }}>Rol</th>
                      <th style={{ padding: '10px 12px' }}>Sucursal</th>
                      <th style={{ padding: '10px 12px' }}>Permisos</th>
                      <th className="staff-table-actions-th" style={{ padding: '10px 12px', minWidth: 90, whiteSpace: 'nowrap' }}>Acciones</th>
                    </tr>
                  </thead>
                <tbody>
                  {teamUsers.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <td style={{ padding: '10px 12px' }}>{u.email}</td>
                      <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{u.role}</td>
                      <td style={{ padding: '10px 12px' }}>{u.branch?.name ?? '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12 }}>
                        {(u.allowed_tabs && u.allowed_tabs.length > 0)
                          ? u.allowed_tabs.map(t => TAB_LABELS[t] || t).join(', ')
                          : ((u.role === 'cashier' || u.role === 'staff') ? 'Por defecto (Pedidos, Caja)' : 'Todos')}
                      </td>
                      <td style={{ padding: '10px 12px', display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => openTeamEditModal(u)}
                          className="admin-btn secondary"
                          style={{ padding: '6px 10px', fontSize: 12 }}
                          title="Editar usuario"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTeamUserToDelete(u)}
                          className="admin-btn secondary"
                          style={{ padding: '6px 10px', fontSize: 12 }}
                          title="Eliminar usuario"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        )}

        {/* Modal confirmar eliminar usuario */}
        {teamUserToDelete && (
          <div
            className="admin-modal-overlay"
            onClick={() => !teamDeleting && setTeamUserToDelete(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(4, 10, 22, 0.72)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              className="admin-confirm-modal"
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 520,
                borderRadius: 16,
                border: '1px solid rgba(255, 92, 92, 0.28)',
                background: 'linear-gradient(165deg, rgba(28,9,9,0.97) 0%, rgba(18,8,10,0.98) 100%)',
                boxShadow: '0 28px 70px rgba(0,0,0,0.55)',
                overflow: 'hidden',
              }}
            >
              <div style={{
                padding: '16px 18px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255, 68, 68, 0.09)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255, 68, 68, 0.45)',
                    background: 'rgba(255, 68, 68, 0.18)',
                    color: '#ff9d9d',
                  }}>
                    <Trash2 size={16} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)', fontWeight: 700 }}>
                      Acción destructiva
                    </p>
                    <h3 style={{ margin: '3px 0 0', fontSize: 18, fontWeight: 800, color: '#fff' }}>
                      Eliminar usuario del equipo
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !teamDeleting && setTeamUserToDelete(null)}
                  disabled={teamDeleting}
                  style={{
                    border: '1px solid rgba(255,255,255,0.18)',
                    background: 'rgba(255,255,255,0.03)',
                    color: '#f3f4f6',
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: teamDeleting ? 'not-allowed' : 'pointer',
                  }}
                  aria-label="Cerrar"
                  title="Cerrar"
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ padding: 18 }}>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', lineHeight: 1.55 }}>
                  Vas a eliminar el acceso de <strong style={{ color: '#fff' }}>{teamUserToDelete.email}</strong>.
                </p>
                <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.66)', fontSize: 13 }}>
                  Esta acción revoca el ingreso al panel del local y no se puede deshacer automáticamente.
                </p>
              </div>

              <div style={{
                padding: '14px 18px',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.25)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
              }}>
                <button
                  type="button"
                  className="admin-btn secondary"
                  onClick={() => !teamDeleting && setTeamUserToDelete(null)}
                  disabled={teamDeleting}
                >
                  Cancelar
                </button>
                <button type="button" className="admin-btn danger" onClick={handleDeleteTeamUser} disabled={teamDeleting}>
                  {teamDeleting ? <Loader2 size={18} className="animate-spin" /> : 'Eliminar usuario'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Crear / Editar usuario */}
        {teamModalOpen && (
          <div
            className="admin-modal-overlay"
            onClick={() => !teamSubmitting && (setTeamModalOpen(false), setTeamUserToEdit(null))}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(4, 10, 22, 0.72)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              className="admin-confirm-modal"
              onClick={e => e.stopPropagation()}
              style={{
                background: 'linear-gradient(165deg, rgba(17,24,39,0.96) 0%, rgba(10,10,18,0.98) 100%)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 18,
                maxWidth: 640,
                width: '100%',
                maxHeight: '88vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
                overflow: 'hidden',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '18px 20px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.02)',
              }}>
                <div>
                  <p style={{
                    margin: '0 0 6px',
                    fontSize: 11,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.6)',
                    fontWeight: 700,
                  }}>
                    Gestión de equipo
                  </p>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>
                    {teamUserToEdit ? 'Editar miembro' : 'Crear miembro del equipo'}
                  </h3>
                  <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.72)', fontSize: 13 }}>
                    Define acceso por rol, sucursal y pestañas permitidas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !teamSubmitting && (setTeamModalOpen(false), setTeamUserToEdit(null))}
                  disabled={teamSubmitting}
                  style={{
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#e5e7eb',
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: teamSubmitting ? 'not-allowed' : 'pointer',
                  }}
                  aria-label="Cerrar"
                  title="Cerrar"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveTeamUser} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
                <div style={{ padding: 20, overflowY: 'auto', display: 'grid', gap: 16 }}>
                  <div style={{ display: 'grid', gap: 12 }}>
                    <label style={{ display: 'grid', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>Correo</span>
                      <input
                        type="email"
                        value={teamForm.email}
                        onChange={e => setTeamForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="usuario@ejemplo.com"
                        required
                        style={{
                          width: '100%',
                          padding: '11px 12px',
                          borderRadius: 10,
                          border: '1px solid rgba(255,255,255,0.18)',
                          background: 'rgba(8, 14, 28, 0.82)',
                          color: '#f8fafc',
                          outline: 'none',
                        }}
                      />
                    </label>

                    {!teamUserToEdit && (
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>Contraseña</span>
                        <input
                          type="password"
                          value={teamForm.password}
                          onChange={e => setTeamForm(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Mínimo 6 caracteres"
                          required
                          minLength={6}
                          style={{
                            width: '100%',
                            padding: '11px 12px',
                            borderRadius: 10,
                            border: '1px solid rgba(255,255,255,0.18)',
                            background: 'rgba(8, 14, 28, 0.82)',
                            color: '#f8fafc',
                            outline: 'none',
                          }}
                        />
                      </label>
                    )}

                    {teamUserToEdit && (
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>Nueva contraseña (opcional)</span>
                        <input
                          type="password"
                          value={teamForm.password}
                          onChange={e => setTeamForm(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Dejar en blanco para no cambiar"
                          minLength={6}
                          style={{
                            width: '100%',
                            padding: '11px 12px',
                            borderRadius: 10,
                            border: '1px solid rgba(255,255,255,0.18)',
                            background: 'rgba(8, 14, 28, 0.82)',
                            color: '#f8fafc',
                            outline: 'none',
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label style={{ display: 'grid', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>Rol</span>
                      <select
                        value={teamForm.role}
                        onChange={e => setTeamForm(prev => ({ ...prev, role: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '11px 12px',
                          borderRadius: 10,
                          border: '1px solid rgba(255,255,255,0.18)',
                          background: 'rgba(8, 14, 28, 0.82)',
                          color: '#f8fafc',
                          outline: 'none',
                        }}
                      >
                        <option value="ceo">CEO</option>
                        <option value="cashier">Cashier</option>
                      </select>
                    </label>

                    <label style={{ display: 'grid', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>Sucursal (opcional)</span>
                      <select
                        value={teamForm.branch_id}
                        onChange={e => setTeamForm(prev => ({ ...prev, branch_id: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '11px 12px',
                          borderRadius: 10,
                          border: '1px solid rgba(255,255,255,0.18)',
                          background: 'rgba(8, 14, 28, 0.82)',
                          color: '#f8fafc',
                          outline: 'none',
                        }}
                      >
                        <option value="">Todas / Sin restricción</option>
                        {branches.filter(b => b.id !== 'all').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </label>
                  </div>

                  <div style={{
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)',
                    padding: 14,
                  }}>
                    <div style={{ marginBottom: 10 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>Pestañas habilitadas</p>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                        Selecciona qué secciones puede ver este usuario.
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {ALL_TABS.map(tabId => {
                        const active = teamForm.allowed_tabs?.includes(tabId) ?? false;
                        return (
                          <button
                            key={tabId}
                            type="button"
                            onClick={() => toggleTeamTab(tabId)}
                            style={{
                              border: active ? '1px solid rgba(37, 211, 102, 0.6)' : '1px solid rgba(255,255,255,0.2)',
                              background: active ? 'rgba(37, 211, 102, 0.16)' : 'rgba(255,255,255,0.04)',
                              color: active ? '#d9ffe9' : '#e5e7eb',
                              borderRadius: 999,
                              padding: '6px 11px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all .18s ease',
                            }}
                          >
                            {TAB_LABELS[tabId]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 20px',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.28)',
                }}>
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.62)' }}>
                    {teamForm.allowed_tabs?.length || 0} pestañas seleccionadas
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="admin-btn secondary"
                      onClick={() => !teamSubmitting && (setTeamModalOpen(false), setTeamUserToEdit(null))}
                      disabled={teamSubmitting}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="admin-btn primary" disabled={teamSubmitting}>
                      {teamSubmitting ? <Loader2 size={18} className="animate-spin" /> : (teamUserToEdit ? 'Guardar cambios' : 'Crear usuario')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeDynamicModule && activeDynamicModule.tabId === 'module:tickets' && (
          <TenantTicketsPanel showNotify={showNotify} primaryColor={primaryColor} />
        )}

        {activeDynamicModule && activeDynamicModule.tabId !== 'module:tickets' && (
          <div className="glass" style={{ padding: 24, borderRadius: 14, display: 'grid', gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7 }}>
                Nuevo módulo
              </p>
              <h3 style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 800 }}>
                {activeDynamicModule.label}
              </h3>
              <p style={{ margin: '10px 0 0', opacity: 0.85 }}>
                {activeDynamicModule.description || 'Módulo agregado desde SaaS. Aquí vivirá la nueva funcionalidad del panel admin.'}
              </p>
            </div>
            <div style={{
              border: '1px dashed rgba(255,255,255,0.22)',
              borderRadius: 12,
              padding: 14,
              background: 'rgba(255,255,255,0.03)'
            }}>
              <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>
                Este espacio está listo para implementar la lógica del módulo <strong>{activeDynamicModule.label}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* 4.5 CAJA */}
        {activeTab === 'caja' && (
          <React.Suspense fallback={<TabFallback />}>
            <CashManager showNotify={showNotify} selectedBranchId={selectedBranch?.id} orders={orders} />
          </React.Suspense>
        )}

        {/* 5. CATEGORÍAS */}
        {activeTab === 'categories' && (
          <div className="cat-container">
            <div className="cat-header">
              <div className="cat-header-left">
                <h2 className="cat-title">Categorías</h2>
                <p className="cat-subtitle">Gestiona tus categorías de productos</p>
              </div>
              <div className="cat-header-actions">
                {categories.length > 0 && (
                  <button
                    onClick={() => { setEditingCategory(null); setIsCategoryModalOpen(true) }}
                    className="btn btn-primary"
                    disabled={!selectedBranch || selectedBranch.id === 'all'}
                    title={selectedBranch?.id === 'all' ? 'Selecciona una sucursal' : undefined}
                  >
                    <Plus size={18} /> Nueva Categoría
                  </button>
                )}
              </div>
            </div>
            
            {(!selectedBranch || selectedBranch.id === 'all') ? (
              <div className="cat-empty-state">
                <div className="cat-empty-icon">
                  <List size={48} />
                </div>
                <h3 className="cat-empty-title">Selecciona una sucursal</h3>
                <p className="cat-empty-text">El orden y activación de categorías es por local.</p>
              </div>
            ) : (
            <div className="cat-grid">
              {sortedCategories.map(c => {
                const categoryProducts = products.filter(p => p.category_id === c.id);
                const activeProducts = categoryProducts.filter(p => p.is_active);
                const totalRevenue = orders
                  .filter(o => o.status === 'completed' || o.status === 'picked_up')
                  .reduce((sum, order) => {
                    const items = Array.isArray(order.items) ? order.items : [];
                    return sum + items.reduce((itemSum, item) => {
                      const product = products.find(p => p.id === (item.id ?? item.product_id));
                      if (!product || product.category_id !== c.id) return itemSum;
                      const qty = Math.max(0, Number(item.quantity) || 1);
                      const price = Number(item.price) ?? 0;
                      return itemSum + price * qty;
                    }, 0);
                  }, 0);
                
                return (
                  <div
                    key={c.id}
                    className={`cat-card glass${dragCategoryId === c.id ? ' is-dragging' : ''}${dragOverCategoryId === c.id ? ' is-drop-target' : ''}`}
                    draggable={dragEnabled}
                    onDragStart={dragEnabled ? () => handleDragStart(c.id) : undefined}
                    onDragEnd={dragEnabled ? () => { setDragCategoryId(null); setDragOverCategoryId(null); } : undefined}
                    onDragOver={dragEnabled ? (event) => handleDragOver(event, c.id) : undefined}
                    onDragLeave={dragEnabled ? () => handleDragLeave(c.id) : undefined}
                    onDrop={dragEnabled ? (event) => handleDrop(event, c.id) : undefined}
                  >
                    <div className="cat-card-header">
                      <div className="cat-icon-wrapper">
                        <Tag size={24} />
                      </div>
                      <button
                        type="button"
                        className="cat-status-badge cat-status-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleCategoryActive(c.id, !c.is_active);
                        }}
                        title={c.is_active ? 'Desactivar categoría' : 'Activar categoría'}
                      >
                        <span className={`cat-status-dot ${c.is_active ? 'active' : 'inactive'}`}></span>
                        <span className="cat-status-text">{c.is_active ? 'Activa' : 'Inactiva'}</span>
                      </button>
                    </div>
                    
                    <div className="cat-card-body">
                      <div className="cat-name-row">
                        <h3 className="cat-name">{c.name}</h3>
                        <span className="cat-order-badge">#{Number(c.order) || 0}</span>
                      </div>
                      
                      <div className="cat-stats">
                        <div className="cat-stat">
                          <span className="cat-stat-label">Productos</span>
                          <span className="cat-stat-value">{categoryProducts.length}</span>
                        </div>
                        <div className="cat-stat">
                          <span className="cat-stat-label">Activos</span>
                          <span className="cat-stat-value">{activeProducts.length}</span>
                        </div>
                      </div>
                      
                      <div className="cat-revenue">
                        <span className="cat-revenue-label">Ingresos totales</span>
                        <span className="cat-revenue-value">${totalRevenue.toLocaleString('es-CL')}</span>
                      </div>
                      
                      <div className="cat-progress-wrapper">
                        <div className="cat-progress-bar">
                          <div 
                            className="cat-progress-fill" 
                            style={{ width: `${products.length > 0 ? (categoryProducts.length / products.length) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="cat-progress-text">
                          {products.length > 0 ? Math.round((categoryProducts.length / products.length) * 100) : 0}% del catálogo
                        </span>
                      </div>
                    </div>
                    
                    <div className="cat-card-footer">
                      <button 
                        onClick={() => { setEditingCategory(c); setIsCategoryModalOpen(true) }} 
                        className="cat-btn-edit"
                      >
                        <Edit size={16} />
                        Editar
                      </button>
                      <button 
                        onClick={() => {
                          setFilterCategory(c.id);
                          setActiveTab('products');
                        }}
                        className="cat-btn-view"
                      >
                        <ShoppingBag size={16} />
                        Ver productos
                      </button>
                      <button 
                        type="button"
                        onClick={() => deleteCategory(c)}
                        className="cat-btn-delete"
                        title="Eliminar categoría"
                      >
                        <Trash2 size={16} />
                        Borrar
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {categories.length === 0 && (
                <div className="cat-empty-state">
                  <div className="cat-empty-icon">
                    <List size={48} />
                  </div>
                  <h3 className="cat-empty-title">No hay categorías</h3>
                  <p className="cat-empty-text">Crea tu primera categoría para organizar tus productos</p>
                  <button 
                    onClick={() => { setEditingCategory(null); setIsCategoryModalOpen(true) }} 
                    className="btn btn-primary"
                  >
                    <Plus size={18} /> Crear Categoría
                  </button>
                </div>
              )}
            </div>
            )}
          </div>
        )}

      </main>

      {/* PANEL CLIENTE LATERAL (MODULARIZADO) */}
      <ClientDetailsPanel
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        clientHistoryLoading={clientHistoryLoading}
        selectedClientOrders={selectedClientOrders}
        setReceiptModalOrder={setReceiptModalOrder}
      />



      {/* MODAL COMPROBANTE (EXISTENTE) */}
      {receiptModalOrder && (
        <div className="admin-panel-overlay" onClick={() => { if (receiptPreview) URL.revokeObjectURL(receiptPreview); setReceiptModalOrder(null); setReceiptPreview(null); }}>
          <div className="admin-side-panel glass animate-slide-in" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="admin-side-header">
              <h3>Comprobante de Pago</h3>
              <button onClick={() => { if (receiptPreview) URL.revokeObjectURL(receiptPreview); setReceiptModalOrder(null); setReceiptPreview(null); }} className="btn-close-sidepanel"><X size={24} /></button>
            </div>
            <div className="admin-side-body">
              {receiptModalOrder.payment_ref && receiptModalOrder.payment_ref.startsWith('http') && !receiptPreview && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ marginBottom: 10, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Comprobante actual:</p>
                  <a href={receiptModalOrder.payment_ref} target="_blank" rel="noreferrer" style={{ display: 'block', marginBottom: 15 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={receiptModalOrder.payment_ref} alt="Comprobante" style={{ width: '100%', borderRadius: 8, border: '1px solid var(--card-border)' }} />
                  </a>
                </div>
              )}

              <div className="form-group">
                <label>Subir nuevo comprobante</label>
                <div className="upload-box" onClick={() => document.getElementById('receipt-upload-modal').click()} style={{ borderColor: receiptPreview ? '#25d366' : 'var(--card-border)' }}>
                  <input type="file" id="receipt-upload-modal" accept="image/*" hidden onChange={handleReceiptFileChange} />
                  {receiptPreview ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15, justifyContent: 'center', position: 'relative' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={receiptPreview} alt="Preview" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', border: '1px solid white' }} />
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'white' }}>Imagen Seleccionada</span>
                        <span style={{ fontSize: '0.75rem', color: '#25d366' }}>Click para cambiar</span>
                        <button 
                          type="button" 
                          className="btn-text" 
                          style={{ color: '#ff4444', fontSize: '0.75rem', padding: 0, marginTop: 4 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setReceiptPreview(null);
                            document.getElementById('receipt-upload-modal').value = '';
                          }}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <Upload size={24} />
                      <span>Subir imagen</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="admin-side-footer">
              <button
                className="btn btn-primary btn-block"
                onClick={() => {
                  const fileInput = document.getElementById('receipt-upload-modal');
                  if (fileInput?.files[0]) {
                    uploadReceiptToOrder(receiptModalOrder.id, fileInput.files[0]);
                  } else {
                    showNotify('Selecciona una imagen', 'error');
                  }
                }}
                disabled={uploadingReceipt || !receiptPreview}
              >
                {uploadingReceipt ? 'Subiendo...' : 'Guardar Comprobante'}
              </button>
            </div>
          </div>
        </div>
      )}


      <ManualOrderModal
        isOpen={isManualOrderModalOpen}
        onClose={() => setIsManualOrderModalOpen(false)}
        products={products}
        categories={categories}
        onOrderSaved={() => loadData(true)}
        isMobile={isMobile}
        showNotify={showNotify}
        registerSale={cashSystem.registerSale}
        branch={selectedBranch}
        logoUrl={logoUrl}
      />

      {isModalOpen && (
        <ProductModal 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveProduct} 
          product={editingProduct} 
          categories={categories} 
          saving={refreshing}
        />
      )}

      {/* MODAL DE SELECCIÓN DE ALCANCE */}
      <ScopeSelectionModal
        isOpen={scopeModal.isOpen}
        onClose={() => setScopeModal({ ...scopeModal, isOpen: false })}
        onConfirm={handleScopeConfirm}
        branchName={selectedBranch?.name || 'Sucursal'}
        actionType={scopeModal.item?.is_active ? 'deactivate' : 'activate'}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        category={editingCategory}
        defaultOrder={editingCategory ? editingCategory.order : nextCategoryOrder}
      />
    </div>
  );
};

const Admin = () => (
  <AdminProvider>
    <AdminPage />
  </AdminProvider>
);

export default Admin;
