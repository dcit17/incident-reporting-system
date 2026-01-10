import React, { useEffect, useState } from 'react';
import { InterventionModal } from '../components/InterventionModal';
import { SearchModal } from '../components/SearchModal';
import { Eye, Clock, CheckCircle, Shield, Users, Plus, Key, LogOut, Search, Settings, Upload, Merge, CheckSquare, Square, Trash2, Printer } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('incidents'); // 'incidents' | 'users' | 'settings' | 'archive'
    const [incidents, setIncidents] = useState([]);
    const [archivedIncidents, setArchivedIncidents] = useState([]); // New state for archive
    const [users, setUsers] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState({ role: 'user', username: '' });

    // Merge State
    const [selectedIds, setSelectedIds] = useState([]);

    // User Management State
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
    const [userMsg, setUserMsg] = useState('');

    const [settings, setSettings] = useState({});

    useEffect(() => {
        const role = localStorage.getItem('role');
        const username = localStorage.getItem('username');
        if (role) setCurrentUser({ role, username });

        fetchIncidents();
        fetchSettings();

        // Role-based fetching
        if (['admin', 'tech'].includes(role)) {
            fetchUsers();
        }
        if (['admin', 'tech'].includes(role)) {
            fetchArchive();
        }
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/settings');
            const data = await res.json();
            if (data.data) setSettings(data.data);
        } catch (err) { console.error(err); }
    };

    const getAuthHeaders = () => ({
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    });

    const fetchIncidents = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/incidents', { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.message === 'success') {
                setIncidents(data.data);
                setSelectedIds([]); // Clear selection on refresh
            }
        } catch (err) { console.error(err); }
    };

    const fetchArchive = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/archive', { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.data) setArchivedIncidents(data.data);
        } catch (err) { console.error(err); }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/users', { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.data) setUsers(data.data);
        } catch (err) { console.error(err); }
    };

    // --- Actions ---

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to DELETE this incident? It will be moved to the archive.")) return;
        try {
            const res = await fetch(`http://localhost:5000/api/incidents/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                alert("Incident deleted and archived.");
                fetchIncidents();
                if (['admin', 'tech'].includes(currentUser.role)) fetchArchive();
            } else {
                alert("Failed to delete incident.");
            }
        } catch (err) { console.error(err); }
    };

    const handleRestore = async (id) => {
        if (!confirm("Restore this incident to the main list?")) return;
        try {
            const res = await fetch(`http://localhost:5000/api/archive/${id}/restore`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                alert("Incident restored!");
                fetchArchive();
                fetchIncidents();
            } else {
                alert("Failed to restore incident.");
            }
        } catch (err) { console.error(err); }
    };

    // --- Merge Logic ---
    const toggleSelection = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleMerge = async () => {
        if (!confirm(`Are you sure you want to MERGE these ${selectedIds.length} tickets? This will combine them into the oldest ticket and DELETE the others.`)) return;

        try {
            const res = await fetch('http://localhost:5000/api/incidents/merge', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ ids: selectedIds })
            });
            const data = await res.json();
            if (res.ok) {
                alert("Tickets merged successfully!");
                fetchIncidents();
            } else {
                alert("Merge failed: " + data.message);
            }
        } catch (err) {
            console.error(err);
            alert("Error connecting to server");
        }
    };

    // --- Settings / Upload Logic ---
    const handleUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append(type, file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/settings/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }, // No Content-Type for FormData
                body: formData
            });

            if (res.ok) {
                alert(`${type === 'logo' ? 'Logo' : 'Favicon'} updated! Refresh page to see changes.`);
                fetchSettings(); // Refresh settings live
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`Upload failed: ${res.status} ${res.statusText} ${errData.error || ''}`);
            }
        } catch (err) {
            console.error(err);
            alert("Upload error: " + err.message);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/users', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newUser)
            });
            const data = await res.json();
            if (data.message === 'success') {
                setUserMsg('User created successfully');
                setNewUser({ username: '', password: '', role: 'user' });
                fetchUsers();
            } else {
                setUserMsg(data.error || 'Failed to create user');
            }
        } catch (err) { setUserMsg('Error creating user'); }
    };

    const handleResetPassword = async (id) => {
        const newPass = prompt("Enter new password for this user:");
        if (!newPass) return;
        try {
            const res = await fetch(`http://localhost:5000/api/users/${id}/reset-password`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ password: newPass })
            });
            if (res.ok) alert("Password updated successfully");
            else alert("Failed to update password");
        } catch (err) { console.error(err); }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-green-100 text-green-700 border-green-200';
            case 'In Progress': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-red-100 text-red-700 border-red-200';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg no-print">
                <div className="flex items-center gap-4">
                    {settings.logo ? (
                        <img src={`http://localhost:5000${settings.logo}`} alt="Logo" className="h-12 w-auto object-contain" />
                    ) : (
                        <img src="/default-logo.png" alt="Incident Reporting System" className="h-12 w-auto object-contain" />
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                        <p className="text-slate-500 font-medium">Welcome back, {currentUser.username} <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 uppercase">{currentUser.role}</span></p>
                    </div>
                </div>
                <div className="flex items-center gap-3">

                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('incidents')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'incidents' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Incidents
                        </button>

                        {/* Tech/Admin/Exec Tabs */}
                        {['admin', 'tech'].includes(currentUser.role) && (
                            <>
                                <button
                                    onClick={() => setActiveTab('users')}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'users' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Users
                                </button>
                                <button
                                    onClick={() => setActiveTab('archive')}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'archive' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Archive
                                </button>
                            </>
                        )}

                        {/* Admin Only Tabs */}
                        {currentUser.role === 'admin' && (
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'settings' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Settings
                            </button>
                        )}
                    </div>

                    <Button variant="secondary" onClick={handleLogout} className="text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100">
                        <LogOut size={18} className="mr-2" /> Logout
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'incidents' ? (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white/50 p-4 rounded-xl border border-white/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-slate-800">Recent Reports</h2>
                            <span className="bg-white px-3 py-1 rounded-full text-sm font-medium text-slate-500 border border-slate-200">
                                {incidents.length} Total
                            </span>
                            {selectedIds.length > 1 && currentUser.role === 'admin' && (
                                <Button onClick={handleMerge} className="ml-4 bg-purple-600 hover:bg-purple-700 text-white border-none animate-in fade-in slide-in-from-left-4">
                                    <Merge size={18} className="mr-2" />
                                    Merge {selectedIds.length} Selected
                                </Button>
                            )}
                        </div>

                        <div className="flex gap-2 no-print">
                            {['admin', 'exec'].includes(currentUser.role) && (
                                <Button onClick={() => window.print()} variant="secondary" className="flex items-center gap-2 shadow-sm">
                                    <Printer size={18} /> Print View
                                </Button>
                            )}
                            <Button onClick={() => setIsSearchOpen(true)} className="flex items-center gap-2 shadow-sm">
                                <Search size={18} /> Search Incidents
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {incidents.map((incident) => (
                            <div key={incident.id} className={`relative bg-white/80 backdrop-blur-sm rounded-xl border shadow-lg overflow-hidden hover:shadow-xl transition-all flex flex-col group ${selectedIds.includes(incident.id) ? 'ring-2 ring-brand-500 border-brand-500 transform scale-[1.02]' : 'border-white/20'}`}>

                                {/* Admin Selection Checkbox */}
                                {currentUser.role === 'admin' && (
                                    <div className="absolute top-3 right-3 z-10 no-print">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleSelection(incident.id); }}
                                            className={`p-1 rounded bg-white/80 backdrop-blur shadow-sm hover:scale-110 transition-transform ${selectedIds.includes(incident.id) ? 'text-brand-600' : 'text-slate-300'}`}
                                        >
                                            {selectedIds.includes(incident.id) ? <CheckSquare size={24} /> : <Square size={24} />}
                                        </button>
                                    </div>
                                )}

                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(incident.status)}`}>
                                            {incident.status}
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(incident.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-900 mb-1 line-clamp-1 group-hover:text-brand-600 transition-colors">{incident.nature_of_incident}</h3>
                                    <p className="text-sm text-slate-500 mb-4">{incident.student_names}</p>
                                    <p className="text-sm text-slate-600 line-clamp-3 mb-4">{incident.what_happened}</p>
                                </div>
                                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                    <div className="text-xs text-slate-500">
                                        {incident.staff_intervention_details ? (
                                            <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle size={12} /> Intervened</span>
                                        ) : (
                                            <span>No intervention yet</span>
                                        )}
                                    </div>
                                    <div className="flex gap-2 no-print">
                                        <Button variant="ghost" className="!py-1.5 !px-2 !text-xs text-slate-400 hover:text-slate-600" onClick={() => window.open(`/print/${incident.id}`, '_blank')} title="Print Report">
                                            <Printer size={14} />
                                        </Button>

                                        {/* DELETE Button for Exec/Admin */}
                                        {['admin', 'exec'].includes(currentUser.role) && (
                                            <Button variant="ghost" className="!py-1.5 !px-2 !text-xs text-red-500 hover:bg-red-50" onClick={() => handleDelete(incident.id)}>
                                                <Trash2 size={14} />
                                            </Button>
                                        )}
                                        <Button variant="secondary" className="!py-1.5 !px-3 !text-xs" onClick={() => setSelectedIncident(incident)}>
                                            <Eye size={14} className="mr-1.5" /> View
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : activeTab === 'users' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Create User Form - Visible to Admin & Tech */}
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg p-6 h-fit">
                        <div className="flex items-center gap-2 mb-6 text-brand-700">
                            <Users size={24} />
                            <h3 className="text-xl font-bold">Create User</h3>
                        </div>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <Input
                                label="Username"
                                value={newUser.username}
                                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                required
                            />
                            <Input
                                label="Password"
                                type="password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                required
                            />
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-slate-700">Role</label>
                                <select
                                    className="w-full rounded-lg border border-slate-200 bg-white/50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="user">Staff User</option>
                                    <option value="exec">Executive (Delete Access)</option>
                                    <option value="tech">Tech (Manage Users)</option>
                                    {currentUser.role === 'admin' && <option value="admin">Administrator</option>}
                                </select>
                            </div>
                            <Button type="submit" className="w-full mt-2">
                                <Plus size={18} className="mr-2" /> Create Account
                            </Button>
                            {userMsg && <p className="text-sm text-center text-brand-600 mt-2 font-medium bg-brand-50 p-2 rounded-lg">{userMsg}</p>}
                        </form>
                    </div>

                    {/* Users List */}
                    <div className="lg:col-span-2 bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">System Users</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500 text-sm">
                                        <th className="pb-3 font-semibold">Username</th>
                                        <th className="pb-3 font-semibold">Role</th>
                                        <th className="pb-3 font-semibold">Created</th>
                                        <th className="pb-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map(u => (
                                        <tr key={u.id} className="group hover:bg-slate-50 transition-colors">
                                            <td className="py-4 text-slate-900 font-medium">{u.username}</td>
                                            <td className="py-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'tech' ? 'bg-blue-100 text-blue-700' : u.role === 'exec' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="py-4 text-slate-500 text-sm">{new Date(u.created_at).toLocaleDateString()}</td>
                                            <td className="py-4 text-right">
                                                <Button variant="secondary" onClick={() => handleResetPassword(u.id)} className="!py-1.5 !px-3 !text-xs border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-200">
                                                    <Key size={14} className="mr-1.5" /> Reset Pass
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'archive' ? (
                // --- ARCHIVE TAB ---
                <div className="space-y-6">
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Trash2 size={24} /></div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Archived Incidents</h3>
                                <p className="text-slate-500 text-sm">Deleted incidents are stored here.</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500 text-sm">
                                        <th className="pb-3 font-semibold">Date</th>
                                        <th className="pb-3 font-semibold">Title</th>
                                        <th className="pb-3 font-semibold">Archived By</th>
                                        <th className="pb-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {archivedIncidents.map(inc => (
                                        <tr key={inc.id} className="group hover:bg-slate-50 transition-colors">
                                            <td className="py-4 text-slate-500">{new Date(inc.incident_date_time).toLocaleDateString()}</td>
                                            <td className="py-4 font-medium text-slate-900">{inc.event_title} ({inc.nature_of_incident})</td>
                                            <td className="py-4 text-slate-600">
                                                {inc.archived_by} <br />
                                                <span className="text-xs text-slate-400">{new Date(inc.archived_at).toLocaleString()}</span>
                                            </td>
                                            <td className="py-4 text-right">
                                                <Button onClick={() => handleRestore(inc.id)} className="!py-1.5 !px-3 !text-xs bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                                                    Restore
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {archivedIncidents.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-slate-400">No archived incidents found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                // --- SETTINGS TAB ---
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg p-8">
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Settings size={24} /></div>
                            <h3 className="text-xl font-bold text-slate-800">Site Branding</h3>
                        </div>

                        <div className="space-y-8">
                            {/* Logo Upload */}
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Logo Image</label>
                                <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-white hover:border-brand-400 transition-colors text-center">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleUpload(e, 'logo')}
                                        className="hidden"
                                        id="logo-upload"
                                    />
                                    <label htmlFor="logo-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                        <Upload size={32} className="text-slate-400" />
                                        <span className="text-brand-600 font-bold hover:underline">Click to Upload Logo</span>
                                        <span className="text-xs text-slate-500">PNG, JPG, SVG (Max 2MB)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Favicon Upload */}
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Favicon</label>
                                <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-white hover:border-brand-400 transition-colors text-center">
                                    <input
                                        type="file"
                                        accept="image/x-icon,image/png"
                                        onChange={(e) => handleUpload(e, 'favicon')}
                                        className="hidden"
                                        id="favicon-upload"
                                    />
                                    <label htmlFor="favicon-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                        <Upload size={32} className="text-slate-400" />
                                        <span className="text-brand-600 font-bold hover:underline">Click to Upload Favicon</span>
                                        <span className="text-xs text-slate-500">ICO, PNG (32x32 recommended)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-2xl shadow-xl p-8 flex flex-col justify-center items-center text-center space-y-8">
                        <div>
                            <h3 className="text-2xl font-bold mb-4">Logo Preview</h3>
                            <div className="p-8 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm flex justify-center">
                                {settings?.logo ? (
                                    <img src={`http://localhost:5000${settings.logo}`} alt="Logo Preview" className="h-16 object-contain" />
                                ) : (
                                    <span className="text-sm font-mono text-slate-400">No Custom Logo</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mb-4">Favicon Preview</h3>
                            <div className="p-8 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm flex justify-center">
                                {settings?.favicon ? (
                                    <img src={`http://localhost:5000${settings.favicon}`} alt="Favicon Preview" className="h-12 w-12 object-contain" />
                                ) : (
                                    <span className="text-sm font-mono text-slate-400">No Custom Favicon</span>
                                )}
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm">Refresh the page after uploading to see changes applied site-wide.</p>
                    </div>
                </div>
            )}

            {selectedIncident && (
                <InterventionModal
                    incident={selectedIncident}
                    onClose={() => setSelectedIncident(null)}
                    onUpdate={() => { fetchIncidents(); setSelectedIncident(null); }}
                />
            )}

            <SearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                incidents={incidents}
                onSelectIncident={(incident) => setSelectedIncident(incident)}
            />
        </div>
    );
};
