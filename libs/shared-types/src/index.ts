import { z } from 'zod';

export const templateStatusValues = [
  'DRAFT',
  'READY',
  'DEPLOYED',
  'ARCHIVED',
] as const;

export const deploymentModeValues = ['SANDBOX', 'LIVE'] as const;
export const deploymentStatusValues = [
  'PENDING',
  'SUCCEEDED',
  'FAILED',
] as const;
export const aiGenerationStatusValues = [
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
] as const;
export const brandComponentTypeValues = ['HEADER', 'FOOTER'] as const;
export const assetStatusValues = ['PENDING', 'ACTIVE', 'DELETED'] as const;
export const assetTypeValues = [
  'brand-logo',
  'brand-asset',
  'template-preview',
  'template-export',
  'import-screenshot',
  'header-footer',
  'other',
] as const;
export const storageProviderValues = [
  'managed-r2',
  'r2',
  's3',
  'b2',
  'tigris',
  'custom-s3',
] as const;
export const assetVisibilityValues = ['PUBLIC', 'PRIVATE'] as const;
export const importJobStatusValues = [
  'PENDING',
  'PROCESSING',
  'NEEDS_REVIEW',
  'COMPLETED',
  'FAILED',
] as const;
export const importModeValues = ['BRAND_SHELL', 'BODY', 'FULL_EMAIL'] as const;
export const importConfidenceLevelValues = ['high', 'medium', 'low'] as const;
export const importWarningCodeValues = [
  'UNSUPPORTED_CSS',
  'APPROXIMATED_SPACING',
  'MISSING_ASSET',
  'RAW_BLOCK_PRESERVED',
  'LOW_VISUAL_MATCH',
  'FONT_APPROXIMATED',
  'COMPLEX_TABLE_STRUCTURE',
  'MODEL_UNAVAILABLE',
  'HTML_ONLY',
  'SCREENSHOT_ONLY',
] as const;
export const importWarningSeverityValues = [
  'info',
  'warning',
  'critical',
] as const;
export const emailIntentSectionKindValues = [
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
] as const;
export const providerCapabilityValues = [
  'REMOTE_PREVIEW',
  'TEMPLATE_DEPLOYMENT',
  'CODE_SAMPLES',
] as const;
export const templateVariableTypeValues = [
  'string',
  'number',
  'boolean',
  'array',
  'object',
] as const;
export const templateVariableFormatValues = [
  'url',
  'date',
  'date-time',
  'email',
  'currency',
] as const;

export const TemplateStatusSchema = z.enum(templateStatusValues);
export const DeploymentModeSchema = z.enum(deploymentModeValues);
export const DeploymentStatusSchema = z.enum(deploymentStatusValues);
export const AiGenerationStatusSchema = z.enum(aiGenerationStatusValues);
export const BrandComponentTypeSchema = z.enum(brandComponentTypeValues);
export const AssetStatusSchema = z.enum(assetStatusValues);
export const AssetTypeSchema = z.enum(assetTypeValues);
export const StorageProviderSchema = z.enum(storageProviderValues);
export const AssetVisibilitySchema = z.enum(assetVisibilityValues);
export const ImportJobStatusSchema = z.enum(importJobStatusValues);
export const ImportModeSchema = z.enum(importModeValues);
export const ImportConfidenceLevelSchema = z.enum(importConfidenceLevelValues);
export const ImportWarningCodeSchema = z.enum(importWarningCodeValues);
export const ImportWarningSeveritySchema = z.enum(importWarningSeverityValues);
export const EmailIntentSectionKindSchema = z.enum(
  emailIntentSectionKindValues,
);
export const ProviderCapabilitySchema = z.enum(providerCapabilityValues);
export const TemplateVariableTypeSchema = z.enum(templateVariableTypeValues);
export const TemplateVariableFormatSchema = z.enum(
  templateVariableFormatValues,
);

