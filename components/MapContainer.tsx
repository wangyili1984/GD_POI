import React, { useEffect, useRef, useState } from 'react';
import { loadAMap } from '../services/amapLoader';
import { MapConfig, PoiData, LayerVisibility } from '../types';
import { POI_CATEGORIES, MAP_STYLES } from '../constants';

interface MapContainerProps {
  config: MapConfig;
  pois: PoiData[];
  layerStatus: LayerVisibility;
  isDrawing: boolean;
  onPolygonDrawn: (path: number[][]) => void; // Changed to accept simple array
  onMapReady: (ready: boolean) => void;
}

const MapContainer: React.FC<MapContainerProps> = ({ 
  config, 
  pois, 
  layerStatus, 
  isDrawing, 
  onPolygonDrawn,
  onMapReady
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const mouseTool = useRef<any>(null);
  const massMarks = useRef<any>(null);
  const labelsLayer = useRef<any>(null); 
  const polygonLayer = useRef<any>(null);
  const infoWindow = useRef<any>(null);
  const AMapRef = useRef<any>(null);

  const [error, setError] = useState<string | null>(null);

  // 1. Initialize Map
  useEffect(() => {
    if (!config.apiKey || !config.securityKey) return;

    let isMounted = true;

    const init = async () => {
      try {
        const AMap = await loadAMap({ key: config.apiKey, securityKey: config.securityKey });
        AMapRef.current = AMap;

        if (!isMounted) return;

        if (!mapInstance.current && mapRef.current) {
          mapInstance.current = new AMap.Map(mapRef.current, {
            zoom: 11,
            center: [116.397428, 39.90923],
            viewMode: '3D',
            pitch: 0,
            mapStyle: MAP_STYLES.standard
          });

          mapInstance.current.addControl(new AMap.Scale());
          mapInstance.current.addControl(new AMap.ToolBar({ position: 'RT' }));

          mouseTool.current = new AMap.MouseTool(mapInstance.current);
          
          // Event Listener for Drawing
          mouseTool.current.on('draw', (e: any) => {
             const pathObj = e.obj.getPath();
             // CRITICAL: Convert AMap.LngLat objects to simple [lng, lat] arrays
             // This ensures state persistence works reliably and avoids prototype loss
             const simplePath = pathObj.map((p: any) => [p.lng, p.lat]);
             
             if (polygonLayer.current) {
                 mapInstance.current.remove(polygonLayer.current);
             }
             polygonLayer.current = e.obj;
             
             onPolygonDrawn(simplePath);
             mouseTool.current.close();
          });

          infoWindow.current = new AMap.InfoWindow({
              offset: new AMap.Pixel(0, -10),
              closeWhenClickMap: true
          });

          onMapReady(true);
        }
      } catch (e: any) {
        setError("地图加载失败，请检查Key配置。");
        console.error(e);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.apiKey, config.securityKey]);

  // 2. Handle Drawing Mode
  useEffect(() => {
    if (!mapInstance.current || !mouseTool.current) return;
    
    if (isDrawing) {
        if (polygonLayer.current) {
            mapInstance.current.remove(polygonLayer.current);
            polygonLayer.current = null;
            // Clear parent state
            onPolygonDrawn([]); 
        }
        mouseTool.current.polygon({
            strokeColor: "#1677ff", 
            strokeOpacity: 1,
            strokeWeight: 2,
            fillColor: "#1677ff",
            fillOpacity: 0.2
        });
    } else {
        mouseTool.current.close();
    }
  }, [isDrawing, onPolygonDrawn]);

  // 3. Handle Map Style / ROI Layer
  useEffect(() => {
    if (!mapInstance.current) return;
    
    const style = layerStatus.baseMap === 'satellite' ? MAP_STYLES.satellite : MAP_STYLES.standard;
    if (layerStatus.baseMap === 'satellite') {
       if (!mapInstance.current._satLayer) {
           mapInstance.current._satLayer = new AMapRef.current.TileLayer.Satellite();
       }
       mapInstance.current.add(mapInstance.current._satLayer);
    } else {
       if (mapInstance.current._satLayer) {
           mapInstance.current.remove(mapInstance.current._satLayer);
       }
    }

    if (polygonLayer.current) {
        if (layerStatus.roi) polygonLayer.current.show();
        else polygonLayer.current.hide();
    }
  }, [layerStatus.baseMap, layerStatus.roi]);

  // 4. Render POIs (MassMarks + LabelsLayer)
  useEffect(() => {
    if (!mapInstance.current || !AMapRef.current) return;

    const AMap = AMapRef.current;

    // Cleanup previous markers
    if (massMarks.current) {
        massMarks.current.setMap(null);
        massMarks.current = null;
    }
    if (labelsLayer.current) {
        labelsLayer.current.clear();
    } else {
        labelsLayer.current = new AMap.LabelsLayer({
            zooms: [15, 20],
            zIndex: 1000,
            collision: true,
            allowCollision: false
        });
        mapInstance.current.add(labelsLayer.current);
    }

    if (!layerStatus.poi || pois.length === 0) {
        if (labelsLayer.current) labelsLayer.current.clear();
        return;
    }

    // --- A. MassMarks (Dots) ---
    const getCategoryIndex = (poi: PoiData): number => {
        // 1. Try Prefix Match
        let code = String(poi.typecode || '');
        if (code.length === 5) code = '0' + code;
        const prefix = code.substring(0, 2);
        const idx = POI_CATEGORIES.findIndex(c => c.value === prefix);
        if (idx !== -1) return idx;

        // 2. Try Name Match (Fallback)
        const typeStr = poi.type || '';
        const nameIdx = POI_CATEGORIES.findIndex(c => typeStr.includes(c.label.split(' ')[0]));
        if (nameIdx !== -1) return nameIdx;

        return -1; // Default
    };

    const styleMap = POI_CATEGORIES.map((cat, index) => {
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="6" fill="${cat.color}" stroke="white" stroke-width="2"/></svg>`;
        const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
        return {
            url: url,
            anchor: new AMap.Pixel(8, 8),
            size: new AMap.Size(16, 16),
            zIndex: index
        };
    });

    // Default Grey
    const defaultSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"><circle cx="7" cy="7" r="5" fill="#9CA3AF" stroke="white" stroke-width="2"/></svg>`;
    styleMap.push({
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(defaultSvg)}`,
        anchor: new AMap.Pixel(7, 7),
        size: new AMap.Size(14, 14),
        zIndex: 999
    });

    const massData = pois.map(poi => {
        const idx = getCategoryIndex(poi);
        return {
            lnglat: [poi.location.lng, poi.location.lat],
            style: idx !== -1 ? idx : styleMap.length - 1,
            name: poi.name,
            address: poi.address,
            type: poi.type,
            tel: poi.tel
        };
    });

    massMarks.current = new AMap.MassMarks(massData, {
        zIndex: 111,
        cursor: 'pointer',
        style: styleMap
    });

    massMarks.current.on('click', (e: any) => {
        const content = `
            <div class="p-3 min-w-[220px] bg-white rounded shadow-sm text-sm">
                <h3 class="font-bold mb-2 text-gray-800 border-b pb-1">${e.data.name}</h3>
                <p class="mb-1 text-gray-600">类型: ${e.data.type}</p>
                <p class="mb-1 text-gray-600">地址: ${e.data.address || '暂无'}</p>
                <p class="text-gray-600">电话: ${e.data.tel || '暂无'}</p>
            </div>
        `;
        infoWindow.current.setContent(content);
        infoWindow.current.open(mapInstance.current, e.data.lnglat);
    });

    massMarks.current.setMap(mapInstance.current);

    // --- B. LabelsLayer (Text) ---
    const labelMarkers = pois.map(poi => {
        return new AMap.LabelMarker({
            position: [poi.location.lng, poi.location.lat],
            text: {
                content: poi.name,
                direction: 'top',
                offset: [0, -5],
                style: {
                    fontSize: 12,
                    fillColor: '#333333',
                    strokeColor: '#ffffff',
                    strokeWidth: 2,
                    padding: [2, 4],
                    backgroundColor: 'rgba(255,255,255,0.7)'
                }
            },
            icon: null,
            zIndex: 100
        });
    });

    labelsLayer.current.add(labelMarkers);

  }, [pois, layerStatus.poi]);


  return (
    <div className="relative w-full h-full bg-gray-100">
        {error && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded shadow-lg text-center z-50">
                <div className="text-red-500 mb-2 font-bold">Error</div>
                <p>{error}</p>
            </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default MapContainer;