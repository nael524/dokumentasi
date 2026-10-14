import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Receipt, RefreshCw, X, Eye, Tag, Wallet, CreditCard } from 'lucide-react';
import { supabase } from './supabaseClient';
import './StorageBon.css';

export default function StorageBon({ isOpen, onClose, refreshTrigger }) {
    const [bonList, setBonList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBon, setSelectedBon] = useState(null);

    const fetchBon = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('foto_bon')
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;
            setBonList(data || []);
        } catch (err) {
            console.error('Gagal mengambil data bon:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchBon();
        }
    }, [isOpen, refreshTrigger]);

    if (!isOpen) return null;

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(angka || 0);
    };

    // Hitung Total Pengeluaran Seluruh Bon
    const totalPengeluaran = bonList.reduce((acc, item) => acc + (parseFloat(item.harga_pembelian) || 0), 0);

    return (
        <div className="sb-overlay" onClick={onClose}>
            <div className="sb-modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Header Modal */}
                <div className="sb-header">
                    <div className="sb-header-title-box">
                        <Receipt size={20} color="#f59e0b" />
                        <div>
                            <h3 className="sb-title">Arsip Bon & Kwitansi</h3>
                            <p className="sb-subtitle">Catatan Pengeluaran Panitia Natal</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="sb-btn-close">
                        <X size={20} />
                    </button>
                </div>

                {/* Ringkasan Total Pengeluaran (Kardus Ringkasan Atas) */}
                {!loading && bonList.length > 0 && (
                    <div className="sb-summary-card">
                        <div className="sb-summary-item">
                            <div className="sb-summary-icon">
                                <Wallet size={18} color="#d97706" />
                            </div>
                            <div>
                                <span className="sb-summary-label">Total Pengeluaran</span>
                                <h4 className="sb-summary-value">{formatRupiah(totalPengeluaran)}</h4>
                            </div>
                        </div>

                        <div className="sb-summary-divider" />

                        <div className="sb-summary-item">
                            <div className="sb-summary-icon">
                                <CreditCard size={18} color="#0284c7" />
                            </div>
                            <div>
                                <span className="sb-summary-label">Total Transaksi</span>
                                <h4 className="sb-summary-count">{bonList.length} Struk</h4>
                            </div>
                        </div>
                    </div>
                )}

                {/* Body Modal (Grid Foto Bon) */}
                <div className="sb-body">
                    {loading ? (
                        <div className="sb-loading">
                            <RefreshCw size={24} className="sb-spin" color="#f59e0b" />
                            <span>Memuat data bon...</span>
                        </div>
                    ) : bonList.length === 0 ? (
                        <div className="sb-empty">
                            Belum ada foto bukti bon tersimpan.
                        </div>
                    ) : (
                        <div className="sb-grid">
                            {bonList.map((item) => (
                                <div
                                    key={item.id}
                                    className="sb-card"
                                    onClick={() => setSelectedBon(item)}
                                >
                                    <div className="sb-card-img-wrapper">
                                        <img
                                            src={item.file_path}
                                            alt={item.jenis_pembelian}
                                            className="sb-card-img"
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Bon+Tidak+Tersedia'; }}
                                        />
                                        <span className="sb-card-badge">{item.hari}</span>
                                        <div className="sb-card-hover">
                                            <Eye size={18} /> Lihat Struk
                                        </div>
                                    </div>
                                    <div className="sb-card-body">
                                        <div className="sb-item-title">
                                            <Tag size={13} color="#f59e0b" />
                                            <span>{item.jenis_pembelian}</span>
                                        </div>
                                        <div className="sb-item-price">
                                            {formatRupiah(item.harga_pembelian)}
                                        </div>
                                        <div className="sb-meta-row">
                                            <span><Calendar size={12} /> {item.tanggal}</span>
                                            <span><Clock size={12} /> {item.jam}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Lightbox / Preview Full Size */}
                {selectedBon && (
                    <div className="sb-lightbox-overlay" onClick={() => setSelectedBon(null)}>
                        <div className="sb-lightbox-card" onClick={(e) => e.stopPropagation()}>
                            <button className="sb-lightbox-close" onClick={() => setSelectedBon(null)}>
                                <X size={20} />
                            </button>
                            <img src={selectedBon.file_path} alt="Struk Detail" className="sb-lightbox-img" />
                            <div className="sb-lightbox-info">
                                <div className="sb-lightbox-tag">{selectedBon.jenis_pembelian}</div>
                                <div className="sb-lightbox-price">{formatRupiah(selectedBon.harga_pembelian)}</div>
                                <div className="sb-lightbox-meta">
                                    {selectedBon.hari}, {selectedBon.tanggal} • {selectedBon.jam} WIB
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}