export type TemplateStatus = z.infer<typeof TemplateStatusSchema>;
export type DeploymentMode = z.infer<typeof DeploymentModeSchema>;
export type DeploymentStatus = z.infer<typeof DeploymentStatusSchema>;
export type AiGenerationStatus = z.infer<typeof AiGenerationStatusSchema>;
export type BrandComponentType = z.infer<typeof BrandComponentTypeSchema>;
export type AssetStatus = z.infer<typeof AssetStatusSchema>;
export type AssetType = z.infer<typeof AssetTypeSchema>;
export type StorageProvider = z.infer<typeof StorageProviderSchema>;
export type AssetVisibility = z.infer<typeof AssetVisibilitySchema>;
export type ImportJobStatus = z.infer<typeof ImportJobStatusSchema>;
export type ImportMode = z.infer<typeof ImportModeSchema>;
export type ImportConfidenceLevel = z.infer<typeof ImportConfidenceLevelSchema>;
export type ImportWarningCode = z.infer<typeof ImportWarningCodeSchema>;
export type ImportWarningSeverity = z.infer<typeof ImportWarningSeveritySchema>;
export type EmailIntentSectionKind = z.infer<
  typeof EmailIntentSectionKindSchema
>;
export type ProviderCapability = z.infer<typeof ProviderCapabilitySchema>;
export type TemplateVariableType = z.infer<typeof TemplateVariableTypeSchema>;
export type TemplateVariableFormat = z.infer<
  typeof TemplateVariableFormatSchema
>;

const ProviderIdSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use kebab-case provider ids.');

export const EmailProviderSchema = z.object({
  id: ProviderIdSchema,
  displayName: z.string().min(1),
  enabled: z.boolean(),
  isDefault: z.boolean(),
  mode: DeploymentModeSchema,
  capabilities: z.array(ProviderCapabilitySchema),
});

export const ProviderReadinessSchema = EmailProviderSchema.extend({
  configured: z.boolean(),
  warnings: z.array(z.string()).default([]),
  config: z.record(z.unknown()).default({}),
});

export type EmailProvider = z.infer<typeof EmailProviderSchema>;
export type ProviderReadiness = z.infer<typeof ProviderReadinessSchema>;

export const TemplateVariableSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .regex(/^[a-z][a-z0-9_]*$/, 'Use snake_case variable names.'),
    type: TemplateVariableTypeSchema.default('string'),
    format: TemplateVariableFormatSchema.optional(),
    required: z.boolean().default(true),
    description: z.string().min(1),
    example: z.unknown().optional(),
  })
  .refine((variable) => !variable.format || variable.type === 'string', {
    path: ['format'],
    message: 'Variable formats require type string.',
  });

export const BrandProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  productName: z.string(),
  website: z.string().nullable(),
  logoUrl: z.string().nullable(),
  primaryColor: z.string(),
  accentColor: z.string(),
  tone: z.string(),
  footerText: z.string().nullable(),
});

export const UpdateBrandProfileInputSchema = z.object({
  name: z.string().min(1).optional(),
  productName: z.string().min(1).optional(),
  website: z.string().url().optional().or(z.literal('')).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')).optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  tone: z.string().min(1).optional(),
  footerText: z.string().optional(),
});

export const BrandComponentSchema = z.object({
  id: z.string(),
  brandProfileId: z.string(),
  name: z.string(),
  type: BrandComponentTypeSchema,
  mjml: z.string(),
  text: z.string(),
  isDefault: z.boolean(),
  updatedAt: z.string(),
});

export const UpsertBrandComponentInputSchema = z.object({
  name: z.string().min(1),
  type: BrandComponentTypeSchema,
  mjml: z.string().min(1),
  text: z.string().min(1),
  isDefault: z.boolean().optional(),
});

export const BrandWorkspaceSchema = z.object({
  profile: BrandProfileSchema,
  components: z.array(BrandComponentSchema),
});

const NullableStringSchema = z.string().nullable();

