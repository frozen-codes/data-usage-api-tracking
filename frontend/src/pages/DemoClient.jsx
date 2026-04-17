import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, Building, Home, CheckCircle } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

export default function DemoClient() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('locdata_api_key') || '');
  const [isKeyValid, setIsKeyValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subDistricts, setSubDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSubDistrict, setSelectedSubDistrict] = useState('');

  const fetchWithAuth = (endpoint) => {
    return axios.get(`${API_BASE}${endpoint}`, {
      headers: { 'x-api-key': apiKey }
    });
  };

  const checkApiKey = async () => {
    if (!apiKey) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth('/states');
      setStates(res.data);
      setIsKeyValid(true);
      localStorage.setItem('locdata_api_key', apiKey);
    } catch (e) {
      console.error("Auth Error:", e.response?.status, e.response?.data);
      setIsKeyValid(false);
      setStates([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (apiKey) checkApiKey();
  }, []);

  const handleStateChange = async (e) => {
    const stId = e.target.value;
    setSelectedState(stId);
    setSelectedDistrict('');
    setSelectedSubDistrict('');
    setDistricts([]);
    setSubDistricts([]);
    setVillages([]);
    
    if (!stId) return;
    try {
      const res = await fetchWithAuth(`/districts?state_id=${stId}`);
      setDistricts(res.data);
    } catch(e) {}
  };

  const handleDistrictChange = async (e) => {
    const distId = e.target.value;
    setSelectedDistrict(distId);
    setSelectedSubDistrict('');
    setSubDistricts([]);
    setVillages([]);

    if (!distId) return;
    try {
      const res = await fetchWithAuth(`/subdistricts?district_id=${distId}`);
      setSubDistricts(res.data);
    } catch(e) {}
  };

  const handleSubDistrictChange = async (e) => {
    const subId = e.target.value;
    setSelectedSubDistrict(subId);
    setVillages([]);

    if (!subId) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/villages?sub_district_id=${subId}&limit=500`);
      setVillages(res.data.villages);
    } catch(e) {}
    setLoading(false);
  };

  return (
    <div className="container">
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>Client Authentication</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label>Provide your API Key to use the Demo Client:</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. pk_abc123xyz"
              value={apiKey} 
              onChange={e => setApiKey(e.target.value)} 
            />
          </div>
          <button className="btn-primary" onClick={checkApiKey} disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Connect API'}
          </button>
        </div>
        {isKeyValid && (
          <p style={{ color: 'var(--success)', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} /> Successfully authenticated! You can now access Location Data.
          </p>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '2rem', opacity: isKeyValid ? 1 : 0.5, pointerEvents: isKeyValid ? 'auto' : 'none', transition: 'all 0.3s ease' }}>
        <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MapPin size={24} /> Hierarchical Location Selector
        </h2>
        
        <div className="grid-3">
          <div className="form-group">
            <label><MapPin size={14} style={{display:'inline', marginRight:'4px'}}/> State</label>
            <select className="form-control" value={selectedState} onChange={handleStateChange}>
              <option value="">-- Select State --</option>
              {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label><Building size={14} style={{display:'inline', marginRight:'4px'}}/> District</label>
            <select className="form-control" value={selectedDistrict} onChange={handleDistrictChange} disabled={!selectedState}>
              <option value="">-- Select District --</option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label><Home size={14} style={{display:'inline', marginRight:'4px'}}/> Sub-District</label>
            <select className="form-control" value={selectedSubDistrict} onChange={handleSubDistrictChange} disabled={!selectedDistrict}>
              <option value="">-- Select Sub-District --</option>
              {subDistricts.map(sd => <option key={sd.id} value={sd.id}>{sd.name}</option>)}
            </select>
          </div>
        </div>

        {selectedSubDistrict && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Villages ({villages.length})</h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner"></span></div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem',
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '1rem',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px'
              }}>
                {villages.map(v => (
                  <div key={v.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.875rem' }}>
                    {v.name}
                  </div>
                ))}
                {villages.length === 0 && <p style={{ color: 'var(--text-secondary)'}}>No villages found.</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
