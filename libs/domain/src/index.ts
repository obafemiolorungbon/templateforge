import { prisma } from '@templateforge/db';
import type { Prisma } from '@templateforge/db';
import {
  BrandComponentSchema,
  BrandWorkspaceSchema,
  DashboardSummarySchema,
  GenerateTemplateInputSchema,
  MarketplaceManifestSchema,
  MarketplaceTemplatePackageSchema,
  TemplateCodeSamplesSchema,
  TemplateDetailSchema,
  TemplateDraftSchema,
  TemplateListItemSchema,
  TemplatePreviewSchema,
  UpdateBrandProfileInputSchema,
  UpdateTemplateInputSchema,
  UpsertBrandComponentInputSchema,
} from '@templateforge/shared-types';
import type {
  BrandComponent,
  BrandWorkspace,
  DashboardSummary,
  DeploymentMode,
  EmailProvider,
  GenerateTemplateInput,
  GeneratedTemplateResult,
  MarketplaceManifest,
  MarketplaceTemplatePackage,
  ProviderReadiness,
  TemplateCodeSamples,
  TemplateDetail,
  TemplateDraft,
  TemplateListItem,
  TemplatePreview,
  UpdateBrandProfileInput,
  UpsertBrandComponentInput,
} from '@templateforge/shared-types';
import { loadEmailTemplateGeneratorSkill } from './email-skill-loader';

export const DEFAULT_PROJECT_ID = 'project_templateforge_local';
export const DEFAULT_BRAND_PROFILE_ID = 'brand_templateforge_default';
export const DEFAULT_PROJECT_SLUG = 'local-workspace';

type DbClient = typeof prisma;
type DomainOptions = {
  db?: DbClient;
  credentials?: RuntimeCredentials;
};
type MarketplaceInstallRecord = {
  templateId: string;
  marketplaceTemplateId: string;
  marketplaceVersion: string;
};
type MarketplaceInstallClient = {
  findMany(args: unknown): Promise<MarketplaceInstallRecord[]>;
  create(args: unknown): Promise<unknown>;
};
type ProviderConfigRecord = {
  providerId: string;
  displayName: string;
  enabled: boolean;
  isDefault: boolean;
  mode: DeploymentMode;
  configJson: unknown;
  secretEnvJson: unknown;
};
type ProviderConfigClient = {
  upsert(args: unknown): Promise<unknown>;
  findMany(args: unknown): Promise<ProviderConfigRecord[]>;
  findFirst(args: unknown): Promise<ProviderConfigRecord | null>;
};
type ProviderLinkRecord = {
  providerTemplateId: string;
};
type ProviderLinkClient = {
  findUnique(args: unknown): Promise<ProviderLinkRecord | null>;
  upsert(args: unknown): Promise<unknown>;
};
type TemplateSource = ReturnType<typeof composeTemplateSource>;
type ProviderDeployResult = {
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  providerTemplateId: string | null;
};
export type RuntimeCredentials = {
  openRouterApiKey?: string;
  sendByteApiKey?: string;
};
type ProviderCodeSampleInput = {
  template: TemplateDetail;
  source: TemplateSource;
  config: ProviderConfigRecord;
  providerTemplateId: string | null;
};
type EmailProviderAdapter = {
  id: string;
  displayName: string;
  capabilities: EmailProvider['capabilities'];
  getReadiness(
    config: ProviderConfigRecord,
    credentials?: RuntimeCredentials,
  ): ProviderReadiness;
  getCodeSamples?: (input: ProviderCodeSampleInput) => TemplateCodeSamples;
  preview(
    source: TemplateSource,
    config: ProviderConfigRecord,
    credentials?: RuntimeCredentials,
  ): Promise<TemplatePreview>;
  deploy(input: {
    template: TemplateDetail;
    source: TemplateSource;
    mode: DeploymentMode;
    existingProviderTemplateId: string | null;
    config: ProviderConfigRecord;
    credentials?: RuntimeCredentials;
  }): Promise<ProviderDeployResult>;
};

const DEFAULT_MODEL = 'openrouter/auto';
const SENDBYTE_PROVIDER_ID = 'sendbyte';
const SENDBYTE_DEFAULT_BASE_URL = 'https://api.sendbyte.africa';
const SENDBYTE_API_KEY_ENV = 'TEMPLATEFORGE_SENDBYTE_API_KEY';
const SENDBYTE_BASE_URL_ENV = 'TEMPLATEFORGE_SENDBYTE_BASE_URL';

function marketplaceInstallClient(db: DbClient): MarketplaceInstallClient {
  return (db as unknown as { templateMarketplaceInstall: MarketplaceInstallClient })
    .templateMarketplaceInstall;
}

function providerConfigClient(db: DbClient): ProviderConfigClient {
  return (db as unknown as { emailProviderConfig: ProviderConfigClient })
    .emailProviderConfig;
}

function providerLinkClient(db: DbClient): ProviderLinkClient {
  return (db as unknown as { templateProviderLink: ProviderLinkClient })
    .templateProviderLink;
}

