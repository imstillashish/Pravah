export interface Port {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'origin' | 'destination';
  color: string;
  size: number;
}

export interface ShippingArc {
  originId: string;
  destId: string;
  color: [string, string];
  stroke: number;
  dashLength: number;
  dashGap: number;
  speed: number;
}

export const PORT_POINTS: Port[] = [
  // Destination ports (East Coast India)
  { id: 'vizag', name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, type: 'destination', color: '#00FFCC', size: 7 },
  { id: 'paradip', name: 'Paradip', lat: 20.3167, lng: 86.6667, type: 'destination', color: '#00FFCC', size: 7 },
  { id: 'haldia', name: 'Haldia', lat: 22.0667, lng: 88.1167, type: 'destination', color: '#00FFCC', size: 6 },
  { id: 'ennore', name: 'Ennore', lat: 13.2167, lng: 80.3167, type: 'destination', color: '#00FFCC', size: 6 },
  { id: 'kolkata', name: 'Kolkata', lat: 22.5726, lng: 88.3639, type: 'destination', color: '#00FFCC', size: 6 },
  { id: 'chennai', name: 'Chennai', lat: 13.0827, lng: 80.2707, type: 'destination', color: '#00FFCC', size: 7 },

  // Origin ports (Overseas & Coastal)
  { id: 'rotterdam', name: 'Rotterdam', lat: 51.9225, lng: 4.4792, type: 'origin', color: '#4FC3F7', size: 5 },
  { id: 'singapore', name: 'Singapore', lat: 1.3521, lng: 103.8198, type: 'origin', color: '#4FC3F7', size: 6 },
  { id: 'colombo', name: 'Colombo', lat: 6.9271, lng: 79.8612, type: 'origin', color: '#4FC3F7', size: 5 },
  { id: 'shanghai', name: 'Shanghai', lat: 31.2304, lng: 121.4737, type: 'origin', color: '#4FC3F7', size: 5 },
  { id: 'busan', name: 'Busan', lat: 35.1796, lng: 129.0756, type: 'origin', color: '#4FC3F7', size: 5 },
  { id: 'portklang', name: 'Port Klang', lat: 3.0000, lng: 101.4000, type: 'origin', color: '#4FC3F7', size: 5 },
  { id: 'mundra', name: 'Mundra', lat: 22.8394, lng: 69.7065, type: 'origin', color: '#4FC3F7', size: 5 },
  { id: 'dubai', name: 'Jebel Ali', lat: 24.9957, lng: 55.0453, type: 'origin', color: '#4FC3F7', size: 5 },
  { id: 'hamburg', name: 'Hamburg', lat: 53.5753, lng: 10.0153, type: 'origin', color: '#4FC3F7', size: 5 },
  { id: 'gladstone', name: 'Gladstone', lat: -23.84, lng: 151.25, type: 'origin', color: '#4FC3F7', size: 5 },
  { id: 'richardsbay', name: 'Richards Bay', lat: -28.78, lng: 32.03, type: 'origin', color: '#4FC3F7', size: 5 },
];

export const SHIPPING_ARCS: ShippingArc[] = [
  { originId: 'rotterdam', destId: 'vizag', color: ['#00C4FF', '#0077FF'], stroke: 0.4, dashLength: 0.4, dashGap: 0.2, speed: 0.002 },
  { originId: 'rotterdam', destId: 'haldia', color: ['#00C4FF', '#0077FF'], stroke: 0.4, dashLength: 0.4, dashGap: 0.2, speed: 0.0018 },
  { originId: 'singapore', destId: 'vizag', color: ['#00FFCC', '#0077FF'], stroke: 0.5, dashLength: 0.4, dashGap: 0.2, speed: 0.0035 },
  { originId: 'singapore', destId: 'paradip', color: ['#00FFCC', '#0077FF'], stroke: 0.5, dashLength: 0.4, dashGap: 0.2, speed: 0.0032 },
  { originId: 'singapore', destId: 'ennore', color: ['#00FFCC', '#0077FF'], stroke: 0.4, dashLength: 0.4, dashGap: 0.2, speed: 0.003 },
  { originId: 'shanghai', destId: 'vizag', color: ['#00C4FF', '#0077FF'], stroke: 0.4, dashLength: 0.4, dashGap: 0.2, speed: 0.0022 },
  { originId: 'busan', destId: 'kolkata', color: ['#00C4FF', '#0077FF'], stroke: 0.4, dashLength: 0.4, dashGap: 0.2, speed: 0.002 },
  { originId: 'portklang', destId: 'chennai', color: ['#00FFCC', '#0077FF'], stroke: 0.5, dashLength: 0.4, dashGap: 0.2, speed: 0.003 },
  { originId: 'colombo', destId: 'vizag', color: ['#00FFCC', '#0077FF'], stroke: 0.5, dashLength: 0.4, dashGap: 0.2, speed: 0.004 },
  { originId: 'colombo', destId: 'paradip', color: ['#00FFCC', '#0077FF'], stroke: 0.4, dashLength: 0.4, dashGap: 0.2, speed: 0.0038 },
  { originId: 'dubai', destId: 'vizag', color: ['#00C4FF', '#0077FF'], stroke: 0.5, dashLength: 0.4, dashGap: 0.2, speed: 0.0026 },
  { originId: 'dubai', destId: 'haldia', color: ['#00C4FF', '#0077FF'], stroke: 0.4, dashLength: 0.4, dashGap: 0.2, speed: 0.0024 },
  { originId: 'hamburg', destId: 'chennai', color: ['#00C4FF', '#0077FF'], stroke: 0.4, dashLength: 0.4, dashGap: 0.2, speed: 0.0019 },
  { originId: 'mundra', destId: 'vizag', color: ['#4FC3F7', '#00FFCC'], stroke: 0.4, dashLength: 0.4, dashGap: 0.2, speed: 0.0035 },
  { originId: 'gladstone', destId: 'paradip', color: ['#00C4FF', '#0077FF'], stroke: 0.4, dashLength: 0.4, dashGap: 0.2, speed: 0.0021 },
  { originId: 'richardsbay', destId: 'haldia', color: ['#00C4FF', '#0077FF'], stroke: 0.4, dashLength: 0.4, dashGap: 0.2, speed: 0.0022 },
];
