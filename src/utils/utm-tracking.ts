import { storage, STORAGE_KEYS } from './localStorage';

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string; // Google Ads click ID
  fbclid?: string; // Facebook click ID
  referrer?: string;
  landing_page?: string;
  timestamp?: number;
}

/**
 * Extract UTM parameters and other tracking data from URL
 */
export const extractUTMParams = (url?: string): UTMParams => {
  try {
    const targetUrl = url || window.location.href;
    const urlParams = new URLSearchParams(new URL(targetUrl).search);
    
    const utmParams: UTMParams = {
      timestamp: Date.now(),
      landing_page: window.location.pathname,
      referrer: document.referrer || undefined
    };

    // Extract UTM parameters
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    const utmCampaign = urlParams.get('utm_campaign');
    const utmTerm = urlParams.get('utm_term');
    const utmContent = urlParams.get('utm_content');
    
    if (utmSource) utmParams.utm_source = utmSource;
    if (utmMedium) utmParams.utm_medium = utmMedium;
    if (utmCampaign) utmParams.utm_campaign = utmCampaign;
    if (utmTerm) utmParams.utm_term = utmTerm;
    if (utmContent) utmParams.utm_content = utmContent;

    // Extract click IDs
    const gclid = urlParams.get('gclid');
    const fbclid = urlParams.get('fbclid');
    
    if (gclid) utmParams.gclid = gclid;
    if (fbclid) utmParams.fbclid = fbclid;

    return utmParams;
  } catch (error) {
    console.warn('Error extracting UTM parameters:', error);
    return { timestamp: Date.now() };
  }
};

/**
 * Store UTM parameters in localStorage
 */
export const storeUTMParams = (utmParams?: UTMParams): void => {
  const params = utmParams || extractUTMParams();
  
  // Only store if we have actual UTM data
  const hasUTMData = Object.keys(params).some(key => 
    key.startsWith('utm_') && params[key as keyof UTMParams]
  );
  
  if (hasUTMData || params.gclid || params.fbclid) {
    storage.setItem(STORAGE_KEYS.UTM_PARAMS, params);
  }
};

/**
 * Get stored UTM parameters
 */
export const getStoredUTMParams = (): UTMParams | null => {
  const stored = storage.getItem<UTMParams | null>(STORAGE_KEYS.UTM_PARAMS, null);
  
  // Return stored params if they're less than 30 days old
  if (stored && stored.timestamp && Date.now() - stored.timestamp < 30 * 24 * 60 * 60 * 1000) {
    return stored;
  }
  
  // Clean up old data
  if (stored) {
    storage.removeItem(STORAGE_KEYS.UTM_PARAMS);
  }
  
  return null;
};

/**
 * Get current or stored UTM parameters for attribution
 */
export const getAttributionData = (): UTMParams => {
  // First try to get current UTM params from URL
  const currentParams = extractUTMParams();
  
  // If current params have UTM data, store and return them
  const hasCurrentUTMData = Object.keys(currentParams).some(key => 
    key.startsWith('utm_') && currentParams[key as keyof UTMParams]
  );
  
  if (hasCurrentUTMData || currentParams.gclid || currentParams.fbclid) {
    storeUTMParams(currentParams);
    return currentParams;
  }
  
  // Otherwise, fall back to stored params
  const storedParams = getStoredUTMParams();
  return storedParams || currentParams;
};

/**
 * Initialize UTM tracking on page load
 */
export const initializeUTMTracking = (): void => {
  try {
    // Extract and store UTM params from current URL
    const utmParams = extractUTMParams();
    storeUTMParams(utmParams);
    
    // Log attribution data for debugging
    if (process.env.NODE_ENV === 'development') {
      const attribution = getAttributionData();
      console.log('Attribution data:', attribution);
    }
  } catch (error) {
    console.warn('Error initializing UTM tracking:', error);
  }
};
