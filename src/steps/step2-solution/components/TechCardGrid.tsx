import type { TechEntry } from '@/data/materials';
import type { TechScoreResult } from '../techScoring';
import { TechCard } from './TechCard';

interface Props {
  techs: TechEntry[];
  selectedTechs: string[];
  onToggle: (id: string) => void;
  onDetail: (id: string) => void;
  techScores?: Map<string, TechScoreResult>;
}

export function TechCardGrid({ techs, selectedTechs, onToggle, onDetail, techScores }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: 20,
      }}
    >
      {techs.map((tech) => (
        <TechCard
          key={tech.id}
          tech={tech}
          selected={selectedTechs.includes(tech.id)}
          onToggle={onToggle}
          onDetail={onDetail}
          scoreResult={techScores?.get(tech.id)}
        />
      ))}
    </div>
  );
}