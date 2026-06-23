import { prisma } from '../src';

const projectId = 'project_templateforge_local';
const brandProfileId = 'brand_templateforge_default';
const defaultHeaderId = 'brand_component_default_header';
const defaultFooterId = 'brand_component_default_footer';
const sendByteProviderId = 'provider_sendbyte';

async function main() {
  const project = await prisma.templateProject.upsert({
    where: { id: projectId },
    update: {},
    create: {
      id: projectId,
      slug: 'local-workspace',
      name: 'TemplateForge Local',
      description:
        'Self-hosted workspace for generated transactional email templates.',
    },
  });

  await prisma.brandProfile.upsert({
    where: { id: brandProfileId },
    update: {},
    create: {
      id: brandProfileId,
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

  await (prisma as any).emailProviderConfig.upsert({
    where: {
      projectId_providerId: {
        projectId: project.id,
        providerId: 'sendbyte',
      },
    },
    update: {},
    create: {
      id: sendByteProviderId,
      projectId: project.id,
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
  });

  await prisma.brandComponent.upsert({
    where: { id: defaultHeaderId },
    update: {},
    create: {
      id: defaultHeaderId,
      brandProfileId,
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

  await prisma.brandComponent.upsert({
    where: { id: defaultFooterId },
    update: {},
    create: {
      id: defaultFooterId,
      brandProfileId,
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

  const welcomeVariables = [
    {
      name: 'first_name',
      type: 'string',
      required: true,
      description: 'Recipient first name.',
      example: 'Amaka',
    },
    {
      name: 'dashboard_url',
      type: 'string',
      required: true,
      description: 'Absolute URL to the product dashboard.',
      example: 'https://app.example.com/dashboard',
    },
  ];
  const welcomeSample = {
    first_name: 'Amaka',
    dashboard_url: 'https://app.example.com/dashboard',
  };

  await prisma.emailTemplate.upsert({
    where: { slug: 'welcome-account-ready' },
    update: {},
    create: {
      id: 'tpl_welcome_seed',
      projectId: project.id,
      brandProfileId,
      headerComponentId: defaultHeaderId,
      footerComponentId: defaultFooterId,
      slug: 'welcome-account-ready',
      name: 'Welcome account ready',
      category: 'onboarding',
      status: 'READY',
      subject: 'Your {{first_name}} workspace is ready',
      mjml: [
        '<mjml>',
        '  <mj-body background-color="#f8fafc">',
        '    <mj-section padding="32px">',
        '      <mj-column background-color="#ffffff" border-radius="18px" padding="28px">',
        '        <mj-text font-size="20px" font-weight="700" color="#18181b">Welcome, {{first_name}}</mj-text>',
        '        <mj-text color="#3f3f46" line-height="1.6">Your workspace is ready. Open the dashboard to finish setup and send your first transactional email.</mj-text>',
        '        <mj-button background-color="#a7c957" color="#18181b" href="{{dashboard_url}}">Open dashboard</mj-button>',
        '      </mj-column>',
        '    </mj-section>',
        '  </mj-body>',
        '</mjml>',
      ].join('\n'),
      text:
        'Welcome, {{first_name}}.\n\nYour workspace is ready. Open your dashboard: {{dashboard_url}}',
      variables: welcomeVariables,
      sampleVariables: welcomeSample,
      tags: ['onboarding', 'account'],
      versions: {
        create: {
          version: 1,
          headerComponentId: defaultHeaderId,
          footerComponentId: defaultFooterId,
          subject: 'Your {{first_name}} workspace is ready',
          mjml: [
            '<mjml>',
            '  <mj-body background-color="#f8fafc">',
            '    <mj-section padding="32px">',
            '      <mj-column background-color="#ffffff" border-radius="18px" padding="28px">',
            '        <mj-text font-size="20px" font-weight="700" color="#18181b">Welcome, {{first_name}}</mj-text>',
            '        <mj-text color="#3f3f46" line-height="1.6">Your workspace is ready. Open the dashboard to finish setup and send your first transactional email.</mj-text>',
            '        <mj-button background-color="#a7c957" color="#18181b" href="{{dashboard_url}}">Open dashboard</mj-button>',
            '      </mj-column>',
            '    </mj-section>',
            '  </mj-body>',
            '</mjml>',
          ].join('\n'),
          text:
            'Welcome, {{first_name}}.\n\nYour workspace is ready. Open your dashboard: {{dashboard_url}}',
          variables: welcomeVariables,
          sampleVariables: welcomeSample,
          tags: ['onboarding', 'account'],
          changeNote: 'Seed template',
        },
      },
    },
  });

  await prisma.actionLog.create({
    data: {
      projectId: project.id,
      templateId: 'tpl_welcome_seed',
      action: 'seed.template_created',
      summary: 'Seeded welcome-account-ready template.',
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
