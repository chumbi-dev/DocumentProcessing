import React, { useState, useRef, useEffect } from 'react';
import './FileUpload.css';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// Allowed file types - Agregamos ZIP y RAR
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',                // Tipo MIME para ZIP
  'application/x-zip-compressed',   // Otro tipo MIME para ZIP
  'application/x-rar-compressed',   // Tipo MIME para RAR
  'application/vnd.rar'             // Otro tipo MIME para RAR
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// File type icons and colors - Agregamos ZIP y RAR
const FILE_TYPES = {
  'application/pdf': { icon: '📄', color: '#e74c3c', label: 'PDF' },
  'image/jpeg': { icon: '🖼️', color: '#3498db', label: 'JPEG' },
  'image/png': { icon: '🖼️', color: '#2ecc71', label: 'PNG' },
  'image/jpg': { icon: '🖼️', color: '#3498db', label: 'JPG' },
  'application/msword': { icon: '📝', color: '#9b59b6', label: 'DOC' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📝', color: '#9b59b6', label: 'DOCX' },
  'application/zip': { icon: '🗜️', color: '#f39c12', label: 'ZIP' },
  'application/x-zip-compressed': { icon: '🗜️', color: '#f39c12', label: 'ZIP' },
  'application/x-rar-compressed': { icon: '🗜️', color: '#d35400', label: 'RAR' },
  'application/vnd.rar': { icon: '🗜️', color: '#d35400', label: 'RAR' }
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("File upload error:", error, errorInfo);
    this.setState({ errorInfo: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
          <div className="error-boundary">
            <h3>Something went wrong.</h3>
            <p>Please try refreshing the page or contact support.</p>
            <button
                onClick={() => this.setState({ hasError: false })}
                className="retry-button"
            >
              Try Again
            </button>
          </div>
      );
    }
    return this.props.children;
  }
}

