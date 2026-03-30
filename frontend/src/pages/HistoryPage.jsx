import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../services/api';

export default function HistoryPage() {
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.getHistory().then(setPredictions).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const handleDelete = (id) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '250px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>warning</span>
                    <strong style={{ fontSize: '15px' }}>Hapus Riwayat?</strong>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Tindakan ini tidak dapat dibatalkan.
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        style={{ padding: '6px 14px', fontSize: '12.5px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}
                    >
                        Batal
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await api.deletePrediction(id);
                                setPredictions(prev => prev.filter(p => p.id !== id));
                                toast.success("Data berhasil dihapus");
                            } catch (err) {
                                toast.error(err.message || 'Waduh, data gagal dihapus! Sepertinya dia nyangkut 🧹');
                            }
                        }}
                        style={{ background: '#f87171', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
                    >
                        Ya, Hapus
                    </button>
                </div>
            </div>
        ), { duration: Infinity, style: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' } });
    };

    if (loading) return <div className="loader-screen"><div className="spinner" /></div>;

    if (!predictions.length) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">
                    <span className="material-symbols-outlined">assignment</span>
                </div>
                <h3>Belum Ada Riwayat</h3>
                <p>Lakukan prediksi pertama Anda untuk melihat riwayat di sini.</p>
                <button className="btn btn-primary" onClick={() => navigate('/app/predict')} style={{ marginTop: '16px' }}>
                    <span className="material-symbols-outlined">add</span> Buat Prediksi Baru
                </button>
            </div>
        );
    }

    return (
        <>
            {/* Desktop Table */}
            <div className="card history-desktop-only" style={{ padding: 0 }}>
                <div className="section-header" style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="card-title" style={{ margin: 0 }}>
                            <span className="material-symbols-outlined">history</span>
                            Riwayat Prediksi
                        </div>
                        <div style={{ background: '#ecfdf5', color: '#10b981', padding: '2px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, border: '1px solid #a7f3d0' }}>
                            {predictions.length} Data
                        </div>
                    </div>
                    <Link to="/app/predict" className="btn-text" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                        Tambah Prediksi
                    </Link>
                </div>
                <div className="history-table-wrapper" style={{ padding: '16px 24px 24px' }}>
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Hasil</th>
                                <th>Kepercayaan</th>
                                <th>N</th>
                                <th>P</th>
                                <th>K</th>
                                <th>Suhu</th>
                                <th>pH</th>
                                <th>Hujan</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {predictions.map((p) => (
                                <tr key={p.id}>
                                    <td>{new Date(p.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                    <td><span className="result-badge">{p.result}</span></td>
                                    <td>
                                        <div className="confidence-bar">
                                            <div className="confidence-bar-fill" style={{ width: `${p.confidence * 100}%` }} />
                                        </div>
                                        {(p.confidence * 100).toFixed(0)}%
                                    </td>
                                    <td>{p.n?.toFixed(0)}</td>
                                    <td>{p.p?.toFixed(0)}</td>
                                    <td>{p.k?.toFixed(0)}</td>
                                    <td>{p.temperature?.toFixed(1)}°C</td>
                                    <td>{p.ph?.toFixed(1)}</td>
                                    <td>{p.rainfall?.toFixed(0)}mm</td>
                                    <td>
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', display: 'flex' }}
                                            title="Hapus"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="history-mobile-only">
                <div className="section-header" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="card-title" style={{ margin: 0 }}>
                            <span className="material-symbols-outlined">history</span>
                            Riwayat
                        </div>
                        <div style={{ background: '#ecfdf5', color: '#10b981', padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: '1px solid #a7f3d0' }}>
                            {predictions.length} Data
                        </div>
                    </div>
                    <Link to="/app/predict" className="btn-text" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span> Baru
                    </Link>
                </div>
                <div className="history-cards">
                    {predictions.map((p) => (
                        <div key={p.id} className="history-card">
                            <div className="history-card-top">
                                <div className="history-card-result">
                                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 20 }}>eco</span>
                                    <span className="result-badge">{p.result}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="history-card-date">
                                        {new Date(p.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(p.id)}
                                        style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', padding: 0 }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                    </button>
                                </div>
                            </div>
                            <div className="history-card-confidence">
                                <div className="confidence-bar" style={{ flex: 1 }}>
                                    <div className="confidence-bar-fill" style={{ width: `${p.confidence * 100}%` }} />
                                </div>
                                <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13 }}>{(p.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <div className="history-card-params">
                                <div className="param"><span className="param-label">N</span><span className="param-value">{p.n?.toFixed(0)}</span></div>
                                <div className="param"><span className="param-label">P</span><span className="param-value">{p.p?.toFixed(0)}</span></div>
                                <div className="param"><span className="param-label">K</span><span className="param-value">{p.k?.toFixed(0)}</span></div>
                                <div className="param"><span className="param-label">Suhu</span><span className="param-value">{p.temperature?.toFixed(1)}°</span></div>
                                <div className="param"><span className="param-label">pH</span><span className="param-value">{p.ph?.toFixed(1)}</span></div>
                                <div className="param"><span className="param-label">Hujan</span><span className="param-value">{p.rainfall?.toFixed(0)}</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
