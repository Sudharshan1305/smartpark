import React from 'react';

const SlotCard = ({ slot, onBook }) => {
    const isAvailable = slot.status === 'available';

    return (
        <div style={{ ...styles.card, borderColor: isAvailable ? '#4caf50' : '#e53935' }}>
            <div style={styles.slotId}>{slot.slotId}</div>
            <div style={{ ...styles.badge, backgroundColor: isAvailable ? '#4caf50' : '#e53935' }}>
                {isAvailable ? '✅ Available' : '🔴 Occupied'}
            </div>
            {isAvailable && (
                <button style={styles.bookBtn} onClick={() => onBook(slot)}>
                    Book Slot
                </button>
            )}
        </div>
    );
};

const styles = {
    card: {
        border: '2px solid', borderRadius: '12px', padding: '20px',
        textAlign: 'center', backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
    },
    slotId: { fontSize: '28px', fontWeight: 'bold', color: '#1a1a2e' },
    badge: {
        color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '13px',
    },
    bookBtn: {
        marginTop: '8px', backgroundColor: '#1565c0', color: '#fff',
        border: 'none', padding: '8px 20px', borderRadius: '6px',
        cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
    },
};

export default SlotCard;