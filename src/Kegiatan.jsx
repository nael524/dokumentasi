import React, { useState, useRef } from 'react';
import { Camera, Sparkles, Clock, Calendar, Check, X, Images, RefreshCw, Tag, CheckCircle2 } from 'lucide-react';
import { supabase } from './supabaseClient';
import StorageDokumentasi from './StorageDokumentasi';
import './Kegiatan.css';

export default function Kegiatan() {
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [facingMode, setFacingMode] = useState('environment');
    const [capturedImage, setCapturedImage] = useState(null);
    const [metaData, setMetaData] = useState(null);
    const [namaKegiatan, setNamaKegiatan] = useState('Latihan Koor Natal');
    const [customKegiatan, setCustomKegiatan] = useState('');
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
        setNamaKegiatan('Latihan Koor Natal');
        setCustomKegiatan('');
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
        const now = new Date();
        const hari = DAYS[now.getDay()];
        const tanggal = now.toISOString().split('T')[0];
        const jam = now.toTimeString().split(' ')[0];

        setMetaData({ hari, tanggal, jam });

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

    const generateWatermarkedImage = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const finalNama = namaKegiatan === 'Lainnya' ? (customKegiatan || 'Kegiatan Pemuda') : namaKegiatan;

        const img = new Image();
        img.src = capturedImage;

        return new Promise((resolve) => {
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                ctx.fillRect(0, canvas.height - 90, canvas.width, 90);

                ctx.fillStyle = '#C2F215';
                ctx.font = 'bold 20px Poppins, sans-serif';
                ctx.fillText(`GKPI IMMANUEL - ${finalNama.toUpperCase()}`, 20, canvas.height - 52);

                ctx.fillStyle = '#ffffff';
                ctx.font = '14px Poppins, sans-serif';
                ctx.fillText(`${metaData.hari}, ${metaData.tanggal} | ${metaData.jam} WIB`, 20, canvas.height - 22);

                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
        });
    };

    const saveToDatabase = async () => {
        if (!capturedImage || !metaData) return;
        const selectedKegiatan = namaKegiatan === 'Lainnya' ? customKegiatan.trim() : namaKegiatan;

        if (!selectedKegiatan) {
            alert('Silakan pilih atau isi nama kegiatan!');
            return;
        }

        setUploading(true);

        try {
            const finalImageBase64 = await generateWatermarkedImage();
            const response = await fetch(finalImageBase64);
            const blob = await response.blob();
            const fileName = `kegiatan/${Date.now()}.jpg`;

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
                .from('dokumentasi_kegiatan')
                .insert([
                    {
                        file_path: urlData.publicUrl,
                        nama_kegiatan: selectedKegiatan,
                        hari: metaData.hari,
                        tanggal: metaData.tanggal,
                        jam: metaData.jam
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
        <div className="kegiatan-container">
            <div className="kegiatan-header">
                <div className="kegiatan-badge">
                    <Sparkles size={14} /> GKPI Immanuel
                </div>
                <h1 className="kegiatan-title">Dokumentasi Kegiatan</h1>
                <p className="kegiatan-subtitle">Pemuda - Pemudi</p>

                <div className="action-buttons">
                    <button onClick={openCamera} className="btn-primary">
                        <Camera size={18} /> Ambil Foto
                    </button>

                    <button onClick={() => setIsGalleryOpen(true)} className="btn-secondary">
                        <Images size={18} /> Lihat Arsip
                    </button>
                </div>
            </div>

            <StorageDokumentasi
                isOpen={isGalleryOpen}
                onClose={() => setIsGalleryOpen(false)}
                refreshTrigger={refreshTrigger}
            />

            {/* Modal Kamera */}
            {isCameraOpen && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-top">
                            <h3>Kamera ({facingMode === 'environment' ? 'Belakang' : 'Depan'})</h3>
                            <div className="modal-top-actions">
                                {!capturedImage && (
                                    <button
                                        onClick={switchCamera}
                                        className="btn-icon"
                                        title="Ganti Kamera Depan/Belakang"
                                    >
                                        <RefreshCw size={18} />
                                    </button>
                                )}
                                <button onClick={closeCamera} className="btn-icon">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {!capturedImage ? (
                            <>
                                <div className="camera-wrapper">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className={`camera-preview ${facingMode === 'user' ? 'mirror' : ''}`}
                                    />
                                </div>
                                <button onClick={takePhoto} className="btn-primary full-width">
                                    <Camera size={18} /> Tangkap Gambar
                                </button>
                            </>
                        ) : (
                            <>
                                <img src={capturedImage} alt="Preview" className="result-img" />

                                <div className="kegiatan-select-box">
                                    <label className="select-label">
                                        <Tag size={14} /> Pilih Nama Kegiatan:
                                    </label>
                                    <select
                                        value={namaKegiatan}
                                        onChange={(e) => setNamaKegiatan(e.target.value)}
                                        className="select-input"
                                    >
                                        <option value="Latihan Koor Natal">1. Latihan Koor Natal</option>
                                        <option value="Latihan Kegiatan Natal">2. Latihan Kegiatan Natal</option>
                                        <option value="Rapat Natal">3. Rapat Natal</option>
                                        <option value="Lainnya">Lainnya (Ketik Manual)</option>
                                    </select>

                                    {namaKegiatan === 'Lainnya' && (
                                        <input
                                            type="text"
                                            placeholder="Masukkan nama kegiatan..."
                                            value={customKegiatan}
                                            onChange={(e) => setCustomKegiatan(e.target.value)}
                                            className="text-input"
                                        />
                                    )}
                                </div>

                                <div className="meta-box">
                                    <div><Calendar size={14} /> {metaData.hari}, {metaData.tanggal}</div>
                                    <div><Clock size={14} /> {metaData.jam} WIB</div>
                                </div>

                                <div className="modal-actions">
                                    <button onClick={() => { setCapturedImage(null); startCameraStream(facingMode); }} className="btn-secondary" disabled={uploading}>
                                        Ulangi
                                    </button>
                                    <button onClick={saveToDatabase} disabled={uploading} className="btn-primary flex-1">
                                        <Check size={16} /> {uploading ? 'Menyimpan...' : 'Simpan'}
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
                <div className="modal-overlay">
                    <div className="modal-card success-card">
                        <div className="success-icon-wrapper">
                            <CheckCircle2 size={56} className="success-check-icon" />
                        </div>
                        <h2 className="success-title">Berhasil Disimpan!</h2>
                        <p className="success-desc">
                            Dokumentasi kegiatan telah resmi tersimpan ke dalam sistem database.
                        </p>
                        <div className="modal-actions">
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    setIsGalleryOpen(true);
                                }}
                                className="btn-primary full-width"
                            >
                                Lihat di Arsip
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}