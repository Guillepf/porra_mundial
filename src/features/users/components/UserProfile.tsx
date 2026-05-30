import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { predictionsService } from '@/features/predictions/services/predictionsService';
import { matchesService } from '@/features/matches/services/matchesService';
import { Prediction, Match } from '@/types/global.types';
import { usersService } from '@/features/users/services/usersService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Trophy, Mail, Calendar, User, Save } from 'lucide-react';

export function ProfilePage() {
  const { user, profile } = useAuth();
  
  // Perfil editable
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Historial de predicciones
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [matches, setMatches] = useState<Record<string, Match>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
    }
  }, [profile]);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;
      try {
        const [preds, allMatches] = await Promise.all([
          predictionsService.getUserPredictions(user.uid),
          matchesService.getMatches()
        ]);

        setPredictions(preds);

        const matchMap: Record<string, Match> = {};
        allMatches.forEach((m) => {
          matchMap[m.id] = m;
        });
        setMatches(matchMap);
      } catch (err) {
        console.error('Error al cargar datos del perfil:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim()) return;

    setUpdating(true);
    setSuccessMsg(null);
    try {
      await usersService.updateProfile(user.uid, { displayName });
      setSuccessMsg('¡Nombre de perfil actualizado con éxito!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna Izquierda: Información de Perfil */}
      <div className="space-y-6 lg:col-span-1">
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <div className="relative inline-block">
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  className="h-24 w-24 rounded-full border-4 border-primary mx-auto object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center font-bold text-3xl text-primary mx-auto">
                  {profile.displayName.substring(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase">
                {profile.role}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">{profile.displayName}</h2>
              <p className="text-muted-foreground text-xs flex items-center justify-center space-x-1 font-semibold">
                <Mail className="h-3 w-3 shrink-0" />
                <span>{profile.email}</span>
              </p>
            </div>

            {/* Estadísticas de la porra */}
            <div className="grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
              <div>
                <span className="block text-xl font-black text-primary">{profile.totalPoints}</span>
                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Puntos</span>
              </div>
              <div>
                <span className="block text-xl font-black text-foreground">{profile.exactPredictions}</span>
                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Exactos</span>
              </div>
              <div>
                <span className="block text-xl font-black text-foreground">{profile.totalPredictions}</span>
                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Apuestas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulario de actualización */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Editar Perfil</CardTitle>
            <CardDescription>Modifica tu nombre visible en la clasificación general</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground">Nombre público</label>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu alias o nombre"
                />
              </div>

              {successMsg && (
                <p className="text-xs text-emerald-500 font-bold bg-emerald-500/10 p-2 rounded-lg text-center">
                  {successMsg}
                </p>
              )}

              <Button type="submit" disabled={updating} className="w-full flex items-center justify-center space-x-2">
                <Save className="h-4 w-4" />
                <span>{updating ? 'Guardando...' : 'Actualizar Nombre'}</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Columna Derecha: Historial de apuestas */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-primary" />
              <CardTitle>Historial de Apuestas</CardTitle>
            </div>
            <CardDescription>Listado y rendimiento de todos tus pronósticos del torneo</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase font-black bg-muted/30">
                  <th className="py-4 px-6">Partido</th>
                  <th className="py-4 px-4 text-center w-28">Apuesta</th>
                  <th className="py-4 px-4 text-center w-28">Resultado Real</th>
                  <th className="py-4 px-6 text-center w-24">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {predictions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-muted-foreground font-semibold">
                      Aún no has guardado ningún pronóstico. ¡Ve a la página principal para empezar!
                    </td>
                  </tr>
                ) : (
                  predictions.map((pred) => {
                    const match = matches[pred.matchId];
                    if (!match) return null;

                    return (
                      <tr key={pred.id} className="border-b border-border hover:bg-muted/15 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <span>{match.homeTeam.flag}</span>
                            <span className="text-sm font-semibold text-foreground shrink-0">{match.homeTeam.code}</span>
                            <span className="text-muted-foreground text-xs font-black">vs</span>
                            <span>{match.awayTeam.flag}</span>
                            <span className="text-sm font-semibold text-foreground shrink-0">{match.awayTeam.code}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center text-sm font-bold text-foreground">
                          <span className="bg-secondary/70 px-2 py-1 rounded">
                            {pred.homeGoals} - {pred.awayGoals}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center text-sm text-muted-foreground font-bold">
                          {match.status === 'finished' && match.result ? (
                            <span className="bg-muted px-2 py-1 rounded text-foreground">
                              {match.result.homeGoals} - {match.result.awayGoals}
                            </span>
                          ) : (
                            <span className="text-xs italic font-medium">No disputado</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center font-black">
                          {pred.points !== null && pred.points !== undefined ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                              pred.points === 3 ? 'bg-emerald-500/20 text-emerald-500' :
                              pred.points === 1 ? 'bg-blue-500/20 text-blue-500' : 'bg-rose-500/20 text-rose-500'
                            }`}>
                              +{pred.points}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground font-semibold">Pendiente</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
