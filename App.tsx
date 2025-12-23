import React, { useState, useRef } from 'react';
import Sidebar from './components/Sidebar';
import MapContainer from './components/MapContainer';
import { MapConfig, PoiData, FetchProgress, LayerVisibility } from './types';
import { fetchPoisInPolygon } from './services/poiFetcher';
import { exportToExcel, exportToGeoJSON } from './services/exportService';

const App: React.FC = () => {
  // Config State
  const [config, setConfig] = useState<MapConfig>({
    apiKey: '',
    securityKey: ''
  });

  // Data State
  const [pois, setPois] = useState<PoiData[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // UI State
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygonPath, setPolygonPath] = useState<number[][]>([]); // Changed to number[][]
  const [mapReady, setMapReady] = useState(false);
  
  // Layers State
  const [layers, setLayers] = useState<LayerVisibility>({
    baseMap: 'standard',
    roi: true,
    poi: true
  });

  // Progress State
  const [progress, setProgress] = useState<FetchProgress>({
    totalGrids: 0,
    completedGrids: 0,
    totalFound: 0,
    status: 'idle',
    message: ''
  });

  const handleStartDraw = () => {
    if (!mapReady) {
        alert("地图尚未加载完成，请检查Key配置。");
        return;
    }
    setIsDrawing(true);
    // Clear previous data
    setPois([]);
    setPolygonPath([]);
    setProgress({ ...progress, status: 'drawing', message: '请在地图上绘制范围...' });
  };

  const handleClearDraw = () => {
      setIsDrawing(false);
      setPolygonPath([]);
      setPois([]);
      setProgress({ totalGrids: 0, completedGrids: 0, totalFound: 0, status: 'idle', message: '' });
  };

  const handlePolygonDrawn = (path: number[][]) => {
      setPolygonPath(path);
      setIsDrawing(false);
      if (path.length > 0) {
        setProgress({ ...progress, status: 'idle', message: '范围已选定，请选择分类并开始挖掘。' });
      }
  };

  const handleFetch = async () => {
    if (polygonPath.length === 0) {
        alert("请先绘制挖掘范围 (Polygon)。");
        return;
    }
    if (selectedCategories.length === 0) {
        alert("请至少选择一个POI分类。");
        return;
    }
    // Check for AMap global
    const AMap = (window as any).AMap;
    if (!AMap) {
        alert("AMap API 未加载或初始化失败。");
        return;
    }

    // Pass array directly for strict filtering logic
    try {
        const data = await fetchPoisInPolygon(
            AMap,
            polygonPath,
            selectedCategories, 
            (p) => setProgress(prev => ({ ...prev, ...p }))
        );
        
        setPois(data);
        if (data.length === 0) {
             setProgress(prev => ({ ...prev, status: 'complete', message: `完成！未找到数据 (0条)。可能是API配额耗尽或Key配置限制。` }));
        } else {
             setProgress(prev => ({ ...prev, status: 'complete', message: `完成！共挖掘到 ${data.length} 条数据。` }));
        }
        // Auto show markers
        setLayers(prev => ({ ...prev, poi: true }));
    } catch (e: any) {
        console.error(e);
        setProgress(prev => ({ ...prev, status: 'error', message: `失败: ${e.message || '未知错误'}` }));
    }
  };

  return (
    <div className="flex w-full h-screen overflow-hidden bg-gray-100 font-sans text-gray-800">
      <Sidebar 
        config={config}
        onConfigChange={setConfig}
        selectedCategories={selectedCategories}
        onCategoryChange={setSelectedCategories}
        isDrawing={isDrawing}
        onStartDraw={handleStartDraw}
        onClearDraw={handleClearDraw}
        onFetch={handleFetch}
        progress={progress}
        layers={layers}
        onLayerChange={setLayers}
        onExportExcel={() => exportToExcel(pois)}
        onExportGeoJSON={() => exportToGeoJSON(pois)}
        hasPolygon={polygonPath.length > 0}
      />
      
      <div className="flex-1 relative">
        <MapContainer 
            config={config}
            pois={pois}
            layerStatus={layers}
            isDrawing={isDrawing}
            onPolygonDrawn={handlePolygonDrawn}
            onMapReady={setMapReady}
        />
        
        {/* Helper Overlay when drawing */}
        {isDrawing && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded shadow-lg backdrop-blur-sm text-sm z-30 pointer-events-none">
                单击地图添加节点，双击结束绘制
            </div>
        )}
      </div>
    </div>
  );
};

export default App;