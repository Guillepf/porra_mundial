import { doc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './config';

// 48 Selecciones clasificadas del Mundial 2026 distribuidas en 12 Grupos (A - L)
const TEAMS: Record<string, { name: string; code: string; flag: string }> = {
  // Grupo A
  MEX: { name: 'México', code: 'MEX', flag: 'mx' },
  SUD: { name: 'Sudáfrica', code: 'SUD', flag: 'za' },
  COR: { name: 'Corea Sur', code: 'COR', flag: 'kr' },
  RCH: { name: 'República Checa', code: 'RCH', flag: 'cz' },
  // Grupo B
  CAN: { name: 'Canadá', code: 'CAN', flag: 'ca' },
  BOS: { name: 'Bosnia y Herzegovina', code: 'BOS', flag: 'ba' },
  CAT: { name: 'Catar', code: 'CAT', flag: 'qa' },
  SUI: { name: 'Suiza', code: 'SUI', flag: 'ch' },
  // Grupo C
  HAI: { name: 'Haití', code: 'HAI', flag: 'ht' },
  ESC: { name: 'Escocia', code: 'ESC', flag: 'gb-sct' },
  BRA: { name: 'Brasil', code: 'BRA', flag: 'br' },
  MAR: { name: 'Marruecos', code: 'MAR', flag: 'ma' },
  // Grupo D
  USA: { name: 'Estados Unidos', code: 'USA', flag: 'us' },
  PAR: { name: 'Paraguay', code: 'PAR', flag: 'py' },
  AUS: { name: 'Australia', code: 'AUS', flag: 'au' },
  TUR: { name: 'Turquía', code: 'TUR', flag: 'tr' },
  // Grupo E
  CMA: { name: 'Costa de Marfil', code: 'CMA', flag: 'ci' },
  ECU: { name: 'Ecuador', code: 'ECU', flag: 'ec' },
  ALE: { name: 'Alemania', code: 'ALE', flag: 'de' },
  CUR: { name: 'Curazao', code: 'CUR', flag: 'cw' },
  // Grupo F
  PBA: { name: 'Países Bajos', code: 'PBA', flag: 'nl' },
  JAP: { name: 'Japón', code: 'JAP', flag: 'jp' },
  SUE: { name: 'Suecia', code: 'SUE', flag: 'se' },
  TUN: { name: 'Túnez', code: 'TUN', flag: 'tn' },
  // Grupo G
  IRA: { name: 'Irán', code: 'IRA', flag: 'ir' },
  NZE: { name: 'Nueva Zelanda', code: 'NZE', flag: 'nz' },
  BEL: { name: 'Bélgica', code: 'BEL', flag: 'be' },
  EGI: { name: 'Egipto', code: 'EGI', flag: 'eg' },
  // Grupo H
  ARA: { name: 'Arabia Saudí', code: 'ARA', flag: 'sa' },
  URU: { name: 'Uruguay', code: 'URU', flag: 'uy' },
  ESP: { name: 'España', code: 'ESP', flag: 'es' },
  CAB: { name: 'Cabo Verde', code: 'CAB', flag: 'cv' },
  // Grupo I
  FRA: { name: 'Francia', code: 'FRA', flag: 'fr' },
  SEN: { name: 'Senegal', code: 'SEN', flag: 'sn' },
  IRK: { name: 'Irak', code: 'IRK', flag: 'iq' },
  NOR: { name: 'Noruega', code: 'NOR', flag: 'no' },
  // Grupo J
  ARG: { name: 'Argentina', code: 'ARG', flag: 'ar' },
  ARL: { name: 'Argelia', code: 'ARL', flag: 'dz' },
  AUT: { name: 'Austria', code: 'AUT', flag: 'at' },
  JOR: { name: 'Jordania', code: 'JOR', flag: 'jo' },
  // Grupo K
  POR: { name: 'Portugal', code: 'POR', flag: 'pt' },
  RDC: { name: 'República Democrática del Congo', code: 'RDC', flag: 'cd' },
  UZB: { name: 'Uzbekistán', code: 'UZB', flag: 'uz' },
  COL: { name: 'Colombia', code: 'COL', flag: 'co' },
  // Grupo L
  GHA: { name: 'Ghana', code: 'GHA', flag: 'gh' },
  PAN: { name: 'Panamá', code: 'PAN', flag: 'pa' },
  ING: { name: 'Inglaterra', code: 'ING', flag: 'gb-eng' },
  CRO: { name: 'Croacia', code: 'CRO', flag: 'hr' }
};

const BASE_MATCHES = [
  // ── JORNADA 1 ──────────────────────────────────────────────

  // Grupo A
  { id: 'm1',  home: 'MEX', away: 'SUD', group: 'A', daysOffset: 0,  hour: 19 }, // 13h UTC-6 → 19h Madrid
  { id: 'm2',  home: 'COR', away: 'RCH', group: 'A', daysOffset: 1,  hour: 2 }, // 20h UTC-6 → 02h+1 Madrid (26 = 02:00 del día siguiente)

  // Grupo B
  { id: 'm3',  home: 'CAN', away: 'BOS', group: 'B', daysOffset: 1,  hour: 21 }, // 15h UTC-4 → 21h Madrid
  { id: 'm4',  home: 'CAT', away: 'SUI', group: 'B', daysOffset: 1,  hour: 20 }, // 12h UTC-7 → 21h Madrid — mismo día

  // Grupo C
  { id: 'm5',  home: 'HAI', away: 'ESC', group: 'C', daysOffset: 3,  hour: 3 }, // 21h UTC-4 → 03h+1 Madrid
  { id: 'm6',  home: 'BRA', away: 'MAR', group: 'C', daysOffset: 2,  hour: 22 }, // 18h UTC-4 → 00h Madrid (medianoche)

  // Grupo D
  { id: 'm7',  home: 'USA', away: 'PAR', group: 'D', daysOffset: 2,  hour: 2 }, // 18h UTC-7 → 02h+1 Madrid
  { id: 'm8',  home: 'AUS', away: 'TUR', group: 'D', daysOffset: 3,  hour: 5 }, // 21h UTC-7 → 05h+1 Madrid

  // Grupo E
  { id: 'm9',  home: 'CMA', away: 'ECU', group: 'E', daysOffset: 4,  hour: 1 }, // 19h UTC-4 → 01h+1 Madrid
  { id: 'm10', home: 'ALE', away: 'CUR', group: 'E', daysOffset: 3,  hour: 19 }, // 12h UTC-5 → 19h Madrid

  // Grupo F
  { id: 'm11', home: 'PBA', away: 'JAP', group: 'F', daysOffset: 3,  hour: 22 }, // 15h UTC-5 → 22h Madrid
  { id: 'm12', home: 'SUE', away: 'TUN', group: 'F', daysOffset: 4,  hour: 4 }, // 20h UTC-6 → 04h+1 Madrid

  // Grupo G
  { id: 'm13', home: 'IRA', away: 'NZE', group: 'G', daysOffset: 5,  hour: 3 }, // 18h UTC-7 → 03h+1 Madrid
  { id: 'm14', home: 'BEL', away: 'EGI', group: 'G', daysOffset: 4,  hour: 21 }, // 12h UTC-7 → 21h Madrid

  // Grupo H
  { id: 'm15', home: 'ARA', away: 'URU', group: 'H', daysOffset: 5,  hour: 0 }, // 18h UTC-4 → 00h Madrid
  { id: 'm16', home: 'ESP', away: 'CAB', group: 'H', daysOffset: 4,  hour: 18 }, // 12h UTC-4 → 18h Madrid

  // Grupo I
  { id: 'm17', home: 'FRA', away: 'SEN', group: 'I', daysOffset: 5,  hour: 21 }, // 15h UTC-4 → 21h Madrid
  { id: 'm18', home: 'IRK', away: 'NOR', group: 'I', daysOffset: 6,  hour: 0 }, // 18h UTC-4 → 00h Madrid

  // Grupo J
  { id: 'm19', home: 'ARG', away: 'ARL', group: 'J', daysOffset: 6,  hour: 3 }, // 20h UTC-5 → 03h+1 Madrid
  { id: 'm20', home: 'AUT', away: 'JOR', group: 'J', daysOffset: 6,  hour: 6 }, // 21h UTC-7 → 06h+1 Madrid

  // Grupo K
  { id: 'm21', home: 'POR', away: 'RDC', group: 'K', daysOffset: 6,  hour: 19 }, // 12h UTC-5 → 19h Madrid
  { id: 'm22', home: 'UZB', away: 'COL', group: 'K', daysOffset: 7,  hour: 4 }, // 20h UTC-6 → 04h+1 Madrid

  // Grupo L
  { id: 'm23', home: 'GHA', away: 'PAN', group: 'L', daysOffset: 7,  hour: 1 }, // 19h UTC-5 → 01h+1 Madrid
  { id: 'm24', home: 'ING', away: 'CRO', group: 'L', daysOffset: 6,  hour: 21 }, // 15h UTC-4 → 21h Madrid

  // ── JORNADA 2 ──────────────────────────────────────────────

  // Grupo A
  { id: 'm25', home: 'RCH', away: 'SUD', group: 'A', daysOffset: 7,  hour: 18 }, // 12h UTC-4 → 18h Madrid
  { id: 'm26', home: 'MEX', away: 'COR', group: 'A', daysOffset: 8,  hour: 1 }, // 19h UTC-6 → 01h+1 Madrid

  // Grupo B
  { id: 'm27', home: 'SUI', away: 'BOS', group: 'B', daysOffset: 7,  hour: 21 }, // 12h UTC-7 → 21h Madrid
  { id: 'm28', home: 'CAN', away: 'CAT', group: 'B', daysOffset: 8,  hour: 0 }, // 15h UTC-7 → 00h Madrid

  // Grupo C
  { id: 'm29', home: 'BRA', away: 'HAI', group: 'C', daysOffset: 9,  hour: 3 }, // 21h UTC-4 → 03h+1 Madrid
  { id: 'm30', home: 'ESC', away: 'MAR', group: 'C', daysOffset: 9,  hour: 0 }, // 18h UTC-4 → 00h Madrid

  // Grupo D
  { id: 'm31', home: 'TUR', away: 'PAR', group: 'D', daysOffset: 9,  hour: 6 }, // 21h UTC-7 → 06h+1 Madrid
  { id: 'm32', home: 'USA', away: 'AUS', group: 'D', daysOffset: 8,  hour: 21 }, // 12h UTC-7 → 21h Madrid

  // Grupo E
  { id: 'm33', home: 'ALE', away: 'CMA', group: 'E', daysOffset: 9,  hour: 22 }, // 16h UTC-4 → 22h Madrid
  { id: 'm34', home: 'ECU', away: 'CUR', group: 'E', daysOffset: 10,  hour: 2 }, // 19h UTC-5 → 01h+1 Madrid (daysOffset sería 10 si lo tratas como día siguiente)

  // Grupo F
  { id: 'm35', home: 'PBA', away: 'SUE', group: 'F', daysOffset: 9,  hour: 19 }, // 12h UTC-5 → 19h Madrid
  { id: 'm36', home: 'TUN', away: 'JAP', group: 'F', daysOffset: 10, hour: 6  }, // 22h UTC-6 → 06h+1 Madrid

  // Grupo G
  { id: 'm37', home: 'BEL', away: 'IRA', group: 'G', daysOffset: 10, hour: 21 }, // 12h UTC-7 → 21h Madrid
  { id: 'm38', home: 'NZE', away: 'EGI', group: 'G', daysOffset: 11, hour: 2 }, // 18h UTC-7 → 01h+1 Madrid (o 03h si UTC-7)

  // Grupo H
  { id: 'm39', home: 'URU', away: 'CAB', group: 'H', daysOffset: 11, hour: 0 }, // 18h UTC-4 → 00h Madrid
  { id: 'm40', home: 'ESP', away: 'ARA', group: 'H', daysOffset: 10, hour: 18 }, // 12h UTC-4 → 18h Madrid

  // Grupo I
  { id: 'm41', home: 'NOR', away: 'SEN', group: 'I', daysOffset: 12, hour: 2 }, // 20h UTC-4 → 02h+1 Madrid
  { id: 'm42', home: 'FRA', away: 'IRK', group: 'I', daysOffset: 11, hour: 23 }, // 17h UTC-4 → 23h Madrid

  // Grupo J
  { id: 'm43', home: 'ARG', away: 'AUT', group: 'J', daysOffset: 11, hour: 19 }, // 12h UTC-5 → 19h Madrid
  { id: 'm44', home: 'JOR', away: 'ARL', group: 'J', daysOffset: 12, hour: 4 }, // 20h UTC-7 → 04h+1 Madrid

  // Grupo K
  { id: 'm45', home: 'POR', away: 'UZB', group: 'K', daysOffset: 12, hour: 19 }, // 12h UTC-5 → 19h Madrid
  { id: 'm46', home: 'COL', away: 'RDC', group: 'K', daysOffset: 13, hour: 4 }, // 20h UTC-6 → 04h+1 Madrid

  // Grupo L
  { id: 'm47', home: 'ING', away: 'GHA', group: 'L', daysOffset: 12, hour: 22 }, // 16h UTC-4 → 22h Madrid
  { id: 'm48', home: 'PAN', away: 'CRO', group: 'L', daysOffset: 13, hour: 3 }, // 19h UTC-4 → 01h+1 Madrid

  // ── JORNADA 3 ──────────────────────────────────────────────

  // Grupo A (simultáneos)
  { id: 'm49', home: 'RCH', away: 'MEX', group: 'A', daysOffset: 14, hour: 1 }, // 19h UTC-6 → 01h+1 Madrid
  { id: 'm50', home: 'SUD', away: 'COR', group: 'A', daysOffset: 14, hour: 1 },

  // Grupo B (simultáneos)
  { id: 'm51', home: 'SUI', away: 'CAN', group: 'B', daysOffset: 13, hour: 21 }, // 12h UTC-7 → 21h Madrid
  { id: 'm52', home: 'BOS', away: 'CAT', group: 'B', daysOffset: 13, hour: 21 },

  // Grupo C (simultáneos)
  { id: 'm53', home: 'ESC', away: 'BRA', group: 'C', daysOffset: 14, hour: 0 }, // 18h UTC-4 → 00h Madrid
  { id: 'm54', home: 'MAR', away: 'HAI', group: 'C', daysOffset: 14, hour: 0 },

  // Grupo D (simultáneos)
  { id: 'm55', home: 'TUR', away: 'USA', group: 'D', daysOffset: 15, hour: 3 }, // 19h UTC-7 → 03h+1 Madrid
  { id: 'm56', home: 'PAR', away: 'AUS', group: 'D', daysOffset: 15, hour: 3 },

  // Grupo E (simultáneos)
  { id: 'm57', home: 'CUR', away: 'CMA', group: 'E', daysOffset: 14, hour: 22 }, // 16h UTC-4 → 22h Madrid
  { id: 'm58', home: 'ECU', away: 'ALE', group: 'E', daysOffset: 14, hour: 22 },

  // Grupo F (simultáneos)
  { id: 'm59', home: 'JAP', away: 'SUE', group: 'F', daysOffset: 15, hour: 1 }, // 18h UTC-5 → 01h+1 Madrid
  { id: 'm60', home: 'TUN', away: 'PBA', group: 'F', daysOffset: 15, hour: 1 },

  // Grupo G (simultáneos)
  { id: 'm61', home: 'EGI', away: 'IRA', group: 'G', daysOffset: 16, hour: 4 }, // 20h UTC-7 → 04h+1 Madrid
  { id: 'm62', home: 'NZE', away: 'BEL', group: 'G', daysOffset: 16, hour: 4 },

  // Grupo H (simultáneos)
  { id: 'm63', home: 'CAB', away: 'ARA', group: 'H', daysOffset: 16, hour: 2 }, // 19h UTC-5 → 01h+1 Madrid
  { id: 'm64', home: 'URU', away: 'ESP', group: 'H', daysOffset: 16, hour: 2 }, // 18h UTC-6 → 02h+1 Madrid

  // Grupo I (simultáneos)
  { id: 'm65', home: 'NOR', away: 'FRA', group: 'I', daysOffset: 15, hour: 21 }, // 15h UTC-4 → 21h Madrid
  { id: 'm66', home: 'SEN', away: 'IRK', group: 'I', daysOffset: 15, hour: 21 },

  // Grupo J (simultáneos)
  { id: 'm67', home: 'ARL', away: 'AUT', group: 'J', daysOffset: 17, hour: 4 }, // 21h UTC-5 → 03h+1 ó 05h+1 UTC-7
  { id: 'm68', home: 'JOR', away: 'ARG', group: 'J', daysOffset: 17, hour: 4 },

  // Grupo K (simultáneos)
  { id: 'm69', home: 'COL', away: 'POR', group: 'K', daysOffset: 17, hour: 1 }, // 19:30h UTC-4 → ~01:30h+1 Madrid
  { id: 'm70', home: 'RDC', away: 'UZB', group: 'K', daysOffset: 17, hour: 1 },

  // Grupo L (simultáneos)
  { id: 'm71', home: 'PAN', away: 'ING', group: 'L', daysOffset: 16, hour: 23 }, // 17h UTC-4 → 23h Madrid
  { id: 'm72', home: 'CRO', away: 'GHA', group: 'L', daysOffset: 16, hour: 23 },
];

export async function seedMatches(): Promise<void> {
  const batch = writeBatch(db);
  const mundialStart = new Date(2026, 5, 11); // 11 de junio de 2026 (mes 5 = junio en 0-indexed)

  BASE_MATCHES.forEach((match) => {
    const scheduledDate = new Date(mundialStart.getFullYear(), mundialStart.getMonth(), mundialStart.getDate() + match.daysOffset, match.hour, 0, 0);
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
