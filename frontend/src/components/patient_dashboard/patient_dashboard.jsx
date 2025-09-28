import React, { useEffect, useState } from "react";
import './patient_dashboard.css';
import { getUser, getVitals, getAllAppointments, getFamilyMembers, getPatientAppointments } from '../../services/api';
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';

export default function PatientDashboard() {
  const [user, setUser] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    familyMembers: 0,
    vitalsRecords: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    async function loadUser() {
      try {
        const data = await getUser(token);
        setUser(data);
        sessionStorage.setItem("user_id", data.id);
      } catch (err) {
        sessionStorage.clear();
        alert("Please login again");
        navigate("/login");
      }
    }

    async function loadDashboardData() {
      try {
        const token = sessionStorage.getItem("token");
        
        // Load vitals for charts
        const vitalsData = await getVitals(token);
        setVitals(vitalsData);

        // Load appointments data
        const appointmentsData = await getPatientAppointments(token);
        
        // Load family members data
        const familyData = await getFamilyMembers(token);
        
        // Calculate upcoming appointments (assuming appointments have a date field)
        const today = new Date();
        const upcomingCount = appointmentsData.filter(apt => {
          const aptDate = new Date(apt.date || apt.appointment_date || apt.scheduled_date);
          return aptDate >= today;
        }).length;

        setDashboardStats({
          totalAppointments: appointmentsData.length,
          upcomingAppointments: upcomingCount,
          familyMembers: familyData.length,
          vitalsRecords: vitalsData.length
        });
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        // Set default values if API calls fail
        setDashboardStats({
          totalAppointments: 0,
          upcomingAppointments: 0,
          familyMembers: 0,
          vitalsRecords: vitals.length
        });
      } finally {
        setLoading(false);
      }
    }

    loadUser();
    loadDashboardData();
  }, [navigate]);

  const handleViewVitals = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const data = await getVitals(token);
      setVitals(data);
      setShowVitalsModal(true);
    } catch (err) {
      alert("Error fetching vitals");
      console.error(err);
    }
  };

  const logout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      sessionStorage.clear();
      navigate("/login");
    }
  };

  // Prepare enhanced chart data from vitals
  const chartData = vitals.map((vital, index) => {
    let systolic = 0;
    let diastolic = 0;
    
    // Handle different BP data formats
    if (vital.bp && typeof vital.bp === 'string' && vital.bp.includes('/')) {
      const bpParts = vital.bp.split('/');
      systolic = parseInt(bpParts[0]) || 0;
      diastolic = parseInt(bpParts[1]) || 0;
    } else if (vital.bp && typeof vital.bp === 'number') {
      systolic = vital.bp;
    } else if (vital.systolic && vital.diastolic) {
      systolic = parseInt(vital.systolic) || 0;
      diastolic = parseInt(vital.diastolic) || 0;
    }

    // Format date for better display
    let displayDate = `Reading ${index + 1}`;
    if (vital.date || vital.created_at) {
      const date = new Date(vital.date || vital.created_at);
      displayDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }

    return {
      date: displayDate,
      systolic: systolic,
      diastolic: diastolic,
      bp: systolic,
      avgBP: Math.round((systolic + diastolic) / 2)
    };
  });

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#1F2937',
          padding: '12px 16px',
          border: '1px solid #374151',
          borderRadius: '8px',
          color: '#E5E7EB',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
        }}>
          <p style={{ margin: '0 0 8px 0', color: '#9CA3AF' }}>{`Date: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              margin: '4px 0', 
              color: entry.color,
              fontWeight: '600'
            }}>
              {`${entry.name}: ${entry.value} ${entry.dataKey.includes('BP') || entry.dataKey.includes('systolic') || entry.dataKey.includes('diastolic') ? 'mmHg' : ''}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loading">
        <div>Loading your dashboard...</div>
      </div>
    );
  }

  if (!user) return <div className="loading">Loading user data...</div>;

  return (
    <div className="patient-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <h2>TELEHEALTH</h2>
        </div>
        <nav className="nav-menu">
          <div className="nav-item active">
            <span className="nav-icon">📊</span>
            Dashboard
          </div>
          <div className="nav-item" onClick={() => navigate("/create_appointment")}>
            <span className="nav-icon">📅</span>
            Appointments
          </div>
          <div className="nav-item" onClick={() => navigate("/family_management")}>
            <span className="nav-icon">👥</span>
            Family
          </div>
          <div className="nav-item" onClick={() => navigate("/chat")}>
            <span className="nav-icon">💬</span>
            Chat
          </div>
          <div className="nav-item" onClick={handleViewVitals}>
            <span className="nav-icon">❤️</span>
            Vitals
          </div>
          <div className="nav-item logout-item" onClick={logout}>
            <span className="nav-icon">🚪</span>
            Logout
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header">
          <h1>DASHBOARD</h1>
          <div className="header-right">
            <span className="user-info">Welcome back, {user.name}!</span>
            <div className="user-avatar" title={user.name}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Metrics Cards */}
        <div className="metrics-grid">
          <div className="metric-card appointments" onClick={() => navigate("/create_appointment")}>
            <div className="metric-header">
              <h3>Total Appointments</h3>
              <span className="metric-icon">📅</span>
            </div>
            <div className="metric-value">{dashboardStats.totalAppointments}</div>
            <div className="metric-subtitle">All time appointments</div>
          </div>

          <div className="metric-card family" onClick={() => navigate("/family_management")}>
            <div className="metric-header">
              <h3>Family Members</h3>
              <span className="metric-icon">👥</span>
            </div>
            <div className="metric-value">{dashboardStats.familyMembers}</div>
            <div className="metric-subtitle">Connected family</div>
          </div>

          <div className="metric-card upcoming" onClick={() => navigate("/create_appointment")}>
            <div className="metric-header">
              <h3>Upcoming</h3>
              <span className="metric-icon">⏰</span>
            </div>
            <div className="metric-value">{dashboardStats.upcomingAppointments}</div>
            <div className="metric-subtitle">Scheduled appointments</div>
          </div>

          <div className="metric-card vitals" onClick={handleViewVitals}>
            <div className="metric-header">
              <h3>Vital Records</h3>
              <span className="metric-icon">❤️</span>
            </div>
            <div className="metric-value">{dashboardStats.vitalsRecords}</div>
            <div className="metric-subtitle">Health measurements</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-grid">
          {/* Blood Pressure Trend Chart */}
          <div className="chart-card">
            <h3>🩺 Blood Pressure Trends</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="systolicGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="diastolicGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF" 
                    fontSize={12}
                    fontWeight="500"
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    fontSize={12}
                    fontWeight="500"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="systolic"
                    stroke="#EF4444"
                    strokeWidth={3}
                    fill="url(#systolicGradient)"
                    name="Systolic"
                  />
                  <Area
                    type="monotone"
                    dataKey="diastolic"
                    stroke="#10B981"
                    strokeWidth={3}
                    fill="url(#diastolicGradient)"
                    name="Diastolic"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-vitals-message">
                No blood pressure data available yet. Start tracking your vitals!
              </div>
            )}
          </div>

          {/* Vitals Overview Chart */}
          <div className="chart-card">
            <h3>📈 Vitals Overview</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF" 
                    fontSize={12}
                    fontWeight="500"
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    fontSize={12}
                    fontWeight="500"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="systolic" 
                    fill="url(#barGradient)"
                    radius={[4, 4, 0, 0]}
                    name="Systolic BP"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-vitals-message">
                No vitals data to display. Add some health measurements to see trends!
              </div>
            )}
          </div>

          {/* Health Status Overview */}
          <div className="chart-card">
            <h3>🏥 Health Status Overview</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '20px',
              marginTop: '20px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                padding: '25px',
                borderRadius: '16px',
                textAlign: 'center',
                color: 'white'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>Overall</div>
                <div style={{ fontSize: '14px', opacity: '0.9' }}>Good Health</div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                padding: '25px',
                borderRadius: '16px',
                textAlign: 'center',
                color: 'white'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚠️</div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>Monitoring</div>
                <div style={{ fontSize: '14px', opacity: '0.9' }}>BP Levels</div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                padding: '25px',
                borderRadius: '16px',
                textAlign: 'center',
                color: 'white'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📊</div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>Records</div>
                <div style={{ fontSize: '14px', opacity: '0.9' }}>{dashboardStats.vitalsRecords} Entries</div>
              </div>
            </div>
          </div>


        </div>
      </main>

      {/* Enhanced Vitals Modal */}
      {showVitalsModal && (
        <div className="modal" onClick={(e) => e.target.className === 'modal' && setShowVitalsModal(false)}>
          <div className="modal-content">
            <span className="close" onClick={() => setShowVitalsModal(false)}>
              &times;
            </span>
            <h2>📊 My Health Vitals</h2>
            {vitals.length === 0 ? (
              <div className="no-vitals-message">
                <p>No vital records found yet.</p>
                <p style={{ marginTop: '10px', fontSize: '16px' }}>
                  Start tracking your health by recording your first vital signs!
                </p>
              </div>
            ) : (
              <div>
                <div style={{ 
                  marginBottom: '20px', 
                  padding: '15px', 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  borderRadius: '12px',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                  <p style={{ margin: '0', fontSize: '14px', color: '#94A3B8' }}>
                    Total Records: <strong style={{ color: '#3B82F6' }}>{vitals.length}</strong>
                  </p>
                </div>
                
                {vitals.map((vital, index) => (
                  <div key={index} className="vital-card">
                    <p><strong>📅 Date:</strong> {vital.date || vital.created_at || "N/A"}</p>
                    <p><strong>💓 Blood Pressure:</strong> <span style={{color: '#EF4444', fontWeight: '700'}}>{vital.bp || "N/A"}</span></p>
                    {vital.heart_rate && (
                      <p><strong>💗 Heart Rate:</strong> <span style={{color: '#10B981', fontWeight: '700'}}>{vital.heart_rate} bpm</span></p>
                    )}
                    {vital.temperature && (
                      <p><strong>🌡️ Temperature:</strong> <span style={{color: '#F59E0B', fontWeight: '700'}}>{vital.temperature}°F</span></p>
                    )}
                    {vital.weight && (
                      <p><strong>⚖️ Weight:</strong> <span style={{color: '#8B5CF6', fontWeight: '700'}}>{vital.weight} lbs</span></p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}