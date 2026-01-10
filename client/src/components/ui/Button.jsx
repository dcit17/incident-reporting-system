import React from 'react';

export const Button = ({ children, variant = 'primary', className, ...props }) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
        primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
        secondary: "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm",
        danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        ghost: "hover:bg-slate-100 text-slate-700",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
