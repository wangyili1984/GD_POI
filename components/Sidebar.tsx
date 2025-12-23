import React, { useState } from 'react';
import { 
  Map, 
  Layers, 
  Download, 
  Play, 
  Trash2, 
  Settings, 
  Database,
  Search,
  CheckSquare,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { POICategory, MapConfig, FetchProgress, LayerVisibility } from '../types';
import { POI_CATEGORIES } from '../constants';

interface SidebarProps {
  config: MapConfig;
  onConfigChange: (c: MapConfig) => void;
  selectedCategories: string[];
  onCategoryChange: (vals: string[]) => void;
  isDrawing: boolean;
  onStartDraw: () => void;
  onClearDraw: () => void;
  onFetch: () => void;
  progress: FetchProgress;
  layers: LayerVisibility;
  onLayerChange: (l: LayerVisibility) => void;
  onExportExcel: () => void;
  onExportGeoJSON: () => void;
  hasPolygon: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  config,
  onConfigChange,
  selectedCategories,
  onCategoryChange,
  onStartDraw,
  onClearDraw,
  onFetch,
  progress,
  layers,
  onLayerChange,
  onExportExcel,
  onExportGeoJSON,
  hasPolygon
}) => {
  // Local state for inputs to allow validation before applying
  const [localApiKey, setLocalApiKey] = useState(config.apiKey);
  const [localSecurityKey, setLocalSecurityKey] = useState(config.securityKey);
  const [configError, setConfigError] = useState<string | null>(null);
  
  // State for password visibility toggles
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecurityKey, setShowSecurityKey] = useState(false);
  
  const handleCategoryToggle = (val: string) => {
    if (selectedCategories.includes(val)) {
      onCategoryChange(selectedCategories.filter(c => c !== val));
    } else {
      onCategoryChange([...selectedCategories, val]);
    }
  };

  const toggleAllCategories = () => {
      if (selectedCategories.length === POI_CATEGORIES.length) {
          onCategoryChange([]);
      } else {
          onCategoryChange(POI_CATEGORIES.map(c => c.value));
      }
  };

  const handleConfirmConfig = () => {
    setConfigError(null);
    const key = localApiKey.trim();
    const secret = localSecurityKey.trim();

    // Format Validation
    if (!key) {
      setConfigError("请输入 AMap API Key");
      return;
    }
    if (key.length !== 32) {
      setConfigError("API Key 格式错误 (应为32位字符)");
      return;
    }
    if (!secret) {
      setConfigError("请输入 Security Key");
      return;
    }
    if (secret.length !== 32) {
      setConfigError("Security Key 格式错误 (应为32位字符)");
      return;
    }

    // Apply config
    onConfigChange({
      apiKey: key,
      securityKey: secret
    });
  };

  return (
    <div className="w-80 h-full bg-white shadow-xl flex flex-col z-20 border-r border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-primary text-white shadow-md">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Map size={20} />
          POI GIS Miner
        </h1>
        <p className="text-xs opacity-80 mt-1">高德地图数据挖掘系统</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* 1. API Configuration */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-700 font-semibold border-b pb-1">
            <Settings size={16} /> API 设置
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">AMap Key (Web JS)</label>
              <div className="relative">
                <input 
                  type={showApiKey ? "text" : "password"}
                  className={`w-full text-xs border rounded p-2 pr-8 focus:ring-1 outline-none transition-colors ${configError && localApiKey.length !== 32 ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'}`}
                  value={localApiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  placeholder="输入高德 Key (32位)"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Security Key</label>
              <div className="relative">
                <input 
                  type={showSecurityKey ? "text" : "password"}
                  className={`w-full text-xs border rounded p-2 pr-8 focus:ring-1 outline-none transition-colors ${configError && localSecurityKey.length !== 32 ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'}`}
                  value={localSecurityKey}
                  onChange={(e) => setLocalSecurityKey(e.target.value)}
                  placeholder="输入安全密钥 (32位)"
                />
                <button
                  type="button"
                  onClick={() => setShowSecurityKey(!showSecurityKey)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showSecurityKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {configError && (
              <div className="text-[10px] text-red-500 flex items-center gap-1 bg-red-50 p-1.5 rounded">
                <AlertCircle size={10} /> {configError}
              </div>
            )}

            <button
              onClick={handleConfirmConfig}
              className="w-full flex items-center justify-center gap-1 bg-gray-800 text-white hover:bg-gray-900 py-1.5 rounded text-xs transition-colors shadow-sm mt-1"
            >
              <CheckSquare size={12} /> 确认并加载地图
            </button>

            <div className="text-[10px] text-gray-400">
               * 请确保Key与安全密钥匹配且开通 JSAPI v2.0
            </div>
          </div>
        </div>

        {/* 2. Drawing Tools */}
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700 font-semibold border-b pb-1">
                <Search size={16} /> 范围选择 (ROI)
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={onStartDraw}
                    className="flex-1 flex items-center justify-center gap-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded text-sm transition-colors shadow-sm"
                >
                    <Map size={14} /> 绘制多边形
                </button>
                <button 
                    onClick={onClearDraw}
                    className="w-1/3 flex items-center justify-center gap-1 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 py-2 rounded text-sm transition-colors shadow-sm"
                >
                    <Trash2 size={14} /> 清除
                </button>
            </div>
        </div>

        {/* 3. POI Categories */}
        <div className="space-y-3">
            <div className="flex items-center justify-between text-gray-700 font-semibold border-b pb-1">
                <div className="flex items-center gap-2"><Database size={16} /> POI 分类</div>
                <button onClick={toggleAllCategories} className="text-xs text-primary hover:underline">
                    {selectedCategories.length === POI_CATEGORIES.length ? '全不选' : '全选'}
                </button>
            </div>
            <div className="max-h-48 overflow-y-auto border border-gray-100 rounded bg-gray-50 p-2 space-y-1">
                {POI_CATEGORIES.map((cat) => (
                    <label key={cat.value} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition-colors">
                        <input 
                            type="checkbox" 
                            className="rounded text-primary focus:ring-primary"
                            checked={selectedCategories.includes(cat.value)}
                            onChange={() => handleCategoryToggle(cat.value)}
                        />
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: cat.color}}></div>
                        <span className="text-xs text-gray-700">{cat.label}</span>
                    </label>
                ))}
            </div>
        </div>

        {/* 4. Action & Progress */}
        <div className="space-y-3 bg-blue-50 p-3 rounded border border-blue-100">
            <button
                disabled={!hasPolygon || progress.status === 'fetching'}
                onClick={onFetch}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded text-sm font-medium shadow-sm text-white transition-all
                    ${!hasPolygon || progress.status === 'fetching' ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover'}
                `}
            >
                {progress.status === 'fetching' ? (
                   <span className="animate-pulse">正在获取...</span>
                ) : (
                    <>
                    <Play size={16} /> 开始数据挖掘
                    </>
                )}
            </button>
            
            {progress.status !== 'idle' && (
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>进度: {Math.round((progress.completedGrids / (progress.totalGrids || 1)) * 100)}%</span>
                        <span>{progress.totalFound} 条数据</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{width: `${(progress.completedGrids / (progress.totalGrids || 1)) * 100}%`}}
                        ></div>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate">{progress.message}</p>
                </div>
            )}
        </div>

        {/* 5. Layers */}
        <div className="space-y-3">
             <div className="flex items-center gap-2 text-gray-700 font-semibold border-b pb-1">
                <Layers size={16} /> 图层管理
            </div>
            <div className="space-y-2">
                <label className="flex items-center justify-between text-sm text-gray-600 p-2 bg-gray-50 rounded">
                    <span>显示 POI 数据点</span>
                    <input 
                        type="checkbox" 
                        checked={layers.poi} 
                        onChange={(e) => onLayerChange({...layers, poi: e.target.checked})}
                    />
                </label>
                 <label className="flex items-center justify-between text-sm text-gray-600 p-2 bg-gray-50 rounded">
                    <span>显示 ROI 范围</span>
                    <input 
                        type="checkbox" 
                        checked={layers.roi} 
                        onChange={(e) => onLayerChange({...layers, roi: e.target.checked})}
                    />
                </label>
                <div className="flex gap-2 text-xs mt-2">
                    <button 
                        onClick={() => onLayerChange({...layers, baseMap: 'standard'})}
                        className={`flex-1 py-1 px-2 rounded border ${layers.baseMap === 'standard' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600'}`}
                    >
                        标准地图
                    </button>
                     <button 
                        onClick={() => onLayerChange({...layers, baseMap: 'satellite'})}
                        className={`flex-1 py-1 px-2 rounded border ${layers.baseMap === 'satellite' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600'}`}
                    >
                        卫星地图
                    </button>
                </div>
            </div>
        </div>

      </div>

      {/* Footer / Export */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-2">
        <div className="text-xs font-semibold text-gray-500 mb-2">数据导出</div>
        <div className="grid grid-cols-2 gap-2">
            <button 
                onClick={onExportExcel}
                disabled={progress.totalFound === 0}
                className="flex items-center justify-center gap-1 bg-green-600 text-white hover:bg-green-700 py-2 rounded text-xs transition-colors shadow-sm disabled:opacity-50"
            >
                <Download size={14} /> Excel
            </button>
            <button 
                onClick={onExportGeoJSON}
                disabled={progress.totalFound === 0}
                className="flex items-center justify-center gap-1 bg-blue-600 text-white hover:bg-blue-700 py-2 rounded text-xs transition-colors shadow-sm disabled:opacity-50"
            >
                <Download size={14} /> GeoJSON
            </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;