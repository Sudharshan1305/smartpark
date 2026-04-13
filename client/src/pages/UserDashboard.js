import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import ConfirmDialog from '../components/ConfirmDialog';
import { getAllSlots, recommendSlot, createBooking } from '../services/api';

const getTodayStr = () => new Date().toISOString().split('T')[0];
const getMaxDateStr = () => {
    const d = new Date(); d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
};

const buildTimes = (date, from, to) => {
    const [year, month, day] = date.split('-').map(Number);
    const [fH, fM] = from.split(':').map(Number);
    const [tH, tM] = to.split(':').map(Number);
    return {
        startTime: new Date(year, month - 1, day, fH, fM, 0).toISOString(),
        endTime: new Date(year, month - 1, day, tH, tM, 0).toISOString(),
    };
};

const durationLabel = (from, to) => {
    const [fh, fm] = from.split(':').map(Number);
    const [th, tm] = to.split(':').map(Number);
    const diff = (th * 60 + tm) - (fh * 60 + fm);
    if (diff <= 0) return '';
    const hrs = Math.floor(diff / 60), mins = diff % 60;
    return hrs > 0 && mins > 0 ? `${hrs}h ${mins}m`
        : hrs > 0 ? `${hrs} hr${hrs > 1 ? 's' : ''}`
            : `${mins} min`;
};

const VEHICLE_TYPES = [
    { value: 'four-wheeler', label: '🚗 Four-Wheeler', desc: 'Car, SUV, Van' },
    { value: 'two-wheeler', label: '🏍️ Two-Wheeler', desc: 'Bike, Scooter' },
];

