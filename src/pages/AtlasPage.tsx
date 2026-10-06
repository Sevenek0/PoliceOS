import { useParams } from 'react-router-dom';
import { AtlasLayout } from '../components/atlas/AtlasLayout';
import { getAtlasById } from '../data/atlases';

export function AtlasPage() {
  const { id = '' } = useParams();
  const config = getAtlasById(id);
  if (!config) return <div className="p-6 text-ink-muted text-sm">Nie znaleziono atlasu.</div>;
  return <AtlasLayout key={config.id} config={config} />;
}
