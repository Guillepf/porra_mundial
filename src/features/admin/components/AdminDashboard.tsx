import { useEffect, useState } from 'react';
import { Match } from '@/types/global.types';
import { matchesService } from '@/features/matches/services/matchesService';
import { adminService } from '@/features/admin/services/adminService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Shield, Plus, Edit3, Settings, Trophy, Activity, RefreshCw } from 'lucide-react';
import { seedMatches } from '@/lib/firebase/seed';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/providers/AuthProvider';
export function AdminDashboard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  // Marcadores editables locales por ID de partido
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({});
  const { user, profile } = useAuth();

  // Firestore role check (debugging aid)
  const [firestoreRole, setFirestoreRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  const fetchFirestoreRole = async () => {
    if (!user) {
      setFirestoreRole(null);
      return;
    }
    setRoleLoading(true);
    try {
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data: any = snap.data();
        setFirestoreRole(data.role ?? 'missing');
      } else {
        setFirestoreRole('not-found');
      }
    } catch (err) {
      console.error('Error comprobando role en Firestore:', err);
      setFirestoreRole('error');
    } finally {
      setRoleLoading(false);
    }
  };
  const loadMatches = async () => {
    setLoading(true);
    try {
      const allMatches = await matchesService.getMatches();
      setMatches(allMatches);
      // Pre-cargar inputs de scores reales existentes o vacíos
      const initialScores: Record<string, { home: string; away: string }> = {};
      allMatches.forEach((m) => {
        initialScores[m.id] = {
          home: m.result ? m.result.homeGoals.toString() : '',
          away: m.result ? m.result.awayGoals.toString() : '',
        };
      });
      setScores(initialScores);
    } catch (err) {
      console.error('Error al cargar partidos de admin:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadMatches();
    fetchFirestoreRole();
  }, []);
  const handleScoreChange = (matchId: string, side: 'home' | 'away', val: string) => {
    const cleaned = val.replace(/\D/g, '');
    setScores((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId]!,
        [side]: cleaned,
      },
    }));
  };
  const handleSaveResult = async (matchId: string) => {
    const score = scores[matchId];
    if (!score || score.home === '' || score.away === '') {
      alert('Debes ingresar ambos goles para guardar el resultado.');
      return;
    }
    setUpdatingId(matchId);
    try {
      await adminService.setMatchResult(matchId, parseInt(score.home), parseInt(score.away));
      alert('Resultado guardado y clasificaciones recalculadas.');
      await loadMatches();
    } catch (err) {
      console.error(err);
      alert('Error al guardar resultado');
    } finally {
      setUpdatingId(null);
    }
  };
  const handleTriggerSeed = async () => {
    if (!window.confirm('¿Seguro que deseas inicializar el calendario y partidos semilla del Mundial 2026? Se añadirán todos los partidos oficiales.')) {
      return;
    }
    setLoading(true);
    try {
      await seedMatches();
      alert('¡Datos semilla inyectados con éxito!');
      await loadMatches();
    } catch (err) {
      console.error(err);
      alert('Error al sembrar partidos');
    } finally {
      setLoading(false);
    }
  };
  const handleRecalculatePoints = async () => {
    setLoading(true);
    try {
      await adminService.recalculateAllUsersPoints();
      alert('¡Puntajes y clasificaciones recalculadas con éxito de forma global!');
    } catch (err) {
      console.error(err);
      alert('Error en recálculo global');
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Cabecera Administrativa */}
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 text-primary p-3 rounded-xl">
            <Shield className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Panel de Control del Administrador</h1>
            <p className="text-muted-foreground text-xs font-semibold">
              Gestiona marcadores, introduce resultados, recalcula la porra global y semilla el torneo gratis
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleTriggerSeed} className="border-primary/40">
            <Plus className="h-4 w-4 mr-1 text-primary" />
            <span>Semilla WC 2026</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleRecalculatePoints} className="border-emerald-500/40 text-emerald-500">
            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            <span>Recalcular Todo</span>
          </Button>
          {user && (
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-semibold ${firestoreRole === 'admin' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {roleLoading ? 'Comprobando rol...' : `Firestore role: ${firestoreRole ?? '—'}`}
              </span>
              <Button variant="ghost" size="sm" onClick={fetchFirestoreRole}>
                Refrescar rol
              </Button>
            </div>
          )}
        </div>
      </div>
      {/* Lista de Partidos para Puntuación */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Partidos y Marcadores Oficiales</CardTitle>
          </div>
          <CardDescription>
            Actualiza el resultado real una vez finalizados los partidos para puntuar a todos los concursantes automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase font-black bg-muted/30">
                <th className="py-4 px-6">Partido</th>
                <th className="py-4 px-4 text-center">Fase</th>
                <th className="py-4 px-4 text-center w-48">Resultado Real</th>
                <th className="py-4 px-6 text-center w-36">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {matches.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-muted-foreground font-semibold">
                    No hay partidos sembrados. Haz clic en 'Semilla WC 2026' arriba para poblar el calendario.
                  </td>
                </tr>
              ) : (
                matches.map((match) => {
                  const score = scores[match.id] || { home: '', away: '' };
                  return (
                    <tr key={match.id} className="border-b border-border hover:bg-muted/15 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{match.homeTeam.flag}</span>
                          <span className="text-sm font-semibold text-foreground">{match.homeTeam.name}</span>
                          <span className="text-muted-foreground text-xs font-black">vs</span>
                          <span className="text-lg">{match.awayTeam.flag}</span>
                          <span className="text-sm font-semibold text-foreground">{match.awayTeam.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-xs font-bold bg-secondary px-2 py-0.5 rounded text-secondary-foreground uppercase">
                          G: {match.group || 'Elim.'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Input
                            type="text"
                            value={score.home}
                            onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                            placeholder="L"
                            className="w-10 h-8 text-center font-bold"
                          />
                          <span className="text-muted-foreground font-black">:</span>
                          <Input
                            type="text"
                            value={score.away}
                            onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                            placeholder="V"
                            className="w-10 h-8 text-center font-bold"
                          />
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleSaveResult(match.id)}
                          disabled={updatingId === match.id}
                          className="h-8 w-full bg-emerald-600 hover:bg-emerald-500 font-bold"
                        >
                          {updatingId === match.id ? 'Guardando...' : 'Guardar'}
                        </Button>
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
  );
}
