import { Shield } from 'lucide-react';

interface LogoMarkProps {
  size?: number;
  rounded?: string;
}

/** Fixed brand mark — always LSPD navy, independent of the user's selectable UI accent. */
export function LogoMark({ size = 36, rounded = 'rounded-lg' }: LogoMarkProps) {
  return (
    <div
      className={`${rounded} bg-brand flex items-center justify-center text-white shrink-0`}
      style={{ width: size, height: size }}
    >
      <Shield size={Math.round(size * 0.54)} strokeWidth={2.2} />
    </div>
  );
}

interface WordmarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<WordmarkProps['size']>, string> = {
  sm: 'text-[15px]',
  md: 'text-xl',
  lg: 'text-4xl sm:text-5xl',
};

/** "Police" regular + "OS" bold (Inter Tight, tight tracking). */
export function Wordmark({ size = 'sm', className = '' }: WordmarkProps) {
  return (
    <span className={`font-brand leading-tight tracking-[-0.028em] ${SIZE_CLASS[size]} ${className}`}>
      <span className="font-normal">Police</span>
      <span className="font-bold">OS</span>
    </span>
  );
}

interface LogoProps {
  size?: number;
  wordmarkSize?: WordmarkProps['size'];
  rounded?: string;
  className?: string;
}

export function Logo({ size = 36, wordmarkSize = 'sm', rounded, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} rounded={rounded} />
      <Wordmark size={wordmarkSize} />
    </div>
  );
}