const UserDashboard = () => {
    const [vehicleType, setVehicleType] = useState('');
    const [slots, setSlots] = useState([]);
    const [stats, setStats] = useState({});
    const [recommendation, setRec] = useState(null);
    const [loading, setLoading] = useState(false);
    const [slotsLoaded, setSlotsLoaded] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null); // UI state
    const [notification, setNotif] = useState({ text: '', type: '' });
    const [filterDate, setFilterDate] = useState(getTodayStr());
    const [filterFrom, setFilterFrom] = useState('09:00');
    const [filterTo, setFilterTo] = useState('10:00');
    const [filterError, setFilterError] = useState('');
    const [bookingModal, setModal] = useState({ open: false, slot: null });
    const [booking, setBooking] = useState(false);

    const showNotif = (text, type) => {
        setNotif({ text, type });
        setTimeout(() => setNotif({ text: '', type: '' }), 4000);
    };

    const validateFilter = () => {
        const [fh, fm] = filterFrom.split(':').map(Number);
        const [th, tm] = filterTo.split(':').map(Number);
        if ((th * 60 + tm) - (fh * 60 + fm) <= 0) {
            setFilterError('"To" time must be after "From" time.');
            return false;
        }
        setFilterError('');
        return true;
    };

    const fetchSlots = async (date, from, to, vType) => {
        if (!vType) { showNotif('Please select a vehicle type first.', 'error'); return; }
        if (!validateFilter()) return;
        setLoading(true);
        setSelectedSlot(null);
        try {
            const { startTime, endTime } = buildTimes(date, from, to);
            const res = await getAllSlots(startTime, endTime, vType);
            setSlots(res.data.slots);
            setStats({ total: res.data.totalSlots, available: res.data.available, occupied: res.data.occupied });
            setSlotsLoaded(true);
            try {
                const recRes = await recommendSlot(startTime, endTime, vType);
                setRec(recRes.data.slot);
            } catch { setRec(null); }
        } catch { showNotif('Failed to load slots.', 'error'); }
        finally { setLoading(false); }
    };

    // When vehicle type changes, reset and fetch slots
    const handleVehicleSelect = (vType) => {
        setVehicleType(vType);
        setSlots([]);
        setSlotsLoaded(false);
        setSelectedSlot(null);
        setRec(null);
        fetchSlots(filterDate, filterFrom, filterTo, vType);
    };

    const handleCheckAvailability = () => {
        fetchSlots(filterDate, filterFrom, filterTo, vehicleType);
    };

    // Select a slot (UI state)
    const handleSlotClick = (slot) => {
        if (slot.status === 'occupied') return;
        setSelectedSlot(slot._id === selectedSlot ? null : slot._id);
    };

    // Book the selected slot
    const handleBook = (slot) => {
        if (!vehicleType) { showNotif('Please select a vehicle type first.', 'error'); return; }
        if (!validateFilter()) { showNotif('Please set a valid time range.', 'error'); return; }
        setSelectedSlot(slot._id);
        setModal({ open: true, slot });
    };

    const handleConfirmBooking = async () => {
        setBooking(true);
        try {
            const { startTime, endTime } = buildTimes(filterDate, filterFrom, filterTo);
            await createBooking({
                slotId: bookingModal.slot._id,
                startTime,
                endTime,
                vehicleType,
            });
            showNotif(
                `✅ Slot ${bookingModal.slot.slotId} booked for ${filterDate} from ${filterFrom} to ${filterTo}!`,
                'success'
            );
            setModal({ open: false, slot: null });
            setSelectedSlot(null);
            fetchSlots(filterDate, filterFrom, filterTo, vehicleType);
        } catch (err) {
            showNotif(err.response?.data?.message || 'Booking failed.', 'error');
            setModal({ open: false, slot: null });
            setSelectedSlot(null);
        } finally { setBooking(false); }
    };

    const dur = durationLabel(filterFrom, filterTo);

    const getSlotStyle = (slot) => {
        if (slot.status === 'occupied') return styles.slotOccupied;
        if (selectedSlot === slot._id) return styles.slotSelected;
        return styles.slotAvailable;
    };

    return (
        <div style={styles.page}>
            <Navbar />

            {notification.text && (
                <div style={{
                    ...styles.notification,
                    backgroundColor: notification.type === 'success' ? '#2e7d32' : '#c62828',
                }}>
                    {notification.text}
                </div>
            )}

            <div style={styles.container}>
                <h2 style={styles.heading}>🅿️ Parking Dashboard</h2>

                {/* ── STEP 1: Vehicle Type Selector ── */}
                <div style={styles.vehicleBox}>
                    <h4 style={styles.stepLabel}>Step 1 — Select Your Vehicle Type</h4>
                    <div style={styles.vehicleRow}>
                        {VEHICLE_TYPES.map(v => (
                            <button
                                key={v.value}
                                style={{
                                    ...styles.vehicleBtn,
                                    ...(vehicleType === v.value ? styles.vehicleBtnActive : {}),
                                }}
                                onClick={() => handleVehicleSelect(v.value)}
                            >
                                <span style={styles.vehicleIcon}>{v.label.split(' ')[0]}</span>
                                <span style={styles.vehicleLabel}>{v.label.split(' ').slice(1).join(' ')}</span>
                                <span style={styles.vehicleDesc}>{v.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── STEP 2: Date & Time ── */}
                <div style={styles.filterBox}>
                    <h4 style={styles.stepLabel}>Step 2 — Choose Date & Time</h4>
                    <div style={styles.filterRow}>
                        <div style={styles.filterField}>
                            <label style={styles.label}>📅 Date</label>
                            <input type="date" style={styles.filterInput}
                                value={filterDate} min={getTodayStr()} max={getMaxDateStr()}
                                onChange={e => setFilterDate(e.target.value)} />
                        </div>
                        <div style={styles.filterField}>
                            <label style={styles.label}>🕐 From</label>
                            <input type="time" style={styles.filterInput} value={filterFrom}
                                onChange={e => { setFilterFrom(e.target.value); setFilterError(''); }} />
                        </div>
                        <div style={styles.arrowWrap}>→</div>
                        <div style={styles.filterField}>
                            <label style={styles.label}>🕔 To</label>
                            <input type="time" style={styles.filterInput} value={filterTo}
                                onChange={e => { setFilterTo(e.target.value); setFilterError(''); }} />
                        </div>
                        <button style={{
                            ...styles.checkBtn,
                            opacity: !vehicleType ? 0.5 : 1,
                        }}
                            onClick={handleCheckAvailability}
                            disabled={loading || !vehicleType}
                        >
                            {loading ? 'Checking...' : 'Check Availability'}
                        </button>
                    </div>
                    {filterError && <div style={styles.filterError}>⚠️ {filterError}</div>}
                    {dur && !filterError && <div style={styles.durationTag}>⏱️ Duration: {dur}</div>}
                </div>

                {/* Stats */}
                {slotsLoaded && (
                    <div style={styles.statsRow}>
                        {[
                            { label: 'Total Slots', val: stats.total || 0, color: '#1565c0' },
                            { label: 'Available', val: stats.available || 0, color: '#4caf50' },
                            { label: 'Occupied', val: stats.occupied || 0, color: '#e53935' },
                        ].map(s => (
                            <div key={s.label} style={{ ...styles.statCard, borderLeft: `4px solid ${s.color}` }}>
                                <div style={{ fontSize: 28, fontWeight: 'bold', color: s.color }}>{s.val}</div>
                                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Recommendation */}
                {recommendation && slotsLoaded && (
                    <div style={styles.recBox}>
                        💡 <strong>Recommended:</strong> Slot {recommendation.slotId} is the best available slot!
                        <button style={styles.recBtn} onClick={() => handleBook(recommendation)}>
                            Book Now
                        </button>
                    </div>
                )}

                {/* ── STEP 3: Slot Grid ── */}
                {slotsLoaded && (
                    <>
                        <div style={styles.gridHeader}>
                            <span style={styles.gridLabel}>
                                {vehicleType === 'two-wheeler' ? '🏍️' : '🚗'} Slots for{' '}
                                <strong>{vehicleType}</strong> on <strong>{filterDate}</strong>,{' '}
                                {filterFrom} → {filterTo}
                            </span>
                            {/* Legend */}
                            <div style={styles.legend}>
                                {[
                                    { color: '#4caf50', label: 'Available' },
                                    { color: '#1565c0', label: 'Selected' },
                                    { color: '#e53935', label: 'Occupied' },
                                ].map(l => (
                                    <div key={l.label} style={styles.legendItem}>
                                        <div style={{ ...styles.legendDot, backgroundColor: l.color }} />
                                        <span>{l.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div style={styles.loading}>Checking availability...</div>
                        ) : (
                            <div style={styles.grid}>
                                {slots.map(slot => (
                                    <div
                                        key={slot._id}
                                        style={getSlotStyle(slot)}
                                        onClick={() => handleSlotClick(slot)}
                                    >
                                        <div style={styles.slotId}>{slot.slotId}</div>
                                        <div style={styles.slotVehicle}>
                                            {slot.vehicleType === 'two-wheeler' ? '🏍️' : '🚗'}
                                        </div>
                                        <div style={styles.slotStatus}>
                                            {slot.status === 'occupied' ? '🔴 Occupied'
                                                : selectedSlot === slot._id ? '🔵 Selected'
                                                    : '🟢 Available'}
                                        </div>
                                        {slot.status === 'available' && (
                                            <button
                                                style={styles.bookSlotBtn}
                                                onClick={(e) => { e.stopPropagation(); handleBook(slot); }}
                                            >
                                                Book
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {!vehicleType && (
                    <div style={styles.emptyState}>
                        👆 Select a vehicle type above to see available parking slots
                    </div>
                )}
            </div>

            {/* Booking Confirmation Dialog */}
            <ConfirmDialog
                isOpen={bookingModal.open}
                title={`Book Slot ${bookingModal.slot?.slotId}?`}
                message={`Confirm booking for Slot ${bookingModal.slot?.slotId} (${vehicleType}) on ${filterDate} from ${filterFrom} to ${filterTo}${dur ? ` — ${dur}` : ''}?`}
                confirmText="Yes, Book It!"
                confirmColor="#1565c0"
                loading={booking}
                onConfirm={handleConfirmBooking}
                onCancel={() => { setModal({ open: false, slot: null }); setSelectedSlot(null); }}
            />
        </div>
    );
};

const styles = {
    page: { minHeight: '100vh', backgroundColor: '#f0f2f5' },
    notification: {
        position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)',
        color: '#fff', padding: '12px 28px', borderRadius: '8px', zIndex: 999,
        fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
    },
    container: { maxWidth: '1100px', margin: '0 auto', padding: '30px 20px' },
    heading: { fontSize: '26px', color: '#1a1a2e', marginBottom: '20px' },
    stepLabel: { margin: '0 0 14px', fontSize: '15px', color: '#333', fontWeight: '600' },
    // Vehicle Selector
    vehicleBox: {
        backgroundColor: '#fff', padding: '20px 24px', borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '16px',
    },
    vehicleRow: { display: 'flex', gap: '16px' },
    vehicleBtn: {
        flex: 1, padding: '16px', border: '2px solid #e0e0e0', borderRadius: '12px',
        cursor: 'pointer', backgroundColor: '#fff', display: 'flex',
        flexDirection: 'column', alignItems: 'center', gap: '4px',
        transition: 'all 0.2s',
    },
    vehicleBtnActive: {
        border: '2px solid #1565c0', backgroundColor: '#e3f2fd',
    },
    vehicleIcon: { fontSize: '32px' },
    vehicleLabel: { fontSize: '15px', fontWeight: 'bold', color: '#1a1a2e' },
    vehicleDesc: { fontSize: '12px', color: '#888' },
    // Filter
    filterBox: {
        backgroundColor: '#fff', padding: '20px 24px', borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '20px',
    },
    filterRow: { display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' },
    filterField: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#555' },
    filterInput: {
        padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px',
    },
    arrowWrap: { fontSize: '20px', color: '#888', paddingBottom: '10px' },
    checkBtn: {
        padding: '10px 24px', backgroundColor: '#1565c0', color: '#fff',
        border: 'none', borderRadius: '8px', cursor: 'pointer',
        fontWeight: 'bold', fontSize: '15px', height: '42px',
    },
    filterError: {
        marginTop: '10px', color: '#c62828', fontSize: '14px',
        backgroundColor: '#ffebee', padding: '8px 12px', borderRadius: '6px',
    },
    durationTag: { marginTop: '10px', color: '#2e7d32', fontSize: '14px', fontWeight: '600' },
    // Stats
    statsRow: { display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' },
    statCard: {
        flex: 1, minWidth: '140px', backgroundColor: '#fff',
        padding: '18px 22px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
    // Recommendation
    recBox: {
        backgroundColor: '#fff8e1', border: '1px solid #ffe082', borderRadius: '10px',
        padding: '14px 20px', marginBottom: '20px', fontSize: '15px',
        display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
    },
    recBtn: {
        backgroundColor: '#f57f17', color: '#fff', border: 'none',
        padding: '7px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
    },
    // Grid
    gridHeader: {
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px',
    },
    gridLabel: { fontSize: '14px', color: '#555' },
    legend: { display: 'flex', gap: '16px' },
    legendItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#555' },
    legendDot: { width: '12px', height: '12px', borderRadius: '50%' },
    loading: { textAlign: 'center', padding: '60px', fontSize: '18px', color: '#666' },
    grid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px',
    },
    // Slot Cards
    slotAvailable: {
        backgroundColor: '#fff', border: '2px solid #4caf50', borderRadius: '12px',
        padding: '16px', textAlign: 'center', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
        transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    },
    slotSelected: {
        backgroundColor: '#e3f2fd', border: '2px solid #1565c0', borderRadius: '12px',
        padding: '16px', textAlign: 'center', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
        boxShadow: '0 4px 12px rgba(21,101,192,0.25)',
    },
    slotOccupied: {
        backgroundColor: '#fafafa', border: '2px solid #e0e0e0', borderRadius: '12px',
        padding: '16px', textAlign: 'center', cursor: 'not-allowed', opacity: 0.6,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
    },
    slotId: { fontSize: '24px', fontWeight: 'bold', color: '#1a1a2e' },
    slotVehicle: { fontSize: '20px' },
    slotStatus: { fontSize: '12px', color: '#555' },
    bookSlotBtn: {
        marginTop: '4px', backgroundColor: '#1565c0', color: '#fff',
        border: 'none', padding: '6px 18px', borderRadius: '6px',
        cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
    },
    emptyState: {
        textAlign: 'center', padding: '60px 20px', fontSize: '16px',
        color: '#888', backgroundColor: '#fff', borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
};

export default UserDashboard;