function FileUpload({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errorDetails, setErrorDetails] = useState('');
  const [validationError, setValidationError] = useState('');
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle', 'uploading', 'success', 'error'
  const [fileType, setFileType] = useState(null);

  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  // Muevo la función de validación antes del useEffect
  const validateFile = (file) => {
    setValidationError('');
    setErrorDetails('');

    if (!file) return false;

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setValidationError('Invalid file type. Allowed types: PDF, JPEG, PNG, DOC, DOCX, ZIP, RAR');
      return false;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setValidationError(`File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return false;
    }

    return true;
  };

  // Effect to create preview when file changes
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    if (!validateFile(selectedFile)) {
      // Si la validación falla, detenemos la ejecución
      return;
    }

    // Si el archivo es una imagen, usamos FileReader para crear un preview
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile.type === 'application/pdf') {
      setPreviewUrl('/pdf-icon.png'); // Debes agregar este icono en tu carpeta public
    } else if (selectedFile.type === 'application/zip' || selectedFile.type === 'application/x-zip-compressed') {
      setPreviewUrl('/zip-icon.png'); // Icono para archivos ZIP
    } else if (selectedFile.type === 'application/x-rar-compressed' || selectedFile.type === 'application/vnd.rar') {
      setPreviewUrl('/rar-icon.png'); // Icono para archivos RAR
    } else {
      setPreviewUrl('/document-icon.png'); // Icono genérico para documentos
    }

    // Set file type for visual indicator
    setFileType(FILE_TYPES[selectedFile.type] || {
      icon: '📄',
      color: '#7f8c8d',
      label: 'DOC'
    });

  }, [selectedFile]);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setMessage('');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setMessage('');
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setMessage('Please select a file first!');
      return;
    }

    if (!validateFile(selectedFile)) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');

    // Create form data for API call
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('fileName', selectedFile.name);

    try {
      const response = await axios.post('http://localhost:5280/UploadFile/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress(progress);
        }
      });

      setMessage('File uploaded successfully!');
      setUploadStatus('success');

      // Notificar al componente padre que la carga fue exitosa
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Reiniciamos el archivo después de mostrar el mensaje de éxito
      setTimeout(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setFileType(null);
      }, 2000);

      // Reiniciamos el formulario
      if (formRef.current) {
        formRef.current.reset();
      }
    } catch (error) {
      setMessage('Error uploading file');
      setErrorDetails(error.message || 'An unknown error occurred');
      setUploadStatus('error');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        if (uploadStatus !== 'success' && uploadStatus !== 'error') {
          setUploadStatus('idle');
        }
      }, 1000);
    }
  };

  const cancelUpload = () => {
    // Nota: En una implementación real deberías cancelar la petición axios
    setIsUploading(false);
    setUploadProgress(0);
    setMessage('Upload canceled');
    setUploadStatus('idle');
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileType(null);
    setMessage('');
    setValidationError('');
    setErrorDetails('');
    setUploadStatus('idle');

    if (formRef.current) {
      formRef.current.reset();
    }
  };

  return (
      <ErrorBoundary>
        <div className="file-upload-container">
          <motion.div
              className="upload-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
          >
            <div className="upload-header">
              <h2>Upload Document</h2>
              <div className="upload-description">
                <p>Share your files securely with our modern upload system</p>
                <p className="file-types">Supported formats: PDF, JPEG, PNG, DOC, DOCX, ZIP, RAR (Max: 5MB)</p>
              </div>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} onDragEnter={handleDrag}>
              <div
                  className={`drag-drop-zone ${dragActive ? 'drag-active' : ''} 
                        ${validationError ? 'error-border' : ''} 
                        ${uploadStatus === 'success' ? 'success-border' : ''} 
                        ${uploadStatus === 'error' ? 'error-border' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={handleButtonClick}
              >
                <AnimatePresence mode="wait">
                  {previewUrl ? (
                      <motion.div
                          className="file-preview-container"
                          key="preview"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.3 }}
                      >
                        {selectedFile && selectedFile.type.startsWith('image/') ? (
                            <div className="image-preview-wrapper">
                              <img src={previewUrl} alt="Preview" className="file-preview" />
                              <div className="file-type-badge" style={{ backgroundColor: fileType?.color }}>
                                <span className="file-type-icon">{fileType?.icon}</span>
                                <span className="file-type-label">{fileType?.label}</span>
                              </div>
                            </div>
                        ) : (
                            <div className="document-preview" style={{ borderColor: fileType?.color }}>
                              <div className="document-icon-wrapper" style={{ backgroundColor: fileType?.color }}>
                                <span className="document-icon">{fileType?.icon}</span>
                              </div>
                              <span className="file-name">{selectedFile ? selectedFile.name : ''}</span>
                              <span className="file-type">{fileType?.label}</span>
                            </div>
                        )}
                      </motion.div>
                  ) : (
                      <motion.div
                          className="upload-placeholder"
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                      >
                        <div className="upload-background">
                          <div className="upload-icon-container">
                            <div className="upload-icon"></div>
                            <motion.div
                                className="upload-pulse"
                                animate={{
                                  scale: [1, 1.2, 1],
                                  opacity: [0.7, 0.9, 0.7]
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  repeatType: "loop"
                                }}
                            ></motion.div>
                          </div>
                          <div className="upload-text">
                            <p className="upload-title">Drag your files here</p>
                            <p className="upload-subtitle">or <span className="browse-text">browse</span> to choose a file</p>
                          </div>
                        </div>
                      </motion.div>
                  )}
                </AnimatePresence>

                <input
                    ref={fileInputRef}
                    type="file"
                    className="file-input"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    accept={ALLOWED_TYPES.join(',')}
                />
              </div>

              {selectedFile && (
                  <motion.div
                      className="file-info"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                  >
                    <div className="file-info-content">
                      <span className="file-name">{selectedFile.name}</span>
                      <span className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button
                        type="button"
                        className="remove-file-button"
                        onClick={removeFile}
                    >
                      <span className="remove-icon">×</span>
                    </button>
                  </motion.div>
              )}

              {validationError && (
                  <div className="validation-error">
                    {validationError}
                  </div>
              )}

              {isUploading && (
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div
                          className="progress-fill"
                          style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{uploadProgress}%</span>
                    <button
                        type="button"
                        className="cancel-button"
                        onClick={cancelUpload}
                    >
                      Cancel
                    </button>
                  </div>
              )}

              <div className="button-container">
                <button
                    type="submit"
                    className="upload-button"
                    disabled={!selectedFile || isUploading || !!validationError}
                >
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>

            {message && (
                <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
                  <div className="message-content">
                    <span className="message-icon"></span>
                    <div className="message-text">
                      <p className="message-title">{message}</p>
                      {errorDetails && <p className="message-details">{errorDetails}</p>}
                    </div>
                  </div>
                </div>
            )}
          </motion.div>
        </div>
      </ErrorBoundary>
  );
}

export default FileUpload;