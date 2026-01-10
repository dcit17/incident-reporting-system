import React, { useState } from 'react';
import { Input, TextArea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { CheckCircle2, AlertCircle, Plus, Trash2, UserPlus } from 'lucide-react';

// Component for a dynamic person row
const PersonRow = ({ person, index, onChange, onRemove, showRemove }) => (
    <div className="flex gap-4 items-center animate-in slide-in-from-left-2 duration-200">
        <div className="grid grid-cols-2 gap-4 flex-1">
            <Input
                placeholder="First Name"
                value={person.firstName}
                onChange={(e) => onChange(index, 'firstName', e.target.value)}
                className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                required
            />
            <Input
                placeholder="Last Name"
                value={person.lastName}
                onChange={(e) => onChange(index, 'lastName', e.target.value)}
                className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                required
            />
        </div>
        {showRemove && (
            <button type="button" onClick={() => onRemove(index)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remove">
                <Trash2 size={18} />
            </button>
        )}
    </div>
);

// Styled Form Row Component
const FormRow = ({ label, children, alignTop = false }) => (
    <div className={`grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 ${alignTop ? 'items-start pt-2' : 'items-center'}`}>
        <div className="md:col-span-4 lg:col-span-3 text-left md:text-right">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">{label}</label>
        </div>
        <div className="md:col-span-8 lg:col-span-9">
            {children}
        </div>
    </div>
);


export const ReportForm = () => {
    // Helper to create empty person object
    const createPerson = () => ({ firstName: '', lastName: '' });

    const [formData, setFormData] = useState({
        incident_date: '',
        incident_time: '',
        event_title: '',
        location: '',
        phone_number: '',
        address: '',
        nature_of_incident: '',
        what_happened: '',
        why_did_it_happen: '',
        initial_action_taken: '',
        parents_contacted: 0,
        parent_response: '',
        leader_name: '',
    });

    // Separate state for dynamic lists
    const [students, setStudents] = useState([createPerson()]);
    const [witnesses, setWitnesses] = useState([createPerson()]);
    const [leaders, setLeaders] = useState([createPerson()]);

    const [status, setStatus] = useState('idle');

    // Generic change handler for flat data
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        }));
    };

    // Handler for dynamic person lists
    const handlePersonChange = (index, field, value, list, setList) => {
        const newList = [...list];
        newList[index][field] = value;
        setList(newList);
    };

    const addPerson = (setList) => setList(prev => [...prev, createPerson()]);

    const removePerson = (index, list, setList) => {
        if (list.length > 1) {
            setList(prev => prev.filter((_, i) => i !== index));
        }
    };

    // Helper to format person list to string for backend
    const formatPeopleToString = (list) => {
        return list
            .filter(p => p.firstName.trim() || p.lastName.trim())
            .map(p => `${p.firstName.trim()} ${p.lastName.trim()}`.trim())
            .join(', ');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');

        // Combine Date & Time
        const incident_date_time = `${formData.incident_date}T${formData.incident_time}`;

        const payload = {
            ...formData,
            incident_date_time, // Send combined field
            student_names: formatPeopleToString(students),
            leaders_present: formatPeopleToString(leaders),
            witness_name: formatPeopleToString(witnesses)
        };

        // Remove separate fields if backend doesn't want them (it typically ignores extras, but cleaner to remove)
        delete payload.incident_date;
        delete payload.incident_time;

        try {
            const response = await fetch('http://localhost:5000/api/incidents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Failed to submit');

            setStatus('success');
            setFormData({
                incident_date: '',
                incident_time: '',
                event_title: '',
                location: '',
                phone_number: '',
                address: '',
                nature_of_incident: '',
                what_happened: '',
                why_did_it_happen: '',
                initial_action_taken: '',
                parents_contacted: 0,
                parent_response: '',
                leader_name: '',
            });
            setStudents([createPerson()]);
            setWitnesses([createPerson()]);
            setLeaders([createPerson()]);
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="max-w-lg mx-auto mt-20 p-10 bg-white rounded-3xl shadow-xl shadow-brand-900/5 text-center border border-slate-100">
                <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                    <CheckCircle2 className="text-green-600" size={40} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Report Submitted</h2>
                <p className="text-slate-600 mb-8 text-lg">Thank you for submitting the incident report. It has been logged securely.</p>
                <Button onClick={() => setStatus('idle')} className="w-full py-3">Submit Another Report</Button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-12 text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">Incident Report</h1>
                <p className="text-slate-600 text-lg max-w-2xl mx-auto">Please complete this form instantly after any notable incident.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-xl shadow-2xl shadow-brand-900/5 rounded-3xl border border-white/50 p-8 md:p-12 space-y-12 relative ring-1 ring-slate-900/5">

                {/* Section 1: Basic Info */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-brand-500/20">1</div>
                        <h3 className="text-2xl font-bold text-slate-900">Incident Details</h3>
                    </div>

                    <div className="space-y-6">
                        <FormRow label="Date & Time">
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    name="incident_date"
                                    type="date"
                                    value={formData.incident_date}
                                    onChange={handleChange}
                                    required
                                    className="w-full"
                                />
                                <Input
                                    name="incident_time"
                                    type="time"
                                    value={formData.incident_time}
                                    onChange={handleChange}
                                    required
                                    className="w-full"
                                />
                            </div>
                        </FormRow>
                        <FormRow label="Event Title">
                            <Input name="event_title" value={formData.event_title} onChange={handleChange} placeholder="e.g. Youth Group" />
                        </FormRow>
                        <FormRow label="Location">
                            <Input name="location" value={formData.location} onChange={handleChange} placeholder="Specific room or area" required />
                        </FormRow>
                    </div>
                </section>

                {/* Section 2: Personal Info */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-brand-500/20">2</div>
                        <h3 className="text-2xl font-bold text-slate-900">Involved Parties</h3>
                    </div>

                    <div className="space-y-6">
                        <FormRow label="Students Involved" alignTop>
                            <div className="space-y-3">
                                {students.map((person, index) => (
                                    <PersonRow
                                        key={index}
                                        person={person}
                                        index={index}
                                        onChange={(idx, f, v) => handlePersonChange(idx, f, v, students, setStudents)}
                                        onRemove={(idx) => removePerson(idx, students, setStudents)}
                                        showRemove={students.length > 1}
                                    />
                                ))}
                                <Button type="button" variant="ghost" onClick={() => addPerson(setStudents)} className="text-brand-600 hover:bg-brand-50 hover:text-brand-700 pl-0 mt-2">
                                    <Plus size={16} className="mr-1" /> Add Another Student
                                </Button>
                            </div>
                        </FormRow>

                        <FormRow label="Contact Info">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="Phone Number" />
                                <Input name="address" value={formData.address} onChange={handleChange} placeholder="Address (Optional)" />
                            </div>
                        </FormRow>
                    </div>
                </section>

                {/* Section 3: The Incident */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-brand-500/20">3</div>
                        <h3 className="text-2xl font-bold text-slate-900">Description</h3>
                    </div>

                    <div className="space-y-6">
                        <FormRow label="Nature of Incident">
                            <Input name="nature_of_incident" value={formData.nature_of_incident} onChange={handleChange} required placeholder="e.g. Injury, Argument, Property Damage" />
                        </FormRow>

                        <FormRow label="Leaders Present" alignTop>
                            <div className="space-y-3">
                                {leaders.map((person, index) => (
                                    <PersonRow
                                        key={index}
                                        person={person}
                                        index={index}
                                        onChange={(idx, f, v) => handlePersonChange(idx, f, v, leaders, setLeaders)}
                                        onRemove={(idx) => removePerson(idx, leaders, setLeaders)}
                                        showRemove={leaders.length > 1}
                                    />
                                ))}
                                <Button type="button" variant="ghost" onClick={() => addPerson(setLeaders)} className="text-brand-600 hover:bg-brand-50 hover:text-brand-700 pl-0 mt-2">
                                    <UserPlus size={16} className="mr-1" /> Add Leader
                                </Button>
                            </div>
                        </FormRow>

                        <FormRow label="What Happened?" alignTop>
                            <TextArea name="what_happened" value={formData.what_happened} onChange={handleChange} required rows={5} placeholder="Provide a detailed, objective account..." />
                        </FormRow>
                        <FormRow label="Why it Happened?" alignTop>
                            <TextArea name="why_did_it_happen" value={formData.why_did_it_happen} onChange={handleChange} rows={3} placeholder="Contributing factors..." />
                        </FormRow>
                        <FormRow label="Action Taken" alignTop>
                            <TextArea name="initial_action_taken" value={formData.initial_action_taken} onChange={handleChange} required rows={3} placeholder="Immediate response..." />
                        </FormRow>
                    </div>
                </section>

                {/* Section 4: Follow Up */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-brand-500/20">4</div>
                        <h3 className="text-2xl font-bold text-slate-900">Follow Up</h3>
                    </div>

                    <div className="space-y-6">
                        <FormRow label="Notification">
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 w-full">
                                <input type="checkbox" id="parents_contacted" name="parents_contacted" checked={formData.parents_contacted === 1} onChange={handleChange} className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer" />
                                <label htmlFor="parents_contacted" className="font-medium text-slate-900 cursor-pointer select-none">Parents/Guardians were contacted</label>
                            </div>
                        </FormRow>

                        {formData.parents_contacted === 1 && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <FormRow label="Response" alignTop>
                                    <TextArea name="parent_response" value={formData.parent_response} onChange={handleChange} placeholder="Summary of conversation..." />
                                </FormRow>
                            </div>
                        )}
                    </div>
                </section>

                {/* Section 5: Sign-off */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-brand-500/20">5</div>
                        <h3 className="text-2xl font-bold text-slate-900">Sign-off</h3>
                    </div>

                    <div className="space-y-6">
                        <FormRow label="Submitted By">
                            <Input name="leader_name" value={formData.leader_name} onChange={handleChange} required placeholder="Your Full Name" />
                        </FormRow>

                        <FormRow label="Witnesses" alignTop>
                            <div className="space-y-3">
                                {witnesses.map((person, index) => (
                                    <PersonRow
                                        key={index}
                                        person={person}
                                        index={index}
                                        onChange={(idx, f, v) => handlePersonChange(idx, f, v, witnesses, setWitnesses)}
                                        onRemove={(idx) => removePerson(idx, witnesses, setWitnesses)}
                                        showRemove={witnesses.length > 1}
                                    />
                                ))}
                                <Button type="button" variant="ghost" onClick={() => addPerson(setWitnesses)} className="text-brand-600 hover:bg-brand-50 hover:text-brand-700 pl-0 mt-2">
                                    <Plus size={16} className="mr-1" /> Add Witness
                                </Button>
                            </div>
                        </FormRow>
                    </div>
                </section>

                <div className="pt-8">
                    <Button type="submit" className="w-full py-4 text-xl font-bold shadow-2xl shadow-brand-500/30 hover:shadow-brand-500/40 transition-all transform hover:-translate-y-1 hover:scale-[1.01]" disabled={status === 'submitting'}>
                        {status === 'submitting' ? 'Submitting Report...' : 'Submit Incident Report'}
                    </Button>
                    {status === 'error' && (
                        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center justify-center gap-2 border border-red-100 animate-in fade-in">
                            <AlertCircle size={20} />
                            <span className="font-medium">Something went wrong. Please check your connection and try again.</span>
                        </div>
                    )}
                </div>
            </form>

            <div className="mt-12 text-center text-slate-400 text-sm pb-12 font-medium">
                &copy; {new Date().getFullYear()} PAC Incident Reporting System. <br />Confidential Document.
            </div>
        </div>
    );
};

