import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Printer } from 'lucide-react';

export const PrintListView = () => {
    const [searchParams] = useSearchParams();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchIncidents = async () => {
            const ids = searchParams.get('ids')?.split(',') || [];
            if (ids.length === 0) {
                setLoading(false);
                return;
            }

            const token = localStorage.getItem('token');
            const fetched = [];

            // Fetch incidents one by one (simpler than building a new bulk API endpoint for now)
            // In a larger app, a bulk-fetch endpoint would be better.
            for (const id of ids) {
                try {
                    const res = await fetch(`http://localhost:5000/api/incidents/${id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (data.success) {
                        fetched.push(data.data);
                    }
                } catch (err) {
                    console.error("Error fetching incident", id, err);
                }
            }

            setIncidents(fetched);
            setLoading(false);

            // Auto-trigger print when ready
            if (fetched.length > 0) {
                setTimeout(() => window.print(), 800);
            }
        };

        fetchIncidents();
    }, [searchParams]);

    if (loading) return <div className="p-10 text-center">Loading reports...</div>;

    if (incidents.length === 0) return <div className="p-10 text-center">No records found for the selected IDs.</div>;

    return (
        <div className="max-w-[1000px] mx-auto p-8 bg-white text-black text-sm print-width-full">
            <div className="flex justify-between items-center mb-8 border-b-2 border-black pb-4">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-wide">Incident Report Summary</h1>
                    <p className="text-slate-600">Generated on {new Date().toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold">{incidents.length} Records</div>
                </div>
            </div>

            <div className="space-y-6">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-black text-xs uppercase text-slate-500">
                            <th className="py-2 pr-4">Date</th>
                            <th className="py-2 pr-4">Type</th>
                            <th className="py-2 pr-4">Students</th>
                            <th className="py-2 pr-4">Location</th>
                            <th className="py-2 pr-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                        {incidents.map((incident) => (
                            <React.Fragment key={incident.id}>
                                <tr className="break-inside-avoid">
                                    <td className="py-3 pr-4 align-top font-medium whitespace-nowrap">
                                        {new Date(incident.incident_date_time).toLocaleDateString()}
                                        <br />
                                        <span className="text-xs text-slate-500">{new Date(incident.incident_date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </td>
                                    <td className="py-3 pr-4 align-top font-bold">{incident.nature_of_incident}</td>
                                    <td className="py-3 pr-4 align-top">{incident.student_names}</td>
                                    <td className="py-3 pr-4 align-top">{incident.location}</td>
                                    <td className="py-3 pr-4 align-top">
                                        <span className="border border-slate-400 px-1 rounded text-xs">{incident.status}</span>
                                    </td>
                                </tr>
                                <tr className="border-b border-slate-300 break-inside-avoid">
                                    <td colSpan="5" className="pb-4 pt-1 text-slate-600 italic">
                                        "{incident.what_happened}"
                                    </td>
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 text-center no-print">
                <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 text-white rounded flex items-center gap-2 mx-auto hover:bg-black">
                    <Printer size={16} /> Print Now
                </button>
            </div>
        </div>
    );
};
