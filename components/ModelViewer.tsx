import React, { useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, Html, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { Settings3DScreen, Settings3DConfig, defaultSettings } from './Settings3DScreen';

function Model({ url }: { url: string }) {
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
}

interface Hotspot {
    id: string;
    position: [number, number, number];
    text: string;
}

interface Label3DProps {
    hotspot: Hotspot;
    isSelected: boolean;
    onClick: () => void;
}

function Label3D({ hotspot, isSelected, onClick }: Label3DProps) {
    return (
        <Html position={hotspot.position} center>
            <div
                className={`label-hotspot ${isSelected ? 'selected' : ''}`}
                onClick={onClick}
                style={{ cursor: 'pointer' }}
            >
                <div className="hotspot-annotation">{hotspot.text}</div>
            </div>
        </Html>
    );
}

function ClickToAddHotspot({ onAddHotspot, enabled }: { onAddHotspot: (position: [number, number, number]) => void, enabled: boolean }) {
    const { camera, scene, raycaster } = useThree();

    useEffect(() => {
        if (!enabled) return;

        const handleClick = (event: MouseEvent) => {
            const canvas = event.target as HTMLCanvasElement;
            const rect = canvas.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            const mouseVector = new THREE.Vector2(x, y);
            raycaster.setFromCamera(mouseVector, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);

            if (intersects.length > 0) {
                const point = intersects[0].point;
                onAddHotspot([point.x, point.y, point.z]);
            }
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [enabled, camera, scene, raycaster, onAddHotspot]);

    return null;
}

interface ModelViewerProps {
    modelPath?: string;
    showControls?: boolean; // Nueva prop para mostrar/ocultar controles
}

export const ModelViewer: React.FC<ModelViewerProps> = ({ modelPath, showControls = false }) => {
    const [modelUrl, setModelUrl] = useState<string | null>(modelPath || null);
    const [hotspots, setHotspots] = useState<Hotspot[]>([]);
    const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
    const [showHotspots, setShowHotspots] = useState(false);
    const [addMode, setAddMode] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settings3D, setSettings3D] = useState<Settings3DConfig>(defaultSettings);

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

    const addHotspot = () => {
        const newHotspot: Hotspot = {
            id: Date.now().toString(),
            position: [0, 0.3, 0],
            text: `P${hotspots.length + 1}`
        };
        setHotspots([...hotspots, newHotspot]);
        setSelectedHotspotId(newHotspot.id);
    };

    const addHotspotAtPosition = (position: [number, number, number]) => {
        if (!addMode) return;
        const newHotspot: Hotspot = {
            id: Date.now().toString(),
            position,
            text: `P${hotspots.length + 1}`
        };
        setHotspots([...hotspots, newHotspot]);
        setSelectedHotspotId(newHotspot.id);
        setAddMode(false);
    };

    const deleteHotspot = (id: string) => {
        setHotspots(hotspots.filter(h => h.id !== id));
        if (selectedHotspotId === id) {
            setSelectedHotspotId(null);
        }
    };

    const updateHotspot = (id: string, updates: Partial<Hotspot>) => {
        setHotspots(hotspots.map(h => h.id === id ? { ...h, ...updates } : h));
    };

    const selectedHotspot = hotspots.find(h => h.id === selectedHotspotId);

    const renderCanvas = () => (
        <Canvas
            shadows={settings3D.enableShadows}
            dpr={[1, 2]}
            camera={{ fov: settings3D.cameraFov }}
            style={{ background: settings3D.backgroundColor }}
        >
            <Stage environment={settings3D.environment} intensity={settings3D.lightIntensity}>
                <Model url={modelUrl!} />
                {showControls && showHotspots && hotspots.map(hotspot => (
                    <Label3D
                        key={hotspot.id}
                        hotspot={hotspot}
                        isSelected={hotspot.id === selectedHotspotId}
                        onClick={() => setSelectedHotspotId(hotspot.id)}
                    />
                ))}
            </Stage>
            {settings3D.showGrid && <Grid args={[10, 10]} />}
            {settings3D.showAxes && (
                <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                    <GizmoViewport />
                </GizmoHelper>
            )}
            <OrbitControls
                makeDefault
                enabled={!addMode}
                autoRotate={settings3D.autoRotate}
                autoRotateSpeed={settings3D.autoRotateSpeed}
            />
            {showControls && showHotspots && <ClickToAddHotspot onAddHotspot={addHotspotAtPosition} enabled={addMode} />}
        </Canvas>
    );

    return (
        <div className="flex flex-col h-full bg-black">
            {/* Header */}
            <div className="border-b border-white/10 bg-panel-dark">
                <div className="flex justify-between items-center p-4">
                    <div className="flex items-center gap-3">
                        <span className="material-icons text-edia-cyan">view_in_ar</span>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">3D Model Inspector</h2>
                    </div>
                    <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white text-xs px-4 py-2 border border-white/10 uppercase tracking-widest flex items-center gap-2 transition-colors">
                        <span className="material-icons text-sm">upload_file</span>
                        Load Model
                        <input type="file" accept=".glb,.gltf" onChange={handleFileUpload} className="hidden" />
                    </label>
                </div>

                {/* Tabs - Solo si showControls es true */}
                {showControls && (
                    <div className="flex border-t border-white/10">
                        <button
                            onClick={() => setSettingsOpen(true)}
                            className="flex-1 px-4 py-3 text-xs uppercase tracking-widest font-bold transition-all bg-white/5 hover:bg-white/10 text-white border-r border-white/10 flex items-center justify-center gap-2"
                        >
                            <span className="material-icons text-sm">settings</span>
                            Configuración
                        </button>
                        <button
                            onClick={() => setShowHotspots(!showHotspots)}
                            className={`flex-1 px-4 py-3 text-xs uppercase tracking-widest font-bold transition-all ${showHotspots
                                    ? 'bg-edia-cyan text-black'
                                    : 'bg-white/5 hover:bg-white/10 text-white'
                                } flex items-center justify-center gap-2`}
                        >
                            <span className="material-icons text-sm">label</span>
                            Hotspots
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 relative bg-gradient-to-b from-gray-900 to-black">
                    {!modelUrl ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                            <span className="material-icons text-6xl mb-4 opacity-50">cube</span>
                            <p className="font-mono text-sm uppercase tracking-widest">No 3D Model Loaded</p>
                            <p className="text-xs mt-2 opacity-50">Upload a .glb or .gltf file to verify part geometry</p>
                        </div>
                    ) : (
                        <>
                            {addMode && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-edia-cyan text-black px-4 py-2 rounded text-sm font-bold uppercase tracking-wider z-10 animate-pulse">
                                    Click on the model to add hotspot
                                </div>
                            )}
                            {renderCanvas()}
                        </>
                    )}
                </div>

                {/* Hotspot Editor Panel - Solo si showControls y showHotspots */}
                {showControls && showHotspots && (
                    <div className="w-80 bg-panel-dark border-l border-white/10 flex flex-col">
                        <div className="p-4 border-b border-white/10 bg-black">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Hotspot Editor</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={addHotspot}
                                    className="flex-1 bg-edia-cyan hover:bg-edia-cyan/80 text-black text-xs px-3 py-2 uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                                >
                                    <span className="material-icons text-sm">add</span>
                                    Add
                                </button>
                                <button
                                    onClick={() => setAddMode(!addMode)}
                                    className={`flex-1 ${addMode ? 'bg-mitsubishi-red' : 'bg-white/10'} hover:opacity-80 text-white text-xs px-3 py-2 uppercase tracking-widest flex items-center justify-center gap-2 transition-colors`}
                                >
                                    <span className="material-icons text-sm">touch_app</span>
                                    {addMode ? 'Cancel' : 'Click'}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {hotspots.length === 0 ? (
                                <div className="text-center text-gray-500 text-xs py-8">
                                    No hotspots yet<br />Click "Add" to create one
                                </div>
                            ) : (
                                hotspots.map(hotspot => (
                                    <div
                                        key={hotspot.id}
                                        className={`p-3 border ${hotspot.id === selectedHotspotId ? 'border-edia-cyan bg-edia-cyan/10' : 'border-white/10 bg-white/5'} cursor-pointer transition-all`}
                                        onClick={() => setSelectedHotspotId(hotspot.id)}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-white font-bold text-sm">{hotspot.text}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteHotspot(hotspot.id);
                                                }}
                                                className="text-mitsubishi-red hover:bg-mitsubishi-red/20 p-1"
                                            >
                                                <span className="material-icons text-sm">delete</span>
                                            </button>
                                        </div>
                                        <div className="text-xs text-gray-400 font-mono">
                                            [{hotspot.position[0].toFixed(2)}, {hotspot.position[1].toFixed(2)}, {hotspot.position[2].toFixed(2)}]
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {selectedHotspot && (
                            <div className="p-4 border-t border-white/10 bg-black/50">
                                <h4 className="text-xs font-bold text-edia-cyan uppercase tracking-wider mb-3">Edit Hotspot</h4>

                                <label className="block mb-3">
                                    <span className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Label Text</span>
                                    <input
                                        type="text"
                                        value={selectedHotspot.text}
                                        onChange={(e) => updateHotspot(selectedHotspot.id, { text: e.target.value })}
                                        className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-edia-cyan"
                                    />
                                </label>

                                <div className="space-y-2">
                                    <span className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Position</span>
                                    {['X', 'Y', 'Z'].map((axis, idx) => (
                                        <label key={axis} className="block">
                                            <span className="text-xs text-gray-500 uppercase mb-1 block">{axis}</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={selectedHotspot.position[idx]}
                                                onChange={(e) => {
                                                    const newPos: [number, number, number] = [...selectedHotspot.position];
                                                    newPos[idx] = parseFloat(e.target.value) || 0;
                                                    updateHotspot(selectedHotspot.id, { position: newPos });
                                                }}
                                                className="w-full bg-white/10 border border-white/20 text-white px-3 py-1 text-sm font-mono focus:outline-none focus:border-edia-cyan"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-white/10 bg-panel-dark text-[10px] text-gray-500 font-mono flex justify-between">
                <span>LMB: Rotate | RMB: Pan | Scroll: Zoom</span>
                <div className="flex gap-4">
                    {modelUrl && <span className="text-edia-cyan">MODEL LOADED</span>}
                    {showControls && showHotspots && <span className="text-white">Hotspots: {hotspots.length}</span>}
                </div>
            </div>

            {/* Settings Modal */}
            {settingsOpen && (
                <Settings3DScreen
                    currentSettings={settings3D}
                    onSettingsChange={setSettings3D}
                    onClose={() => setSettingsOpen(false)}
                />
            )}
        </div>
    );
};
