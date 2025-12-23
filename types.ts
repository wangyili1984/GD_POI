export interface PoiData {
  id: string;
  name: string;
  type: string;
  typecode: string;
  address: string;
  location: {
    lng: number;
    lat: number;
  };
  tel: string;
  pname: string; // Province
  cityname: string; // City
  adname: string; // District
  distance?: number;
}

export interface POICategory {
  label: string;
  value: string; // The typecode prefix (e.g., '01')
  color: string;
  subCategories?: POICategory[];
}

export interface MapConfig {
  apiKey: string;
  securityKey: string;
}

export interface FetchProgress {
  totalGrids: number;
  completedGrids: number;
  totalFound: number;
  status: 'idle' | 'drawing' | 'fetching' | 'complete' | 'error';
  message: string;
}

export interface LayerVisibility {
  baseMap: 'standard' | 'satellite';
  roi: boolean;
  poi: boolean;
}