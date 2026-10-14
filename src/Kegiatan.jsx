import React, { useState, useRef } from 'react';
import { Camera, Sparkles, Clock, Calendar, Check, X, Images, RefreshCw } from 'lucide-react';
import { supabase } from './supabaseClient';
import StorageDokumentasi from './StorageDokumentasi';
import './Kegiatan.css';

export default function Kegiatan() {
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [facingMode, setFacingMode] = useState('environment'); // 'environment' (belakang) atau 'user' (depan)
    const [capturedImage, setCapturedImage] = useState(null);
    const [metaData, setMetaData] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const DAYS = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

    // Buka Kamera berdasarkan facingMode yang aktif
    const startCameraStream = async (mode) => {
        // Hentikan stream kamera lama jika ada
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
        await startCameraStream(facingMode);
    };

    // Fungsi Switch Kamera (Depan <-> Belakang)
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

        // Jika menggunakan kamera depan ('user'), balikkan gambar secara horisontal agar tidak cermin
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Reset transformasi canvas setelah gambar
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Overlay Watermark Ringkas
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(0, canvas.height - 70, canvas.width, 70);

        ctx.fillStyle = '#C2F215';
        ctx.font = 'bold 18px Poppins, sans-serif';
        ctx.fillText(`GKPI IMMANUEL`, 20, canvas.height - 42);

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Poppins, sans-serif';
        ctx.fillText(`${hari}, ${tanggal} • ${jam} WIB`, 20, canvas.height - 18);

        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
        }
    };

    const saveToDatabase = async () => {
        if (!capturedImage || !metaData) return;
        setUploading(true);

        try {
            const response = await fetch(capturedImage);
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
                        hari: metaData.hari,
                        tanggal: metaData.tanggal,
                        jam: metaData.jam
                    }
                ]);

            if (dbError) throw dbError;

            alert('Dokumentasi berhasil disimpan!');
            closeCamera();
            setRefreshTrigger((prev) => prev + 1);
            setIsGalleryOpen(true);
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
        </div>
    );
}