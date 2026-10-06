import { icons, type LucideProps } from 'lucide-react';

function toPascalCase(kebab: string): string {
  return kebab.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

interface IconProps extends LucideProps {
  name: string;
}

export function Icon({ name, ...props }: IconProps) {
  const key = toPascalCase(name) as keyof typeof icons;
  const Cmp = icons[key] ?? icons.Circle;
  return <Cmp {...props} />;
}
