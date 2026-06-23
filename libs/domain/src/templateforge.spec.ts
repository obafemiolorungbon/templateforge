import {
  deployTemplate,
  generateTemplate,
  importMarketplaceTemplate,
  listEmailProviders,
  listMarketplaceTemplates,
  previewTemplate,
  validateTemplateDraft,
} from './index';

const baseTemplate = {
  id: 'tpl_1',
  slug: 'receipt-ready',
  name: 'Receipt ready',
  category: 'receipt',
  status: 'READY',
  subject: 'Receipt for {{amount}}',
  mjml: '<mjml><mj-body><mj-section><mj-column><mj-text>Hi {{first_name}}</mj-text></mj-column></mj-section></mj-body></mjml>',
  text: 'Hi {{first_name}}, your receipt for {{amount}} is ready.',
  variables: [
    {
      name: 'first_name',
      type: 'string',
      required: true,
      description: 'Recipient first name.',
    },
    {
      name: 'amount',
      type: 'string',
      required: true,
      description: 'Receipt amount.',
    },
  ],
  sampleVariables: { first_name: 'Amaka', amount: 'NGN 45,000' },
  tags: ['receipt'],
  createdAt: new Date('2026-06-22T10:00:00Z'),
  updatedAt: new Date('2026-06-22T10:00:00Z'),
  brandProfile: {
    id: 'brand_templateforge_default',
    name: 'TemplateForge',
    productName: 'TemplateForge',
    website: 'https://templateforge.local',
    logoUrl: null,
    primaryColor: '#A7C957',
    accentColor: '#D65F4A',
    tone: 'clear',
    footerText: 'TemplateForge footer',
  },
  headerComponent: {
    id: 'component_header',
    brandProfileId: 'brand_templateforge_default',
    name: 'Default product header',
    type: 'HEADER',
    mjml: '<mj-section><mj-column><mj-text color="{{brand_primary_color}}">{{brand_product_name}}</mj-text></mj-column></mj-section>',
    text: '{{brand_product_name}}',
    isDefault: true,
    updatedAt: new Date('2026-06-22T10:00:00Z'),
  },
  footerComponent: {
    id: 'component_footer',
    brandProfileId: 'brand_templateforge_default',
    name: 'Default legal footer',
    type: 'FOOTER',
    mjml: '<mj-section><mj-column><mj-text color="{{brand_accent_color}}">{{brand_footer_text}}</mj-text></mj-column></mj-section>',
    text: '{{brand_footer_text}}',
    isDefault: true,
    updatedAt: new Date('2026-06-22T10:00:00Z'),
  },
  versions: [
    {
      id: 'ver_1',
      version: 1,
      headerComponentId: null,
      footerComponentId: null,
      changeNote: 'Initial',
      createdAt: new Date('2026-06-22T10:00:00Z'),
    },
  ],
  deployments: [],
};

