import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { Match, Prediction } from '@/types/global.types';
import { matchesService } from '@/features/matches/services/matchesService';
import { predictionsService } from '@/features/predictions/services/predictionsService';
import { MatchCard } from './MatchCard';
import { Button } from '@/shared/components/ui/Button';
import { Trophy, Filter, Calendar } from 'lucide-react';

export function HomePage() {
  const { user, profile } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [pendingEdits, setPendingEdits] = useState<Record<string, { home: string; away: string; edited: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  
  // Filtros
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'finished'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const fetchedMatches = await matchesService.getMatches();
      setMatches(fetchedMatches);

      const fetchedPreds = await predictionsService.getUserPredictions(user.uid);
      const predsMap: Record<string, Prediction> = {};
      fetchedPreds.forEach((p) => {
        predsMap[p.matchId] = p;
      });
      setPredictions(predsMap);
    } catch (error) {
      console.error('Error al cargar partidos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSavePrediction = async (matchId: string, homeGoals: number, awayGoals: number) => {
    if (!user) return;
    setSavingId(matchId);
    try {
      const match = matches.find((m) => m.id === matchId);
      if (!match) return;

      await predictionsService.savePrediction(
        user.uid,
        matchId,
        homeGoals,
        awayGoals,
        match.scheduledAt
      );

      // Actualizar localmente el mapa de predicciones para evitar relance de query
      setPredictions((prev) => ({
        ...prev,
        [matchId]: {
          id: `${user.uid}_${matchId}`,
          userId: user.uid,
          matchId,
          homeGoals,
          awayGoals,
          points: null,
          isLocked: false,
          createdAt: new Date() as any,
          updatedAt: new Date() as any,
        },
      }));
      // Clear pending edit for this match
      setPendingEdits((prev) => {
        const copy = { ...prev };
        delete copy[matchId];
        return copy;
      });
    } catch (err: any) {
      alert(err.message || 'Error al guardar el pronóstico');
    } finally {
      setSavingId(null);
    }
  };

  const handleEdit = (matchId: string, home: string, away: string, edited: boolean) => {
    setPendingEdits((prev) => ({
      ...prev,
      [matchId]: { home, away, edited },
    }));
  };

  const handleSaveAll = async () => {
    if (!user) return;
    const entries = Object.entries(pendingEdits).filter(([, v]) => v.edited);
    if (entries.length === 0) return;
    setSavingAll(true);
    for (const [matchId, { home, away }] of entries) {
      const h = parseInt(home || '0');
      const a = parseInt(away || '0');
      try {
        await handleSavePrediction(matchId, h, a);
      } catch (e) {
        console.error('Error guardando', matchId, e);
      }
    }
    setSavingAll(false);
  };

  // Filtrado final de los partidos
  const filteredMatches = matches.filter((m) => {
    const statusMatch =
      filter === 'all' ||
      (filter === 'upcoming' && m.status !== 'finished') ||
      (filter === 'finished' && m.status === 'finished');

    const groupMatch = groupFilter === 'all' || m.group === groupFilter;

    return statusMatch && groupMatch;
  });

  const uniqueGroups = Array.from(new Set(matches.map((m) => m.group).filter(Boolean))) as string[];
  uniqueGroups.sort();

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner de Bienvenida y Estadísticas Rápidas del Usuario */}
      {profile && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-primary to-indigo-600 p-6 md:p-8 text-white shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black">¡Hola, {profile.displayName}! 👋</h1>
              <p className="text-primary-foreground/90 text-sm font-medium mt-1">
                Compite con inteligencia, acierta el marcador exacto y llévate la corona.
              </p>
            </div>
            <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 shrink-0">
              <div className="text-center px-3 border-r border-white/20">
                <span className="block text-2xl font-black">{profile.totalPoints}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Puntos</span>
              </div>
              <div className="text-center px-3 border-r border-white/20">
                <span className="block text-2xl font-black">{profile.exactPredictions}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Exactos</span>
              </div>
              <div className="text-center px-3">
                <span className="block text-2xl font-black">{profile.totalPredictions}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Apuestas</span>
              </div>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-15 transform translate-y-4 translate-x-4 select-none pointer-events-none">
            <Trophy className="h-44 w-44" />
          </div>
        </div>
      )}

      {/* Controles de Filtros */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todos
          </Button>
          <Button
            variant={filter === 'upcoming' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('upcoming')}
          >
            Próximos
          </Button>
          <Button
            variant={filter === 'finished' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('finished')}
          >
            Disputados
          </Button>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="bg-background border border-border rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          >
            <option value="all">Todos los Grupos</option>
            {uniqueGroups.map((g) => (
              <option key={g} value={g}>
                Grupo {g}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={handleSaveAll}
            disabled={savingAll || Object.values(pendingEdits).every((p) => !p.edited)}
            className="ml-2"
          >
            {savingAll ? 'Guardando...' : 'Guardar todos'}
          </Button>
        </div>
      </div>

      {/* Grid de Partidos */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-2xl">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 animate-pulse" />
          <p className="text-muted-foreground font-semibold">No se encontraron partidos con los filtros aplicados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={predictions[match.id] || null}
              onSavePrediction={handleSavePrediction}
              onEdit={handleEdit}
              isSubmitting={savingId === match.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
