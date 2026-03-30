import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LuBean, LuCarrot, LuApple, LuBanana, LuCitrus, LuCoffee, LuWheat, LuNut, LuCherry, LuSprout, LuLeaf } from "react-icons/lu";

const getPlantIcon = (name, boxSize = 28) => {
    const lName = name?.toLowerCase() || '';
    if (lName.includes('bean') || lName.includes('kacang') || lName.includes('lentil') || lName.includes('peas')) return <LuBean size={boxSize} strokeWidth={1.5} color="var(--primary-dark)" />;
    if (lName.includes('carrot') || lName.includes('wortel')) return <LuCarrot size={boxSize} strokeWidth={1.5} color="var(--primary-dark)" />;
    if (lName.includes('coffee') || lName.includes('kopi')) return <LuCoffee size={boxSize} strokeWidth={1.5} color="var(--primary-dark)" />;
    if (lName.includes('apple') || lName.includes('apel') || lName.includes('pomegranate') || lName.includes('delima')) return <LuApple size={boxSize} strokeWidth={1.5} color="var(--danger)" />;
    if (lName.includes('banana') || lName.includes('pisang')) return <LuBanana size={boxSize} strokeWidth={1.5} color="var(--warning)" />;
    if (lName.includes('orange') || lName.includes('jeruk') || lName.includes('citrus')) return <LuCitrus size={boxSize} strokeWidth={1.5} color="var(--warning)" />;
    if (lName.includes('rice') || lName.includes('padi') || lName.includes('maize') || lName.includes('jagung') || lName.includes('jute') || lName.includes('mothbeans')) return <LuWheat size={boxSize} strokeWidth={1.5} color="var(--warning)" />;
    if (lName.includes('melon') || lName.includes('watermelon') || lName.includes('papaya') || lName.includes('cotton') || lName.includes('kapas')) return <LuSprout size={boxSize} strokeWidth={1.5} color="var(--primary)" />;
    if (lName.includes('grape') || lName.includes('anggur')) return <LuCherry size={boxSize} strokeWidth={1.5} color="var(--primary)" />;
    if (lName.includes('mango') || lName.includes('mangga')) return <LuLeaf size={boxSize} strokeWidth={1.5} color="var(--warning)" />;
    if (lName.includes('coconut') || lName.includes('kelapa')) return <LuNut size={boxSize} strokeWidth={1.5} color="var(--primary-dark)" />;
    return <LuLeaf size={boxSize} strokeWidth={1.5} color="var(--primary)" />;
};

