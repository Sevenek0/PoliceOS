interface SignatureBlockProps {
  name: string;
  position: string;
  badge: string;
  unit: string;
  mode: 'auto' | 'manual';
  manualText?: string;
  color: string;
}

// Plain hex colors only — this renders inside the html2canvas export subtree.
export function SignatureBlock({ name, position, badge, unit, mode, manualText, color }: SignatureBlockProps) {
  return (
    <div className="flex items-end justify-between mt-12 pt-6">
      <div
        className="relative flex flex-col items-center justify-center text-center rounded-full"
        style={{
          width: 128,
          height: 128,
          border: `3px double ${color}`,
          color,
          transform: 'rotate(-8deg)',
          opacity: 0.8,
          padding: 10,
        }}
      >
        <div className="text-[8px] font-bold tracking-[0.18em] uppercase">Stan San Andreas</div>
        <div className="text-[10px] font-bold uppercase mt-1 leading-tight">Los Santos<br />Police Department</div>
        <div className="text-[8px] mt-1 leading-tight">{unit}</div>
        <div className="text-[7px] tracking-[0.2em] uppercase mt-1">Pieczęć urzędowa</div>
      </div>

      <div className="text-center min-w-[230px]">
        <div style={{ fontFamily: "'Segoe Script', 'Brush Script MT', cursive", fontSize: '26px', color: '#1a1a1a' }}>
          {mode === 'manual' && manualText ? manualText : name}
        </div>
        <div className="text-[10px] mt-1 pt-1.5" style={{ color: '#4b5563', borderTop: '1px solid #9ca3af' }}>
          <div className="font-bold" style={{ color: '#1f2937' }}>{name}</div>
          <div>{position}</div>
          <div>Nr odznaki: {badge}</div>
        </div>
      </div>
    </div>
  );
}
