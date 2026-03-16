"use client";

import Link from "next/link";
import { BrainCircuit, Mail, Lock, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login and redirect to dashboard
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      <div className="flex-1 flex flex-col justify-center px-12 md:px-24">
        <Link href="/" className="flex items-center gap-2 mb-16 w-min">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Edu Nexus</span>
        </Link>
        <div className="max-w-md w-full">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome Back</h1>
          <p className="text-slate-400 mb-8">Sign in to access your knowledge graphs and vector databases.</p>
          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-3 pl-10 pr-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" 
                  placeholder="name@university.edu" 
                  required 
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <Link href="#" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-3 pl-10 pr-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" 
                  placeholder="••••••••" 
                  required 
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-primary hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-2 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              Sign In
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-8 text-center text-sm text-slate-400">
            Don't have an account? <Link href="#" className="text-blue-400 font-medium hover:text-blue-300">Create one</Link>
          </div>
        </div>
      </div>
      <div className="hidden md:flex flex-1 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="glass-panel p-10 rounded-3xl relative z-10 max-w-lg w-full border border-indigo-500/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <BrainCircuit className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Tri-Hybrid AI Engine</h3>
              <p className="text-sm text-slate-400">GPT-OSS-120B Router</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-3/4 rounded-full" />
            </div>
            <div className="h-2 w-5/6 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-1/2 rounded-full" />
            </div>
            <div className="h-2 w-4/6 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 w-2/3 rounded-full" />
            </div>
          </div>
          <p className="mt-8 text-slate-300 leading-relaxed italic border-l-2 border-indigo-500/50 pl-4">
            "Edu Nexus completely transformed how I analyze massive research papers, automatically cross-referencing concepts across my entire semantic database."
          </p>
        </div>
      </div>
    </div>
  );
}
