'use client';

import { useState, useEffect, useMemo } from 'react';
import { SUBJECTS, Subject, getSubjectsArray } from '@/lib/subjects';
import { FIXED_EVENTS } from '@/lib/fixedEvents';

// Tipos
interface CalendarEvent {
    id: string;
    recurringEventId?: string;
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    hangoutLink?: string;
    htmlLink?: string;
    status?: string;
}

interface AllSubjectsInstances {
    [key: string]: CalendarEvent[];
}

type ViewMode = 'monthly' | 'weekly';

export default function Home() {
    // Reloj en tiempo real (solo cliente)
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Estado de autenticación
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    // Estado de navegación
    const [viewMode, setViewMode] = useState<ViewMode>('monthly');
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        return new Date(today.setDate(diff));
    });
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    // Estado de instancias
    const [allInstances, setAllInstances] = useState<AllSubjectsInstances>({});
    const [selectedInstance, setSelectedInstance] = useState<CalendarEvent | null>(null);
    const [selectedInstanceSubject, setSelectedInstanceSubject] = useState<Subject | null>(null);
    const [deletedInstances, setDeletedInstances] = useState<CalendarEvent[]>([]);

    // Estado de UI
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
    const [showDeletedPanel, setShowDeletedPanel] = useState(false);

    // Estado del formulario de edición
    const [editForm, setEditForm] = useState({
        summary: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        duration: 60
    });

    // Reloj actualizado cada segundo (solo cliente para evitar hydration mismatch)
    useEffect(() => {
        setIsMounted(true);
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Verificar autenticación y cargar datos al iniciar
    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            loadAllInstances();
        }
    }, [isAuthenticated]);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/events/list?subject=Matemáticas&date=' + new Date().toISOString().split('T')[0]);
            const data = await res.json();
            setIsAuthenticated(!data.needsAuth);
        } catch {
            setIsAuthenticated(false);
        }
    };

    const showToast = (text: string, type: 'success' | 'error' | 'warning' | 'info') => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Cargar instancias de todas las materias
    const loadAllInstances = async () => {
        setLoading(true);
        const subjects = getSubjectsArray();
        const allData: AllSubjectsInstances = {};

        try {
            await Promise.all(subjects.map(async (subject) => {
                try {
                    const res = await fetch(`/api/events/instances?subject=${subject.name}&weeks=12`);
                    const data = await res.json();
                    if (data.success) {
                        allData[subject.name] = data.instances;
                    }
                } catch (e) {
                    console.error(`Error loading ${subject.name}:`, e);
                }
            }));
            setAllInstances(allData);
        } catch (err: any) {
            showToast('Error cargando datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Seleccionar una instancia para editar
    const handleSelectInstance = (instance: CalendarEvent, subject: Subject) => {
        setSelectedInstance(instance);
        setSelectedInstanceSubject(subject);

        const startDate = new Date(instance.start.dateTime);
        const endDate = new Date(instance.end.dateTime);
        const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

        setEditForm({
            summary: instance.summary || '',
            description: instance.description || '',
            date: startDate.toISOString().split('T')[0],
            startTime: startDate.toTimeString().slice(0, 5),
            endTime: endDate.toTimeString().slice(0, 5),
            duration: durationMinutes
        });
    };

    // Cerrar editor
    const handleCloseEditor = () => {
        setSelectedInstance(null);
        setSelectedInstanceSubject(null);
    };

    // Guardar cambios
    const handleSaveInstance = async () => {
        if (!selectedInstanceSubject || !selectedInstance) return;

        setLoading(true);
        try {
            const startDateTime = new Date(`${editForm.date}T${editForm.startTime}:00`);
            const endDateTime = new Date(`${editForm.date}T${editForm.endTime}:00`);

            const res = await fetch('/api/events/edit', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: selectedInstanceSubject,
                    eventId: selectedInstance.id,
                    summary: editForm.summary,
                    description: editForm.description,
                    start: startDateTime.toISOString(),
                    end: endDateTime.toISOString()
                })
            });

            const data = await res.json();

            if (data.success) {
                showToast('✓ Clase actualizada correctamente', 'success');
                await loadAllInstances();
                handleCloseEditor();
            } else {
                showToast(data.error || 'Error al guardar', 'error');
            }
        } catch (err: any) {
            showToast('Error: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Cancelar/Eliminar instancia
    const handleDeleteInstance = async () => {
        if (!selectedInstanceSubject || !selectedInstance) return;

        if (!confirm('¿Cancelar esta clase? Podrás restaurarla después.')) return;

        setLoading(true);
        try {
            const res = await fetch('/api/events/instance', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: selectedInstanceSubject,
                    instanceId: selectedInstance.id
                })
            });

            const data = await res.json();

            if (data.success) {
                showToast('Clase cancelada. Puedes restaurarla.', 'warning');
                setDeletedInstances(prev => [...prev, { ...selectedInstance, recurringEventId: selectedInstanceSubject }]);
                await loadAllInstances();
                handleCloseEditor();
            } else {
                showToast(data.error || 'Error al cancelar', 'error');
            }
        } catch (err: any) {
            showToast('Error: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Reprogramar clase (mover a otra fecha manteniendo permisos)
    const handleReschedule = () => {
        if (!selectedInstance) return;
        showToast('Modifica la fecha/hora y guarda. Los permisos del Meet se mantienen.', 'info');
    };

    // Restaurar instancia
    const handleRestoreInstance = async (instance: CalendarEvent) => {
        const subject = instance.recurringEventId as Subject || 'Matemáticas';

        setLoading(true);
        try {
            const res = await fetch('/api/events/instance', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject,
                    instanceId: instance.id,
                    originalStart: instance.start.dateTime,
                    originalEnd: instance.end.dateTime
                })
            });

            const data = await res.json();

            if (data.success) {
                showToast('✓ Clase restaurada', 'success');
                setDeletedInstances(prev => prev.filter(i => i.id !== instance.id));
                await loadAllInstances();
            } else {
                showToast(data.error || 'Error al restaurar', 'error');
            }
        } catch (err: any) {
            showToast('Error: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Helpers de fecha
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    };

    const formatTimeStr = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateShort = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    };

    const isSameDay = (date1: Date, date2: Date) => {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    };

    const getWeekDays = (startDate: Date) => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            days.push(day);
        }
        return days;
    };

    const getMonthDays = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days: { date: Date; isCurrentMonth: boolean }[] = [];

        const firstDayOfWeek = firstDay.getDay();
        for (let i = firstDayOfWeek; i > 0; i--) {
            days.push({ date: new Date(year, month, 1 - i), isCurrentMonth: false });
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }

        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
        }

        return days;
    };

    const getEventsForDay = (day: Date, subject?: Subject): (CalendarEvent & { subjectName?: Subject })[] => {
        if (subject) {
            return (allInstances[subject] || []).filter(e =>
                isSameDay(new Date(e.start.dateTime), day)
            );
        }
        return Object.entries(allInstances).flatMap(([subj, instances]) =>
            instances.filter(e => isSameDay(new Date(e.start.dateTime), day)).map(e => ({
                ...e,
                subjectName: subj as Subject
            }))
        );
    };

    const navigateWeek = (direction: number) => {
        setCurrentWeekStart(prev => {
            const newDate = new Date(prev);
            newDate.setDate(prev.getDate() + (direction * 7));
            return newDate;
        });
    };

    const navigateMonth = (direction: number) => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentMonth(today);
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        setCurrentWeekStart(new Date(new Date().setDate(diff)));
    };

    const subjects = getSubjectsArray();
    const weekDays = getWeekDays(currentWeekStart);
    const monthDays = getMonthDays(currentMonth);
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // =========================================
    // RENDER
    // =========================================
    return (
        <div className="app-container">
            {/* Toast Notification */}
            {toast && (
                <div className={`toast toast-${toast.type} fade-in`}>
                    <span>{toast.text}</span>
                </div>
            )}

            {/* Futuristic Clock */}
            <div className="futuristic-clock">
                <div className="clock-time">
                    {currentTime ? (
                        <>
                            {currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                            <span className="seconds">:{currentTime.getSeconds().toString().padStart(2, '0')}</span>
                        </>
                    ) : (
                        <span>--:--</span>
                    )}
                </div>

                <div className="clock-actions">
                    <button className="clock-btn" onClick={goToToday}>
                        📍 Hoy
                    </button>
                    <button className="clock-btn" onClick={loadAllInstances} disabled={loading}>
                        {loading ? '⏳' : '🔄'} Sincronizar
                    </button>
                    {deletedInstances.length > 0 && (
                        <button className="clock-btn" onClick={() => setShowDeletedPanel(!showDeletedPanel)}>
                            🗑️ {deletedInstances.length}
                        </button>
                    )}
                </div>

                <div className="clock-date">
                    {currentTime ? (
                        <>
                            <div className="day-name">
                                {currentTime.toLocaleDateString('es-CO', { weekday: 'long' })}
                            </div>
                            <div className="full-date">
                                {currentTime.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                        </>
                    ) : (
                        <div className="full-date">Cargando...</div>
                    )}
                </div>
            </div>

            {/* Estado de conexión */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                    📅 Calendario de Clases
                </h1>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {isAuthenticated === false && (
                        <a href="/api/auth/login" className="btn btn-primary btn-sm">
                            🔐 Conectar
                        </a>
                    )}
                    {isAuthenticated === true && (
                        <span className="status-badge connected">
                            <span className="status-dot"></span> Conectado
                        </span>
                    )}
                </div>
            </div>

            {/* Panel de eliminados */}
            {showDeletedPanel && deletedInstances.length > 0 && (
                <div className="deleted-panel fade-in">
                    <div className="deleted-panel-header">
                        <span>🗑️</span>
                        <span>Clases Canceladas ({deletedInstances.length})</span>
                    </div>
                    <div className="deleted-items">
                        {deletedInstances.map(inst => (
                            <div key={inst.id} className="deleted-item">
                                <div className="deleted-item-info">
                                    <strong>{inst.summary}</strong>
                                    <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>
                                        {formatDateShort(inst.start.dateTime)}
                                    </span>
                                </div>
                                <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleRestoreInstance(inst)}
                                    disabled={loading}
                                >
                                    ♻️ Restaurar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="nav-tabs">
                <button
                    className={`nav-tab ${viewMode === 'monthly' && !selectedSubject ? 'active' : ''}`}
                    onClick={() => { setViewMode('monthly'); setSelectedSubject(null); handleCloseEditor(); }}
                >
                    📆 Vista Mensual
                </button>
                {subjects.map(subj => (
                    <button
                        key={subj.name}
                        className={`nav-tab ${viewMode === 'weekly' && selectedSubject === subj.name ? 'active' : ''}`}
                        onClick={() => { setViewMode('weekly'); setSelectedSubject(subj.name); handleCloseEditor(); }}
                    >
                        <span className="tab-dot" style={{ background: subj.color }}></span>
                        {subj.displayName}
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className="layout-split">
                {/* Calendar Area */}
                <div className="calendar-container">
                    {/* Calendar Header */}
                    <div className="calendar-header">
                        <div className="calendar-nav">
                            <button className="calendar-nav-btn" onClick={() => viewMode === 'monthly' ? navigateMonth(-1) : navigateWeek(-1)}>
                                ←
                            </button>
                        </div>

                        <h2 className="calendar-title">
                            {viewMode === 'monthly'
                                ? currentMonth.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
                                : `${weekDays[0].toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} - ${weekDays[6].toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`
                            }
                        </h2>

                        <div className="calendar-nav">
                            <button className="calendar-nav-btn" onClick={() => viewMode === 'monthly' ? navigateMonth(1) : navigateWeek(1)}>
                                →
                            </button>
                        </div>
                    </div>

                    {/* Legend */}
                    {viewMode === 'monthly' && (
                        <div className="calendar-legend">
                            {subjects.map(subj => (
                                <div key={subj.name} className="legend-item">
                                    <div className="legend-dot" style={{ background: subj.color }}></div>
                                    <span>{subj.displayName}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Meet Link for Weekly View */}
                    {viewMode === 'weekly' && selectedSubject && allInstances[selectedSubject]?.[0]?.hangoutLink && (
                        <div className="protected-field" style={{ marginBottom: '1rem', textAlign: 'center' }}>
                            <span style={{ fontWeight: '600', color: '#059669' }}>🎥 Meet Fijo: </span>
                            <a href={allInstances[selectedSubject][0].hangoutLink} target="_blank" rel="noopener noreferrer" className="meet-link">
                                {allInstances[selectedSubject][0].hangoutLink}
                            </a>
                        </div>
                    )}

                    {loading ? (
                        <div className="empty-state">
                            <div className="empty-state-icon loading">⏳</div>
                            <p>Cargando calendario...</p>
                        </div>
                    ) : viewMode === 'monthly' ? (
                        /* Monthly Grid */
                        <div className="calendar-grid monthly">
                            {dayNames.map(day => (
                                <div key={day} className="calendar-day-header">{day}</div>
                            ))}
                            {monthDays.map(({ date, isCurrentMonth }, idx) => {
                                const events = getEventsForDay(date);
                                const isToday = isSameDay(date, new Date());

                                return (
                                    <div
                                        key={idx}
                                        className={`calendar-day ${isToday ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
                                    >
                                        <div className="calendar-day-number">{date.getDate()}</div>
                                        {events.slice(0, 3).map((event, i) => {
                                            const subjectData = subjects.find(s => s.name === event.subjectName);
                                            return (
                                                <div
                                                    key={i}
                                                    className="calendar-event"
                                                    style={{ background: subjectData?.color || '#6366f1' }}
                                                    onClick={() => event.subjectName && handleSelectInstance(event, event.subjectName)}
                                                >
                                                    {formatTimeStr(event.start.dateTime)} {subjectData?.icon}
                                                </div>
                                            );
                                        })}
                                        {events.length > 3 && (
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                +{events.length - 3} más
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Weekly Grid */
                        <div className="calendar-grid weekly">
                            {weekDays.map((day, idx) => {
                                const events = selectedSubject ? getEventsForDay(day, selectedSubject) : [];
                                const isToday = isSameDay(day, new Date());

                                return (
                                    <div key={idx} className={`weekly-day ${isToday ? 'today' : ''}`}>
                                        <div className="weekly-day-header">
                                            <div className="weekly-day-name">{dayNames[day.getDay()]}</div>
                                            <div className="weekly-day-number">{day.getDate()}</div>
                                        </div>
                                        {events.map((event, i) => (
                                            <div
                                                key={i}
                                                className="weekly-event"
                                                style={{ background: selectedSubject ? SUBJECTS[selectedSubject].color : '#6366f1' }}
                                                onClick={() => selectedSubject && handleSelectInstance(event, selectedSubject)}
                                            >
                                                <div className="weekly-event-time">{formatTimeStr(event.start.dateTime)}</div>
                                                <div className="weekly-event-title">{event.summary}</div>
                                            </div>
                                        ))}
                                        {events.length === 0 && (
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '2rem' }}>
                                                Sin clases
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Editor Panel */}
                {selectedInstance && selectedInstanceSubject ? (
                    <div className="editor-panel fade-in">
                        <div className="editor-header" style={{ background: `linear-gradient(135deg, ${SUBJECTS[selectedInstanceSubject].color}, ${SUBJECTS[selectedInstanceSubject].color}dd)` }}>
                            <h3>
                                {SUBJECTS[selectedInstanceSubject].icon} Editar Clase
                            </h3>
                            <span className="editor-header-badge">
                                {formatDateShort(selectedInstance.start.dateTime)}
                            </span>
                        </div>

                        <div className="editor-body">
                            {/* Quick Actions */}
                            <div className="editor-section">
                                <div className="editor-section-title">⚡ Acciones Rápidas</div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button className="btn btn-ghost btn-sm" onClick={handleReschedule}>
                                        📅 Reprogramar
                                    </button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => selectedInstance.htmlLink && window.open(selectedInstance.htmlLink, '_blank')}>
                                        🔗 Ver en Calendar
                                    </button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => selectedInstance.hangoutLink && window.open(selectedInstance.hangoutLink, '_blank')}>
                                        🎥 Abrir Meet
                                    </button>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="editor-section">
                                <div className="editor-section-title">📝 Información</div>

                                <div className="form-group">
                                    <label className="form-label">Título</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editForm.summary}
                                        onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                                        placeholder="Nombre de la clase"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Descripción</label>
                                    <textarea
                                        className="form-input form-textarea"
                                        rows={2}
                                        value={editForm.description}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        placeholder="Notas, temas a tratar..."
                                    />
                                </div>
                            </div>

                            <div className="editor-section">
                                <div className="editor-section-title">🕐 Horario</div>

                                <div className="form-group">
                                    <label className="form-label">Fecha</label>
                                    <input
                                        type="date"
                                        className="form-input font-mono"
                                        value={editForm.date}
                                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Inicio</label>
                                        <input
                                            type="time"
                                            className="form-input font-mono"
                                            value={editForm.startTime}
                                            onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Fin</label>
                                        <input
                                            type="time"
                                            className="form-input font-mono"
                                            value={editForm.endTime}
                                            onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Protected Meet Link */}
                            <div className="protected-field">
                                <div className="protected-header">
                                    <span className="protected-title">
                                        🎥 Google Meet
                                    </span>
                                    <span className="protected-badge">
                                        🔒 Fijo
                                    </span>
                                </div>
                                {selectedInstance.hangoutLink ? (
                                    <a href={selectedInstance.hangoutLink} target="_blank" rel="noopener noreferrer" className="meet-link">
                                        {selectedInstance.hangoutLink}
                                    </a>
                                ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>Sin enlace</span>
                                )}
                                <div className="protected-badges">
                                    <span className="feature-badge">✓ Coorganizadores</span>
                                    <span className="feature-badge">✓ Oyentes</span>
                                    <span className="feature-badge">✓ Configuración</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="editor-actions">
                                <button className="btn btn-outline" onClick={handleCloseEditor}>
                                    Cancelar
                                </button>
                                <button className="btn btn-danger" onClick={handleDeleteInstance} disabled={loading}>
                                    🗑️ Eliminar
                                </button>
                                <button className="btn btn-success btn-full" onClick={handleSaveInstance} disabled={loading}>
                                    {loading ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                        <div className="empty-state">
                            <div className="empty-state-icon">📝</div>
                            <h4>Selecciona una clase</h4>
                            <p>Haz clic en cualquier evento del calendario para ver detalles y editarlo</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <p>Seamos Genios © 2026 — Sistema de Gestión de Clases</p>
            </footer>
        </div>
    );
}