export const AssetSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  storageProvider: StorageProviderSchema,
  storageConnectionId: NullableStringSchema.default(null),
  bucket: z.string(),
  objectKey: z.string(),
  publicUrl: NullableStringSchema.default(null),
  filename: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  assetType: AssetTypeSchema,
  visibility: AssetVisibilitySchema.default('PRIVATE'),
  status: AssetStatusSchema.default('PENDING'),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PresignedUploadInputSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  assetType: AssetTypeSchema,
  visibility: AssetVisibilitySchema.default('PRIVATE'),
});

export const PresignedUploadResultSchema = z.object({
  assetId: z.string(),
  uploadUrl: z.string(),
  method: z.enum(['PUT', 'POST']),
  objectKey: z.string(),
  publicUrl: z.string().optional(),
  headers: z.record(z.string()).default({}),
});

export const CompleteUploadInputSchema = z.object({
  assetId: z.string().min(1),
  objectKey: z.string().min(1),
  publicUrl: z.string().url().optional().or(z.literal('')).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const ImportImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().default(''),
  width: z.number().optional(),
  height: z.number().optional(),
});

const ImportButtonSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1).default('#'),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
});

export type EmailIntentSection = {
  id?: string;
  kind: EmailIntentSectionKind;
  label?: string;
  text?: string;
  html?: string;
  styles?: Record<string, unknown>;
  content?: Record<string, unknown>;
  image?: z.infer<typeof ImportImageSchema>;
  button?: z.infer<typeof ImportButtonSchema>;
  children?: EmailIntentSection[];
};

export const EmailIntentSectionSchema: z.ZodType<EmailIntentSection> = z.lazy(
  () =>
    z.object({
      id: z.string().optional(),
      kind: EmailIntentSectionKindSchema,
      label: z.string().optional(),
      text: z.string().optional(),
      html: z.string().optional(),
      styles: z.record(z.unknown()).default({}),
      content: z.record(z.unknown()).default({}),
      image: ImportImageSchema.optional(),
      button: ImportButtonSchema.optional(),
      children: z.array(EmailIntentSectionSchema).default([]),
    }),
) as z.ZodType<EmailIntentSection>;

export const EmailIntentAstSchema = z.object({
  type: z.literal('email'),
  width: z.number().int().min(320).max(960).default(600),
  backgroundColor: z.string().optional(),
  brandShellId: z.string().optional(),
  sections: z.array(EmailIntentSectionSchema),
  warnings: z.array(z.string()).default([]),
});

export const ImportWarningSchema = z.object({
  code: ImportWarningCodeSchema,
  message: z.string().min(1),
  severity: ImportWarningSeveritySchema,
  sectionId: z.string().optional(),
});

export const ImportConfidenceSchema = z.object({
  score: z.number().int().min(0).max(100),
  level: ImportConfidenceLevelSchema,
  reasons: z.array(z.string()).default([]),
});

export const BrandHintsSchema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  fontFamily: z.string().optional(),
  logoUrl: z.string().optional(),
  emailWidth: z.number().int().min(320).max(960).optional(),
  borderRadius: z.number().int().min(0).max(64).optional(),
  buttonStyle: z
    .object({
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
      borderRadius: z.number().int().min(0).max(64).optional(),
      padding: z.string().optional(),
    })
    .optional(),
});

export const ImportInputSchema = z.object({
  html: z.string().optional(),
  screenshotAssetId: z.string().optional(),
  headerHtml: z.string().optional(),
  footerHtml: z.string().optional(),
  headerScreenshotAssetId: z.string().optional(),
  footerScreenshotAssetId: z.string().optional(),
  brandShellId: z.string().optional(),
  brandHints: BrandHintsSchema.default({}),
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  category: z.string().min(1).default('transactional'),
});

