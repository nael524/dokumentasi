import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Image as ImageIcon, RefreshCw, X, Eye, Tag } from 'lucide-react';
import { supabase } from './supabaseClient';
import './StorageBon.css';

export default function StorageBon({ isOpen, onClose, refreshTrigger }) {
    const [bonList, setBonList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

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
            console.error('Gagal mengambil data dari Supabase:', err.message);
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

    return (
        <div className="bn-overlay" onClick={onClose}>
            <div className="bn-modal-card storage-bon-modal" onClick={(e) => e.stopPropagation()}>
                <div className="bn-modal-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ImageIcon size={20} color="#f59e0b" />
                        <h3>Arsip Bukti Bon & Struk</h3>
                    </div>
                    <button onClick={onClose} className="bn-btn-icon">
                        <X size={20} />
                    </button>
                </div>

                <div className="storage-bon-body">
                    {loading ? (
                        <div className="storage-bon-loading">
                            <RefreshCw size={24} className="animate-spin" color="#f59e0b" />
                            <span>Memuat arsip bon...</span>
                        </div>
                    ) : bonList.length === 0 ? (
                        <div className="storage-bon-empty">
                            Belum ada bukti bon yang tersimpan.
                        </div>
                    ) : (
                        <div className="storage-bon-grid">
                            {bonList.map((item) => (
                                <div
                                    key={item.id}
                                    className="storage-bon-card"
                                    onClick={() => setSelectedImage(item)}
                                >
                                    <div className="storage-bon-img-wrapper">
                                        <img
                                            src={item.file_path}
                                            alt={item.jenis_pembelian}
                                            className="storage-bon-img"
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/400x300?text=Gambar+Tidak+Tersedia';
                                            }}
                                        />
                                        <span className="storage-bon-badge">{item.hari}</span>
                                        <div className="storage-bon-hover">
                                            <Eye size={18} /> Lihat Bon
                                        </div>
                                    </div>

                                    <div className="storage-bon-card-body">
                                        <div className="storage-bon-tag">
                                            <Tag size={12} />
                                            <span>{item.jenis_pembelian}</span>
                                        </div>
                                        <div className="storage-bon-price">
                                            Rp {Number(item.harga_pembelian).toLocaleString('id-ID')}
                                        </div>
                                        <div className="storage-bon-meta">
                                            <span><Calendar size={11} /> {item.tanggal}</span>
                                            <span><Clock size={11} /> {item.jam} WIB</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {selectedImage && (
                    <div className="bn-overlay" onClick={() => setSelectedImage(null)}>
                        <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                            <button className="lightbox-close" onClick={() => setSelectedImage(null)}>
                                <X size={20} />
                            </button>
                            <img src={selectedImage.file_path} alt="Full Size" className="lightbox-img" />
                            <div className="lightbox-caption">
                                <span className="lightbox-badge-title">
                                    <Tag size={14} /> {selectedImage.jenis_pembelian}
                                </span>
                                <div style={{ fontWeight: '800', color: '#d97706', fontSize: '15px' }}>
                                    Rp {Number(selectedImage.harga_pembelian).toLocaleString('id-ID')}
                                </div>
                                <div className="lightbox-subtext">
                                    {selectedImage.hari}, {selectedImage.tanggal} ({selectedImage.jam} WIB)
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}