import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Sidebar from './components/Sidebar';
import Companies from './pages/Companies';
import CompanyDetails from './pages/CompanyDetails';
import Employees from './pages/Employees';
import WaitingStaff from './pages/WaitingStaff';
import Menu from './pages/Menu';
import Orders from './pages/Orders';
import Login from './pages/Login';
import { Loader2 } from 'lucide-react';
import './index.css';

const Dashboard = () => {
  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-title">
          <h1>Dashboard</h1>
          <p>Welcome to Savor Admin Dashboard</p>
        </div>
      </header>
      <div className="stats-grid">
        <div className="card">
          <h3 style={{ color: 'var(--text-sub)', fontSize: '0.875rem', fontWeight: 600 }}>Total Orders</h3>
          <p style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>1</p>
        </div>
        <div className="card">
          <h3 style={{ color: 'var(--text-sub)', fontSize: '0.875rem', fontWeight: 600 }}>Menu Items</h3>
          <p style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>6</p>
        </div>
        <div className="card">
          <h3 style={{ color: 'var(--text-sub)', fontSize: '0.875rem', fontWeight: 600 }}>Active Employees</h3>
          <p style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>9</p>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Initialize session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.warn('Unauthorized access: Role not found');
        await supabase.auth.signOut();
        setUserRole(null);
      } else {
        setUserRole(data.role);
      }
    } catch (err) {
      console.error('Error fetching user role:', err);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main)'
      }}>
        <Loader2 className="animate-spin" style={{ color: 'var(--primary)' }} size={48} />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          session && userRole ? <Navigate to="/" replace /> : <Login />
        } />
        <Route path="/*" element={
          session && userRole ? (
            <div className="app-container">
              <Sidebar role={userRole} />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/companies" element={<Companies role={userRole} />} />
                  <Route path="/companies/:id" element={<CompanyDetails role={userRole} />} />
                  <Route path="/employees" element={<Employees />} />
                  <Route path="/waiting-staff" element={<WaitingStaff />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/settings" element={<div className="page-container"><h1>Settings</h1></div>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </Router>
  );
}

export default App;
