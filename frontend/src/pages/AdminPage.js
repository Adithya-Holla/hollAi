import React, { useState } from 'react';
import { clearToken } from '../utils/authClient';
import { useNavigate } from 'react-router-dom';
import ProjectsAdmin from '../components/admin/ProjectsAdmin';
import '../styles/AdminPage.css';

function AdminPage() {
  const [tab, setTab] = useState('projects');
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate('/admin/login');
  };

  return (
    <div className="admin-page">
      <div className="admin-tabs">
        <button className={tab === 'projects' ? 'active' : ''} onClick={() => setTab('projects')}>Projects</button>
        <button className={tab === 'certifications' ? 'active' : ''} onClick={() => setTab('certifications')}>Certifications</button>
        <button onClick={handleLogout} style={{ marginLeft: 'auto' }}>Log out</button>
      </div>
      {tab === 'projects' && <ProjectsAdmin />}
    </div>
  );
}

export default AdminPage;
