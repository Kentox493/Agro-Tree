import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function LandingPage() {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', handleScroll);

        // Setup Intersection Observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    observer.unobserve(entry.target); // Animate only once
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

        // Target all reveal elements
        const revealElements = document.querySelectorAll('.reveal-up');
        revealElements.forEach(el => observer.observe(el));

        return () => {
            window.removeEventListener('scroll', handleScroll);
            observer.disconnect();
        };
    }, []);

    const scrollToFeatures = () => {
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="lp-root">

            {/* ─── Navbar ─── */}
            <nav className={`lp-nav ${scrolled ? 'lp-nav--scrolled' : ''}`}>
                <div className="lp-container lp-nav__inner">
                    <Link to="/" className="lp-logo">
                        <img src="/assets/logo.png" alt="AgroTree" className="lp-logo__icon" />
                        <span className="lp-logo__text">AgroTree</span>
                    </Link>

                    <div className="lp-nav__links">
                        <a href="#features" className="lp-nav__link">Fitur</a>
                        <a href="#how-it-works" className="lp-nav__link">Cara Kerja</a>
                    </div>

                    <div className="lp-nav__actions">
                        <Link to="/login" className="lp-btn lp-btn--ghost">Masuk</Link>
                        <Link to="/register" className="lp-btn lp-btn--primary">Mulai Gratis</Link>
                    </div>

                    <button className="lp-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        <span /><span /><span />
                    </button>
                </div>
                {mobileMenuOpen && (
                    <div className="lp-mobile-menu">
                        <a href="#features" onClick={() => setMobileMenuOpen(false)}>Fitur</a>
                        <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>Cara Kerja</a>
                        <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Masuk</Link>
                        <Link to="/register" className="lp-btn lp-btn--primary" onClick={() => setMobileMenuOpen(false)}>Mulai Gratis</Link>
                    </div>
                )}
            </nav>

            {/* ─── Hero (Obvious AI Style) ─── */}
            <section className="lp-hero">
                <div className="lp-container lp-hero__inner">
                    <div className="lp-hero__content lp-hero__content--center">
                        <div className="lp-badge">
                            <span>✨</span> Dipercaya oleh 10,000+ Petani Modern
                        </div>
                        <h1 className="lp-hero__title">
                            Rekomendasi Tanaman Terbaik.<br />
                            <span className="lp-highlight">Panen Lebih Menguntungkan.</span>
                        </h1>
                        <p className="lp-hero__subtitle">
                            AgroTree menganalisis data tanah dan iklim lahan Anda menggunakan algoritma AI cerdas, memberikan rekomendasi komoditas paling optimal dalam hitungan detik.
                        </p>
                        <div className="lp-hero__cta">
                            <button className="lp-btn lp-btn--primary lp-btn--lg" onClick={() => navigate('/register')}>
                                Mulai Prediksi Sekarang
                            </button>
                            <button className="lp-btn lp-btn--outline lp-btn--lg" onClick={scrollToFeatures}>
                                Pelajari Cara Kerjanya
                            </button>
                        </div>
                    </div>

                    {/* Centered Large Dashboard Mockup */}
                    <div className="lp-hero__visual lp-hero__visual--centered">
                        <div className="lp-mockup-wrapper">
                            <img src="/assets/dashboard_hero.png" alt="AgroTree Dashboard" className="lp-dashboard-img" />

                            {/* Floating accent cards (Obvious AI style) */}
                            <div className="lp-float-card lp-float-card--left">
                                <span className="material-symbols-outlined lp-float-icon">psychology</span>
                                <div>
                                    <strong>AI Decision Tree</strong>
                                    <span>Akurasi 94.2%</span>
                                </div>
                            </div>
                            <div className="lp-float-card lp-float-card--right">
                                <span className="material-symbols-outlined lp-float-icon">eco</span>
                                <div>
                                    <strong>20+ Komoditas</strong>
                                    <span>Pustaka Lengkap</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Background Floating Agro Icons */}
                <div className="lp-bg-icons" aria-hidden="true">
                    <span className="material-symbols-outlined lp-bg-icon lp-bg-icon--1">eco</span>
                    <span className="material-symbols-outlined lp-bg-icon lp-bg-icon--2">water_drop</span>
                    <span className="material-symbols-outlined lp-bg-icon lp-bg-icon--3">psychology</span>
                    <span className="material-symbols-outlined lp-bg-icon lp-bg-icon--4">energy_savings_leaf</span>
                    <span className="material-symbols-outlined lp-bg-icon lp-bg-icon--5">compost</span>
                    <span className="material-symbols-outlined lp-bg-icon lp-bg-icon--6">local_florist</span>
                    <span className="material-symbols-outlined lp-bg-icon lp-bg-icon--7">spa</span>
                    <span className="material-symbols-outlined lp-bg-icon lp-bg-icon--8">grass</span>
                    <span className="material-symbols-outlined lp-bg-icon lp-bg-icon--9">park</span>
                    <span className="material-symbols-outlined lp-bg-icon lp-bg-icon--10">potted_plant</span>
                    <span className="material-symbols-outlined lp-bg-icon lp-bg-icon--11">agriculture</span>
                    <span className="material-symbols-outlined lp-bg-icon lp-bg-icon--12">forest</span>
                    <span className="material-symbols-outlined lp-bg-icon lp-bg-icon--13">nature</span>
                    <span className="material-symbols-outlined lp-bg-icon lp-bg-icon--14">filter_vintage</span>
                    <span className="material-symbols-outlined lp-bg-icon lp-bg-icon--15">yard</span>
                </div>

                {/* background blob */}
                <div className="lp-hero__blob" />
            </section>

            {/* ─── Premium Deep-Dive Showcases (Intercom Inspired) ─── */}
            <section id="features" className="lp-showcases">
                <div className="lp-container">
                    <div className="lp-section-header">
                        <p className="lp-section-tag">Fitur Unggulan</p>
                        <h2>Semua yang Anda Butuhkan untuk Bertani Lebih Cerdas</h2>
                        <p className="lp-section-sub">Teknologi mutakhir yang dirancang khusus untuk petani dan peneliti pertanian modern.</p>
                    </div>

                    <div className="lp-showcase-grid">

                        {/* Showcase 1: Decision Tree Prediction */}
                        <div className="lp-showcase-card lp-showcase-card--primary reveal-up">
                            <div className="lp-showcase-card__content">
                                <span className="lp-showcase-badge">AI Decision Tree</span>
                                <h3>Prediksi Rekomendasi Cerdas</h3>
                                <p>Cukup input data Nitrogen, Fosfor, Kalium (NPK), suhu, dan kelembaban. Algoritma kami akan memprosesnya dalam milidetik dan menyajikan 5 alternatif tanaman paling menguntungkan.</p>
                                <Link to="/register" className="lp-btn lp-btn--outline lp-btn--sm">Coba Parameter Lahan Anda</Link>
                            </div>
                            <div className="lp-showcase-card__visual">
                                {/* The screenshot image sits at the bottom edge */}
                                <img src="/assets/showcase-predict.png" alt="Prediction Dashboard Interface" className="lp-showcase-img" />
                            </div>
                        </div>

                        {/* Showcase 2: AI Chatbot Assistant */}
                        <div className="lp-showcase-card lp-showcase-card--secondary reveal-up reveal-delay-100">
                            <div className="lp-showcase-card__content">
                                <span className="lp-showcase-badge">Asisten AI 24/7</span>
                                <h3>Konsultasi Pertanian Otomatis</h3>
                                <p>Tanaman Anda terserang hama? Chatbot pintar kami dilatih khusus dengan referensi pertanian Indonesia untuk menjawab semua keluhan dan prosedur penanaman Anda.</p>
                                <Link to="/register" className="lp-btn lp-btn--outline lp-btn--sm">Tanya Asisten AI</Link>
                            </div>
                            <div className="lp-showcase-card__visual">
                                <img src="/assets/showcase-chat.png" alt="AI Chatbot Interface" className="lp-showcase-img" />
                            </div>
                        </div>

                        {/* Showcase 3: Visual Interactive Encyclopedia */}
                        <div className="lp-showcase-card lp-showcase-card--tertiary reveal-up reveal-delay-200">
                            <div className="lp-showcase-card__content">
                                <span className="lp-showcase-badge">Ensiklopedia</span>
                                <h3>Perpustakaan Botani Digital</h3>
                                <p>Akses 20+ profil komoditas pangan. Dapatkan takaran pH, suhu ideal, dan curah hujan sempurna secara instan dalam kartu visual yang elegan.</p>
                                <Link to="/register" className="lp-btn lp-btn--outline lp-btn--sm">Eksplorasi Katalog</Link>
                            </div>
                            <div className="lp-showcase-card__visual">
                                <img src="/assets/showcase-plants.png" alt="Encyclopedia Plants Interface" className="lp-showcase-img" />
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ─── How it Works ─── */}
            <section id="how-it-works" className="lp-steps">
                <div className="lp-container">
                    <div className="lp-section-header">
                        <p className="lp-section-tag">Cara Kerja</p>
                        <h2>Mulai Prediksi dalam 3 Langkah Mudah</h2>
                    </div>

                    <div className="lp-steps__row reveal-up">
                        <div className="lp-step">
                            <div className="lp-step__num">1</div>
                            <div className="lp-step__icon">
                                <span className="material-symbols-outlined">edit_note</span>
                            </div>
                            <h4>Input Data Lahan</h4>
                            <p>Masukkan data kadar Nitrogen, Fosfor, Kalium, pH tanah, suhu, dan curah hujan dari lahan Anda.</p>
                        </div>
                        <div className="lp-step__connector">
                            <div className="lp-step__line" />
                            <span className="material-symbols-outlined lp-step__arrow">arrow_forward</span>
                        </div>
                        <div className="lp-step">
                            <div className="lp-step__num">2</div>
                            <div className="lp-step__icon">
                                <span className="material-symbols-outlined">psychology</span>
                            </div>
                            <h4>Proses AI</h4>
                            <p>AgroTree menganalisis data menggunakan model Machine Learning Decision Tree yang telah dilatih dengan ribuan dataset pertanian.</p>
                        </div>
                        <div className="lp-step__connector">
                            <div className="lp-step__line" />
                            <span className="material-symbols-outlined lp-step__arrow">arrow_forward</span>
                        </div>
                        <div className="lp-step">
                            <div className="lp-step__num">3</div>
                            <div className="lp-step__icon">
                                <span className="material-symbols-outlined">eco</span>
                            </div>
                            <h4>Panen Optimal</h4>
                            <p>Dapatkan rekomendasi tanaman terbaik beserta panduan perawatan untuk memaksimalkan hasil panen Anda.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Bottom CTA ─── */}
            <section className="lp-cta reveal-up">
                <div className="lp-container">
                    <div className="lp-cta__box">
                        <div className="lp-cta__content">
                            <h2>Mulai Perjalanan Pertanian Cerdas Anda Hari Ini!</h2>
                            <p>Bergabung gratis dan dapatkan 10 kuota prediksi pertama tanpa biaya apapun.</p>
                            <button className="lp-btn lp-btn--white lp-btn--lg" onClick={() => navigate('/register')}>
                                Buat Akun Gratis Sekarang
                            </button>
                        </div>
                        <div className="lp-cta__decor" aria-hidden="true">
                            <span className="material-symbols-outlined">eco</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer className="lp-footer">
                <div className="lp-container lp-footer__inner">
                    <div className="lp-footer__brand">
                        <img src="/assets/logo.png" alt="AgroTree" className="lp-footer__logo-icon" />
                        <p>Solusi pertanian cerdas berbasis kecerdasan buatan untuk petani modern Indonesia.</p>
                    </div>
                    <div className="lp-footer__links">
                        <div>
                            <h5>Produk</h5>
                            <a href="#features">Fitur</a>
                            <a href="#how-it-works">Cara Kerja</a>
                            <Link to="/register">Daftar Gratis</Link>
                        </div>
                        <div>
                            <h5>Akun</h5>
                            <Link to="/login">Masuk</Link>
                            <Link to="/register">Daftar</Link>
                        </div>
                    </div>
                </div>
                <div className="lp-footer__bottom">
                    <p>© 2026 AgroTree. Semua hak dilindungi undang-undang.</p>
                </div>
            </footer>
        </div>
    );
}
