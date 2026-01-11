import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export const PrintView = () => {
    const { id } = useParams();
    const [incident, setIncident] = useState(null);

    useEffect(() => {
        const fetchIncident = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`/api/incidents/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setIncident(data.data);
                    // Auto-trigger print after a short delay to ensure rendering
                    setTimeout(() => window.print(), 500);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchIncident();
    }, [id]);

    if (!incident) return <div className="p-10 text-center">Loading report...</div>;

    const parseLog = (log) => {
        if (!log) return [];
        try { return JSON.parse(log); } catch { return []; }
    };

    const changes = parseLog(incident.staff_intervention_details);

    return (
        <div className="max-w-3xl mx-auto p-8 bg-white text-black print-container">
            <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
                <h1 className="text-3xl font-bold uppercase tracking-wide">Incident Report</h1>
                <p className="text-slate-600 mt-2">Confidential Record #{incident.id}</p>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-8 text-sm">
                <div>
                    <span className="block font-bold uppercase text-xs text-slate-500 mb-1">Date & Time</span>
                    <div className="font-medium text-lg">{new Date(incident.incident_date_time).toLocaleString()}</div>
                </div>
                <div>
                    <span className="block font-bold uppercase text-xs text-slate-500 mb-1">Status</span>
                    <div className="font-medium text-lg">{incident.status}</div>
                </div>
                <div>
                    <span className="block font-bold uppercase text-xs text-slate-500 mb-1">Location</span>
                    <div>{incident.location || 'N/A'}</div>
                </div>
                <div>
                    <span className="block font-bold uppercase text-xs text-slate-500 mb-1">Type</span>
                    <div>{incident.nature_of_incident}</div>
                </div>
            </div>

            <div className="space-y-8">
                <section>
                    <h3 className="text-sm font-bold uppercase border-b border-slate-300 pb-2 mb-3">Involved Parties</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="font-bold text-slate-700">Students:</span> {incident.student_names}
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Leaders Present:</span> {incident.leaders_present}
                        </div>
                        <div>
                            <span className="font-bold text-slate-700">Witnesses:</span> {incident.witness_name || 'None'}
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-sm font-bold uppercase border-b border-slate-300 pb-2 mb-3">Description of Events</h3>
                    <div className="prose prose-sm max-w-none">
                        <p className="mb-4"><strong className="text-slate-700">What Happened:</strong><br />{incident.what_happened}</p>
                        <p className="mb-4"><strong className="text-slate-700">Contributing Factors:</strong><br />{incident.why_did_it_happen || 'N/A'}</p>
                        <p><strong className="text-slate-700">Initial Action Taken:</strong><br />{incident.initial_action_taken}</p>
                    </div>
                </section>

                <section>
                    <h3 className="text-sm font-bold uppercase border-b border-slate-300 pb-2 mb-3">Follow Up / Notifications</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="font-bold text-slate-700">Parents Contacted:</span> {incident.parents_contacted ? 'Yes' : 'No'}
                        </div>
                        {incident.parents_contacted === 1 && (
                            <div className="col-span-2">
                                <span className="font-bold text-slate-700">Parent Response:</span> {incident.parent_response}
                            </div>
                        )}
                        <div>
                            <span className="font-bold text-slate-700">Reported By:</span> {incident.leader_name}
                        </div>
                    </div>
                </section>

                {changes.length > 0 && (
                    <section className="break-inside-avoid">
                        <h3 className="text-sm font-bold uppercase border-b border-slate-300 pb-2 mb-3">Staff Interventions</h3>
                        <div className="space-y-4">
                            {changes.map((log, i) => (
                                <div key={i} className="bg-slate-50 p-3 rounded border border-slate-200 text-sm">
                                    <p className="whitespace-pre-wrap">{log.note}</p>
                                    <div className="text-xs text-slate-500 mt-2 text-right">
                                        by {log.user} on {new Date(log.date).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <div className="mt-12 pt-8 border-t-2 border-slate-200 text-center text-xs text-slate-400">
                Printed from PAC Intervention System on {new Date().toLocaleString()}
            </div>
        </div>
    );
};
