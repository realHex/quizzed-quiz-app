import React, { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { supabase } from '../../utils/supabase';

// Don't configure PDF.js here - it's done in pdfConfig.js

const SlideDisplay = ({ slideInfo, pdfName, isVisible }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  
  useEffect(() => {
    if (!isVisible || !slideInfo) return;
    
    // Reset states when slide info changes
    setPdfUrl(null);
    setError(null);
    
    const loadPdfIfNeeded = async () => {
      // Check if slideInfo is a number (PDF slide) or text
      const isSlideNumber = !isNaN(parseInt(slideInfo, 10));
      
      if (isSlideNumber && pdfName) {
        setLoading(true);
        try {
          // Get a temporary URL for the PDF file
          const { data, error } = await supabase
            .storage
            .from('pdf_files')
            .createSignedUrl(pdfName, 60); // URL valid for 60 seconds
            
          if (error) throw error;
          
          setPdfUrl(data.signedUrl);
          setPageNumber(parseInt(slideInfo, 10));
        } catch (err) {
          console.error('Error loading PDF:', err);
          setError(`Failed to load PDF: ${err.message}`);
        } finally {
          setLoading(false);
        }
      } else {
        // It's a text explanation, no need to load PDF
        setLoading(false);
      }
    };
    
    loadPdfIfNeeded();
  }, [slideInfo, pdfName, isVisible]);
  
  if (!isVisible || !slideInfo) return null;
  
  // If the slide info is a number, show PDF slide
  const isSlideNumber = !isNaN(parseInt(slideInfo, 10));
  
  return (
    <div className="slide-display">
      {isSlideNumber && pdfName ? (
        <div className="pdf-slide-viewer">
          {loading ? (
            <div className="pdf-loading">Loading PDF slide...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="pdf-slide-container">
              <Document
                file={pdfUrl}
                onLoadError={(error) => setError(`Error loading PDF: ${error.message}`)}
              >
                <Page pageNumber={pageNumber} width={window.innerWidth > 768 ? 600 : 300} />
              </Document>
            </div>
          )}
        </div>
      ) : (
        // Show text explanation
        <div className="slide-text-explanation">
          {slideInfo}
        </div>
      )}
    </div>
  );
};

export default SlideDisplay;
