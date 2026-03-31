/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Globe, 
  Smartphone, 
  Download, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type AppMetadata = {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: 'standalone' | 'minimal-ui' | 'fullscreen';
};

export default function App() {
  const [url, setUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [metadata, setMetadata] = useState<AppMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let formattedUrl = inputUrl.trim();
    if (!formattedUrl) return;
    if (!formattedUrl.startsWith('http')) {
      formattedUrl = `https://${formattedUrl}`;
    }
    setUrl(formattedUrl);
    setMetadata(null);
    setError(null);
  };

  const [serviceWorker, setServiceWorker] = useState<string | null>(null);

  const analyzeWebsite = async () => {
    if (!url) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this website: ${url}. 
        1. Provide a JSON object for a PWA manifest.
        2. Provide a JavaScript string for a robust Service Worker (sw.js) that implements a 'Cache-First' strategy for assets and 'Network-First' for the main page.
        
        Return a JSON object with two keys: 'manifest' (the object) and 'sw' (the string).`,
        config: {
          tools: [{ urlContext: {} }],
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text);
      setMetadata(result.manifest);
      setServiceWorker(result.sw);
    } catch (err) {
      console.error("Analysis failed:", err);
      setError("Failed to analyze the website. Please check the URL and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadBundle = () => {
    if (!metadata || !serviceWorker) return;
    
    // Download Manifest
    downloadFile(JSON.stringify(metadata, null, 2), 'manifest.json', 'application/json');
    
    // Download Service Worker
    downloadFile(serviceWorker, 'sw.js', 'application/javascript');
    
    // Download simple index.html wrapper
    const htmlWrapper = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.name}</title>
    <link rel="manifest" href="/manifest.json">
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js');
            });
        }
    </script>
    <style>
        body, html, iframe { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; border: none; }
    </style>
</head>
<body>
    <iframe src="${url}"></iframe>
</body>
</html>`;
    downloadFile(htmlWrapper, 'index.html', 'text/html');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Web2App <span className="text-orange-500 italic">Studio</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-white/60 hover:text-white transition-colors">Docs</button>
            <button className="px-4 py-1.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-orange-500 transition-all">
              Export
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Controls & Analysis */}
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-4xl font-light tracking-tight leading-tight">
              Turn any <span className="italic serif text-orange-500">website</span> into a high-performance app.
            </h2>
            <p className="text-white/50 max-w-md">
              Enter a URL to generate a Progressive Web App configuration, optimized for mobile performance and offline access.
            </p>
          </section>

          <form onSubmit={handleUrlSubmit} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-orange-800 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl p-2 focus-within:border-orange-500/50 transition-all">
              <Globe className="w-5 h-5 ml-3 text-white/40" />
              <input 
                type="text" 
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 text-lg outline-none placeholder:text-white/20"
              />
              <button 
                type="submit"
                className="bg-orange-500 text-black px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-orange-400 active:scale-95 transition-all"
              >
                Preview <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {url && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Live Preview Active
                </div>
                {!metadata && !isAnalyzing && (
                  <button 
                    onClick={analyzeWebsite}
                    className="flex items-center gap-2 text-sm font-semibold text-orange-500 hover:text-orange-400 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Analyze with Gemini AI
                  </button>
                )}
              </div>

              {isAnalyzing && (
                <div className="p-8 border border-white/10 rounded-2xl bg-white/5 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  <p className="text-sm text-white/60 animate-pulse">Gemini is analyzing the site structure...</p>
                </div>
              )}

              {error && (
                <div className="p-4 border border-red-500/20 bg-red-500/10 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              <AnimatePresence>
                {metadata && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border border-white/10 rounded-xl bg-white/5 space-y-1">
                        <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">App Name</span>
                        <p className="font-medium">{metadata.name}</p>
                      </div>
                      <div className="p-4 border border-white/10 rounded-xl bg-white/5 space-y-1">
                        <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Short Name</span>
                        <p className="font-medium">{metadata.shortName}</p>
                      </div>
                      <div className="p-4 border border-white/10 rounded-xl bg-white/5 space-y-1">
                        <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Theme Color</span>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: metadata.themeColor }}></div>
                          <p className="font-mono text-xs">{metadata.themeColor}</p>
                        </div>
                      </div>
                      <div className="p-4 border border-white/10 rounded-xl bg-white/5 space-y-1">
                        <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Display Mode</span>
                        <p className="font-medium capitalize">{metadata.display}</p>
                      </div>
                    </div>

                    <div className="p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          <Code className="w-4 h-4 text-orange-500" />
                          manifest.json
                        </h3>
                        <button className="text-xs text-orange-500 hover:underline">Copy Code</button>
                      </div>
                      <pre className="text-[11px] font-mono text-white/60 bg-black/40 p-4 rounded-lg overflow-x-auto">
                        {JSON.stringify({
                          name: metadata.name,
                          short_name: metadata.shortName,
                          description: metadata.description,
                          start_url: "/",
                          display: metadata.display,
                          background_color: metadata.backgroundColor,
                          theme_color: metadata.themeColor,
                          icons: [
                            { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
                            { src: "/icon-512.png", sizes: "512x512", type: "image/png" }
                          ]
                        }, null, 2)}
                      </pre>
                    </div>

                    <div className="p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          <Code className="w-4 h-4 text-orange-500" />
                          sw.js (Service Worker)
                        </h3>
                        <button 
                          onClick={() => downloadFile(serviceWorker || '', 'sw.js', 'application/javascript')}
                          className="text-xs text-orange-500 hover:underline"
                        >
                          Download JS
                        </button>
                      </div>
                      <pre className="text-[11px] font-mono text-white/60 bg-black/40 p-4 rounded-lg overflow-x-auto max-h-40">
                        {serviceWorker}
                      </pre>
                    </div>

                    <button 
                      onClick={downloadBundle}
                      className="w-full py-4 bg-orange-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20"
                    >
                      <Download className="w-5 h-5" />
                      Download App Bundle (.zip)
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Right Column: Preview */}
        <div className="relative flex flex-col items-center">
          <div className="sticky top-24 w-full flex flex-col items-center gap-6">
            <div className="flex bg-white/5 p-1 rounded-full border border-white/10">
              <button 
                onClick={() => setViewMode('mobile')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'mobile' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
              >
                Mobile
              </button>
              <button 
                onClick={() => setViewMode('desktop')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'desktop' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
              >
                Desktop
              </button>
            </div>

            <div className={`relative transition-all duration-500 ease-in-out ${viewMode === 'mobile' ? 'w-[320px] h-[640px]' : 'w-full h-[500px]'} bg-[#151515] rounded-[3rem] border-[8px] border-[#252525] shadow-2xl overflow-hidden`}>
              {/* Phone Notch */}
              {viewMode === 'mobile' && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#252525] rounded-b-2xl z-20"></div>
              )}
              
              {!url ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center gap-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-2">
                    <Globe className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-white/40 text-sm">Enter a URL to see the live preview here</p>
                </div>
              ) : (
                <iframe 
                  src={url} 
                  className="w-full h-full border-none bg-white"
                  title="App Preview"
                />
              )}

              {/* Status Bar Overlay (Fake) */}
              {viewMode === 'mobile' && url && (
                <div className="absolute top-0 left-0 right-0 h-6 bg-black/20 backdrop-blur-sm flex items-center justify-between px-8 text-[10px] font-bold z-10 pointer-events-none">
                  <span>9:41</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full border border-white/40"></div>
                    <div className="w-3 h-3 rounded-full border border-white/40"></div>
                  </div>
                </div>
              )}
            </div>

            {url && (
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition-colors"
              >
                Open in new tab <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/10 mt-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-white/30 text-xs">© 2026 Web2App Studio. Powered by Google Gemini AI.</p>
        <div className="flex gap-8">
          <a href="#" className="text-white/30 hover:text-white text-xs transition-colors">Privacy</a>
          <a href="#" className="text-white/30 hover:text-white text-xs transition-colors">Terms</a>
          <a href="#" className="text-white/30 hover:text-white text-xs transition-colors">Support</a>
        </div>
      </footer>
    </div>
  );
}
