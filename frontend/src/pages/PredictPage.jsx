import { useState } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
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

const defaultForm = { n: '', p: '', k: '', temperature: '', humidity: '', ph: '', rainfall: '' };

const fields = [
    { key: 'n', label: 'Nitrogen (N)', unit: 'mg/kg', placeholder: '0 - 200 (Contoh: 90)' },
    { key: 'p', label: 'Fosfor (P)', unit: 'mg/kg', placeholder: '0 - 200 (Contoh: 42)' },
    { key: 'k', label: 'Kalium (K)', unit: 'mg/kg', placeholder: '0 - 200 (Contoh: 43)' },
    { key: 'temperature', label: 'Suhu (°C)', unit: '°C', placeholder: '5 - 50 (Contoh: 20.8)' },
    { key: 'humidity', label: 'Kelembaban (%)', unit: '%', placeholder: '10 - 100 (Contoh: 82)' },
    { key: 'ph', label: 'pH Tanah', unit: 'pH', placeholder: '3.5 - 10.0 (Contoh: 6.5)' },
    { key: 'rainfall', label: 'Curah Hujan (mm)', unit: 'mm', placeholder: '0 - 3000 (Contoh: 202.9)', fullWidth: true },
];

export default function PredictPage() {
    const [form, setForm] = useState(defaultForm);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleChange = (key, value) => setForm((p) => ({ ...p, [key]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        try {
            const body = {};
            for (const key of Object.keys(form)) {
                body[key] = parseFloat(form[key]);
                if (isNaN(body[key])) throw new Error(`Nilai ${key} tidak valid`);
            }
            const data = await api.predict(body);
            setResult(data);
            toast.success('Prediksi berhasil!');
        } catch (err) {
            toast.error(err.message || 'Waduh, prediksi gagal diproses! Sepertinya ada angin puyuh di server kita 🌪️');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="predict-container">
            {/* Input Card */}
            <section className="predict-card">
                <div className="predict-card-header">
                    <span className="material-symbols-outlined">science</span>
                    <h3>Input Kondisi Tanah</h3>
                </div>
                <form className="predict-card-body" onSubmit={handleSubmit}>
                    <div className="predict-form-grid">
                        {fields.map((f) => (
                            <div key={f.key} className={`predict-field${f.fullWidth ? ' predict-field-full' : ''}`}>
                                <label>{f.label}</label>
                                <div className="predict-input-wrapper">
                                    <input
                                        type="number" step="any"
                                        placeholder={f.placeholder}
                                        value={form[f.key]}
                                        onChange={(e) => handleChange(f.key, e.target.value)}
                                        required
                                    />
                                    <span className="predict-input-unit">{f.unit}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="predict-submit-area">
                        <button type="submit" className="btn-predict-main" disabled={loading}>
                            {loading ? <div className="spinner" /> : <>
                                <span className="material-symbols-outlined">auto_awesome</span>
                                Analisis & Prediksi
                            </>}
                        </button>
                    </div>
                </form>
            </section>

            {/* Result */}
            {result && (
                <section className="predict-result-section" style={{ animationName: 'slideUp', animationDuration: '0.4s' }}>
                    <h3 className="result-section-title">Hasil Rekomendasi</h3>
                    <div className="result-main-card">
                        <div className="result-main-left" style={{ position: 'relative', overflow: 'hidden' }}>
                            {/* Watermark Icon */}
                            <div style={{
                                position: 'absolute',
                                right: '-10%',
                                bottom: '-20%',
                                opacity: 0.15,
                                transform: 'rotate(-15deg)',
                                pointerEvents: 'none'
                            }}>
                                {getPlantIcon(result.plant_info?.name || result.prediction?.result, 180)}
                            </div>

                            <div className="result-crop-row" style={{ position: 'relative', zIndex: 1 }}>
                                <h4 className="result-crop-name">{result.plant_info?.name || result.prediction?.result}</h4>
                                <span className="result-confidence-pill">
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified</span>
                                    {(result.prediction.confidence * 100).toFixed(1)}% Confidence
                                </span>
                            </div>
                            {result.plant_info?.description && (
                                <p className="result-desc" style={{ position: 'relative', zIndex: 1 }}>{result.plant_info.description}</p>
                            )}
                        </div>
                        {result.top_crops?.length > 0 && (
                            <div className="result-main-right">
                                <p className="result-top-title">Top 5 Rekomendasi</p>
                                <div className="result-top-badges">
                                    {result.top_crops.map((c, i) => (
                                        <div key={i} className="result-top-badge" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                            <span>{c.crop}</span>
                                            <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 500 }}>
                                                {(c.probability * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Tips Section */}
            <section className="predict-tips-grid">
                <div className="predict-tip-card">
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>info</span>
                    <h5>Tips Input</h5>
                    <p>Pastikan data yang Anda masukkan adalah hasil tes laboratorium tanah terbaru untuk akurasi maksimal.</p>
                </div>
                <div className="predict-tip-card">
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>calendar_today</span>
                    <h5>Waktu Tanam</h5>
                    <p>Perhatikan kalender musim lokal Anda untuk menyelaraskan dengan prediksi curah hujan AI.</p>
                </div>
                <div className="predict-tip-card">
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>psychology</span>
                    <h5>Model AI</h5>
                    <p>Kami menggunakan model machine learning terbaru yang dilatih khusus dengan data agrikultur tropis.</p>
                </div>
            </section>
        </div>
    );
}
