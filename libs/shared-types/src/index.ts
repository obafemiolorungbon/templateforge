import { z } from 'zod';

export const templateStatusValues = [
  'DRAFT',
  'READY',
  'DEPLOYED',
  'ARCHIVED',
] as const;

export const deploymentModeValues = ['SANDBOX', 'LIVE'] as const;
export const deploymentStatusValues = ['PENDING', 'SUCCEEDED', 'FAILED'] as const;
export const aiGenerationStatusValues = ['RUNNING', 'SUCCEEDED', 'FAILED'] as const;
export const brandComponentTypeValues = ['HEADER', 'FOOTER'] as const;
export const providerCapabilityValues = [
  'REMOTE_PREVIEW',
  'TEMPLATE_DEPLOYMENT',
  'CODE_SAMPLES',
] as const;

export const TemplateStatusSchema = z.enum(templateStatusValues);
export const DeploymentModeSchema = z.enum(deploymentModeValues);
export const DeploymentStatusSchema = z.enum(deploymentStatusValues);
export const AiGenerationStatusSchema = z.enum(aiGenerationStatusValues);
export const BrandComponentTypeSchema = z.enum(brandComponentTypeValues);
export const ProviderCapabilitySchema = z.enum(providerCapabilityValues);

export type TemplateStatus = z.infer<typeof TemplateStatusSchema>;
export type DeploymentMode = z.infer<typeof DeploymentModeSchema>;
export type DeploymentStatus = z.infer<typeof DeploymentStatusSchema>;
export type AiGenerationStatus = z.infer<typeof AiGenerationStatusSchema>;
export type BrandComponentType = z.infer<typeof BrandComponentTypeSchema>;
export type ProviderCapability = z.infer<typeof ProviderCapabilitySchema>;

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

export const TemplateVariableSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9_]*$/, 'Use snake_case variable names.'),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']).default('string'),
  required: z.boolean().default(true),
  description: z.string().min(1),
  example: z.unknown().optional(),
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
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
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
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use kebab-case marketplace ids.'),
  version: z.string().min(1),
  description: z.string().min(1),
  author: z.string().min(1).optional(),
  license: z.string().min(1).optional(),
});

export const MarketplaceTemplateManifestItemSchema = z.object({
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
  url: z.string().min(1),
  installedTemplateId: z.string().nullable().default(null),
  installedVersion: z.string().nullable().default(null),
});

export const MarketplaceManifestSchema = z.object({
  schemaVersion: z.string().min(1),
  templates: z.array(MarketplaceTemplateManifestItemSchema),
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
  recentDeployments: z.array(TemplateDeploymentResultSchema.extend({ templateName: z.string() })),
  env: EnvReadinessSchema,
});

export type TemplateVariable = z.infer<typeof TemplateVariableSchema>;
export type BrandProfile = z.infer<typeof BrandProfileSchema>;
export type UpdateBrandProfileInput = z.infer<typeof UpdateBrandProfileInputSchema>;
export type BrandComponent = z.infer<typeof BrandComponentSchema>;
export type UpsertBrandComponentInput = z.infer<typeof UpsertBrandComponentInputSchema>;
export type BrandWorkspace = z.infer<typeof BrandWorkspaceSchema>;
export type TemplateDraft = z.infer<typeof TemplateDraftSchema>;
export type MarketplaceTemplatePackage = z.infer<
  typeof MarketplaceTemplatePackageSchema
>;
export type MarketplaceTemplateManifestItem = z.infer<
  typeof MarketplaceTemplateManifestItemSchema
>;
export type MarketplaceManifest = z.infer<typeof MarketplaceManifestSchema>;
export type GenerateTemplateInput = z.infer<typeof GenerateTemplateInputSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateInputSchema>;
export type TemplatePreview = z.infer<typeof TemplatePreviewSchema>;
export type DeployTemplateInput = z.infer<typeof DeployTemplateInputSchema>;
export type TemplateDeploymentResult = z.infer<typeof TemplateDeploymentResultSchema>;
export type TemplateCodeSample = z.infer<typeof TemplateCodeSampleSchema>;
export type TemplateCodeSamples = z.infer<typeof TemplateCodeSamplesSchema>;
export type TemplateListItem = z.infer<typeof TemplateListItemSchema>;
export type TemplateDetail = z.infer<typeof TemplateDetailSchema>;
export type GeneratedTemplateResult = z.infer<typeof GeneratedTemplateResultSchema>;
export type EnvReadiness = z.infer<typeof EnvReadinessSchema>;
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
