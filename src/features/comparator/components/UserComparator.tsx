import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { usersService } from '@/features/users/services/usersService';
import { predictionsService } from '@/features/predictions/services/predictionsService';
import { matchesService } from '@/features/matches/services/matchesService';
import { UserProfile, Prediction, Match } from '@/types/global.types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Users, AlertCircle, ArrowLeftRight } from 'lucide-react';

export function ComparatorPage() {
  const { user } = useAuth();
  
  // Estados de datos
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Usuarios seleccionados para comparar
  const [userAId, setUserAId] = useState<string>('');
  const [userBId, setUserBId] = useState<string>('');

  // Pronósticos cargados
  const [predictionsA, setPredictionsA] = useState<Record<string, Prediction>>({});
  const [predictionsB, setPredictionsB] = useState<Record<string, Prediction>>({});
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  // Inicializar cargando la lista de usuarios y partidos
  useEffect(() => {
    const initPage = async () => {
      try {
        const fetchedUsers = await usersService.getAllUsers();
        setUsersList(fetchedUsers);
        
        const fetchedMatches = await matchesService.getMatches();
        setMatches(fetchedMatches.filter(m => m.status === 'finished')); // Solo comparar disputados con resultados reales

        // Auto-seleccionar usuario actual como Usuario A si está disponible
        if (user) {
          setUserAId(user.uid);
        }
      } catch (err) {
        console.error('Error al inicializar comparador:', err);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [user]);

  // Cargar pronósticos cuando cambien las selecciones de usuarios
  useEffect(() => {
    const fetchPredictions = async () => {
      if (!userAId || !userBId) {
        setPredictionsA({});
        setPredictionsB({});
        return;
      }

      setLoadingPredictions(true);
      try {
        const [predsA, predsB] = await Promise.all([
          predictionsService.getUserPredictions(userAId),
          predictionsService.getUserPredictions(userBId)
        ]);

        const mapA: Record<string, Prediction> = {};
        predsA.forEach((p) => { mapA[p.matchId] = p; });

        const mapB: Record<string, Prediction> = {};
        predsB.forEach((p) => { mapB[p.matchId] = p; });

        setPredictionsA(mapA);
        setPredictionsB(mapB);
      } catch (err) {
        console.error('Error al cargar predicciones de comparación:', err);
      } finally {
        setLoadingPredictions(false);
      }
    };

    fetchPredictions();
  }, [userAId, userBId]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filtrar listas de selección para evitar que seleccionen al mismo usuario en ambos lados
  const optionsA = usersList.filter((u) => u.uid !== userBId);
  const optionsB = usersList.filter((u) => u.uid !== userAId);

  const selectedUserA = usersList.find((u) => u.uid === userAId);
  const selectedUserB = usersList.find((u) => u.uid === userBId);

  return (
    <div className="space-y-6">
      {/* Selector de Comparación */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Comparador de Pronósticos</CardTitle>
          </div>
          <CardDescription>
            Selecciona dos participantes para comparar sus estrategias, aciertos y diferencias en tiempo real
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Usuario A */}
            <div className="flex-1 w-full space-y-2">
              <label className="text-xs font-black uppercase text-muted-foreground">Participante A</label>
              <select
                value={userAId}
                onChange={(e) => setUserAId(e.target.value)}
                className="w-full bg-background border border-border rounded-lg text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              >
                <option value="">Selecciona usuario...</option>
                {optionsA.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.displayName} ({u.totalPoints} pts)
                  </option>
                ))}
              </select>
            </div>

            <ArrowLeftRight className="h-6 w-6 text-muted-foreground hidden md:block shrink-0" />

            {/* Usuario B */}
            <div className="flex-1 w-full space-y-2">
              <label className="text-xs font-black uppercase text-muted-foreground">Participante B</label>
              <select
                value={userBId}
                onChange={(e) => setUserBId(e.target.value)}
                className="w-full bg-background border border-border rounded-lg text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              >
                <option value="">Selecciona usuario...</option>
                {optionsB.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.displayName} ({u.totalPoints} pts)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualización de la comparación */}
      {!userAId || !userBId ? (
        <div className="text-center py-12 bg-card border border-border rounded-2xl">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-semibold">
            Selecciona ambos participantes arriba para visualizar el desglose comparativo
          </p>
        </div>
      ) : loadingPredictions ? (
        <div className="flex h-[30vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border">
            <div className="grid grid-cols-3 items-center text-center font-black text-sm text-foreground">
              <span className="truncate">{selectedUserA?.displayName}</span>
              <span className="text-primary text-xs uppercase">Vs</span>
              <span className="truncate">{selectedUserB?.displayName}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {matches.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm font-semibold">
                  No hay partidos disputados o finalizados con resultados oficiales aún
                </div>
              ) : (
                matches.map((match) => {
                  const predA = predictionsA[match.id];
                  const predB = predictionsB[match.id];

                  return (
                    <div key={match.id} className="p-4 grid grid-cols-3 items-center text-center hover:bg-muted/15 transition-colors gap-2">
                      {/* Pred A */}
                      <div className="flex flex-col items-center">
                        {predA ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold bg-secondary/80 px-2 py-1 rounded">
                              {predA.homeGoals} - {predA.awayGoals}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                              predA.points === 3 ? 'bg-emerald-500/20 text-emerald-500' :
                              predA.points === 1 ? 'bg-blue-500/20 text-blue-500' : 'bg-rose-500/20 text-rose-500'
                            }`}>
                              {predA.points} pts
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Sin apuesta</span>
                        )}
                      </div>

                      {/* Partido central e info de banderitas */}
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <div className="flex items-center space-x-1.5 justify-center">
                          <span className="text-lg" title={match.homeTeam.name}>{match.homeTeam.flag}</span>
                          <span className="text-xs font-black text-foreground">{match.result?.homeGoals} - {match.result?.awayGoals}</span>
                          <span className="text-lg" title={match.awayTeam.name}>{match.awayTeam.flag}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                          Grupo {match.group}
                        </span>
                      </div>

                      {/* Pred B */}
                      <div className="flex flex-col items-center">
                        {predB ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold bg-secondary/80 px-2 py-1 rounded">
                              {predB.homeGoals} - {predB.awayGoals}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                              predB.points === 3 ? 'bg-emerald-500/20 text-emerald-500' :
                              predB.points === 1 ? 'bg-blue-500/20 text-blue-500' : 'bg-rose-500/20 text-rose-500'
                            }`}>
                              {predB.points} pts
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Sin apuesta</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
