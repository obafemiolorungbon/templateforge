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
      findFirst: jest.fn().mockResolvedValue({
        id: 'brand_templateforge_default',
        name: 'TemplateForge',
        productName: 'TemplateForge',
        website: 'https://templateforge.local',
        logoUrl: null,
        primaryColor: '#A7C957',
        accentColor: '#D65F4A',
        tone: 'clear',
        footerText: 'TemplateForge footer',
        components: [
          {
            id: 'component_header',
            brandProfileId: 'brand_templateforge_default',
            name: 'Default product header',
            type: 'HEADER',
            mjml: '<mj-section><mj-column><mj-text>{{brand_product_name}}</mj-text></mj-column></mj-section>',
            text: '{{brand_product_name}}',
            isDefault: true,
            updatedAt: new Date('2026-06-22T10:00:00Z'),
          },
          {
            id: 'component_footer',
            brandProfileId: 'brand_templateforge_default',
            name: 'Default legal footer',
            type: 'FOOTER',
            mjml: '<mj-section><mj-column><mj-text>{{brand_footer_text}}</mj-text></mj-column></mj-section>',
            text: '{{brand_footer_text}}',
            isDefault: true,
            updatedAt: new Date('2026-06-22T10:00:00Z'),
          },
        ],
      }),
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

  it('rejects generated drafts without MJML', () => {
    expect(() =>
      validateTemplateDraft({
        name: 'Missing MJML',
        slug: 'missing-mjml',
        category: 'receipt',
        subject: 'Receipt for {{amount}}',
        mjml: '',
        text: 'Receipt for {{amount}}.',
        variables: [
          {
            name: 'amount',
            type: 'string',
            required: true,
            description: 'Receipt amount.',
          },
        ],
        sampleVariables: { amount: 'NGN 45,000' },
        tags: [],
        warnings: [],
      }),
    ).toThrow();
  });

  it('rejects generated drafts without a plain-text fallback', () => {
    expect(() =>
      validateTemplateDraft({
        name: 'Missing text',
        slug: 'missing-text',
        category: 'receipt',
        subject: 'Receipt for {{amount}}',
        mjml: '<mjml><mj-body><mj-text>{{amount}}</mj-text></mj-body></mjml>',
        text: '',
        variables: [
          {
            name: 'amount',
            type: 'string',
            required: true,
            description: 'Receipt amount.',
          },
        ],
        sampleVariables: { amount: 'NGN 45,000' },
        tags: [],
        warnings: [],
      }),
    ).toThrow();
  });

  it('rejects generated drafts without variable contracts or sample variables', () => {
    expect(() =>
      validateTemplateDraft({
        name: 'Static template',
        slug: 'static-template',
        category: 'notice',
        subject: 'Account update',
        mjml: '<mjml><mj-body><mj-text>Your account was updated.</mj-text></mj-body></mjml>',
        text: 'Your account was updated.',
        variables: [],
        sampleVariables: { first_name: 'Amaka' },
        tags: [],
        warnings: [],
      }),
    ).toThrow('variable contracts');

    expect(() =>
      validateTemplateDraft({
        name: 'Missing samples',
        slug: 'missing-samples',
        category: 'notice',
        subject: 'Hi {{first_name}}',
        mjml: '<mjml><mj-body><mj-text>Hi {{first_name}}</mj-text></mj-body></mjml>',
        text: 'Hi {{first_name}}.',
        variables: [
          {
            name: 'first_name',
            type: 'string',
            required: true,
            description: 'Recipient first name.',
          },
        ],
        sampleVariables: {},
        tags: [],
        warnings: [],
      }),
    ).toThrow('sample variables');
  });

  it('normalizes unsupported model variable types to strings with a warning', () => {
    const draft = validateTemplateDraft({
      name: 'Password reset',
      slug: 'password-reset',
      category: 'password-reset',
      subject: 'Reset your password',
      mjml: '<mjml><mj-body><mj-button href="{{reset_url}}">Reset password</mj-button></mj-body></mjml>',
      text: 'Reset your password: {{reset_url}}',
      variables: [
        {
          name: 'reset_url',
          type: 'url',
          required: true,
          description: 'Password reset URL.',
          example: 'https://example.com/reset',
        },
      ],
      sampleVariables: { reset_url: 'https://example.com/reset' },
      tags: ['transactional'],
      warnings: [],
    });

    expect(draft.variables[0]?.type).toBe('string');
    expect(draft.warnings[0]).toContain('reset_url: url -> string');
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

  it('loads copy and email UI runtime skills into the OpenRouter request', async () => {
    process.env.OPENROUTER_API_KEY = 'openrouter_test_key';
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                name: 'Wallet top-up receipt',
                slug: 'wallet-top-up-receipt',
                category: 'receipt',
                subject: 'Receipt for {{amount}}',
                mjml: [
                  '<mjml><mj-body>',
                  '<mj-section padding="24px 32px">',
                  '<mj-column>',
                  '<mj-text font-size="13px" color="#71717A">Payment receipt</mj-text>',
                  '<mj-text font-size="20px" font-weight="700">Your wallet top-up is complete</mj-text>',
                  '<mj-text font-size="15px" line-height="1.6">Hi {{first_name}}, {{amount}} has been added to your balance.</mj-text>',
                  '<mj-button href="{{dashboard_url}}">View receipt</mj-button>',
                  '</mj-column>',
                  '</mj-section>',
                  '</mj-body></mjml>',
                ].join(''),
                text: [
                  'Payment receipt',
                  'Your wallet top-up is complete',
                  'Hi {{first_name}}, {{amount}} has been added to your balance.',
                  'View receipt: {{dashboard_url}}',
                ].join('\n\n'),
                variables: [
                  {
                    name: 'first_name',
                    type: 'string',
                    required: true,
                    description: 'Recipient first name.',
                    example: 'Amaka',
                  },
                  {
                    name: 'amount',
                    type: 'string',
                    required: true,
                    description: 'Top-up amount.',
                    example: 'NGN 45,000',
                  },
                  {
                    name: 'dashboard_url',
                    type: 'string',
                    required: true,
                    description: 'Dashboard receipt URL.',
                    example: 'https://example.com/dashboard',
                  },
                ],
                sampleVariables: {
                  first_name: 'Amaka',
                  amount: 'NGN 45,000',
                  dashboard_url: 'https://example.com/dashboard',
                },
                tags: ['transactional', 'receipt'],
                warnings: [],
              }),
            },
          },
        ],
      }),
    });
    const db = dbMock();

    await generateTemplate(
      {
        useCase: 'Send a receipt after a successful wallet top-up.',
        productName: 'PayLink Ledger',
        audience: 'Developers',
        tone: 'clear',
        category: 'receipt',
        variableHints: 'first_name, amount, dashboard_url',
      },
      db,
    );

    const request = (global.fetch as jest.Mock).mock.calls[0][1];
    const body = JSON.parse(request.body);
    const systemPrompt = body.messages[0].content;
    const userPrompt = JSON.parse(body.messages[1].content);

    expect(systemPrompt).toContain('TemplateForge runtime email generation skill pack');
    expect(systemPrompt).toContain('Generated MJML must feel designed');
    expect(systemPrompt).toContain('Do not use:');
    expect(systemPrompt).toContain('Unlock the power of');
    expect(systemPrompt).toContain('one giant paragraph inside one `mj-text`');
    expect(systemPrompt).toContain('Return exactly the existing TemplateForge draft shape');
    expect(systemPrompt).toContain('Variable `type` must be one of');
    expect(userPrompt.requiredShape).toEqual(
      expect.objectContaining({
        mjml: '<mjml>...</mjml>',
        text: 'plain text fallback',
      }),
    );
    expect(userPrompt.generationRule).toContain('message body content only');
    expect(db.aiGenerationRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'SUCCEEDED' }),
      }),
    );
  });

  it('accepts fenced JSON returned by OpenRouter before validating the draft', async () => {
    process.env.OPENROUTER_API_KEY = 'openrouter_test_key';
    const modelDraft = {
      name: 'Password reset',
      slug: 'password-reset',
      category: 'password-reset',
      subject: 'Reset your password',
      mjml: [
        '<mjml><mj-body>',
        '<mj-section padding="24px 32px">',
        '<mj-column>',
        '<mj-text font-size="20px" font-weight="700">Reset your password</mj-text>',
        '<mj-text font-size="15px" line-height="1.6">Use this link to reset your password.</mj-text>',
        '<mj-button href="{{reset_url}}">Reset password</mj-button>',
        '</mj-column>',
        '</mj-section>',
        '</mj-body></mjml>',
      ].join(''),
      text: 'Reset your password: {{reset_url}}',
      variables: [
        {
          name: 'reset_url',
          type: 'string',
          required: true,
          description: 'Password reset URL.',
          example: 'https://example.com/reset',
        },
      ],
      sampleVariables: { reset_url: 'https://example.com/reset' },
      tags: ['transactional', 'security'],
      warnings: [],
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: `Here is the template JSON:\n\n\`\`\`json\n${JSON.stringify(modelDraft, null, 2)}\n\`\`\``,
            },
          },
        ],
      }),
    });
    const db = dbMock();

    await generateTemplate(
      {
        useCase: 'Send a password reset email.',
        productName: 'SecureApp',
        audience: 'Account holders',
        tone: 'calm',
        category: 'password-reset',
        variableHints: 'reset_url',
      },
      db,
    );

    expect(db.aiGenerationRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'SUCCEEDED' }),
      }),
    );
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
