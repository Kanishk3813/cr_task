// src/components/dashboard/ConversionSection.tsx
"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { convertPdfToXml, saveConversion } from "../../services/convertService";
import { Conversion } from "../../types";

interface ConversionSectionProps {
  onConversionComplete: () => void;
}

export default function ConversionSection({ onConversionComplete }: ConversionSectionProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentConversion, setCurrentConversion] = useState<Conversion | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError("");
    } else {
      setFile(null);
      setError("Please select a valid PDF file.");
    }
  };

  const handleConvert = async () => {
    if (!file || !user) return;

    setLoading(true);
    setError("");

    try {
      const xmlContent = await convertPdfToXml(file);
      
      const conversionId = await saveConversion(user.uid, file.name, xmlContent);
      
      setCurrentConversion({
        id: conversionId,
        userId: user.uid,
        fileName: file.name,
        xmlContent,
        createdAt: new Date(),
      });
      
      setFile(null);
      if (document.getElementById("fileInput") as HTMLInputElement) {
        (document.getElementById("fileInput") as HTMLInputElement).value = "";
      }
      
      onConversionComplete();
    } catch (error: any) {
      console.error("Conversion error:", error);
      setError(error.message || "Error during conversion. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!currentConversion) return;
    
    navigator.clipboard.writeText(currentConversion.xmlContent);
    alert("XML copied to clipboard!");
  };

  const handleDownload = () => {
    if (!currentConversion) return;
    
    const blob = new Blob([currentConversion.xmlContent], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentConversion.fileName.replace(".pdf", ".xml");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Upload PDF</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select PDF file:
          </label>
          <input
            id="fileInput"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
          />
        </div>
        
        {error && (
          <div className="mb-4 text-red-500 text-sm">{error}</div>
        )}
        
        <button
          onClick={handleConvert}
          disabled={!file || loading}
          className={`w-full py-2 px-4 rounded font-medium ${
            !file || loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Converting...
            </span>
          ) : (
            'Convert to XML'
          )}
        </button>
      </div>
      

      {currentConversion && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold">Conversion Result</h2>
            <div className="space-x-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Copy
              </button>
              <button
                onClick={handleDownload}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Download
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="mb-3 text-sm text-gray-500">
              Your conversion has been saved. You can access it later from the Conversion History tab.
            </div>
            <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-sm max-h-96">
              {currentConversion.xmlContent}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}