import { useState, useEffect } from 'react';
import axios from 'axios';
import MapView from './MapView';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export default function App() {
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [allNodes, setAllNodes] = useState([]);

  // Load all nodes on component mount
  useEffect(() => {
    const loadNodes = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/nodes`);
        setAllNodes(response.data);
      } catch (err) {
        console.error('Error loading nodes:', err);
      }
    };
    loadNodes();
  }, []);

  const findNearestNode = (lat, lon) => {
    let nearestNode = null;
    let minDistance = Infinity;

    allNodes.forEach(node => {
      const distance = Math.sqrt(
        Math.pow(node.lat - lat, 2) + Math.pow(node.lon - lon, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestNode = node;
      }
    });

    return nearestNode;
  };

  const handleMapClick = (lat, lon) => {
    const nearestNode = findNearestNode(lat, lon);
    if (nearestNode) {
      if (selectedNodes.length < 2) {
        setSelectedNodes([...selectedNodes, nearestNode]);
        if (selectedNodes.length === 0) {
          setSource(nearestNode.id.toString());
        } else {
          setTarget(nearestNode.id.toString());
        }
      } else {
        setSelectedNodes([nearestNode]);
        setSource(nearestNode.id.toString());
        setTarget('');
      }
    }
  };

  const handleSubmit = async e => {
    if (e) e.preventDefault();
    if (!source || !target) return;

    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(`${API_URL}/api/shortest_path`, {
        params: { 
          source: source.trim(),
          target: target.trim()
        }
      });
      setResult(res.data);
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response) {
        setError(`Server error: ${err.response.status}`);
      } else if (err.request) {
        setError('No response from server. Please make sure the server is running.');
      } else {
        setError(`Error: ${err.message}`);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when both nodes are selected
  useEffect(() => {
    if (source && target) {
      handleSubmit();
    }
  }, [source, target]);

  return (
    <div className="min-vh-100 py-5" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card shadow-sm">
              <div className="card-body">
                <h1 className="card-title text-center mb-4" style={{ color: '#4F2683' }}>
                  UWaterloo Campus Path Finder
                </h1>
                
                <div className="alert alert-info mb-4">
                  <strong>Instructions:</strong> Click on the map to select start and end points, or enter node IDs manually.
                </div>

                <form onSubmit={handleSubmit} className="mb-4">
                  <div className="row g-3">
                    <div className="col-md-5">
                      <input 
                        type="text" 
                        placeholder="Source Node ID (10 digits)" 
                        value={source}
                        onChange={e => setSource(e.target.value)} 
                        className="form-control"
                        pattern="\d{10}"
                        required
                      />
                    </div>
                    <div className="col-md-5">
                      <input 
                        type="text" 
                        placeholder="Target Node ID (10 digits)" 
                        value={target}
                        onChange={e => setTarget(e.target.value)} 
                        className="form-control"
                        pattern="\d{10}"
                        required
                      />
                    </div>
                    <div className="col-md-2">
                      <button 
                        type="submit" 
                        className="btn btn-primary w-100"
                        disabled={loading}
                        style={{ backgroundColor: '#FFB81C', borderColor: '#FFB81C' }}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Finding...
                          </>
                        ) : 'Find Path'}
                      </button>
                    </div>
                  </div>
                </form>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {result && result.distance !== undefined && (
                  <div className="mt-4">
                    <div className="alert alert-success">
                      <strong>Path found!</strong> Total distance: {result.distance.toFixed(2)} meters
                    </div>
                  </div>
                )}

                <div className="card mt-3">
                  <MapView 
                    coords={result?.coords || []} 
                    onNodeClick={handleMapClick}
                    selectedNodes={selectedNodes}
                    allNodes={allNodes}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}