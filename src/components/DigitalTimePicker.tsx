'use client';
import { useState, useRef, useEffect } from 'react';

interface TimePickerProps {
    value: string; // "HH:mm" in 24h format
    onChange: (value: string) => void;
}

export default function DigitalTimePicker({ value, onChange }: TimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Convert 24h string to internal 12h state
    const parseTime = (val: string) => {
        if (!val) return { h: 12, m: 0, amp: 'AM' };
        const [h24, m] = val.split(':').map(Number);
        const amp = h24 >= 12 ? 'PM' : 'AM';
        let h12 = h24 % 12;
        if (h12 === 0) h12 = 12;
        return { h: h12, m, amp };
    };

    const { h, m, amp } = parseTime(value);

    // Close on click outside
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
    };

    // Data arrays
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10...
    const amps = ['AM', 'PM'];

    return (
        <div className="relative" ref={containerRef} style={{ position: 'relative' }}>
            {/* Trigger Button */}
            <div className="time-picker-trigger" onClick={() => setIsOpen(!isOpen)}>
                <span>{h.toString().padStart(2, '0')}</span>
                <span style={{ animation: 'blink 1s infinite' }}>:</span>
                <span>{m.toString().padStart(2, '0')}</span>
                <span style={{ fontSize: '0.8em', color: '#888', marginLeft: '4px' }}>{amp}</span>
            </div>

            {/* Popover */}
            {isOpen && (
                <div className="time-popover">
                    <div className="tp-header">TIME SELECTOR</div>

                    {/* Hours Column */}
                    <div className="tp-column">
                        {hours.map(hh => (
                            <div
                                key={hh}
                                className={`tp-item ${h === hh ? 'active' : ''}`}
                                onClick={() => updateTime(hh, m, amp)}
                            >
                                {hh}
                            </div>
                        ))}
                    </div>

                    {/* Minutes Column */}
                    <div className="tp-column">
                        {minutes.map(mm => (
                            <div
                                key={mm}
                                className={`tp-item ${m === mm ? 'active' : ''}`}
                                onClick={() => updateTime(h, mm, amp)}
                            >
                                {mm.toString().padStart(2, '0')}
                            </div>
                        ))}
                    </div>

                    {/* AM/PM Column */}
                    <div className="tp-column">
                        {amps.map(a => (
                            <div
                                key={a}
                                className={`tp-item ${amp === a ? 'active' : ''}`}
                                onClick={() => updateTime(h, m, a)}
                            >
                                {a}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
