export const RUTA_COLON = [
    [-6.55, 37.23],   //  0  Palos de la Frontera
    [-6.2,  36.5 ],   //  1  Golfo de Cádiz
    [-8.0,  34.5 ],   //  2  Atlántico bajando
    [-13.5, 28.1 ],   //  3  Islas Canarias (La Gomera)
    [-18.0, 26.0 ],   //  4  Salida Canarias
    [-28.0, 24.0 ],   //  5  Atlántico central N
    [-38.0, 22.5 ],   //  6  Atlántico central
    [-48.0, 22.0 ],   //  7  Mar de los Sargazos
    [-56.0, 22.5 ],   //  8  Acercándose
    [-63.0, 23.0 ],   //  9  Caribe norte
    [-74.5, 24.0 ],   // 10  San Salvador (Bahamas)
    [-73.0, 20.0 ],   // 11  Norte de Cuba
    [-69.5, 18.0 ],   // 12  La Española (Haití)
    [-70.5, 19.5 ],   // 13  La Navidad
    [-72.0, 20.5 ],   // 14  Explorando
    [-68.0, 18.5 ],   // 15  Regreso inicio
    [-55.0, 22.5 ],   // 16  Atlántico regreso
    [-38.0, 30.0 ],   // 17  Tormenta
    [-25.0, 35.0 ],   // 18  Azores
    [-10.0, 37.5 ],   // 19  Costa Portugal
    [-6.55, 37.23],   // 20  Vuelta a Palos
];


export const GEO_FIJOS = {
    0:  0.0,   // f01 —?" Palos de la Frontera: zarpe (índice 0)
    1:  1.5,   // f02 —?" Golfo de Cádiz/Atlántico: vía de agua a pocas leguas de Portugal (entre 1 y 2)
    3:  3.0,   // f03 —?" Islas Canarias: escala (índice 3)
    7:  6.5,   // f04 —?" Mar de los Sargazos: entre Atlántico central y Sargazos (entre 6 y 7)
    11: 7.5,   // f05 —?" Atlantico medio: calafateo Pinta (entre Sargazos y acercándose)
    15: 8.5,   // f06 —?" Atlántico avanzado: bizcocho podrido semana 25 (entre 8 y 9)
    19: 9.0,   // f07 —?" Atlántico profundo: registro de distancias mes 1 (índice 9 Caribe N)
    21: 9.5,   // f08 —?" Evento crítico navegación: punto de máxima incertidumbre (entre 9 y 10)
    25: 9.8,   // f09 —?" Señales de tierra: ramas y bambú flotando (muy cerca de San Salvador)
    27: 9.9,   // f10 —?" Ultimátum del motín: víspera de tierra (casi en San Salvador)
    28: 10.0,  // f11 —?" ¡Tierra!: San Salvador avistado (índice 10)
    29: 10.0,  // f12 —?" Desembarco San Salvador: primer contacto taíno (índice 10)
    33: 12.0,  // f13 —?" Naufragio Santa María: La Española (índice 12)
    36: 13.5,  // f14 —?" Reencuentro con Pinzón: zona de La Navidad/exploración (entre 13 y 14)
    37: 15.0,  // f15 —?" Decisión de regreso: inicio del camino de vuelta (índice 15)
    38: 15.2,  // f16 —?" Despedida de Guacanagari: ya rumbo al regreso, costa norte La Española
    39: 20.0,  // f17 —?" Regreso a Palos: último evento (índice 20)
};


export const GEO_LABELS = {
    0:  '⛵ Palos de la Frontera, España · 3 de agosto de 1492',
    1:  '🌊 Golfo de Cádiz · a pocas leguas de la costa portuguesa',
    3:  '🏝️ Islas Canarias · último punto de tierra conocido',
    7:  '🌊 Mar de los Sargazos · Atlántico central',
    11: '🌊 Alta mar · Atlántico medio, semana tres',
    15: '🌊 Alta mar · Atlántico abierto, semana cuatro',
    19: '🌊 Alta mar · mes completo en el océano sin tierra a la vista',
    21: '🌊 Alta mar · punto de máxima incertidumbre del viaje',
    25: '🌊 Alta mar · señales de tierra: ramas y bambú flotando',
    27: '🌊 Alta mar · víspera del descubrimiento, hora del motín',
    28: '🏝️ San Salvador (Bahamas) · 12 de octubre de 1492',
    29: '🏝️ San Salvador · primer desembarco europeo en el Nuevo Mundo',
    33: '🏝️ La Española (Haití) · naufragio de la Santa María',
    36: '🏝️ La Española · reencuentro con la Pinta y Pinzón',
    37: '🌊 Caribe norte · decisión de regreso a España',
    38: '🏝️ La Española · despedida de Guacanagari',
    39: '⛵ Regreso a Palos · 15 de enero de 1493',
};


export const FASES_VIAJE = [
    { desde: 0,  hasta: 4,  label: 'Preparación · España',      color: '#8b4513', dot: '#c8960c' },
    { desde: 4,  hasta: 10, label: 'Canarias · Atlántico',       color: '#0e2d50', dot: '#3498db' },
    { desde: 10, hasta: 20, label: 'Mar Océano · Sargazos',      color: '#0a1e38', dot: '#5dade2' },
    { desde: 20, hasta: 28, label: 'Nuevo Mundo · Caribe',       color: '#1a4e1a', dot: '#2ecc71' },
    { desde: 28, hasta: 35, label: 'La Española · Exploración',  color: '#2d5a0a', dot: '#27ae60' },
    { desde: 35, hasta: 40, label: 'Regreso a España',           color: '#5c2d09', dot: '#e8b420' },
];


export const MAP_COLORS = {
    ocean:      '#2a5f8a',
    land:       '#c8a96e',
    landBorder: '#8b6530',
    route:      '#c8320a',
    portDot:    '#f5d060',
    portBorder: '#8b4513',
    labelColor: '#f5e8c0',
    gridLine:   'rgba(255,255,255,0.08)',
    trailColor: '#e84010',      // ruta ya recorrida —?" más brillante
    trailGlow:  'rgba(232,64,16,0.4)',
};
