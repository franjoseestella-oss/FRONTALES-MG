
import React, { useState, useEffect, useRef } from 'react';
import { Detection, Message } from './types';
import { getChatResponse } from './services/gemini';
import { runRoboflowWorkflow } from './services/roboflow';
import { fetchProjectClasses } from './services/roboflowClasses';
import { loadLocalModel, runLocalInference } from './services/localInference';
import { ModelViewer } from './components/ModelViewer';
import { ProductionPlanScreen } from './components/ProductionPlanScreen';

// ... (keep getLabelColor unchanged)
const getLabelColor = (label: string, activeColors: Record<string, string> = {}) => {
  // 1. Enforce strict color rules for QC status first (User Request: NOK=Red, OK=Green)
  const lower = label.toLowerCase();

  // Defect/Fail conditions -> Red
  if (lower.includes('nok') || lower.includes('malo') || lower.includes('missing') || lower.includes('dent') || lower.includes('scratch')) {
    return '#FF0000'; // Standard Red
  }

  // Good/Pass conditions -> Green
  if (lower.includes('ok') || lower.includes('bueno') || lower.includes('good')) {
    return '#00FF00'; // Standard Green
  }

  // 2. Fallback to Roboflow Project Colors if available
  if (activeColors[label]) {
    return activeColors[label];
  }

  // 3. Fallback for Warnings/Neutral
  return '#FFA500'; // Orange
};

