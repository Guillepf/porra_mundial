import { doc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './config';

// 48 Selecciones clasificadas del Mundial 2026 distribuidas en 12 Grupos (A - L)
const TEAMS: Record<string, { name: string; code: string; flag: string }> = {
  // Grupo A
  USA: { name: 'Estados Unidos', code: 'USA', flag: '🇺🇸' },
  MEX: { name: 'México', code: 'MEX', flag: '🇲🇽' },
  CAN: { name: 'Canadá', code: 'CAN', flag: '🇨🇦' },
  HON: { name: 'Honduras', code: 'HON', flag: '🇭🇳' },
  // Grupo B
  ESP: { name: 'España', code: 'ESP', flag: '🇪🇸' },
  BRA: { name: 'Brasil', code: 'BRA', flag: '🇧🇷' },
  GER: { name: 'Alemania', code: 'GER', flag: '🇩🇪' },
  MAR: { name: 'Marruecos', code: 'MAR', flag: '🇲🇦' },
  // Grupo C
  ARG: { name: 'Argentina', code: 'ARG', flag: '🇦🇷' },
  FRA: { name: 'Francia', code: 'FRA', flag: '🇫🇷' },
  ENG: { name: 'Inglaterra', code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  ITA: { name: 'Italia', code: 'ITA', flag: '🇮🇹' },
  // Grupo D
  POR: { name: 'Portugal', code: 'POR', flag: '🇵🇹' },
  NED: { name: 'Países Bajos', code: 'NED', flag: '🇳🇱' },
  URU: { name: 'Uruguay', code: 'URU', flag: '🇺🇾' },
  SEN: { name: 'Senegal', code: 'SEN', flag: '🇸🇳' },
  // Grupo E
  BEL: { name: 'Bélgica', code: 'BEL', flag: '🇧🇪' },
  CRO: { name: 'Croacia', code: 'CRO', flag: '🇭🇷' },
  COL: { name: 'Colombia', code: 'COL', flag: '🇨🇴' },
  JPN: { name: 'Japón', code: 'JPN', flag: '🇯🇵' },
  // Grupo F
  CHI: { name: 'Chile', code: 'CHI', flag: '🇨🇱' },
  ECU: { name: 'Ecuador', code: 'ECU', flag: '🇪🇨' },
  NGA: { name: 'Nigeria', code: 'NGA', flag: '🇳🇬' },
  KOR: { name: 'Corea del Sur', code: 'KOR', flag: '🇰🇷' },
  // Grupo G
  SUI: { name: 'Suiza', code: 'SUI', flag: '🇨🇭' },
  DEN: { name: 'Dinamarca', code: 'DEN', flag: '🇩🇰' },
  CMR: { name: 'Camerún', code: 'CMR', flag: '🇨🇲' },
  TUN: { name: 'Túnez', code: 'TUN', flag: '🇹🇳' },
  // Grupo H
  SWE: { name: 'Suecia', code: 'SWE', flag: '🇸🇪' },
  UKR: { name: 'Ucrania', code: 'UKR', flag: '🇺🇦' },
  EGY: { name: 'Egipto', code: 'EGY', flag: '🇪🇬' },
  AUS: { name: 'Australia', code: 'AUS', flag: '🇦🇺' },
  // Grupo I
  TUR: { name: 'Turquía', code: 'TUR', flag: '🇹🇷' },
  WAL: { name: 'Gales', code: 'WAL', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  GHA: { name: 'Ghana', code: 'GHA', flag: '🇬🇭' },
  CRC: { name: 'Costa Rica', code: 'CRC', flag: '🇨🇷' },
  // Grupo J
  AUT: { name: 'Austria', code: 'AUT', flag: '🇦🇹' },
  POL: { name: 'Polonia', code: 'POL', flag: '🇵🇱' },
  KSA: { name: 'Arabia Saudí', code: 'KSA', flag: '🇸🇦' },
  PER: { name: 'Perú', code: 'PER', flag: '🇵🇪' },
  // Grupo K
  SCO: { name: 'Escocia', code: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  HUN: { name: 'Hungría', code: 'HUN', flag: '🇭🇺' },
  DZA: { name: 'Argelia', code: 'DZA', flag: '🇩🇿' },
  NZL: { name: 'Nueva Zelanda', code: 'NZL', flag: '🇳🇿' },
  // Grupo L
  CZE: { name: 'República Checa', code: 'CZE', flag: '🇨🇿' },
  PAR: { name: 'Paraguay', code: 'PAR', flag: '🇵🇾' },
  CIV: { name: 'Costa de Marfil', code: 'CIV', flag: '🇨🇮' },
  QAT: { name: 'Catar', code: 'QAT', flag: '🇶🇦' }
};

const BASE_MATCHES = [
  // Grupo A
  { id: 'm1', home: 'USA', away: 'MEX', group: 'A', daysOffset: 15, hour: 18 },
  { id: 'm2', home: 'CAN', away: 'HON', group: 'A', daysOffset: 15, hour: 21 },
  // Grupo B
  { id: 'm3', home: 'ESP', away: 'GER', group: 'B', daysOffset: 16, hour: 15 },
  { id: 'm4', home: 'BRA', away: 'MAR', group: 'B', daysOffset: 16, hour: 20 },
  // Grupo C
  { id: 'm5', home: 'ARG', away: 'ITA', group: 'C', daysOffset: 17, hour: 18 },
  { id: 'm6', home: 'FRA', away: 'ENG', group: 'C', daysOffset: 17, hour: 21 },
  // Grupo D
  { id: 'm7', home: 'POR', away: 'URU', group: 'D', daysOffset: 18, hour: 15 },
  { id: 'm8', home: 'NED', away: 'SEN', group: 'D', daysOffset: 18, hour: 20 },
  // Grupo E
  { id: 'm9', home: 'BEL', away: 'JPN', group: 'E', daysOffset: 19, hour: 18 },
  { id: 'm10', home: 'CRO', away: 'COL', group: 'E', daysOffset: 19, hour: 21 },
  // Grupo F
  { id: 'm11', home: 'CHI', away: 'KOR', group: 'F', daysOffset: 20, hour: 15 },
  { id: 'm12', home: 'ECU', away: 'NGA', group: 'F', daysOffset: 20, hour: 20 },
  // Grupo G
  { id: 'm13', home: 'SUI', away: 'CMR', group: 'G', daysOffset: 21, hour: 18 },
  { id: 'm14', home: 'DEN', away: 'TUN', group: 'G', daysOffset: 21, hour: 21 },
  // Grupo H
  { id: 'm15', home: 'SWE', away: 'EGY', group: 'H', daysOffset: 22, hour: 15 },
  { id: 'm16', home: 'UKR', away: 'AUS', group: 'H', daysOffset: 22, hour: 20 },
  // Grupo I
  { id: 'm17', home: 'TUR', away: 'GHA', group: 'I', daysOffset: 23, hour: 18 },
  { id: 'm18', home: 'WAL', away: 'CRC', group: 'I', daysOffset: 23, hour: 21 },
  // Grupo J
  { id: 'm19', home: 'AUT', away: 'KSA', group: 'J', daysOffset: 24, hour: 15 },
  { id: 'm20', home: 'POL', away: 'PER', group: 'J', daysOffset: 24, hour: 20 },
  // Grupo K
  { id: 'm21', home: 'SCO', away: 'DZA', group: 'K', daysOffset: 25, hour: 18 },
  { id: 'm22', home: 'HUN', away: 'NZL', group: 'K', daysOffset: 25, hour: 21 },
  // Grupo L
  { id: 'm23', home: 'CZE', away: 'CIV', group: 'L', daysOffset: 26, hour: 15 },
  { id: 'm24', home: 'PAR', away: 'QAT', group: 'L', daysOffset: 26, hour: 20 }
];

export async function seedMatches(): Promise<void> {
  const batch = writeBatch(db);
  const now = new Date();

  BASE_MATCHES.forEach((match) => {
    const scheduledDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + match.daysOffset, match.hour, 0, 0);
    const matchRef = doc(db, 'matches', match.id);

    const matchPayload = {
      homeTeam: TEAMS[match.home],
      awayTeam: TEAMS[match.away],
      scheduledAt: Timestamp.fromDate(scheduledDate),
      status: 'upcoming',
      stage: 'group',
      group: match.group,
      result: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    batch.set(matchRef, matchPayload);
  });

  await batch.commit();
  console.log('¡Partidos semilla sembrados con éxito en la base de datos!');
}
