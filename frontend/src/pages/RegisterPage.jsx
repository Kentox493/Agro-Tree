import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function getPasswordStrength(pw) {
    const checks = [
        { label: 'Min. 8 karakter', met: pw.length >= 8 },
        { label: '1 huruf besar (A-Z)', met: /[A-Z]/.test(pw) },
        { label: '1 huruf kecil (a-z)', met: /[a-z]/.test(pw) },
        { label: '1 angka (0-9)', met: /[0-9]/.test(pw) },
    ];
    const score = checks.filter(c => c.met).length;
    return { checks, score };
}

export default function RegisterPage() {
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const strength = useMemo(() => getPasswordStrength(password), [password]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (strength.score < 4) {
            setError('Password belum memenuhi semua persyaratan kekuatan');
            return;
        }
        setLoading(true);
        try {
            await register(name, email, password);
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
                        <h1>Bergabunglah dengan<br />AgroTree</h1>
                        <p>Mulai perjalanan pertanian cerdas Anda bersama lebih dari 10.000 petani modern yang telah merasakan manfaatnya.</p>
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
                                <span className="material-symbols-outlined">star</span>
                            </div>
                            <div>
                                <strong>Akun Gratis Selamanya</strong>
                                <span>10 kuota prediksi pertama tanpa biaya apapun</span>
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
                        <h2>Buat Akun Baru</h2>
                        <p className="auth-subtitle">Daftar gratis dan mulai prediksi tanaman Anda</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Nama Lengkap</label>
                            <div className="input-icon-wrap">
                                <span className="material-symbols-outlined input-icon">person</span>
                                <input type="text" value={name} onChange={e => setName(e.target.value)}
                                    placeholder="Masukkan nama lengkap" required />
                            </div>
                        </div>
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
                                    placeholder="Min. 8 karakter, huruf besar, kecil, angka" required minLength={8} />
                            </div>
                            {password && (
                                <div className="password-strength">
                                    <div className="password-strength-bar">
                                        <div className="password-strength-fill" style={{
                                            width: `${(strength.score / 4) * 100}%`,
                                            background: strength.score <= 1 ? '#ef4444' : strength.score <= 2 ? '#f59e0b' : strength.score <= 3 ? '#3b82f6' : '#10b981'
                                        }} />
                                    </div>
                                    <ul className="password-checks">
                                        {strength.checks.map((c, i) => (
                                            <li key={i} className={c.met ? 'met' : ''}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                                    {c.met ? 'check_circle' : 'cancel'}
                                                </span>
                                                {c.label}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        {error && <div className="form-error">{error}</div>}
                        <button type="submit" className="btn-primary auth-btn-submit" disabled={loading}>
                            {loading ? <div className="spinner" /> : (
                                <>
                                    <span className="material-symbols-outlined">person_add</span>
                                    Buat Akun
                                </>
                            )}
                        </button>
                        <p className="auth-switch">
                            Sudah punya akun? <Link to="/login">Masuk</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
