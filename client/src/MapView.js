import { MapContainer, TileLayer, Marker, Polyline, CircleMarker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function MapClickHandler({ onNodeClick }) {
  const map = useMapEvents({
    click: (e) => {
      // Prevent the default zoom behavior
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();
      const { lat, lng } = e.latlng;
      onNodeClick(lat, lng);
    }
  });
  return null;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export default function MapView({ coords, onNodeClick, selectedNodes, allNodes }) {
  // Calculate map bounds based on all nodes
  const bounds = {
    minLat: 43.4573326,
    maxLat: 43.4968755,
    minLon: -80.5661712,
    maxLon: -80.5243333
  };

  // Calculate center point
  const center = [
    (bounds.minLat + bounds.maxLat) / 2,
    (bounds.minLon + bounds.maxLon) / 2
  ];

  // Custom style for the path
  const pathOptions = {
    color: '#4F2683', // UWaterloo purple
    weight: 3,
    opacity: 0.8
  };

  // Custom style for markers
  const startMarkerStyle = {
    color: '#FFB81C', // UWaterloo gold
    fillColor: '#FFB81C',
    fillOpacity: 1,
    radius: 8,
    weight: 2
  };

  const endMarkerStyle = {
    color: '#4F2683', // UWaterloo purple
    fillColor: '#4F2683',
    fillOpacity: 1,
    radius: 8,
    weight: 2
  };

  const intermediateMarkerStyle = {
    color: '#4F2683',
    fillColor: '#fff',
    fillOpacity: 0.8,
    radius: 4,
    weight: 1
  };

  const selectedMarkerStyle = {
    color: '#FF0000',
    fillColor: '#FF0000',
    fillOpacity: 1,
    radius: 10,
    weight: 2
  };

  const nodeMarkerStyle = {
    color: '#666',
    fillColor: '#fff',
    fillOpacity: 0.6,
    radius: 3,
    weight: 1
  };

  // Handle node marker click
  const handleNodeClick = (e, node) => {
    e.originalEvent.preventDefault();
    e.originalEvent.stopPropagation();
    onNodeClick(node.lat, node.lon);
  };

  return (
    <div style={{ height: '500px', width: '100%' }} className="rounded overflow-hidden">
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        bounds={[
          [bounds.minLat, bounds.minLon],
          [bounds.maxLat, bounds.maxLon]
        ]}
        doubleClickZoom={false}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Add click handler */}
        <MapClickHandler onNodeClick={onNodeClick} />
        
        {/* Show all available nodes */}
        {allNodes && allNodes.map((node) => (
          <CircleMarker
            key={`node-${node.id}`}
            center={[node.lat, node.lon]}
            {...nodeMarkerStyle}
            eventHandlers={{
              click: (e) => handleNodeClick(e, node),
              mouseover: (e) => {
                e.target.setStyle({ fillOpacity: 0.9, radius: 4 });
              },
              mouseout: (e) => {
                e.target.setStyle(nodeMarkerStyle);
              }
            }}
          >
            <Popup>Node {node.id}</Popup>
          </CircleMarker>
        ))}
        
        {/* Draw the path if it exists */}
        {coords && coords.length > 0 && (
          <>
            <Polyline positions={coords.map(coord => [coord.lat, coord.lon])} pathOptions={pathOptions} />
            
            {/* Add path markers */}
            {coords.map((coord, idx) => {
              if (idx === 0) {
                // Start marker
                return (
                  <CircleMarker
                    key={`start-${idx}`}
                    center={[coord.lat, coord.lon]}
                    {...startMarkerStyle}
                  >
                    <Popup>Start Point</Popup>
                  </CircleMarker>
                );
              } else if (idx === coords.length - 1) {
                // End marker
                return (
                  <CircleMarker
                    key={`end-${idx}`}
                    center={[coord.lat, coord.lon]}
                    {...endMarkerStyle}
                  >
                    <Popup>End Point</Popup>
                  </CircleMarker>
                );
              } else if (idx % 5 === 0) { // Only show some intermediate markers
                return (
                  <CircleMarker
                    key={idx}
                    center={[coord.lat, coord.lon]}
                    {...intermediateMarkerStyle}
                  >
                    <Popup>Node {idx + 1}</Popup>
                  </CircleMarker>
                );
              }
              return null;
            })}
          </>
        )}

        {/* Show selected nodes */}
        {selectedNodes && selectedNodes.map((node, idx) => (
          <CircleMarker
            key={`selected-${idx}`}
            center={[node.lat, node.lon]}
            {...selectedMarkerStyle}
          >
            <Popup>{idx === 0 ? 'Selected Start' : 'Selected End'}</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
