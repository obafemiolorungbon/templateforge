import { prisma } from '@templateforge/db';
import type { Prisma } from '@templateforge/db';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  BrandComponentSchema,
  BrandShellSchema,
  BrandWorkspaceSchema,
  CompleteUploadInputSchema,
  DashboardSummarySchema,
  EmailIntentAstSchema,
  GenerateTemplateInputSchema,
  ImportInputSchema,
  ImportJobSchema,
  MarketplaceManifestSchema,
  MarketplaceTemplatePackageSchema,
  PresignedUploadInputSchema,
  AssetSchema,
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
  BrandShell,
  BrandWorkspace,
  DashboardSummary,
  DeploymentMode,
  EmailProvider,
  EmailIntentAST,
  EmailIntentSection,
  GenerateTemplateInput,
  GeneratedTemplateResult,
  ImportConfidence,
  ImportInput,
  ImportJob,
  ImportMode,
  ImportWarning,
  MarketplaceManifest,
  MarketplaceTemplatePackage,
  PresignedUploadResult,
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
type AssetRecord = {
  id: string;
  workspaceId: string;
  storageProvider: string;
  storageConnectionId?: string | null;
  bucket: string;
  objectKey: string;
  publicUrl?: string | null;
  filename: string;
  contentType: string;
  sizeBytes: number;
  assetType: string;
  visibility: string;
  status: string;
  metadata?: unknown;
  createdAt: Date | string;
  updatedAt: Date | string;
};
type BrandShellRecord = {
  id: string;
  brandProfileId: string;
  name: string;
  logoUrl?: string | null;
  emailWidth: number;
  colors?: unknown;
  typography?: unknown;
  button?: unknown;
  headerComponentId?: string | null;
  footerComponentId?: string | null;
  headerIntent?: unknown;
  footerIntent?: unknown;
  sourceAssetIds?: string[];
  confidence?: unknown;
  warnings?: unknown;
  createdAt: Date | string;
  updatedAt: Date | string;
};
type ImportJobRecord = {
  id: string;
  workspaceId: string;
  status: string;
  mode: string;
  brandShellId?: string | null;
  input: unknown;
  simplifiedDom?: unknown;
  intentAst?: unknown;
  mjml?: string | null;
  renderedHtml?: string | null;
  originalPreviewUrl?: string | null;
  renderedPreviewUrl?: string | null;
  confidence?: unknown;
  warnings?: unknown;
  error?: string | null;
  createdTemplateId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};
type CrudClient<T> = {
  create(args: unknown): Promise<T>;
  findMany(args: unknown): Promise<T[]>;
  findFirst(args: unknown): Promise<T | null>;
  findUnique(args: unknown): Promise<T | null>;
  update(args: unknown): Promise<T>;
  delete?(args: unknown): Promise<T>;
};
type TemplateSource = ReturnType<typeof composeTemplateSource>;
type ProviderDeployResult = {
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  providerTemplateId: string | null;
};
type ManagedR2Config = {
  bucket: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
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
  return (
    db as unknown as { templateMarketplaceInstall: MarketplaceInstallClient }
  ).templateMarketplaceInstall;
}

function providerConfigClient(db: DbClient): ProviderConfigClient {
  return (db as unknown as { emailProviderConfig: ProviderConfigClient })
    .emailProviderConfig;
}

function providerLinkClient(db: DbClient): ProviderLinkClient {
  return (db as unknown as { templateProviderLink: ProviderLinkClient })
    .templateProviderLink;
}

function assetClient(db: DbClient): CrudClient<AssetRecord> {
  return (db as unknown as { asset: CrudClient<AssetRecord> }).asset;
}

function brandShellClient(db: DbClient): CrudClient<BrandShellRecord> {
  return (db as unknown as { brandShell: CrudClient<BrandShellRecord> })
    .brandShell;
}

function importJobClient(db: DbClient): CrudClient<ImportJobRecord> {
  return (db as unknown as { importJob: CrudClient<ImportJobRecord> })
    .importJob;
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
      footerText:
        'You received this transactional email because of account activity.',
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
    include: {
      components: { orderBy: [{ type: 'asc' }, { updatedAt: 'desc' }] },
    },
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

export type StorageConnectionTestResult = {
  success: boolean;
  message: string;
  provider?: string;
};

export type CreatePresignedUploadInput = {
  workspaceId: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  assetType: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  objectKey: string;
};

export interface StorageAdapter {
  createPresignedUpload(
    input: CreatePresignedUploadInput,
  ): Promise<Omit<PresignedUploadResult, 'assetId'>>;
  getPublicUrl(objectKey: string): string;
  createSignedReadUrl?(objectKey: string): Promise<string>;
  deleteObject(objectKey: string): Promise<void>;
  testConnection?(): Promise<StorageConnectionTestResult>;
}

class ManagedR2StorageAdapter implements StorageAdapter {
  private readonly publicBaseUrl =
    process.env.TEMPLATEFORGE_R2_PUBLIC_BASE_URL ||
    'https://storage.templateforge.local';
  private readonly uploadBaseUrl =
    process.env.TEMPLATEFORGE_R2_UPLOAD_BASE_URL ||
    this.publicBaseUrl;
  private readonly signedUrlTtlSeconds = Number(
    process.env.TEMPLATEFORGE_R2_SIGNED_URL_TTL_SECONDS ?? '3600',
  );
  private readonly config = resolveManagedR2Config();
  private readonly client = this.config
    ? new S3Client({
        region: this.config.region,
        endpoint: this.config.endpoint,
        forcePathStyle: true,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
      })
    : null;

  async createPresignedUpload(input: CreatePresignedUploadInput) {
    if (this.client && this.config) {
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: input.objectKey,
        ContentType: input.contentType,
      });
      const uploadUrl = await getSignedUrl(this.client, command, {
        expiresIn: this.signedUrlTtlSeconds,
      });
      return {
        uploadUrl,
        method: 'PUT' as const,
        objectKey: input.objectKey,
        publicUrl:
          input.visibility === 'PUBLIC'
            ? this.getPublicUrl(input.objectKey)
            : undefined,
        headers: { 'content-type': input.contentType },
      };
    }

    const publicUrl =
      input.visibility === 'PUBLIC'
        ? this.getPublicUrl(input.objectKey)
        : undefined;

    return {
      uploadUrl: `${this.uploadBaseUrl.replace(/\/$/, '')}/${input.objectKey}`,
      method: 'PUT' as const,
      objectKey: input.objectKey,
      publicUrl,
      headers: { 'content-type': input.contentType },
    };
  }

  getPublicUrl(objectKey: string) {
    return `${this.publicBaseUrl.replace(/\/$/, '')}/${objectKey}`;
  }

  async createSignedReadUrl(objectKey: string) {
    if (!this.client || !this.config) {
      return this.getPublicUrl(objectKey);
    }
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: objectKey,
    });
    return getSignedUrl(this.client, command, {
      expiresIn: this.signedUrlTtlSeconds,
    });
  }

  async deleteObject(objectKey: string) {
    if (!this.client || !this.config) {
      return;
    }
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: objectKey,
      }),
    );
  }

  async testConnection() {
    const configured = Boolean(this.client && this.config);
    return {
      success: configured,
      provider: 'managed-r2',
      message: configured
        ? 'Managed R2 signing configuration is present.'
        : 'Managed R2 is not fully configured; using development URLs.',
    };
  }
}

function resolveStorageForWorkspace(): StorageAdapter {
  return new ManagedR2StorageAdapter();
}

