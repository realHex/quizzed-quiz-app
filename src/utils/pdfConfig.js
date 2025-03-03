// PDF.js configuration helper
import { pdfjs } from 'react-pdf';

// Initialize PDF.js worker
const initPdfWorker = () => {
  // Use a fixed, specific version for better compatibility
  pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@2.12.313/build/pdf.worker.min.js";
  
  // Log the configuration
  console.log("PDF.js worker initialized with version: 2.12.313");
};

export default initPdfWorker;
