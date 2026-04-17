import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Activity, Key, Plus, Copy, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const API_BASE = 'http://localhost:5000/admin';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ topUsage: {}, totalClients: 0, totalCalls: 0, recentLogs: [] });
  const [clients, setClients] = useState([]);
  const [newClientName, setNewClientName] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, clientsRes] = await Promise.all([
        axios.get(`${API_BASE}/stats`),
        axios.get(`${API_BASE}/clients`)
      ]);
      setStats(statsRes.data);
      setClients(clientsRes.data);
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Live updates
    return () => clearInterval(interval);
  }, []);

  const handleRegisterClient = async (e) => {
    e.preventDefault();
    if (!newClientName) return;
    try {
      await axios.post(`${API_BASE}/register`, { name: newClientName });
      setNewClientName('');
      fetchData();
    } catch(e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const chartData = Object.entries(stats.topUsage).map(([date, calls]) => ({
    date: date.substr(5), // MM-DD
    calls
  })).sort((a,b) => a.date.localeCompare(b.date));

  if (loading) return <div className="container" style={{textAlign: 'center', marginTop: '4rem'}}><span className="spinner"></span></div>;

  return (
    <div className="container">
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel stat-card">
          <div className="stat-title"><Users size={16} style={{display:'inline', marginRight:'8px'}}/> Total Clients</div>
          <div className="stat-value">{stats.totalClients}</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-title"><Activity size={16} style={{display:'inline', marginRight:'8px'}}/> Total API Calls</div>
          <div className="stat-value">{stats.totalCalls}</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-title" style={{color: 'var(--success)'}}>System Status</div>
          <div className="stat-value" style={{fontSize: '1.5rem', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <div style={{width:'12px', height:'12px', background:'var(--success)', borderRadius:'50%', boxShadow: '0 0 10px var(--success)'}}></div>
            Operational
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Left Column: API Usage & Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>API Usage Timeline</h3>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Area type="monotone" dataKey="calls" stroke="var(--accent-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorCalls)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', overflow: 'hidden' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Recent API Logs</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Client</th>
                    <th>Time</th>
                    <th>Lat (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ color: 'var(--accent-color)' }}>{log.endpoint}</td>
                      <td>{log.client?.name || 'Unknown'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td>{log.response_time}ms</td>
                    </tr>
                  ))}
                  {stats.recentLogs.length === 0 && (
                    <tr><td colSpan="4" className="empty-state">No logs yet. Try the Demo Client!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Key Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={20} color="var(--accent-color)"/> Generate API Key
            </h3>
            <form onSubmit={handleRegisterClient} style={{ display: 'flex', gap: '1rem' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Client Name (e.g. logistics_app)"
                value={newClientName}
                onChange={e => setNewClientName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} /> Create
              </button>
            </form>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Active Clients</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Client Name</th>
                    <th>API Key</th>
                    <th>Total Req</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(client => (
                    <tr key={client.id}>
                      <td style={{ fontWeight: 600 }}>{client.name}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                          <code style={{ color: 'var(--text-secondary)' }}>{client.api_key.substr(0, 15)}...</code>
                          <button 
                            onClick={() => copyToClipboard(client.api_key)}
                            style={{ background: 'none', border: 'none', color: copiedKey === client.api_key ? 'var(--success)' : 'var(--accent-color)', cursor: 'pointer' }}
                            title="Copy API Key"
                          >
                            {copiedKey === client.api_key ? <CheckCircle size={14}/> : <Copy size={14}/>}
                          </button>
                        </div>
                      </td>
                      <td><span className="badge">{client._count?.apiLogs || 0}</span></td>
                    </tr>
                  ))}
                  {clients.length === 0 && (
                    <tr><td colSpan="3" className="empty-state">No clients generated yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