export const BrandShellSchema = z.object({
  id: z.string(),
  brandProfileId: z.string(),
  name: z.string(),
  logoUrl: NullableStringSchema.default(null),
  emailWidth: z.number().int(),
  colors: z.record(z.unknown()).default({}),
  typography: z.record(z.unknown()).default({}),
  button: z.record(z.unknown()).default({}),
  headerComponentId: NullableStringSchema.default(null),
  footerComponentId: NullableStringSchema.default(null),
  headerIntent: EmailIntentAstSchema.nullable().default(null),
  footerIntent: EmailIntentAstSchema.nullable().default(null),
  sourceAssetIds: z.array(z.string()).default([]),
  confidence: ImportConfidenceSchema.nullable().default(null),
  warnings: z.array(ImportWarningSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ImportJobSchema = z.object({
  id: z.string(),
  status: ImportJobStatusSchema,
  mode: ImportModeSchema,
  brandShellId: NullableStringSchema.default(null),
  input: ImportInputSchema,
  simplifiedDom: z.record(z.unknown()).nullable().default(null),
  intentAst: EmailIntentAstSchema.nullable().default(null),
  mjml: NullableStringSchema.default(null),
  renderedHtml: NullableStringSchema.default(null),
  originalPreviewUrl: NullableStringSchema.default(null),
  renderedPreviewUrl: NullableStringSchema.default(null),
  confidence: ImportConfidenceSchema.nullable().default(null),
  warnings: z.array(ImportWarningSchema).default([]),
  error: NullableStringSchema.default(null),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const TemplateDraftSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use kebab-case slugs.'),
  category: z.string().min(1),
  subject: z.string().min(1).max(998),
  mjml: z.string().min(1),
  text: z.string().min(1),
  variables: z.array(TemplateVariableSchema),
  sampleVariables: z.record(z.unknown()),
  tags: z.array(z.string().min(1)).default([]),
  warnings: z.array(z.string()).default([]),
});

export const MarketplaceTemplatePackageSchema = TemplateDraftSchema.extend({
  schemaVersion: z.string().min(1),
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use kebab-case marketplace ids.'),
  version: z.string().min(1),
  description: z.string().min(1),
  useCase: z.string().min(1),
  preview: z.string().min(1),
  author: z.string().min(1),
  license: z.string().min(1),
}).strict();

export const MarketplaceTemplateManifestItemSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use kebab-case marketplace ids.'),
    version: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    category: z.string().min(1),
    tags: z.array(z.string().min(1)).default([]),
    author: z.string().min(1).optional(),
    license: z.string().min(1).optional(),
    useCase: z.string().min(1).optional(),
    url: z.string().min(1),
    preview: z.string().min(1),
    installedTemplateId: z.string().nullable().default(null),
    installedVersion: z.string().nullable().default(null),
  })
  .strict();

export const MarketplacePackDefinitionSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use kebab-case pack ids.'),
    name: z.string().min(1),
    description: z.string().min(1),
    category: z.string().min(1),
    tags: z.array(z.string().min(1)).default([]),
    templateIds: z.array(MarketplaceTemplateManifestItemSchema.shape.id).min(1),
  })
  .strict();

export const MarketplaceManifestSchema = z.object({
  schemaVersion: z.string().min(1),
  templates: z.array(MarketplaceTemplateManifestItemSchema),
  packs: z.array(MarketplacePackDefinitionSchema).default([]),
});

export const MarketplacePackSchema = z
  .object({
    ...MarketplacePackDefinitionSchema.shape,
    templates: z.array(MarketplaceTemplateManifestItemSchema),
    installedCount: z.number().int().nonnegative(),
    totalCount: z.number().int().positive(),
    hasConflicts: z.boolean(),
  })
  .strict();

export const MarketplacePackManifestSchema = z.object({
  schemaVersion: z.string().min(1),
  packs: z.array(MarketplacePackSchema),
});

export const MarketplacePackInstallInputSchema = z.object({
  overwrite: z.boolean().default(false),
});

export const MarketplacePackInstallItemSchema = z.object({
  marketplaceTemplateId: MarketplaceTemplateManifestItemSchema.shape.id,
  name: z.string().min(1),
  status: z.enum(['created', 'overwritten', 'skipped', 'failed']),
  templateId: z.string().nullable().default(null),
  error: z.string().nullable().default(null),
});

