import fs from 'node:fs';
import path from 'node:path';

describe('settings import boundary', () => {
  it('keeps the Genkit tool registry out of shared settings actions', () => {
    const sharedSettings = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', 'actions', 'settings.ts'),
      'utf8',
    );
    const assistantStatus = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', 'actions', 'assistant-operational-status.ts'),
      'utf8',
    );

    expect(sharedSettings).not.toContain('@/lib/assistant/tool-registry');
    expect(assistantStatus).toContain('@/lib/assistant/tool-registry');
  });

  it('keeps the blog AI generator out of public blog reads', () => {
    const publicBlog = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', 'actions', 'blog.ts'),
      'utf8',
    );
    const blogAi = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', 'actions', 'blog-ai.ts'),
      'utf8',
    );

    expect(publicBlog).not.toContain('@/lib/blog-ai-generator');
    expect(blogAi).toContain('@/lib/blog-ai-generator');
  });

  it('loads marketing and multiagent AI only when those actions run', () => {
    const marketingAction = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', 'actions', 'marketing-automation.ts'),
      'utf8',
    );
    const multiagentAction = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', 'actions', 'multiagent.ts'),
      'utf8',
    );

    expect(marketingAction).toContain("await import('@/lib/marketing-automation')");
    expect(multiagentAction).toContain("await import('@/ai/flows/multiagent-flow')");
    expect(marketingAction).not.toMatch(/^import\s+\{\s*runMarketingAutomation/m);
    expect(multiagentAction).not.toMatch(/^import\s+\{\s*runMultiAgent/m);
  });

  it('keeps global client widgets independent from heavy AI server actions', () => {
    const marketingTrigger = fs.readFileSync(
      path.join(process.cwd(), 'src', 'components', 'marketing', 'marketing-automation-trigger.tsx'),
      'utf8',
    );
    const multiagentWidget = fs.readFileSync(
      path.join(process.cwd(), 'src', 'components', 'multiagent', 'multiagent-widget.tsx'),
      'utf8',
    );
    const multiagentApi = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', 'api', 'multiagent', 'message', 'route.ts'),
      'utf8',
    );
    const multiagentAction = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', 'actions', 'multiagent.ts'),
      'utf8',
    );

    expect(marketingTrigger).not.toContain('@/app/actions/marketing-automation');
    expect(marketingTrigger).toContain('navigator.webdriver');
    expect(multiagentWidget).not.toContain('@/app/actions/multiagent');
    expect(multiagentApi).toContain('verifySession()');
    expect(multiagentApi).toContain('AGENT_TYPES.includes');
    expect(multiagentAction).toContain('verifySession()');
  });

  it('keeps public simulator tests isolated from Firebase', () => {
    const files = [
      ['src', 'app', 'actions', 'armado-rapido.ts'],
      ['src', 'lib', 'budget', 'public-simulator-persistence.ts'],
      ['src', 'lib', 'crm', 'public-lead-persistence.ts'],
      ['src', 'lib', 'commercial', 'public-rate-limit.ts'],
      ['src', 'app', 'actions', 'social-gallery.ts'],
      ['src', 'app', 'actions', 'fiesta', 'sesion-entretenimiento.ts'],
    ];

    for (const segments of files) {
      const source = fs.readFileSync(path.join(process.cwd(), ...segments), 'utf8');
      expect(source).toContain('AK_USE_LOCAL_JSON_ONLY');
    }
  });
});
