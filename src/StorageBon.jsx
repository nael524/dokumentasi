import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Image as ImageIcon, RefreshCw, X, Eye, Tag, Edit3, Trash2, Save, FileText, Wallet } from 'lucide-react';
import { supabase } from './supabaseClient';
import './StorageBon.css';

export default function StorageBon({ isOpen, onClose, refreshTrigger }) {
    const [bonList, setBonList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [editJenis, setEditJenis] = useState('');
    const [editHarga, setEditHarga] = useState('');
    const [saving, setSaving] = useState(false);

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

    // Hitung Total Struk dan Total Harga
    const totalStruk = bonList.length;
    const totalPengeluaran = bonList.reduce((acc, curr) => acc + (Number(curr.harga_pembelian) || 0), 0);

    const handleEditClick = (e, item) => {
        e.stopPropagation();
        setEditingItem(item);
        setEditJenis(item.jenis_pembelian);
        setEditHarga(item.harga_pembelian);
    };

    const handleSaveEdit = async () => {
        if (!editJenis.trim() || !editHarga) {
            alert('Jenis dan harga pembelian tidak boleh kosong!');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('foto_bon')
                .update({
                    jenis_pembelian: editJenis.trim(),
                    harga_pembelian: parseFloat(editHarga) || 0
                })
                .eq('id', editingItem.id);

            if (error) throw error;

            setEditingItem(null);
            fetchBon();
        } catch (err) {
            alert('Gagal mengedit bon: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Apakah Anda yakin ingin menghapus bukti bon ini?')) return;

        try {
            const { error } = await supabase
                .from('foto_bon')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setBonList(bonList.filter((item) => item.id !== id));
            if (selectedImage && selectedImage.id === id) {
                setSelectedImage(null);
            }
        } catch (err) {
            alert('Gagal menghapus: ' + err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="bn-overlay" onClick={onClose}>
            <div className="bn-modal-card storage-bon-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header Modal */}
                <div className="bn-modal-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ImageIcon size={20} color="#f59e0b" />
                        <h3>Arsip Bukti Bon & Struk</h3>
                    </div>
                    <button onClick={onClose} className="bn-btn-icon">
                        <X size={20} />
                    </button>
                </div>

                {/* Dashboard Summary Total Struk & Nominal */}
                <div className="storage-summary-bar">
                    <div className="summary-item">
                        <FileText size={16} color="#d97706" />
                        <div>
                            <span className="summary-label">Total Struk</span>
                            <strong className="summary-value">{totalStruk} Lembar</strong>
                        </div>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-item">
                        <Wallet size={16} color="#16a34a" />
                        <div>
                            <span className="summary-label">Total Pengeluaran</span>
                            <strong className="summary-value green">
                                Rp {totalPengeluaran.toLocaleString('id-ID')}
                            </strong>
                        </div>
                    </div>
                </div>

                {/* Content Body */}
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

                                        <div className="storage-bon-card-actions">
                                            <button
                                                className="btn-card-action edit"
                                                title="Edit Bon"
                                                onClick={(e) => handleEditClick(e, item)}
                                            >
                                                <Edit3 size={13} />
                                            </button>
                                            <button
                                                className="btn-card-action delete"
                                                title="Hapus Bon"
                                                onClick={(e) => handleDelete(e, item.id)}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>

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

                {/* Modal Lightbox Preview */}
                {selectedImage && !editingItem && (
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

                {/* Modal Edit Form */}
                {editingItem && (
                    <div className="bn-overlay" onClick={() => setEditingItem(null)}>
                        <div className="bn-modal-card edit-bon-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="bn-modal-top">
                                <h3><Edit3 size={16} /> Edit Bukti Bon</h3>
                                <button onClick={() => setEditingItem(null)} className="bn-btn-icon">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="edit-form-group">
                                <label className="bn-form-label"><Tag size={12} /> Jenis Pembelian</label>
                                <input
                                    type="text"
                                    className="bn-form-input"
                                    value={editJenis}
                                    onChange={(e) => setEditJenis(e.target.value)}
                                />
                            </div>

                            <div className="edit-form-group">
                                <label className="bn-form-label"><Wallet size={12} /> Harga Pembelian (Rp)</label>
                                <input
                                    type="number"
                                    className="bn-form-input"
                                    value={editHarga}
                                    onChange={(e) => setEditHarga(e.target.value)}
                                />
                            </div>

                            <div className="bn-modal-actions">
                                <button onClick={() => setEditingItem(null)} className="bn-btn-secondary" disabled={saving}>
                                    Batal
                                </button>
                                <button onClick={handleSaveEdit} className="bn-btn-primary bn-flex-1" disabled={saving}>
                                    <Save size={15} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}