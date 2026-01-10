import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Lock, User } from 'lucide-react';

export const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [logo, setLogo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:5000/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.data?.logo) setLogo(data.data.logo);
            })
            .catch(err => console.error("Failed to load branding:", err));
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.user.role); // Store role for UI logic
                localStorage.setItem('username', data.user.username);
                navigate('/dashboard');
            } else {
                setError(data.message || 'Invalid credentials');
            }
        } catch (err) {
            setError('Login failed. Ensure server is running.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] px-4">
            <div className="w-full max-w-md bg-white/90 backdrop-blur-xl shadow-2xl shadow-brand-900/10 rounded-3xl border border-white/50 p-10 ring-1 ring-slate-900/5">
                <div className="flex flex-col items-center mb-8">
                    {logo ? (
                        <img
                            src={`http://localhost:5000${logo}`}
                            alt="Organization Logo"
                            className="h-20 w-auto object-contain mb-6 animate-in zoom-in duration-300"
                        />
                    ) : (
                        <img
                            src="/default-logo.png"
                            alt="Incident Reporting System"
                            className="h-20 w-auto object-contain mb-6 animate-in zoom-in duration-300"
                        />
                    )}
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Staff Portal</h2>
                    <p className="text-slate-500 mt-2 text-center">Enter your credentials to access the secure dashboard</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                            <User size={18} />
                        </div>
                        <Input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                            className="pl-10"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                            <Lock size={18} />
                        </div>
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="pl-10"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 text-center font-medium animate-in fade-in slide-in-from-top-1">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full py-3.5 text-lg font-bold shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all transform hover:-translate-y-0.5">
                        Login to Dashboard
                    </Button>
                </form>
            </div>
        </div>
    );
};
