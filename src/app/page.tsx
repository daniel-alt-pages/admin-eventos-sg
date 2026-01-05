'use client';

import { useState, useEffect } from 'react';
import { SUBJECTS, Subject, getSubjectsArray } from '@/lib/subjects';

// Types
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
    subjectName?: Subject; // Extended property for UI
}

interface AllSubjectsInstances {
    [key: string]: CalendarEvent[];
}

type ViewMode = 'monthly' | 'weekly';

export default function Home() {
    // --- STATE ---
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('monthly');
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

    // Dates
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
        return new Date(today.setDate(diff));
    });
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    // Data
    const [allInstances, setAllInstances] = useState<AllSubjectsInstances>({});
    const [selectedInstance, setSelectedInstance] = useState<CalendarEvent | null>(null);
    const [deletedInstances, setDeletedInstances] = useState<CalendarEvent[]>([]);

    // UI State
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
    const [showDeletedPanel, setShowDeletedPanel] = useState(false);

    // Edit Form
    const [editForm, setEditForm] = useState({
        summary: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        duration: 60
    });

    // --- EFFECTS ---
    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        loadAllInstances();
        return () => clearInterval(timer);
    }, []);

    // --- METHODS ---

    // Notifications
    const showToast = (text: string, type: 'success' | 'error' | 'warning') => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Load Data
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
        } catch (err) {
            showToast('Error cargando datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Selection & Editing
    const handleSelectInstance = (instance: CalendarEvent, subject: Subject) => {
        setSelectedInstance({ ...instance, subjectName: subject });

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

    const handleSaveInstance = async () => {
        if (!selectedInstance || !selectedInstance.subjectName) return;

        setLoading(true);
        try {
            const startDateTime = new Date(`${editForm.date}T${editForm.startTime}:00`);
            const endDateTime = new Date(`${editForm.date}T${editForm.endTime}:00`);

            const res = await fetch('/api/events/edit', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: selectedInstance.subjectName,
                    eventId: selectedInstance.id,
                    summary: editForm.summary,
                    description: editForm.description,
                    start: startDateTime.toISOString(),
                    end: endDateTime.toISOString()
                })
            });

            const data = await res.json();
            if (data.success) {
                showToast('Clase actualizada', 'success');
                await loadAllInstances();
                setSelectedInstance(null);
            } else {
                showToast(data.error || 'Error', 'error');
            }
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteInstance = async () => {
        if (!selectedInstance || !selectedInstance.subjectName) return;
        if (!confirm('¿Cancelar clase?')) return;

        setLoading(true);
        try {
            const res = await fetch('/api/events/instance', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: selectedInstance.subjectName,
                    instanceId: selectedInstance.id
                })
            });

            const data = await res.json();
            if (data.success) {
                setDeletedInstances(prev => [...prev, selectedInstance]);
                showToast('Clase eliminada', 'warning');
                await loadAllInstances();
                setSelectedInstance(null);
            }
        } catch (err) {
            showToast('Error al eliminar', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Restore
    const handleRestore = async (instance: CalendarEvent) => {
        // Assuming we store subject somewhere, if not we default.Ideally deletedInstances stores subject too.
        // For simplicity reusing logic. The updated interface deletedInstances probably needs subject.
        const subject = instance.subjectName || 'Matemáticas';

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
                setDeletedInstances(prev => prev.filter(i => i.id !== instance.id));
                loadAllInstances();
                showToast('Clase restaurada', 'success');
            }
        } catch (e) { }
    }

    // Navigation Helpers
    const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const getWeekDays = (start: Date) =>
        Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });

    const getEventsForDay = (day: Date, subject?: Subject) => {
        if (subject) {
            return (allInstances[subject] || []).filter(e => isSameDay(new Date(e.start.dateTime), day))
                .map(e => ({ ...e, subjectName: subject }));
        }
        return Object.entries(allInstances).flatMap(([subj, instances]) =>
            instances.filter(e => isSameDay(new Date(e.start.dateTime), day))
                .map(e => ({ ...e, subjectName: subj as Subject }))
        );
    };

    const getMonthDays = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        // Days from prev month
        const firstDayOfWeek = firstDay.getDay(); // 0(Sun)
        for (let i = firstDayOfWeek; i > 0; i--) {
            days.push({ date: new Date(year, month, 1 - i), current: false });
        }
        // Current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ date: new Date(year, month, i), current: true });
        }
        // Next month filling
        while (days.length % 7 !== 0) {
            days.push({ date: new Date(year, month + 1, days.length - lastDay.getDate() - firstDayOfWeek + 1), current: false });
        }
        return days;
    };

    const weekDays = getWeekDays(currentWeekStart);
    const monthDays = getMonthDays(currentMonth);
    const subjects = getSubjectsArray();

    // --- RENDER ---
    return (
        <div className="app-container">
            {/* --- Notifications --- */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
                    background: toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : '#10b981',
                    color: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                }}>
                    {toast.text}
                </div>
            )}

            {/* --- Header & Clock --- */}
            <div className="header-wrapper">
                <h1 className="main-title">Manager de Eventos</h1>
                <p className="subtitle">Gestión inteligente de clases y recursos</p>
            </div>

            <div className="clock-card">
                <div className="time-display">
                    {currentTime ? currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </div>
                <div className="date-display">
                    <div className="date-day">
                        {currentTime ? currentTime.toLocaleDateString('es-CO', { weekday: 'long' }) : 'Loading'}
                    </div>
                    <div className="date-full">
                        {currentTime ? currentTime.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                    </div>
                </div>
            </div>

            {/* --- Controls --- */}
            <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className={`btn ${viewMode === 'monthly' && !selectedSubject ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => { setViewMode('monthly'); setSelectedSubject(null); }}
                    > 📅 Mes </button>
                    {subjects.map(s => (
                        <button
                            key={s.name}
                            className={`subject-badge ${selectedSubject === s.name ? 'active' : ''}`}
                            style={{
                                background: selectedSubject === s.name ? 'rgba(255,255,255,0.1)' : 'transparent',
                                border: selectedSubject === s.name ? `1px solid ${s.color}` : '1px solid transparent'
                            }}
                            onClick={() => { setViewMode('weekly'); setSelectedSubject(s.name); }}
                        >
                            <span className="subject-dot" style={{ background: s.color }}></span>
                            {s.displayName}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-ghost" onClick={loadAllInstances}>🔄 Sync</button>
                    {deletedInstances.length > 0 &&
                        <button className="btn btn-ghost" onClick={() => setShowDeletedPanel(!showDeletedPanel)}>🗑️ {deletedInstances.length}</button>
                    }
                </div>
            </div>

            {/* --- Deleted Panel --- */}
            {showDeletedPanel && (
                <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.1)' }}>
                    <h4>Papelera</h4>
                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '0.5rem' }}>
                        {deletedInstances.map((del, i) => (
                            <div key={i} className="day-card" style={{ minWidth: '200px', minHeight: 'auto' }}>
                                <div className="event-title">{del.summary}</div>
                                <div className="event-time">{new Date(del.start.dateTime).toLocaleDateString()}</div>
                                <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', marginTop: '0.5rem' }} onClick={() => handleRestore(del)}>Recuperar</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- Calendar Wrapper --- */}
            <div className="glass-panel calendar-wrapper">
                <div className="calendar-header">
                    <button className="nav-btn" onClick={() => viewMode === 'monthly' ? setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1))) : setCurrentWeekStart(new Date(currentWeekStart.setDate(currentWeekStart.getDate() - 7)))}>←</button>

                    <div className="calendar-title">
                        {viewMode === 'monthly'
                            ? currentMonth.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
                            : `${weekDays[0].getDate()} - ${weekDays[6].getDate()} ${weekDays[6].toLocaleDateString('es-CO', { month: 'short' })}`
                        }
                    </div>

                    <button className="nav-btn" onClick={() => viewMode === 'monthly' ? setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1))) : setCurrentWeekStart(new Date(currentWeekStart.setDate(currentWeekStart.getDate() + 7)))}>→</button>
                </div>

                {/* --- Grid View --- */}
                {viewMode === 'monthly' ? (
                    <div className="calendar-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                            <div key={d} style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{d}</div>
                        ))}
                        {monthDays.map((day, idx) => {
                            const events = getEventsForDay(day.date);
                            const isToday = isSameDay(day.date, new Date());
                            return (
                                <div key={idx} className={`day-card ${isToday ? 'today' : ''}`} style={{ opacity: day.current ? 1 : 0.4 }}>
                                    <div className="day-number" style={{ marginBottom: '0.5rem' }}>{day.date.getDate()}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {events.slice(0, 3).map((ev, i) => (
                                            <div
                                                key={i}
                                                className="event-item"
                                                style={{ borderLeftColor: SUBJECTS[ev.subjectName as Subject]?.color, fontSize: '0.7rem' }}
                                                onClick={() => handleSelectInstance(ev, ev.subjectName as Subject)}
                                            >
                                                {ev.summary}
                                            </div>
                                        ))}
                                        {events.length > 3 && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+{events.length - 3} más</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Weekly View (Responsive) */
                    <div className="calendar-grid weekly">
                        {weekDays.map((day, idx) => {
                            const events = getEventsForDay(day, selectedSubject || undefined);
                            const isToday = isSameDay(day, new Date());
                            return (
                                <div key={idx} className={`day-card ${isToday ? 'today' : ''}`}>
                                    <div className="day-header">
                                        <span className="day-name">{day.toLocaleDateString('es-CO', { weekday: 'short' })}</span>
                                        <span className="day-number">{day.getDate()}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {events.map((ev, i) => (
                                            <div
                                                key={i}
                                                className="event-item"
                                                style={{ borderLeftColor: SUBJECTS[ev.subjectName as Subject]?.color }}
                                                onClick={() => handleSelectInstance(ev, ev.subjectName as Subject)}
                                            >
                                                <div className="event-time">
                                                    {new Date(ev.start.dateTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="event-title">{ev.summary}</div>
                                            </div>
                                        ))}
                                        {events.length === 0 && (
                                            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                Sin clases
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* --- Editor Modal --- */}
            {selectedInstance && (
                <div className="editor-overlay">
                    <div className="editor-card">
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Editar Clase</h3>
                            <button onClick={() => setSelectedInstance(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                            {/* Summary */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Título</label>
                                <input
                                    className="glass-panel"
                                    style={{ width: '100%', padding: '0.8rem', color: 'white', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)' }}
                                    value={editForm.summary}
                                    onChange={e => setEditForm({ ...editForm, summary: e.target.value })}
                                />
                            </div>

                            {/* Time */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Inicio</label>
                                    <input
                                        type="time"
                                        className="glass-panel"
                                        style={{ width: '100%', padding: '0.8rem', color: 'white', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)' }}
                                        value={editForm.startTime}
                                        onChange={e => setEditForm({ ...editForm, startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Fin</label>
                                    <input
                                        type="time"
                                        className="glass-panel"
                                        style={{ width: '100%', padding: '0.8rem', color: 'white', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)' }}
                                        value={editForm.endTime}
                                        onChange={e => setEditForm({ ...editForm, endTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
                                <button className="btn" style={{ background: 'var(--bg-elevated)', color: 'white' }} onClick={handleDeleteInstance}>Eliminar</button>
                                <button className="btn btn-primary" onClick={handleSaveInstance} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
                            </div>

                            {selectedInstance.hangoutLink && (
                                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                                    <a href={selectedInstance.hangoutLink} target="_blank" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>🎥 Unirse al Meet</a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
