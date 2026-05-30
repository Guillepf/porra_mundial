import { useEffect, useState } from 'react';
import { standingsService } from '@/features/standings/services/standingsService';
import { RankingEntry } from '@/types/global.types';
import { useAuth } from '@/app/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card';
import { Trophy, Medal, Star, BarChart } from 'lucide-react';

export function StandingsPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const data = await standingsService.getStandings();
        setEntries(data);
      } catch (err) {
        console.error('Error al cargar clasificación:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Encontrar la posición del usuario autenticado actual si existe en la porra
  const myEntry = entries.find((e) => e.userId === user?.uid);

  return (
    <div className="space-y-6">
      {/* Resumen del Usuario Actual en la Clasificación */}
      {myEntry && (
        <div className="bg-card border-2 border-primary/45 rounded-2xl p-5 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3.5">
            <div className="bg-primary/10 text-primary p-3 rounded-xl">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-foreground">Tu posición actual</h3>
              <p className="text-muted-foreground text-xs font-semibold">
                Estás compitiendo con {entries.length} participantes
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-3xl font-black text-primary">#{myEntry.position}</span>
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
              {myEntry.totalPoints} Puntos
            </span>
          </div>
        </div>
      )}

      {/* Tabla Principal de Clasificación */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center space-x-2">
            <BarChart className="h-5 w-5 text-primary" />
            <CardTitle>Clasificación General</CardTitle>
          </div>
          <CardDescription>
            Puntuación calculada según aciertos de marcadores exactos (3 pts) y signos de partidos (1 pt)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase font-black bg-muted/30">
                <th className="py-4 px-4 text-center w-14">Pos</th>
                <th className="py-4 px-4">Usuario</th>
                <th className="py-4 px-4 text-center w-24">Exactos</th>
                <th className="py-4 px-4 text-center w-24">Apuestas</th>
                <th className="py-4 px-4 text-center w-28 font-bold text-foreground">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground font-semibold">
                    Todavía no hay puntuaciones ni usuarios en la porra
                  </td>
                </tr>
              ) : (
                entries.map((entry, idx) => {
                  const isMe = entry.userId === user?.uid;
                  
                  // Render de iconos de medalla para el podio
                  let positionDisplay: React.ReactNode = entry.position;
                  if (entry.position === 1) {
                    positionDisplay = <Medal className="h-5 w-5 text-amber-500 mx-auto" />;
                  } else if (entry.position === 2) {
                    positionDisplay = <Medal className="h-5 w-5 text-slate-400 mx-auto" />;
                  } else if (entry.position === 3) {
                    positionDisplay = <Medal className="h-5 w-5 text-amber-700 mx-auto" />;
                  }

                  return (
                    <tr
                      key={entry.userId}
                      className={`border-b border-border hover:bg-muted/30 transition-colors ${
                        isMe ? 'bg-primary/5 font-semibold border-l-4 border-l-primary' : ''
                      }`}
                    >
                      <td className="py-4 px-4 text-center text-sm font-bold text-foreground">
                        <div className="flex items-center justify-center">
                          {positionDisplay}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          {entry.photoURL ? (
                            <img
                              src={entry.photoURL}
                              alt={entry.displayName}
                              className="h-8 w-8 rounded-full border border-border object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-primary">
                              {entry.displayName.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className={`text-sm text-foreground ${isMe ? 'text-primary font-bold' : ''}`}>
                            {entry.displayName}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-sm text-foreground">{entry.exactPredictions}</td>
                      <td className="py-4 px-4 text-center text-sm text-muted-foreground">{entry.totalPredictions}</td>
                      <td className="py-4 px-4 text-center text-base font-black text-foreground">{entry.totalPoints}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
