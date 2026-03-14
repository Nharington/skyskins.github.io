import type { CSSProperties, ReactNode } from 'react';

const colorClassMap: Record<string, string> = {
  '0': 'color-black',
  '1': 'color-dark_blue',
  '2': 'color-dark_green',
  '3': 'color-dark_aqua',
  '4': 'color-dark_red',
  '5': 'color-dark_purple',
  '6': 'color-gold',
  '7': 'color-gray',
  '8': 'color-dark_gray',
  '9': 'color-blue',
  'a': 'color-green',
  'b': 'color-aqua',
  'c': 'color-red',
  'd': 'color-light_purple',
  'e': 'color-yellow',
  'f': 'color-white',
};

const rarityClassMap: Record<string, string> = {
  '5': 'rarity-epic', '6': 'rarity-legendary', '9': 'rarity-rare',
  'a': 'rarity-uncommon', 'b': 'rarity-divine', 'd': 'rarity-mythic',
  '4': 'rarity-ultimate', 'c': 'rarity-special',
};

const formatCodes: Record<string, CSSProperties> = {
  'l': { fontWeight: 'bold' },
  'm': { textDecoration: 'line-through' },
  'n': { textDecoration: 'underline' },
  'o': { fontStyle: 'italic' },
};

const colorHexMap: Record<string, string> = {
  '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
  '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
  '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#55FFFF',
  'c': '#FF5555', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF',
};

export function parseMinecraftLore(text: string): ReactNode[] {
  if (!text) return [];

  const emojiMap: Record<string, string> = {
    ':yt:': '▶️', ':health:': '❤', ':defense:': '❈', ':strength:': '❁',
    ':speed:': '✦', ':crit_chance:': '☣', ':crit_damage:': '☠',
    ':intelligence:': '✎', ':mining_speed:': '⸕', ':mining_fortune:': '☘',
    ':farming_fortune:': '☘', ':foraging_fortune:': '☘', ':pristine:': '✧',
    ':magic_find:': '✯', ':pet_luck:': '♣', ':sea_creature_chance:': 'α',
    ':true_defense:': '❂', ':ferocity:': '⫽', ':ability_damage:': '๑',
    ':health_regen:': '❣',
  };

  let processedText = text;
  Object.entries(emojiMap).forEach(([key, value]) => {
    processedText = processedText.replace(new RegExp(key, 'gi'), value);
  });

  const lines = processedText.split('\n');
  const lineElements: ReactNode[] = [];

  let currentCode = '7';
  let currentFormatting: CSSProperties = {};

  lines.forEach((line, lineIdx) => {
    const parts = line.split('§');
    const spans: ReactNode[] = [];

    if (parts[0]) {
      const cls = colorClassMap[currentCode];
      spans.push(
        <span
          key={`l${lineIdx}-p0`}
          className={cls}
          style={{ color: colorHexMap[currentCode], ...currentFormatting }}
        >
          {parts[0]}
        </span>
      );
    }

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part.length === 0) continue;

      const code = part[0].toLowerCase();
      const content = part.substring(1);

      if (colorClassMap[code]) {
        currentCode = code;
        currentFormatting = {};
      } else if (formatCodes[code]) {
        currentFormatting = { ...currentFormatting, ...formatCodes[code] };
      } else if (code === 'r') {
        currentCode = '7';
        currentFormatting = {};
      }

      if (content.length > 0) {
        const cls = `${colorClassMap[currentCode] || ''} ${rarityClassMap[currentCode] || ''}`.trim();
        spans.push(
          <span
            key={`l${lineIdx}-p${i}`}
            className={cls}
            style={{ color: colorHexMap[currentCode], ...currentFormatting }}
          >
            {content}
          </span>,
        );
      }
    }

    if (spans.length > 0) {
      lineElements.push(<div key={`line-${lineIdx}`} className="mctooltip-line">{spans}</div>);
    } else if (lineIdx < lines.length - 1) {
      lineElements.push(<div key={`line-${lineIdx}`} className="mctooltip-line">&nbsp;</div>);
    }
  });

  return lineElements;
}
