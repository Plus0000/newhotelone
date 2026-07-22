import type { TechEntry } from '@/data/materials';
import type { TechScoreResult } from '../techScoring';
import { TechCard } from './TechCard';

interface Props {
  techs: TechEntry[];
  selectedTechs: string[];
  /** 附属技术绑定：{ dependentTechId -> mainTechId[] } */
  dependentTechBindings?: Record<string, string[]>;
  onToggle: (id: string) => void;
  onDetail: (id: string) => void;
  techScores?: Map<string, TechScoreResult>;
}

export function TechCardGrid({ techs, selectedTechs, dependentTechBindings = {}, onToggle, onDetail, techScores }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 28,
      }}
    >
      {techs.map((tech) => {
        const boundMainIds = dependentTechBindings[tech.id] ?? [];
        const boundMainNames = boundMainIds
          .map((id) => techs.find((t) => t.id === id)?.name)
          .filter((n): n is string => !!n);
        return (
          <TechCard
            key={tech.id}
            tech={tech}
            selected={selectedTechs.includes(tech.id)}
            boundMainTechIds={boundMainIds}
            boundMainTechNames={boundMainNames}
            onToggle={onToggle}
            onDetail={onDetail}
            scoreResult={techScores?.get(tech.id)}
          />
        );
      })}
    </div>
  );
}