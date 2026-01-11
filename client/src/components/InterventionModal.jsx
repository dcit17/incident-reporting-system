import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';
import { TextArea, Input } from './ui/Input';
import { X, Check, Send, User } from 'lucide-react';

export const InterventionModal = ({ incident, onClose, onUpdate }) => {
    const [status, setStatus] = useState(incident.status);
    const [newNote, setNewNote] = useState('');
    const [history, setHistory] = useState(incident.staff_intervention_details || '');
    const logEndRef = useRef(null);

    // Scroll to bottom of log on open
    useEffect(() => {
        if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        const username = localStorage.getItem('username') || 'Unknown Staff';
        const timestamp = new Date().toLocaleString();
        const entry = `[${timestamp}] ${username}:\n${newNote.trim()}\n\n`;
        const updatedHistory = history + entry;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/incidents/${incident.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    staff_intervention_details: updatedHistory,
                    staff_intervention_by: username, // Last updated by
                    status: status
                })
            });

            if (res.ok) {
                setHistory(updatedHistory);
                setNewNote('');
                onUpdate(); // Refresh parent list
                // Scroll to bottom
                setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            } else {
                alert("Failed to add note.");
            }
        } catch (err) {
            console.error("Failed to update", err);
            alert("Error connecting to server.");
        }
    };

    const handleStatusChange = async (e) => {
        const newStatus = e.target.value;
        setStatus(newStatus);
        // Auto-save status change
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/incidents/${incident.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });
            onUpdate();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-white shrink-0">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-slate-800">Incident #{incident.id}</h2>
                            <select
                                value={status}
                                onChange={handleStatusChange}
                                className={`text-sm font-medium px-3 py-1 rounded-full border focus:outline-none focus:ring-2 focus:ring-offset-1 ${status === 'Resolved' ? 'bg-green-100 text-green-700 border-green-200 focus:ring-green-500' :
                                    status === 'In Progress' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 focus:ring-yellow-500' :
                                        'bg-red-100 text-red-700 border-red-200 focus:ring-red-500'
                                    }`}
                            >
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{new Date(incident.created_at).toLocaleString()} • {incident.location}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left: Incident Details (Scrollable) */}
                    <div className="w-1/3 border-r bg-slate-50/50 overflow-y-auto p-6 space-y-6">
                        <div>
                            <h4 className="text-xs uppercase font-bold text-slate-400 mb-2">Student(s)</h4>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 font-medium text-slate-800 shadow-sm">
                                {incident.student_names}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs uppercase font-bold text-slate-400 mb-2">Nature & Location</h4>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-700 shadow-sm space-y-1">
                                <p><span className="font-medium">Nature:</span> {incident.nature_of_incident}</p>
                                <p><span className="font-medium">Location:</span> {incident.location}</p>
                                <p><span className="font-medium">Leaders:</span> {incident.leaders_present}</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs uppercase font-bold text-slate-400 mb-2">Description</h4>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-700 shadow-sm whitespace-pre-wrap leading-relaxed">
                                {incident.what_happened}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs uppercase font-bold text-slate-400 mb-2">Initial Action</h4>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-700 shadow-sm whitespace-pre-wrap leading-relaxed">
                                {incident.initial_action_taken}
                            </div>
                        </div>
                    </div>

                    {/* Right: Activity Log (Flex Column) */}
                    <div className="flex-1 flex flex-col bg-white">
                        {/* Log Display */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                                <div className="p-1.5 bg-brand-100 text-brand-600 rounded-md"><Check size={16} /></div>
                                Activity Log
                            </h3>

                            {history ? (
                                <div className="space-y-4">
                                    {history.split('\n\n').filter(Boolean).map((entry, i) => {
                                        // Simple parsing of [Timestamp] User: Message
                                        const match = entry.match(/^\[(.*?)\] (.*?):\n([\s\S]*)/);
                                        if (match) {
                                            const [_, time, user, msg] = match;
                                            return (
                                                <div key={i} className="flex flex-col mb-2">
                                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm w-full">
                                                        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{msg}</p>
                                                        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                                                            <User size={12} className="text-slate-400" />
                                                            <span className="text-xs font-bold text-slate-600">{user}</span>
                                                            <span className="text-xs text-slate-400">• {time}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        // Fallback for old/unformatted texts
                                        return (
                                            <div key={i} className="bg-white border border-slate-200 p-4 rounded-xl text-sm text-slate-600 shadow-sm mb-2">
                                                {entry}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-60">
                                    <div className="p-4 bg-slate-100 rounded-full"><Check size={32} /></div>
                                    <p>No intervention notes yet.</p>
                                </div>
                            )}
                            <div ref={logEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t bg-white sticky bottom-0 z-10">
                            <div className="flex gap-3 items-end">
                                <TextArea
                                    placeholder="Add a new note (e.g., Phoned parents, Student picked up)..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    className="min-h-[80px] text-sm"
                                    autoFocus
                                />
                                <Button onClick={handleAddNote} className="h-[80px] px-6 flex flex-col items-center justify-center gap-1 shadow-brand-500/20 shadow-lg">
                                    <Send size={20} />
                                    <span className="text-xs font-bold">SEND</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
