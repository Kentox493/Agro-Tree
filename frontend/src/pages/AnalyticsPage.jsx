import { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { api } from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const COLORS = [
    '#16a34a', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444',
    '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
    '#84cc16', '#a855f7', '#22d3ee', '#fb923c', '#e879f9',
    '#34d399', '#38bdf8', '#c084fc', '#fbbf24', '#f87171',
    '#60a5fa', '#f472b6',
];

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: '#64748b', font: { family: 'Inter', size: 12 } } },
    },
};

const barOptions = {
    ...chartOptions,
    indexAxis: 'y',
    scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: '#f1f5f9' } },
        y: { ticks: { color: '#64748b', font: { size: 12 } }, grid: { display: false } },
    },
};

export default function AnalyticsPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getStats().then(setStats).catch(() => { }).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loader-screen"><div className="spinner" /></div>;

    if (!stats || !stats.total_predictions) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">
                    <span className="material-symbols-outlined">analytics</span>
                </div>
                <h3>Belum Ada Data</h3>
                <p>Lakukan beberapa prediksi terlebih dahulu untuk melihat grafik analitik.</p>
            </div>
        );
    }

    const labels = Object.keys(stats.distribution || {});
    const values = Object.values(stats.distribution || {});

    const doughnutData = {
        labels,
        datasets: [{
            data: values,
            backgroundColor: COLORS.slice(0, labels.length),
            borderColor: '#ffffff',
            borderWidth: 2,
        }],
    };

    const barData = {
        labels,
        datasets: [{
            label: 'Jumlah Prediksi',
            data: values,
            backgroundColor: COLORS.slice(0, labels.length).map(c => c + '33'),
            borderColor: COLORS.slice(0, labels.length),
            borderWidth: 1,
            borderRadius: 4,
        }],
    };

    return (
        <>
            <div className="stats-grid" style={{ marginBottom: 28 }}>
                <div className="stat-card">
                    <div className="stat-icon green" style={{ marginBottom: 8 }}>
                        <span className="material-symbols-outlined">bar_chart</span>
                    </div>
                    <div className="stat-label">Total Prediksi</div>
                    <div className="stat-value">{stats.total_predictions}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue" style={{ marginBottom: 8 }}>
                        <span className="material-symbols-outlined">emoji_events</span>
                    </div>
                    <div className="stat-label">Paling Sering</div>
                    <div className="stat-value" style={{ fontSize: 18 }}>{stats.most_predicted || '-'}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple" style={{ marginBottom: 8 }}>
                        <span className="material-symbols-outlined">eco</span>
                    </div>
                    <div className="stat-label">Variasi Tanaman</div>
                    <div className="stat-value">{labels.length}</div>
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <div className="card-title">
                        <span className="material-symbols-outlined">donut_large</span>
                        Distribusi Tanaman
                    </div>
                    <div className="chart-container">
                        <Doughnut data={doughnutData} options={chartOptions} />
                    </div>
                </div>
                <div className="card">
                    <div className="card-title">
                        <span className="material-symbols-outlined">bar_chart</span>
                        Frekuensi Prediksi
                    </div>
                    <div className="chart-container">
                        <Bar data={barData} options={barOptions} />
                    </div>
                </div>
            </div>
        </>
    );
}
