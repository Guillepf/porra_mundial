import { useEffect, useState } from 'react';
import worldService from './services/worldService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card';
import { Trophy } from 'lucide-react';

const GROUPS = 'ABCDEFGHIJKL'.split('');

export default function WorldStandingsPage() {
  const [group, setGroup] = useState<string>('A');
  const [standings, setStandings] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'group' | 'knockout'>('group');
  const [qualInfo, setQualInfo] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [group, mode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (mode === 'group') {
        if (group === 'all') {
          const info = await worldService.computeQualifiedTeams();
          setStandings(info.standingsByGroup || {});
        } else {
          const matches = await worldService.getGroupMatches(group);
          const table = worldService.computeGroupStandings(matches);
          setStandings(table);
        }
      } else {
        const info = await worldService.computeQualifiedTeams();
        setQualInfo(info);
      }
    } finally {
      setLoading(false);
    }
  };

  // Ensure we always have an array when rendering a single group's table
  const displayRows = group === 'all' ? null : (Array.isArray(standings) ? standings : (standings?.[group] || []));

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 text-primary p-3 rounded-xl">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Clasificación del Mundial (resultados reales)</h1>
            <p className="text-muted-foreground text-xs">Consulta la clasificación por grupos y el cuadro eliminatorio</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="bg-background border border-border rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          >
            <option value="group">Fase de Grupos</option>
            <option value="knockout">Eliminatorias</option>
          </select>

          {mode === 'group' && (
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="bg-background border border-border rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            >
              <option value="all">Todos los grupos</option>
              {GROUPS.map((g) => (
                <option key={g} value={g}>{`Grupo ${g}`}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {mode === 'group' ? (
        <Card>
          <CardHeader>
            <CardTitle>Grupo {group}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Cargando...</div>
            ) : (
              group === 'all' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {GROUPS.map((g) => {
                    const rows = standings?.[g] || [];
                    return (
                      <div key={g} className="bg-card border border-border rounded-lg p-3">
                        <h3 className="font-bold mb-2">Grupo {g}</h3>
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="text-muted-foreground text-xs uppercase font-black">
                              <th className="py-1 px-2">Pos</th>
                              <th className="py-1 px-2">Equipo</th>
                              <th className="py-1 px-2">Pts</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row: any, idx: number) => (
                              <tr key={row.code} className="border-b border-border">
                                <td className="py-1 px-2 font-bold">{idx + 1}</td>
                                <td className="py-1 px-2">{row.name || row.code}</td>
                                <td className="py-1 px-2 font-black">{row.points}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs uppercase font-black bg-muted/30">
                      <th className="py-2 px-3">Pos</th>
                      <th className="py-2 px-3">Equipo</th>
                      <th className="py-2 px-3">PJ</th>
                      <th className="py-2 px-3">G</th>
                      <th className="py-2 px-3">GC</th>
                      <th className="py-2 px-3">DG</th>
                      <th className="py-2 px-3">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(displayRows || []).map((row: any, idx: number) => (
                      <tr key={row.code} className="border-b border-border">
                        <td className="py-2 px-3 font-bold">{idx + 1}</td>
                        <td className="py-2 px-3">{row.name || row.code}</td>
                        <td className="py-2 px-3">{row.played}</td>
                        <td className="py-2 px-3">{row.goalsFor}</td>
                        <td className="py-2 px-3">{row.goalsAgainst}</td>
                        <td className="py-2 px-3">{row.goalDiff}</td>
                        <td className="py-2 px-3 font-black">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Eliminatorias</CardTitle>
            <CardDescription>Equipos clasificados y mejores terceros</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Cargando...</div>
            ) : (
              <div>
                <h3 className="font-bold">Equipos clasificados ({qualInfo?.allQualified?.length ?? 0})</h3>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {(qualInfo?.allQualified || []).map((code: string) => (
                    <div key={code} className="p-2 border rounded text-center">{code}</div>
                  ))}
                </div>

                <h4 className="mt-4 font-semibold">Mejores terceros</h4>
                <div className="flex gap-2 mt-2">
                  {(qualInfo?.bestThird || []).map((t: any) => (
                    <div key={t.code} className="p-2 border rounded">{t.code} ({t.points} pts)</div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">El diagrama de cuadro se muestra como una representación básica: los emparejamientos se generan a partir de la lista de clasificados.</p>

                {/* Simple bracket: pair in order */}
                <div className="mt-4">
                  <h5 className="font-bold">Dieciseisavos (32 equipos) — emparejamientos básicos</h5>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {(() => {
                      const teams = qualInfo?.allQualified || [];
                      const pairs = [];
                      for (let i = 0; i < teams.length; i += 2) {
                        pairs.push([teams[i], teams[i + 1]]);
                      }
                      return pairs.map((p: any[], i: number) => (
                        <div key={i} className="p-2 border rounded flex justify-between">
                          <span>{p[0] ?? '—'}</span>
                          <span>vs</span>
                          <span>{p[1] ?? '—'}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
