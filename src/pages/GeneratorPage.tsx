import { useParams } from 'react-router-dom';
import { GeneratorFormLayout } from '../components/generator/GeneratorFormLayout';
import { GENERATORS } from '../data/generators';

export function GeneratorPage() {
  const { id = '' } = useParams();
  const config = GENERATORS.find((g) => g.id === id);
  if (!config) return <div className="p-6 text-ink-muted text-sm">Nie znaleziono generatora.</div>;
  return <GeneratorFormLayout key={config.id} config={config} />;
}
