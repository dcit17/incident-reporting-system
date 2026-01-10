import React from 'react';
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Layout = ({ children }) => {
    const [logoUrl, setLogoUrl] = React.useState(null);

    React.useEffect(() => {
        // Fetch logo settings
        fetch('http://localhost:5000/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.data && data.data.logo) {
                    setLogoUrl(`http://localhost:5000${data.data.logo}`);
                }
            })
            .catch(err => console.error("Failed to load branding", err));
    }, []);

    return (
        <div className="min-h-screen relative flex flex-col">
            {/* Navbar */}
            <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-2">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
                            ) : (
                                <div className="p-2 bg-brand-600 rounded-lg text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                </div>
                            )}
                            <span className="text-xl font-bold bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
                                PAC Intervention <span className="font-extrabold">Report</span>
                            </span>
                        </div>
                        <div className="hidden md:flex items-center gap-6">
                            <a href="/" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Report Incident</a>
                            <a href="/login" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Staff Login</a>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                {children}
            </main>
        </div>
    );
};