function iso(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function resolveDomainOptions(
  dbOrOptions: DbClient | DomainOptions | undefined,
): { db: DbClient; credentials?: RuntimeCredentials } {
  const maybeOptions = dbOrOptions as DomainOptions | undefined;
  if (
    maybeOptions &&
    typeof dbOrOptions === 'object' &&
    ('db' in maybeOptions || 'credentials' in maybeOptions)
  ) {
    return {
      db: maybeOptions.db ?? prisma,
      credentials: maybeOptions.credentials,
    };
  }

  return { db: (dbOrOptions as DbClient | undefined) ?? prisma };
}

export async function ensureDefaultWorkspace(db: DbClient = prisma) {
  const project = await db.templateProject.upsert({
    where: { id: DEFAULT_PROJECT_ID },
    update: {},
    create: {
      id: DEFAULT_PROJECT_ID,
      slug: DEFAULT_PROJECT_SLUG,
      name: 'TemplateForge Local',
      description:
        'Self-hosted workspace for generated transactional email templates.',
    },
  });

  await db.brandProfile.upsert({
    where: { id: DEFAULT_BRAND_PROFILE_ID },
    update: {},
    create: {
      id: DEFAULT_BRAND_PROFILE_ID,
      projectId: project.id,
      name: 'Default brand',
      productName: 'TemplateForge',
      website: 'https://templateforge.local',
      primaryColor: '#a7c957',
      accentColor: '#d65f4a',
      tone: 'clear, practical, developer-friendly',
      footerText: 'You received this transactional email because of account activity.',
    },
  });

  await ensureDefaultBrandComponents(db);
  await ensureDefaultEmailProviders(db);

  return project;
}

async function ensureDefaultEmailProviders(db: DbClient = prisma) {
  await providerConfigClient(db).upsert({
    where: {
      projectId_providerId: {
        projectId: DEFAULT_PROJECT_ID,
        providerId: SENDBYTE_PROVIDER_ID,
      },
    },
    update: {},
    create: {
      projectId: DEFAULT_PROJECT_ID,
      providerId: SENDBYTE_PROVIDER_ID,
      displayName: 'SendByte',
      enabled: true,
      isDefault: true,
      mode: 'SANDBOX',
      configJson: {
        baseUrlEnv: SENDBYTE_BASE_URL_ENV,
        defaultBaseUrl: SENDBYTE_DEFAULT_BASE_URL,
      },
      secretEnvJson: {
        apiKey: SENDBYTE_API_KEY_ENV,
      },
    },
  });
}

async function ensureDefaultBrandComponents(db: DbClient = prisma) {
  const header = await db.brandComponent.findFirst({
    where: {
      brandProfileId: DEFAULT_BRAND_PROFILE_ID,
      type: 'HEADER',
      isDefault: true,
    },
  });

  if (!header) {
    await db.brandComponent.create({
      data: {
        brandProfileId: DEFAULT_BRAND_PROFILE_ID,
        type: 'HEADER',
        name: 'Default product header',
        isDefault: true,
        mjml: [
          '<mj-section padding="24px 32px 10px">',
          '  <mj-column>',
          '    <mj-text font-size="13px" letter-spacing="2px" color="{{brand_primary_color}}" font-weight="700">{{brand_product_name}}</mj-text>',
          '  </mj-column>',
          '</mj-section>',
        ].join('\n'),
        text: '{{brand_product_name}}',
      },
    });
  }

  const footer = await db.brandComponent.findFirst({
    where: {
      brandProfileId: DEFAULT_BRAND_PROFILE_ID,
      type: 'FOOTER',
      isDefault: true,
    },
  });

  if (!footer) {
    await db.brandComponent.create({
      data: {
        brandProfileId: DEFAULT_BRAND_PROFILE_ID,
        type: 'FOOTER',
        name: 'Default compliance footer',
        isDefault: true,
        mjml: [
          '<mj-section padding="10px 32px 28px">',
          '  <mj-column>',
          '    <mj-divider border-color="#E4E4E7" />',
          '    <mj-text font-size="12px" line-height="1.6" color="#71717A">{{brand_footer_text}}</mj-text>',
          '  </mj-column>',
          '</mj-section>',
        ].join('\n'),
        text: '{{brand_footer_text}}',
      },
    });
  }
}

export function isDemoMode() {
  return process.env.DEMO_MODE?.trim().toLowerCase() === 'true';
}

export async function getEnvironmentReadiness(
  dbOrOptions: DbClient | DomainOptions = prisma,
) {
  const { db, credentials } = resolveDomainOptions(dbOrOptions);
  const openRouterModel = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;
  const warnings: string[] = [];
  const demoMode = isDemoMode();
  const openRouterApiKey = resolveOpenRouterApiKey(credentials);
  const providers = await listEmailProviders({ db, credentials });

  if (!openRouterApiKey && demoMode) {
    warnings.push('Add an OpenRouter API key to generate templates.');
  } else if (!openRouterApiKey) {
    warnings.push('OPENROUTER_API_KEY is missing. AI generation is disabled.');
  }

  warnings.push(...providers.flatMap((provider) => provider.warnings));

  return {
    demoMode,
    openRouterConfigured: Boolean(openRouterApiKey),
    openRouterModel,
    providers,
    warnings,
  } as const;
}

export async function listEmailProviders(
  dbOrOptions: DbClient | DomainOptions = prisma,
): Promise<ProviderReadiness[]> {
  const { db, credentials } = resolveDomainOptions(dbOrOptions);
  await ensureDefaultWorkspace(db);
  const configs = await providerConfigClient(db).findMany({
    where: { projectId: DEFAULT_PROJECT_ID },
    orderBy: [{ isDefault: 'desc' }, { displayName: 'asc' }],
  });

  return configs
    .map((config) =>
      getProviderAdapter(config.providerId)?.getReadiness(config, credentials),
    )
    .filter((provider): provider is ProviderReadiness => Boolean(provider));
}

export async function getBrandWorkspace(
  db: DbClient = prisma,
): Promise<BrandWorkspace> {
  await ensureDefaultWorkspace(db);
  const profile = await db.brandProfile.findFirst({
    where: { id: DEFAULT_BRAND_PROFILE_ID, projectId: DEFAULT_PROJECT_ID },
    include: { components: { orderBy: [{ type: 'asc' }, { updatedAt: 'desc' }] } },
  });

  if (!profile) {
    throw new Error('Brand profile could not be loaded.');
  }

  return BrandWorkspaceSchema.parse({
    profile,
    components: profile.components.map(mapBrandComponent),
  });
}

export async function updateBrandProfile(
  id: string,
  body: unknown,
  db: DbClient = prisma,
) {
  await ensureDefaultWorkspace(db);
  const input: UpdateBrandProfileInput =
    UpdateBrandProfileInputSchema.parse(body);
  const updated = await db.brandProfile.update({
    where: { id },
    data: {
      ...input,
      website: input.website === '' ? null : input.website,
      logoUrl: input.logoUrl === '' ? null : input.logoUrl,
    },
  });

  await logAction(db, {
    action: 'brand.updated',
    summary: `Updated brand profile ${updated.name}.`,
    metadata: { brandProfileId: id },
  });

  return BrandWorkspaceSchema.shape.profile.parse(updated);
}

export async function listBrandComponents(
  brandProfileId: string,
  db: DbClient = prisma,
): Promise<BrandComponent[]> {
  await ensureDefaultWorkspace(db);
  const components = await db.brandComponent.findMany({
    where: { brandProfileId },
    orderBy: [{ type: 'asc' }, { updatedAt: 'desc' }],
  });

  return BrandComponentSchema.array().parse(components.map(mapBrandComponent));
}

export async function createBrandComponent(
  brandProfileId: string,
  body: unknown,
  db: DbClient = prisma,
): Promise<BrandComponent> {
  await ensureDefaultWorkspace(db);
  const input: UpsertBrandComponentInput =
    UpsertBrandComponentInputSchema.parse(body);
  const created = await db.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.brandComponent.updateMany({
        where: { brandProfileId, type: input.type },
        data: { isDefault: false },
      });
    }

    return tx.brandComponent.create({
      data: {
        brandProfileId,
        name: input.name,
        type: input.type,
        mjml: input.mjml,
        text: input.text,
        isDefault: input.isDefault ?? false,
      },
    });
  });

  await logAction(db, {
    action: 'brand.component_created',
    summary: `Created ${created.type.toLowerCase()} component ${created.name}.`,
    metadata: { brandProfileId, componentId: created.id },
  });

  return BrandComponentSchema.parse(mapBrandComponent(created));
}

export async function updateBrandComponent(
  id: string,
  body: unknown,
  db: DbClient = prisma,
): Promise<BrandComponent> {
  await ensureDefaultWorkspace(db);
  const input: UpsertBrandComponentInput =
    UpsertBrandComponentInputSchema.parse(body);
  const updated = await db.$transaction(async (tx) => {
    const existing = await tx.brandComponent.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Brand component not found.');
    }

    if (input.isDefault) {
      await tx.brandComponent.updateMany({
        where: { brandProfileId: existing.brandProfileId, type: input.type },
        data: { isDefault: false },
      });
    }

    return tx.brandComponent.update({
      where: { id },
      data: {
        name: input.name,
        type: input.type,
        mjml: input.mjml,
        text: input.text,
        isDefault: input.isDefault ?? existing.isDefault,
      },
    });
  });

  await logAction(db, {
    action: 'brand.component_updated',
    summary: `Updated ${updated.type.toLowerCase()} component ${updated.name}.`,
    metadata: { componentId: id },
  });

  return BrandComponentSchema.parse(mapBrandComponent(updated));
}

export async function setDefaultBrandComponent(
  id: string,
  db: DbClient = prisma,
): Promise<BrandComponent> {
  await ensureDefaultWorkspace(db);
  const updated = await db.$transaction(async (tx) => {
    const existing = await tx.brandComponent.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Brand component not found.');
    }

    await tx.brandComponent.updateMany({
      where: { brandProfileId: existing.brandProfileId, type: existing.type },
      data: { isDefault: false },
    });

    return tx.brandComponent.update({
      where: { id },
      data: { isDefault: true },
    });
  });

  await logAction(db, {
    action: 'brand.component_defaulted',
    summary: `Set ${updated.name} as the default ${updated.type.toLowerCase()}.`,
    metadata: { componentId: id },
  });

  return BrandComponentSchema.parse(mapBrandComponent(updated));
}

