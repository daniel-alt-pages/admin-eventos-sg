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
    subjectName?: Subject;
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
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
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

    // Edit Form Smart Logic
    const [editForm, setEditForm] = useState({
        summary: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        duration: 60 // minutes
    });

    // --- EFFECTS ---
    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        loadAllInstances();
        return () => clearInterval(timer);
    }, []);

    // --- TIME HELPERS ---
    const getMinutesFromTime = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };

    const formatTimeFromMinutes = (totalMinutes: number) => {
        const h = Math.floor(totalMinutes / 60) % 24;
        const m = totalMinutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const calculateDuration = (start: string, end: string) => {
        let startMins = getMinutesFromTime(start);
        let endMins = getMinutesFromTime(end);
        if (endMins < startMins) endMins += 24 * 60; // Next day assume
        return endMins - startMins;
    };

    // --- HANDLERS SMART TIME ---

    // 1. Change Start Time -> Update End Time (Keep Duration)
    const handleStartTimeChange = (newStart: string) => {
        const startMins = getMinutesFromTime(newStart);
        const endMins = startMins + editForm.duration;
        const newEnd = formatTimeFromMinutes(endMins);

        setEditForm(prev => ({
            ...prev,
            startTime: newStart,
            endTime: newEnd
        }));
    };

    // 2. Change End Time -> Update Duration (Keep Start)
    const handleEndTimeChange = (newEnd: string) => {
        const dur = calculateDuration(editForm.startTime, newEnd);
        setEditForm(prev => ({
            ...prev,
            endTime: newEnd,
            duration: dur > 0 ? dur : prev.duration
        }));
    };

    // 3. Change Duration -> Update End Time (Keep Start)
    const handleDurationChange = (newDuration: number) => {
        const startMins = getMinutesFromTime(editForm.startTime);
        const endMins = startMins + newDuration;
        const newEnd = formatTimeFromMinutes(endMins);

        setEditForm(prev => ({
            ...prev,
            duration: newDuration,
            endTime: newEnd
        }));
    };


    // --- METHODS ---

    const showToast = (text: string, type: 'success' | 'error' | 'warning') => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 4000);
    };

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
                } catch (e) { console.error(e); }
            }));
            setAllInstances(allData);
        } catch (err) {
            showToast('Error cargando datos', 'error');
        } finally {
            setLoading(false);
        }
    };

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

    // Restore logic...
    const handleRestore = async (instance: CalendarEvent) => {
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

    // Helpers
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
        const firstDayOfWeek = firstDay.getDay();
        for (let i = firstDayOfWeek; i > 0; i--) {
            days.push({ date: new Date(year, month, 1 - i), current: false });
        }
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ date: new Date(year, month, i), current: true });
        }
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
            {toast && (
                <div className="toast" style={{ borderLeft: `4px solid ${toast.type === 'error' ? 'red' : 'green'}` }}>
                    {toast.type === 'success' ? '✅' : '⚠️'}
                    {toast.text}
                </div>
            )}

            <div className="header-wrapper">
                <h1 className="main-title">Manager de Eventos</h1>
                <p className="subtitle">Gestión Académica Profesional</p>
            </div>

            <div className="clock-card">
                <div className="time-display">
                    {currentTime ? currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </div>
                <div className="date-display">
                    <div className="date-day">
                        {currentTime ? currentTime.toLocaleDateString('es-CO', { weekday: 'long' }) : '...'}
                    </div>
                    <div className="date-full">
                        {currentTime ? currentTime.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="nav-controls">
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        className={`subject-badge ${viewMode === 'monthly' && !selectedSubject ? 'active' : ''}`}
                        onClick={() => { setViewMode('monthly'); setSelectedSubject(null); }}
                    > 📅 Mes </button>

                    {subjects.map(s => (
                        <button
                            key={s.name}
                            className={`subject-badge ${selectedSubject === s.name ? 'active' : ''}`}
                            onClick={() => { setViewMode('weekly'); setSelectedSubject(s.name); }}
                        >
                            <span className="subject-dot" style={{ background: s.color }}></span>
                            {s.displayName}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="nav-btn" title="Recargar" onClick={loadAllInstances}>🔄</button>
                    {deletedInstances.length > 0 &&
                        <button className="nav-btn" onClick={() => setShowDeletedPanel(!showDeletedPanel)} style={{ width: 'auto', padding: '0 1rem' }}>🗑️ {deletedInstances.length}</button>
                    }
                </div>
            </div>

            {/* Deleted Panel */}
            {showDeletedPanel && (
                <div style={{ padding: '1rem', marginBottom: '1.5rem', background: '#fee2e2', borderRadius: '16px' }}>
                    <h4 style={{ marginBottom: '0.5rem', color: '#b91c1c' }}>Papelera de Reciclaje</h4>
                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
                        {deletedInstances.map((del, i) => (
                            <div key={i} style={{ background: 'white', padding: '0.5rem', borderRadius: '8px', minWidth: '200px', fontSize: '0.85rem' }}>
                                <strong>{del.summary}</strong>
                                <div>{new Date(del.start.dateTime).toLocaleDateString()}</div>
                                <button style={{ marginTop: '0.5rem', fontSize: '0.75rem', padding: '4px 8px', cursor: 'pointer' }} onClick={() => handleRestore(del)}>Restaurar</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Calendar */}
            <div className="calendar-wrapper">
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

                {/* Monthly */}
                {viewMode === 'monthly' && (
                    <div className="calendar-grid monthly" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                            <div key={d} style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'white' }}>{d}</div>
                        ))}
                        {monthDays.map((day, idx) => {
                            const events = getEventsForDay(day.date);
                            const isToday = isSameDay(day.date, new Date());
                            return (
                                <div key={idx} className={`day-card ${isToday ? 'today' : ''}`} style={{ opacity: day.current ? 1 : 0.4 }}>
                                    <div className="day-number">{day.date.getDate()}</div>
                                    {events.slice(0, 3).map((ev, i) => (
                                        <div
                                            key={i}
                                            className="event-item"
                                            style={{ borderLeftColor: SUBJECTS[ev.subjectName as Subject]?.color }}
                                            onClick={() => handleSelectInstance(ev, ev.subjectName as Subject)}
                                        >
                                            {ev.summary}
                                        </div>
                                    ))}
                                    {events.length > 3 && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+{events.length - 3} más</div>}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Weekly */}
                {viewMode === 'weekly' && (
                    <div className="calendar-grid weekly">
                        {weekDays.map((day, idx) => {
                            const events = getEventsForDay(day, selectedSubject || undefined);
                            const isToday = isSameDay(day, new Date());
                            return (
                                <div key={idx} className={`day-card ${isToday ? 'today' : ''}`}>
                                    <div className="day-header">
                                        <div className="day-name">{day.toLocaleDateString('es-CO', { weekday: 'short' })}</div>
                                        <div className="day-num">{day.getDate()}</div>
                                    </div>
                                    {events.map((ev, i) => (
                                        <div
                                            key={i}
                                            className="event-item"
                                            style={{ borderLeftColor: SUBJECTS[ev.subjectName as Subject]?.color }}
                                            onClick={() => handleSelectInstance(ev, ev.subjectName as Subject)}
                                        >
                                            <div className="event-time">{new Date(ev.start.dateTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</div>
                                            <div className="event-title">{ev.summary}</div>
                                        </div>
                                    ))}
                                    {events.length === 0 && <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin clases</div>}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Smart Editor Modal */}
            {selectedInstance && selectedInstance.subjectName && (
                <div className="editor-overlay">
                    <div className="editor-card">
                        <div className="editor-header">
                            <h3>Editar Clase</h3>
                            <button className="close-btn" onClick={() => setSelectedInstance(null)}>×</button>
                        </div>

                        <div className="editor-body">
                            {/* Title */}
                            <div className="form-group">
                                <label className="form-label">Título</label>
                                <input
                                    className="form-input"
                                    value={editForm.summary}
                                    onChange={e => setEditForm({ ...editForm, summary: e.target.value })}
                                />
                            </div>

                            {/* Date */}
                            <div className="form-group">
                                <label className="form-label">Fecha</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={editForm.date}
                                    onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                                />
                            </div>

                            {/* Smart Time Controls */}
                            <div className="form-group">
                                <label className="form-label">Horario Automático</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inicio</span>
                                        <input
                                            type="time"
                                            className="form-input"
                                            value={editForm.startTime}
                                            onChange={e => handleStartTimeChange(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fin (Auto)</span>
                                        <input
                                            type="time"
                                            className="form-input"
                                            value={editForm.endTime}
                                            onChange={e => handleEndTimeChange(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginTop: '0.75rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Duración: {editForm.duration} min</span>
                                    <div className="duration-pills">
                                        {[30, 45, 60, 90, 120].map(mins => (
                                            <button
                                                key={mins}
                                                className={`duration-pill ${editForm.duration === mins ? 'active' : ''}`}
                                                onClick={() => handleDurationChange(mins)}
                                            >
                                                {mins}m
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button className="btn btn-danger" style={{ width: '30%' }} onClick={handleDeleteInstance}>Eliminar</button>
                                <button className="btn btn-primary" style={{ width: '70%' }} onClick={handleSaveInstance} disabled={loading}>
                                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>

                            {selectedInstance.hangoutLink && (
                                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                                    <a href={selectedInstance.hangoutLink} target="_blank" style={{ color: 'var(--accent-primary)', fontWeight: '600', textDecoration: 'none' }}>
                                        🎥 Link de Meet
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
