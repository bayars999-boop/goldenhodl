type CountryFlagProps = { code?: string; size?: number };

export function CountryFlag({ code = 'MN', size = 24 }: CountryFlagProps) {
  const normalized = code.trim().toUpperCase();
  const flag = normalized.length === 2
    ? String.fromCodePoint(...[...normalized].map((letter) => 0x1F1A5 + letter.charCodeAt(0)))
    : '';
  if (!flag) return null;

  return (
    <span role="img" aria-label={`${normalized} national flag`} style={{ display: 'inline-block', fontSize: size, lineHeight: 1, verticalAlign: 'middle' }}>
      {flag}
    </span>
  );
}
