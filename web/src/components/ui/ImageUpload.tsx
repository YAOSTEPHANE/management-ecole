import React, { useState, useRef } from 'react';
import { FiUpload, FiX, FiImage } from 'react-icons/fi';
import Button from './Button';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface ImageUploadProps {
  currentImage?: string;
  onUpload: (url: string) => void;
  type?: 'avatar' | 'assignment' | 'course';
  label?: string;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onUpload,
  type = 'avatar',
  label,
  className = '',
}) => {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 5MB)');
      return;
    }

    // Vérifier le type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (type === 'avatar' && !allowedTypes.includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPEG, PNG ou GIF');
      return;
    }

    // Aperçu pour les images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    // Upload
    await handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append(type, file);

      const response = await api.post(`/upload/${type}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onUpload(response.data.url);
      toast.success('Image uploadée avec succès');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'upload');
      setPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      
      <div className="flex items-center space-x-4">
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className={`rounded-lg object-cover ${
                type === 'avatar' ? 'w-24 h-24' : 'w-32 h-32'
              } border-2 border-gray-200`}
            />
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            className={`flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 ${
              type === 'avatar' ? 'w-24 h-24' : 'w-32 h-32'
            }`}
          >
            <FiImage className="w-8 h-8 text-gray-400" />
          </div>
        )}

        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept={type === 'avatar' ? 'image/*' : type === 'assignment' ? '.pdf,.doc,.docx' : 'image/*'}
            onChange={handleFileSelect}
            className="hidden"
            id={`file-upload-${type}`}
          />
          <label htmlFor={`file-upload-${type}`} className="cursor-pointer">
            <div className="inline-block">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                isLoading={uploading}
                onClick={(e) => {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }}
              >
                <FiUpload className="w-4 h-4 mr-2" />
                {uploading ? 'Upload...' : preview ? 'Changer' : 'Uploader'}
              </Button>
            </div>
          </label>
        </div>
      </div>
      
      <p className="text-xs text-gray-500">
        {type === 'avatar' 
          ? 'Format: JPEG, PNG, GIF (max 5MB)'
          : type === 'assignment'
          ? 'Format: PDF, DOC, DOCX (max 5MB)'
          : 'Format: JPEG, PNG, GIF (max 5MB)'}
      </p>
    </div>
  );
};

export default ImageUpload;

