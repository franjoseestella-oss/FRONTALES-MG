import React, { useEffect, useState } from 'react';
import { getModelsInfo, ModelInfo } from '../services/models3d';
import { ModelViewer } from './ModelViewer';

interface ProductionSequence {
    REFERENCIA: string;
    SECUENCIA: number;
    DESCRIPCION: string;
    hasModel?: boolean; // Added to track if 3D model exists
}

interface ProductionPlanScreenProps {
    onLoadReference: (referencia: string, descripcion: string, secuencia?: number) => void;
}

export const ProductionPlanScreen: React.FC<ProductionPlanScreenProps> = ({ onLoadReference }) => {
    const [sequences, setSequences] = useState<ProductionSequence[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRef, setSelectedRef] = useState<ProductionSequence | null>(null);
    const [showViewer, setShowViewer] = useState(false);

    const fetchPlan = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5000/production-plan');
            const result = await response.json();

            if (result.success) {
                const data = result.data as ProductionSequence[];

                // Check which references have 3D models
                const referencias = data.map(s => s.REFERENCIA);
                const modelsInfo = await getModelsInfo(referencias);

                // Enrich data with model availability
                const enrichedData = data.map(seq => ({
                    ...seq,
                    hasModel: modelsInfo.get(seq.REFERENCIA)?.exists || false
                }));

                setSequences(enrichedData);
            } else {
                throw new Error(result.error || "Unknown database error");
            }
        } catch (err: any) {
            console.error("Failed to load plan:", err);
            setError(err.message || "Failed to connect to Database");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectReference = (seq: ProductionSequence) => {
        if (seq.hasModel) {
            setSelectedRef(seq);
            setShowViewer(true);
        } else {
            alert(`No 3D model available for reference: ${seq.REFERENCIA}\n\nAdd file: public/models/${seq.REFERENCIA}.glb`);
        }
    };

    useEffect(() => {
        fetchPlan();
    }, []);

    return (
        <div className="flex-1 flex flex-col p-6 bg-surface-dark overflow-hidden animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white uppercase italic">Production Plan</h1>
                    <p className="text-gray-400 text-xs font-mono mt-1">SOURCE: DAFEED.dbo.SECUENCIAS_FRONTALES_MG</p>
                </div>
                <button
                    onClick={fetchPlan}
                    className="bg-white/5 hover:bg-white/10 text-edia-cyan border border-edia-cyan/30 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                    <span className="material-icons text-sm">refresh</span> Refresh Data
                </button>
            </div>

            <div className="flex-1 bg-black/20 border border-white/10 rounded-sm overflow-hidden flex flex-col relative">

                {/* Header Row */}
                <div className="grid grid-cols-4 bg-white/5 border-b border-white/10 p-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <div>Reference</div>
                    <div>Sequence</div>
                    <div>Description</div>
                    <div className="text-center">3D Model</div>
                </div>

                {/* Data Rows */}
                <div className="flex-1 overflow-y-auto font-mono text-sm">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-edia-cyan animate-pulse">
                            <span className="material-icons mr-2">dns</span> Loading Database...
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-error p-8 text-center">
                            <span className="material-icons text-4xl mb-2">error_outline</span>
                            <p className="font-bold mb-2">Connection Failed</p>
                            <p className="text-xs opacity-70 max-w-md break-words bg-black/50 p-4 rounded border border-white/10">{error}</p>
                            <button onClick={fetchPlan} className="mt-4 text-white underline text-xs">Try Again</button>
                        </div>
                    ) : sequences.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500 italic">
                            No records found.
                        </div>
                    ) : (
                        sequences.map((seq, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleSelectReference(seq)}
                                className={`grid grid-cols-4 p-3 border-b border-white/5 transition-all cursor-pointer ${selectedRef?.REFERENCIA === seq.REFERENCIA
                                    ? 'bg-edia-cyan/20 border-l-4 border-l-edia-cyan'
                                    : 'hover:bg-white/10 hover:border-l-4 hover:border-l-edia-cyan/50'
                                    } ${seq.hasModel ? '' : 'opacity-60'}`}
                            >
                                <div className="font-bold text-white">{seq.REFERENCIA}</div>
                                <div className="text-edia-cyan">{seq.SECUENCIA}</div>
                                <div className="truncate" title={seq.DESCRIPCION}>{seq.DESCRIPCION}</div>
                                <div className="flex items-center justify-center">
                                    {seq.hasModel ? (
                                        <span className="material-icons text-green-500 text-lg" title="3D Model Available">
                                            check_circle
                                        </span>
                                    ) : (
                                        <span className="material-icons text-gray-600 text-lg" title="No 3D Model">
                                            cancel
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Count */}
                <div className="bg-black/40 border-t border-white/10 p-2 text-[10px] text-gray-500 font-mono flex justify-end">
                    Row Count: {sequences.length}
                </div>
            </div>

            {/* Connection Status Indicator */}
            <div className="mt-4 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${error ? 'bg-error' : loading ? 'bg-yellow-500' : 'bg-green-500 shadow-[0_0_8px_#00FF00]'}`}></div>
                <span className="text-[10px] text-gray-400 font-mono uppercase">
                    {error ? "Database Offline" : loading ? "Connecting..." : "SQL Server Connected"}
                </span>
            </div>

            {/* 3D Model Viewer Panel - Slide from Right */}
            {showViewer && selectedRef && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="h-full w-[600px] bg-panel-dark border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

                        {/* Panel Header */}
                        <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/40">
                            <div className="flex flex-col">
                                <span className="text-white font-bold text-sm uppercase tracking-wider">3D Model Viewer</span>
                                <span className="text-edia-cyan text-xs font-mono">
                                    {selectedRef.REFERENCIA} - SEQ {selectedRef.SECUENCIA}
                                </span>
                            </div>
                            <button
                                onClick={() => setShowViewer(false)}
                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                            >
                                <span className="material-icons text-white">close</span>
                            </button>
                        </div>

                        {/* Model Info Card */}
                        <div className="px-6 py-4 bg-black/20 border-b border-white/10">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <span className="text-gray-500 uppercase tracking-widest block mb-1">Reference</span>
                                    <span className="text-white font-bold font-mono">{selectedRef.REFERENCIA}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 uppercase tracking-widest block mb-1">Sequence</span>
                                    <span className="text-edia-cyan font-bold font-mono">{selectedRef.SECUENCIA}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-gray-500 uppercase tracking-widest block mb-1">Description</span>
                                    <span className="text-white">{selectedRef.DESCRIPCION}</span>
                                </div>
                            </div>
                        </div>

                        {/* 3D Viewer */}
                        <div className="flex-1 bg-gradient-to-b from-black/40 to-black/60 relative overflow-hidden">
                            <ModelViewer
                                modelPath={`/models/${selectedRef.REFERENCIA}.glb`}

                            />

                            {/* Model Path Indicator */}
                            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md px-3 py-2 rounded border border-white/10">
                                <span className="text-[10px] text-gray-400 font-mono">
                                    📁 /models/{selectedRef.REFERENCIA}.glb
                                </span>
                            </div>
                        </div>

                        {/* Panel Footer with Load Button */}
                        <div className="border-t border-white/10 bg-black/40">
                            {/* Action Button */}
                            <div className="p-4">
                                <button
                                    onClick={() => {
                                        onLoadReference(selectedRef.REFERENCIA, selectedRef.DESCRIPCION, selectedRef.SECUENCIA);
                                        setShowViewer(false);
                                    }}
                                    className="w-full bg-edia-cyan hover:bg-white text-black font-bold py-3 px-6 uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-edia-cyan/50"
                                >
                                    <span className="material-icons text-sm">play_arrow</span>
                                    Load for Inspection
                                </button>
                            </div>

                            {/* Controls Hint */}
                            <div className="px-4 pb-3 flex items-center justify-center gap-6 text-[10px] text-gray-500 uppercase tracking-widest">
                                <span>🖱️ Drag to Rotate</span>
                                <span>🔍 Scroll to Zoom</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
