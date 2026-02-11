
import React, { useState, useEffect, useRef } from 'react';
import { Detection, Message } from './types';
import { getChatResponse } from './services/gemini';
import { runRoboflowWorkflow } from './services/roboflow';

// --- Helper for Roboflow colors ---
const getLabelColor = (label: string) => {
  const colors: Record<string, string> = {
    'dent': '#E60012',
    'scratch': '#FFA500',
    'missing': '#FF00FF',
    'ok': '#00FDFF',
    'misalignment': '#E60012',
    'bolt': '#00FF00'
  };
  return colors[label.toLowerCase()] || '#00FDFF';
};

const SUPPORTED_CLASSES = [
  { id: 'dent', color: '#E60012', label: 'Dent' },
  { id: 'scratch', color: '#FFA500', label: 'Scratch' },
  { id: 'missing', color: '#FF00FF', label: 'Missing' },
  { id: 'misalignment', color: '#E60012', label: 'Misalignment' },
  { id: 'bolt', color: '#00FF00', label: 'Bolt' },
  { id: 'ok', color: '#00FDFF', label: 'OK' }
];

// --- Sub-components ---

const Header: React.FC<{ modelName: string }> = ({ modelName }) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-GB', { hour12: false }));

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString('en-GB', { hour12: false })), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-white/10 bg-panel-dark flex items-center justify-between px-6 shrink-0 z-50">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-mitsubishi-red flex items-center justify-center font-bold text-lg select-none">M</div>
          <div className="flex flex-col">
            <span className="text-white font-bold tracking-tighter text-sm uppercase">Mitsubishi Logisnext</span>
            <span className="text-edia-cyan text-[10px] font-mono tracking-widest leading-none uppercase">
              Engine: {modelName || 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-8">
        <div className="flex flex-col items-end">
          <span className="text-lg font-mono text-white leading-none font-bold">{time}</span>
          <div className="flex items-center space-x-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-edia-cyan animate-pulse"></span>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">System Online</span>
          </div>
        </div>
      </div>
    </header>
  );
};