function dbMock(template = baseTemplate): any {
  return {
    templateProject: {
      upsert: jest.fn().mockResolvedValue({ id: 'project_templateforge_local' }),
    },
    brandProfile: {
      upsert: jest.fn().mockResolvedValue({ id: 'brand_templateforge_default' }),
      findFirst: jest.fn().mockResolvedValue({ id: 'brand_templateforge_default' }),
      update: jest.fn().mockResolvedValue({ id: 'brand_templateforge_default' }),
    },
    brandComponent: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 'component_1',
        brandProfileId: 'brand_templateforge_default',
        name: 'Default product header',
        type: 'HEADER',
        mjml: '<mj-section></mj-section>',
        text: 'Header',
        isDefault: true,
        updatedAt: new Date('2026-06-22T10:00:00Z'),
      }),
      update: jest.fn().mockResolvedValue({
        id: 'component_1',
        brandProfileId: 'brand_templateforge_default',
        name: 'Default product header',
        type: 'HEADER',
        mjml: '<mj-section></mj-section>',
        text: 'Header',
        isDefault: true,
        updatedAt: new Date('2026-06-22T10:00:00Z'),
      }),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    emailTemplate: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(template),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(template),
      update: jest.fn().mockResolvedValue(template),
    },
    templateVersion: {
      create: jest.fn().mockResolvedValue({ id: 'ver_2' }),
    },
    templateDeployment: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({
        id: 'dep_1',
        templateId: 'tpl_1',
        provider: 'sendbyte',
        mode: 'SANDBOX',
        status: 'PENDING',
        providerTemplateId: null,
        error: null,
        createdAt: new Date('2026-06-22T10:05:00Z'),
      }),
      update: jest.fn().mockResolvedValue({
        id: 'dep_1',
        templateId: 'tpl_1',
        provider: 'sendbyte',
        mode: 'SANDBOX',
        status: 'SUCCEEDED',
        providerTemplateId: 'tpl_sendbyte_1',
        error: null,
        createdAt: new Date('2026-06-22T10:05:00Z'),
      }),
    },
    templateProviderLink: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({
        id: 'provider_link_1',
        templateId: 'tpl_1',
        provider: 'sendbyte',
        providerTemplateId: 'tpl_sendbyte_1',
      }),
    },
    emailProviderConfig: {
      upsert: jest.fn().mockResolvedValue({
        providerId: 'sendbyte',
      }),
      findMany: jest.fn().mockResolvedValue([
        {
          providerId: 'sendbyte',
          displayName: 'SendByte',
          enabled: true,
          isDefault: true,
          mode: 'SANDBOX',
          configJson: {
            baseUrlEnv: 'TEMPLATEFORGE_SENDBYTE_BASE_URL',
            defaultBaseUrl: 'https://api.sendbyte.africa',
          },
          secretEnvJson: {
            apiKey: 'TEMPLATEFORGE_SENDBYTE_API_KEY',
          },
        },
      ]),
      findFirst: jest.fn().mockResolvedValue({
        providerId: 'sendbyte',
        displayName: 'SendByte',
        enabled: true,
        isDefault: true,
        mode: 'SANDBOX',
        configJson: {
          baseUrlEnv: 'TEMPLATEFORGE_SENDBYTE_BASE_URL',
          defaultBaseUrl: 'https://api.sendbyte.africa',
        },
        secretEnvJson: {
          apiKey: 'TEMPLATEFORGE_SENDBYTE_API_KEY',
        },
      }),
    },
    templateMarketplaceInstall: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({
        id: 'market_install_1',
        templateId: 'tpl_1',
        marketplaceTemplateId: 'welcome-account',
        marketplaceVersion: '1.0.0',
        sourceUrl:
          'https://cdn.jsdelivr.net/gh/example/templateforge-marketplace@main/templates/welcome-account@1.0.0.json',
        installedAt: new Date('2026-06-22T10:05:00Z'),
      }),
    },
    aiGenerationRun: {
      create: jest.fn().mockResolvedValue({ id: 'run_1' }),
      update: jest.fn().mockResolvedValue({ id: 'run_1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    actionLog: {
      create: jest.fn().mockResolvedValue({ id: 'log_1' }),
    },
    $transaction: jest.fn(async (callback: (tx: any) => Promise<any>) =>
      callback(dbMock(template)),
    ),
  } as any;
}

