import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const { user, setUser } = useAuth();
    const [stats, setStats] = useState(null);

    // Avatar state
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);

    // Predefined preset avatars
    const PRESET_AVATARS = [
        '/assets/avatars/1.png',
        '/assets/avatars/2.png',
        '/assets/avatars/3.png',
        '/assets/avatars/4.png',
        '/assets/avatars/5.png',
        '/assets/avatars/6.png',
    ];

    // Name form
    const [newName, setNewName] = useState('');
    const [nameLoading, setNameLoading] = useState(false);

    // Password form
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwLoading, setPwLoading] = useState(false);

    useEffect(() => {
        api.getStats().then(setStats).catch(() => { });
    }, []);

    useEffect(() => {
        if (user?.name) setNewName(user.name);
    }, [user]);

    const handleAvatarSelect = async (url) => {
        setAvatarLoading(true);
        try {
            const res = await api.updateAvatar(url);
            if (res.token) localStorage.setItem('token', res.token);
            if (res.user) setUser(res.user);
            toast.success('Foto profil berhasil diubah!');
            setIsAvatarModalOpen(false);
        } catch (err) {
            toast.error(err.message || 'Ups, ada masalah saat memproses fotomu. Coba sejenak lagi ya! 🍃');
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) return toast.error('Wah, formatnya tidak didukung! Pastikan itu file gambar (JPG/PNG) 🖼️');
        if (file.size > 2 * 1024 * 1024) return toast.error('Ukuran fotonya terlalu besar! Maksimal 2MB ya, biar tetap gesit 🚀');

        setAvatarLoading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const res = await api.uploadAvatar(formData);
            if (res.token) localStorage.setItem('token', res.token);
            if (res.user) setUser(res.user);
            toast.success('Foto profil berhasil diunggah!');
            setIsAvatarModalOpen(false);
        } catch (err) {
            toast.error(err.message || 'Koneksi terputus! Gagal mengunggah foto barumu. 📡');
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleUpdateName = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return toast.error('Hei, namamu tidak boleh kosong! Kami butuh panggilan akrabmu 🌱');
        setNameLoading(true);
        try {
            const res = await api.updateName(newName.trim());
            // Update local user and token
            if (res.token) localStorage.setItem('token', res.token);
            if (res.user) setUser(res.user);
            toast.success('Nama berhasil diubah!');
        } catch (err) {
            toast.error(err.message || 'Gagal menyimpan nama barumu. Coba periksa koneksimu 🌿');
        } finally {
            setNameLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (!oldPassword || !newPassword) return toast.error('Oops! Jangan ada kolom sandi yang terlewat ya 🔒');
        if (newPassword.length < 6) return toast.error('Sandi barumu terlalu singkat! Buat minimal 6 karakter biar lebih aman 🛡️');
        if (newPassword !== confirmPassword) return toast.error('Konfirmasi sandi tidak klop! Coba ketik ulang dengan hati-hati 🔍');
        setPwLoading(true);
        try {
            await api.updatePassword(oldPassword, newPassword);
            toast.success('Password berhasil diubah!');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            toast.error(err.message || 'Sandi gagal diperbarui. Pastikan sandi lamamu sudah benar ya! 🗝️');
        } finally {
            setPwLoading(false);
        }
    };

    return (
        <>
            <div className="modern-profile-wrapper">
                {/* ─── HER0 SECTION (Banner, Avatar, Stats) ─── */}
                <div className="profile-hero fade-in-up">
                    <div className="profile-cover"></div>
                    <div className="profile-hero-content">
                        <div className="profile-avatar-container" onClick={() => setIsAvatarModalOpen(true)}>
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt="Profile" className="profile-avatar-img" />
                            ) : (
                                <div className="profile-avatar-large">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                            <div className="avatar-edit-overlay">
                                <span className="material-symbols-outlined">photo_camera</span>
                            </div>
                        </div>

                        <div className="profile-details">
                            <h2>{user?.name || 'Petani Modern'}</h2>
                            <p>{user?.email || '-'}</p>
                            <div className="profile-badges">
                                <span className="badge-pro">
                                    <span className="material-symbols-outlined">workspace_premium</span> PRO Plan
                                </span>
                                <span className="badge-secure">
                                    <span className="material-symbols-outlined">verified_user</span> Terverifikasi
                                </span>
                            </div>
                        </div>

                        <div className="profile-stats-modern">
                            <div className="stat-box">
                                <span className="stat-value">{stats?.total_predictions || 0}</span>
                                <span className="stat-label">Prediksi</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-box">
                                <span className="stat-value">{stats?.unique_crops || 0}</span>
                                <span className="stat-label">Tanaman</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-box">
                                <span className="stat-value">{stats?.avg_confidence ? `${Math.round(stats.avg_confidence * 100)}%` : '0%'}</span>
                                <span className="stat-label">Akurasi AI</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── SETTINGS GRID ─── */}
                <div className="profile-settings-grid fade-in-up" style={{ animationDelay: '0.15s' }}>
                    {/* Change Username Card */}
                    <div className="modern-settings-card">
                        <div className="settings-card-header">
                            <div className="settings-icon-wrapper icon-primary">
                                <span className="material-symbols-outlined">badge</span>
                            </div>
                            <div className="settings-header-text">
                                <h3>Informasi Akun</h3>
                                <p>Perbarui identitas profil Anda</p>
                            </div>
                        </div>
                        <form onSubmit={handleUpdateName} className="settings-form">
                            <div className="form-group">
                                <label>Nama Lengkap</label>
                                <div className="input-icon-wrap">
                                    <span className="material-symbols-outlined input-icon">person</span>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="Masukkan nama baru"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Alamat Email</label>
                                <div className="input-icon-wrap">
                                    <span className="material-symbols-outlined input-icon">mail</span>
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="disabled-input"
                                        title="Email digunakan sebagai identitas utama dan tidak dapat diubah"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Bergabung Sejak</label>
                                <div className="input-icon-wrap">
                                    <span className="material-symbols-outlined input-icon">calendar_month</span>
                                    <input
                                        type="text"
                                        value={user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                                        disabled
                                        className="disabled-input"
                                        title="Tanggal pendaftaran akun Anda"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn-save-primary" disabled={nameLoading} style={{ marginTop: '24px' }}>
                                {nameLoading ? <div className="spinner" /> : (
                                    <>
                                        <span className="material-symbols-outlined">save</span>
                                        Simpan Perubahan
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Change Password Card */}
                    <div className="modern-settings-card">
                        <div className="settings-card-header">
                            <div className="settings-icon-wrapper icon-warning">
                                <span className="material-symbols-outlined">lock</span>
                            </div>
                            <div className="settings-header-text">
                                <h3>Keamanan Password</h3>
                                <p>Gunakan password unik & kuat</p>
                            </div>
                        </div>
                        <form onSubmit={handleUpdatePassword} className="settings-form">
                            <div className="form-group">
                                <label>Password Lama</label>
                                <div className="input-icon-wrap">
                                    <span className="material-symbols-outlined input-icon">key</span>
                                    <input
                                        type="password"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        placeholder="Masukkan password lama"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Password Baru</label>
                                <div className="input-icon-wrap">
                                    <span className="material-symbols-outlined input-icon">lock_reset</span>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min. 8 karakter"
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Konfirmasi Password Baru</label>
                                <div className="input-icon-wrap">
                                    <span className="material-symbols-outlined input-icon">enhanced_encryption</span>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Ulangi password baru"
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn-save-warning" disabled={pwLoading}>
                                {pwLoading ? <div className="spinner" /> : (
                                    <>
                                        <span className="material-symbols-outlined">shield_lock</span>
                                        Perbarui Password
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Avatar Selection Modal */}
            {isAvatarModalOpen && (
                <div className="modal-overlay" onClick={() => !avatarLoading && setIsAvatarModalOpen(false)}>
                    <div className="modal-content avatar-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Pilih Foto Profil</h3>
                            <button className="btn-close-icon" onClick={() => setIsAvatarModalOpen(false)} disabled={avatarLoading}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="avatar-modal-desc">Pilih avatar yang tersedia atau unggah foto Anda sendiri.</p>

                            <div className="avatar-presets-grid">
                                {PRESET_AVATARS.map((url, i) => (
                                    <div
                                        key={i}
                                        className={`avatar-preset-item ${user?.avatar_url === url ? 'selected' : ''}`}
                                        onClick={() => !avatarLoading && handleAvatarSelect(url)}
                                    >
                                        <img src={url} alt={`Avatar ${i + 1}`} />
                                    </div>
                                ))}
                            </div>

                            <div className="avatar-upload-divider"><span>ATAU</span></div>

                            <div className="avatar-upload-section">
                                <input
                                    type="file"
                                    id="avatar-upload"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    disabled={avatarLoading}
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="avatar-upload" className="btn-outline upload-btn">
                                    {avatarLoading ? <div className="spinner small" /> : <span className="material-symbols-outlined">upload</span>}
                                    {avatarLoading ? 'Mengunggah...' : 'Unggah Foto Sendiri'}
                                </label>
                                <span className="upload-hint">Format: JPG, PNG, WEBP. Maks: 2MB</span>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </>
    );
}
