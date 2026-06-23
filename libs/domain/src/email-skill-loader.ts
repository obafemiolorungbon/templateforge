import { readFile } from 'node:fs/promises';
import path from 'node:path';

const skillFiles = [
  'SKILL.md',
  'copy-rules.md',
  'email-ui-rules.md',
  'email-types.md',
  'anti-patterns.md',
  'examples.md',
  'quality-rubric.md',
] as const;

let cachedSkillPrompt: Promise<string> | null = null;

export function loadEmailTemplateGeneratorSkill() {
  cachedSkillPrompt ??= readEmailTemplateGeneratorSkill().catch((error) => {
    cachedSkillPrompt = null;
    throw error;
  });
  return cachedSkillPrompt;
}

async function readEmailTemplateGeneratorSkill() {
  const skillDirectory = await resolveSkillDirectory();

  try {
    const sections = await Promise.all(
      skillFiles.map(async (fileName) => {
        const content = await readFile(path.join(skillDirectory, fileName), 'utf-8');
        return `# ${fileName}\n\n${content.trim()}`;
      }),
    );

    return [
      'TemplateForge runtime email generation skill pack.',
      'Follow these instructions as higher-priority domain rules for this generation.',
      ...sections,
    ].join('\n\n---\n\n');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`TemplateForge email generation skill pack could not be loaded: ${message}`);
  }
}

async function resolveSkillDirectory() {
  const relativePath = path.join('src', 'ai-skills', 'email-template-generator');
  const workspaceRelativePath = path.join(
    'libs',
    'domain',
    'src',
    'ai-skills',
    'email-template-generator',
  );
  const candidates = [
    path.join(process.cwd(), workspaceRelativePath),
    path.join(process.cwd(), relativePath),
    path.resolve(process.cwd(), '..', '..', workspaceRelativePath),
  ];

  for (const candidate of candidates) {
    try {
      await readFile(path.join(candidate, 'SKILL.md'), 'utf-8');
      return candidate;
    } catch {
      // Try the next common workspace location.
    }
  }

  return candidates[0];
}
