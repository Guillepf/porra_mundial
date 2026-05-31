import { useState } from 'react';
import { Match, Prediction } from '@/types/global.types';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { formatTime, formatShortDate } from '@/shared/utils/dates';
import { isMatchLocked } from '@/features/predictions/utils/scoringSystem';
import { Lock, Save, Trophy, AlertTriangle } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  prediction: Prediction | null;
  onSavePrediction: (matchId: string, homeGoals: number, awayGoals: number) => Promise<void>;
  onEdit?: (matchId: string, homeGoals: string, awayGoals: string, edited: boolean) => void;
  isSubmitting?: boolean;
}

export function MatchCard({ match, prediction, onSavePrediction, onEdit, isSubmitting = false }: MatchCardProps) {
  const isLocked = isMatchLocked(match.scheduledAt);
  
  const [homeGoals, setHomeGoals] = useState<string>(
    prediction ? prediction.homeGoals.toString() : ''
  );
  const [awayGoals, setAwayGoals] = useState<string>(
    prediction ? prediction.awayGoals.toString() : ''
  );
  
  const [edited, setEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleHomeGoalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHomeGoals(e.target.value.replace(/\D/g, ''));
    setEdited(true);
    if (onEdit) onEdit(match.id, e.target.value.replace(/\D/g, ''), awayGoals, true);
  };

  const handleAwayGoalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAwayGoals(e.target.value.replace(/\D/g, ''));
    setEdited(true);
    if (onEdit) onEdit(match.id, homeGoals, e.target.value.replace(/\D/g, ''), true);
  };

  const handleSave = async () => {
    if (homeGoals === '' || awayGoals === '') {
      setError('Introduce ambos goles');
      return;
    }

    setError(null);
    try {
      await onSavePrediction(match.id, parseInt(homeGoals), parseInt(awayGoals));
      setEdited(false);
      if (onEdit) onEdit(match.id, homeGoals, awayGoals, false);
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    }
  };

  // Determinar color e información sobre los puntos obtenidos
  const hasResult = match.status === 'finished' && match.result;
  const hasPrediction = prediction !== null;
  const pointsObtained = prediction?.points;

  let badgeColor = 'bg-muted text-muted-foreground';
  let badgeText = 'Sin Pronóstico';

  if (hasPrediction) {
    if (pointsObtained === 3) {
      badgeColor = 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30';
      badgeText = '3 Pts — Resultado Exacto';
    } else if (pointsObtained === 1) {
      badgeColor = 'bg-blue-500/20 text-blue-500 border border-blue-500/30';
      badgeText = '1 Pt — Ganador/Signo';
    } else if (pointsObtained === 0) {
      badgeColor = 'bg-rose-500/20 text-rose-500 border border-rose-500/30';
      badgeText = '0 Pts — Fallado';
    } else {
      badgeText = 'Pronosticado';
      badgeColor = 'bg-primary/20 text-primary border border-primary/30';
    }
  }

  return (
    <Card className="overflow-hidden hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-4 md:p-6 space-y-4">
        {/* Cabecera del partido */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-2">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold px-2 py-0.5 rounded bg-secondary text-secondary-foreground uppercase">
              Grupo {match.group || 'Eliminatoria'}
            </span>
            <span>•</span>
            <span>{formatShortDate(match.scheduledAt)} a las {formatTime(match.scheduledAt)} hs</span>
          </div>
          {isLocked ? (
            <span className="flex items-center text-rose-500 font-semibold space-x-1">
              <Lock className="h-3 w-3" />
              <span>Bloqueado</span>
            </span>
          ) : (
            <span className="text-emerald-500 font-semibold">Abierto</span>
          )}
        </div>

        {/* Tablero de equipos y marcadores */}
        <div className="grid grid-cols-3 items-center text-center py-2 gap-2">
          {/* Local */}
          <div className="flex flex-col items-center space-y-2">
            <img
              src={`https://flagcdn.com/84x63/${match.homeTeam.flag.toLowerCase()}.png`}
              alt={match.homeTeam.name}
              className="h-16 w-24 object-cover rounded-md border border-border"
            />
            <span className="font-bold text-xs md:text-sm tracking-tight text-foreground max-w-[90px] md:max-w-none truncate">
              {match.homeTeam.name}
            </span>
          </div>

          {/* Marcadores reales o divisor */}
          <div className="flex flex-col items-center justify-center space-y-1">
            {hasResult ? (
              <div className="flex items-center justify-center space-x-2 bg-secondary/80 px-3 py-1.5 rounded-lg border border-border">
                <span className="text-lg md:text-xl font-extrabold text-foreground">{match.result?.homeGoals}</span>
                <span className="text-muted-foreground font-semibold text-xs">:</span>
                <span className="text-lg md:text-xl font-extrabold text-foreground">{match.result?.awayGoals}</span>
              </div>
            ) : (
              <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">VS</span>
            )}
            {hasResult && (
              <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Finalizado</span>
            )}
          </div>

          {/* Visitante */}
          <div className="flex flex-col items-center space-y-2">
            <img
              src={`https://flagcdn.com/84x63/${match.awayTeam.flag.toLowerCase()}.png`}
              alt={match.awayTeam.name}
              className="h-16 w-24 object-cover rounded-md border border-border"
            />
            <span className="font-bold text-xs md:text-sm tracking-tight text-foreground max-w-[90px] md:max-w-none truncate">
              {match.awayTeam.name}
            </span>
          </div>
        </div>

        {/* Entrada del pronóstico del usuario */}
        <div className="flex flex-col space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-1">
            <span>Tu Pronóstico:</span>
            {hasResult && pointsObtained !== null && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${badgeColor}`}>
                {badgeText}
              </span>
            )}
          </div>

          <div className="flex items-center justify-center space-x-3">
            <Input
              type="text"
              value={homeGoals}
              onChange={handleHomeGoalsChange}
              disabled={isLocked || isSubmitting}
              placeholder="-"
              className="w-12 h-10 text-center font-extrabold text-lg bg-secondary/30"
            />
            <span className="text-muted-foreground font-black">:</span>
            <Input
              type="text"
              value={awayGoals}
              onChange={handleAwayGoalsChange}
              disabled={isLocked || isSubmitting}
              placeholder="-"
              className="w-12 h-10 text-center font-extrabold text-lg bg-secondary/30"
            />

            {!isLocked && edited && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex items-center space-x-1.5 h-10 px-3 bg-emerald-600 hover:bg-emerald-500"
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">Guardar</span>
              </Button>
            )}
          </div>

          {error && (
            <p className="text-[10px] text-rose-500 flex items-center justify-center space-x-1 font-semibold mt-1">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
