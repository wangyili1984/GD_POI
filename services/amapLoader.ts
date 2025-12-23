import AMapLoader from '@amap/amap-jsapi-loader';

interface LoadOptions {
  key: string;
  securityKey: string;
  version?: string;
}

export const loadAMap = async ({ key, securityKey, version = '2.0' }: LoadOptions) => {
  // Set security key globally before loading
  (window as any)._AMapSecurityConfig = {
    securityJsCode: securityKey,
  };

  try {
    const AMap = await AMapLoader.load({
      key,
      version,
      plugins: [
        'AMap.MouseTool',
        'AMap.PlaceSearch',
        'AMap.GeometryUtil',
        'AMap.MassMarks',
        'AMap.ToolBar',
        'AMap.Scale',
        'AMap.Polygon',
      ],
    });
    return AMap;
  } catch (e) {
    console.error('AMap loading failed:', e);
    throw e;
  }
};