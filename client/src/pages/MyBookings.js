import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ConfirmDialog from '../components/ConfirmDialog';
import { getMyBookings, cancelBooking, getReceipt } from '../services/api';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';

const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000';

const MyBookings = () => {
    const [data, setData] = useState({ activeBookings: [], pastBookings: [] });
    const [loading, setLoading] = useState(true);
    const [notification, setNotif] = useState({ text: '', type: '' });
    const [dialog, setDialog] = useState({ open: false, bookingId: null, slotName: '', cancelling: false });
    const [expandedQR, setExpandedQR] = useState(null); // which booking's QR is shown
    const navigate = useNavigate();

    const showNotif = (text, type) => {
        setNotif({ text, type });
        setTimeout(() => setNotif({ text: '', type: '' }), 3500);
    };

    const fetchBookings = async () => {
        try {
            const res = await getMyBookings();
            setData({
                activeBookings: res.data.activeBookings || [],
                pastBookings: res.data.pastBookings || [],
            });
        } catch { showNotif('Failed to load bookings.', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchBookings(); }, []);

    const handleCancelClick = (bookingId, slotName) => {
        setDialog({ open: true, bookingId, slotName, cancelling: false });
    };

    const handleConfirmCancel = async () => {
        setDialog(prev => ({ ...prev, cancelling: true }));
        try {
            await cancelBooking(dialog.bookingId);
            showNotif('✅ Booking cancelled successfully!', 'success');
            setDialog({ open: false, bookingId: null, slotName: '', cancelling: false });
            fetchBookings();
        } catch (err) {
            showNotif(err.response?.data?.message || 'Cancel failed.', 'error');
            setDialog({ open: false, bookingId: null, slotName: '', cancelling: false });
        }
    };

    const handleDownloadPDF = async (bookingId) => {
        try {
            const res = await getReceipt(bookingId);
            const r = res.data.receipt;

            const doc = new jsPDF();
            const qrUrl = `${FRONTEND_URL}/booking/${bookingId}`;

            // Header
            doc.setFillColor(21, 101, 192);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text('SmartPark', 20, 18);
            doc.setFontSize(12);
            doc.text('Parking Booking Receipt', 20, 30);

            // Receipt details
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            doc.text(`Receipt ID : ${r.receiptId}`, 20, 52);
            doc.text(`Booked On  : ${new Date(r.bookedOn).toLocaleString()}`, 20, 62);

            doc.setDrawColor(200, 200, 200);
            doc.line(20, 70, 190, 70);

            doc.setFontSize(13);
            doc.setTextColor(21, 101, 192);
            doc.text('Customer Details', 20, 80);
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            doc.text(`Name  : ${r.userName}`, 20, 90);
            doc.text(`Email : ${r.userEmail}`, 20, 100);

            doc.setFontSize(13);
            doc.setTextColor(21, 101, 192);
            doc.text('Booking Details', 20, 116);
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            doc.text(`Slot         : ${r.slotId}`, 20, 126);
            doc.text(`Vehicle Type : ${r.vehicleType}`, 20, 136);
            doc.text(`Date         : ${new Date(r.startTime).toLocaleDateString()}`, 20, 146);
            doc.text(`Start Time   : ${new Date(r.startTime).toLocaleTimeString()}`, 20, 156);
            doc.text(`End Time     : ${new Date(r.endTime).toLocaleTimeString()}`, 20, 166);
            doc.text(`Duration     : ${r.durationHours} hour(s)`, 20, 176);
            doc.text(`Status       : ${r.status.toUpperCase()}`, 20, 186);

            // QR Code section
            doc.setFontSize(13);
            doc.setTextColor(21, 101, 192);
            doc.text('Scan QR to View Booking', 120, 116);
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(9);
            doc.text(qrUrl, 120, 124);

            // Generate QR as data URL
            //const canvas = document.createElement('canvas');
            const QRCode = await import('qrcode');
            const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 200 });
            doc.addImage(qrDataUrl, 'PNG', 120, 128, 55, 55);

            // Footer
            doc.setFillColor(240, 242, 245);
            doc.rect(0, 270, 210, 30, 'F');
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text('Thank you for using SmartPark!', 20, 282);
            doc.text('Scan the QR code to verify your booking anytime.', 20, 290);

            doc.save(`SmartPark-Receipt-${r.receiptId}.pdf`);
            showNotif('✅ Receipt downloaded!', 'success');
        } catch (err) {
            console.error(err);
            showNotif('Failed to generate receipt.', 'error');
        }
    };

    const formatDate = (t) => new Date(t).toLocaleDateString();
    const formatTime = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const getStatusColor = (s) =>
        s === 'active' ? '#4caf50' : s === 'cancelled' ? '#e53935' : '#ff9800';
    const vehicleIcon = (v) => v === 'two-wheeler' ? '🏍️' : '🚗';

    const BookingCard = ({ b, isActive }) => {
        const qrUrl = `${FRONTEND_URL}/booking/${b._id}`;
        const isQROpen = expandedQR === b._id;

        return (
            <div style={{ ...styles.bookingCard, borderLeft: `4px solid ${getStatusColor(b.status)}` }}>
                <div style={styles.cardTop}>
                    <div>
                        <span style={styles.slotLabel}>
                            Slot: <strong>{b.slotId?.slotId}</strong>
                        </span>
                        <span style={styles.vehicleBadge}>
                            {vehicleIcon(b.vehicleType)} {b.vehicleType}
                        </span>
                    </div>
                    <span style={{ ...styles.statusBadge, backgroundColor: getStatusColor(b.status) }}>
                        {b.status.toUpperCase()}
                    </span>
                </div>

                <div style={styles.cardInfo}>
                    <div>📅 {formatDate(b.startTime)}</div>
                    <div>🕐 From: {formatTime(b.startTime)}</div>
                    <div>🕔 To: {formatTime(b.endTime)}</div>
                    <div>🔖 {b.receiptId}</div>
                </div>

                {/* QR Code section */}
                <div style={styles.qrSection}>
                    <button
                        style={styles.qrToggleBtn}
                        onClick={() => setExpandedQR(isQROpen ? null : b._id)}
                    >
                        {isQROpen ? '▲ Hide QR Code' : '📱 Show QR Code'}
                    </button>
                    {isQROpen && (
                        <div style={styles.qrContainer}>
                            <QRCodeSVG
                                value={qrUrl}
                                size={130}
                                bgColor="#ffffff"
                                fgColor="#1a1a2e"
                                level="M"
                                includeMargin={true}
                            />
                            <div style={styles.qrCaption}>
                                Scan to view booking details
                            </div>
                            <div style={styles.qrUrl}>{qrUrl}</div>
                        </div>
                    )}
                </div>

                <div style={styles.cardActions}>
                    {isActive && (
                        <button style={styles.cancelBtn}
                            onClick={() => handleCancelClick(b._id, b.slotId?.slotId)}>
                            ❌ Cancel Booking
                        </button>
                    )}
                    <button style={styles.pdfBtn} onClick={() => handleDownloadPDF(b._id)}>
                        📄 Download Receipt
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div style={styles.page}>
            <Navbar />

            <ConfirmDialog
                isOpen={dialog.open}
                title="Cancel Booking?"
                message={`Are you sure you want to cancel your booking for Slot ${dialog.slotName}? This cannot be undone.`}
                confirmText="Yes, Cancel Booking"
                confirmColor="#e53935"
                loading={dialog.cancelling}
                onConfirm={handleConfirmCancel}
                onCancel={() => setDialog({ open: false, bookingId: null, slotName: '', cancelling: false })}
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
                <div style={styles.headingRow}>
                    <h2 style={styles.heading}>📋 My Bookings</h2>
                    <button style={styles.refreshBtn} onClick={fetchBookings}>🔄 Refresh</button>
                </div>

                {loading ? (
                    <div style={styles.loading}>Loading bookings...</div>
                ) : (
                    <>
                        {/* Active Bookings */}
                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>🟢 Active Bookings</h3>
                            {data.activeBookings.length === 0 ? (
                                <div style={styles.emptyBox}>
                                    No active bookings.{' '}
                                    <span style={styles.goLink} onClick={() => navigate('/dashboard')}>
                                        Book a slot now →
                                    </span>
                                </div>
                            ) : (
                                data.activeBookings.map(b => (
                                    <BookingCard key={b._id} b={b} isActive={true} />
                                ))
                            )}
                        </div>

                        {/* Past Bookings */}
                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>📜 Booking History</h3>
                            {data.pastBookings.length === 0 ? (
                                <div style={styles.emptyBox}>No past bookings yet.</div>
                            ) : (
                                data.pastBookings.map(b => (
                                    <BookingCard key={b._id} b={b} isActive={false} />
                                ))
                            )}
                        </div>
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
    container: { maxWidth: '800px', margin: '0 auto', padding: '30px 20px' },
    headingRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    heading: { fontSize: '26px', color: '#1a1a2e', margin: 0 },
    refreshBtn: {
        padding: '8px 20px', backgroundColor: '#fff', border: '1px solid #1565c0',
        color: '#1565c0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
    },
    section: { marginBottom: '36px' },
    sectionTitle: { fontSize: '18px', color: '#333', marginBottom: '14px' },
    bookingCard: {
        backgroundColor: '#fff', borderRadius: '12px', padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '14px',
    },
    cardTop: {
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '12px',
    },
    slotLabel: { fontSize: '18px', color: '#1a1a2e', display: 'block' },
    vehicleBadge: {
        display: 'inline-block', marginTop: '4px', fontSize: '13px',
        color: '#1565c0', backgroundColor: '#e3f2fd',
        padding: '2px 10px', borderRadius: '20px',
    },
    statusBadge: {
        color: '#fff', padding: '4px 12px', borderRadius: '20px',
        fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap',
    },
    cardInfo: {
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '4px 20px', color: '#555', fontSize: '14px', marginBottom: '14px',
    },
    qrSection: { borderTop: '1px solid #f0f0f0', paddingTop: '14px', marginBottom: '14px' },
    qrToggleBtn: {
        padding: '7px 16px', backgroundColor: '#f5f5f5', border: '1px solid #ddd',
        borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#555',
    },
    qrContainer: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '16px', backgroundColor: '#fafafa',
        borderRadius: '10px', marginTop: '12px',
    },
    qrCaption: { marginTop: '8px', fontSize: '13px', color: '#555' },
    qrUrl: { marginTop: '4px', fontSize: '10px', color: '#999', wordBreak: 'break-all', textAlign: 'center' },
    cardActions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
    cancelBtn: {
        padding: '8px 16px', backgroundColor: '#ffebee', color: '#c62828',
        border: '1px solid #ef9a9a', borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
    },
    pdfBtn: {
        padding: '8px 16px', backgroundColor: '#e3f2fd', color: '#1565c0',
        border: '1px solid #90caf9', borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
    },
    emptyBox: {
        backgroundColor: '#fff', borderRadius: '10px', padding: '30px',
        textAlign: 'center', color: '#888', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    goLink: { color: '#1565c0', cursor: 'pointer', textDecoration: 'underline' },
    loading: { textAlign: 'center', padding: '60px', fontSize: '18px', color: '#666' },
};

export default MyBookings;