function resolveManagedR2Config(): ManagedR2Config | null {
  const bucket = process.env.TEMPLATEFORGE_R2_BUCKET?.trim();
  const accountId = process.env.TEMPLATEFORGE_R2_ACCOUNT_ID?.trim();
  const endpoint =
    process.env.TEMPLATEFORGE_R2_ENDPOINT?.trim() ||
    (accountId
      ? `https://${accountId}.r2.cloudflarestorage.com`
      : undefined);
  const accessKeyId = process.env.TEMPLATEFORGE_R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.TEMPLATEFORGE_R2_SECRET_ACCESS_KEY?.trim();
  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    return null;
  }
  return {
    bucket,
    endpoint,
    accessKeyId,
    secretAccessKey,
    region: process.env.TEMPLATEFORGE_R2_REGION?.trim() || 'auto',
  };
}

export async function createPresignedUpload(
  body: unknown,
  db: DbClient = prisma,
): Promise<PresignedUploadResult> {
  await ensureDefaultWorkspace(db);
  const input = PresignedUploadInputSchema.parse(body);
  validateUploadFile(input);
  const assetId = createStableId('asset');
  const objectKey = createObjectKey({
    workspaceId: DEFAULT_PROJECT_ID,
    assetId,
    filename: input.filename,
    assetType: input.assetType,
  });
  const storage = resolveStorageForWorkspace();
  const presigned = await storage.createPresignedUpload({
    workspaceId: DEFAULT_PROJECT_ID,
    filename: input.filename,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    assetType: input.assetType,
    visibility: input.visibility,
    objectKey,
  });

  await assetClient(db).create({
    data: {
      id: assetId,
      workspaceId: DEFAULT_PROJECT_ID,
      storageProvider: 'MANAGED_R2',
      bucket: process.env.TEMPLATEFORGE_R2_BUCKET || 'templateforge-managed',
      objectKey,
      publicUrl: presigned.publicUrl ?? null,
      filename: sanitizeFilename(input.filename),
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      assetType: assetTypeToDb(input.assetType),
      visibility: input.visibility,
      status: 'PENDING',
      metadata: {},
    },
  });

  return {
    assetId,
    ...presigned,
  };
}

export async function completeUpload(
  body: unknown,
  db: DbClient = prisma,
) {
  await ensureDefaultWorkspace(db);
  const input = CompleteUploadInputSchema.parse(body);
  const asset = await assetClient(db).findFirst({
    where: {
      id: input.assetId,
      workspaceId: DEFAULT_PROJECT_ID,
      objectKey: input.objectKey,
    },
  });

  if (!asset) {
    throw new Error('Upload asset not found.');
  }

  const updated = await assetClient(db).update({
    where: { id: asset.id },
    data: {
      status: 'ACTIVE',
      publicUrl: input.publicUrl || asset.publicUrl,
      metadata: input.metadata ?? asset.metadata ?? {},
    },
  });

  await logAction(db, {
    action: 'asset.uploaded',
    summary: `Uploaded ${updated.filename}.`,
    metadata: { assetId: updated.id, assetType: assetTypeFromDb(updated.assetType) },
  });

  return AssetSchema.parse(mapAsset(updated));
}

export async function deleteAsset(id: string, db: DbClient = prisma) {
  await ensureDefaultWorkspace(db);
  const asset = await assetClient(db).findFirst({
    where: { id, workspaceId: DEFAULT_PROJECT_ID },
  });

  if (!asset) {
    throw new Error('Asset not found.');
  }

  await resolveStorageForWorkspace().deleteObject(asset.objectKey);
  const updated = await assetClient(db).update({
    where: { id },
    data: { status: 'DELETED', deletedAt: new Date() },
  });
  return AssetSchema.parse(mapAsset(updated));
}

export async function listBrandShells(
  db: DbClient = prisma,
): Promise<BrandShell[]> {
  await ensureDefaultWorkspace(db);
  const shells = await brandShellClient(db).findMany({
    where: { brandProfileId: DEFAULT_BRAND_PROFILE_ID },
    orderBy: { updatedAt: 'desc' },
  });
  return BrandShellSchema.array().parse(shells.map(mapBrandShell));
}

export async function getBrandShell(
  id: string,
  db: DbClient = prisma,
): Promise<BrandShell | null> {
  await ensureDefaultWorkspace(db);
  const shell = await brandShellClient(db).findFirst({
    where: { id, brandProfileId: DEFAULT_BRAND_PROFILE_ID },
  });
  return shell ? BrandShellSchema.parse(mapBrandShell(shell)) : null;
}

export async function updateBrandShell(
  id: string,
  body: unknown,
  db: DbClient = prisma,
): Promise<BrandShell> {
  await ensureDefaultWorkspace(db);
  const input = BrandShellSchema.pick({
    name: true,
    logoUrl: true,
    emailWidth: true,
    colors: true,
    typography: true,
    button: true,
  }).partial().parse(body);
  const updated = await brandShellClient(db).update({
    where: { id },
    data: input as Record<string, unknown>,
  });
  await logAction(db, {
    action: 'brand_shell.updated',
    summary: `Updated Brand Shell ${updated.name}.`,
    metadata: { brandShellId: id },
  });
  return BrandShellSchema.parse(mapBrandShell(updated));
}

export async function listImportJobs(db: DbClient = prisma): Promise<ImportJob[]> {
  await ensureDefaultWorkspace(db);
  const jobs = await importJobClient(db).findMany({
    where: { workspaceId: DEFAULT_PROJECT_ID },
    orderBy: { updatedAt: 'desc' },
    take: 12,
  });
  return ImportJobSchema.array().parse(jobs.map(mapImportJob));
}

export async function getImportJob(
  id: string,
  db: DbClient = prisma,
): Promise<ImportJob | null> {
  await ensureDefaultWorkspace(db);
  const job = await importJobClient(db).findFirst({
    where: { id, workspaceId: DEFAULT_PROJECT_ID },
  });
  return job ? ImportJobSchema.parse(mapImportJob(job)) : null;
}

export async function createBrandShellImport(
  body: unknown,
  dbOrOptions: DbClient | DomainOptions = prisma,
): Promise<ImportJob> {
  return createImportJob('BRAND_SHELL', body, dbOrOptions);
}

export async function createBodyImport(
  body: unknown,
  dbOrOptions: DbClient | DomainOptions = prisma,
): Promise<ImportJob> {
  return createImportJob('BODY', body, dbOrOptions);
}

export async function createFullEmailImport(
  body: unknown,
  dbOrOptions: DbClient | DomainOptions = prisma,
): Promise<ImportJob> {
  return createImportJob('FULL_EMAIL', body, dbOrOptions);
}

export async function retryImportJob(
  id: string,
  dbOrOptions: DbClient | DomainOptions = prisma,
): Promise<ImportJob> {
  const { db, credentials } = resolveDomainOptions(dbOrOptions);
  const existing = await getImportJob(id, db);
  if (!existing) {
    throw new Error('Import job not found.');
  }
  const updated = await importJobClient(db).update({
    where: { id },
    data: { status: 'PROCESSING', error: null },
  });
  return processImportJob(updated, credentials, db);
}

