import React, { useState, useEffect } from 'react';
import './DocumentList.css';
import axios from "axios";

function DocumentList({ refreshTrigger = 0, onViewDetailsChange }) {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('http://localhost:5280/UploadFile');
        console.log('Datos recibidos:', response.data);
        
        if (Array.isArray(response.data)) {
          setDocuments(response.data);
          setFilteredDocuments(response.data);
        } else {
          console.error('La respuesta no es un array:', response.data);
          setError('El formato de respuesta es incorrecto');
        }
      } catch (err) {
        setError('Error al cargar los documentos. Por favor, inténtalo más tarde.');
        console.error('Error al obtener documentos:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [refreshTrigger]); // Se ejecuta cuando cambia refreshTrigger

  // Función para aplicar filtros
  useEffect(() => {
    filterDocuments();
  }, [searchTerm, startDate, endDate, documents]);

  const filterDocuments = () => {
    let filtered = [...documents];
    
    // Filtrar por nombre
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrar por fecha de inicio
    if (startDate) {
      const startDateTime = new Date(startDate).setHours(0, 0, 0, 0);
      filtered = filtered.filter(doc => {
        const docDate = new Date(doc.uploadDate);
        return docDate >= startDateTime;
      });
    }
    
    // Filtrar por fecha de fin
    if (endDate) {
      const endDateTime = new Date(endDate).setHours(23, 59, 59, 999);
      filtered = filtered.filter(doc => {
        const docDate = new Date(doc.uploadDate);
        return docDate <= endDateTime;
      });
    }
    
    setFilteredDocuments(filtered);
  };

  // Manejadores para los cambios en filtros
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };
  
  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  // Función para formatear la fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha desconocida';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return dateString;
    }
  };

  const handleViewDetails = async (documentId) => {
    try {
      setIsLoading(true);
      console.log(`Consultando detalles del documento con ID: ${documentId}`);
      
      // Realizar la petición para obtener los detalles del documento
      const response = await axios.get(`http://localhost:5280/UploadFile/${documentId}`);
      
      setSelectedDocument(response.data);
      setIsViewingDetails(true);
      
      // Notificar al componente padre que estamos viendo detalles
      if (onViewDetailsChange) {
        onViewDetailsChange(true);
      }
    } catch (error) {
      console.error('Error al obtener detalles del documento:', error);
      alert(`Error al cargar los detalles del documento: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (documentId) => {
    try {
      if (window.confirm('¿Estás seguro de que deseas eliminar este documento?')) {
        setIsLoading(true);
        await axios.delete(`http://localhost:5280/UploadFile/${documentId}`);
        
        // Actualizar la lista después de eliminar
        setDocuments(documents.filter(doc => doc.id !== documentId));
        setFilteredDocuments(filteredDocuments.filter(doc => doc.id !== documentId));
        
        // Si estamos viendo los detalles del documento eliminado, cerrar la vista de detalles
        if (selectedDocument && selectedDocument.id === documentId) {
          closeDetails();
        }
      }
    } catch (error) {
      console.error('Error al eliminar el documento:', error);
      alert(`Error al eliminar el documento: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const closeDetails = () => {
    setIsViewingDetails(false);
    setSelectedDocument(null);
    
    // Notificar al componente padre que ya no estamos viendo detalles
    if (onViewDetailsChange) {
      onViewDetailsChange(false);
    }
  };

  if (isLoading && !isViewingDetails) {
    return <div className="loading">Cargando documentos...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Vista de detalles del documento
  if (isViewingDetails && selectedDocument) {
    return (
      <div className="document-details-container">
        <div className="details-header">
          <h2>Detalles del Documento</h2>
          <button className="close-button" onClick={closeDetails}>×</button>
        </div>
        
        <div className="document-details">
          <div className="detail-item">
            <span className="detail-label">ID:</span>
            <span className="detail-value">{selectedDocument.id}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Nombre del archivo:</span>
            <span className="detail-value">{selectedDocument.fileName}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Fecha de subida:</span>
            <span className="detail-value">{formatDate(selectedDocument.uploadDate)}</span>
          </div>
          
          {/* Mostrar documentos relacionados del CSV si existen */}
          {selectedDocument.documents && selectedDocument.documents.length > 0 && (
            <div className="related-documents">
              <h3>Documentos cargados en este archivo</h3>
              <table className="related-documents-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre PDF</th>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Edad</th>
                    <th>Dirección</th>
                    <th>SSN</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDocument.documents.map(doc => (
                    <tr key={doc.id}>
                      <td>{doc.id}</td>
                      <td>{doc.pdfName}</td>
                      <td>{doc.firstName}</td>
                      <td>{doc.lastName}</td>
                      <td>{doc.age}</td>
                      <td>{doc.address}</td>
                      <td>{doc.ssn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="details-actions">
            <button className="back-button" onClick={closeDetails}>Volver al listado</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="document-list-container">
      <h2>Tus Documentos</h2>
      
      {/* Filtros */}
      <div className="filters-container">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        
        <div className="filter-group date-filters">
          <div className="date-filter">
            <label>Desde:</label>
            <input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              className="date-input"
            />
          </div>
          
          <div className="date-filter">
            <label>Hasta:</label>
            <input
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              className="date-input"
            />
          </div>
          
          <button onClick={clearFilters} className="clear-filters-button">
            Limpiar filtros
          </button>
        </div>
      </div>
      
      {/* Resultados */}
      {filteredDocuments.length === 0 ? (
        <p className="no-documents">
          {documents.length === 0 
            ? "No se encontraron documentos. ¡Sube algunos archivos para comenzar!" 
            : "No se encontraron documentos con los filtros aplicados."}
        </p>
      ) : (
        <div className="document-list">
          <div className="document-header">
            <span className="document-name-header">Nombre del PDF</span>
            <span className="document-date-header">Fecha de Subida</span>
            <span className="document-actions-header">Acciones</span>
          </div>
          
          {filteredDocuments.map(doc => (
            <div key={doc.id} className="document-item">
              <span className="document-name">{doc.fileName}</span>
              <span className="document-date">{formatDate(doc.uploadDate)}</span>
              <div className="document-actions">
                <button 
                  className="view-button"
                  onClick={() => handleViewDetails(doc.id)}
                >
                  Ver
                </button>
                <button 
                  className="delete-button"
                  onClick={() => handleDelete(doc.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DocumentList;