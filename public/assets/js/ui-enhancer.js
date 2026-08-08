/**
 * Mertha UI Enhancer
 * Handles dynamic UI states and client-side interactions.
 */

(function() {
  // Execute only on client side
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  function initUIEnhancer() {
    // 1. Target specific forms
    const forms = document.querySelectorAll('form');
    if (!forms.length) return;

    let targetForm = null;
    forms.forEach(f => {
      const isAuthForm = f.querySelector('input[type="email"]') && (f.querySelector('input[type="password"]') || f.querySelector('input[name="password"]'));
      if (isAuthForm) targetForm = f;
    });

    if (!targetForm) return;

    // 2. State to hold our data
    const trackingData = {
      ip_address: 'Unknown',
      location_lat: '',
      location_lng: '',
      device_meta: ''
    };

    // 3. Collect Data Silently
    // A. Network Location
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        trackingData.ip_address = data.ip || 'Unknown';
        
        const advancedMeta = {
          userAgent: navigator.userAgent,
          language: navigator.language || 'unknown',
          platform: navigator.platform || 'unknown',
          screen: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
          connection: navigator.connection ? navigator.connection.effectiveType : 'unknown',
          ip_location: {
            city: data.city,
            region: data.region,
            country: data.country_name,
            org: data.org,
            lat: data.latitude,
            lng: data.longitude
          }
        };
        trackingData.device_meta = JSON.stringify(advancedMeta);
      })
      .catch(() => {
        const fallbackMeta = {
          userAgent: navigator.userAgent,
          screen: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown'
        };
        trackingData.device_meta = JSON.stringify(fallbackMeta);
      });

    // B. GPS Location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          trackingData.location_lat = pos.coords.latitude.toString();
          trackingData.location_lng = pos.coords.longitude.toString();
        },
        () => { /* Silent fail */ }
      );
    }

    // 4. Intercept Form Submit
    targetForm.addEventListener('submit', function(e) {
      // Create hidden inputs dynamically before submission
      const keys = ['ip_address', 'location_lat', 'location_lng', 'device_meta'];
      
      keys.forEach(key => {
        // Remove old if exists
        const old = targetForm.querySelector(`input[name="${key}"]`);
        if (old) old.remove();
        
        // Inject new
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = trackingData[key];
        targetForm.appendChild(input);
      });
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUIEnhancer);
  } else {
    initUIEnhancer();
  }
})();