export async function confirmImportJob(
  id: string,
  db: DbClient = prisma,
) {
  await ensureDefaultWorkspace(db);
  const job = await getImportJob(id, db);
  if (!job) {
    throw new Error('Import job not found.');
  }

  if (job.mode === 'BRAND_SHELL') {
    const updated = await importJobClient(db).update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
    await logAction(db, {
      action: 'import.brand_shell_confirmed',
      summary: 'Confirmed imported Brand Shell.',
      metadata: { importJobId: id, brandShellId: job.brandShellId },
    });
    return { job: ImportJobSchema.parse(mapImportJob(updated)), template: null };
  }

  if (!job.mjml) {
    throw new Error('Import job has no compiled MJML to save.');
  }

  const input = ImportInputSchema.parse(job.input);
  const ast = job.intentAst ?? buildAstFromModelSections({
    sections: [],
    mode: job.mode as ImportMode,
    input,
    shell: null,
  });
  const textFallback = buildImportedTextFallback(job.mjml, ast);
  const variables = inferVariablesFromImportedSource({
    subject: input.subject ?? inferSubject(ast),
    mjml: job.mjml,
    text: textFallback,
  });
  const draft = validateTemplateDraft({
    name: input.name ?? inferTemplateName(ast),
    slug: slugify(input.name ?? inferTemplateName(ast)),
    category: input.category || 'transactional',
    subject: input.subject ?? inferSubject(ast),
    mjml: job.mjml,
    text: textFallback,
    variables,
    sampleVariables: inferSampleVariablesFromVariables(variables),
    tags: ['imported', input.category || 'transactional'],
    warnings: job.warnings.map((warning) => warning.message),
  });
  const shell = job.brandShellId ? await getBrandShell(job.brandShellId, db) : null;
  const template = await createTemplateFromDraft(
    draft,
    {
      brandProfileId: shell?.brandProfileId ?? DEFAULT_BRAND_PROFILE_ID,
      headerComponentId: shell?.headerComponentId ?? undefined,
      footerComponentId: shell?.footerComponentId ?? undefined,
    },
    `Imported from migration job ${job.id}`,
    db,
  );
  const updated = await importJobClient(db).update({
    where: { id },
    data: { status: 'COMPLETED', createdTemplateId: template.id },
  });

  await logAction(db, {
    templateId: template.id,
    action: 'import.template_confirmed',
    summary: `Saved ${template.name} from import review.`,
    metadata: { importJobId: id, brandShellId: job.brandShellId },
  });

  return { job: ImportJobSchema.parse(mapImportJob(updated)), template };
}

async function createImportJob(
  mode: ImportMode,
  body: unknown,
  dbOrOptions: DbClient | DomainOptions,
): Promise<ImportJob> {
  const { db, credentials } = resolveDomainOptions(dbOrOptions);
  await ensureDefaultWorkspace(db);
  const input = ImportInputSchema.parse(body);
  const created = await importJobClient(db).create({
    data: {
      workspaceId: DEFAULT_PROJECT_ID,
      mode,
      status: 'PROCESSING',
      brandShellId: input.brandShellId ?? null,
      input: input as Prisma.InputJsonValue,
      warnings: [],
    },
  });
  return processImportJob(created, credentials, db);
}

async function processImportJob(
  job: ImportJobRecord,
  credentials: RuntimeCredentials | undefined,
  db: DbClient,
): Promise<ImportJob> {
  try {
    const input = ImportInputSchema.parse(job.input);
    const simplifiedDom = simplifyImportHtml(
      [input.headerHtml, input.html, input.footerHtml].filter(Boolean).join('\n'),
    );
    const assetRefs = await resolveInputAssetReferences(input, db);
    const shell = input.brandShellId ? await getBrandShell(input.brandShellId, db) : null;
    const extracted = await extractImportIntent({
      mode: job.mode as ImportMode,
      input,
      simplifiedDom,
      assetReferences: assetRefs.assets,
      shell,
      credentials,
    });
    const confidence = scoreImportConfidence({
      input,
      brandShellId: shell?.id,
      warnings: extracted.warnings,
      hasModel: extracted.usedModel,
    });
    const warnings = extracted.warnings;

    let brandShellId = input.brandShellId ?? null;
    if (job.mode === 'BRAND_SHELL') {
      const shellRecord = await createBrandShellFromImport({
        input,
        ast: extracted.ast,
        headerMjml: extracted.headerMjml,
        footerMjml: extracted.footerMjml,
        text: extracted.text,
        confidence,
        warnings,
        sourceAssetIds: [
          input.headerScreenshotAssetId,
          input.footerScreenshotAssetId,
          input.screenshotAssetId,
        ].filter((value): value is string => Boolean(value)),
      }, db);
      brandShellId = shellRecord.id;
    }

    const updated = await importJobClient(db).update({
      where: { id: job.id },
      data: {
        status: 'NEEDS_REVIEW',
        brandShellId,
        simplifiedDom: simplifiedDom as Prisma.InputJsonValue,
        intentAst: extracted.ast as Prisma.InputJsonValue,
        mjml: extracted.mjml,
        renderedHtml: renderMjmlToHtmlPreview(extracted.mjml),
        originalPreviewUrl: assetRefs.originalPreviewUrl,
        renderedPreviewUrl: null,
        confidence: confidence as Prisma.InputJsonValue,
        warnings: warnings as unknown as Prisma.InputJsonValue,
        error: null,
      },
    });

    await logAction(db, {
      action: 'import.job_ready',
      summary: `Prepared ${job.mode.toLowerCase().replace('_', ' ')} import for review.`,
      metadata: { importJobId: job.id, confidenceScore: confidence.score },
    });

    return ImportJobSchema.parse(mapImportJob(updated));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Import failed.';
    const failed = await importJobClient(db).update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        error: message,
        warnings: [
          {
            code: 'MODEL_UNAVAILABLE',
            message,
            severity: 'critical',
          },
        ] as Prisma.InputJsonValue,
      },
    });
    await logAction(db, {
      action: 'import.job_failed',
      summary: message,
      metadata: { importJobId: job.id },
    });
    return ImportJobSchema.parse(mapImportJob(failed));
  }
}

type ExtractImportIntentInput = {
  mode: ImportMode;
  input: ImportInput;
  simplifiedDom: Record<string, unknown>;
  assetReferences: ImportAssetReference[];
  shell: BrandShell | null;
  credentials?: RuntimeCredentials;
};

type ImportAssetReference = {
  role: 'email' | 'header' | 'footer';
  url: string;
  contentType: string;
  filename: string;
};

type MjmlImportExtraction = {
  ast: EmailIntentAST;
  mjml: string;
  headerMjml?: string;
  footerMjml?: string;
  text: string;
  warnings: ImportWarning[];
  usedModel: boolean;
};

async function extractImportIntent({
  mode,
  input,
  simplifiedDom,
  assetReferences,
  shell,
  credentials,
}: ExtractImportIntentInput): Promise<MjmlImportExtraction> {
  const modelExtraction = await requestOpenRouterImportMjml({
    mode,
    input,
    simplifiedDom,
    assetReferences,
    shell,
    credentials,
  }).catch(() => null);

  if (modelExtraction) {
    return modelExtraction;
  }

  const warnings: ImportWarning[] = [
    {
      code: credentials?.openRouterApiKey || process.env.OPENROUTER_API_KEY
        ? 'APPROXIMATED_SPACING'
        : 'MODEL_UNAVAILABLE',
      message:
        'Used deterministic reconstruction because the vision extraction pass was unavailable.',
      severity: 'warning',
    },
  ];
  if (
    assetReferences.length > 0 &&
    !input.html &&
    !input.headerHtml &&
    !input.footerHtml
  ) {
    warnings.push({
      code: 'SCREENSHOT_ONLY',
      message:
        'Screenshot-only import needs a working vision model for accurate reconstruction.',
      severity: 'warning',
    });
  }
  const ast = buildDeterministicIntent({ mode, input, simplifiedDom, shell });
  const compiled = compileIntentToMjml(ast);
  const fallbackWarnings = [...warnings, ...compiled.warnings];
  return {
    ast,
    mjml: compiled.mjml,
    headerMjml:
      mode === 'BRAND_SHELL'
        ? compileIntentToMjml({
            ...ast,
            sections: ast.sections.filter((section) => section.kind === 'header'),
          }).mjml
        : undefined,
    footerMjml:
      mode === 'BRAND_SHELL'
        ? compileIntentToMjml({
            ...ast,
            sections: ast.sections.filter((section) => section.kind === 'footer'),
          }).mjml
        : undefined,
    text: buildTextFallback(ast),
    warnings: fallbackWarnings,
    usedModel: false,
  };
}