export default function PlantsPage() {
    const [plants, setPlants] = useState([]);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getPlants().then(setPlants).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const filtered = plants.filter(
        (p) => p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.name_id?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="loader-screen"><div className="spinner" /></div>;

    return (
        <div className="modern-encyclopedia-wrapper fade-in-up">
            {/* ─── HERO SECTION ─── */}
            <div className="encyclopedia-hero">
                <div className="hero-content">
                    <h1>Ensiklopedia Tanaman</h1>
                    <p>Temukan panduan lengkap dan kondisi ideal untuk berbagai jenis komoditas.</p>
                    <div className="hero-search-wrap">
                        <span className="material-symbols-outlined search-icon">search</span>
                        <input
                            className="hero-search-input"
                            placeholder="Cari nama atau famili tanaman..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* ─── GRID SECTION ─── */}
            <div className="encyclopedia-grid">
                {filtered.map((plant, i) => (
                    <div key={i} className="modern-plant-card" onClick={() => setSelected(plant)}>
                        <div className="card-top">
                            <div className="plant-icon-glass">
                                {getPlantIcon(plant.name, 32)}
                            </div>
                            <span className="season-badge">{plant.season}</span>
                        </div>
                        <div className="card-bottom">
                            <h3 className="plant-name-modern">{plant.name}</h3>
                            <p className="plant-name-id">{plant.name_id}</p>
                            <p className="plant-desc-short">{plant.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── EMPTY STATE ─── */}
            {filtered.length === 0 && (
                <div className="encyclopedia-empty fade-in-up">
                    <div className="empty-icon-wrapper">
                        <span className="material-symbols-outlined">psychiatry</span>
                    </div>
                    <h3>Tanaman Tidak Ditemukan</h3>
                    <p>Coba gunakan kata kunci pencarian yang berbeda.</p>
                </div>
            )}

            {/* ─── DETAIL MODAL ─── */}
            {selected && (
                <div className="modal-overlay" onClick={() => setSelected(null)}>
                    <div className="modern-modal-content fade-in-up" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-modern" onClick={() => setSelected(null)}>
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <div className="modal-header-modern">
                            <div className="modal-icon-glass large">
                                {getPlantIcon(selected.name, 48)}
                            </div>
                            <div className="modal-title-wrap">
                                <h2>{selected.name}</h2>
                                <p className="latin-name">{selected.name_id}</p>
                            </div>
                        </div>

                        <div className="modal-body-scroll">
                            <div className="modal-section">
                                <h3>Deskripsi</h3>
                                <p className="desc-text">{selected.description}</p>
                            </div>

                            <div className="modal-section">
                                <h3>Musim Tanam Ideal</h3>
                                <div className="season-pill">
                                    <span className="material-symbols-outlined">calendar_month</span>
                                    {selected.season}
                                </div>
                            </div>

                            <div className="modal-section">
                                <h3>Kondisi Pertumbuhan Ideal</h3>
                                <div className="metric-grid">
                                    <div className="metric-card">
                                        <div className="metric-icon bg-green-light">
                                            <span className="material-symbols-outlined text-green">water_drop</span>
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-label">Nitrogen (N)</span>
                                            <span className="metric-value">{selected.ideal_n}</span>
                                        </div>
                                    </div>
                                    <div className="metric-card">
                                        <div className="metric-icon bg-green-light">
                                            <span className="material-symbols-outlined text-green">science</span>
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-label">Fosfor (P)</span>
                                            <span className="metric-value">{selected.ideal_p}</span>
                                        </div>
                                    </div>
                                    <div className="metric-card">
                                        <div className="metric-icon bg-green-light">
                                            <span className="material-symbols-outlined text-green">landscape</span>
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-label">Kalium (K)</span>
                                            <span className="metric-value">{selected.ideal_k}</span>
                                        </div>
                                    </div>
                                    <div className="metric-card">
                                        <div className="metric-icon bg-warning-light">
                                            <span className="material-symbols-outlined text-warning">thermostat</span>
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-label">Suhu Ideal</span>
                                            <span className="metric-value">{selected.ideal_temp}</span>
                                        </div>
                                    </div>
                                    <div className="metric-card">
                                        <div className="metric-icon bg-blue-light">
                                            <span className="material-symbols-outlined text-blue">blur_on</span>
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-label">Kelembaban</span>
                                            <span className="metric-value">{selected.ideal_humidity}</span>
                                        </div>
                                    </div>
                                    <div className="metric-card">
                                        <div className="metric-icon bg-blue-light">
                                            <span className="material-symbols-outlined text-blue">science</span>
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-label">pH Tanah</span>
                                            <span className="metric-value">{selected.ideal_ph}</span>
                                        </div>
                                    </div>
                                    <div className="metric-card">
                                        <div className="metric-icon bg-blue-light">
                                            <span className="material-symbols-outlined text-blue">rainy</span>
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-label">Curah Hujan</span>
                                            <span className="metric-value">{selected.ideal_rainfall}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {selected.tips?.length > 0 && (
                                <div className="modal-section" style={{ borderBottom: 'none' }}>
                                    <h3>Tips Perawatan</h3>
                                    <ul className="modern-tips-list">
                                        {selected.tips.map((t, i) => (
                                            <li key={i}>
                                                <span className="material-symbols-outlined check-icon">check_circle</span>
                                                <span className="tip-text">{t}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
