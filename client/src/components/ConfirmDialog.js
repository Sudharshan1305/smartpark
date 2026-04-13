import React from 'react';

const ConfirmDialog = ({ isOpen, title, message, confirmText, confirmColor,
    onConfirm, onCancel, loading }) => {
    if (!isOpen) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.dialog}>

                {/* Icon */}
                <div style={styles.iconWrap}>
                    <span style={styles.icon}>⚠️</span>
                </div>

                {/* Title */}
                <h3 style={styles.title}>{title}</h3>

                {/* Message */}
                <p style={styles.message}>{message}</p>

                {/* Buttons */}
                <div style={styles.buttons}>
                    <button
                        style={styles.cancelBtn}
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Go Back
                    </button>
                    <button
                        style={{
                            ...styles.confirmBtn,
                            backgroundColor: confirmColor || '#e53935',
                        }}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Please wait...' : confirmText || 'Confirm'}
                    </button>
                </div>

            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
    },
    dialog: {
        backgroundColor: '#fff',
        padding: '36px 32px',
        borderRadius: '16px',
        width: '380px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
        textAlign: 'center',
        animation: 'fadeIn 0.2s ease',
    },
    iconWrap: {
        marginBottom: '12px',
    },
    icon: {
        fontSize: '44px',
    },
    title: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#1a1a2e',
        margin: '0 0 10px',
    },
    message: {
        color: '#666',
        fontSize: '15px',
        marginBottom: '28px',
        lineHeight: '1.6',
    },
    buttons: {
        display: 'flex',
        gap: '12px',
    },
    cancelBtn: {
        flex: 1,
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: '#f5f5f5',
        fontSize: '15px',
        fontWeight: '500',
        color: '#333',
    },
    confirmBtn: {
        flex: 1,
        padding: '12px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        color: '#fff',
        fontSize: '15px',
        fontWeight: 'bold',
    },
};

export default ConfirmDialog;