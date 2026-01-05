'use client';

import { useState, useEffect } from 'react';
import { SUBJECTS, Subject, getSubjectsArray } from '@/lib/subjects';
import DigitalTimePicker from '../components/DigitalTimePicker';

interface CalendarEvent {
    id: string;
    summary: string;
    start: { dateTime: string };
    end: { dateTime: string };
    hangoutLink?: string;
    subjectName?: Subject;
}

interface AllSubjectsInstances { [key: string]: CalendarEvent[]; }

export default function Home() {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        return new Date(today.setDate(diff));
    });
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    const [allInstances, setAllInstances] = useState<AllSubjectsInstances>({});
    const [selectedInstance, setSelectedInstance] = useState<CalendarEvent | null>(null);
    const [loading, setLoading] = useState(false);

    const [editForm, setEditForm] = useState({
        summary: '', date: '', startTime: '08:00', endTime: '09:00', duration: 60
    });

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        loadAllInstances();
        return () => clearInterval(timer);
    }, []);

    // Helpers de tiempo
    const getMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const formatMinutes = (mins: number) => {
        const h = Math.floor(mins / 60) % 24;
        const m = mins % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const handleStartTimeChange = (newStart: string) => {
        const startMins = getMinutes(newStart);
        const endMins = startMins + editForm.duration;
        setEditForm(prev => ({ ...prev, startTime: newStart, endTime: formatMinutes(endMins) }));
    };

    const handleEndTimeChange = (newEnd: string) => {
        let start = getMinutes(editForm.startTime);
        let end = getMinutes(newEnd);
        if (end < start) end += 24 * 60;
        const dur = end - start;
        setEditForm(prev => ({ ...prev, endTime: newEnd, duration: dur > 0 ? dur : prev.duration }));
    };

    const handleDurationChange = (dur: number) => {
        const start = getMinutes(editForm.startTime);
        setEditForm(prev => ({ ...prev, duration: dur, endTime: formatMinutes(start + dur) }));
    };

    const loadAllInstances = async () => {
        setLoading(true);
        const subjects = getSubjectsArray();
        const allData: AllSubjectsInstances = {};
        try {
            await Promise.all(subjects.map(async (subj) => {
                try {
                    const res = await fetch(`/api/events/instances?subject=${subj.name}&weeks=12`);
                    const data = await res.json();
                    if (data.success) allData[subj.name] = data.instances;
                } catch (e) { }
            }));
            setAllInstances(allData);
        } catch (e) { } finally { setLoading(false); }
    };

    const handleSelectInstance = (ev: CalendarEvent, subj: Subject) => {
        setSelectedInstance({ ...ev, subjectName: subj });
        const start = new Date(ev.start.dateTime);
        const end = new Date(ev.end.dateTime);
        const dur = Math.round((end.getTime() - start.getTime()) / 60000);

        setEditForm({
            summary: ev.summary,
            date: start.toISOString().split('T')[0],
            startTime: start.toTimeString().slice(0, 5),
            endTime: end.toTimeString().slice(0, 5),
            duration: dur
        });
    };

    const handleSave = async () => {
        if (!selectedInstance) return;
        setLoading(true);
        try {
            const startDT = new Date(`${editForm.date}T${editForm.startTime}:00`);
            const endDT = new Date(`${editForm.date}T${editForm.endTime}:00`);

            await fetch('/api/events/edit', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: selectedInstance.subjectName,
                    eventId: selectedInstance.id,
                    summary: editForm.summary,
                    start: startDT.toISOString(), end: endDT.toISOString()
                })
            });
            await loadAllInstances();
            setSelectedInstance(null);
        } catch (e) { } finally { setLoading(false); }
    };

    const handleDelete = async () => {
        if (!selectedInstance) return;
        if (!confirm('¿Eliminar esta clase?')) return;
        setLoading(true);
        try {
            await fetch('/api/events/instance', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: selectedInstance.subjectName, instanceId: selectedInstance.id })
            });
            await loadAllInstances();
            setSelectedInstance(null);
        } catch (e) { } finally { setLoading(false); }
    };

    // Helpers calendario
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(currentWeekStart); d.setDate(currentWeekStart.getDate() + i); return d;
    });

    const getEvents = (date: Date) => {
        const isSame = (d1: Date, d2: Date) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
        if (selectedSubject) return (allInstances[selectedSubject] || []).filter(e => isSame(new Date(e.start.dateTime), date)).map(e => ({ ...e, subjectName: selectedSubject }));
        return Object.entries(allInstances).flatMap(([s, evs]) => evs.filter(e => isSame(new Date(e.start.dateTime), date)).map(e => ({ ...e, subjectName: s as Subject })));
    };

    const subjects = getSubjectsArray();

    return (
        <div className="app-container">
            {/* ENCABEZADO */}
            <header className="header-hero">
                <div className="digital-clock">
                    {currentTime ? currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '00:00'}
                </div>
                <h1 className="main-title">GESTOR DE EVENTOS</h1>
                <div style={{ color: 'var(--primary-neon)', letterSpacing: '2px', fontSize: '0.8rem', marginTop: '0.5rem' }}>SISTEMA EN LÍNEA</div>
            </header>

            {/* CONTROLES */}
            <div className="glass" style={{ padding: '1rem', borderRadius: '16px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className={`btn ${viewMode === 'monthly' && !selectedSubject ? 'btn-neon' : 'btn-ghost'}`} onClick={() => { setViewMode('monthly'); setSelectedSubject(null) }}>MES</button>
                    {subjects.map(s => (
                        <button key={s.name}
                            onClick={() => { setViewMode('weekly'); setSelectedSubject(s.name) }}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #333',
                                background: selectedSubject === s.name ? s.color : 'transparent',
                                color: selectedSubject === s.name ? 'white' : '#888',
                                cursor: 'pointer', fontSize: '0.85rem'
                            }}
                        >
                            {s.displayName}
                        </button>
                    ))}
                </div>
                <button className="btn btn-ghost" onClick={loadAllInstances} disabled={loading}>{loading ? '⏳' : '🔄'} SINCRONIZAR</button>
            </div>

            {/* BANNER MEET */}
            {viewMode === 'weekly' && selectedSubject && allInstances[selectedSubject]?.[0]?.hangoutLink && (
                <div className="meet-banner glass">
                    <div>
                        <h3 style={{ margin: 0, color: 'white', fontFamily: 'var(--font-display)' }}>SALA VIRTUAL: {SUBJECTS[selectedSubject].displayName}</h3>
                        <div className="meet-link">
                            <span style={{ color: 'var(--text-dim)' }}>ENLACE:</span>
                            {allInstances[selectedSubject][0].hangoutLink}
                        </div>
                    </div>
                    <a href={allInstances[selectedSubject][0].hangoutLink} target="_blank" className="btn btn-neon" style={{ textDecoration: 'none', padding: '0.75rem 1.5rem', fontSize: '0.85rem' }}>UNIRSE</a>
                </div>
            )}

            {/* CALENDARIO */}
            <div className={`cal-grid ${viewMode}`}>
                {viewMode === 'monthly' ? (
                    Array.from({ length: 31 }, (_, i) => {
                        const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
                        if (d.getMonth() !== currentMonth.getMonth()) return null;
                        const events = getEvents(d);
                        const isToday = d.toDateString() === new Date().toDateString();
                        return (
                            <div key={i} className={`day-panel glass ${isToday ? 'today' : ''}`}>
                                <div className="day-header">
                                    <span className="day-name">{d.toLocaleDateString('es-CO', { weekday: 'short' })}</span>
                                    <span className="day-num">{d.getDate()}</span>
                                </div>
                                {events.slice(0, 3).map((ev, k) => (
                                    <div key={k} className="event-chip" style={{ borderLeftColor: SUBJECTS[ev.subjectName as Subject]?.color }} onClick={() => handleSelectInstance(ev, ev.subjectName as Subject)}>
                                        <div className="chip-time">{new Date(ev.start.dateTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div className="chip-title">{ev.summary}</div>
                                    </div>
                                ))}
                                {events.length > 3 && <div style={{ fontSize: '0.7rem', color: '#666' }}>+{events.length - 3} más</div>}
                            </div>
                        )
                    }).filter(Boolean)
                ) : (
                    weekDays.map((d, i) => {
                        const events = getEvents(d);
                        const isToday = d.toDateString() === new Date().toDateString();
                        return (
                            <div key={i} className={`day-panel glass ${isToday ? 'today' : ''}`}>
                                <div className="day-header">
                                    <span className="day-name">{d.toLocaleDateString('es-CO', { weekday: 'short' })}</span>
                                    <span className="day-num">{d.getDate()}</span>
                                </div>
                                {events.length === 0 && <div style={{ textAlign: 'center', padding: '2rem 0', color: '#555', fontSize: '0.85rem' }}>Sin clases</div>}
                                {events.map((ev, k) => (
                                    <div key={k} className="event-chip" style={{ borderLeftColor: SUBJECTS[ev.subjectName as Subject]?.color }} onClick={() => handleSelectInstance(ev, ev.subjectName as Subject)}>
                                        <div className="chip-time">{new Date(ev.start.dateTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div className="chip-title">{ev.summary}</div>
                                    </div>
                                ))}
                            </div>
                        )
                    })
                )}
            </div>

            {/* MODAL EDITAR */}
            {selectedInstance && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>EDITAR CLASE</h2>
                            <button onClick={() => setSelectedInstance(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="input-group">
                                <label className="label">TÍTULO</label>
                                <input className="input-futuristic" value={editForm.summary} onChange={e => setEditForm({ ...editForm, summary: e.target.value })} />
                            </div>

                            <div className="input-group">
                                <label className="label">FECHA</label>
                                <input type="date" className="input-futuristic" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} style={{ colorScheme: 'dark' }} />
                            </div>

                            <div className="input-group">
                                <label className="label">HORARIO</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                    <DigitalTimePicker label="INICIO" value={editForm.startTime} onChange={handleStartTimeChange} />
                                    <span style={{ color: '#555', fontSize: '1.5rem' }}>→</span>
                                    <DigitalTimePicker label="FIN" value={editForm.endTime} onChange={handleEndTimeChange} />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="label">DURACIÓN RÁPIDA</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {[30, 45, 60, 90, 120].map(m => (
                                        <button key={m}
                                            onClick={() => handleDurationChange(m)}
                                            style={{
                                                padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #333',
                                                background: editForm.duration === m ? 'var(--primary-neon)' : 'transparent',
                                                color: editForm.duration === m ? 'black' : '#888',
                                                cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.85rem'
                                            }}
                                        >
                                            {m}min
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button className="btn btn-ghost" style={{ borderColor: '#f44', color: '#f44' }} onClick={handleDelete}>ELIMINAR</button>
                                <button className="btn btn-neon" style={{ flex: 1 }} onClick={handleSave} disabled={loading}>{loading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}</button>
                            </div>

                            {selectedInstance.hangoutLink && (
                                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                                    <a href={selectedInstance.hangoutLink} target="_blank" style={{ color: 'var(--primary-neon)', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>🎥 Unirse al Meet</a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
