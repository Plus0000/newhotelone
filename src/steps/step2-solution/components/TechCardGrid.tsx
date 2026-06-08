import type { TechEntry } from '@/data/materials';
import { TechCard } from './TechCard';

interface Props {
  techs: TechEntry[];
  selectedTechs: string[];
  onToggle: (id: string) => void;
  onDetail: (id: string) => void;
}

export function TechCardGrid({ techs, selectedTechs, onToggle, onDetail }: Props) {
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
        />
      ))}
    </div>
  );
}