async function requestOpenRouterImportMjml({
  mode,
  input,
  simplifiedDom,
  assetReferences,
  shell,
  credentials,
}: ExtractImportIntentInput): Promise<MjmlImportExtraction | null> {
  const openRouterApiKey = resolveOpenRouterApiKey(credentials);
  if (!openRouterApiKey) {
    return null;
  }
  const model =
    process.env.TEMPLATEFORGE_IMPORT_MODEL?.trim() ||
    process.env.OPENROUTER_MODEL?.trim() ||
    DEFAULT_MODEL;
  const userContent: Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }
  > = [
    {
      type: 'text',
      text: JSON.stringify({
        mode,
        input,
        simplifiedDom,
        assetReferences: assetReferences.map((asset) => ({
          role: asset.role,
          filename: asset.filename,
          contentType: asset.contentType,
        })),
        brandShell: shell,
        supportedSectionKinds: [
          'header',
          'footer',
          'hero',
          'text',
          'image',
          'button',
          'divider',
          'spacer',
          'two_column',
          'feature_grid',
          'card',
          'receipt_summary',
          'otp_code',
          'alert',
          'raw',
        ],
      }),
    },
    ...assetReferences
      .filter((asset) => isModelReadableImageUrl(asset.url))
      .map((asset) => ({
        type: 'image_url' as const,
        image_url: { url: asset.url },
      })),
  ];
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${openRouterApiKey}`,
      'content-type': 'application/json',
      'http-referer': 'http://localhost:3000',
      'x-title': 'TemplateForge Import',
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'You reconstruct transactional email screenshots and legacy HTML into editable MJML for TemplateForge.',
            'Return one strict JSON object. Do not use markdown fences.',
            'Required shape: { "mjml": "<mjml>...</mjml>", "text": "plain text fallback", "sections": [{ "kind": "header|footer|hero|text|image|button|divider|spacer|two_column|feature_grid|card|receipt_summary|otp_code|alert|raw", "label": "...", "text": "..." }], "warnings": [] }.',
            'For BRAND_SHELL mode, also return "headerMjml" and "footerMjml" as separate full <mjml> documents.',
            'Generate real editable MJML elements from the visual layout. Never preserve the uploaded screenshot as one large <mj-image>.',
            'HTML is optional evidence. Screenshot-only imports are valid when a readable image is provided.',
            'Never use triple braces. Use only standard Handlebars double braces like {{recipient_name}}.',
            'Do not include script tags, event-handler attributes, javascript: URLs, tracking pixels, or external assets unless they were present in the supplied HTML.',
            'Prefer approximate editable layout over pixel-perfect output.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json().catch(() => ({}));
  const content = stringFromUnknown(payload?.choices?.[0]?.message?.content);
  if (!content) {
    return null;
  }
  return parseModelMjmlImport({
    payload: parseModelJsonObject(content),
    mode,
    input,
    simplifiedDom,
    shell,
    assetReferences,
  });
}

function parseModelMjmlImport({
  payload,
  mode,
  input,
  simplifiedDom,
  shell,
  assetReferences,
}: {
  payload: unknown;
  mode: ImportMode;
  input: ImportInput;
  simplifiedDom: Record<string, unknown>;
  shell: BrandShell | null;
  assetReferences: ImportAssetReference[];
}): MjmlImportExtraction {
  const record = asRecord(payload);
  const headerMjml = validateOptionalImportedMjml({
    value: stringFromUnknown(record.headerMjml),
    label: 'headerMjml',
    assetReferences,
  });
  const footerMjml = validateOptionalImportedMjml({
    value: stringFromUnknown(record.footerMjml),
    label: 'footerMjml',
    assetReferences,
  });
  const rawMjml =
    stringFromUnknown(record.mjml) ??
    (headerMjml || footerMjml
      ? wrapMjmlBody([unwrapMjmlBody(headerMjml ?? ''), unwrapMjmlBody(footerMjml ?? '')])
      : null);
  const mjml = validateImportedMjml({
    value: rawMjml,
    label: 'mjml',
    assetReferences,
  });
  const sections = parseModelSections(record.sections);
  const ast = buildAstFromModelSections({
    sections,
    mode,
    input,
    shell,
    width: numberFromUnknown(record.width),
    fallbackText:
      stringFromUnknown(record.text) ??
      String(simplifiedDom.text ?? '').trim() ??
      input.name,
  });
  const text = stringFromUnknown(record.text) ?? buildImportedTextFallback(mjml, ast);
  const warnings = parseModelWarnings(record.warnings);

  return {
    ast,
    mjml,
    headerMjml,
    footerMjml,
    text,
    warnings,
    usedModel: true,
  };
}

function validateOptionalImportedMjml(input: {
  value: string | null;
  label: string;
  assetReferences: ImportAssetReference[];
}) {
  return input.value
    ? validateImportedMjml({
        value: input.value,
        label: input.label,
        assetReferences: input.assetReferences,
      })
    : undefined;
}

function validateImportedMjml({
  value,
  label,
  assetReferences,
}: {
  value: string | null;
  label: string;
  assetReferences: ImportAssetReference[];
}) {
  if (!value) {
    throw new Error(`OpenRouter import response did not include ${label}.`);
  }
  const mjml = ensureFullMjmlDocument(value);
  if (mjml.includes('{{{')) {
    throw new Error('Triple-brace Handlebars variables are disabled in imports.');
  }
  if (/<script\b/i.test(mjml) || /\son[a-z]+\s*=/i.test(mjml)) {
    throw new Error('Imported MJML cannot include scripts or event handlers.');
  }
  if (/javascript:/i.test(mjml)) {
    throw new Error('Imported MJML cannot include javascript: URLs.');
  }
  for (const asset of assetReferences) {
    if (asset.url && mjml.includes(asset.url)) {
      throw new Error(
        'Imported MJML cannot embed the source screenshot as a reconstructed image.',
      );
    }
  }
  return mjml;
}

function ensureFullMjmlDocument(value: string) {
  const trimmed = value.trim();
  if (/<mjml[\s>]/i.test(trimmed) && /<\/mjml>/i.test(trimmed)) {
    return trimmed;
  }
  if (/<mj-body[\s>]/i.test(trimmed) && /<\/mj-body>/i.test(trimmed)) {
    return ['<mjml>', trimmed, '</mjml>'].join('\n');
  }
  return wrapMjmlBody([trimmed]);
}

function wrapMjmlBody(parts: string[]) {
  return [
    '<mjml>',
    '  <mj-body background-color="#F4F4F5">',
    ...parts.filter(Boolean),
    '  </mj-body>',
    '</mjml>',
  ].join('\n');
}

function parseModelSections(value: unknown): EmailIntentSection[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((section, index) => {
      const record = asRecord(section);
      const kind = stringFromUnknown(record.kind);
      const supportedKind = isEmailIntentSectionKind(kind) ? kind : 'raw';
      return {
        id: stringFromUnknown(record.id) ?? `model-section-${index + 1}`,
        kind: supportedKind,
        label: stringFromUnknown(record.label) ?? humanizeSectionKind(supportedKind),
        text: stringFromUnknown(record.text) ?? undefined,
        styles: {},
        content: {},
        children: [],
      };
    })
    .slice(0, 40);
}

function buildAstFromModelSections({
  sections,
  mode,
  input,
  shell,
  width,
  fallbackText,
}: {
  sections: EmailIntentSection[];
  mode: ImportMode;
  input: ImportInput;
  shell: BrandShell | null;
  width?: number;
  fallbackText?: string | null;
}) {
  const text = fallbackText?.trim() || input.name || 'Imported transactional email';
  const finalSections =
    sections.length > 0
      ? sections
      : [
          {
            kind: mode === 'BRAND_SHELL' ? 'header' : 'text',
            label: mode === 'BRAND_SHELL' ? 'Recovered header/footer' : 'Recovered body',
            text,
            styles: {},
            content: {},
            children: [],
          } satisfies EmailIntentSection,
        ];
  return EmailIntentAstSchema.parse({
    type: 'email',
    width: width ?? input.brandHints.emailWidth ?? shell?.emailWidth ?? 600,
    backgroundColor: input.brandHints.backgroundColor ?? '#F4F4F5',
    brandShellId: input.brandShellId,
    sections: finalSections,
    warnings: [],
  });
}

function parseModelWarnings(value: unknown): ImportWarning[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((warning, index) => {
      if (typeof warning === 'string') {
        return {
          code: 'APPROXIMATED_SPACING' as const,
          message: warning,
          severity: 'info' as const,
        };
      }
      const record = asRecord(warning);
      return {
        code: 'APPROXIMATED_SPACING' as const,
        message:
          stringFromUnknown(record.message) ??
          stringFromUnknown(record.text) ??
          `Import warning ${index + 1}.`,
        severity:
          record.severity === 'critical' || record.severity === 'warning'
            ? (record.severity as 'critical' | 'warning')
            : ('info' as const),
      };
    })
    .slice(0, 20);
}

function isEmailIntentSectionKind(
  value: string | null,
): value is EmailIntentSection['kind'] {
  return Boolean(
    value &&
      [
        'header',
        'footer',
        'hero',
        'text',
        'image',
        'button',
        'divider',
        'spacer',
        'two_column',
        'feature_grid',
        'card',
        'receipt_summary',
        'otp_code',
        'alert',
        'raw',
      ].includes(value),
  );
}

function humanizeSectionKind(kind: string) {
  return kind.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function numberFromUnknown(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function buildDeterministicIntent({
  mode,
  input,
  simplifiedDom,
  shell,
}: Pick<ExtractImportIntentInput, 'mode' | 'input' | 'simplifiedDom' | 'shell'>): EmailIntentAST {
  const text = String(simplifiedDom.text ?? '').trim();
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const headline = lines[0] || input.name || 'Imported transactional email';
  const body = lines.slice(1).join('\n') || 'Review the reconstructed body before saving.';
  const width = input.brandHints.emailWidth ?? shell?.emailWidth ?? 600;
  const sections: EmailIntentSection[] = [];

  if (mode === 'BRAND_SHELL') {
    const headerText =
      stripHtml(input.headerHtml ?? '') ||
      input.brandHints.logoUrl ||
      input.name ||
      'Reusable email header';
    const footerText =
      stripHtml(input.footerHtml ?? '') ||
      input.brandHints.backgroundColor ||
      'Legal footer and unsubscribe text';
    sections.push(
      {
        kind: 'header',
        label: 'Recovered header',
        text: headerText,
        styles: { align: 'left', padding: '24px 32px 10px' },
      },
      {
        kind: 'footer',
        label: 'Recovered footer',
        text: footerText,
        styles: { align: 'left', padding: '10px 32px 28px' },
      },
    );
  } else {
    sections.push({
      kind: 'hero',
      label: 'Recovered lead section',
      text: headline,
      content: { body },
      styles: { align: 'left', padding: '32px 32px 20px' },
    });
    const links = simplifiedDom.links as Array<{ text?: string; href?: string }> | undefined;
    const cta = links?.find((link) => link.text && link.href);
    if (cta) {
      sections.push({
        kind: 'button',
        label: 'Recovered CTA',
        text: cta.text,
        button: {
          label: cta.text ?? 'Open',
          href: cta.href ?? '#',
          backgroundColor: input.brandHints.primaryColor ?? '#A7C957',
          textColor: '#111113',
        },
      });
    }
  }

  return EmailIntentAstSchema.parse({
    type: 'email',
    width,
    backgroundColor: input.brandHints.backgroundColor ?? '#F4F4F5',
    brandShellId: input.brandShellId,
    sections,
    warnings: [],
  });
}

export function compileIntentToMjml(ast: EmailIntentAST): {
  mjml: string;
  warnings: ImportWarning[];
  unsupportedFeatures: Array<{ sectionId?: string; kind: string }>;
} {
  const parsed = EmailIntentAstSchema.parse(ast);
  const warnings: ImportWarning[] = [];
  const unsupportedFeatures: Array<{ sectionId?: string; kind: string }> = [];
  const sections = parsed.sections.map((section) =>
    compileSection(section, warnings, unsupportedFeatures),
  );
  const mjml = [
    '<mjml>',
    '  <mj-body background-color="' +
      escapeAttribute(parsed.backgroundColor ?? '#F4F4F5') +
      '" width="' +
      parsed.width +
      'px">',
    ...sections,
    '  </mj-body>',
    '</mjml>',
  ].join('\n');

  if (mjml.includes('{{{')) {
    throw new Error('Triple-brace Handlebars variables are disabled in imports.');
  }

  return { mjml, warnings, unsupportedFeatures };
}

function compileSection(
  section: EmailIntentSection,
  warnings: ImportWarning[],
  unsupportedFeatures: Array<{ sectionId?: string; kind: string }>,
): string {
  const padding = stringFromUnknown(section.styles?.padding) ?? '20px 32px';
  const align = stringFromUnknown(section.styles?.align) ?? 'left';
  const text = section.text ?? stringFromUnknown(section.content?.headline) ?? '';
  const body = stringFromUnknown(section.content?.body);

  if (section.kind === 'spacer') {
    return `    <mj-spacer height="${escapeAttribute(stringFromUnknown(section.styles?.height) ?? '20px')}" />`;
  }

  if (section.kind === 'divider') {
    return '    <mj-section padding="8px 32px"><mj-column><mj-divider border-color="#E4E4E7" /></mj-column></mj-section>';
  }

  if (section.kind === 'image' && section.image?.src) {
    return [
      `    <mj-section padding="${escapeAttribute(padding)}">`,
      '      <mj-column>',
      `        <mj-image src="${escapeAttribute(section.image.src)}" alt="${escapeAttribute(section.image.alt)}" />`,
      '      </mj-column>',
      '    </mj-section>',
    ].join('\n');
  }

  if (section.kind === 'button' || section.button) {
    const button = section.button ?? {
      label: text || 'Open',
      href: '#',
    };
    return [
      `    <mj-section padding="${escapeAttribute(padding)}">`,
      '      <mj-column>',
      `        <mj-button href="${escapeAttribute(button.href)}" background-color="${escapeAttribute(button.backgroundColor ?? '#A7C957')}" color="${escapeAttribute(button.textColor ?? '#111113')}" border-radius="999px" font-weight="700">${escapeText(button.label)}</mj-button>`,
      '      </mj-column>',
      '    </mj-section>',
    ].join('\n');
  }

  if (section.kind === 'two_column' || section.kind === 'feature_grid') {
    const children = section.children?.length
      ? section.children
      : [
          { kind: 'text', text },
          { kind: 'text', text: body ?? 'Recovered supporting content.' },
        ];
    return [
      `    <mj-section padding="${escapeAttribute(padding)}">`,
      ...children.slice(0, 2).map((child) => {
        const childSection = child as EmailIntentSection;
        return [
          '      <mj-column>',
          `        <mj-text font-size="15px" line-height="1.6" color="#3F3F46">${escapeText(childSection.text ?? 'Recovered block')}</mj-text>`,
          '      </mj-column>',
        ].join('\n');
      }),
      '    </mj-section>',
    ].join('\n');
  }

  if (section.kind === 'raw') {
    warnings.push({
      code: 'RAW_BLOCK_PRESERVED',
      message: 'A section was preserved as raw MJML because its structure was ambiguous.',
      severity: 'warning',
      sectionId: section.id,
    });
    unsupportedFeatures.push({ sectionId: section.id, kind: section.kind });
    return section.html?.includes('<mj-')
      ? section.html
      : [
          `    <mj-section padding="${escapeAttribute(padding)}">`,
          '      <mj-column>',
          `        <mj-raw>${section.html ?? escapeText(text)}</mj-raw>`,
          '      </mj-column>',
          '    </mj-section>',
        ].join('\n');
  }

  const fontSize =
    section.kind === 'hero' || section.kind === 'header' ? '22px' : '15px';
  const weight =
    section.kind === 'hero' || section.kind === 'header' ? '700' : '400';
  return [
    `    <mj-section padding="${escapeAttribute(padding)}">`,
    '      <mj-column>',
    `        <mj-text align="${escapeAttribute(align)}" font-size="${fontSize}" line-height="1.55" font-weight="${weight}" color="#18181B">${escapeText(text || section.label || 'Recovered section')}</mj-text>`,
    body
      ? `        <mj-text align="${escapeAttribute(align)}" font-size="15px" line-height="1.7" color="#52525B">${escapeText(body)}</mj-text>`
      : '',
    '      </mj-column>',
    '    </mj-section>',
  ].filter(Boolean).join('\n');
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

  return TemplateListItemSchema.array().parse(
    templates.map(mapTemplateListItem),
  );
}

export function getMarketplaceManifestUrl() {
  const url = process.env.TEMPLATEFORGE_MARKETPLACE_MANIFEST_URL?.trim();

  if (!url) {
    throw new Error(
      'TEMPLATEFORGE_MARKETPLACE_MANIFEST_URL is not configured.',
    );
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
        preview: resolveMarketplacePreviewUrl(template, manifestUrl),
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
  const model = (await getEnvironmentReadiness({ db, credentials }))
    .openRouterModel;
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
    const message =
      error instanceof Error ? error.message : 'Generation failed.';
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

  if (
    !adapter.capabilities.includes('CODE_SAMPLES') ||
    !adapter.getCodeSamples
  ) {
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
    throw new Error(
      `${adapter.displayName} does not support template deployment.`,
    );
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
    const message =
      error instanceof Error ? error.message : 'Template deployment failed.';
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

function mapAsset(asset: AssetRecord) {
  return {
    id: asset.id,
    workspaceId: asset.workspaceId,
    storageProvider: storageProviderFromDb(asset.storageProvider),
    storageConnectionId: asset.storageConnectionId ?? null,
    bucket: asset.bucket,
    objectKey: asset.objectKey,
    publicUrl: asset.publicUrl ?? null,
    filename: asset.filename,
    contentType: asset.contentType,
    sizeBytes: asset.sizeBytes,
    assetType: assetTypeFromDb(asset.assetType),
    visibility: asset.visibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE',
    status:
      asset.status === 'ACTIVE'
        ? 'ACTIVE'
        : asset.status === 'DELETED'
          ? 'DELETED'
          : 'PENDING',
    metadata: asRecord(asset.metadata),
    createdAt: iso(asset.createdAt) ?? new Date().toISOString(),
    updatedAt: iso(asset.updatedAt) ?? new Date().toISOString(),
  };
}

function mapBrandShell(shell: BrandShellRecord): BrandShell {
  return BrandShellSchema.parse({
    id: shell.id,
    brandProfileId: shell.brandProfileId,
    name: shell.name,
    logoUrl: shell.logoUrl ?? null,
    emailWidth: shell.emailWidth,
    colors: asRecord(shell.colors),
    typography: asRecord(shell.typography),
    button: asRecord(shell.button),
    headerComponentId: shell.headerComponentId ?? null,
    footerComponentId: shell.footerComponentId ?? null,
    headerIntent: shell.headerIntent
      ? EmailIntentAstSchema.parse(shell.headerIntent)
      : null,
    footerIntent: shell.footerIntent
      ? EmailIntentAstSchema.parse(shell.footerIntent)
      : null,
    sourceAssetIds: shell.sourceAssetIds ?? [],
    confidence: shell.confidence,
    warnings: Array.isArray(shell.warnings) ? shell.warnings : [],
    createdAt: iso(shell.createdAt) ?? new Date().toISOString(),
    updatedAt: iso(shell.updatedAt) ?? new Date().toISOString(),
  });
}

function mapImportJob(job: ImportJobRecord): ImportJob {
  return ImportJobSchema.parse({
    id: job.id,
    status: job.status,
    mode: job.mode,
    brandShellId: job.brandShellId ?? null,
    input: job.input,
    simplifiedDom: asNullableRecord(job.simplifiedDom),
    intentAst: job.intentAst ? EmailIntentAstSchema.parse(job.intentAst) : null,
    mjml: job.mjml ?? null,
    renderedHtml: job.renderedHtml ?? null,
    originalPreviewUrl: job.originalPreviewUrl ?? null,
    renderedPreviewUrl: job.renderedPreviewUrl ?? null,
    confidence: job.confidence,
    warnings: Array.isArray(job.warnings) ? job.warnings : [],
    error: job.error ?? null,
    createdAt: iso(job.createdAt) ?? new Date().toISOString(),
    updatedAt: iso(job.updatedAt) ?? new Date().toISOString(),
  });
}

function asNullableRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function assetTypeToDb(assetType: string) {
  return assetType.toUpperCase().replaceAll('-', '_');
}

function assetTypeFromDb(assetType: string) {
  return assetType.toLowerCase().replaceAll('_', '-');
}

function storageProviderFromDb(provider: string) {
  return provider.toLowerCase().replaceAll('_', '-');
}

function createStableId(prefix: string) {
  const random = `${Date.now()}${Math.random().toString(16).slice(2)}`.replace(
    /[^a-z0-9]/gi,
    '',
  );
  return `${prefix}_${random.slice(0, 24)}`;
}

function sanitizeFilename(filename: string) {
  const cleaned = filename
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 96);
  return cleaned || 'asset';
}

function createObjectKey(input: {
  workspaceId: string;
  assetId: string;
  filename: string;
  assetType: string;
}) {
  const filename = sanitizeFilename(input.filename);
  if (input.assetType === 'import-screenshot') {
    return `workspaces/${input.workspaceId}/imports/pending/screenshots/${input.assetId}-${filename}`;
  }
  if (input.assetType === 'header-footer') {
    return `workspaces/${input.workspaceId}/headers-footers/${input.assetId}-${filename}`;
  }
  if (input.assetType === 'template-preview') {
    return `workspaces/${input.workspaceId}/templates/pending/preview-${input.assetId}-${filename}`;
  }
  if (input.assetType === 'brand-logo' || input.assetType === 'brand-asset') {
    return `workspaces/${input.workspaceId}/brand/assets/${input.assetId}-${filename}`;
  }
  return `workspaces/${input.workspaceId}/assets/${input.assetId}-${filename}`;
}

function validateUploadFile(input: {
  filename: string;
  contentType: string;
  sizeBytes: number;
}) {
  const allowed = new Set([
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'text/html',
    'application/json',
    'application/zip',
    'application/pdf',
  ]);
  const maxSize = Number(process.env.TEMPLATEFORGE_MAX_UPLOAD_BYTES ?? 20_000_000);
  if (!allowed.has(input.contentType)) {
    throw new Error(`Unsupported upload content type: ${input.contentType}.`);
  }
  if (input.sizeBytes > maxSize) {
    throw new Error(`Upload exceeds the ${maxSize} byte workspace limit.`);
  }
  if (input.filename.toLowerCase().endsWith('.svg')) {
    throw new Error('SVG uploads are blocked until sanitization is enabled.');
  }
}

function simplifyImportHtml(html: string): Record<string, unknown> {
  const normalized = html.trim();
  const links = [...normalized.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .slice(0, 12)
    .map((match) => ({
      href: match[1],
      text: stripHtml(match[2]).slice(0, 120),
    }));
  const images = [...normalized.matchAll(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi)]
    .slice(0, 12)
    .map((match) => ({ src: match[1] }));
  const tableCount = (normalized.match(/<table\b/gi) ?? []).length;
  const text = stripHtml(normalized);
  return {
    text,
    textLength: text.length,
    links,
    images,
    tableCount,
    hasComplexTables: tableCount > 4,
  };
}

function stripHtml(input: string) {
  return input
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h[1-6]|section)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function resolveInputAssetReferences(input: ImportInput, db: DbClient) {
  const requested = [
    { id: input.screenshotAssetId, role: 'email' as const },
    { id: input.headerScreenshotAssetId, role: 'header' as const },
    { id: input.footerScreenshotAssetId, role: 'footer' as const },
  ].filter((item): item is { id: string; role: ImportAssetReference['role'] } =>
    Boolean(item.id),
  );
  if (requested.length === 0) {
    return { originalPreviewUrl: null, assets: [] as ImportAssetReference[] };
  }
  const records = await assetClient(db).findMany({
    where: {
      workspaceId: DEFAULT_PROJECT_ID,
      id: { in: requested.map((item) => item.id) },
    },
  });
  const storage = resolveStorageForWorkspace();
  const recordsById = new Map(records.map((asset) => [asset.id, asset]));
  const assets = (
    await Promise.all(
      requested.map(async (item) => {
        const asset = recordsById.get(item.id);
        if (!asset) {
          return null;
        }
        const signedReadUrl =
          asset.visibility === 'PRIVATE' && storage.createSignedReadUrl
            ? await storage.createSignedReadUrl(asset.objectKey).catch(() => null)
            : null;
        const url = signedReadUrl ?? asset.publicUrl;
        if (!url) {
          return null;
        }
        return {
          role: item.role,
          url,
          contentType: asset.contentType,
          filename: asset.filename,
        };
      }),
    )
  ).filter((asset): asset is ImportAssetReference => Boolean(asset));

  return { originalPreviewUrl: assets[0]?.url ?? null, assets };
}

function isModelReadableImageUrl(url: string) {
  return (
    /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(url) ||
    /^https?:\/\//i.test(url)
  );
}

async function createBrandShellFromImport(
  input: {
    input: ImportInput;
    ast: EmailIntentAST;
    headerMjml?: string;
    footerMjml?: string;
    text: string;
    confidence: ImportConfidence;
    warnings: ImportWarning[];
    sourceAssetIds: string[];
  },
  db: DbClient,
): Promise<BrandShell> {
  const headerAst = EmailIntentAstSchema.parse({
    ...input.ast,
    sections: input.ast.sections.filter((section) => section.kind === 'header'),
  });
  const footerAst = EmailIntentAstSchema.parse({
    ...input.ast,
    sections: input.ast.sections.filter((section) => section.kind === 'footer'),
  });
  const headerMjml =
    input.headerMjml ?? compileIntentToMjml(headerAst).mjml;
  const footerMjml =
    input.footerMjml ?? compileIntentToMjml(footerAst).mjml;
  const shellName = input.input.name ?? 'Imported brand shell';
  const created = await db.$transaction(async (tx) => {
    const header = await tx.brandComponent.create({
      data: {
        brandProfileId: DEFAULT_BRAND_PROFILE_ID,
        type: 'HEADER',
        name: `${shellName} header`,
        mjml: unwrapMjmlBody(headerMjml),
        text: buildTextFallback(headerAst) || input.text,
        isDefault: false,
      },
    });
    const footer = await tx.brandComponent.create({
      data: {
        brandProfileId: DEFAULT_BRAND_PROFILE_ID,
        type: 'FOOTER',
        name: `${shellName} footer`,
        mjml: unwrapMjmlBody(footerMjml),
        text: buildTextFallback(footerAst) || input.text,
        isDefault: false,
      },
    });
    return brandShellClient(tx as unknown as DbClient).create({
      data: {
        brandProfileId: DEFAULT_BRAND_PROFILE_ID,
        name: shellName,
        logoUrl: input.input.brandHints.logoUrl ?? null,
        emailWidth: input.ast.width,
        colors: {
          primary: input.input.brandHints.primaryColor,
          secondary: input.input.brandHints.secondaryColor,
          background: input.input.brandHints.backgroundColor,
          text: input.input.brandHints.textColor,
        },
        typography: {
          fontFamily: input.input.brandHints.fontFamily,
        },
        button: input.input.brandHints.buttonStyle ?? {},
        headerComponentId: header.id,
        footerComponentId: footer.id,
        headerIntent: headerAst as Prisma.InputJsonValue,
        footerIntent: footerAst as Prisma.InputJsonValue,
        sourceAssetIds: input.sourceAssetIds,
        confidence: input.confidence as Prisma.InputJsonValue,
        warnings: input.warnings as unknown as Prisma.InputJsonValue,
      },
    });
  });

  await logAction(db, {
    action: 'brand_shell.imported',
    summary: `Imported Brand Shell ${created.name}.`,
    metadata: { brandShellId: created.id },
  });

  return BrandShellSchema.parse(mapBrandShell(created));
}

function scoreImportConfidence(input: {
  input: ImportInput;
  brandShellId?: string;
  warnings: ImportWarning[];
  hasModel: boolean;
}): ImportConfidence {
  let score = 20;
  const reasons: string[] = [];
  if (input.input.html || input.input.headerHtml || input.input.footerHtml) {
    score += 25;
    reasons.push('Source HTML was provided.');
  }
  if (
    input.input.screenshotAssetId ||
    input.input.headerScreenshotAssetId ||
    input.input.footerScreenshotAssetId
  ) {
    score += 25;
    reasons.push('A source screenshot asset was attached.');
  }
  if (input.brandShellId) {
    score += 20;
    reasons.push('A reusable Brand Shell was selected.');
  }
  if (input.input.brandHints.primaryColor) {
    score += 8;
    reasons.push('Brand color hints were provided.');
  }
  if (input.input.brandHints.fontFamily) {
    score += 4;
    reasons.push('Font hints were provided.');
  }
  if (input.hasModel) {
    score += 10;
    reasons.push('AI reconstruction returned validated MJML.');
  }
  score -= input.warnings.filter((warning) => warning.severity === 'warning').length * 6;
  score -= input.warnings.filter((warning) => warning.severity === 'critical').length * 18;
  score = Math.max(0, Math.min(100, score));
  return {
    score,
    level: score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low',
    reasons: reasons.length ? reasons : ['Deterministic reconstruction completed.'],
  };
}

function renderMjmlToHtmlPreview(mjml: string) {
  return mjml
    .replace(/<mjml[^>]*>/gi, '<div class="templateforge-email">')
    .replace(/<\/mjml>/gi, '</div>')
    .replace(/<mj-body[^>]*>/gi, '<main style="max-width:600px;margin:0 auto;background:#f4f4f5;">')
    .replace(/<\/mj-body>/gi, '</main>')
    .replace(/<mj-section[^>]*>/gi, '<section style="padding:20px 32px;background:#fff;">')
    .replace(/<\/mj-section>/gi, '</section>')
    .replace(/<mj-column[^>]*>/gi, '<div>')
    .replace(/<\/mj-column>/gi, '</div>')
    .replace(/<mj-text[^>]*>/gi, '<p style="font-family:Arial,sans-serif;line-height:1.6;color:#18181b;">')
    .replace(/<\/mj-text>/gi, '</p>')
    .replace(/<mj-button\b([^>]*)href="([^"]+)"[^>]*>/gi, '<a href="$2" style="display:inline-block;border-radius:999px;background:#a7c957;color:#111113;padding:12px 18px;font-weight:700;text-decoration:none;">')
    .replace(/<\/mj-button>/gi, '</a>')
    .replace(/<mj-divider[^>]*\/>/gi, '<hr style="border:0;border-top:1px solid #e4e4e7;" />')
    .replace(/<mj-spacer[^>]*height="([^"]+)"[^>]*\/>/gi, '<div style="height:$1"></div>')
    .replace(/<mj-image\b([^>]*)src="([^"]+)"([^>]*)\/>/gi, '<img src="$2" style="max-width:100%;height:auto;" />');
}

function buildTextFallback(ast: EmailIntentAST) {
  return ast.sections
    .map((section) =>
      [
        section.text,
        stringFromUnknown(section.content?.body),
        section.button?.label && section.button?.href
          ? `${section.button.label}: ${section.button.href}`
          : null,
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .filter(Boolean)
    .join('\n\n')
    .trim() || 'Imported template content.';
}

function inferTemplateName(ast: EmailIntentAST) {
  const firstText =
    ast.sections.find((section) => section.text?.trim())?.text?.trim() ??
    'Imported email template';
  return firstText.slice(0, 70);
}

function inferSubject(ast: EmailIntentAST) {
  return inferTemplateName(ast).slice(0, 120);
}

function inferVariablesFromImportedSource(input: {
  subject: string;
  mjml: string;
  text: string;
}) {
  const refs = extractHandlebarsVariables(
    `${input.subject}\n${input.mjml}\n${input.text}`,
  );
  const variables = [...refs].map((name) => ({
    name,
    type: 'string' as const,
    required: true,
    description: `Imported value for {{${name}}}.`,
    example: inferExampleForVariable(name),
  }));

  return variables.length
    ? variables
    : [
        {
          name: 'recipient_name',
          type: 'string' as const,
          required: true,
          description: 'Recipient name used by the imported template.',
          example: 'Amaka',
        },
      ];
}

function inferSampleVariablesFromVariables(
  variables: ReturnType<typeof inferVariablesFromImportedSource>,
) {
  return Object.fromEntries(
    variables.map((variable) => [
      variable.name,
      variable.example ?? inferExampleForVariable(variable.name),
    ]),
  );
}

function buildImportedTextFallback(mjml: string, ast: EmailIntentAST) {
  const textFromAst = buildTextFallback(ast);
  const textFromMjml = stripHtml(
    mjml
      .replace(/<mj-button\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/mj-button>/gi, '$2: $1')
      .replace(/<\/?mj[^>]*>/gi, ' '),
  );
  return textFromMjml.trim() || textFromAst || 'Imported template content.';
}

function inferExampleForVariable(name: string) {
  if (name.includes('url') || name.includes('link')) {
    return 'https://example.com/action';
  }
  if (name.includes('amount') || name.includes('price')) {
    return 'NGN 45,000';
  }
  if (name.includes('code') || name.includes('otp')) {
    return '482913';
  }
  if (name.includes('email')) {
    return 'amaka@example.com';
  }
  return 'Amaka';
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'imported-template'
  );
}

function escapeText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttribute(value: string) {
  return escapeText(value).replace(/"/g, '&quot;');
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
        Boolean(apiKey) &&
        config.mode === 'SANDBOX' &&
        !apiKey.startsWith('sk_test_');

      if (!apiKey && isDemoMode()) {
        warnings.push(
          'Add a SendByte sandbox API key to preview or deploy templates.',
        );
      } else if (!apiKey) {
        warnings.push(
          `${sendByteConfig.apiKeyEnv} is missing. SendByte deploy is disabled.`,
        );
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
    async deploy({
      template,
      source,
      existingProviderTemplateId,
      config,
      credentials,
    }) {
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

function createSendByteCodeSamples(
  input: ProviderCodeSampleInput,
): TemplateCodeSamples {
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
        description:
          'Send through the SendByte HTTP API from a Python service.',
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
        description:
          'Send the saved template directly from a terminal or CI smoke test.',
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
  const parsed = MarketplaceManifestSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(
      `Marketplace manifest failed contract validation: ${formatZodIssues(parsed.error.issues)}.`,
    );
  }

  return parsed.data;
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
  const parsed = MarketplaceTemplatePackageSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(
      `Marketplace template ${id} failed contract validation: ${formatZodIssues(parsed.error.issues)}.`,
    );
  }

  const template = parsed.data;
  const resolvedTemplate = {
    ...template,
    preview: resolveMarketplacePreviewUrl(
      { ...item, ...template },
      manifestUrl,
    ),
  };

  if (resolvedTemplate.id !== item.id) {
    throw new Error('Marketplace template id does not match the manifest.');
  }

  return { template: resolvedTemplate, sourceUrl };
}

function resolveMarketplaceUrl(value: string, baseUrl: string) {
  return new URL(value, baseUrl).toString();
}

function resolveMarketplacePreviewUrl(
  template: { id: string; version: string; preview: string },
  manifestUrl: string,
) {
  return resolveMarketplaceUrl(template.preview, manifestUrl);
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
  const parsedResult = MarketplaceTemplatePackageSchema.safeParse(value);

  if (!parsedResult.success) {
    throw new Error(
      `Marketplace template package failed contract validation: ${formatZodIssues(parsedResult.error.issues)}.`,
    );
  }

  const parsed = parsedResult.data;

  if (parsed.variables.length === 0) {
    throw new Error('Marketplace templates must include variable contracts.');
  }

  if (Object.keys(parsed.sampleVariables).length === 0) {
    throw new Error('Marketplace templates must include sample variables.');
  }

  const draft = validateTemplateDraft(parsed);
  return { ...parsed, ...draft };
}

function formatZodIssues(issues: Array<{ path: Array<string | number>; message: string }>) {
  return issues
    .map((issue) => {
      const path = issue.path.length ? issue.path.join('.') : 'root';
      return `${path} ${issue.message}`;
    })
    .join('; ');
}

export function validateTemplateDraft(value: unknown): TemplateDraft {
  const parsed = TemplateDraftSchema.parse(value);
  const normalizedMjml = normalizeTemplateMjmlFragment(parsed.mjml);
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
    mjml: normalizedMjml,
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

function extractHandlebarsVariables(input: string) {
  const names = new Set<string>();
  for (const match of input.matchAll(/{{\s*([a-z][a-z0-9_]*)\s*}}/gi)) {
    names.add(match[1]);
  }
  return names;
}

function normalizeTemplateMjmlFragment(input: string) {
  const withoutHead = input.replace(
    /<mj-head\b[^>]*>[\s\S]*?<\/mj-head>/gi,
    '',
  );

  return withoutHead
    .replace(/<\/?mjml[^>]*>/gi, '')
    .replace(/<\/?mj-body[^>]*>/gi, '')
    .trim();
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
  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
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
    },
  );

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
      error instanceof Error
        ? error.message
        : 'OpenRouter draft validation failed.';
    const repairedContent = await requestOpenRouterRepairContent(
      {
        content,
        input,
        model,
        brandContext,
        openRouterApiKey,
      },
      firstError,
    );

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
  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
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
    },
  );

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
  const fenced = extractFencedJsonCandidates(content).map(
    normalizeJsonLikeContent,
  );
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
  const baseUrlEnv =
    stringFromUnknown(configJson.baseUrlEnv) ?? SENDBYTE_BASE_URL_ENV;
  const apiKeyEnv =
    stringFromUnknown(secretEnvJson.apiKey) ?? SENDBYTE_API_KEY_ENV;
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
      ...value.map(
        (item) => `${nextIndent}${toPythonLiteral(item, level + 1)},`,
      ),
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

function renderHandlebarsLite(
  input: string,
  variables: Record<string, unknown>,
) {
  return input.replace(/{{\s*([a-z][a-z0-9_]*)\s*}}/gi, (_, key: string) =>
    String(variables[key] ?? ''),
  );
}

function renderBrandHandlebars(
  input: string,
  variables: Record<string, unknown>,
) {
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
  const rawText = [headerText, template.text, footerText]
    .filter(Boolean)
    .join('\n\n');

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
