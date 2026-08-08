import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useLocationStore = create(
  persist(
    (set, get) => ({
      activeLocation: null,
      
      // Default locations from profile and standard locations
      savedLocations: [
        {
          id: 'rumah',
          label: 'Rumah',
          address: '',
          lat: -6.225014,
          lng: 106.802223
        },
        {
          id: 'kantor',
          label: 'Kantor',
          address: '',
          lat: -6.230784,
          lng: 106.818464
        }
      ],
      
      gpsLocation: null,

      setActiveLocation: (location) => set({ activeLocation: location }),
      
      setSavedLocations: (locations) => set({ savedLocations: locations }),

      setGpsLocation: (location) => set((state) => {
        const newState = { gpsLocation: location };
        return newState;
      }),
      
      initDefaultLocation: () => {
        const state = get();
        if (!state.activeLocation) {
          set({ activeLocation: state.savedLocations[0] });
        }
      },
      
      fetchGpsLocation: async () => {
        return new Promise((resolve, reject) => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                let address = `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`;
                try {
                  const res = await fetch(`/api/location/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
                  if (res.ok) {
                    const data = await res.json();
                    if (data.displayName) {
                      address = data.displayName;
                    }
                  }
                } catch (e) {
                  console.error("Reverse geocoding failed, using coordinates fallback", e);
                } finally {
                  const newLoc = {
                    id: 'gps',
                    label: 'Lokasi Anda',
                    address: address,
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                  };
                  get().setGpsLocation(newLoc);
                  resolve(newLoc);
                }
              },
              (error) => {
                console.error("Error getting location", error);
                let errorMsg = "Gagal mendapatkan lokasi.";
                if (error.code === error.PERMISSION_DENIED) errorMsg = "Izin lokasi ditolak. Silakan izinkan di pengaturan browser.";
                else if (error.code === error.POSITION_UNAVAILABLE) errorMsg = "Informasi lokasi tidak tersedia saat ini.";
                else if (error.code === error.TIMEOUT) errorMsg = "Waktu permintaan lokasi habis. Pastikan GPS perangkat Anda aktif.";
                alert(errorMsg);
                reject(error);
              },
              { timeout: 10000, maximumAge: 60000 }
            );
          } else {
            alert("Browser Anda tidak mendukung fitur lokasi.");
            reject(new Error("No geolocation"));
          }
        });
      }
    }),
    {
      name: 'mertha-location-storage',
    }
  )
);

export default useLocationStore;
