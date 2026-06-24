import {
  BrandComponentSchema,
  BrandWorkspaceSchema,
  DashboardSummarySchema,
  GeneratedTemplateResultSchema,
  MarketplaceManifestSchema,
  MarketplaceTemplatePackageSchema,
  ProviderReadinessSchema,
  TemplateCodeSamplesSchema,
  TemplateDeploymentResultSchema,
  TemplateDetailSchema,
  TemplateListItemSchema,
  TemplatePreviewSchema,
} from '@templateforge/shared-types';
import type {
  BrandComponent,
  BrandWorkspace,
  DashboardSummary,
  DeployTemplateInput,
  GenerateTemplateInput,
  GeneratedTemplateResult,
  MarketplaceManifest,
  MarketplaceTemplatePackage,
  ProviderReadiness,
  TemplateCodeSamples,
  TemplateDeploymentResult,
  TemplateDetail,
  TemplateListItem,
  TemplatePreview,
  UpdateBrandProfileInput,
  UpdateTemplateInput,
  UpsertBrandComponentInput,
} from '@templateforge/shared-types';

export interface TemplateForgeApiClientOptions {
  baseUrl?: string;
  fetcher?: typeof fetch;
}

export class TemplateForgeApiClient {
  private readonly baseUrl: string;
  private readonly fetcher: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;

  constructor(options: TemplateForgeApiClientOptions = {}) {
    this.baseUrl =
      options.baseUrl ??
      process.env.NEXT_PUBLIC_API_URL ??
      'http://localhost:4000';
    this.fetcher = options.fetcher
      ? (input, init) =>
          options.fetcher?.(input, init) ?? globalThis.fetch(input, init)
      : (input, init) => globalThis.fetch(input, init);
  }

  async dashboard(): Promise<DashboardSummary> {
    const data = await this.request('/dashboard');
    return DashboardSummarySchema.parse(data);
  }

  async templates(): Promise<TemplateListItem[]> {
    const data = await this.request('/templates');
    return TemplateListItemSchema.array().parse(data);
  }

  async marketplaceTemplates(): Promise<MarketplaceManifest> {
    const data = await this.request('/marketplace/templates');
    return MarketplaceManifestSchema.parse(data);
  }

  async providers(): Promise<ProviderReadiness[]> {
    const data = await this.request('/providers');
    return ProviderReadinessSchema.array().parse(data);
  }

  async marketplaceTemplate(id: string): Promise<MarketplaceTemplatePackage> {
    const data = await this.request(`/marketplace/templates/${id}`);
    return MarketplaceTemplatePackageSchema.parse(data);
  }

  async importMarketplaceTemplate(id: string): Promise<TemplateDetail> {
    const data = await this.request(`/marketplace/templates/${id}/import`, {
      method: 'POST',
    });
    return TemplateDetailSchema.parse(data);
  }

  async brand(): Promise<BrandWorkspace> {
    const data = await this.request('/brand');
    return BrandWorkspaceSchema.parse(data);
  }

  async updateBrandProfile(
    id: string,
    input: UpdateBrandProfileInput,
  ): Promise<BrandWorkspace['profile']> {
    const data = await this.request(`/brand/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return BrandWorkspaceSchema.shape.profile.parse(data);
  }

  async brandComponents(id: string): Promise<BrandComponent[]> {
    const data = await this.request(`/brand/${id}/components`);
    return BrandComponentSchema.array().parse(data);
  }

  async createBrandComponent(
    id: string,
    input: UpsertBrandComponentInput,
  ): Promise<BrandComponent> {
    const data = await this.request(`/brand/${id}/components`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return BrandComponentSchema.parse(data);
  }

  async updateBrandComponent(
    id: string,
    input: UpsertBrandComponentInput,
  ): Promise<BrandComponent> {
    const data = await this.request(`/brand/components/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return BrandComponentSchema.parse(data);
  }

  async setDefaultBrandComponent(id: string): Promise<BrandComponent> {
    const data = await this.request(`/brand/components/${id}/set-default`, {
      method: 'POST',
    });
    return BrandComponentSchema.parse(data);
  }

  async template(id: string): Promise<TemplateDetail> {
    const data = await this.request(`/templates/${id}`);
    return TemplateDetailSchema.parse(data);
  }

  async generateTemplate(
    input: GenerateTemplateInput,
  ): Promise<GeneratedTemplateResult> {
    const data = await this.request('/templates/generate', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return GeneratedTemplateResultSchema.parse(data);
  }

  async updateTemplate(
    id: string,
    input: UpdateTemplateInput,
  ): Promise<TemplateDetail> {
    const data = await this.request(`/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return TemplateDetailSchema.parse(data);
  }

  async previewTemplate(id: string, providerId: string): Promise<TemplatePreview> {
    const data = await this.request(`/templates/${id}/preview/providers/${providerId}`, {
      method: 'POST',
    });
    return TemplatePreviewSchema.parse(data);
  }

  async templateCodeSamples(
    id: string,
    providerId: string,
  ): Promise<TemplateCodeSamples> {
    const data = await this.request(
      `/templates/${id}/code-samples/providers/${providerId}`,
    );
    return TemplateCodeSamplesSchema.parse(data);
  }

  async deployTemplate(
    id: string,
    providerId: string,
    input: DeployTemplateInput = { mode: 'SANDBOX' },
  ): Promise<TemplateDeploymentResult> {
    const data = await this.request(`/templates/${id}/deploy/providers/${providerId}`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return TemplateDeploymentResultSchema.parse(data);
  }

  private async request(path: string, init: RequestInit = {}) {
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init.headers,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message =
        typeof body.message === 'string'
          ? body.message
          : `TemplateForge API request failed: ${response.status}`;
      throw new Error(message);
    }

    return response.json();
  }
}

export function createTemplateForgeApiClient(
  options?: TemplateForgeApiClientOptions,
) {
  return new TemplateForgeApiClient(options);
}
