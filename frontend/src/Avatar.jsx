export function generateAvatar(seed, size = 48) {
  const s = seed || 0;
  const colors = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#c77dff','#ff9a76','#a8dadc','#e07a5f','#f4a261','#264653'];
  const bg = colors[s % colors.length];
  const fg = colors[(s * 7 + 3) % colors.length];
  const shape = s % 4;
  const letter = String.fromCharCode(65 + ((s * 13) % 26));

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ borderRadius: '50%', display: 'block', flexShrink: 0 }}>
      <rect width="100" height="100" rx="50" fill={bg} />
      {shape === 0 && <circle cx="50" cy="38" r="18" fill={fg} opacity="0.5" />}
      {shape === 1 && <polygon points="50,14 84,72 16,72" fill={fg} opacity="0.5" />}
      {shape === 2 && <rect x="26" y="26" width="48" height="48" rx="6" fill={fg} opacity="0.5" />}
      {shape === 3 && <polygon points="50,10 60,34 86,34 65,52 73,78 50,65 27,78 35,52 14,34 40,34" fill={fg} opacity="0.5" />}
      <text x="50" y="62" textAnchor="middle" fill="#fff" fontSize="30" fontWeight="700" fontFamily="sans-serif" opacity="0.9">{letter}</text>
    </svg>
  );
}
