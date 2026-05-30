import { seedMatches } from './src/lib/firebase/seed';

console.log('Iniciando sembrado de partidos...');
seedMatches()
  .then(() => {
    console.log('Sembrado de partidos completado con éxito.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error al sembrar partidos:', err);
    process.exit(1);
  });