export const MarketplacePackInstallResultSchema = z.object({
  packId: MarketplacePackSchema.shape.id,
  packName: z.string().min(1),
  overwrite: z.boolean(),
  created: z.number().int().nonnegative(),
  overwritten: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  items: z.array(MarketplacePackInstallItemSchema),
});

export const GenerateTemplateInputSchema = z.object({
  useCase: z.string().min(4),
  productName: z.string().min(1),
  audience: z.string().min(1),
  tone: z.string().min(1).default('clear, helpful, developer-friendly'),
  category: z.string().min(1).default('transactional'),
  variableHints: z.string().optional(),
  brandProfileId: z.string().optional(),
  headerComponentId: z.string().optional(),
  footerComponentId: z.string().optional(),
});

export const UpdateTemplateInputSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  status: TemplateStatusSchema.optional(),
  subject: z.string().min(1).max(998).optional(),
  mjml: z.string().min(1).optional(),
  text: z.string().min(1).optional(),
  variables: z.array(TemplateVariableSchema).optional(),
  sampleVariables: z.record(z.unknown()).optional(),
  tags: z.array(z.string().min(1)).optional(),
  headerComponentId: z.string().nullable().optional(),
  footerComponentId: z.string().nullable().optional(),
  changeNote: z.string().optional(),
});

export const TemplatePreviewSchema = z.object({
  subject: z.string(),
  html: z.string().nullable(),
  text: z.string().nullable(),
  warnings: z.array(z.string()).default([]),
});

export const DeployTemplateInputSchema = z.object({
  mode: DeploymentModeSchema.default('SANDBOX'),
});

export const TemplateDeploymentResultSchema = z.object({
  id: z.string(),
  provider: ProviderIdSchema,
  status: DeploymentStatusSchema,
  mode: DeploymentModeSchema,
  providerTemplateId: z.string().nullable(),
  error: z.string().nullable(),
  warnings: z.array(z.string()).default([]),
  createdAt: z.string(),
});

export const TemplateCodeSampleSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  language: z.string().min(1),
  installCommand: z.string().nullable().default(null),
  description: z.string().min(1),
  code: z.string().min(1),
});

export const TemplateCodeSamplesSchema = z.object({
  templateId: z.string(),
  provider: ProviderIdSchema,
  providerName: z.string().min(1),
  providerTemplateId: z.string().nullable(),
  samples: z.array(TemplateCodeSampleSchema),
  warnings: z.array(z.string()).default([]),
});

export const TemplateListItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  category: z.string(),
  status: TemplateStatusSchema,
  subject: z.string(),
  tags: z.array(z.string()),
  updatedAt: z.string(),
  latestDeploymentStatus: DeploymentStatusSchema.nullable(),
  latestDeploymentProvider: ProviderIdSchema.nullable(),
});

export const TemplateDetailSchema = TemplateListItemSchema.extend({
  mjml: z.string(),
  text: z.string(),
  variables: z.array(TemplateVariableSchema),
  sampleVariables: z.record(z.unknown()),
  brandProfile: BrandProfileSchema.nullable(),
  headerComponent: BrandComponentSchema.nullable(),
  footerComponent: BrandComponentSchema.nullable(),
  versions: z.array(
    z.object({
      id: z.string(),
      version: z.number(),
      headerComponentId: z.string().nullable(),
      footerComponentId: z.string().nullable(),
      changeNote: z.string().nullable(),
      createdAt: z.string(),
    }),
  ),
  deployments: z.array(TemplateDeploymentResultSchema),
});

export const GeneratedTemplateResultSchema = z.object({
  template: TemplateDetailSchema,
  generationRunId: z.string(),
  warnings: z.array(z.string()),
});

export const EnvReadinessSchema = z.object({
  demoMode: z.boolean().default(false),
  aiProvider: z.enum(['openrouter', 'cencori']).default('openrouter'),
  aiProviderDisplayName: z.string().default('OpenRouter'),
  aiConfigured: z.boolean().default(false),
  aiModel: z.string().default('openrouter/auto'),
  aiApiKeyEnv: z.string().default('OPENROUTER_API_KEY'),
  openRouterConfigured: z.boolean(),
  openRouterModel: z.string(),
  providers: z.array(ProviderReadinessSchema),
  warnings: z.array(z.string()),
});

