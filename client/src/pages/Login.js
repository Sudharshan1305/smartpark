import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../services/api';

const Login = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);  // Toggle login/register
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [form, setForm] = useState({ name: '', email: '', password: '' });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            let response;
            if (isLogin) {
                response = await loginUser({ email: form.email, password: form.password });
            } else {
                response = await registerUser({ name: form.name, email: form.email, password: form.password });
            }

            const { token, user } = response.data;

            // Save token and user info to localStorage
            localStorage.setItem('smartpark_token', token);
            localStorage.setItem('smartpark_user', JSON.stringify(user));

            setMessage({ text: '✅ Success! Redirecting...', type: 'success' });

            // Redirect based on role
            setTimeout(() => {
                navigate(user.role === 'admin' ? '/admin' : '/dashboard');
            }, 800);

        } catch (error) {
            setMessage({
                text: error.response?.data?.message || 'Something went wrong.',
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {/* Logo */}
                <div style={styles.logo}>🅿️</div>
                <h1 style={styles.title}>SmartPark</h1>
                <p style={styles.subtitle}>Cloud-Based Parking Management</p>

                {/* Toggle Tabs */}
                <div style={styles.tabs}>
                    <button
                        style={{ ...styles.tab, ...(isLogin ? styles.activeTab : {}) }}
                        onClick={() => { setIsLogin(true); setMessage({ text: '', type: '' }); }}
                    >Login</button>
                    <button
                        style={{ ...styles.tab, ...(!isLogin ? styles.activeTab : {}) }}
                        onClick={() => { setIsLogin(false); setMessage({ text: '', type: '' }); }}
                    >Register</button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={styles.form}>
                    {!isLogin && (
                        <input
                            style={styles.input} type="text" name="name"
                            placeholder="Full Name" value={form.name}
                            onChange={handleChange} required
                        />
                    )}
                    <input
                        style={styles.input} type="email" name="email"
                        placeholder="Email Address" value={form.email}
                        onChange={handleChange} required
                    />
                    <input
                        style={styles.input} type="password" name="password"
                        placeholder="Password" value={form.password}
                        onChange={handleChange} required
                    />

                    {/* Message */}
                    {message.text && (
                        <div style={{
                            ...styles.message,
                            backgroundColor: message.type === 'success' ? '#e8f5e9' : '#ffebee',
                            color: message.type === 'success' ? '#2e7d32' : '#c62828',
                        }}>
                            {message.text}
                        </div>
                    )}

                    <button style={styles.submitBtn} type="submit" disabled={loading}>
                        {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
                    </button>
                </form>

                {/* Admin hint */}
                <p style={styles.hint}>
                    Admin? Use admin@smartpark.com / admin123
                </p>
            </div>
        </div>
    );
};

const styles = {
    page: {
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', backgroundColor: '#e8eaf6',
    },
    card: {
        backgroundColor: '#fff', padding: '40px', borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)', width: '100%', maxWidth: '420px',
        textAlign: 'center',
    },
    logo: { fontSize: '48px', marginBottom: '8px' },
    title: { fontSize: '28px', fontWeight: 'bold', color: '#1a1a2e', margin: '0' },
    subtitle: { color: '#666', fontSize: '14px', marginBottom: '24px' },
    tabs: {
        display: 'flex', marginBottom: '24px', borderRadius: '8px', overflow: 'hidden',
        border: '1px solid #e0e0e0'
    },
    tab: {
        flex: 1, padding: '10px', border: 'none', backgroundColor: '#f5f5f5',
        cursor: 'pointer', fontSize: '15px', fontWeight: '500',
    },
    activeTab: { backgroundColor: '#1565c0', color: '#fff' },
    form: { display: 'flex', flexDirection: 'column', gap: '14px' },
    input: {
        padding: '12px 16px', borderRadius: '8px', border: '1px solid #ddd',
        fontSize: '15px', outline: 'none',
    },
    message: { padding: '10px', borderRadius: '8px', fontSize: '14px' },
    submitBtn: {
        backgroundColor: '#1565c0', color: '#fff', border: 'none',
        padding: '13px', borderRadius: '8px', fontSize: '16px',
        fontWeight: 'bold', cursor: 'pointer', marginTop: '4px',
    },
    hint: { marginTop: '20px', fontSize: '12px', color: '#999' },
};

export default Login;