// ... (keep Header unchanged except maybe model name usage)
const Header: React.FC<{ modelName: string; mode: 'cloud' | 'local'; currentView: string; onViewChange: (view: 'inference' | 'plan' | 'config3d') => void }> = ({ modelName, mode, currentView, onViewChange }) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-GB', { hour12: false }));

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString('en-GB', { hour12: false })), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-white/10 bg-panel-dark flex items-center justify-between px-6 shrink-0 z-50">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <img src="/Imagenes/logo.PNG" alt="Mitsubishi Logisnext" className="h-[60px] object-contain" />
        </div>

        <div className="h-8 w-px bg-white/10 mx-4"></div>

        <nav className="flex space-x-1">
          <button
            onClick={() => onViewChange('inference')}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded transition-colors ${currentView === 'inference' ? 'bg-edia-cyan text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Inspección
          </button>
          <button
            onClick={() => onViewChange('plan')}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded transition-colors ${currentView === 'plan' ? 'bg-edia-cyan text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Production Plan
          </button>
          <button
            onClick={() => onViewChange('config3d')}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded transition-colors ${currentView === 'config3d' ? 'bg-edia-cyan text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Configurar 3D
          </button>
        </nav>
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

const ConfigScreen: React.FC<{
  onConfigured: (fileName: string, classes: string[], colors: Record<string, string>, mode: 'cloud' | 'local') => void
}> = ({ onConfigured }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleConnect = async () => {
    setIsUploading(true);
    let p = 0;
    const timer = setInterval(() => { if (p < 90) setProgress(p => p + 2); }, 50);

    try {
      // Cloud Logic Only
      // We use the Workspace ID 'welding-hqci3' to fetch classes/colors metadata if possible, 
      // or just default to empty/standard logic since the Main Inference is now Proxied.
      // fetchProjectClasses might fail if key is Private on Browser?
      // Let's wrap it safe or just use hardcoded/inferred classes from inference result later?
      // For now, try fetching as before. If it fails, proceed with defaults.

      let allClasses: string[] = ["object"];
      let allColors: Record<string, string> = {};

      try {
        const projects = await fetchProjectClasses(import.meta.env.VITE_ROBOFLOW_API_KEY, "welding-hqci3");
        allClasses = Array.from(new Set(projects.flatMap(p => p.classes)));
        allColors = projects.reduce((acc, p) => ({ ...acc, ...p.colors }), {});
      } catch (fetchErr) {
        console.warn("Could not fetch project metadata (likely Private Key CORS). Using defaults.", fetchErr);
        // Non-fatal. Continue to allow Inference Proxy to work.
      }

      clearInterval(timer);
      setProgress(100);
      setTimeout(() => onConfigured("frontalmg", allClasses, allColors, 'cloud'), 500);
    } catch (e: any) {
      console.error(e);
      clearInterval(timer);
      setIsUploading(false);
      alert(`Connection failed: ${e.message}`);
    }
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
            <p className="text-[10px] text-gray-500 font-mono">v4.2.0-CloudOnly</p>
          </div>
        </div>

        {!isUploading ? (
          <div className="space-y-6">
            <div className="text-xs text-gray-400 font-mono leading-relaxed p-4 bg-white/5 border border-white/5">
              Connect to Roboflow Inference Engine.
              <br />
              <span className="opacity-50 text-[10px]">Using Python SDK Proxy</span>
            </div>

            <button
              onClick={handleConnect}
              className="w-full py-6 border-2 border-dashed border-edia-cyan/30 hover:border-edia-cyan hover:bg-edia-cyan/5 transition-all group flex flex-col items-center gap-3"
            >
              <span className="material-icons text-edia-cyan group-hover:scale-110 transition-transform">cloud_sync</span>
              <span className="text-[10px] font-bold text-edia-cyan uppercase tracking-widest">
                Connect to Roboflow
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] text-edia-cyan font-bold uppercase animate-pulse">Initializing SDK...</span>
              <span className="text-xl font-mono text-white">{progress}%</span>
            </div>
            <div className="h-1 bg-white/5 w-full">
              <div className="h-full bg-edia-cyan shadow-[0_0_10px_#00FDFF]" style={{ width: `${progress}%` }}></div>
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
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});

  // Function to calculate the exact position of the image within the container
  const updateOverlayPosition = () => {
    if (!imgRef.current || !containerRef.current) return;

    const img = imgRef.current;
    const container = containerRef.current;

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = container.clientWidth / container.clientHeight;

    let displayedWidth, displayedHeight, top, left;

    if (containerRatio > imgRatio) {
      // Image is taller than container (constrained by height)
      displayedHeight = container.clientHeight;
      displayedWidth = displayedHeight * imgRatio;
      top = 0;
      left = (container.clientWidth - displayedWidth) / 2;
    } else {
      // Image is wider than container (constrained by width)
      displayedWidth = container.clientWidth;
      displayedHeight = displayedWidth / imgRatio;
      left = 0;
      top = (container.clientHeight - displayedHeight) / 2;
    }

    setOverlayStyle({
      position: 'absolute',
      top: `${top}px`,
      left: `${left}px`,
      width: `${displayedWidth}px`,
      height: `${displayedHeight}px`,
      // Ensure overlay is exactly on top of image
      pointerEvents: 'none'
    });
  };

  useEffect(() => {
    window.addEventListener('resize', updateOverlayPosition);
    return () => window.removeEventListener('resize', updateOverlayPosition);
  }, []);

  // --- Simulated Progress for Analysis ---
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAnalyzing) {
      setProgress(0);
      // Fast simulation
      timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(timer);
            return 90;
          }
          return prev + 5;
        });
      }, 50);
    } else {
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    }
    return () => clearInterval(timer);
  }, [isAnalyzing]);

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

      <div ref={containerRef} className="flex-1 relative bg-surface-dark border border-white/10 overflow-hidden group grid-overlay">
        <div className="w-full h-full relative flex items-center justify-center bg-black">
          <img
            ref={imgRef}
            src={currentImage || "https://picsum.photos/seed/industrial-qc/1200/800"}
            className={`w-full h-full object-contain transition-opacity duration-500 ${isAnalyzing ? 'opacity-30' : 'opacity-80'}`}
            alt="Inspection Frame"
            onLoad={updateOverlayPosition}
          />

          <div style={overlayStyle} className="pointer-events-none">
            <div className="scanline"></div>
            {!isAnalyzing && detections.map((det) => (
              <div
                key={det.id}
                className={`absolute border-2 transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.5)] z-40 group-hover:opacity-100 ${det.color === '#FF0000' ? 'blink-urgent' : ''}`}
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
        </div>

        {!isAnalyzing && detections.length > 0 && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
            {detections.some(d => d.label.toLowerCase().includes('nok')) ? (
              <div className="bg-[#FF0000]/20 border-2 border-[#FF0000] backdrop-blur-md px-6 py-2 rounded-sm shadow-[0_0_20px_rgba(255,0,0,0.6)] flex items-center gap-3 animate-pulse">
                <span className="material-icons text-[#FF0000] text-3xl">warning</span>
                <span className="text-[#FF0000] font-black text-xl tracking-widest uppercase">FRONTAL MG NOK</span>
              </div>
            ) : (
              <div className="bg-[#00FF00]/20 border-2 border-[#00FF00] backdrop-blur-md px-6 py-2 rounded-sm shadow-[0_0_20px_rgba(0,255,0,0.4)] flex items-center gap-3">
                <span className="material-icons text-[#00FF00] text-3xl">check_circle</span>
                <span className="text-[#00FF00] font-black text-xl tracking-widest uppercase">FRONTALES MG OK</span>
              </div>
            )}
          </div>
        )}

        {isAnalyzing && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
            <div className="w-96">
              <div className="flex justify-between items-end mb-2">
                <span className="text-edia-cyan font-mono text-sm animate-pulse tracking-[0.2em] uppercase">Processing Frame...</span>
                <span className="text-white font-mono text-xl">{progress}%</span>
              </div>
              <div className="h-2 bg-white/10 w-full overflow-hidden">
                <div
                  className="h-full bg-edia-cyan shadow-[0_0_15px_#00FDFF] transition-all duration-75 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
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
  activeClasses: string[];
  confidenceThreshold: number;
  setConfidenceThreshold: (val: number) => void;
  onReset: () => void;
  onOpen3D: () => void;
  onDebug: () => void;
  loadedReference?: { referencia: string; descripcion: string; secuencia?: number } | null;
}> = ({ detections, summary, modelName, activeClasses, confidenceThreshold, setConfidenceThreshold, onReset, onOpen3D, onDebug, loadedReference }) => {
  return (
    <aside className="w-[380px] bg-panel-dark border-l border-white/10 flex flex-col shrink-0 overflow-y-auto">
      <div className="p-6 border-b border-white/10 bg-surface-dark/50">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Model</h2>
        <p className="text-xs font-mono text-edia-cyan font-bold truncate max-w-[200px]">{modelName}</p>
        <button onClick={onReset} className="text-[9px] text-gray-600 hover:text-error uppercase font-bold transition-colors mt-2">Switch Logic</button>
      </div>
      <div className="mt-4 pt-4 border-t border-white/5 px-6">
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Confidence: {(confidenceThreshold * 100).toFixed(0)}%</span>
        <input
          type="range"
          min="0"
          max="100"
          value={confidenceThreshold * 100}
          onChange={(e) => setConfidenceThreshold(Number(e.target.value) / 100)}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-edia-cyan hover:accent-white transition-all mt-2"
        />
      </div>
      <div className="p-6 border-b border-white/10 bg-surface-dark">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Detections ({detections.length})</h2>
        <div className="space-y-2">
          {detections.map(det => (
            <div key={det.id} className="flex items-center gap-3 bg-black/40 p-2 border-l-2" style={{ borderLeftColor: det.color }}>
              <div className="flex-1">
                <span className="text-[11px] font-bold text-white uppercase block">{det.label}</span>
                <span className="text-[10px] font-mono text-gray-500">{(det.confidence * 100).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 bg-surface-dark border-t border-white/10 space-y-3">
        <button onClick={onOpen3D} className="w-full py-3 bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
          <span className="material-icons text-sm">view_in_ar</span> 3D Reference
        </button>
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

const App: React.FC = () => {
  const [modelFile, setModelFile] = useState<string | null>(null);
  const [inferenceMode, setInferenceMode] = useState<'cloud' | 'local'>('cloud');
  const [show3DViewer, setShow3DViewer] = useState(false);
  const [activeClasses, setActiveClasses] = useState<string[]>([]);
  const [activeColors, setActiveColors] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [summary, setSummary] = useState('');
  const [currentImage, setCurrentImage] = useState('');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.01);
  const [currentView, setCurrentView] = useState<'inference' | 'plan' | 'config3d'>('plan');
  const [loadedReference, setLoadedReference] = useState<{
    referencia: string;
    descripcion: string;
    secuencia?: number;
  } | null>(null);
  const [show3DInInspection, setShow3DInInspection] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDetections = detections.filter(d => d.confidence >= confidenceThreshold);

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

      const img = new Image();
      img.src = resultStr;
      img.onload = async () => {
        const imageDims = { width: img.naturalWidth, height: img.naturalHeight };

        try {
          let result: any;

          if (inferenceMode === 'cloud') {
            result = await runRoboflowWorkflow(base64, file.type, imageDims);
          } else {
            result = await runLocalInference(base64, confidenceThreshold);
          }

          const mappedDetections: Detection[] = result.detections.map((d: any, idx: number) => ({
            id: `det-${idx}`,
            label: d.label,
            confidence: d.confidence,
            bbox: d.bbox,
            color: getLabelColor(d.label, activeColors)
          }));

          setDetections(mappedDetections);
          setSummary(result.summary);

        } catch (err) {
          console.error(err);
          setSummary("Inference failed: " + (err as Error).message);
        } finally {
          setIsAnalyzing(false);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleDebug = () => {
    setDetections([
      { id: 'dbg-1', label: 'TEST OK', confidence: 0.99, bbox: [10, 10, 20, 20], color: '#00FF00' },
      { id: 'dbg-2', label: 'TEST NOK', confidence: 0.99, bbox: [40, 40, 20, 20], color: '#FF0000' }
    ]);
  };

  if (!modelFile) {
    return <ConfigScreen onConfigured={(name, classes, colors, mode) => {
      setModelFile(name);
      setActiveClasses(classes);
      setActiveColors(colors);
      setInferenceMode(mode);
    }} />;
  }

  const handleLoadReference = (referencia: string, descripcion: string, secuencia?: number) => {
    // Save the loaded reference data
    setLoadedReference({ referencia, descripcion, secuencia });
    // Switch to inspection view
    setCurrentView('inference');
    // Set model file for the header display (without extension)
    setModelFile(referencia);
    // Show 3D panel by default when loading a reference
    setShow3DInInspection(true);
  };

  return (
    <div className="flex flex-col h-screen font-sans selection:bg-edia-cyan selection:text-black bg-background-dark animate-in fade-in duration-700">
      <Header modelName={modelFile} mode={inferenceMode} currentView={currentView} onViewChange={setCurrentView} />

      {currentView === 'plan' ? (
        <ProductionPlanScreen onLoadReference={handleLoadReference} />
      ) : currentView === 'config3d' ? (
        <div className="flex-1 bg-black">
          <ModelViewer showControls={true} />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0">

            {/* Reference Info Panel - Only shown when a reference is loaded */}
            {loadedReference && (
              <div className="bg-gradient-to-r from-edia-cyan/10 to-transparent border-b border-edia-cyan/30 px-6 py-3 animate-in slide-in-from-top duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    {/* Referencia */}
                    <div className="flex flex-col">
                      <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1.5">Referencia</span>
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-edia-cyan text-base">inventory_2</span>
                        <span className="text-white font-bold font-mono text-base">{loadedReference.referencia}</span>
                      </div>
                    </div>

                    {/* Vertical Divider */}
                    <div className="h-11 w-px bg-white/10"></div>

                    {/* Secuencia */}
                    {loadedReference.secuencia && (
                      <>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1.5">Secuencia</span>
                          <div className="flex items-center gap-2">
                            <span className="material-icons text-edia-cyan text-base">tag</span>
                            <span className="text-edia-cyan font-bold font-mono text-base">{loadedReference.secuencia}</span>
                          </div>
                        </div>

                        {/* Vertical Divider */}
                        <div className="h-11 w-px bg-white/10"></div>
                      </>
                    )}

                    {/* Descripción */}
                    <div className="flex flex-col">
                      <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1.5">Descripción</span>
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-edia-cyan text-base">description</span>
                        <span className="text-white text-sm font-medium">{loadedReference.descripcion}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Toggle 3D Button */}
                    <button
                      onClick={() => setShow3DInInspection(!show3DInInspection)}
                      className={`px-3 py-1.5 flex items-center gap-2 rounded transition-all ${show3DInInspection
                        ? 'bg-edia-cyan/20 border border-edia-cyan text-edia-cyan hover:bg-edia-cyan/30'
                        : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                      title={show3DInInspection ? 'Ocultar modelo 3D' : 'Mostrar modelo 3D'}
                    >
                      <span className="material-icons text-sm">{show3DInInspection ? 'visibility' : 'visibility_off'}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">3D</span>
                    </button>

                    {/* Close Button */}
                    <button
                      onClick={() => setLoadedReference(null)}
                      className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                      title="Limpiar referencia cargada"
                    >
                      <span className="material-icons text-base">close</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content Area - Split view when reference is loaded */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Side - Visual Analysis (Inference) */}
              <div className={`flex flex-col transition-all duration-300 ${loadedReference && show3DInInspection ? 'w-1/2' : 'w-full'}`}>
                <VisualAnalysis
                  isAnalyzing={isAnalyzing}
                  detections={filteredDetections}
                  currentImage={currentImage}
                />
              </div>

              {/* Right Side - 3D Model Viewer (only when reference is loaded and 3D is enabled) */}
              {loadedReference && show3DInInspection && (
                <div className="w-1/2 border-l border-white/10 bg-black flex flex-col animate-in slide-in-from-right duration-300">
                  <div className="p-4 border-b border-white/10 bg-surface-dark/50">
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-edia-cyan text-base">view_in_ar</span>
                      <h2 className="text-sm font-bold text-white uppercase tracking-widest">3D Reference Model</h2>
                    </div>
                    <p className="text-[10px] text-gray-500 font-mono mt-1">📁 /models/{loadedReference.referencia}.glb</p>
                  </div>
                  <div className="flex-1">
                    <ModelViewer modelPath={`/models/${loadedReference.referencia}.glb`} />
                  </div>
                </div>
              )}
            </div>

            <div className="h-16 bg-panel-dark border-t border-white/10 flex items-center px-6 gap-6 shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-edia-cyan text-black px-4 py-2 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-white transition-colors"
              >
                <span className="material-icons text-sm">add_a_photo</span> Run Inference
              </button>
              <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileUpload} />

              <div className="flex-1 flex items-center gap-4">

                <span className="text-[10px] font-mono text-gray-500 uppercase">Engine Status: Active ({inferenceMode.toUpperCase()})</span>
              </div>
            </div>
          </div>
          <Sidebar
            detections={filteredDetections}
            summary={summary}
            modelName={modelFile}
            activeClasses={activeClasses}
            confidenceThreshold={confidenceThreshold}
            setConfidenceThreshold={setConfidenceThreshold}
            onReset={() => setModelFile(null)}
            onOpen3D={() => setShow3DViewer(true)}
            onDebug={handleDebug}
            loadedReference={loadedReference}
          />
        </div>
      )}

      {show3DViewer && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-8">
          <div className="bg-panel-dark border border-white/10 w-full max-w-6xl h-[80vh] flex flex-col shadow-2xl relative">
            <div className="absolute top-4 right-4 z-10">
              <button onClick={() => setShow3DViewer(false)} className="bg-black/50 hover:bg-red-500/80 text-white p-2 rounded-full transition-colors backdrop-blur-sm">
                <span className="material-icons text-xl">close</span>
              </button>
            </div>
            <ModelViewer modelPath={loadedReference ? `/models/${loadedReference.referencia}.glb` : undefined} />
          </div>
        </div>
      )}

      <ChatWidget />
    </div>
  );
};

export default App;