export const DashboardSummarySchema = z.object({
  templateCount: z.number(),
  readyCount: z.number(),
  deployedCount: z.number(),
  recentTemplates: z.array(TemplateListItemSchema),
  recentGenerations: z.array(
    z.object({
      id: z.string(),
      status: AiGenerationStatusSchema,
      model: z.string(),
      templateName: z.string().nullable(),
      createdAt: z.string(),
    }),
  ),
  recentDeployments: z.array(
    TemplateDeploymentResultSchema.extend({ templateName: z.string() }),
  ),
  env: EnvReadinessSchema,
});

export type TemplateVariable = z.infer<typeof TemplateVariableSchema>;
export type BrandProfile = z.infer<typeof BrandProfileSchema>;
export type UpdateBrandProfileInput = z.infer<
  typeof UpdateBrandProfileInputSchema
>;
export type BrandComponent = z.infer<typeof BrandComponentSchema>;
export type UpsertBrandComponentInput = z.infer<
  typeof UpsertBrandComponentInputSchema
>;
export type BrandWorkspace = z.infer<typeof BrandWorkspaceSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type PresignedUploadInput = z.infer<typeof PresignedUploadInputSchema>;
export type PresignedUploadResult = z.infer<typeof PresignedUploadResultSchema>;
export type CompleteUploadInput = z.infer<typeof CompleteUploadInputSchema>;
export type BrandHints = z.infer<typeof BrandHintsSchema>;
export type EmailIntentAST = z.infer<typeof EmailIntentAstSchema>;
export type ImportWarning = z.infer<typeof ImportWarningSchema>;
export type ImportConfidence = z.infer<typeof ImportConfidenceSchema>;
export type ImportInput = z.infer<typeof ImportInputSchema>;
export type BrandShell = z.infer<typeof BrandShellSchema>;
export type ImportJob = z.infer<typeof ImportJobSchema>;
export type TemplateDraft = z.infer<typeof TemplateDraftSchema>;
export type MarketplaceTemplatePackage = z.infer<
  typeof MarketplaceTemplatePackageSchema
>;
export type MarketplaceTemplateManifestItem = z.infer<
  typeof MarketplaceTemplateManifestItemSchema
>;
export type MarketplaceManifest = z.infer<typeof MarketplaceManifestSchema>;
export type MarketplacePackDefinition = z.infer<
  typeof MarketplacePackDefinitionSchema
>;
export type MarketplacePack = z.infer<typeof MarketplacePackSchema>;
export type MarketplacePackManifest = z.infer<
  typeof MarketplacePackManifestSchema
>;
export type MarketplacePackInstallInput = z.infer<
  typeof MarketplacePackInstallInputSchema
>;
export type MarketplacePackInstallResult = z.infer<
  typeof MarketplacePackInstallResultSchema
>;
export type GenerateTemplateInput = z.infer<typeof GenerateTemplateInputSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateInputSchema>;
export type TemplatePreview = z.infer<typeof TemplatePreviewSchema>;
export type DeployTemplateInput = z.infer<typeof DeployTemplateInputSchema>;
export type TemplateDeploymentResult = z.infer<
  typeof TemplateDeploymentResultSchema
>;
export type TemplateCodeSample = z.infer<typeof TemplateCodeSampleSchema>;
export type TemplateCodeSamples = z.infer<typeof TemplateCodeSamplesSchema>;
export type TemplateListItem = z.infer<typeof TemplateListItemSchema>;
export type TemplateDetail = z.infer<typeof TemplateDetailSchema>;
export type GeneratedTemplateResult = z.infer<
  typeof GeneratedTemplateResultSchema
>;
export type EnvReadiness = z.infer<typeof EnvReadinessSchema>;
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
