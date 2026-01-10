import React from 'react';

export const Input = ({ label, type = 'text', className, ...props }) => {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
            <input
                type={type}
                className="w-full rounded-lg border border-slate-200 bg-white/50 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                {...props}
            />
        </div>
    );
};

export const TextArea = ({ label, className, ...props }) => {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
            <textarea
                className="w-full rounded-lg border border-slate-200 bg-white/50 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 min-h-[100px]"
                {...props}
            />
        </div>
    );
};