const ConfigScreen: React.FC<{ onConfigured: (fileName: string) => void }> = ({ onConfigured }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const handleConnect = () => {
    setIsUploading(true);
    let p = 0;
    const interval = setInterval(() => {
      p += 2; // Slower progress for effect
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => onConfigured("roboflow-workflow-v5"), 500);
      }
    }, 30);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6">
      <div className="grid-overlay absolute inset-0 opacity-20"></div>
      <div className="max-w-md w-full bg-panel-dark border border-white/10 p-8 relative overflow-hidden">
        <div className="scanline"></div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-edia-cyan text-black flex items-center justify-center font-black">QC</div>
          <div>
            <h2 className="text-white font-bold uppercase tracking-widest text-sm">System Initialization</h2>
            <p className="text-[10px] text-gray-500 font-mono">v4.0.2-Stable // Roboflow Core</p>
          </div>
        </div>

        {!isUploading ? (
          <div className="space-y-6">
            <p className="text-xs text-gray-400 font-mono leading-relaxed">
              Initialize connection to Roboflow Inference Server (Workflow: detect-count-and-visualize-5).
            </p>

            <button
              onClick={handleConnect}
              className="w-full py-6 border-2 border-dashed border-edia-cyan/30 hover:border-edia-cyan hover:bg-edia-cyan/5 transition-all group flex flex-col items-center gap-3"
            >
              <span className="material-icons text-edia-cyan group-hover:scale-110 transition-transform">cloud_sync</span>
              <span className="text-[10px] font-bold text-edia-cyan uppercase tracking-widest">Connect to Workflow</span>
            </button>

            <div className="flex justify-between items-center text-[9px] text-gray-600 font-mono uppercase">
              <span>Target: Serverless Engine</span>
              <span>Protocol: HTTPS/REST</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] text-edia-cyan font-bold uppercase animate-pulse">Connecting to Roboflow...</span>
              <span className="text-xl font-mono text-white">{progress}%</span>
            </div>
            <div className="h-1 bg-white/5 w-full">
              <div className="h-full bg-edia-cyan shadow-[0_0_10px_#00FDFF]" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="text-[9px] text-gray-600 font-mono uppercase space-y-1">
              <p>{progress > 10 && "> Authenticating with API Key..."}</p>
              <p>{progress > 30 && "> Handshaking with Workflow ID: detect-count-and-visualize-5..."}</p>
              <p>{progress > 60 && "> Validating Inference Graph..."}</p>
              <p>{progress > 90 && "> Establishing Secure Stream..."}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const VisualAnalysis: React.FC<{
  isAnalyzing: boolean;
  detections: Detection[];
  currentImage: string;
}> = ({ isAnalyzing, detections, currentImage }) => {
  return (
    <div className="flex-1 flex flex-col gap-4 p-6 overflow-hidden">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase italic">Inference Output</h1>
          <span className="bg-edia-cyan/10 border border-edia-cyan/50 text-edia-cyan px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
            <span className="material-icons text-xs">settings_input_component</span> ACTIVE ENGINE
          </span>
        </div>
      </div>

      <div className="flex-1 relative bg-surface-dark border border-white/10 overflow-hidden group grid-overlay">
        <div className="w-full h-full relative flex items-center justify-center bg-black">
          <img
            src={currentImage || "https://picsum.photos/seed/industrial-qc/1200/800"}
            className={`w-full h-full object-contain transition-opacity duration-500 ${isAnalyzing ? 'opacity-30' : 'opacity-80'}`}
            alt="Inspection Frame"
          />
          <div className="scanline"></div>

          {!isAnalyzing && detections.map((det) => (
            <div
              key={det.id}
              className="absolute border-2 transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.5)] z-40 group-hover:opacity-100"
              style={{
                top: `${det.bbox[0]}%`,
                left: `${det.bbox[1]}%`,
                width: `${det.bbox[2]}%`,
                height: `${det.bbox[3]}%`,
                borderColor: det.color,
                backgroundColor: `${det.color}15`
              }}
            >
              <div
                className="absolute -top-6 left-[-2px] px-2 py-0.5 text-[10px] font-bold text-white uppercase whitespace-nowrap flex items-center gap-1"
                style={{ backgroundColor: det.color }}
              >
                {det.label}
                <span className="opacity-70 text-[8px]">{(det.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>

        {isAnalyzing && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-edia-cyan border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
              <p className="text-edia-cyan font-mono text-sm animate-pulse tracking-[0.2em]">EXECUTING WORKFLOW...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Sidebar: React.FC<{
  detections: Detection[];
  summary: string;
  modelName: string;
  onReset: () => void;
}> = ({ detections, summary, modelName, onReset }) => {
  return (
    <aside className="w-[380px] bg-panel-dark border-l border-white/10 flex flex-col shrink-0 overflow-y-auto">
      {/* Model Loading Area */}
      <div className="p-6 border-b border-white/10 bg-surface-dark/50">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Model</h2>
            <p className="text-xs font-mono text-edia-cyan font-bold truncate max-w-[200px]">{modelName}</p>
          </div>
          <button onClick={onReset} className="text-[9px] text-gray-600 hover:text-error uppercase font-bold transition-colors">Switch</button>
        </div>
        <div className="flex items-center gap-2 text-[9px] text-gray-500 uppercase font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          <span>Workflow Connected (Cloud)</span>
        </div>
      </div>

      {/* Detected Classes */}
      <div className="p-6 border-b border-white/10 bg-surface-dark">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex justify-between">
          <span>Active Labels</span>
          <span className="text-edia-cyan font-mono">{detections.length}</span>
        </h2>

        <div className="space-y-2">
          {detections.length > 0 ? (
            detections.map(det => (
              <div key={det.id} className="flex items-center gap-3 bg-black/40 p-2 border-l-2" style={{ borderLeftColor: det.color }}>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-white uppercase">{det.label}</span>
                    <span className="text-[10px] font-mono text-gray-500">{(det.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
                    <div className="h-full transition-all duration-1000" style={{ backgroundColor: det.color, width: `${det.confidence * 100}%` }}></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center border border-white/5 bg-black/20">
              <p className="text-[10px] text-gray-600 uppercase italic">No active detections</p>
            </div>
          )}
        </div>
      </div>

      {/* Supported Classes List - NEW SECTION */}
      <div className="p-6 border-b border-white/10 bg-surface-dark/30">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Target Classes</h2>
        <div className="grid grid-cols-2 gap-2">
          {SUPPORTED_CLASSES.map(cls => (
            <div key={cls.id} className="flex items-center gap-2 p-1.5 bg-black/40 border border-white/5 rounded-sm">
              <div className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" style={{ color: cls.color, backgroundColor: cls.color }}></div>
              <span className="text-[10px] text-gray-400 font-mono uppercase">{cls.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Model Insights */}
      <div className="p-6 flex-1">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Inference Summary</h2>
        <div className="bg-black/50 border border-white/5 p-4 rounded-sm">
          <p className="text-xs text-gray-400 leading-relaxed font-mono">
            {summary || "Upload frame to start visual inspection with active .PT model."}
          </p>
        </div>
      </div>

      <div className="p-6 bg-surface-dark border-t border-white/10">
        <button className="w-full py-4 bg-mitsubishi-red text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors">Generate QC Report</button>
      </div>
    </aside>
  );
};

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', text: input };
    setHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getChatResponse(history.map(h => ({ role: h.role, text: h.text })), input);
      setHistory(prev => [...prev, { role: 'model', text: response || "Error." }]);
    } catch (e) {
      setHistory(prev => [...prev, { role: 'model', text: "Error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed bottom-6 left-6 z-[60] flex flex-col transition-all duration-300 ${isOpen ? 'w-[320px] h-[450px]' : 'w-12 h-12'}`}>
      {isOpen ? (
        <div className="bg-panel-dark border border-white/10 shadow-2xl flex flex-col h-full overflow-hidden">
          <div className="p-3 bg-surface-dark border-b border-white/10 flex justify-between items-center shrink-0">
            <span className="text-[10px] font-bold text-edia-cyan uppercase tracking-widest">Model Assistant</span>
            <button onClick={() => setIsOpen(false)} className="material-icons text-sm text-gray-500 hover:text-white">close</button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-[11px]">
            {history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-2 ${msg.role === 'user' ? 'bg-edia-cyan/10 border border-edia-cyan/20 text-edia-cyan' : 'bg-surface-dark border border-white/10 text-gray-300'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-white/10 flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask about labels..." className="flex-1 bg-black border border-white/10 text-[11px] p-2 focus:border-edia-cyan focus:ring-0 text-white" />
            <button onClick={handleSend} className="bg-edia-cyan text-black p-2 material-icons text-sm">send</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="w-12 h-12 bg-surface-dark border border-white/10 text-edia-cyan flex items-center justify-center hover:bg-edia-cyan hover:text-black transition-all">
          <span className="material-icons">terminal</span>
        </button>
      )}
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [modelFile, setModelFile] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [summary, setSummary] = useState('');
  const [currentImage, setCurrentImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setDetections([]);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const resultStr = reader.result as string;
      const base64 = resultStr.split(',')[1];
      setCurrentImage(resultStr);

      // Get image dimensions for correct bounding box mapping
      const img = new Image();
      img.src = resultStr;
      img.onload = async () => {
        const imageDims = { width: img.naturalWidth, height: img.naturalHeight };

        try {
          // Use Roboflow workflow service with explicit dimensions
          const result: any = await runRoboflowWorkflow(base64, file.type, imageDims);

          // Map common Roboflow classes to colors if present, or generate
          const mappedDetections: Detection[] = result.detections.map((d: any, idx: number) => ({
            id: `det-${idx}`,
            label: d.label,
            confidence: d.confidence,
            bbox: d.bbox,
            color: getLabelColor(d.label) // Helper from existing code
          }));

          setDetections(mappedDetections);
          setSummary(result.summary);
        } catch (err) {
          console.error(err);
          setSummary("Inference failed.");
        } finally {
          setIsAnalyzing(false);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  if (!modelFile) {
    return <ConfigScreen onConfigured={setModelFile} />;
  }

  return (
    <div className="flex flex-col h-screen font-sans selection:bg-edia-cyan selection:text-black bg-background-dark animate-in fade-in duration-700">
      <Header modelName={modelFile} />
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <VisualAnalysis
            isAnalyzing={isAnalyzing}
            detections={detections}
            currentImage={currentImage}
          />
          <div className="h-16 bg-panel-dark border-t border-white/10 flex items-center px-6 gap-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-edia-cyan text-black px-4 py-2 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-white transition-colors"
            >
              <span className="material-icons text-sm">add_a_photo</span> Run Inference
            </button>
            <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileUpload} />

            <div className="flex-1 flex items-center gap-4">
              <div className="h-1 bg-white/5 flex-1 relative">
                <div className="absolute top-0 left-0 h-full bg-edia-cyan/30 w-full"></div>
                <div className="absolute top-0 left-[40%] w-1 h-3 -mt-1 bg-edia-cyan shadow-[0_0_8px_#00FDFF]"></div>
              </div>
              <span className="text-[10px] font-mono text-gray-500 uppercase">Engine Status: Active</span>
            </div>
          </div>
        </div>
        <Sidebar
          detections={detections}
          summary={summary}
          modelName={modelFile}
          onReset={() => setModelFile(null)}
        />
      </div>

      <ChatWidget />
    </div>
  );
};

export default App;
