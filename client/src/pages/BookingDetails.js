import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicBooking } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';

const BookingDetails = () => {
    const { bookingId } = useParams();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getPublicBooking(bookingId);
                setBooking(res.data);
            } catch {
                setError('Booking not found or invalid link.');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [bookingId]);

    const fmt = (t) => new Date(t).toLocaleString();
    const getStatusColor = (s) =>
        s === 'active' ? '#2e7d32' : s === 'cancelled' ? '#c62828' : '#e65100';

    if (loading) return (
        <div style={styles.center}>
            <div style={styles.spinner}>🅿️</div>
            <p>Loading booking details...</p>
        </div>
    );

    if (error) return (
        <div style={styles.center}>
            <div style={{ fontSize: '48px' }}>❌</div>
            <h2 style={{ color: '#c62828' }}>Booking Not Found</h2>
            <p style={{ color: '#666' }}>{error}</p>
        </div>
    );

    const qrUrl = window.location.href;

    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.logo}>🅿️ SmartPark</div>
                <div style={styles.headerSub}>Booking Verification</div>
            </div>

            <div style={styles.container}>
                {/* Status Banner */}
                <div style={{ ...styles.statusBanner, backgroundColor: getStatusColor(booking.status) }}>
                    <span style={styles.statusIcon}>
                        {booking.status === 'active' ? '✅' : booking.status === 'cancelled' ? '❌' : '⏰'}
                    </span>
                    <span style={styles.statusText}>
                        Booking {booking.status.toUpperCase()}
                    </span>
                </div>

                {/* Receipt ID */}
                <div style={styles.receiptBox}>
                    <span style={styles.receiptLabel}>Receipt ID</span>
                    <span style={styles.receiptId}>{booking.receiptId}</span>
                </div>

                {/* Details Grid */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>👤 Customer</h3>
                    <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Name</span>
                        <span style={styles.detailValue}>{booking.userName}</span>
                    </div>
                </div>

                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>🅿️ Parking Details</h3>
                    <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Slot</span>
                        <span style={{ ...styles.detailValue, fontSize: '22px', fontWeight: 'bold', color: '#1565c0' }}>
                            {booking.slotId}
                        </span>
                    </div>
                    <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Vehicle Type</span>
                        <span style={styles.detailValue}>
                            {booking.vehicleType === 'two-wheeler' ? '🏍️ Two-Wheeler' : '🚗 Four-Wheeler'}
                        </span>
                    </div>
                </div>

                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>🕐 Time Details</h3>
                    <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Date</span>
                        <span style={styles.detailValue}>
                            {new Date(booking.startTime).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                    <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>From</span>
                        <span style={styles.detailValue}>
                            {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>To</span>
                        <span style={styles.detailValue}>
                            {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Duration</span>
                        <span style={styles.detailValue}>{booking.durationHours} hour(s)</span>
                    </div>
                    <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Booked On</span>
                        <span style={styles.detailValue}>{fmt(booking.bookedOn)}</span>
                    </div>
                </div>

                {/* QR Code */}
                <div style={styles.qrCard}>
                    <h3 style={styles.cardTitle}>📱 Booking QR Code</h3>
                    <div style={styles.qrWrap}>
                        <QRCodeSVG value={qrUrl} size={160} bgColor="#fff" fgColor="#1a1a2e"
                            level="M" includeMargin={true} />
                    </div>
                    <p style={styles.qrNote}>This QR code links to this booking's details page</p>
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    <p>🅿️ <strong>SmartPark</strong> — Cloud-Based Parking Management System</p>
                    <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        This is an automatically generated booking confirmation.
                    </p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: 'Segoe UI, sans-serif' },
    center: {
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#333',
    },
    spinner: { fontSize: '48px', animation: 'spin 1s linear infinite' },
    header: {
        backgroundColor: '#1a1a2e', padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    logo: { fontSize: '22px', fontWeight: 'bold', color: '#4fc3f7' },
    headerSub: { fontSize: '13px', color: '#90a4ae' },
    container: { maxWidth: '480px', margin: '0 auto', padding: '20px 16px 40px' },
    statusBanner: {
        borderRadius: '12px', padding: '16px 20px', marginBottom: '16px',
        display: 'flex', alignItems: 'center', gap: '12px',
    },
    statusIcon: { fontSize: '24px' },
    statusText: { fontSize: '18px', fontWeight: 'bold', color: '#fff' },
    receiptBox: {
        backgroundColor: '#1a1a2e', borderRadius: '10px', padding: '14px 20px',
        marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    },
    receiptLabel: { fontSize: '12px', color: '#90a4ae' },
    receiptId: { fontSize: '14px', fontWeight: 'bold', color: '#4fc3f7', fontFamily: 'monospace' },
    card: {
        backgroundColor: '#fff', borderRadius: '12px', padding: '18px 20px',
        marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    },
    cardTitle: { fontSize: '14px', color: '#888', fontWeight: '600', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f5f5f5' },
    detailLabel: { fontSize: '13px', color: '#888' },
    detailValue: { fontSize: '14px', color: '#1a1a2e', fontWeight: '500', textAlign: 'right' },
    qrCard: {
        backgroundColor: '#fff', borderRadius: '12px', padding: '20px',
        marginBottom: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    },
    qrWrap: { display: 'flex', justifyContent: 'center', margin: '16px 0' },
    qrNote: { fontSize: '12px', color: '#999' },
    footer: { textAlign: 'center', padding: '20px 0', fontSize: '13px', color: '#555' },
};

export default BookingDetails;