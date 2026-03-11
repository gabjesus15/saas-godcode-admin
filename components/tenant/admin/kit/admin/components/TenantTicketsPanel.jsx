"use client";
import * as React from 'react';
import './styles/TenantTicketsPanel.css';
import { Send, Plus, MessageSquare, AlertCircle, Clock, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];
const CATEGORY_OPTIONS = ['general', 'billing', 'technical', 'product', 'account'];

export default function TenantTicketsPanel({ 
  showNotify, 
  primaryColor = '#000000', 
  secondaryColor = '#2563eb' 
}) {
  // --- Estados ---
  const [tickets, setTickets] = React.useState([]);
  const [selectedTicketId, setSelectedTicketId] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [messagesLoading, setMessagesLoading] = React.useState(false);
  const [reply, setReply] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  
  // Formulario nuevo ticket
  const [subject, setSubject] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [priority, setPriority] = React.useState('medium');
  const [category, setCategory] = React.useState('general');
  
  const [isClient, setIsClient] = React.useState(false);

  // --- Efectos ---
  React.useEffect(() => { 
    setIsClient(true); 
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (selectedTicketId) fetchMessages(selectedTicketId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicketId]);

  // --- Funciones de API ---
  async function fetchTickets() {
    setLoading(true);
    try {
      const res = await fetch('/api/tenant-tickets', { credentials: 'include' });
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (error) {
      if (showNotify) void showNotify('Error al cargar tickets', 'error');
      console.error("Error fetching tickets:", error);
    }
    setLoading(false);
  }

  async function createTicket() {
    if (!subject.trim() || !description.trim()) {
      if (showNotify) void showNotify('Completa asunto y descripción', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/tenant-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, description, priority, category }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Error al crear ticket');
      
      setSubject('');
      setDescription('');
      fetchTickets();
      if (showNotify) void showNotify('Ticket creado', 'success');
    } catch (error) {
      if (showNotify) void showNotify('Error al crear ticket', 'error');
      console.error("Error creating ticket:", error);
    }
    setSaving(false);
  }

  async function sendReply() {
    if (!reply.trim() || !selectedTicketId) {
      if (showNotify) void showNotify('Escribe una respuesta', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/tenant-tickets/${selectedTicketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Error al enviar respuesta');
      
      setReply('');
      fetchMessages(selectedTicketId);
      if (showNotify) void showNotify('Respuesta enviada', 'success');
    } catch (error) {
      if (showNotify) void showNotify('Error al enviar respuesta', 'error');
      console.error("Error sending reply:", error);
    }
    setSaving(false);
  }

  async function fetchMessages(ticketId) {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/tenant-tickets/${ticketId}/messages`, { credentials: 'include' });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      if (showNotify) void showNotify('Error al cargar mensajes', 'error');
      console.error("Error fetching messages:", error);
    }
    setMessagesLoading(false);
  }

  // --- Renderizado ---
  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

     const safePrimary = primaryColor || '#000000';
     // [MEJORA] Inyectamos variables CSS para que todo el panel herede el color del negocio
     const dynamicStyles = {
         '--tenant-primary': safePrimary,
         '--tenant-secondary': secondaryColor
     };

    // Helper para determinar el color de prioridad
    const getPriorityColor = (p) => {
        switch(p) {
            case 'critical': return '#ef4444';
            case 'high': return '#f97316';
            case 'medium': return '#eab308';
            default: return '#22c55e';
        }
    };

  // Prevenir hidratación incorrecta en Next/Remix
  if (!isClient) return null;

  return (
    <section className="tenant-tickets-panel animate-fade" style={dynamicStyles} aria-label="Panel de soporte y tickets">
      
      {/* --- Columna 1: Crear Ticket --- */}
      <div className="glass ticket-create" role="form" aria-labelledby="ticket-create-title">
        <div className="ticket-create-content">
            <div className="create-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: `${primaryColor}20`, padding: '8px', borderRadius: '10px', color: primaryColor }}><Plus size={20} /></div>
                    <h3 id="ticket-create-title">Nuevo ticket</h3>
                </div>
                <p>Describe tu problema y te ayudaremos pronto.</p>
            </div>
        
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Asunto"
          className="form-input"
          aria-label="Asunto del ticket"
        />
        
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe el problema o solicitud..."
          rows={4}
          className="form-input"
          style={{ resize: 'vertical', minHeight: '80px' }}
          aria-label="Descripción del ticket"
        />
        
        <div className="panel-selects" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-input"
            aria-label="Categoría del ticket"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="form-input"
            aria-label="Prioridad del ticket"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        <button 
            onClick={createTicket} 
            className="ticket-action-btn" 
            disabled={saving}
            style={{ 
                backgroundColor: primaryColor, 
                borderColor: primaryColor, 
                marginTop: 'auto'
            }}
        >
          {saving ? <><Loader2 size={18} className="animate-spin" /> Guardando...</> : <><Plus size={18} /> Crear ticket</>}
        </button>
        </div>
      </div>

      {/* --- Columna 2: Lista de Tickets --- */}
      <div className="glass tickets-list-container" role="region" aria-label="Lista de tickets">
        <div className="tickets-scroll-area">
        {loading ? (
          <div className="empty-state-centered"><Clock className="animate-spin" size={24} style={{marginBottom: 10, opacity: 0.5}}/> Cargando tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="empty-state-centered">No tienes tickets activos.</div>
        ) : (
          <ul className="ticket-rows">
            {tickets.map((t) => (
              <li 
                key={t.id} 
                className={`ticket-row ${selectedTicketId === t.id ? 'selected' : ''}`} 
                onClick={() => setSelectedTicketId(t.id)}
                style={selectedTicketId === t.id ? { 
                    borderLeft: `3px solid ${primaryColor}`
                } : { borderLeft: '4px solid transparent' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                    {/* [CONTRASTE] Eliminado color: primaryColor para evitar texto oscuro sobre fondo oscuro. Se usa blanco o resaltado por CSS. */}
                    <span className="ticket-subject" style={selectedTicketId === t.id ? { fontWeight: '700', color: '#fff' } : {}}>{t.subject}</span>
                    {selectedTicketId === t.id && <ChevronRight size={16} color={primaryColor} />}
                </div>
                <div className="ticket-meta">
                  {/* Aplicamos las clases para que se vean como 'badges' profesionales */}
                  <span className="ticket-status">{t.category}</span>
                  <span 
                    className="ticket-priority" 
                    style={{ color: getPriorityColor(t.priority), borderColor: `${getPriorityColor(t.priority)}40`, background: `${getPriorityColor(t.priority)}15` }}
                  >
                    {t.priority}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        </div>
      </div>

      {/* --- Columna 3: Hilo de Mensajes --- */}
      <div className="glass ticket-thread" role="region" aria-label="Conversación del ticket">
        {selectedTicket ? (
          <>
            <div className="thread-header">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '6px', color: 'white' }}>{selectedTicket.subject}</h3>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: '#64748b' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {selectedTicket.priority}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={14} /> {selectedTicket.category}</span>
                </div>
            </div>
            
            <div className="messages-area" aria-live="polite">
              {messagesLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontStyle: 'italic' }}>
                    <Clock size={16} className="animate-spin" /> Cargando mensajes…
                </div>
              ) : messages.length === 0 ? (
                <div className="empty-state-centered" style={{ height: '100%' }}>
                    <MessageSquare size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
                    <p>Aún no hay mensajes en este ticket.</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`message-row ${m.author === 'Soporte' ? 'is-support' : 'is-tenant'}`}>
                    <div className="message-author">
                      <span style={{ color: m.author === 'Soporte' ? secondaryColor : primaryColor }}>{m.author}</span>
                      {/* Opcional: Aquí podrías poner la fecha del mensaje si la tuvieras */}
                    </div>
                    <div className="message-body">{m.body}</div>
                  </div>
                ))
              )}
            </div>

            <div className="reply-box">
            <textarea 
              value={reply} 
              onChange={(e) => setReply(e.target.value)} 
              placeholder="Escribe tu respuesta aquí..." 
              className="form-input" 
              style={{ minHeight: '60px', resize: 'vertical', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
              rows={3} 
            />
            
            <button 
                onClick={sendReply} 
                disabled={saving} 
                className="ticket-action-btn"
                style={{ 
                    backgroundColor: primaryColor, 
                    borderColor: primaryColor,
                    alignSelf: 'flex-end',
                    width: 'auto' /* Para que no ocupe todo el ancho */
                }}
            >
              {saving ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : <><Send size={16} /> Enviar respuesta</>}
            </button>
            </div>
          </>
        ) : (
          <div className="empty-state-centered">
            <MessageSquare size={48} style={{ marginBottom: '16px', color: 'var(--tenant-primary)', opacity: 0.5 }} />
            <p>Selecciona un ticket de la lista para ver la conversación.</p>
          </div>
        )}
      </div>
    </section>
  );
}