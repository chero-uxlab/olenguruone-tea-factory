import React from 'react';

export default function App() {
  return (
    <div style={{ width: '100%', height: '100vh', border: 'none' }}>
      <iframe
        src="/index.html"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Tegat Tea Factory"
        allow="identity-credentials-get; clipboard-write; geolocation"
      />
    </div>
  );
}
