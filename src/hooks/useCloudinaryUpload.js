import { useState } from 'react';
import { sellerApi } from '../lib/axios';

/**
 * Two-step Cloudinary upload:
 * 1. GET /cloudinary/sign → signed params from our backend
 * 2. POST directly to Cloudinary with the signed params
 *
 * Usage:
 *   const { upload, uploading, progress } = useCloudinaryUpload();
 *   const { url, publicId } = await upload(file, 'logo');
 *   await sellerApi.post('/business/logo', { url, publicId });
 */
export function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState(null);

  const upload = async (file, type, context) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // ── Step 1: Get signed upload params from our backend ──
      const query = new URLSearchParams({ type });
      if (context) query.set('context', context);

      const { data } = await sellerApi.get(`/cloudinary/sign?${query}`);
      const params = data.data;

      // ── Step 2: Upload directly to Cloudinary ──
      const form = new FormData();
      form.append('file', file);
      form.append('timestamp', String(params.timestamp));
      form.append('folder', params.folder);
      form.append('allowed_formats', params.allowed_formats);
      form.append('signature', params.signature);
      form.append('api_key', params.api_key);

      if (params.public_id) {
        form.append('public_id', params.public_id);
      }

      // Use XHR so we can track progress
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const res = JSON.parse(xhr.responseText);
            resolve({ url: res.secure_url, publicId: res.public_id });
          } else {
            const res = JSON.parse(xhr.responseText);
            reject(new Error(res.error?.message ?? 'Cloudinary upload failed'));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

        xhr.open('POST', params.upload_url);
        xhr.send(form);
      });

      setProgress(100);
      return result; // { url, publicId }

    } catch (err) {
      const msg = err.message ?? 'Upload failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, progress, error };
}
