import React, { useState, useEffect } from 'react';
import { Camera, Receipt } from 'lucide-react';
import Kegiatan from './Kegiatan';
import Bon from './Bon';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('kegiatan');
  const [isTabSwitching, setIsTabSwitching] = useState(false);

  useEffect(() => {
    // Memuat Font Poppins
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
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
        <span>GKPI IMMANUEL</span> DOKUMENTASI & KEUANGAN PEMUDA
      </footer>
    </div>
  );
}