import { useParams } from 'react-router-dom';
import { CalculatorLayout } from '../components/calculator/CalculatorLayout';
import { CALCULATORS } from '../data/calculators';

export function CalculatorPage() {
  const { id = '' } = useParams();
  const config = CALCULATORS.find((c) => c.id === id);
  if (!config) return <div className="p-6 text-ink-muted text-sm">Nie znaleziono kalkulatora.</div>;
  return <CalculatorLayout key={config.id} config={config} />;
}
