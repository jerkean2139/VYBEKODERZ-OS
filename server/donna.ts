import Anthropic from '@anthropic-ai/sdk';
import type { Department, RoutingDecision } from './types';
import { agents } from './agents';

// Lazy client — avoids crash if ANTHROPIC_API_KEY missing at import time
let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic();
  return _client;
}

const ROUTING_SYSTEM_PROMPT = `You are Donna, Chief AI Agent of VybeKoderz AI Agent OS. Your job is to analyze incoming task requests and route them to the correct department and specialist agent.

## Your Organization
You manage 4 departments, each with specialist agents:

### Sales Department
- **Outbound Specialist** — cold outreach, email sequences, follow-ups, lead gen campaigns
- **Deal Strategist** — pipeline management, proposal writing, deal analysis, closing strategy

### Operations Department
- **SOP Executor** — run standard operating procedures, browser automation, repetitive workflows
- **Scheduler** — calendar management, meeting scheduling, reminders, time blocking
- **Browser Agent** — web scraping, form filling, login-based tasks, data extraction

### Marketing Department
- **Content Creator** — blog posts, social media content, copywriting, video scripts
- **SEO Specialist** — keyword research, on-page SEO, ranking analysis, link building
- **Social Manager** — social media scheduling, community management, engagement
- **Campaign Runner** — ad campaigns, email marketing, A/B testing, analytics

### Dev Department
- **AI Engineer** — AI/ML integrations, prompt engineering, model fine-tuning, Claude API
- **Backend Architect** — database design, API development, server infrastructure, security
- **DevOps Automator** — CI/CD, deployment, monitoring, infrastructure as code

## Response Format
You MUST respond with valid JSON only. No markdown, no explanation outside JSON.
{
  "department": "sales" | "ops" | "marketing" | "dev",
  "specialist": "<specialist-id>",
  "title": "<short task title, max 60 chars>",
  "description": "<1-2 sentence description of what the agent will do>",
  "reasoning": "<1 sentence explaining why this routing>",
  "priority": "low" | "medium" | "high" | "critical"
}

Specialist IDs: outbound-specialist, deal-strategist, sop-executor, scheduler, browser-agent, content-creator, seo-specialist, social-manager, campaign-runner, ai-engineer, backend-architect, devops-automator`;

export async function routeTask(input: string): Promise<RoutingDecision> {
  try {
    const message = await getClient().messages.create({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 512,
      system: ROUTING_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Route this task: "${input}"`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const decision: RoutingDecision = JSON.parse(text);

    // Validate department
    const validDepts: Department[] = ['sales', 'ops', 'marketing', 'dev'];
    if (!validDepts.includes(decision.department)) {
      throw new Error(`Invalid department: ${decision.department}`);
    }

    // Validate specialist exists
    const specialist = agents.find(a => a.id === decision.specialist && a.tier === 'specialist');
    if (!specialist) {
      throw new Error(`Invalid specialist: ${decision.specialist}`);
    }

    return decision;
  } catch (error) {
    // Fallback routing if Claude API fails or returns invalid JSON
    return fallbackRoute(input);
  }
}

function fallbackRoute(input: string): RoutingDecision {
  const lower = input.toLowerCase();

  if (lower.match(/lead|pipeline|outreach|follow.?up|prospect|deal|proposal|sales|crm|ghl/)) {
    return {
      department: 'sales',
      specialist: lower.match(/deal|proposal|pipeline|clos/) ? 'deal-strategist' : 'outbound-specialist',
      title: truncate(input, 60),
      description: `Processing sales task: ${truncate(input, 100)}`,
      reasoning: 'Keywords matched sales department patterns',
      priority: 'medium',
    };
  }

  if (lower.match(/sop|schedule|calendar|meeting|workflow|browser|scrape|automat/)) {
    return {
      department: 'ops',
      specialist: lower.match(/schedule|calendar|meeting/) ? 'scheduler'
        : lower.match(/browser|scrape|login/) ? 'browser-agent'
        : 'sop-executor',
      title: truncate(input, 60),
      description: `Processing operations task: ${truncate(input, 100)}`,
      reasoning: 'Keywords matched operations department patterns',
      priority: 'medium',
    };
  }

  if (lower.match(/content|blog|social|post|seo|keyword|campaign|ad|email.?market|linkedin|twitter/)) {
    return {
      department: 'marketing',
      specialist: lower.match(/seo|keyword|rank/) ? 'seo-specialist'
        : lower.match(/social|linkedin|twitter|post/) ? 'social-manager'
        : lower.match(/campaign|ad|a\/b/) ? 'campaign-runner'
        : 'content-creator',
      title: truncate(input, 60),
      description: `Processing marketing task: ${truncate(input, 100)}`,
      reasoning: 'Keywords matched marketing department patterns',
      priority: 'medium',
    };
  }

  // Default to dev
  return {
    department: 'dev',
    specialist: lower.match(/ai|claude|model|prompt/) ? 'ai-engineer'
      : lower.match(/deploy|ci|cd|infra|docker/) ? 'devops-automator'
      : 'backend-architect',
    title: truncate(input, 60),
    description: `Processing dev task: ${truncate(input, 100)}`,
    reasoning: 'Defaulted to dev department',
    priority: 'medium',
  };
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 3) + '...' : str;
}
