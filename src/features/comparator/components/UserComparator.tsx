import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { usersService } from '@/features/users/services/usersService';
import { predictionsService } from '@/features/predictions/services/predictionsService';
import { matchesService } from '@/features/matches/services/matchesService';
import { UserProfile, Prediction, Match } from '@/types/global.types';
import { flagUrl, flagEmojiFromCode } from '@/lib/flags/flagsService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Users, AlertCircle } from 'lucide-react';

export function ComparatorPage() {
  const { user } = useAuth();

  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Multi selection of participants (columns)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Filters for matches
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'finished'>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');

  // predictions per user: userId -> { matchId -> Prediction }
  const [predictionsMap, setPredictionsMap] = useState<Record<string, Record<string, Prediction>>>({});
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [users, allMatches] = await Promise.all([
          usersService.getAllUsers(),
          matchesService.getMatches(),
        ]);
        setUsersList(users);
        setMatches(allMatches);
        if (user) setSelectedUsers([user.uid]);
      } catch (err) {
        console.error('Error inicializando comparador:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  // Load predictions for selected users
  useEffect(() => {
    const load = async () => {
      if (selectedUsers.length === 0) {
        setPredictionsMap({});
        return;
      }
      setLoadingPredictions(true);
      try {
        const results = await Promise.all(selectedUsers.map((uid) => predictionsService.getUserPredictions(uid)));
        const map: Record<string, Record<string, Prediction>> = {};
        selectedUsers.forEach((uid, i) => {
          const arr = results[i] || [];
          const per: Record<string, Prediction> = {};
          arr.forEach((p) => { per[p.matchId] = p; });
          map[uid] = per;
        });
        setPredictionsMap(map);
      } catch (err) {
        console.error('Error cargando predicciones para usuarios seleccionados', err);
      } finally {
        setLoadingPredictions(false);
      }
    };
    load();
  }, [selectedUsers]);

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const GROUPS = Array.from(new Set(matches.map((m) => m.group))).filter(Boolean) as string[];

  const filteredMatches = matches.filter((m) => {
    if (groupFilter !== 'all' && m.group !== groupFilter) return false;
    if (stageFilter !== 'all' && m.stage !== stageFilter) return false;
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    return true;
  });

  const toggleUser = (uid: string) => {
    setSelectedUsers((prev) => prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Comparador — Tabla partidos × participantes</CardTitle>
          </div>
          <CardDescription>Selecciona participantes y filtra los partidos que quieras ver</CardDescription>
        </CardHeader>
        <CardContent className="p-6 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-black uppercase text-muted-foreground">Filtrar por grupo</label>
              <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="w-full mt-2 bg-background border border-border rounded-lg px-3 py-2 text-sm">
                <option value="all">Todos</option>
                {GROUPS.map((g) => <option key={g} value={g}>Grupo {g}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-black uppercase text-muted-foreground">Estado</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full mt-2 bg-background border border-border rounded-lg px-3 py-2 text-sm">
                <option value="all">Todos</option>
                <option value="upcoming">Por disputar</option>
                <option value="finished">Finalizados</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-black uppercase text-muted-foreground">Participantes (selecciona varios)</label>
              <div className="mt-2 max-h-40 overflow-auto border border-border rounded-md p-2 bg-background">
                {usersList.map((u) => (
                  <label key={u.uid} className="flex items-center space-x-2 text-sm p-1">
                    <input type="checkbox" checked={selectedUsers.includes(u.uid)} onChange={() => toggleUser(u.uid)} />
                    <span className="truncate">{u.displayName} ({u.totalPoints})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedUsers.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-2xl">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-semibold">Selecciona al menos un participante para mostrar la tabla</p>
        </div>
      ) : loadingPredictions ? (
        <div className="flex h-[30vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card className="overflow-auto">
          <CardHeader className="bg-muted/30 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Partidos ({filteredMatches.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="bg-muted/20 text-xs text-muted-foreground">
                  <th className="p-2 sticky left-0 bg-muted/20">Partido</th>
                  {selectedUsers.map((uid) => {
                    const u = usersList.find((x) => x.uid === uid);
                    return <th key={uid} className="p-2">{u?.displayName}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredMatches.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="p-2 w-64">
                      <div className="flex items-center justify-center space-x-2">
                        <img
                          src={flagUrl(m.homeTeam.flag, 24)}
                          alt={m.homeTeam.name}
                          title={m.homeTeam.name}
                          className="h-4 w-6 object-contain"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span title={m.homeTeam.name} className="text-sm truncate font-medium max-w-[120px]">{m.homeTeam.name}</span>
                        <span className="text-sm font-black">-</span>
                        <span title={m.awayTeam.name} className="text-sm truncate font-medium max-w-[120px]">{m.awayTeam.name}</span>
                        <img
                          src={flagUrl(m.awayTeam.flag, 24)}
                          alt={m.awayTeam.name}
                          title={m.awayTeam.name}
                          className="h-4 w-6 object-contain"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    </td>
                    {selectedUsers.map((uid) => {
                      const pred = predictionsMap[uid]?.[m.id];
                      return (
                        <td key={uid} className="p-2 text-center align-top">
                          {pred ? (
                            <div className="space-y-1">
                              <div className="font-bold">{pred.homeGoals} - {pred.awayGoals}</div>
                              <div className={`text-[11px] font-black ${pred.points === 3 ? 'text-emerald-600' : pred.points === 1 ? 'text-blue-600' : 'text-rose-600'}`}>{pred.points ?? '-' } pts</div>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
