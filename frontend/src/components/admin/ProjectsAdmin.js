import React, { useEffect, useState } from 'react';
import { authFetch } from '../../utils/authClient';
import ImageUploadField from './ImageUploadField';

const emptyForm = {
  title: '', description: '', technologies: '', imageUrl: '', githubUrl: '', liveUrl: '', featured: false
};

function ProjectsAdmin() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    const response = await authFetch('/projects');
    const data = await response.json();
    setProjects(Array.isArray(data) ? data : []);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (project) => {
    setEditingId(project._id);
    setForm({
      title: project.title || '',
      description: project.description || '',
      technologies: (project.technologies || []).join(', '),
      imageUrl: project.imageUrl || '',
      githubUrl: project.githubUrl || '',
      liveUrl: project.liveUrl || '',
      featured: Boolean(project.featured)
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
      description: form.description,
      technologies: form.technologies.split(',').map((t) => t.trim()).filter(Boolean),
      imageUrl: form.imageUrl,
      githubUrl: form.githubUrl || undefined,
      liveUrl: form.liveUrl || undefined,
      featured: form.featured
    };
    const path = editingId ? `/projects/${editingId}` : '/projects';
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
    if (!window.confirm('Delete this project?')) return;
    await authFetch(`/projects/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <table className="admin-table">
        <thead>
          <tr><th>Title</th><th>Featured</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p._id}>
              <td>{p.title}</td>
              <td>{p.featured ? 'Yes' : 'No'}</td>
              <td>
                <button onClick={() => startEdit(p)}>Edit</button>{' '}
                <button onClick={() => handleDelete(p._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form className="admin-form" onSubmit={handleSubmit}>
        <h3>{editingId ? 'Edit project' : 'Add new project'}</h3>
        {error && <p className="admin-error">{error}</p>}
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        <input placeholder="Technologies (comma-separated)" value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} required />
        <ImageUploadField value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
        <input placeholder="GitHub URL" value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} />
        <input placeholder="Live URL" value={form.liveUrl} onChange={(e) => setForm({ ...form, liveUrl: e.target.value })} />
        <label>
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured
        </label>
        <button type="submit">{editingId ? 'Save changes' : 'Add project'}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
      </form>
    </div>
  );
}

export default ProjectsAdmin;
