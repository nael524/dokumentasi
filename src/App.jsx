import React, { useState, useEffect } from 'react';
import { Camera, Receipt, Sparkles, ShieldCheck } from 'lucide-react';
import Kegiatan from './Kegiatan';
import Bon from './Bon';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('kegiatan');
  const [isLoading, setIsLoading] = useState(true);
  const [isTabSwitching, setIsTabSwitching] = useState(false);

  useEffect(() => {
    // Memuat Font Poppins
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Simulasi SplashScreen/Loader Aplikasi
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      clearTimeout(timer);
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setIsTabSwitching(true);
    setActiveTab(tab);
    setTimeout(() => {
      setIsTabSwitching(false);
    }, 250);
  };

  // 1. Tampilan Splash Loader Awal (Tanpa Persentase)
  if (isLoading) {
    return (
      <div className="app-loader-splash">
        <div className="loader-card">
          <div className="loader-logo-ring">
            <div className="loader-inner-circle">
              <ShieldCheck size={38} color="#0284c7" />
            </div>
            <div className="loader-orbit-dot" />
          </div>

          <div className="loader-text-group">
            <span className="loader-badge">
              <Sparkles size={12} /> GKPI IMMANUEL
            </span>
            <h2 className="loader-title">PEMUDA PEMUDI</h2>
            <p className="loader-sub">Sistem Dokumentasi & Keuangan</p>
          </div>

          <div className="loader-bars-wave">
            <div className="bar bar-1" />
            <div className="bar bar-2" />
            <div className="bar bar-3" />
            <div className="bar bar-4" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Tampilan Utama Aplikasi
  return (
    <div className="app-container">
      {/* Navigasi Tab Switcher */}
      <header className="app-header-nav">
        <nav className="app-nav">
          <button
            onClick={() => handleTabChange('kegiatan')}
            className={`tab-btn ${activeTab === 'kegiatan' ? 'tab-btn-kegiatan-active' : 'tab-btn-inactive'}`}
          >
            <Camera size={16} />
            <span>Foto Kegiatan</span>
          </button>

          <button
            onClick={() => handleTabChange('bon')}
            className={`tab-btn ${activeTab === 'bon' ? 'tab-btn-bon-active' : 'tab-btn-inactive'}`}
          >
            <Receipt size={16} />
            <span>Foto Bon</span>
          </button>
        </nav>
      </header>

      {/* Konten Utama Berdasarkan Tab Aktif */}
      <main className={`app-content ${isTabSwitching ? 'content-fade-out' : 'content-fade-in'}`}>
        {activeTab === 'kegiatan' ? <Kegiatan /> : <Bon />}
      </main>

      {/* Footer Aplikasi */}
      <footer className="app-footer">
        <span>GKPI IMMANUEL</span> • DOKUMENTASI & KEUANGAN PEMUDA
      </footer>
    </div>
  );
}