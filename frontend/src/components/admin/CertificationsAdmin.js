import React, { useEffect, useState } from 'react';
import { authFetch } from '../../utils/authClient';
import ImageUploadField from './ImageUploadField';

const emptyForm = {
  title: '', organization: '', issueDate: '', expiryDate: '', credentialID: '',
  credentialURL: '', description: '', skills: '', imageUrl: '', featured: false
};

function CertificationsAdmin() {
  const [certifications, setCertifications] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    const response = await authFetch('/certifications');
    const data = await response.json();
    setCertifications(Array.isArray(data) ? data : []);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (cert) => {
    setEditingId(cert._id);
    setForm({
      title: cert.title || '',
      organization: cert.organization || '',
      issueDate: cert.issueDate ? cert.issueDate.substring(0, 10) : '',
      expiryDate: cert.expiryDate ? cert.expiryDate.substring(0, 10) : '',
      credentialID: cert.credentialID || '',
      credentialURL: cert.credentialURL || '',
      description: cert.description || '',
      skills: (cert.skills || []).join(', '),
      imageUrl: cert.imageUrl || '',
      featured: Boolean(cert.featured)
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const payload = {
      title: form.title,
      organization: form.organization,
      issueDate: form.issueDate,
      expiryDate: form.expiryDate || undefined,
      credentialID: form.credentialID || undefined,
      credentialURL: form.credentialURL || undefined,
      description: form.description || undefined,
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      imageUrl: form.imageUrl || undefined,
      featured: form.featured
    };
    const path = editingId ? `/certifications/${editingId}` : '/certifications';
    const method = editingId ? 'PUT' : 'POST';
    const response = await authFetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.message || 'Save failed');
      return;
    }
    resetForm();
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this certification?')) return;
    await authFetch(`/certifications/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <table className="admin-table">
        <thead>
          <tr><th>Title</th><th>Organization</th><th>Featured</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {certifications.map((c) => (
            <tr key={c._id}>
              <td>{c.title}</td>
              <td>{c.organization}</td>
              <td>{c.featured ? 'Yes' : 'No'}</td>
              <td>
                <button onClick={() => startEdit(c)}>Edit</button>{' '}
                <button onClick={() => handleDelete(c._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form className="admin-form" onSubmit={handleSubmit}>
        <h3>{editingId ? 'Edit certification' : 'Add new certification'}</h3>
        {error && <p className="admin-error">{error}</p>}
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input placeholder="Organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} required />
        <label>
          Issue date
          <input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} required />
        </label>
        <label>
          Expiry date (optional)
          <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
        </label>
        <input placeholder="Credential ID" value={form.credentialID} onChange={(e) => setForm({ ...form, credentialID: e.target.value })} />
        <input placeholder="Credential URL" value={form.credentialURL} onChange={(e) => setForm({ ...form, credentialURL: e.target.value })} />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input placeholder="Skills (comma-separated)" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
        <ImageUploadField value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
        <label>
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured
        </label>
        <button type="submit">{editingId ? 'Save changes' : 'Add certification'}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
      </form>
    </div>
  );
}

export default CertificationsAdmin;