export async function getDashboardSummary(
  dbOrOptions: DbClient | DomainOptions = prisma,
): Promise<DashboardSummary> {
  const { db, credentials } = resolveDomainOptions(dbOrOptions);
  await ensureDefaultWorkspace(db);

  const [templates, readyCount, deployedCount, recentGenerations, deployments] =
    await Promise.all([
      db.emailTemplate.findMany({
        where: { projectId: DEFAULT_PROJECT_ID },
        include: { deployments: { orderBy: { createdAt: 'desc' }, take: 1 } },
        orderBy: { updatedAt: 'desc' },
        take: 6,
      }),
      db.emailTemplate.count({
        where: { projectId: DEFAULT_PROJECT_ID, status: 'READY' },
      }),
      db.emailTemplate.count({
        where: { projectId: DEFAULT_PROJECT_ID, status: 'DEPLOYED' },
      }),
      db.aiGenerationRun.findMany({
        where: { projectId: DEFAULT_PROJECT_ID },
        include: { template: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      db.templateDeployment.findMany({
        where: { template: { projectId: DEFAULT_PROJECT_ID } },
        include: { template: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

  return DashboardSummarySchema.parse({
    templateCount: await db.emailTemplate.count({
      where: { projectId: DEFAULT_PROJECT_ID },
    }),
    readyCount,
    deployedCount,
    recentTemplates: templates.map(mapTemplateListItem),
    recentGenerations: recentGenerations.map((run) => ({
      id: run.id,
      status: run.status,
      model: run.model,
      templateName: run.template?.name ?? null,
      createdAt: run.createdAt.toISOString(),
    })),
    recentDeployments: deployments.map((deployment) => ({
      ...mapDeployment(deployment),
      templateName: deployment.template.name,
    })),
    env: await getEnvironmentReadiness({ db, credentials }),
  });
}

export async function listTemplates(
  db: DbClient = prisma,
): Promise<TemplateListItem[]> {
  await ensureDefaultWorkspace(db);
  const templates = await db.emailTemplate.findMany({
    where: { projectId: DEFAULT_PROJECT_ID },
    include: { deployments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    orderBy: { updatedAt: 'desc' },
  });

  return TemplateListItemSchema.array().parse(templates.map(mapTemplateListItem));
}

export function getMarketplaceManifestUrl() {
  const url = process.env.TEMPLATEFORGE_MARKETPLACE_MANIFEST_URL?.trim();

  if (!url) {
    throw new Error('TEMPLATEFORGE_MARKETPLACE_MANIFEST_URL is not configured.');
  }

  return url;
}

export async function listMarketplaceTemplates(
  db: DbClient = prisma,
): Promise<MarketplaceManifest> {
  await ensureDefaultWorkspace(db);
  const manifestUrl = getMarketplaceManifestUrl();
  const manifest = await fetchMarketplaceManifest();
  const ids = manifest.templates.map((template) => template.id);
  const marketplaceInstalls = marketplaceInstallClient(db);
  const installs = ids.length
    ? await marketplaceInstalls.findMany({
        where: { marketplaceTemplateId: { in: ids } },
        include: { template: true },
      })
    : [];
  const installByMarketplaceId = new Map(
    installs.map((install) => [install.marketplaceTemplateId, install]),
  );

  return MarketplaceManifestSchema.parse({
    ...manifest,
    templates: manifest.templates.map((template) => {
      const install = installByMarketplaceId.get(template.id);

      return {
        ...template,
        preview: template.preview
          ? resolveMarketplaceUrl(template.preview, manifestUrl)
          : undefined,
        installedTemplateId: install?.templateId ?? null,
        installedVersion: install?.marketplaceVersion ?? null,
      };
    }),
  });
}

export async function getMarketplaceTemplate(
  id: string,
): Promise<MarketplaceTemplatePackage> {
  const { template } = await fetchMarketplaceTemplateById(id);
  return template;
}

export async function importMarketplaceTemplate(
  id: string,
  db: DbClient = prisma,
): Promise<TemplateDetail> {
  await ensureDefaultWorkspace(db);
  const { template, sourceUrl } = await fetchMarketplaceTemplateById(id);
  const cleanPackage = validateMarketplaceTemplatePackage(template);
  const created = await createTemplateFromDraft(
    cleanPackage,
    {},
    `Imported from marketplace ${cleanPackage.id}@${cleanPackage.version}`,
    db,
  );

  await marketplaceInstallClient(db).create({
    data: {
      templateId: created.id,
      marketplaceTemplateId: cleanPackage.id,
      marketplaceVersion: cleanPackage.version,
      sourceUrl,
    },
  });

  await logAction(db, {
    templateId: created.id,
    action: 'marketplace.template_imported',
    summary: `Imported ${created.name} from marketplace.`,
    metadata: {
      marketplaceTemplateId: cleanPackage.id,
      marketplaceVersion: cleanPackage.version,
      sourceUrl,
    },
  });

  const detail = await getTemplate(created.id, db);
  if (!detail) {
    throw new Error('Imported template could not be loaded.');
  }
  return detail;
}

export async function getTemplate(
  id: string,
  db: DbClient = prisma,
): Promise<TemplateDetail | null> {
  await ensureDefaultWorkspace(db);
  const template = await db.emailTemplate.findFirst({
    where: { id, projectId: DEFAULT_PROJECT_ID },
    include: templateDetailInclude(),
  });

  return template ? mapTemplateDetail(template) : null;
}

export async function generateTemplate(
  body: unknown,
  dbOrOptions: DbClient | DomainOptions = prisma,
): Promise<GeneratedTemplateResult> {
  const { db, credentials } = resolveDomainOptions(dbOrOptions);
  await ensureDefaultWorkspace(db);
  const input = GenerateTemplateInputSchema.parse(body);
  const model = (await getEnvironmentReadiness({ db, credentials })).openRouterModel;
  const run = await db.aiGenerationRun.create({
    data: {
      projectId: DEFAULT_PROJECT_ID,
      status: 'RUNNING',
      promptInputJson: input as Prisma.InputJsonValue,
      model,
      warnings: [],
    },
  });

  try {
    const openRouterApiKey = resolveOpenRouterApiKey(credentials);
    if (!openRouterApiKey) {
      throw new Error(
        isDemoMode()
          ? 'Add an OpenRouter API key to generate templates.'
          : 'OPENROUTER_API_KEY is missing.',
      );
    }

    const brandContext = await getBrandWorkspace(db);
    const content = await requestOpenRouterTemplateContent(
      input,
      model,
      brandContext,
      openRouterApiKey,
    );
    const cleanDraft = await parseAndValidateOpenRouterDraft({
      content,
      input,
      model,
      brandContext,
      openRouterApiKey,
    });
    const created = await createTemplateFromDraft(
      cleanDraft,
      input,
      `Initial AI generation ${run.id}`,
      db,
    );

    await db.aiGenerationRun.update({
      where: { id: run.id },
      data: {
        status: 'SUCCEEDED',
        templateId: created.id,
        outputJson: cleanDraft as Prisma.InputJsonValue,
        warnings: cleanDraft.warnings,
      },
    });

    await logAction(db, {
      templateId: created.id,
      action: 'template.generated',
      summary: `Generated ${created.name} from ${model}.`,
      metadata: { generationRunId: run.id, useCase: input.useCase },
    });

    return {
      template: created,
      generationRunId: run.id,
      warnings: cleanDraft.warnings,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed.';
    await db.aiGenerationRun.update({
      where: { id: run.id },
      data: { status: 'FAILED', error: message },
    });
    await logAction(db, {
      action: 'template.generation_failed',
      summary: message,
      metadata: { generationRunId: run.id, input },
    });
    throw new Error(message);
  }
}

export async function updateTemplate(
  id: string,
  body: unknown,
  db: DbClient = prisma,
): Promise<TemplateDetail> {
  await ensureDefaultWorkspace(db);
  const input = UpdateTemplateInputSchema.parse(body);
  const existing = await getTemplate(id, db);

  if (!existing) {
    throw new Error('Template not found.');
  }

  const nextDraft = validateTemplateDraft({
    name: input.name ?? existing.name,
    slug: existing.slug,
    category: input.category ?? existing.category,
    subject: input.subject ?? existing.subject,
    mjml: input.mjml ?? existing.mjml,
    text: input.text ?? existing.text,
    variables: input.variables ?? existing.variables,
    sampleVariables: input.sampleVariables ?? existing.sampleVariables,
    tags: input.tags ?? existing.tags,
    warnings: [],
  });

  const nextVersion = existing.versions[0]?.version
    ? existing.versions[0].version + 1
    : 2;

  await db.$transaction(async (tx) => {
    await tx.emailTemplate.update({
      where: { id },
      data: {
        name: nextDraft.name,
        category: nextDraft.category,
        status: input.status ?? existing.status,
        subject: nextDraft.subject,
        mjml: nextDraft.mjml,
        text: nextDraft.text,
        variables: nextDraft.variables as Prisma.InputJsonValue,
        sampleVariables: nextDraft.sampleVariables as Prisma.InputJsonValue,
        tags: nextDraft.tags,
        headerComponentId:
          input.headerComponentId === undefined
            ? existing.headerComponent?.id
            : input.headerComponentId,
        footerComponentId:
          input.footerComponentId === undefined
            ? existing.footerComponent?.id
            : input.footerComponentId,
      },
    });
    await tx.templateVersion.create({
      data: {
        templateId: id,
        headerComponentId:
          input.headerComponentId === undefined
            ? existing.headerComponent?.id
            : input.headerComponentId,
        footerComponentId:
          input.footerComponentId === undefined
            ? existing.footerComponent?.id
            : input.footerComponentId,
        version: nextVersion,
        subject: nextDraft.subject,
        mjml: nextDraft.mjml,
        text: nextDraft.text,
        variables: nextDraft.variables as Prisma.InputJsonValue,
        sampleVariables: nextDraft.sampleVariables as Prisma.InputJsonValue,
        tags: nextDraft.tags,
        changeNote: input.changeNote ?? 'Manual update',
      },
    });
  });

  await logAction(db, {
    templateId: id,
    action: 'template.updated',
    summary: `Updated ${nextDraft.name}.`,
    metadata: { version: nextVersion },
  });

  const detail = await getTemplate(id, db);
  if (!detail) {
    throw new Error('Updated template could not be loaded.');
  }
  return detail;
}

export async function previewTemplate(
  id: string,
  providerId?: string,
  dbOrOptions: DbClient | DomainOptions = prisma,
): Promise<TemplatePreview> {
  const { db, credentials } = resolveDomainOptions(dbOrOptions);
  const template = await getTemplate(id, db);
  if (!template) {
    throw new Error('Template not found.');
  }

  const source = composeTemplateSource(template);
  const provider = providerId ? await getProviderConfig(providerId, db) : null;
  const adapter = provider ? getProviderAdapter(provider.providerId) : null;
  const readiness =
    provider && adapter ? adapter.getReadiness(provider, credentials) : null;

  if (!adapter || !provider || !readiness?.configured) {
    if (isDemoMode() && provider && adapter) {
      throw new Error(
        readiness?.warnings[0] ??
          'Add the provider API key to preview or deploy this template.',
      );
    }

    const warning =
      readiness?.warnings[0] ??
      'No configured preview provider is available. Showing local fallback render.';

    return TemplatePreviewSchema.parse({
      subject: renderHandlebarsLite(source.subject, source.variables),
      html: renderMjmlFallback(source.mjml, source.variables),
      text: renderHandlebarsLite(source.text, source.variables),
      warnings: [warning],
    });
  }

  if (!adapter.capabilities.includes('REMOTE_PREVIEW')) {
    const source = composeTemplateSource(template);
    return TemplatePreviewSchema.parse({
      subject: renderHandlebarsLite(source.subject, source.variables),
      html: renderMjmlFallback(source.mjml, source.variables),
      text: renderHandlebarsLite(source.text, source.variables),
      warnings: [
        `${adapter.displayName} does not provide remote preview. Showing local fallback render.`,
      ],
    });
  }

  return adapter.preview(source, provider, credentials);
}

export async function getTemplateCodeSamples(
  id: string,
  providerId: string,
  db: DbClient = prisma,
): Promise<TemplateCodeSamples> {
  const template = await getTemplate(id, db);
  if (!template) {
    throw new Error('Template not found.');
  }

  const provider = await getProviderConfig(providerId, db);
  if (!provider || !provider.enabled) {
    throw new Error('Email provider is not configured.');
  }

  const adapter = getProviderAdapter(provider.providerId);
  if (!adapter) {
    throw new Error(`Email provider ${provider.providerId} is not supported.`);
  }

  if (!adapter.capabilities.includes('CODE_SAMPLES') || !adapter.getCodeSamples) {
    throw new Error(`${adapter.displayName} does not provide code samples.`);
  }

  const source = composeTemplateSource(template);
  const existingLink = await providerLinkClient(db).findUnique({
    where: {
      templateId_provider: {
        templateId: id,
        provider: provider.providerId,
      },
    },
  });

  return adapter.getCodeSamples({
    template,
    source,
    config: provider,
    providerTemplateId: existingLink?.providerTemplateId ?? null,
  });
}

export async function deployTemplate(
  id: string,
  providerId: string,
  mode: DeploymentMode = 'SANDBOX',
  dbOrOptions: DbClient | DomainOptions = prisma,
) {
  const { db, credentials } = resolveDomainOptions(dbOrOptions);
  const template = await getTemplate(id, db);
  if (!template) {
    throw new Error('Template not found.');
  }

  const provider = await getProviderConfig(providerId, db);
  if (!provider || !provider.enabled) {
    throw new Error('Email provider is not configured.');
  }

  const adapter = getProviderAdapter(provider.providerId);
  if (!adapter) {
    throw new Error(`Email provider ${provider.providerId} is not supported.`);
  }

  const readiness = adapter.getReadiness(provider, credentials);
  if (!readiness.configured) {
    throw new Error(readiness.warnings[0] ?? 'Email provider is not ready.');
  }

  if (!adapter.capabilities.includes('TEMPLATE_DEPLOYMENT')) {
    throw new Error(`${adapter.displayName} does not support template deployment.`);
  }

  const source = composeTemplateSource(template);
  const existingLink = await providerLinkClient(db).findUnique({
    where: {
      templateId_provider: {
        templateId: id,
        provider: provider.providerId,
      },
    },
  });
  const deployment = await db.templateDeployment.create({
    data: {
      templateId: id,
      provider: provider.providerId as any,
      mode,
      status: 'PENDING',
      providerTemplateId: existingLink?.providerTemplateId ?? null,
      requestJson: source as Prisma.InputJsonValue,
    },
  });

  try {
    const result = await adapter.deploy({
      template,
      source,
      mode,
      existingProviderTemplateId: existingLink?.providerTemplateId ?? null,
      config: provider,
      credentials,
    });

    const updated = await db.templateDeployment.update({
      where: { id: deployment.id },
      data: {
        status: 'SUCCEEDED',
        providerTemplateId: result.providerTemplateId,
        requestJson: result.request as Prisma.InputJsonValue,
        responseJson: result.response as Prisma.InputJsonValue,
      },
    });

    if (result.providerTemplateId) {
      await providerLinkClient(db).upsert({
        where: {
          templateId_provider: {
            templateId: id,
            provider: provider.providerId,
          },
        },
        update: { providerTemplateId: result.providerTemplateId },
        create: {
          templateId: id,
          provider: provider.providerId,
          providerTemplateId: result.providerTemplateId,
        },
      });
    }

    await db.emailTemplate.update({
      where: { id },
      data: { status: 'DEPLOYED' },
    });
    await logAction(db, {
      templateId: id,
      action: 'template.deployed_provider',
      summary: `Deployed ${template.name} to ${adapter.displayName} ${mode.toLowerCase()}.`,
      metadata: {
        deploymentId: deployment.id,
        provider: provider.providerId,
        providerTemplateId: result.providerTemplateId,
        warnings: readiness.warnings,
      },
    });

    return { ...mapDeployment(updated), warnings: readiness.warnings };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Template deployment failed.';
    const failed = await db.templateDeployment.update({
      where: { id: deployment.id },
      data: { status: 'FAILED', error: message },
    });
    await logAction(db, {
      templateId: id,
      action: 'template.deploy_failed',
      summary: message,
      metadata: { deploymentId: deployment.id, provider: provider.providerId },
    });
    return { ...mapDeployment(failed), warnings: readiness.warnings };
  }
}

function templateDetailInclude() {
  return {
    brandProfile: true,
    headerComponent: true,
    footerComponent: true,
    versions: { orderBy: { version: 'desc' as const } },
    deployments: { orderBy: { createdAt: 'desc' as const } },
  };
}

function mapBrandComponent(component: any): BrandComponent {
  return BrandComponentSchema.parse({
    id: component.id,
    brandProfileId: component.brandProfileId,
    name: component.name,
    type: component.type,
    mjml: component.mjml,
    text: component.text,
    isDefault: component.isDefault,
    updatedAt: iso(component.updatedAt) ?? new Date().toISOString(),
  });
}

function mapTemplateListItem(template: any): TemplateListItem {
  return TemplateListItemSchema.parse({
    id: template.id,
    slug: template.slug,
    name: template.name,
    category: template.category,
    status: template.status,
    subject: template.subject,
    tags: template.tags,
    updatedAt: iso(template.updatedAt) ?? new Date().toISOString(),
    latestDeploymentStatus: template.deployments?.[0]?.status ?? null,
    latestDeploymentProvider: template.deployments?.[0]?.provider ?? null,
  });
}

function mapTemplateDetail(template: any): TemplateDetail {
  return TemplateDetailSchema.parse({
    ...mapTemplateListItem(template),
    mjml: template.mjml,
    text: template.text,
    variables: template.variables,
    sampleVariables: template.sampleVariables,
    brandProfile: template.brandProfile,
    headerComponent: template.headerComponent
      ? mapBrandComponent(template.headerComponent)
      : null,
    footerComponent: template.footerComponent
      ? mapBrandComponent(template.footerComponent)
      : null,
    versions: template.versions.map((version: any) => ({
      id: version.id,
      version: version.version,
      headerComponentId: version.headerComponentId ?? null,
      footerComponentId: version.footerComponentId ?? null,
      changeNote: version.changeNote,
      createdAt: version.createdAt.toISOString(),
    })),
    deployments: template.deployments.map(mapDeployment),
  });
}

function mapDeployment(deployment: any) {
  return {
    id: deployment.id,
    provider: deployment.provider,
    status: deployment.status,
    mode: deployment.mode,
    providerTemplateId: deployment.providerTemplateId,
    error: deployment.error,
    warnings: [],
    createdAt: deployment.createdAt.toISOString(),
  };
}

async function createTemplateFromDraft(
  draft: TemplateDraft,
  input: Pick<
    GenerateTemplateInput,
    'brandProfileId' | 'headerComponentId' | 'footerComponentId'
  >,
  changeNote: string,
  db: DbClient,
) {
  const created = await db.$transaction(async (tx) => {
    const brandProfile = input.brandProfileId
      ? await tx.brandProfile.findFirst({
          where: { id: input.brandProfileId, projectId: DEFAULT_PROJECT_ID },
        })
      : await tx.brandProfile.findFirst({
          where: { id: DEFAULT_BRAND_PROFILE_ID },
        });
    const headerComponent = input.headerComponentId
      ? await tx.brandComponent.findFirst({
          where: {
            id: input.headerComponentId,
            brandProfileId: brandProfile?.id,
            type: 'HEADER',
          },
        })
      : await tx.brandComponent.findFirst({
          where: {
            brandProfileId: brandProfile?.id,
            type: 'HEADER',
            isDefault: true,
          },
        });
    const footerComponent = input.footerComponentId
      ? await tx.brandComponent.findFirst({
          where: {
            id: input.footerComponentId,
            brandProfileId: brandProfile?.id,
            type: 'FOOTER',
          },
        })
      : await tx.brandComponent.findFirst({
          where: {
            brandProfileId: brandProfile?.id,
            type: 'FOOTER',
            isDefault: true,
          },
        });
    const template = await tx.emailTemplate.create({
      data: {
        projectId: DEFAULT_PROJECT_ID,
        brandProfileId: brandProfile?.id,
        headerComponentId: headerComponent?.id,
        footerComponentId: footerComponent?.id,
        slug: await uniqueSlug(draft.slug, tx),
        name: draft.name,
        category: draft.category,
        status: 'READY',
        subject: draft.subject,
        mjml: draft.mjml,
        text: draft.text,
        variables: draft.variables as Prisma.InputJsonValue,
        sampleVariables: draft.sampleVariables as Prisma.InputJsonValue,
        tags: draft.tags,
      },
    });

    await tx.templateVersion.create({
      data: {
        templateId: template.id,
        headerComponentId: template.headerComponentId,
        footerComponentId: template.footerComponentId,
        version: 1,
        subject: draft.subject,
        mjml: draft.mjml,
        text: draft.text,
        variables: draft.variables as Prisma.InputJsonValue,
        sampleVariables: draft.sampleVariables as Prisma.InputJsonValue,
        tags: draft.tags,
        changeNote,
      },
    });

    return template;
  });

  const detail = await getTemplate(created.id, db);
  if (!detail) {
    throw new Error('Generated template could not be loaded.');
  }
  return detail;
}

async function uniqueSlug(slug: string, db: Pick<DbClient, 'emailTemplate'>) {
  let candidate = slug;
  let suffix = 2;

  while (await db.emailTemplate.findUnique({ where: { slug: candidate } })) {
    candidate = `${slug}-${suffix++}`;
  }

  return candidate;
}

async function getProviderConfig(providerId: string, db: DbClient) {
  await ensureDefaultWorkspace(db);
  return providerConfigClient(db).findFirst({
    where: {
      projectId: DEFAULT_PROJECT_ID,
      providerId,
      enabled: true,
    },
  });
}

function getProviderAdapter(providerId: string): EmailProviderAdapter | null {
  return providerAdapters[providerId] ?? null;
}

const providerAdapters: Record<string, EmailProviderAdapter> = {
  [SENDBYTE_PROVIDER_ID]: {
    id: SENDBYTE_PROVIDER_ID,
    displayName: 'SendByte',
    capabilities: ['REMOTE_PREVIEW', 'TEMPLATE_DEPLOYMENT', 'CODE_SAMPLES'],
    getReadiness(config, credentials) {
      const sendByteConfig = getSendByteConfig(config);
      const apiKey = resolveSendByteApiKey(config, credentials);
      const warnings: string[] = [];
      const sandboxKeyMismatch =
        Boolean(apiKey) && config.mode === 'SANDBOX' && !apiKey.startsWith('sk_test_');

      if (!apiKey && isDemoMode()) {
        warnings.push('Add a SendByte sandbox API key to preview or deploy templates.');
      } else if (!apiKey) {
        warnings.push(`${sendByteConfig.apiKeyEnv} is missing. SendByte deploy is disabled.`);
      } else if (sandboxKeyMismatch) {
        warnings.push(
          isDemoMode()
            ? 'Use a SendByte sandbox key that starts with sk_test_.'
            : `${sendByteConfig.apiKeyEnv} is not a sandbox sk_test_ key.`,
        );
      }

      return {
        id: SENDBYTE_PROVIDER_ID,
        displayName: config.displayName,
        enabled: config.enabled,
        isDefault: config.isDefault,
        mode: config.mode,
        capabilities: this.capabilities,
        configured:
          Boolean(apiKey) &&
          config.enabled &&
          !(isDemoMode() && sandboxKeyMismatch),
        warnings,
        config: {
          baseUrl: sendByteConfig.baseUrl,
          apiKeyEnv: sendByteConfig.apiKeyEnv,
        },
      };
    },
    getCodeSamples(input) {
      return createSendByteCodeSamples(input);
    },
    async preview(source, config, credentials) {
      const response = await sendByteFetch(
        config,
        '/v1/templates/render',
        {
          method: 'POST',
          body: source,
        },
        credentials,
      );

      return TemplatePreviewSchema.parse({
        subject: response.subject,
        html: response.html ?? null,
        text: response.text ?? null,
        warnings: this.getReadiness(config).warnings.filter((warning) =>
          warning.includes('sandbox'),
        ),
      });
    },
    async deploy({ template, source, existingProviderTemplateId, config, credentials }) {
      const request = {
        name: template.slug,
        ...source,
      };
      const path = existingProviderTemplateId
        ? `/v1/templates/${existingProviderTemplateId}`
        : '/v1/templates';
      const response = await sendByteFetch(
        config,
        path,
        {
          method: existingProviderTemplateId ? 'PUT' : 'POST',
          body: request,
        },
        credentials,
      );

      return {
        request,
        response,
        providerTemplateId:
          stringFromUnknown(response.id) ?? existingProviderTemplateId,
      };
    },
  },
};

function createSendByteCodeSamples(input: ProviderCodeSampleInput): TemplateCodeSamples {
  const sendByteConfig = getSendByteConfig(input.config);
  const providerTemplateId = input.providerTemplateId ?? null;
  const sampleTemplateId = providerTemplateId ?? 'tpl_abc123';
  const payload = {
    from: exampleSender(input.template),
    to: 'recipient@example.com',
    template_id: sampleTemplateId,
    variables: input.template.sampleVariables,
  };
  const requestJson = JSON.stringify(payload, null, 2);
  const warnings = providerTemplateId
    ? []
    : [
        'Deploy this template to SendByte before using these samples. tpl_abc123 is a placeholder.',
      ];

  return TemplateCodeSamplesSchema.parse({
    templateId: input.template.id,
    provider: SENDBYTE_PROVIDER_ID,
    providerName: input.config.displayName,
    providerTemplateId,
    warnings,
    samples: [
      {
        id: 'sendbyte-node',
        label: 'Node.js',
        language: 'typescript',
        installCommand: 'pnpm add @sendbyte/node',
        description: `Send ${input.source.subject} with the SendByte Node SDK.`,
        code: [
          'import { SendByte } from "@sendbyte/node";',
          '',
          'const client = new SendByte({ apiKey: process.env.SENDBYTE_API_KEY });',
          '',
          `const payload = ${requestJson};`,
          '',
          'const email = await client.emails.send(payload);',
          '',
          'console.log(email.id);',
        ].join('\n'),
      },
      {
        id: 'sendbyte-python',
        label: 'Python',
        language: 'python',
        installCommand: 'pip install requests',
        description: 'Send through the SendByte HTTP API from a Python service.',
        code: [
          'import os',
          'import requests',
          '',
          `payload = ${toPythonLiteral(payload)}`,
          '',
          'response = requests.post(',
          `    "${sendByteConfig.baseUrl}/v1/emails",`,
          '    headers={',
          '        "Authorization": f"Bearer {os.environ[\'SENDBYTE_API_KEY\']}",',
          '        "Content-Type": "application/json",',
          '    },',
          '    json=payload,',
          '    timeout=10,',
          ')',
          'response.raise_for_status()',
          'print(response.json()["id"])',
        ].join('\n'),
      },
      {
        id: 'sendbyte-php',
        label: 'PHP',
        language: 'php',
        installCommand: null,
        description: 'Send through the SendByte HTTP API from a PHP backend.',
        code: [
          '<?php',
          "$payload = <<<'JSON'",
          requestJson,
          'JSON;',
          '',
          `$ch = curl_init("${sendByteConfig.baseUrl}/v1/emails");`,
          'curl_setopt_array($ch, [',
          '    CURLOPT_POST => true,',
          '    CURLOPT_HTTPHEADER => [',
          '        "Authorization: Bearer " . getenv("SENDBYTE_API_KEY"),',
          '        "Content-Type: application/json",',
          '    ],',
          '    CURLOPT_POSTFIELDS => $payload,',
          '    CURLOPT_RETURNTRANSFER => true,',
          ']);',
          '',
          '$response = curl_exec($ch);',
          '$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);',
          'curl_close($ch);',
          '',
          'if ($status >= 400) {',
          '    throw new RuntimeException($response ?: "SendByte request failed");',
          '}',
          '',
          'echo json_decode($response, true)["id"];',
        ].join('\n'),
      },
      {
        id: 'sendbyte-curl',
        label: 'cURL',
        language: 'bash',
        installCommand: null,
        description: 'Send the saved template directly from a terminal or CI smoke test.',
        code: [
          `curl -X POST ${sendByteConfig.baseUrl}/v1/emails \\`,
          '  -H "Authorization: Bearer $SENDBYTE_API_KEY" \\',
          '  -H "Content-Type: application/json" \\',
          "  --data @- <<'JSON'",
          requestJson,
          'JSON',
        ].join('\n'),
      },
    ],
  });
}

async function fetchMarketplaceManifest(): Promise<MarketplaceManifest> {
  const manifestUrl = getMarketplaceManifestUrl();
  const payload = await fetchJson(manifestUrl);
  return MarketplaceManifestSchema.parse(payload);
}

async function fetchMarketplaceTemplateById(id: string) {
  const manifestUrl = getMarketplaceManifestUrl();
  const manifest = await fetchMarketplaceManifest();
  const item = manifest.templates.find((template) => template.id === id);

  if (!item) {
    throw new Error(`Marketplace template ${id} was not found.`);
  }

  const sourceUrl = resolveMarketplaceUrl(item.url, manifestUrl);
  const payload = await fetchJson(sourceUrl);
  const template = MarketplaceTemplatePackageSchema.parse(payload);
  const preview = template.preview ?? item.preview;
  const resolvedTemplate = preview
    ? { ...template, preview: resolveMarketplaceUrl(preview, manifestUrl) }
    : template;

  if (resolvedTemplate.id !== item.id) {
    throw new Error('Marketplace template id does not match the manifest.');
  }

  return { template: resolvedTemplate, sourceUrl };
}

function resolveMarketplaceUrl(value: string, baseUrl: string) {
  return new URL(value, baseUrl).toString();
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Marketplace request failed with ${response.status}.`);
  }

  return response.json();
}

function validateMarketplaceTemplatePackage(
  value: MarketplaceTemplatePackage,
): MarketplaceTemplatePackage {
  const parsed = MarketplaceTemplatePackageSchema.parse(value);

  if (parsed.variables.length === 0) {
    throw new Error('Marketplace templates must include variable contracts.');
  }

  if (Object.keys(parsed.sampleVariables).length === 0) {
    throw new Error('Marketplace templates must include sample variables.');
  }

  const draft = validateTemplateDraft(parsed);
  return { ...parsed, ...draft };
}

export function validateTemplateDraft(value: unknown): TemplateDraft {
  const parsed = TemplateDraftSchema.parse(normalizeTemplateVariableTypes(value));
  const combined = `${parsed.subject}\n${parsed.mjml}\n${parsed.text}`;
  const duplicateVariables = parsed.variables
    .map((variable) => variable.name)
    .filter((name, index, names) => names.indexOf(name) !== index);

  if (combined.includes('{{{')) {
    throw new Error('Triple-brace Handlebars variables are disabled in v1.');
  }

  if (duplicateVariables.length > 0) {
    throw new Error(
      `Duplicate variable names are not allowed: ${[...new Set(duplicateVariables)].join(', ')}.`,
    );
  }

  const declared = new Set(parsed.variables.map((variable) => variable.name));
  const referenced = extractHandlebarsVariables(combined);
  const missing = [...referenced].filter((name) => !declared.has(name));
  const warnings = [...parsed.warnings];

  if (!parsed.text.trim()) {
    throw new Error('Plain-text fallback is required.');
  }

  if (missing.length > 0) {
    warnings.push(`Added missing variable contracts: ${missing.join(', ')}.`);
  }

  const draft = {
    ...parsed,
    warnings,
    variables: [
      ...parsed.variables,
      ...missing.map((name) => ({
        name,
        type: 'string' as const,
        required: true,
        description: `Value for {{${name}}}.`,
        example: parsed.sampleVariables[name] ?? '',
      })),
    ],
  };

  if (draft.variables.length === 0) {
    throw new Error('Template variable contracts are required.');
  }

  if (Object.keys(draft.sampleVariables).length === 0) {
    throw new Error('Template sample variables are required.');
  }

  return draft;
}

function normalizeTemplateVariableTypes(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  const draft = value as Record<string, unknown>;
  if (!Array.isArray(draft.variables)) {
    return value;
  }

  const normalizedTypes: string[] = [];
  const variables = draft.variables.map((variable) => {
    if (!variable || typeof variable !== 'object' || Array.isArray(variable)) {
      return variable;
    }

    const record = variable as Record<string, unknown>;
    const type = typeof record.type === 'string' ? record.type.toLowerCase() : record.type;
    if (
      type === undefined ||
      type === 'string' ||
      type === 'number' ||
      type === 'boolean' ||
      type === 'array' ||
      type === 'object'
    ) {
      return type === record.type ? variable : { ...record, type };
    }

    const name = typeof record.name === 'string' ? record.name : 'unknown_variable';
    normalizedTypes.push(`${name}: ${String(record.type)} -> string`);
    return { ...record, type: 'string' };
  });

  if (normalizedTypes.length === 0) {
    return { ...draft, variables };
  }

  const warnings = Array.isArray(draft.warnings) ? draft.warnings : [];
  return {
    ...draft,
    variables,
    warnings: [
      ...warnings,
      `Normalized unsupported variable types: ${normalizedTypes.join(', ')}.`,
    ],
  };
}

function extractHandlebarsVariables(input: string) {
  const names = new Set<string>();
  for (const match of input.matchAll(/{{\s*([a-z][a-z0-9_]*)\s*}}/gi)) {
    names.add(match[1]);
  }
  return names;
}

type OpenRouterDraftRepairInput = {
  content: string;
  input: GenerateTemplateInput;
  model: string;
  brandContext: BrandWorkspace;
  openRouterApiKey: string;
};

async function requestOpenRouterTemplateContent(
  input: GenerateTemplateInput,
  model: string,
  brandContext: BrandWorkspace,
  openRouterApiKey: string,
): Promise<string> {
  const emailGenerationSkill = await loadEmailTemplateGeneratorSkill();
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${openRouterApiKey}`,
      'content-type': 'application/json',
      'http-referer': 'http://localhost:3000',
      'x-title': 'TemplateForge',
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'You generate production-safe email templates for TemplateForge.',
            'Return one strict JSON object only.',
            'The JSON must match the required TemplateForge draft shape from the user message.',
            'Use polished MJML body sections plus matching plain text.',
            'Use standard Handlebars double braces.',
            'Never use triple braces. Never include scripts. Always include a text fallback, variable contracts, and sample variables.',
            'Do not recreate brand headers or footers when reusable brand components are provided.',
            emailGenerationSkill,
          ].join('\n\n'),
        },
        {
          role: 'user',
          content: JSON.stringify({
            requiredShape: {
              name: 'human template name',
              slug: 'kebab-case-slug',
              category: input.category,
              subject: 'Handlebars subject',
              mjml: '<mjml>...</mjml>',
              text: 'plain text fallback',
              variables: [
                {
                  name: 'first_name',
                  type: 'string',
                  required: true,
                  description: 'Recipient first name',
                  example: 'Amaka',
                },
              ],
              sampleVariables: { first_name: 'Amaka' },
              tags: ['transactional'],
              warnings: [],
            },
            brandProfile: brandContext.profile,
            reusableComponents: brandContext.components.map((component) => ({
              id: component.id,
              type: component.type,
              name: component.name,
              isDefault: component.isDefault,
              mjml: component.mjml,
              text: component.text,
            })),
            generationRule:
              'Generate the message body content only. The app will wrap it with selected/default reusable HEADER and FOOTER components.',
            input,
          }),
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      stringFromUnknown(payload?.error?.message) ??
        `OpenRouter request failed with ${response.status}.`,
    );
  }

  const content = stringFromUnknown(payload?.choices?.[0]?.message?.content);
  if (!content) {
    throw new Error('OpenRouter returned an empty template response.');
  }

  return content;
}

async function parseAndValidateOpenRouterDraft({
  content,
  input,
  model,
  brandContext,
  openRouterApiKey,
}: OpenRouterDraftRepairInput): Promise<TemplateDraft> {
  try {
    return validateTemplateDraft(parseModelJsonObject(content));
  } catch (error) {
    const firstError =
      error instanceof Error ? error.message : 'OpenRouter draft validation failed.';
    const repairedContent = await requestOpenRouterRepairContent({
      content,
      input,
      model,
      brandContext,
      openRouterApiKey,
    }, firstError);

    try {
      const repairedDraft = validateTemplateDraft(
        parseModelJsonObject(repairedContent),
      );
      return {
        ...repairedDraft,
        warnings: [
          ...repairedDraft.warnings,
          'Recovered malformed OpenRouter output with a repair pass.',
        ],
      };
    } catch (repairError) {
      const repairMessage =
        repairError instanceof Error
          ? repairError.message
          : 'OpenRouter repair failed.';
      throw new Error(
        `OpenRouter returned invalid template JSON. Initial error: ${firstError}. Repair error: ${repairMessage}`,
      );
    }
  }
}

async function requestOpenRouterRepairContent(
  repairInput: OpenRouterDraftRepairInput,
  validationError: string,
): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${repairInput.openRouterApiKey}`,
      'content-type': 'application/json',
      'http-referer': 'http://localhost:3000',
      'x-title': 'TemplateForge',
    },
    body: JSON.stringify({
      model: repairInput.model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'Repair one TemplateForge email template JSON object.',
            'Return corrected JSON only. Do not include markdown, prose, comments, or code fences.',
            'The repaired JSON must include MJML, plain text, variable contracts, sample variables, tags, and warnings.',
            'Never use triple braces. Use only standard Handlebars double braces.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: JSON.stringify({
            validationError,
            requiredShape: {
              name: 'human template name',
              slug: 'kebab-case-slug',
              category: repairInput.input.category,
              subject: 'Handlebars subject',
              mjml: '<mjml>...</mjml>',
              text: 'plain text fallback',
              variables: [
                {
                  name: 'name',
                  type: 'string',
                  required: true,
                  description: 'Recipient name',
                  example: 'Amaka',
                },
              ],
              sampleVariables: { name: 'Amaka' },
              tags: ['transactional'],
              warnings: [],
            },
            brandProfile: repairInput.brandContext.profile,
            input: repairInput.input,
            invalidModelContent: repairInput.content,
          }),
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      stringFromUnknown(payload?.error?.message) ??
        `OpenRouter repair request failed with ${response.status}.`,
    );
  }

  const content = stringFromUnknown(payload?.choices?.[0]?.message?.content);
  if (!content) {
    throw new Error('OpenRouter returned an empty repair response.');
  }

  return content;
}

function parseModelJsonObject(content: string) {
  const trimmed = normalizeJsonLikeContent(content.trim());
  const fenced = extractFencedJsonCandidates(content).map(normalizeJsonLikeContent);
  const firstBalanced = extractFirstJsonObject(trimmed);
  const firstToLast = extractFirstToLastJsonObject(trimmed);
  const candidates = [trimmed, ...fenced, firstBalanced, firstToLast].filter(
    (candidate): candidate is string => Boolean(candidate),
  );

  for (const candidate of [...new Set(candidates)]) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next common model response shape.
    }
  }

  throw new Error('OpenRouter returned malformed JSON.');
}

function normalizeJsonLikeContent(content: string) {
  return escapeControlCharactersInJsonStrings(
    content
      .replace(/^\uFEFF/, '')
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/\\(?!["\\/bfnrtu])/g, '\\\\'),
  );
}

function extractFencedJsonCandidates(content: string) {
  return [...content.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)]
    .map((match) => match[1]?.trim())
    .filter((candidate): candidate is string => Boolean(candidate));
}

function extractFirstToLastJsonObject(content: string) {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  return start !== -1 && end > start ? content.slice(start, end + 1) : null;
}

function escapeControlCharactersInJsonStrings(content: string) {
  let result = '';
  let inString = false;
  let escaped = false;

  for (const character of content) {
    if (!inString) {
      result += character;
      if (character === '"') {
        inString = true;
      }
      continue;
    }

    if (escaped) {
      result += character;
      escaped = false;
      continue;
    }

    if (character === '\\') {
      result += character;
      escaped = true;
    } else if (character === '"') {
      result += character;
      inString = false;
    } else if (character === '\n') {
      result += '\\n';
    } else if (character === '\r') {
      result += '\\r';
    } else if (character === '\t') {
      result += '\\t';
    } else if (character < ' ') {
      result += ' ';
    } else {
      result += character;
    }
  }

  return result;
}

function extractFirstJsonObject(content: string) {
  const start = content.indexOf('{');
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < content.length; index += 1) {
    const character = content[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
    } else if (character === '{') {
      depth += 1;
    } else if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        return content.slice(start, index + 1);
      }
    }
  }

  return null;
}

function getSendByteConfig(config: ProviderConfigRecord) {
  const configJson = asRecord(config.configJson);
  const secretEnvJson = asRecord(config.secretEnvJson);
  const baseUrlEnv = stringFromUnknown(configJson.baseUrlEnv) ?? SENDBYTE_BASE_URL_ENV;
  const apiKeyEnv = stringFromUnknown(secretEnvJson.apiKey) ?? SENDBYTE_API_KEY_ENV;
  const defaultBaseUrl =
    stringFromUnknown(configJson.defaultBaseUrl) ?? SENDBYTE_DEFAULT_BASE_URL;

  return {
    apiKeyEnv,
    baseUrl: process.env[baseUrlEnv]?.trim() || defaultBaseUrl,
  };
}

function resolveOpenRouterApiKey(credentials?: RuntimeCredentials) {
  if (isDemoMode()) {
    return credentials?.openRouterApiKey?.trim() || '';
  }

  return process.env.OPENROUTER_API_KEY?.trim() || '';
}

function resolveSendByteApiKey(
  config: ProviderConfigRecord,
  credentials?: RuntimeCredentials,
) {
  if (isDemoMode()) {
    return credentials?.sendByteApiKey?.trim() || '';
  }

  const sendByteConfig = getSendByteConfig(config);
  return process.env[sendByteConfig.apiKeyEnv]?.trim() || '';
}

function exampleSender(template: TemplateDetail) {
  const name =
    template.brandProfile?.productName?.trim() ||
    template.brandProfile?.name?.trim() ||
    'Example App';
  return `${name.replace(/[<>"\r\n]/g, '')} <notifications@example.com>`;
}

function toPythonLiteral(value: unknown, level = 0): string {
  const indent = '    '.repeat(level);
  const nextIndent = '    '.repeat(level + 1);

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'None';
  }

  if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  }

  if (value === null || value === undefined) {
    return 'None';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }

    return [
      '[',
      ...value.map((item) => `${nextIndent}${toPythonLiteral(item, level + 1)},`),
      `${indent}]`,
    ].join('\n');
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return '{}';
    }

    return [
      '{',
      ...entries.map(
        ([key, item]) =>
          `${nextIndent}${JSON.stringify(key)}: ${toPythonLiteral(item, level + 1)},`,
      ),
      `${indent}}`,
    ].join('\n');
  }

  return 'None';
}

async function sendByteFetch(
  config: ProviderConfigRecord,
  path: string,
  init: { method: 'POST' | 'PUT'; body?: Record<string, unknown> },
  credentials?: RuntimeCredentials,
): Promise<Record<string, unknown>> {
  const sendByteConfig = getSendByteConfig(config);
  const apiKey = resolveSendByteApiKey(config, credentials);
  const response = await fetch(`${sendByteConfig.baseUrl}${path}`, {
    method: init.method,
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(init.body ?? {}),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      stringFromUnknown(payload?.error?.message) ??
      stringFromUnknown(payload?.message) ??
      `Provider request failed with ${response.status}.`;
    throw new Error(message);
  }

  return payload;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function renderHandlebarsLite(input: string, variables: Record<string, unknown>) {
  return input.replace(/{{\s*([a-z][a-z0-9_]*)\s*}}/gi, (_, key: string) =>
    String(variables[key] ?? ''),
  );
}

function renderBrandHandlebars(input: string, variables: Record<string, unknown>) {
  return input.replace(/{{\s*(brand_[a-z0-9_]*)\s*}}/gi, (_, key: string) =>
    String(variables[key] ?? ''),
  );
}

function renderMjmlFallback(input: string, variables: Record<string, unknown>) {
  return renderHandlebarsLite(input, variables)
    .replace(/<mj-text[^>]*>/g, '<p>')
    .replace(/<\/mj-text>/g, '</p>')
    .replace(/<\/?mj[^>]*>/g, '');
}

function stringFromUnknown(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function composeTemplateSource(template: TemplateDetail) {
  const brand = template.brandProfile;
  const variables = {
    ...template.sampleVariables,
    brand_name: brand?.name ?? 'TemplateForge',
    brand_product_name: brand?.productName ?? 'TemplateForge',
    brand_website: brand?.website ?? '',
    brand_logo_url: brand?.logoUrl ?? '',
    brand_primary_color: brand?.primaryColor ?? '#A7C957',
    brand_accent_color: brand?.accentColor ?? '#D65F4A',
    brand_footer_text:
      brand?.footerText ??
      'You received this transactional email because of account activity.',
  };
  const headerMjml = template.headerComponent?.mjml ?? '';
  const footerMjml = template.footerComponent?.mjml ?? '';
  const headerText = template.headerComponent?.text ?? '';
  const footerText = template.footerComponent?.text ?? '';
  const rawMjml = [
    '<mjml>',
    '  <mj-body background-color="#F4F4F5">',
    unwrapMjmlBody(headerMjml),
    unwrapMjmlBody(template.mjml),
    unwrapMjmlBody(footerMjml),
    '  </mj-body>',
    '</mjml>',
  ]
    .filter(Boolean)
    .join('\n');
  const rawText = [headerText, template.text, footerText].filter(Boolean).join('\n\n');

  return {
    subject: renderBrandHandlebars(template.subject, variables),
    mjml: renderBrandHandlebars(rawMjml, variables),
    text: renderBrandHandlebars(rawText, variables),
    variables,
  };
}

function unwrapMjmlBody(input: string) {
  return input
    .replace(/<\/?mjml[^>]*>/gi, '')
    .replace(/<\/?mj-body[^>]*>/gi, '')
    .trim();
}

async function logAction(
  db: DbClient,
  input: {
    templateId?: string;
    action: string;
    summary: string;
    metadata?: Record<string, unknown>;
  },
) {
  await db.actionLog.create({
    data: {
      projectId: DEFAULT_PROJECT_ID,
      templateId: input.templateId,
      action: input.action,
      summary: input.summary,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
