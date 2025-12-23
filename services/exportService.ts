import * as XLSX from 'xlsx';
import { PoiData } from '../types';

// Native implementation to avoid dependency issues with file-saver
const saveAs = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToExcel = (data: PoiData[], filename: string = 'poi_data') => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data.map(item => {
      // Split type string by ';' to get hierarchical categories
      // Example: "购物服务;便民商店/便利店;便民商店/便利店"
      const typeParts = (item.type || '').split(';');
      
      return {
        '名称 (Name)': item.name,
        '大类 (Category)': typeParts[0] || '',
        '中类 (Sub-Cat 1)': typeParts[1] || '',
        '小类 (Sub-Cat 2)': typeParts[2] || '',
        '完整类型 (Full Type)': item.type,
        '地址 (Address)': item.address,
        '经度 (Lng)': item.location.lng,
        '纬度 (Lat)': item.location.lat,
        '电话 (Tel)': item.tel,
        '省份 (Province)': item.pname,
        '城市 (City)': item.cityname,
        '区域 (District)': item.adname,
      };
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "POI Data");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(dataBlob, `${filename}_${new Date().toISOString().slice(0,10)}.xlsx`);
  } catch (e) {
    console.error("Export failed:", e);
    alert("导出失败，请检查数据量是否过大。");
  }
};

export const exportToGeoJSON = (data: PoiData[], filename: string = 'poi_data') => {
  try {
    const geoJSON = {
      type: "FeatureCollection",
      features: data.map(item => {
        const typeParts = (item.type || '').split(';');
        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [item.location.lng, item.location.lat]
          },
          properties: {
            name: item.name,
            category_big: typeParts[0] || '',
            category_mid: typeParts[1] || '',
            category_small: typeParts[2] || '',
            full_type: item.type,
            address: item.address,
            tel: item.tel,
            city: item.cityname
          }
        };
      })
    };

    const blob = new Blob([JSON.stringify(geoJSON)], { type: 'application/json' });
    saveAs(blob, `${filename}_${new Date().toISOString().slice(0,10)}.geojson`);
  } catch (e) {
    console.error("Export failed:", e);
    alert("导出失败。");
  }
};