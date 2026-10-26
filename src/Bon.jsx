import React, { useState, useRef } from 'react';
import { Camera, Receipt, Check, X, Tag, DollarSign, RefreshCw, Images, CheckCircle2 } from 'lucide-react';
import { supabase } from './supabaseClient';
import StorageBon from './StorageBon';
import './Bon.css';

export default function Bon() {
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [facingMode, setFacingMode] = useState('environment');
    const [capturedImage, setCapturedImage] = useState(null);
    const [jenisPembelian, setJenisPembelian] = useState('');
    const [hargaPembelian, setHargaPembelian] = useState('');
    const [uploading, setUploading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const DAYS = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

    const startCameraStream = async (mode) => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: mode }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            alert('Gagal mengakses kamera: ' + err.message);
            setIsCameraOpen(false);
        }
    };

    const openCamera = async () => {
        setIsCameraOpen(true);
        setCapturedImage(null);
        setJenisPembelian('');
        setHargaPembelian('');
        await startCameraStream(facingMode);
    };

    const switchCamera = async () => {
        const newMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(newMode);
        await startCameraStream(newMode);
    };

    const closeCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
        }
        setIsCameraOpen(false);
        setCapturedImage(null);
    };

    const takePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');

        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
        }
    };

    const saveToDatabase = async () => {
        if (!jenisPembelian.trim() || !hargaPembelian) {
            alert('Harap isi Jenis Pembelian dan Harga Pembelian!');
            return;
        }

        setUploading(true);
        const now = new Date();
        const hari = DAYS[now.getDay()];
        const tanggal = now.toISOString().split('T')[0];
        const jam = now.toTimeString().split(' ')[0];

        try {
            const response = await fetch(capturedImage);
            const blob = await response.blob();
            const fileName = `bon/${Date.now()}.jpg`;

            const { error: storageError } = await supabase
                .storage
                .from('uploads')
                .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

            if (storageError) throw storageError;

            const { data: urlData } = supabase
                .storage
                .from('uploads')
                .getPublicUrl(fileName);

            const { error: dbError } = await supabase
                .from('foto_bon')
                .insert([
                    {
                        file_path: urlData.publicUrl,
                        jenis_pembelian: jenisPembelian.trim(),
                        harga_pembelian: parseFloat(hargaPembelian) || 0,
                        hari,
                        tanggal,
                        jam
                    }
                ]);

            if (dbError) throw dbError;

            closeCamera();
            setRefreshTrigger((prev) => prev + 1);
            setShowSuccessModal(true);
        } catch (err) {
            alert('Gagal menyimpan: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bn-container">
            <div className="bn-header">
                <div className="bn-badge">
                    <Receipt size={14} /> Keuangan Panitia
                </div>
                <h1 className="bn-title">Foto Bukti Bon</h1>
                <p className="bn-subtitle">Upload Kwitansi & Struk Belanja</p>

                <div className="bn-action-buttons">
                    <button onClick={openCamera} className="bn-btn-primary">
                        <Camera size={18} /> Ambil Foto Bon
                    </button>

                    <button onClick={() => setIsGalleryOpen(true)} className="bn-btn-secondary">
                        <Images size={18} /> Lihat Arsip Bon
                    </button>
                </div>
            </div>

            <StorageBon
                isOpen={isGalleryOpen}
                onClose={() => setIsGalleryOpen(false)}
                refreshTrigger={refreshTrigger}
            />

            {/* Modal Kamera */}
            {isCameraOpen && (
                <div className="bn-overlay">
                    <div className="bn-modal-card">
                        <div className="bn-modal-top">
                            <h3>Kamera Bon ({facingMode === 'environment' ? 'Belakang' : 'Depan'})</h3>
                            <div className="bn-top-actions">
                                {!capturedImage && (
                                    <button onClick={switchCamera} className="bn-btn-icon" title="Ganti Kamera">
                                        <RefreshCw size={18} />
                                    </button>
                                )}
                                <button onClick={closeCamera} className="bn-btn-icon">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {!capturedImage ? (
                            <>
                                <div className="bn-camera-wrapper">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className={`bn-camera-preview ${facingMode === 'user' ? 'mirror' : ''}`}
                                    />
                                </div>
                                <button onClick={takePhoto} className="bn-btn-primary bn-full-width">
                                    <Camera size={18} /> Tangkap Gambar
                                </button>
                            </>
                        ) : (
                            <>
                                <img src={capturedImage} alt="Preview Bon" className="bn-result-img" />

                                <div className="bn-form-group">
                                    <label className="bn-form-label">
                                        <Tag size={13} /> Jenis Pembelian
                                    </label>
                                    <input
                                        type="text"
                                        className="bn-form-input"
                                        placeholder="Contoh: Konsumsi Bandrek & Roti"
                                        value={jenisPembelian}
                                        onChange={(e) => setJenisPembelian(e.target.value)}
                                    />
                                </div>

                                <div className="bn-form-group">
                                    <label className="bn-form-label">
                                        <DollarSign size={13} /> Harga Pembelian (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        className="bn-form-input"
                                        placeholder="Contoh: 150000"
                                        value={hargaPembelian}
                                        onChange={(e) => setHargaPembelian(e.target.value)}
                                    />
                                </div>

                                <div className="bn-modal-actions">
                                    <button onClick={() => { setCapturedImage(null); startCameraStream(facingMode); }} className="bn-btn-secondary" disabled={uploading}>
                                        Ulangi
                                    </button>
                                    <button onClick={saveToDatabase} disabled={uploading} className="bn-btn-primary bn-flex-1">
                                        <Check size={16} /> {uploading ? 'Menyimpan...' : 'Simpan Bon'}
                                    </button>
                                </div>
                            </>
                        )}

                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </div>
                </div>
            )}

            {/* Modal Sukses Berhasil Disimpan */}
            {showSuccessModal && (
                <div className="bn-overlay">
                    <div className="bn-modal-card bn-success-card">
                        <div className="bn-success-icon-wrapper">
                            <CheckCircle2 size={56} className="bn-success-check-icon" />
                        </div>
                        <h2 className="bn-success-title">Bon Berhasil Disimpan!</h2>
                        <p className="bn-success-desc">
                            Bukti transaksi telah resmi tersimpan di database keuangan.
                        </p>
                        <div className="bn-modal-actions">
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    setIsGalleryOpen(true);
                                }}
                                className="bn-btn-primary bn-full-width"
                            >
                                Lihat Arsip Bon
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}