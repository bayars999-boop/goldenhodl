type CountryFlagProps = { code?: string; size?: number };

export function CountryFlag({ code = 'MN', size = 24 }: CountryFlagProps) {
  const normalized = code.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/${normalized}.svg`}
      alt={`${normalized.toUpperCase()} national flag`}
      width={size * 1.5}
      height={size}
      style={{ display: 'inline-block', width: size * 1.5, height: size, objectFit: 'fill', verticalAlign: 'middle' }}
    />
  );
}
