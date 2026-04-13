import React, { useCallback, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ConfirmDialog from '../components/ConfirmDialog';
import {
    addSlot, deleteSlot, getAllBookings,
    deleteBooking, getAnalytics
} from '../services/api';
import { Bar, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale,
    BarElement, LineElement, PointElement, Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement,
    LineElement, PointElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
    const [bookingFilter, setBookingFilter] = useState('all');
    const [bookings, setBookings] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [newSlotId, setNewSlotId] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [notification, setNotif] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(true);
    const [newVehicleType, setNewVehicleType] = useState('');

    // Single dialog state for both slot delete and booking delete
    const [dialog, setDialog] = useState({
        open: false,
        type: '',          // 'slot' or 'booking'
        targetId: null,
        targetName: '',
        processing: false,
    });

    const showNotif = useCallback((text, type) => {
        setNotif({ text, type });
        setTimeout(() => setNotif({ text: '', type: '' }), 3500);
    }, []);

    const fetchAll = useCallback(async () => {
        try {
            const [bookingsRes, analyticsRes] = await Promise.all([
                getAllBookings(), getAnalytics(),
            ]);
            setBookings(bookingsRes.data.bookings);
            setAnalytics(analyticsRes.data);
        } catch {
            showNotif('Failed to load data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotif]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleAddSlot = async () => {
        if (!newSlotId.trim()) return showNotif('Please enter a slot ID.', 'error');
        if (!newVehicleType) return showNotif('Please select a vehicle type.', 'error');
        try {
            await addSlot({ slotId: newSlotId.trim(), vehicleType: newVehicleType });
            showNotif(`✅ Slot ${newSlotId.toUpperCase()} (${newVehicleType}) added!`, 'success');
            setNewSlotId('');
            setNewVehicleType('');
            fetchAll();
        } catch (err) {
            showNotif(err.response?.data?.message || 'Failed to add slot.', 'error');
        }
    };

    // Open dialog for booking delete
    const handleDeleteBookingClick = (id, receiptId) => {
        setDialog({ open: true, type: 'booking', targetId: id, targetName: receiptId, processing: false });
    };

    // Confirm handler — works for both slot and booking
    const handleConfirmDelete = async () => {
        setDialog(prev => ({ ...prev, processing: true }));
        try {
            if (dialog.type === 'slot') {
                await deleteSlot(dialog.targetId);
                showNotif(`✅ Slot ${dialog.targetName} deleted.`, 'success');
            } else {
                await deleteBooking(dialog.targetId);
                showNotif('✅ Booking deleted.', 'success');
            }
            setDialog({ open: false, type: '', targetId: null, targetName: '', processing: false });
            fetchAll();
        } catch (err) {
            showNotif(err.response?.data?.message || 'Delete failed.', 'error');
            setDialog({ open: false, type: '', targetId: null, targetName: '', processing: false });
        }
    };

    const closeDialog = () => {
        setDialog({ open: false, type: '', targetId: null, targetName: '', processing: false });
    };

    const getStatusColor = (s) =>
        s === 'active' ? '#4caf50' : s === 'cancelled' ? '#e53935' : '#ff9800';

    const barChartData = analytics ? {
        labels: analytics.bookingsPerHour.map(h => h.hour),
        datasets: [{
            label: 'Bookings',
            data: analytics.bookingsPerHour.map(h => h.bookings),
            backgroundColor: '#1565c0',
            borderRadius: 4,
        }],
    } : null;

    const lineChartData = analytics ? {
        labels: analytics.last7Days.map(d => d.date),
        datasets: [{
            label: 'Bookings Per Day',
            data: analytics.last7Days.map(d => d.bookings),
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76,175,80,0.1)',
            tension: 0.4,
            fill: true,
        }],
    } : null;

    const chartOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    };

    const tabs = ['overview', 'slots', 'bookings'];

    return (
        <div style={styles.page}>
            <Navbar />

            {/* Custom Confirm Dialog */}
            <ConfirmDialog
                isOpen={dialog.open}
                title={dialog.type === 'slot' ? `Delete Slot ${dialog.targetName}?` : 'Delete Booking?'}
                message={
                    dialog.type === 'slot'
                        ? `Are you sure you want to permanently delete Slot ${dialog.targetName}? This action cannot be undone.`
                        : `Are you sure you want to permanently delete booking ${dialog.targetName}? If it was active, the slot will be released.`
                }
                confirmText="Yes, Delete"
                confirmColor="#e53935"
                loading={dialog.processing}
                onConfirm={handleConfirmDelete}
                onCancel={closeDialog}
            />

            {notification.text && (
                <div style={{
                    ...styles.notification,
                    backgroundColor: notification.type === 'success' ? '#2e7d32' : '#c62828',
                }}>
                    {notification.text}
                </div>
            )}

            <div style={styles.container}>
                <h2 style={styles.heading}>🧑‍💼 Admin Dashboard</h2>

                {/* Tab Navigation */}
                <div style={styles.tabRow}>
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            style={{ ...styles.tabBtn, ...(activeTab === tab ? styles.activeTabBtn : {}) }}
                            onClick={() => {
                                setActiveTab(tab);
                                // Auto-refresh data when switching to bookings or slots tab
                                if (tab === 'bookings' || tab === 'slots') {
                                    fetchAll();
                                }
                            }}
                        >
                            {tab === 'overview' ? '📊 Overview'
                                : tab === 'slots' ? '🅿️ Slots'
                                    : '📋 Bookings'}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={styles.loading}>Loading data...</div>
                ) : (
                    <>
                        {/* ── OVERVIEW TAB ── */}
                        {activeTab === 'overview' && analytics && (
                            <div>
                                <div style={styles.statsGrid}>
                                    {[
                                        { label: 'Total Bookings', value: analytics.overview.totalBookings, color: '#1565c0' },
                                        { label: 'Active Now', value: analytics.overview.activeBookings, color: '#4caf50' },
                                        { label: 'Cancelled', value: analytics.overview.cancelledBookings, color: '#e53935' },
                                        { label: 'Expired', value: analytics.overview.expiredBookings, color: '#ff9800' },
                                        { label: 'Total Slots', value: analytics.overview.totalSlots, color: '#7b1fa2' },
                                        { label: 'Available', value: analytics.overview.availableSlots, color: '#00838f' },
                                    ].map(s => (
                                        <div key={s.label} style={{ ...styles.statCard, borderTop: `4px solid ${s.color}` }}>
                                            <div style={{ ...styles.statNum, color: s.color }}>{s.value}</div>
                                            <div style={styles.statLabel}>{s.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={styles.peakBox}>
                                    ⏰ <strong>Peak Booking Hour:</strong> {analytics.overview.peakHour}
                                    &nbsp;— most bookings happen at this time!
                                </div>

                                <div style={styles.chartsRow}>
                                    <div style={styles.chartBox}>
                                        <h4 style={styles.chartTitle}>Bookings by Hour of Day</h4>
                                        <Bar data={barChartData} options={chartOptions} />
                                    </div>
                                    <div style={styles.chartBox}>
                                        <h4 style={styles.chartTitle}>Last 7 Days Trend</h4>
                                        <Line data={lineChartData} options={chartOptions} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── SLOTS TAB ── */}
                        {/* Add Slot Form — updated with vehicleType */}
                        <div style={styles.addSlotBox}>
                            <h4 style={{ margin: '0 0 12px' }}>➕ Add New Slot</h4>
                            <div style={styles.addSlotRow}>
                                <input
                                    style={styles.slotInput}
                                    placeholder="Slot ID (e.g., C1, D2)"
                                    value={newSlotId}
                                    onChange={e => setNewSlotId(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddSlot()}
                                />
                                <select
                                    style={styles.slotSelect}
                                    value={newVehicleType}
                                    onChange={e => setNewVehicleType(e.target.value)}
                                >
                                    <option value="">Select Vehicle Type</option>
                                    <option value="four-wheeler">🚗 Four-Wheeler</option>
                                    <option value="two-wheeler">🏍️ Two-Wheeler</option>
                                </select>
                                <button style={styles.addBtn} onClick={handleAddSlot}>
                                    Add Slot
                                </button>
                            </div>
                        </div>

                        {/* ── BOOKINGS TAB ── */}
                        {activeTab === 'bookings' && (
                            <div>
                                {/* Refresh + Filter Row */}
                                <div style={styles.refreshRow}>
                                    <div style={styles.filterBtns}>
                                        {['all', 'active', 'cancelled', 'expired'].map(f => (
                                            <button
                                                key={f}
                                                style={{
                                                    ...styles.filterBtn,
                                                    ...(bookingFilter === f ? styles.filterBtnActive : {}),
                                                }}
                                                onClick={() => setBookingFilter(f)}
                                            >
                                                {f.charAt(0).toUpperCase() + f.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={styles.bookingCount}>
                                            Total: {bookings.length} booking(s)
                                        </span>
                                        <button style={styles.refreshBtn} onClick={fetchAll}>
                                            🔄 Refresh
                                        </button>
                                    </div>
                                </div>

                                <div style={styles.tableWrap}>
                                    <table style={styles.table}>
                                        <thead>
                                            <tr style={styles.tableHead}>
                                                <th style={styles.th}>Receipt ID</th>
                                                <th style={styles.th}>User</th>
                                                <th style={styles.th}>Slot</th>
                                                <th style={styles.th}>Date</th>
                                                <th style={styles.th}>From</th>
                                                <th style={styles.th}>To</th>
                                                <th style={styles.th}>Status</th>
                                                <th style={styles.th}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bookings
                                                .filter(b => bookingFilter === 'all' || b.status === bookingFilter)
                                                .length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" style={styles.emptyRow}>
                                                        No bookings found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                bookings
                                                    .filter(b => bookingFilter === 'all' || b.status === bookingFilter)
                                                    .map(b => (
                                                        <tr key={b._id} style={styles.tableRow}>
                                                            <td style={styles.td}>
                                                                <span style={styles.receiptId}>{b.receiptId || 'N/A'}</span>
                                                            </td>
                                                            <td style={styles.td}>
                                                                {b.userId ? (
                                                                    <div>
                                                                        <div style={styles.userName}>{b.userId.name}</div>
                                                                        <div style={styles.userEmail}>{b.userId.email}</div>
                                                                    </div>
                                                                ) : (
                                                                    <span style={styles.deletedLabel}>Deleted User</span>
                                                                )}
                                                            </td>
                                                            <td style={styles.td}>
                                                                {b.slotId
                                                                    ? <strong>{b.slotId.slotId}</strong>
                                                                    : <span style={styles.deletedLabel}>Deleted Slot</span>}
                                                            </td>
                                                            <td style={styles.td}>
                                                                {new Date(b.startTime).toLocaleDateString()}
                                                            </td>
                                                            <td style={styles.td}>
                                                                {new Date(b.startTime).toLocaleTimeString([], {
                                                                    hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </td>
                                                            <td style={styles.td}>
                                                                {new Date(b.endTime).toLocaleTimeString([], {
                                                                    hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </td>
                                                            <td style={styles.td}>
                                                                <span style={{
                                                                    ...styles.badge,
                                                                    backgroundColor: `${getStatusColor(b.status)}22`,
                                                                    color: getStatusColor(b.status),
                                                                }}>
                                                                    {b.status}
                                                                </span>
                                                            </td>
                                                            <td style={styles.td}>
                                                                <button
                                                                    style={styles.deleteBtn}
                                                                    onClick={() => handleDeleteBookingClick(b._id, b.receiptId)}
                                                                >
                                                                    🗑️ Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const styles = {
    page: { minHeight: '100vh', backgroundColor: '#f0f2f5' },
    notification: {
        position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)',
        color: '#fff', padding: '12px 28px', borderRadius: '8px', zIndex: 999,
        fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    },
    container: { maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' },
    heading: { fontSize: '26px', color: '#1a1a2e', marginBottom: '20px' },
    tabRow: { display: 'flex', gap: '8px', marginBottom: '24px' },
    tabBtn: {
        padding: '10px 22px', border: '1px solid #ddd', borderRadius: '8px',
        cursor: 'pointer', backgroundColor: '#fff', fontSize: '14px', fontWeight: '500',
    },
    activeTabBtn: { backgroundColor: '#1565c0', color: '#fff', border: '1px solid #1565c0' },
    loading: { textAlign: 'center', padding: '60px', fontSize: '18px', color: '#666' },
    statsGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '16px', marginBottom: '24px',
    },
    statCard: {
        backgroundColor: '#fff', padding: '20px', borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center',
    },
    statNum: { fontSize: '32px', fontWeight: 'bold' },
    statLabel: { fontSize: '13px', color: '#666', marginTop: '4px' },
    peakBox: {
        backgroundColor: '#fff3e0', border: '1px solid #ffcc80',
        borderRadius: '10px', padding: '14px 20px', marginBottom: '24px', fontSize: '15px',
    },
    chartsRow: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
    chartBox: {
        flex: 1, minWidth: '300px', backgroundColor: '#fff', padding: '20px',
        borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
    chartTitle: { margin: '0 0 16px', color: '#333', fontSize: '15px' },
    addSlotBox: {
        backgroundColor: '#fff', padding: '20px', borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px',
    },
    addSlotRow: { display: 'flex', gap: '10px' },
    slotInput: {
        flex: 1, padding: '10px 14px', borderRadius: '8px',
        border: '1px solid #ddd', fontSize: '15px',
    },
    addBtn: {
        padding: '10px 24px', backgroundColor: '#1565c0', color: '#fff',
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
    },
    tableWrap: {
        backgroundColor: '#fff', borderRadius: '10px',
        overflow: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHead: { backgroundColor: '#1a1a2e' },
    th: {
        padding: '14px 16px', color: '#fff', textAlign: 'left',
        fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap',
    },
    tableRow: { borderBottom: '1px solid #f0f0f0' },
    td: { padding: '13px 16px', fontSize: '14px', color: '#333' },
    badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
    deleteBtn: {
        padding: '6px 12px', backgroundColor: '#ffebee', color: '#c62828',
        border: '1px solid #ef9a9a', borderRadius: '6px', fontSize: '13px',
    },
    // Add these inside the styles object:
    refreshRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
    },
    bookingCount: {
        fontSize: '15px',
        color: '#555',
        fontWeight: '500',
    },
    refreshBtn: {
        padding: '8px 20px',
        backgroundColor: '#fff',
        border: '1px solid #1565c0',
        color: '#1565c0',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
    },
    emptyRow: {
        textAlign: 'center',
        padding: '40px',
        color: '#999',
        fontSize: '15px',
    },
    userName: {
        fontWeight: '600',
        color: '#1a1a2e',
        fontSize: '14px',
    },
    userEmail: {
        fontSize: '12px',
        color: '#888',
        marginTop: '2px',
    },
    deletedLabel: {
        color: '#bbb',
        fontStyle: 'italic',
        fontSize: '13px',
    },
    receiptId: {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#555',
    },
    filterBtns: {
        display: 'flex',
        gap: '8px',
    },
    filterBtn: {
        padding: '6px 16px',
        border: '1px solid #ddd',
        borderRadius: '20px',
        cursor: 'pointer',
        backgroundColor: '#fff',
        fontSize: '13px',
        fontWeight: '500',
        color: '#555',
    },
    filterBtnActive: {
        backgroundColor: '#1a1a2e',
        color: '#fff',
        border: '1px solid #1a1a2e',
    },
    slotSelect: {
        padding: '10px 14px', borderRadius: '8px',
        border: '1px solid #ddd', fontSize: '15px',
        backgroundColor: '#fff', cursor: 'pointer',
    },
};

export default AdminDashboard;