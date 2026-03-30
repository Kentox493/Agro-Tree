import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Chatbot from './Chatbot';
import WeatherWidget from './WeatherWidget';

const navItems = [
    { to: '/app', icon: 'dashboard', label: 'Dashboard' },
    { to: '/app/predict', icon: 'online_prediction', label: 'Prediksi' },
    { to: '/app/history', icon: 'history', label: 'Riwayat' },
    { to: '/app/analytics', icon: 'analytics', label: 'Analitik' },
    { to: '/app/plants', icon: 'menu_book', label: 'Ensiklopedia' },
    { to: '/app/profile', icon: 'person', label: 'Profil' },
];

const pageTitles = {
    '/app': 'Dashboard',
    '/app/predict': 'Mulai Prediksi',
    '/app/history': 'Riwayat Analisis',
    '/app/analytics': 'Statistik & Analitik',
    '/app/plants': 'Ensiklopedia Tanaman',
    '/app/profile': 'Profil Pengguna',
};

export default function Layout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Prevent collapsed mode on mobile screens
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setSidebarCollapsed(false);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // trigger on mount
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const pageTitle = pageTitles[location.pathname] || 'Dashboard';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    {!sidebarCollapsed ? (
                        <img src="/assets/logo_wide.png" alt="AgroTree" className="sidebar-logo-wide" />
                    ) : (
                        <img src="/assets/logo.png" alt="AgroTree" className="sidebar-logo-img" />
                    )}
                    <button
                        className="btn-collapse"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        title={sidebarCollapsed ? "Perbesar Menu" : "Kecilkan Menu"}
                    >
                        <span className="material-symbols-outlined">
                            {sidebarCollapsed ? 'menu_open' : 'keyboard_double_arrow_left'}
                        </span>
                    </button>
                </div>
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to} to={item.to} end={item.to === '/app'}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                            title={sidebarCollapsed ? item.label : undefined}
                        >
                            <span className="material-symbols-outlined">{item.icon}</span>
                            {!sidebarCollapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}

                    <WeatherWidget collapsed={sidebarCollapsed} />
                </nav>
                <div className="sidebar-footer">
                    <button className="btn-logout" onClick={handleLogout} title={sidebarCollapsed ? "Keluar" : undefined}>
                        <span className="material-symbols-outlined">logout</span>
                        {!sidebarCollapsed && <span>Keluar</span>}
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <header className="main-header">
                    <div className="header-left">
                        <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <span /><span /><span />
                        </button>
                        <h1>{pageTitle}</h1>
                    </div>
                    <div className="user-info" onClick={() => navigate('/app/profile')} style={{ cursor: 'pointer' }}>
                        <div className="user-avatar">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            ) : (
                                user?.name?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>
                        <span>{user?.name || 'User'}</span>
                    </div>
                </header>
                <div className="page-container">
                    <Outlet />
                </div>
            </main>

            <Chatbot />
        </div>
    );
}
