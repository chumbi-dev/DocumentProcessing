import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import DocumentList from './components/DocumentList';
import './App.css';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  
  // Función para forzar la actualización del listado
  const handleUploadSuccess = () => {
    // Incrementar el contador para activar el efecto en DocumentList
    setRefreshTrigger(prev => prev + 1);
  };

  // Función para controlar la visualización de detalles
  const handleViewDetailsChange = (viewing) => {
    setIsViewingDetails(viewing);
  };

  return (
    <div className="App">
      {/* <header className="App-header">
        <h1>Document Management System</h1>
      </header> */}
      <main className="App-main">
        {!isViewingDetails && (
          <div className="upload-section">
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        )}
        <div className="documents-section">
          <DocumentList 
            refreshTrigger={refreshTrigger} 
            onViewDetailsChange={handleViewDetailsChange}
          />
        </div>
      </main>
      <footer className="App-footer">
        <p>&copy; {new Date().getFullYear()} Document Management System</p>
      </footer>
    </div>
  );
}

export default App;