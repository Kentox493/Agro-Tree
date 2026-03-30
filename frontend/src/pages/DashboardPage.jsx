import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        api.getStats().then(setStats).catch(() => { });
    }, []);

    const recentColors = [
        { bg: 'var(--primary-surface)', iconColor: 'var(--primary)' },
        { bg: '#fffbeb', iconColor: '#d97706' },
        { bg: '#fef2f2', iconColor: '#dc2626' },
    ];

    return (
        <>
            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-icon green material-symbols-outlined">assessment</span>
                    </div>
                    <p className="stat-label">Total Prediksi</p>
                    <h3 className="stat-value">{stats?.total_predictions || 0}</h3>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-icon green material-symbols-outlined">trending_up</span>
                    </div>
                    <p className="stat-label">Tanaman Terpopuler</p>
                    <h3 className="stat-value">{stats?.most_predicted || '-'}</h3>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-icon green material-symbols-outlined">eco</span>
                    </div>
                    <p className="stat-label">Jenis Tanaman</p>
                    <h3 className="stat-value">{stats?.distribution ? Object.keys(stats.distribution).length : 0}</h3>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-icon green material-symbols-outlined">verified_user</span>
                    </div>
                    <p className="stat-label">Akurasi Model</p>
                    <h3 className="stat-value">99%</h3>
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid-2">
                {/* Mulai Prediksi Baru */}
                <div className="card dashboard-predict-card">
                    <h3 className="card-title-lg">Mulai Prediksi Baru</h3>
                    <p className="card-desc">
                        Analisis kondisi tanah, cuaca, dan lokasi Anda untuk mendapatkan rekomendasi tanaman yang paling optimal untuk musim tanam ini.
                    </p>
                    <div className="landscape-img">
                        <img src="/assets/landscape.jpg" alt="Sawah Indonesia" />
                        <div className="landscape-overlay">
                            <span className="landscape-location">
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>
                                Indonesia
                            </span>
                        </div>
                    </div>
                    <button className="btn-predict-full" onClick={() => navigate('/predict')}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_chart</span>
                        Prediksi Sekarang
                    </button>
                </div>

                {/* Prediksi Terakhir */}
                <div className="card prediction-history-card">
                    <div className="card-header-bar">
                        <h3 className="card-title-lg">Prediksi Terakhir</h3>
                        <a className="link-primary" onClick={() => navigate('/history')} style={{ cursor: 'pointer' }}>Lihat Semua</a>
                    </div>
                    <div className="prediction-entries">
                        {stats?.recent_predictions?.length ? (
                            stats.recent_predictions.slice(0, 3).map((p, i) => (
                                <div key={p.id} className="prediction-entry">
                                    <div className="prediction-entry-left">
                                        <div className="prediction-entry-icon" style={{ background: recentColors[i % 3].bg }}>
                                            <span className="material-symbols-outlined" style={{ color: recentColors[i % 3].iconColor }}>psychology</span>
                                        </div>
                                        <div>
                                            <h4 className="prediction-entry-name">{p.result}</h4>
                                            <p className="prediction-entry-date">
                                                {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="prediction-entry-right">
                                        <span className="prediction-confidence-value">{(p.confidence * 100).toFixed(1)}%</span>
                                        <span className="prediction-confidence-label">Confidence</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="prediction-entry" style={{ justifyContent: 'center', padding: 32 }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>Belum ada prediksi. Mulai prediksi pertama Anda!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="dashboard-footer">
                <p>&copy; 2026 AgroTree Indonesia. Smart Agriculture Solutions.</p>
            </div>
        </>
    );
}
