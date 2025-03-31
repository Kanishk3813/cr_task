// src/components/dashboard/HistorySection.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getUserConversions, deleteConversion } from "../../services/convertService";
import { Conversion } from "../../types";

interface HistorySectionProps {
  refreshTrigger: number;
  onConversionComplete: () => void;
}

export default function HistorySection({ refreshTrigger, onConversionComplete }: HistorySectionProps) {
  const { user } = useAuth();
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedConversion, setSelectedConversion] = useState<Conversion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchConversions = async () => {
      if (!user) return;
      
      setLoading(true);
      setError("");
      
      try {
        const userConversions = await getUserConversions(user.uid);
        setConversions(userConversions);
      } catch (error: any) {
        console.error("Error fetching conversions:", error);
        setError("Failed to load your conversions. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchConversions();
  }, [user, refreshTrigger]);

  const handleDelete = async (id: string) => {
    if (!id) return;
    
    const confirmDelete = window.confirm("Are you sure you want to delete this conversion? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      await deleteConversion(id);
      
      setConversions(conversions.filter(conv => conv.id !== id));
      
      if (selectedConversion && selectedConversion.id === id) {
        setSelectedConversion(null);
      }
      
      onConversionComplete();
    } catch (error) {
      alert("Failed to delete conversion. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = () => {
    if (!selectedConversion) return;
    
    navigator.clipboard.writeText(selectedConversion.xmlContent);
    alert("XML copied to clipboard!");
  };

  const handleDownload = () => {
    if (!selectedConversion) return;
    
    const blob = new Blob([selectedConversion.xmlContent], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedConversion.fileName.replace(".pdf", ".xml");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading your conversions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-4 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  if (conversions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">No conversions found.</p>
          <p>Go to the Convert New PDF tab to create your first conversion.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <h2 className="text-xl font-bold p-4 border-b">Your Conversions</h2>
          <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {conversions.map((conversion) => (
              <li
                key={conversion.id}
                onClick={() => setSelectedConversion(conversion)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
                  selectedConversion?.id === conversion.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate" title={conversion.fileName}>
                      {conversion.fileName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(conversion.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (conversion.id) handleDelete(conversion.id);
                    }}
                    disabled={isDeleting}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="md:col-span-2">
        {selectedConversion ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold truncate flex-1" title={selectedConversion.fileName}>
                {selectedConversion.fileName}
              </h2>
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
                <button
                  onClick={() => {
                    if (selectedConversion.id) handleDelete(selectedConversion.id);
                  }}
                  disabled={isDeleting}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-red-300"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
            <div className="p-4">
              <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-sm max-h-96">
                {selectedConversion.xmlContent}
              </pre>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
            Select a conversion from the list to view the XML
          </div>
        )}
      </div>
    </div>
  );
}