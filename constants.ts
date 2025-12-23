import { POICategory } from './types';

// High-level AMap POI Categories with visualization colors
// Reference: https://lbs.amap.com/api/webservice/download
// Updated to match the full official classification (01-99)
export const POI_CATEGORIES: POICategory[] = [
  { label: '汽车服务 (Auto Service)', value: '01', color: '#3B82F6' }, // Blue
  { label: '汽车销售 (Auto Sales)', value: '02', color: '#2563EB' }, // Darker Blue
  { label: '汽车维修 (Auto Repair)', value: '03', color: '#1D4ED8' }, // Dark Blue
  { label: '摩托车服务 (Motorcycle)', value: '04', color: '#1E40AF' }, // Navy
  { label: '餐饮服务 (Dining)', value: '05', color: '#EF4444' }, // Red
  { label: '购物服务 (Shopping)', value: '06', color: '#F59E0B' }, // Amber
  { label: '生活服务 (Life Service)', value: '07', color: '#10B981' }, // Emerald
  { label: '体育休闲 (Sports)', value: '08', color: '#8B5CF6' }, // Violet
  { label: '医疗保健 (Medical)', value: '09', color: '#EC4899' }, // Pink
  { label: '住宿服务 (Hotel)', value: '10', color: '#6366F1' }, // Indigo
  { label: '风景名胜 (Scenic)', value: '11', color: '#22C55E' }, // Green
  { label: '商务住宅 (Business)', value: '12', color: '#0EA5E9' }, // Sky
  { label: '政府机构 (Government)', value: '13', color: '#64748B' }, // Slate
  { label: '科教文化 (Education)', value: '14', color: '#A855F7' }, // Purple
  { label: '交通设施 (Transport)', value: '15', color: '#06B6D4' }, // Cyan
  { label: '金融保险 (Finance)', value: '16', color: '#EAB308' }, // Yellow
  { label: '公司企业 (Company)', value: '17', color: '#14B8A6' }, // Teal
  { label: '道路附属 (Road Furniture)', value: '18', color: '#78716C' }, // Stone
  { label: '地名地址 (Address)', value: '19', color: '#9CA3AF' }, // Gray
  { label: '公共设施 (Public)', value: '20', color: '#4B5563' }, // Dark Gray
  { label: '事件活动 (Events)', value: '22', color: '#F43F5E' }, // Rose
  { label: '室内设施 (Indoor)', value: '97', color: '#D4D4D8' }, // Light Gray
  { label: '通行设施 (Pass)', value: '98', color: '#52525B' }, // Zinc
];

export const MAP_STYLES = {
  standard: 'amap://styles/normal',
  satellite: 'amap://styles/satellite', 
};