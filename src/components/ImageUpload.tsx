import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, X, Loader2 } from 'lucide-react';

interface ImageUploadProps {
    value: string | null;
    onChange: (url: string) => void;
    onUploading?: (uploading: boolean) => void;
    bucket?: string;
    path?: string;
}

const ImageUpload = ({ value, onChange, onUploading, bucket = 'savour', path = '' }: ImageUploadProps) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = path ? `${path}/${fileName}` : fileName;

            setUploading(true);
            onUploading?.(true);

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            onChange(publicUrl);
        } catch (error) {
            alert('Error uploading image: ' + (error as any).message);
        } finally {
            setUploading(false);
            onUploading?.(false);
        }
    };

    return (
        <div className="image-upload-container">
            <div
                style={{
                    width: '100%',
                    height: '140px',
                    borderRadius: '12px',
                    border: '2px dashed var(--border)',
                    background: 'var(--bg-sub)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                }}
                onClick={() => fileInputRef.current?.click()}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
                {uploading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <Loader2 className="animate-spin" color="var(--primary)" size={32} />
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Uploading...</span>
                    </div>
                ) : value ? (
                    <>
                        <img
                            src={value}
                            alt="Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                        <button
                            className="btn-secondary"
                            style={{
                                position: 'absolute',
                                top: '0.5rem',
                                right: '0.5rem',
                                padding: '0.4rem',
                                borderRadius: '50%',
                                background: 'rgba(0,0,0,0.6)',
                                border: 'none',
                                color: 'white'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange('');
                            }}
                        >
                            <X size={16} />
                        </button>
                    </>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                        <Upload size={32} />
                        <span style={{ fontSize: '0.875rem' }}>Click to upload logo</span>
                    </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Recommended size: 256x256px. PNG, JPG, or SVG.
            </p>
        </div>
    );
};

export default ImageUpload;
