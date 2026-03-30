import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-split">
            {/* ─── Left Brand Panel ─── */}
            <div className="auth-panel">
                <div className="auth-panel__inner">
                    <div className="auth-panel__logo">
                        <img src="/assets/logo_wide.png" alt="AgroTree" className="auth-panel__logo-wide" />
                    </div>

                    <div className="auth-panel__headline">
                        <h1>Selamat Datang<br />di AgroTree</h1>
                        <p>Sistem Rekomendasi Tanaman Cerdas berbasis Kecerdasan Buatan untuk petani modern Indonesia.</p>
                    </div>

                    <ul className="auth-panel__features">
                        <li>
                            <div className="auth-panel__feat-icon">
                                <span className="material-symbols-outlined">online_prediction</span>
                            </div>
                            <div>
                                <strong>Prediksi Akurat berbasis AI</strong>
                                <span>Algoritma Decision Tree dengan akurasi 94%</span>
                            </div>
                        </li>
                        <li>
                            <div className="auth-panel__feat-icon">
                                <span className="material-symbols-outlined">menu_book</span>
                            </div>
                            <div>
                                <strong>20+ Ensiklopedia Tanaman</strong>
                                <span>Pustaka botani komoditas unggulan Indonesia</span>
                            </div>
                        </li>
                        <li>
                            <div className="auth-panel__feat-icon">
                                <span className="material-symbols-outlined">analytics</span>
                            </div>
                            <div>
                                <strong>Statistik dan Analitik Lahan</strong>
                                <span>Monitor tren kecocokan tanah secara visual</span>
                            </div>
                        </li>
                    </ul>

                    <div className="auth-panel__decor" aria-hidden="true">
                        <span className="material-symbols-outlined">eco</span>
                    </div>
                </div>
                <div className="auth-panel__dots" aria-hidden="true" />
            </div>

            {/* ─── Right Form Panel ─── */}
            <div className="auth-form-side">
                <div className="auth-card">
                    <div className="auth-card__header">
                        <h2>Masuk ke Akun</h2>
                        <p className="auth-subtitle">Masukkan kredensial Anda untuk melanjutkan</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Email</label>
                            <div className="input-icon-wrap">
                                <span className="material-symbols-outlined input-icon">mail</span>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="nama@email.com" required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <div className="input-icon-wrap">
                                <span className="material-symbols-outlined input-icon">lock</span>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="Masukkan password" required />
                            </div>
                        </div>
                        {error && <div className="form-error">{error}</div>}
                        <button type="submit" className="btn-primary auth-btn-submit" disabled={loading}>
                            {loading ? <div className="spinner" /> : (
                                <>
                                    <span className="material-symbols-outlined">login</span>
                                    Masuk
                                </>
                            )}
                        </button>
                        <p className="auth-switch">
                            Belum punya akun? <Link to="/register">Daftar Sekarang</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
