/**
 * Capa DATOS — Fair play (team conduct) y Ranking FIFA para los desempates del Art. 13.
 *
 * Estos valores NO se inventan:
 *  - fairPlayManual: total de conducta (≤ 0) por selección, tomado del FIFA Match Centre
 *    cuando ESPN no entrega tarjetas. Si ESPN sí entrega tarjetas, el fair play se calcula
 *    automáticamente (ver core/fairplay.ts) y esto queda solo como respaldo.
 *      amarilla -1 · doble amarilla (roja) -3 · roja directa -4 · amarilla+roja directa -5
 *      (una sola deducción por jugador y por partido).
 *    Fuente: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026
 *  - fifaRanking: posición en el FIFA/Coca-Cola Men's World Ranking oficial (menor = mejor).
 *    Cargado con la actualización oficial del 11 de junio de 2026 para las 48 selecciones.
 *    Fuente: https://www.fifa.com/en/fifa-world-ranking/men
 */

/**
 * Conducta por selección (≤ 0). Vacío por defecto: las selecciones no listadas se
 * asumen 0. Completá aquí desde el FIFA Match Centre solo si ESPN no trae tarjetas.
 * Ejemplo de formato:  POR: -1,  COL: -2,
 */
export const fairPlayManual: Record<string, number> = {};

/** Ranking FIFA oficial (11 jun 2026), posición por código de selección. */
export const fifaRanking: Record<string, number> = {
  ARG: 1,   // Argentina
  ESP: 2,   // España
  FRA: 3,   // Francia
  ING: 4,   // Inglaterra
  POR: 5,   // Portugal
  BRA: 6,   // Brasil
  MAR: 7,   // Marruecos
  PBA: 8,   // Países Bajos
  BEL: 9,   // Bélgica
  ALE: 10,  // Alemania
  CRO: 11,  // Croacia
  COL: 13,  // Colombia
  MEX: 14,  // México
  SEN: 15,  // Senegal
  URU: 16,  // Uruguay
  USA: 17,  // EE. UU.
  JAP: 18,  // Japón
  SUI: 19,  // Suiza
  IRA: 20,  // Irán
  TUR: 22,  // Turquía
  ECU: 23,  // Ecuador
  AUT: 24,  // Austria
  COR: 25,  // Corea del Sur
  AUS: 27,  // Australia
  ALG: 28,  // Argelia
  EGI: 29,  // Egipto
  CAN: 30,  // Canadá
  NOR: 31,  // Noruega
  CDM: 33,  // Costa de Marfil
  PAN: 34,  // Panamá
  SUE: 38,  // Suecia
  RPC: 40,  // Chequia
  PAR: 41,  // Paraguay
  ESC: 42,  // Escocia
  TUN: 45,  // Túnez
  RDC: 46,  // RD del Congo
  UZB: 50,  // Uzbekistán
  QAT: 56,  // Qatar
  IRK: 57,  // Irak
  RSA: 60,  // Sudáfrica
  ARA: 61,  // Arabia Saudí
  JOR: 63,  // Jordania
  BOS: 64,  // Bosnia y H.
  CAB: 67,  // Cabo Verde
  GHA: 73,  // Ghana
  CUR: 82,  // Curazao
  HAI: 83,  // Haití
  NZL: 85,  // Nueva Zelanda
};
