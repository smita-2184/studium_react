import React from 'react';
import ApiKeySetup from '../components/ApiKeySetup';

const Admin = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Admin Panel</h1>
        <ApiKeySetup />
      </div>
    </div>
  );
};

export default Admin; 