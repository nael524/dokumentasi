import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Image as ImageIcon, RefreshCw, X, Eye } from 'lucide-react';
import { supabase } from './supabaseClient';
import './StorageDokumentasi.css';

export default function StorageDokumentasi({ isOpen, onClose, refreshTrigger }) {
    const [dokumentasiList, setDokumentasiList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    const fetchDokumentasi = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('dokumentasi_kegiatan')
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;
            setDokumentasiList(data || []);
        } catch (err) {
            console.error('Gagal mengambil data dari Supabase:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchDokumentasi();
        }
    }, [isOpen, refreshTrigger]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card storage-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header Modal */}
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ImageIcon size={20} color="#38bdf8" />
                        <div>
                            <h3 className="modal-title">Galeri Arsip Kegiatan</h3>
                            <p className="modal-subtitle">Dokumentasi Pemuda GKPI Immanuel</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-close">
                        <X size={20} />
                    </button>
                </div>

                {/* Konten Modal */}
                <div className="modal-body">
                    {loading ? (
                        <div className="storage-loading">
                            <RefreshCw size={24} className="animate-spin" color="#38bdf8" />
                            <span>Memuat arsip foto...</span>
                        </div>
                    ) : dokumentasiList.length === 0 ? (
                        <div className="storage-empty">
                            Belum ada foto dokumentasi kegiatan yang tersimpan.
                        </div>
                    ) : (
                        <div className="storage-grid">
                            {dokumentasiList.map((item) => (
                                <div
                                    key={item.id}
                                    className="storage-card"
                                    onClick={() => setSelectedImage(item)}
                                >
                                    <div className="storage-card-img-wrapper">
                                        <img
                                            src={item.file_path}
                                            alt="Dokumentasi Kegiatan"
                                            className="storage-card-img"
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Gambar+Tidak+Tersedia'; }}
                                        />
                                        <span className="storage-card-badge">{item.hari}</span>
                                        <div className="storage-card-hover">
                                            <Eye size={20} /> Lihat Foto
                                        </div>
                                    </div>
                                    <div className="storage-card-body">
                                        <div className="storage-meta-item">
                                            <Calendar size={13} color="#38bdf8" />
                                            <span>{item.tanggal}</span>
                                        </div>
                                        <div className="storage-meta-item">
                                            <Clock size={13} color="#38bdf8" />
                                            <span>{item.jam} WIB</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Preview Gambar Fullscreen (Lightbox) */}
                {selectedImage && (
                    <div className="lightbox-overlay" onClick={() => setSelectedImage(null)}>
                        <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                            <button className="lightbox-close" onClick={() => setSelectedImage(null)}>
                                <X size={20} />
                            </button>
                            <img src={selectedImage.file_path} alt="Full Size" className="lightbox-img" />
                            <div className="lightbox-caption">
                                <strong>GKPI IMMANUEL</strong> • {selectedImage.hari}, {selectedImage.tanggal} ({selectedImage.jam} WIB)
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}