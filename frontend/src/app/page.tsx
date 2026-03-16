import Link from "next/link";
import { BrainCircuit, Search, Database, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 flex flex-col items-center">
      {/* Navigation */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Edu Nexus</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link>
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm font-medium hover:text-white transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link href="/auth/login" className="bg-primary hover:bg-blue-600 text-white text-sm font-semibold py-2 px-5 rounded-full transition-all hover:scale-105 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center relative z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Tri-Hybrid RAG Engine Live
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
          The Intelligent Backbone <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            for Academic Mastery
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mb-12">
          Edu Nexus leverages a tri-hybrid retrieval system—combining BM25 Keyword Search, 
          FAISS Vector Semantics, and Neo4j Knowledge Graphs—to provide unparalleled 
          insights into your academic documents.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/dashboard" className="bg-primary hover:bg-blue-600 text-white text-lg font-semibold py-4 px-8 rounded-full transition-all hover:scale-105 shadow-[0_0_25px_rgba(59,130,246,0.6)] flex items-center gap-2 group">
            Launch Workspace
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="bg-slate-800 hover:bg-slate-700 text-white text-lg font-semibold py-4 px-8 rounded-full transition-all border border-slate-700">
            View Documentation
          </button>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full text-left">
          <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <Search className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold">Fast Brain (BM25)</h3>
            <p className="text-slate-400 leading-relaxed">
              Experience lightning-fast keyword retrieval for precise, exact-match queries across thousands of documents.
            </p>
          </div>
          
          <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <BrainCircuit className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold">Semantic Brain (FAISS)</h3>
            <p className="text-slate-400 leading-relaxed">
              Understand the contextual nuance of your queries with dense vector embeddings that find meaning beyond keywords.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
              <Database className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold">Deep Brain (Neo4j)</h3>
            <p className="text-slate-400 leading-relaxed">
              Traverse complex knowledge graphs to uncover hidden relationships and interconnectivity between concepts.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
