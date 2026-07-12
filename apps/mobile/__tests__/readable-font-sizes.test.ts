import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SCAN_DIRS = ['app', 'components', 'src/components', 'styles'];
const MIN_READABLE_FONT_SIZE = 16;
const ALLOWED_SMALL_TEXT = [
  {
    file: path.join('components', 'app-chrome.tsx'),
    style: 'tabLabel',
    minSize: 9,
    reason: 'Bottom navbar labels are intentionally compact by user request.',
  },
  {
    file: path.join('components', 'game', 'GameSessionChrome.tsx'),
    style: 'eyebrow',
    minSize: 12,
    reason: 'Short, compact secondary label—not long card body text.',
  },
  {
    file: path.join('components', 'game', 'GameSessionChrome.tsx'),
    style: 'role',
    minSize: 12,
    reason: 'Short, compact secondary label—not long card body text.',
  },
  {
    file: path.join('components', 'game', 'GameRoundPanel.tsx'),
    style: 'kicker',
    minSize: 14,
    reason: 'Short, compact secondary label—not long card body text.',
  },
  {
    file: path.join('components', 'game', 'GameRoundPanel.tsx'),
    style: 'timerEstimate',
    minSize: 14,
    reason: 'Short, compact secondary label—not long card body text.',
  },
  {
    file: path.join('components', 'game', 'GameRoundPanel.tsx'),
    style: 'outcomeLabel',
    minSize: 14,
    reason: 'Short, compact secondary label—not long card body text.',
  },
  ...[
    {
      file: path.join('components', 'game', 'GameRoundPanel.tsx'),
      style: 'kicker',
      minSize: 14,
    },
    {
      file: path.join('components', 'game', 'GameRoundPanel.tsx'),
      style: 'timerEstimate',
      minSize: 14,
    },
    {
      file: path.join('components', 'game', 'GameRoundPanel.tsx'),
      style: 'outcomeLabel',
      minSize: 14,
    },
    {
      file: path.join('components', 'game', 'GameSessionChrome.tsx'),
      style: 'eyebrow',
      minSize: 12,
    },
    {
      file: path.join('components', 'game', 'GameSessionChrome.tsx'),
      style: 'role',
      minSize: 12,
    },
  ].map((entry) => ({
    ...entry,
    reason:
      'Compact game metadata is intentionally secondary to challenge copy.',
  })),
  ...[
    'filtersSummary',
    'filtersToggleActionText',
    'filterGroupLabel',
    'filterChipText',
  ].map((style) => ({
    file: path.join('app', '(matches)', 'MatchesScreen.tsx'),
    style,
    minSize: 15,
    reason: 'Matches filter controls use a slightly smaller readable size.',
  })),
];

type Finding = {
  file: string;
  line: number;
  value: number;
  styleName: string | null;
};

function listSourceFiles(dir: string): string[] {
  const fullDir = path.join(PROJECT_ROOT, dir);

  if (!fs.existsSync(fullDir)) {
    return [];
  }

  return fs.readdirSync(fullDir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return listSourceFiles(entryPath);
    }

    if (/\.(ts|tsx)$/.test(entry.name)) {
      return [entryPath];
    }

    return [];
  });
}

function nearestStyleName(lines: string[], lineIndex: number): string | null {
  for (
    let index = lineIndex;
    index >= Math.max(0, lineIndex - 12);
    index -= 1
  ) {
    const match = lines[index].match(/^\s*([A-Za-z0-9_]+):\s*\{/);

    if (match) {
      return match[1];
    }
  }

  return null;
}

function isAllowedSmallText(finding: Finding): boolean {
  return ALLOWED_SMALL_TEXT.some(
    (allowed) =>
      allowed.file === finding.file &&
      allowed.style === finding.styleName &&
      finding.value >= allowed.minSize
  );
}

describe('readable font sizes', () => {
  it('limits compact game metadata exceptions to approved styles', () => {
    const gameExceptions = ALLOWED_SMALL_TEXT.filter((allowed) =>
      allowed.file.includes(`${path.sep}game${path.sep}`)
    ).map((allowed) => `${allowed.file}:${allowed.style}:${allowed.minSize}`);

    expect(gameExceptions).toEqual([
      `${path.join('components', 'game', 'GameRoundPanel.tsx')}:kicker:14`,
      `${path.join(
        'components',
        'game',
        'GameRoundPanel.tsx'
      )}:timerEstimate:14`,
      `${path.join(
        'components',
        'game',
        'GameRoundPanel.tsx'
      )}:outcomeLabel:14`,
      `${path.join('components', 'game', 'GameSessionChrome.tsx')}:eyebrow:12`,
      `${path.join('components', 'game', 'GameSessionChrome.tsx')}:role:12`,
    ]);
  });

  it('does not use sub-16px hardcoded text styles outside the bottom navbar', () => {
    const findings = SCAN_DIRS.flatMap(listSourceFiles).flatMap((file) => {
      const source = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');
      const lines = source.split('\n');

      return lines.flatMap((line, lineIndex) => {
        const match = line.match(/fontSize:\s*(\d+)\b/);

        if (!match) {
          return [];
        }

        const value = Number(match[1]);

        if (value >= MIN_READABLE_FONT_SIZE) {
          return [];
        }

        return [
          {
            file,
            line: lineIndex + 1,
            value,
            styleName: nearestStyleName(lines, lineIndex),
          },
        ];
      });
    });
    const unexpected = findings.filter(
      (finding) => !isAllowedSmallText(finding)
    );

    expect(unexpected).toEqual([]);
  });
});
