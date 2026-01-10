import React, { useState, useEffect } from 'react';
import { X, Search, Clock, CheckCircle, ChevronRight, Printer, Square, CheckSquare } from 'lucide-react';

export const SearchModal = ({ isOpen, onClose, incidents, onSelectIncident }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredIncidents, setFilteredIncidents] = useState([]);
    const [selectedForPrint, setSelectedForPrint] = useState([]); // New state for print selection
    const inputRef = React.useRef(null);

    // Focus input on open
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 50);
        }
    }, [isOpen]);

    // Search Logic
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredIncidents([]);
            return;
        }

        const terms = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);
        const results = incidents.filter(incident =>
            terms.every(term =>
                (incident.event_title && incident.event_title.toLowerCase().includes(term)) ||
                (incident.student_names && incident.student_names.toLowerCase().includes(term)) ||
                (incident.nature_of_incident && incident.nature_of_incident.toLowerCase().includes(term)) ||
                (incident.leader_name && incident.leader_name.toLowerCase().includes(term)) ||
                (incident.staff_intervention_by && incident.staff_intervention_by.toLowerCase().includes(term))
            )
        );
        setFilteredIncidents(results);
    }, [searchQuery, incidents]);

    // Role check helper (can be moved to context/hook in refactor)
    const canPrint = ['admin', 'exec'].includes(localStorage.getItem('role'));

    const togglePrintSelection = (id) => {
        if (selectedForPrint.includes(id)) {
            setSelectedForPrint(prev => prev.filter(pid => pid !== id));
        } else {
            setSelectedForPrint(prev => [...prev, id]);
        }
    };

    const handleBatchPrint = () => {
        const url = `/print-list?ids=${selectedForPrint.join(',')}`;
        window.open(url, '_blank');
    };

    if (!isOpen) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-green-100 text-green-700 border-green-200';
            case 'In Progress': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-red-100 text-red-700 border-red-200';
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-in zoom-in-95 slide-in-from-top-4 duration-200">
                {/* Search Header */}
                <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white sticky top-0 z-10">
                    <Search className="text-slate-400" size={24} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search students, events, or staff..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 text-lg outline-none placeholder:text-slate-400 text-slate-800"
                    />
                    <button
                        onClick={onClose}
                        className="p-1 px-2 border border-slate-200 rounded text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                        ESC
                    </button>
                    {canPrint && selectedForPrint.length > 0 && (
                        <button
                            onClick={handleBatchPrint}
                            className="ml-2 px-3 py-1 bg-slate-800 text-white rounded text-sm font-bold flex items-center gap-2 hover:bg-slate-900 animate-in fade-in slide-in-from-right-2"
                        >
                            <Printer size={16} /> Print ({selectedForPrint.length})
                        </button>
                    )}
                </div>

                {/* Results List */}
                <div className="overflow-y-auto p-2 bg-slate-50/50 min-h-[300px]">
                    {searchQuery.trim() === '' ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 opacity-60">
                            <Search size={48} className="mb-4 stroke-1" />
                            <p className="text-sm">Type to start searching...</p>
                        </div>
                    ) : filteredIncidents.length > 0 ? (
                        <div className="space-y-2">
                            <div className="px-2 py-1 text-xs font-bold uppercase text-slate-400 tracking-wider">
                                Found {filteredIncidents.length} results
                            </div>
                            {filteredIncidents.map(incident => (
                                <div
                                    key={incident.id}
                                    className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all group flex items-start gap-4"
                                >
                                    {/* Checkbox for Admin/Exec */}
                                    {canPrint && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); togglePrintSelection(incident.id); }}
                                            className={`mt-1 ${selectedForPrint.includes(incident.id) ? 'text-brand-600' : 'text-slate-300 hover:text-slate-400'}`}
                                        >
                                            {selectedForPrint.includes(incident.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                                        </button>
                                    )}

                                    <div
                                        className="flex-1 cursor-pointer"
                                        onClick={() => {
                                            onSelectIncident(incident);
                                            onClose();
                                        }}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(incident.status)}`}>
                                                    {incident.status}
                                                </span>
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Clock size={10} />
                                                    {new Date(incident.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-slate-800 group-hover:text-brand-600 transition-colors">{incident.nature_of_incident}</h4>
                                            <p className="text-sm text-slate-500 line-clamp-1">{incident.student_names}</p>
                                        </div>
                                        <div className="text-slate-300 group-hover:text-brand-400 self-center pointer-events-none">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-8 text-slate-500">
                            <p>No results found for "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Click backdrop to close */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
};
