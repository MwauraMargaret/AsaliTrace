import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import UserProfile from './components/UserProfile.jsx';

// API Service (put this in services/api.js)
const API_BASE = 'http://localhost:8000/api';

const getBatches = async () => {
  try {
    console.log('Fetching batches from:', `${API_BASE}/batches/`);
    const response = await fetch(`${API_BASE}/batches/`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API Response data:', data);
    return { data }; // Return the format your components expect
  } catch (error) {
    console.error('API Error:', error);
    return { data: [] };
  }
};

// Dashboard using API service
function Dashboard() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        const response = await getBatches();
        console.log('Dashboard received:', response);
        setBatches(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError('Failed to load batches');
        setBatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">HoneyTrace Dashboard</h1>
      <p className="mb-4">Testing API service connection to Django...</p>
      <a href="/profile" className="text-amber-600 hover:text-amber-500">Edit Profile & Security</a>
      
      {loading && <p className="text-blue-500">Loading batches...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="text-lg font-semibold mb-2">API Status:</h2>
        <p>Endpoint: {API_BASE}/batches/</p>
        <p>Batches loaded: {batches.length}</p>
      </div>

      <h2 className="text-xl font-semibold mb-2">Batches from Django API:</h2>
      
      {batches.length === 0 && !loading ? (
        <p className="text-yellow-600">No batches found in the database</p>
      ) : (
        <ul className="space-y-2">
          {batches.map((batch) => (
            <li key={batch.id} className="border border-gray-300 p-3 rounded bg-white">
              <strong>ID:</strong> {batch.batch_id} <br />
              <strong>Producer:</strong> {batch.producer_name} <br />
              <strong>Honey Type:</strong> {batch.honey_type} <br />
              <strong>Status:</strong> {batch.status} <br />
              <strong>Quantity:</strong> {batch.quantity} kg
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Main App component
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={ <PrivateRoute> <UserProfile /> </PrivateRoute> }/>
      </Routes>
    </Router>
  );
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Please log in to access this page.</p>
          <a href="/login" className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600">
            Go to Login
          </a>
        </div>
      </div>
    );
  }
  
  return children;
}

export default App;