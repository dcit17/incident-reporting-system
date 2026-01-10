import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ReportForm } from './pages/ReportForm';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PrintView } from './pages/PrintView';
import { PrintListView } from './pages/PrintListView';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout><ReportForm /></Layout>} />
                <Route path="/login" element={<Layout><Login /></Layout>} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Layout><Dashboard /></Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/print/:id"
                    element={
                        <ProtectedRoute>
                            <PrintView />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/print-list"
                    element={
                        <ProtectedRoute>
                            <PrintListView />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