describe('TemplateForge domain', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.TEMPLATEFORGE_SENDBYTE_API_KEY;
    delete process.env.TEMPLATEFORGE_SENDBYTE_BASE_URL;
    delete process.env.TEMPLATEFORGE_MARKETPLACE_MANIFEST_URL;
    global.fetch = jest.fn() as any;
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it('rejects unsafe triple-brace Handlebars output', () => {
    expect(() =>
      validateTemplateDraft({
        name: 'Unsafe',
        slug: 'unsafe-template',
        category: 'alert',
        subject: 'Hi {{{name}}}',
        mjml: '<mjml><mj-body></mj-body></mjml>',
        text: 'Hi {{name}}',
        variables: [],
        sampleVariables: { name: 'Amaka' },
        tags: [],
        warnings: [],
      }),
    ).toThrow('Triple-brace');
  });

  it('adds missing variable contracts for referenced variables', () => {
    const draft = validateTemplateDraft({
      name: 'Receipt',
      slug: 'receipt-template',
      category: 'receipt',
      subject: 'Receipt for {{amount}}',
      mjml: '<mjml><mj-body><mj-text>{{first_name}}</mj-text></mj-body></mjml>',
      text: 'Hi {{first_name}}, receipt {{amount}}.',
      variables: [],
      sampleVariables: { first_name: 'Amaka', amount: 'NGN 45,000' },
      tags: [],
      warnings: [],
    });

    expect(draft.variables.map((variable) => variable.name).sort()).toEqual([
      'amount',
      'first_name',
    ]);
  });

  it('rejects duplicate variable contracts', () => {
    expect(() =>
      validateTemplateDraft({
        name: 'Duplicate variables',
        slug: 'duplicate-variables',
        category: 'receipt',
        subject: 'Receipt for {{amount}}',
        mjml: '<mjml><mj-body><mj-text>{{amount}}</mj-text></mj-body></mjml>',
        text: 'Receipt for {{amount}}.',
        variables: [
          {
            name: 'amount',
            type: 'string',
            required: true,
            description: 'Receipt amount.',
          },
          {
            name: 'amount',
            type: 'string',
            required: true,
            description: 'Duplicate receipt amount.',
          },
        ],
        sampleVariables: { amount: 'NGN 45,000' },
        tags: [],
        warnings: [],
      }),
    ).toThrow('Duplicate variable');
  });

  it('does not save a template when OpenRouter is not configured', async () => {
    const db = dbMock();

    await expect(
      generateTemplate(
        {
          useCase: 'Send a receipt after payment.',
          productName: 'PayLink Ledger',
          audience: 'Developers',
          tone: 'clear',
          category: 'receipt',
        },
        db,
      ),
    ).rejects.toThrow('OPENROUTER_API_KEY');

    expect(db.aiGenerationRun.create).toHaveBeenCalled();
    expect(db.aiGenerationRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED' }),
      }),
    );
    expect(db.emailTemplate.create).not.toHaveBeenCalled();
    expect(db.actionLog.create).toHaveBeenCalled();
  });

  it('renders a local preview fallback when the selected provider is not configured', async () => {
    const preview = await previewTemplate('tpl_1', 'sendbyte', dbMock());

    expect(preview.subject).toBe('Receipt for NGN 45,000');
    expect(preview.text).toContain('Amaka');
    expect(preview.warnings[0]).toContain('TEMPLATEFORGE_SENDBYTE_API_KEY');
  });

  it('deploys through the SendByte adapter with bearer auth and records deployment history', async () => {
    process.env.TEMPLATEFORGE_SENDBYTE_API_KEY = 'sk_test_123';
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'tpl_sendbyte_1', version: 1 }),
    });
    const db = dbMock();

    const result = await deployTemplate('tpl_1', 'sendbyte', 'SANDBOX', db);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.sendbyte.africa/v1/templates',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          authorization: 'Bearer sk_test_123',
        }),
      }),
    );
    expect(result.status).toBe('SUCCEEDED');
    expect(db.templateDeployment.create).toHaveBeenCalled();
    expect(db.emailTemplate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'DEPLOYED' }),
      }),
    );
    expect(db.templateProviderLink.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          provider: 'sendbyte',
          providerTemplateId: 'tpl_sendbyte_1',
        }),
      }),
    );
  });

  it('pre-renders brand variables before provider preview validates MJML', async () => {
    process.env.TEMPLATEFORGE_SENDBYTE_API_KEY = 'sk_test_123';
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        subject: 'Receipt for NGN 45,000',
        html: '<p>preview</p>',
        text: 'preview',
      }),
    });

    await previewTemplate('tpl_1', 'sendbyte', dbMock());

    const request = (global.fetch as jest.Mock).mock.calls[0][1];
    const body = JSON.parse(request.body);
    expect(body.mjml).toContain('color="#A7C957"');
    expect(body.mjml).toContain('color="#D65F4A"');
    expect(body.mjml).not.toContain('{{brand_primary_color}}');
    expect(body.mjml).not.toContain('{{brand_accent_color}}');
    expect(body.mjml).toContain('{{first_name}}');
    expect(body.subject).toContain('{{amount}}');
  });

  it('reports configured provider readiness', async () => {
    process.env.TEMPLATEFORGE_SENDBYTE_API_KEY = 'sk_test_123';

    const providers = await listEmailProviders(dbMock());

    expect(providers[0]).toEqual(
      expect.objectContaining({
        id: 'sendbyte',
        displayName: 'SendByte',
        configured: true,
        capabilities: ['REMOTE_PREVIEW', 'TEMPLATE_DEPLOYMENT'],
      }),
    );
  });

  it('lists marketplace templates with install state', async () => {
    process.env.TEMPLATEFORGE_MARKETPLACE_MANIFEST_URL =
      'https://cdn.jsdelivr.net/gh/example/templateforge-marketplace@main/manifest.json';
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        schemaVersion: '1.0',
        templates: [
          {
            id: 'welcome-account',
            version: '1.0.0',
            name: 'Welcome account',
            description: 'A welcome email.',
            category: 'onboarding',
            tags: ['welcome'],
            url: 'templates/welcome-account@1.0.0.json',
          },
        ],
      }),
    });
    const db = dbMock();
    db.templateMarketplaceInstall.findMany.mockResolvedValue([
      {
        templateId: 'tpl_1',
        marketplaceTemplateId: 'welcome-account',
        marketplaceVersion: '1.0.0',
      },
    ]);

    const manifest = await listMarketplaceTemplates(db);

    expect(manifest.templates[0].installedTemplateId).toBe('tpl_1');
    expect(manifest.templates[0].installedVersion).toBe('1.0.0');
  });

  it('does not fetch marketplace templates when the manifest URL is not configured', async () => {
    await expect(listMarketplaceTemplates(dbMock())).rejects.toThrow(
      'TEMPLATEFORGE_MARKETPLACE_MANIFEST_URL',
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('imports a marketplace package as a local template', async () => {
    process.env.TEMPLATEFORGE_MARKETPLACE_MANIFEST_URL =
      'https://cdn.jsdelivr.net/gh/example/templateforge-marketplace@main/manifest.json';
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          schemaVersion: '1.0',
          templates: [
            {
              id: 'welcome-account',
              version: '1.0.0',
              name: 'Welcome account',
              description: 'A welcome email.',
              category: 'onboarding',
              tags: ['welcome'],
              url: 'templates/welcome-account@1.0.0.json',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'welcome-account',
          version: '1.0.0',
          name: 'Welcome account',
          slug: 'welcome-account',
          description: 'A welcome email.',
          category: 'onboarding',
          subject: 'Welcome {{first_name}}',
          mjml: '<mjml><mj-body><mj-text>Hi {{first_name}}</mj-text></mj-body></mjml>',
          text: 'Hi {{first_name}}',
          variables: [
            {
              name: 'first_name',
              type: 'string',
              required: true,
              description: 'Recipient first name.',
            },
          ],
          sampleVariables: { first_name: 'Amaka' },
          tags: ['welcome'],
          warnings: [],
        }),
      });
    const db = dbMock();

    const imported = await importMarketplaceTemplate('welcome-account', db);

    expect(imported.id).toBe('tpl_1');
    expect(db.templateMarketplaceInstall.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          templateId: 'tpl_1',
          marketplaceTemplateId: 'welcome-account',
          marketplaceVersion: '1.0.0',
        }),
      }),
    );
    expect(db.actionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'marketplace.template_imported',
        }),
      }),
    );
  });

  it('rejects unsafe marketplace packages before install tracking', async () => {
    process.env.TEMPLATEFORGE_MARKETPLACE_MANIFEST_URL =
      'https://cdn.jsdelivr.net/gh/example/templateforge-marketplace@main/manifest.json';
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          schemaVersion: '1.0',
          templates: [
            {
              id: 'unsafe-template',
              version: '1.0.0',
              name: 'Unsafe template',
              description: 'Unsafe email.',
              category: 'security',
              tags: ['security'],
              url: 'templates/unsafe-template@1.0.0.json',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'unsafe-template',
          version: '1.0.0',
          name: 'Unsafe template',
          slug: 'unsafe-template',
          description: 'Unsafe email.',
          category: 'security',
          subject: 'Hi {{{first_name}}}',
          mjml: '<mjml><mj-body><mj-text>Hi {{first_name}}</mj-text></mj-body></mjml>',
          text: 'Hi {{first_name}}',
          variables: [
            {
              name: 'first_name',
              type: 'string',
              required: true,
              description: 'Recipient first name.',
            },
          ],
          sampleVariables: { first_name: 'Amaka' },
          tags: ['security'],
          warnings: [],
        }),
      });
    const db = dbMock();

    await expect(
      importMarketplaceTemplate('unsafe-template', db),
    ).rejects.toThrow('Triple-brace');
    expect(db.templateMarketplaceInstall.create).not.toHaveBeenCalled();
  });

  it('requires marketplace packages to include variable contracts and samples', async () => {
    process.env.TEMPLATEFORGE_MARKETPLACE_MANIFEST_URL =
      'https://cdn.jsdelivr.net/gh/example/templateforge-marketplace@main/manifest.json';
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          schemaVersion: '1.0',
          templates: [
            {
              id: 'empty-contract',
              version: '1.0.0',
              name: 'Empty contract',
              description: 'Missing contract.',
              category: 'test',
              tags: ['test'],
              url: 'templates/empty-contract@1.0.0.json',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'empty-contract',
          version: '1.0.0',
          name: 'Empty contract',
          slug: 'empty-contract',
          description: 'Missing contract.',
          category: 'test',
          subject: 'Hello',
          mjml: '<mjml><mj-body><mj-text>Hello</mj-text></mj-body></mjml>',
          text: 'Hello',
          variables: [],
          sampleVariables: {},
          tags: ['test'],
          warnings: [],
        }),
      });
    const db = dbMock();

    await expect(
      importMarketplaceTemplate('empty-contract', db),
    ).rejects.toThrow('variable contracts');
    expect(db.templateMarketplaceInstall.create).not.toHaveBeenCalled();
  });
});
