import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF } from '@react-three/drei';

function Model({ url }: { url: string }) {
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
}

interface ModelViewerProps {
    modelPath?: string; // Optional: Load model from this path directly
}

export const ModelViewer: React.FC<ModelViewerProps> = ({ modelPath }) => {
    const [modelUrl, setModelUrl] = useState<string | null>(modelPath || null);

    // Update modelUrl if modelPath prop changes
    useEffect(() => {
        if (modelPath) {
            setModelUrl(modelPath);
        }
    }, [modelPath]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setModelUrl(url);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black">
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-panel-dark">
                <div className="flex items-center gap-3">
                    <span className="material-icons text-edia-cyan">view_in_ar</span>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">3D Model Inspector</h2>
                </div>
                <div>
                    <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white text-xs px-4 py-2 border border-white/10 uppercase tracking-widest flex items-center gap-2 transition-colors">
                        <span className="material-icons text-sm">upload_file</span>
                        Load Model (.glb/.gltf)
                        <input type="file" accept=".glb,.gltf" onChange={handleFileUpload} className="hidden" />
                    </label>
                </div>
            </div>

            <div className="flex-1 relative bg-gradient-to-b from-gray-900 to-black overflow-hidden">
                {!modelUrl ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                        <span className="material-icons text-6xl mb-4 opacity-50">cube</span>
                        <p className="font-mono text-sm uppercase tracking-widest">No 3D Model Loaded</p>
                        <p className="text-xs mt-2 opacity-50">Upload a .glb or .gltf file to verify part geometry</p>
                    </div>
                ) : (
                    <Canvas shadows dpr={[1, 2]} camera={{ fov: 50 }}>
                        <Stage environment="city" intensity={0.6}>
                            <Model url={modelUrl} />
                        </Stage>
                        <OrbitControls makeDefault />
                    </Canvas>
                )}
            </div>

            <div className="p-2 border-t border-white/10 bg-panel-dark text-[10px] text-gray-500 font-mono flex justify-between">
                <span>LMB: Rotate | RMB: Pan | Scroll: Zoom</span>
                {modelUrl && <span className="text-edia-cyan">MODEL LOADED</span>}
            </div>
        </div>
    );
};
