import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function NotFoundPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f0fdb4 0%, #10b981 100%)',
            padding: '20px',
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '24px',
                padding: '48px',
                textAlign: 'center',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.5)'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px auto'
                }}>
                    <AlertCircle size={40} color="#ef4444" />
                </div>

                <h1 style={{
                    fontSize: '80px',
                    fontWeight: '800',
                    color: 'var(--primary-dark)',
                    margin: '0 0 8px 0',
                    lineHeight: '1'
                }}>404</h1>

                <h2 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#1f2937',
                    margin: '0 0 16px 0'
                }}>Halaman Tidak Ditemukan</h2>

                <p style={{
                    color: '#6b7280',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    margin: '0 0 32px 0'
                }}>
                    Waduh, sepertinya kamu tersesat di tengah hutan! 🌳 Halaman yang kamu cari sudah tidak ada atau url-nya salah ketik.
                </p>

                <button
                    onClick={() => navigate(user ? '/app' : '/')}
                    style={{
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        padding: '14px 28px',
                        borderRadius: '100px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        transition: 'var(--transition)',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <Home size={20} />
                    Kembali ke Beranda
                </button>
            </div>
        </div>
    );
}
