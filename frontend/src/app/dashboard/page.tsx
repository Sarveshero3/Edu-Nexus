"use client";

import { BrainCircuit, Search, Upload, FileText, Database, Network, Clock, Settings, LogOut, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";

export default function DashboardPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("Uploading...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setUploadStatus("Upload successful. Indices rebuilt.");
      } else {
        const errorData = await res.json();
        setUploadStatus(`Upload failed: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      setUploadStatus("Error uploading file to server.");
    } finally {
      setIsUploading(false);
      // clear the input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 flex flex-col pt-6 pb-4">
        <Link href="/" className="flex items-center gap-2 px-6 mb-8 w-min">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Edu Nexus</span>
        </Link>
        
        <div className="px-4 flex flex-col gap-2 flex-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Knowledge Base</div>
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 font-medium">
            <Database className="w-5 h-5" />
            Sources
          </Link>
          <Link href="/chat" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
            <MessageSquare className="w-5 h-5" />
            Chat Assistant
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
            <Network className="w-5 h-5" />
            Graph Explorer
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
            <Clock className="w-5 h-5" />
            History
          </Link>
        </div>
        
        <div className="px-4 mt-auto">
          <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
            <Settings className="w-5 h-5" />
            Settings
          </Link>
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors mt-2">
            <LogOut className="w-5 h-5" />
            Log out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-8">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Source Documents</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search sources..." 
                className="bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600 w-64"
              />
            </div>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf,.docx,.txt,.md,.pptx,.xlsx,.csv"
            />
            <button 
              onClick={handleUploadClick}
              disabled={isUploading}
              className={`bg-primary hover:bg-blue-600 text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload className="w-4 h-4" />
              {isUploading ? 'Uploading...' : 'Add Source'}
            </button>
          </div>
        </header>
        
        {uploadStatus && (
          <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${uploadStatus.includes("successful") ? 'bg-green-500/10 text-green-400 border border-green-500/20' : uploadStatus.includes("Uploading") ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {uploadStatus}
          </div>
        )}

        {/* Sources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div className="border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 transition-colors rounded-xl p-6 flex flex-col group cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-4">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-medium text-slate-200 line-clamp-2 mb-2">Introduction_to_Machine_Learning_CS229.pdf</h3>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-4">
              <span>Added today</span>
              <span>128 Chunks</span>
            </div>
          </div>
          
          <div className="border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 transition-colors rounded-xl p-6 flex flex-col group cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-4">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="font-medium text-slate-200 line-clamp-2 mb-2">Deep_Learning_Book_Ian_Goodfellow.pdf</h3>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-4">
              <span>Added yesterday</span>
              <span>854 Chunks</span>
            </div>
          </div>

          <div className="border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 transition-colors rounded-xl p-6 flex flex-col group cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mb-4">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-medium text-slate-200 line-clamp-2 mb-2">Research_Notes_Spring_2025.docx</h3>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-4">
              <span>3 days ago</span>
              <span>42 Chunks</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
