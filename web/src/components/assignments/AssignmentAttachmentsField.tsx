'use client';

import { useRef, useState } from 'react';
import { FiFile, FiPaperclip, FiTrash2, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { uploadAssignmentAttachment } from '@/services/api/upload';

export type AssignmentAttachmentItem = {
  url: string;
  name: string;
};

type Props = {
  value: AssignmentAttachmentItem[];
  onChange: (items: AssignmentAttachmentItem[]) => void;
  disabled?: boolean;
  maxFiles?: number;
};

const MAX_DEFAULT = 8;

function fileNameFromUrl(url: string, fallback: string): string {
  try {
    const path = new URL(url, 'http://local').pathname;
    const base = path.split('/').pop() || fallback;
    return decodeURIComponent(base.replace(/^assignment-\d+-/, ''));
  } catch {
    return fallback;
  }
}

export default function AssignmentAttachmentsField({
  value,
  onChange,
  disabled = false,
  maxFiles = MAX_DEFAULT,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || disabled) return;
    const remaining = maxFiles - value.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${maxFiles} fichiers par devoir`);
      return;
    }

    const batch = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const uploaded: AssignmentAttachmentItem[] = [];
      for (const file of batch) {
        const res = await uploadAssignmentAttachment(file);
        if (res.url) {
          uploaded.push({
            url: res.url,
            name: res.filename || file.name,
          });
        }
      }
      if (uploaded.length > 0) {
        onChange([...value, ...uploaded]);
        toast.success(
          uploaded.length === 1 ? 'Fichier joint' : `${uploaded.length} fichiers joints`
        );
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Échec du téléversement');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Pièces jointes
        <span className="text-gray-400 font-normal ml-1">(PDF, Word, images — max 5 Mo)</span>
      </label>

      {value.length > 0 && (
        <ul className="space-y-2 border border-gray-200 rounded-lg p-2 bg-gray-50/80">
          {value.map((item, index) => (
            <li
              key={`${item.url}-${index}`}
              className="flex items-center justify-between gap-2 text-sm bg-white border border-gray-100 rounded-md px-2 py-1.5"
            >
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 min-w-0 text-green-700 hover:underline"
              >
                <FiFile className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.name || fileNameFromUrl(item.url, `Fichier ${index + 1}`)}</span>
              </a>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  aria-label="Retirer le fichier"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!disabled && value.length < maxFiles && (
        <div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,application/pdf,image/*"
            className="hidden"
            aria-label="Joindre des fichiers au devoir"
            onChange={(e) => void handleFiles(e.target.files)}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-green-500 hover:text-green-700 hover:bg-green-50/50 disabled:opacity-60"
          >
            {uploading ? (
              <FiLoader className="w-4 h-4 animate-spin" />
            ) : (
              <FiPaperclip className="w-4 h-4" />
            )}
            {uploading ? 'Téléversement…' : 'Joindre un ou plusieurs fichiers'}
          </button>
          <p className="text-xs text-gray-500 mt-1">
            {value.length}/{maxFiles} fichier{maxFiles > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
