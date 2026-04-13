import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('smartpark_user') || 'null');

    const handleLogout = () => {
        localStorage.removeItem('smartpark_token');
        localStorage.removeItem('smartpark_user');
        navigate('/login');
    };

    return (
        <nav style={styles.nav}>
            <div style={styles.brand}>🅿️ SmartPark</div>
            <div style={styles.links}>
                {user?.role === 'user' && (
                    <>
                        <Link to="/dashboard" style={styles.link}>Dashboard</Link>
                        <Link to="/my-bookings" style={styles.link}>My Bookings</Link>
                    </>
                )}
                {user?.role === 'admin' && (
                    <Link to="/admin" style={styles.link}>Admin Panel</Link>
                )}
                <span style={styles.userName}>👤 {user?.name}</span>
                <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
            </div>
        </nav>
    );
};

const styles = {
    nav: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 32px', backgroundColor: '#1a1a2e', color: '#fff',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 100,
    },
    brand: { fontSize: '22px', fontWeight: 'bold', color: '#4fc3f7', letterSpacing: '1px' },
    links: { display: 'flex', alignItems: 'center', gap: '20px' },
    link: {
        color: '#ccc', textDecoration: 'none', fontSize: '15px',
        transition: 'color 0.2s'
    },
    userName: { color: '#4fc3f7', fontSize: '14px' },
    logoutBtn: {
        backgroundColor: '#e53935', color: '#fff', border: 'none',
        padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
    },
};

export default Navbar;