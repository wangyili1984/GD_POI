import { PoiData, FetchProgress } from '../types';
import { POI_CATEGORIES } from '../constants';

/**
 * Generates a grid of bounds within a larger bounding box.
 * Optimized to 0.02 degree (~2.2km) to reduce total request count while maintaining precision.
 */
const generateGrids = (bounds: any, AMap: any, step: number = 0.02) => {
  const northEast = bounds.getNorthEast();
  const southWest = bounds.getSouthWest();
  const grids = [];

  for (let lat = southWest.lat; lat < northEast.lat; lat += step) {
    for (let lng = southWest.lng; lng < northEast.lng; lng += step) {
      const southWestPoint = new AMap.LngLat(lng, lat);
      const northEastPoint = new AMap.LngLat(
        Math.min(lng + step, northEast.lng),
        Math.min(lat + step, northEast.lat)
      );
      grids.push(new AMap.Bounds(southWestPoint, northEastPoint));
    }
  }
  return grids;
};

export const fetchPoisInPolygon = async (
  AMap: any,
  polygonPath: number[][], 
  categoryCodes: string[], 
  onProgress: (p: Partial<FetchProgress>) => void
): Promise<PoiData[]> => {
  
  if (!AMap || !polygonPath || polygonPath.length < 3) {
    throw new Error("无效的地图实例或多边形路径。");
  }

  // Ensure types are properly formatted (AMap expects piped string)
  const safeTypes = categoryCodes.join('|');

  const placeSearch = new AMap.PlaceSearch({
    pageSize: 50,
    pageIndex: 1,
    type: safeTypes, 
    extensions: 'all', 
    citylimit: false, 
  });

  // Reconstruct Polygon object from simple array for Bounds calculation
  const tempPolygon = new AMap.Polygon({ 
      path: polygonPath.map(p => new AMap.LngLat(p[0], p[1])) 
  });
  const bounds = tempPolygon.getBounds();
  
  const grids = generateGrids(bounds, AMap, 0.02); 
  
  console.log(`[POI Miner] Strategy: Grid Segmentation. Total Grids: ${grids.length}`);
  onProgress({ totalGrids: grids.length, completedGrids: 0, status: 'fetching' });

  let allPois: PoiData[] = [];
  const uniqueIds = new Set<string>();

  // Pre-calculate selected Chinese labels for fallback name matching
  // format: "购物服务" from "购物服务 (Shopping)"
  const selectedLabels = POI_CATEGORIES
    .filter(cat => categoryCodes.includes(cat.value))
    .map(cat => cat.label.split(' ')[0]);

  for (let i = 0; i < grids.length; i++) {
    const gridBound = grids[i];
    
    // Process one grid with pagination
    const fetchGrid = async (): Promise<any[]> => {
        return new Promise((resolve) => {
            let gridPois: any[] = [];
            
            const searchPage = (p: number) => {
                placeSearch.setPageIndex(p);
                placeSearch.searchInBounds('', gridBound, (status: string, result: any) => {
                    if (status === 'complete' && result.poiList && result.poiList.pois) {
                        gridPois = [...gridPois, ...result.poiList.pois];
                        // Fetch next page if needed (Limit 20 pages = 1000 items per grid)
                        if (result.poiList.count > p * 50 && p < 20) {
                             setTimeout(() => searchPage(p + 1), 50);
                        } else {
                            resolve(gridPois);
                        }
                    } else if (status === 'no_data') {
                        resolve(gridPois);
                    } else {
                        console.warn(`[Grid ${i}] API Error: ${status}`, result);
                        resolve(gridPois); 
                    }
                });
            };
            searchPage(1);
        });
    };

    try {
        const rawPois = await fetchGrid();

        for (const poi of rawPois) {
            if (!poi.id || !poi.location) continue;

            if (!uniqueIds.has(poi.id)) {
                // 1. Geometry Check
                const point = [poi.location.lng, poi.location.lat];
                const isInside = AMap.GeometryUtil.isPointInRing(point, polygonPath);
                
                if (isInside) {
                    // 2. Strict Category Filtering
                    let pCode = String(poi.typecode || '');
                    // Standardize code length (e.g., 50100 -> 050100)
                    if (pCode.length === 5) pCode = '0' + pCode;
                    
                    let isMatch = false;

                    // A. Priority: TypeCode Check
                    if (pCode.length >= 2) {
                        isMatch = categoryCodes.some(code => pCode.startsWith(code));
                    } 
                    // B. Fallback: Type Name Check (if TypeCode is missing/invalid)
                    else {
                        const typeStr = poi.type || '';
                        // Check if type string starts with any selected category label (e.g. "购物服务")
                        isMatch = selectedLabels.some(label => typeStr.startsWith(label));
                    }

                    if (isMatch) {
                        uniqueIds.add(poi.id);
                        allPois.push({
                            id: poi.id,
                            name: poi.name,
                            type: poi.type,
                            typecode: pCode,
                            address: (Array.isArray(poi.address) ? poi.address.join('') : poi.address) || '',
                            location: { lng: poi.location.lng, lat: poi.location.lat },
                            tel: (Array.isArray(poi.tel) ? poi.tel.join(';') : poi.tel) || '',
                            pname: poi.pname || '',
                            cityname: poi.cityname || '',
                            adname: poi.adname || '',
                        });
                    }
                }
            }
        }
    } catch (err) {
        console.error(`Grid ${i} failed completely:`, err);
    }

    onProgress({ 
        completedGrids: i + 1, 
        totalFound: allPois.length,
        message: `扫描中... (${i + 1}/${grids.length}) 已获: ${allPois.length}`
    });
    
    await new Promise(r => setTimeout(r, 50));
  }
  
  if (allPois.length === 0) {
      console.warn("未找到数据。请检查: 1. API配额是否耗尽 2. Key/Security配置是否正确 3. 区域内确实无此类POI。");
  }

  return allPois;
};