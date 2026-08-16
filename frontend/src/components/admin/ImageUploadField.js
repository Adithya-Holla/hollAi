import React, { useState } from 'react';
import { authFetch } from '../../utils/authClient';

function ImageUploadField({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await authFetch('/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }
      onChange(data.imageUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-upload-field">
      <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} />
      {uploading && <p>Uploading...</p>}
      {error && <p className="admin-error">{error}</p>}
      {value && <img src={value} alt="preview" style={{ maxWidth: '150px', display: 'block', marginTop: '0.5rem' }} />}
    </div>
  );
}

export default ImageUploadField;
