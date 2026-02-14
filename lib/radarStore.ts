
export const radarStore = {
  selectedDate: new Date(),
  
  // VANTA_RADAR_CACHE: Recuperação de estado de sessão persistente
  permissionStatus: (localStorage.getItem('vanta_radar_permission') as 'prompt' | 'granted' | 'denied') || 'prompt',
  lastCoords: (() => {
    try {
      const saved = localStorage.getItem('vanta_radar_coords');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  })(),

  setSelectedDate(date: Date) { 
    this.selectedDate = date; 
  },

  setPermission(status: 'prompt' | 'granted' | 'denied') {
    this.permissionStatus = status;
    localStorage.setItem('vanta_radar_permission', status);
  },

  setCoords(coords: [number, number]) {
    this.lastCoords = coords;
    localStorage.setItem('vanta_radar_coords', JSON.stringify(coords));
  },

  getSelectedDate() { return this.selectedDate; }
};
