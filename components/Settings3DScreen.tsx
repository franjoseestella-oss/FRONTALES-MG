import React, { useState } from 'react';

interface Settings3DConfig {
    environment: 'city' | 'sunset' | 'dawn' | 'night' | 'warehouse' | 'forest' | 'apartment' | 'studio' | 'park';
    lightIntensity: number;
    cameraFov: number;
    backgroundColor: string;
    showGrid: boolean;
    showAxes: boolean;
    enableShadows: boolean;
    autoRotate: boolean;
    autoRotateSpeed: number;
}

interface Settings3DScreenProps {
    currentSettings: Settings3DConfig;
    onSettingsChange: (settings: Settings3DConfig) => void;
    onClose: () => void;
}

const defaultSettings: Settings3DConfig = {
    environment: 'city',
    lightIntensity: 0.6,
    cameraFov: 50,
    backgroundColor: '#000000',
    showGrid: false,
    showAxes: false,
    enableShadows: true,
    autoRotate: false,
    autoRotateSpeed: 1.0
};

export const Settings3DScreen: React.FC<Settings3DScreenProps> = ({
    currentSettings,
    onSettingsChange,
    onClose
}) => {
    const [settings, setSettings] = useState<Settings3DConfig>(currentSettings);

    const updateSetting = <K extends keyof Settings3DConfig>(
        key: K,
        value: Settings3DConfig[K]
    ) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        onSettingsChange(newSettings);
    };

    const resetToDefaults = () => {
        setSettings(defaultSettings);
        onSettingsChange(defaultSettings);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-panel-dark border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-panel-dark border-b border-white/10 p-6 flex justify-between items-center z-10">
                    <div className="flex items-center gap-3">
                        <span className="material-icons text-edia-cyan">settings</span>
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                            Configuración del Visor 3D
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Environment Section */}
                    <div>
                        <h3 className="text-sm font-bold text-edia-cyan uppercase tracking-wider mb-4">
                            Entorno y Iluminación
                        </h3>

                        <div className="space-y-4">
                            {/* Environment Preset */}
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                    Preset de Entorno
                                </label>
                                <select
                                    value={settings.environment}
                                    onChange={(e) => updateSetting('environment', e.target.value as any)}
                                    className="w-full bg-white/10 border border-white/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-edia-cyan"
                                >
                                    <option value="city">Ciudad</option>
                                    <option value="sunset">Atardecer</option>
                                    <option value="dawn">Amanecer</option>
                                    <option value="night">Noche</option>
                                    <option value="warehouse">Almacén</option>
                                    <option value="forest">Bosque</option>
                                    <option value="apartment">Apartamento</option>
                                    <option value="studio">Estudio</option>
                                    <option value="park">Parque</option>
                                </select>
                            </div>

                            {/* Light Intensity */}
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                    Intensidad de Luz: {settings.lightIntensity.toFixed(2)}
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.1"
                                    value={settings.lightIntensity}
                                    onChange={(e) => updateSetting('lightIntensity', parseFloat(e.target.value))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>Oscuro</span>
                                    <span>Brillante</span>
                                </div>
                            </div>

                            {/* Shadows */}
                            <div className="flex items-center justify-between">
                                <label className="text-sm text-white">Habilitar Sombras</label>
                                <button
                                    onClick={() => updateSetting('enableShadows', !settings.enableShadows)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${settings.enableShadows ? 'bg-edia-cyan' : 'bg-white/20'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.enableShadows ? 'translate-x-6' : ''
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Camera Section */}
                    <div className="border-t border-white/10 pt-6">
                        <h3 className="text-sm font-bold text-edia-cyan uppercase tracking-wider mb-4">
                            Cámara
                        </h3>

                        <div className="space-y-4">
                            {/* Field of View */}
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                    Campo de Visión (FOV): {settings.cameraFov}°
                                </label>
                                <input
                                    type="range"
                                    min="20"
                                    max="120"
                                    step="5"
                                    value={settings.cameraFov}
                                    onChange={(e) => updateSetting('cameraFov', parseInt(e.target.value))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>Telefoto</span>
                                    <span>Gran Angular</span>
                                </div>
                            </div>

                            {/* Auto Rotate */}
                            <div className="flex items-center justify-between">
                                <label className="text-sm text-white">Auto-Rotación</label>
                                <button
                                    onClick={() => updateSetting('autoRotate', !settings.autoRotate)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${settings.autoRotate ? 'bg-edia-cyan' : 'bg-white/20'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.autoRotate ? 'translate-x-6' : ''
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Auto Rotate Speed */}
                            {settings.autoRotate && (
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                        Velocidad de Rotación: {settings.autoRotateSpeed.toFixed(1)}x
                                    </label>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="5"
                                        step="0.1"
                                        value={settings.autoRotateSpeed}
                                        onChange={(e) => updateSetting('autoRotateSpeed', parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Display Section */}
                    <div className="border-t border-white/10 pt-6">
                        <h3 className="text-sm font-bold text-edia-cyan uppercase tracking-wider mb-4">
                            Visualización
                        </h3>

                        <div className="space-y-4">
                            {/* Background Color */}
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                    Color de Fondo
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={settings.backgroundColor}
                                        onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                                        className="w-16 h-10 bg-transparent border border-white/20 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={settings.backgroundColor}
                                        onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                                        className="flex-1 bg-white/10 border border-white/20 text-white px-3 py-2 text-sm font-mono focus:outline-none focus:border-edia-cyan"
                                    />
                                </div>
                            </div>

                            {/* Show Grid */}
                            <div className="flex items-center justify-between">
                                <label className="text-sm text-white">Mostrar Cuadrícula</label>
                                <button
                                    onClick={() => updateSetting('showGrid', !settings.showGrid)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${settings.showGrid ? 'bg-edia-cyan' : 'bg-white/20'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.showGrid ? 'translate-x-6' : ''
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Show Axes */}
                            <div className="flex items-center justify-between">
                                <label className="text-sm text-white">Mostrar Ejes (X, Y, Z)</label>
                                <button
                                    onClick={() => updateSetting('showAxes', !settings.showAxes)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${settings.showAxes ? 'bg-edia-cyan' : 'bg-white/20'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.showAxes ? 'translate-x-6' : ''
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-panel-dark border-t border-white/10 p-6 flex gap-3">
                    <button
                        onClick={resetToDefaults}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-3 uppercase tracking-widest border border-white/10 transition-colors"
                    >
                        Restablecer Valores
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-edia-cyan hover:bg-edia-cyan/80 text-black text-sm px-4 py-3 uppercase tracking-widest font-bold transition-colors"
                    >
                        Aplicar y Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export type { Settings3DConfig };
export { defaultSettings };
