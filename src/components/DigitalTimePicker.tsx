'use client';
import { useState, useRef, useEffect } from 'react';

interface TimePickerProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

export default function DigitalTimePicker({ value, onChange, label }: TimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const parseTime = (val: string) => {
        if (!val) return { h: 12, m: 0, amp: 'AM' };
        const [h24, m] = val.split(':').map(Number);
        const amp = h24 >= 12 ? 'PM' : 'AM';
        let h12 = h24 % 12;
        if (h12 === 0) h12 = 12;
        return { h: h12, m, amp };
    };

    const { h, m, amp } = parseTime(value);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    const updateTime = (newH: number, newM: number, newAmp: string) => {
        let h24 = newH;
        if (newAmp === 'PM' && newH !== 12) h24 += 12;
        if (newAmp === 'AM' && newH === 12) h24 = 0;
        const timeStr = `${h24.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
        onChange(timeStr);
        setIsOpen(false); // Cerrar al seleccionar
    };

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
    const amps = ['AM', 'PM'];

    return (
        <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
            {label && <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '4px' }}>{label}</div>}

            {/* Trigger */}
            <div
                className="time-picker-trigger"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.25rem',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    color: 'var(--primary-neon)',
                    padding: '0.6rem 1rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}
            >
                <span>{h.toString().padStart(2, '0')}</span>
                <span style={{ opacity: 0.5 }}>:</span>
                <span>{m.toString().padStart(2, '0')}</span>
                <span style={{ fontSize: '0.75rem', color: '#888', marginLeft: '6px' }}>{amp}</span>
            </div>

            {/* Popover - Abre HACIA ARRIBA para evitar corte */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    bottom: '100%', // Abre hacia arriba
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: '8px',
                    zIndex: 9999,
                    background: '#111',
                    border: '1px solid #333',
                    borderRadius: '16px',
                    padding: '0.75rem',
                    boxShadow: '0 -10px 40px rgba(0,0,0,0.8)',
                    display: 'flex',
                    gap: '8px',
                    animation: 'popIn 0.15s ease-out'
                }}>
                    {/* Horas */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {hours.map(hh => (
                            <button
                                key={hh}
                                onClick={() => updateTime(hh, m, amp)}
                                style={{
                                    width: '44px', height: '36px',
                                    border: 'none', borderRadius: '8px',
                                    background: h === hh ? 'var(--primary-neon)' : 'transparent',
                                    color: h === hh ? 'black' : '#888',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '1rem',
                                    fontWeight: h === hh ? 700 : 400,
                                    cursor: 'pointer'
                                }}
                            >
                                {hh}
                            </button>
                        ))}
                    </div>

                    {/* Minutos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {minutes.map(mm => (
                            <button
                                key={mm}
                                onClick={() => updateTime(h, mm, amp)}
                                style={{
                                    width: '44px', height: '36px',
                                    border: 'none', borderRadius: '8px',
                                    background: m === mm ? 'var(--primary-neon)' : 'transparent',
                                    color: m === mm ? 'black' : '#888',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '1rem',
                                    fontWeight: m === mm ? 700 : 400,
                                    cursor: 'pointer'
                                }}
                            >
                                {mm.toString().padStart(2, '0')}
                            </button>
                        ))}
                    </div>

                    {/* AM/PM */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {amps.map(a => (
                            <button
                                key={a}
                                onClick={() => updateTime(h, m, a)}
                                style={{
                                    width: '44px', height: '36px',
                                    border: 'none', borderRadius: '8px',
                                    background: amp === a ? 'var(--primary-neon)' : 'transparent',
                                    color: amp === a ? 'black' : '#888',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.85rem',
                                    fontWeight: amp === a ? 700 : 400,
                                    cursor: 'pointer'
                                }}
                            >
                                {a}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
