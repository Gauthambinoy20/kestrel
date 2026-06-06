/**
 * Public ATS board slugs Kestrel scrapes directly. These are keyless public
 * endpoints (Greenhouse, Lever, Ashby). Slugs that have since changed simply
 * return zero jobs and never stop a scan; dead ones are pruned during a real
 * run (see ROADMAP M6).
 */

const GREENHOUSE = [
  'stripe', 'openai', 'anthropic', 'intercom', 'hubspot', 'ramp', 'brex', 'figma', 'databricks',
  'airbnb', 'retool', 'vercel', 'snowflake', 'mongodb', 'datadog', 'discord', 'reddit', 'notion',
  'coinbase', 'plaid', 'zapier', 'asana', 'lyft', 'doordash', 'instacart', 'robinhood', 'affirm',
  'chime', 'calendly', 'gusto', 'rippling', 'box', 'dropbox', 'twilio', 'okta', 'cloudflare',
  'hashicorp', 'elastic', 'gitlab', 'sentry', 'grafana', 'segment', 'amplitude', 'mixpanel',
  'attentive', 'klaviyo', 'shopify', 'block', 'toast', 'canva', 'wise', 'deliveroo', 'monzo',
  'checkout', 'personio', 'monday', 'miro', 'contentful', 'adyen', 'duolingo', 'roblox', 'twitch',
  'pinterest', 'yelp', 'indeed', 'mozilla', 'canonical', 'automattic', 'digitalocean', 'fastly',
  'snyk', 'lacework', 'wiz', 'crowdstrike', 'sentinelone', 'onepassword', 'bitwarden', 'docker',
  'github', 'gitpod', 'circleci', 'buildkite', 'launchdarkly', 'honeycomb', 'newrelic', 'confluent',
  'cockroachlabs', 'timescale', 'redis', 'supabase', 'neon', 'planetscale', 'clickhouse',
  'motherduck', 'dbt', 'airbyte', 'prefect', 'dagster', 'huggingface', 'cohere', 'mistral', 'waymo',
  'airtable', 'grammarly', 'algolia', 'sumologic', 'mongodbinc', 'asana-rebel', 'gitlabinc',
  'datadoghq', 'elasticco', 'hashicorpinc', 'jetbrains', 'linear', 'replit', 'webflow', 'postman',
  'loom', 'zapierinc', 'mural', 'miroinc', 'typeform',
];

const LEVER = [
  'netflix', 'spotify', 'palantir', 'scaleai', 'replicate', 'mistral', 'huggingface', 'plaid',
  'attentive', 'benchling', 'coursera', 'turo', 'quora', 'udacity', 'mattermost', 'sourcegraph',
  'postman', 'loom', 'replit', 'webflow', 'make', 'zapier', 'gusto', 'instabase', 'segment',
  'launchdarkly', 'cockroachlabs', 'parsec', 'duolingo', 'mercury', 'verkada', 'nuro', 'niantic',
  'mapbox', 'planet', 'sondermind', 'samsara', 'anduril', 'zipline', 'rippling', 'figma', 'airtable',
  'algolia', 'grammarly', 'mural', 'typeform', 'figma-inc', 'linear', 'perplexity', 'elevenlabs',
  'cursor', 'modal', 'pinecone', 'tailscale', 'temporal', 'prisma',
];

const ASHBY = [
  'linear', 'supabase', 'posthog', 'runwayml', 'perplexity', 'elevenlabs', 'cursor', 'mercury',
  'modal', 'pinecone', 'astral', 'turso', 'railway', 'render', 'flyio', 'prisma', 'incident',
  'temporal', 'tailscale', 'wandb', 'weightsandbiases', 'vercel', 'anthropic', 'openai', 'adept',
  'harvey', 'heygen', 'synthesia', 'poolside', 'gretel', 'modal-labs', 'langchain', 'airtable',
  'grammarly', 'algolia', 'mural', 'typeform', 'incident-io', 'cursor-ai', 'perplexity-ai',
  'eleven-labs', 'pinecone-io', 'temporal-technologies', 'tailscale-inc',
];

const dedupe = (slugs: readonly string[]): readonly string[] => [...new Set(slugs)];

/** Public board slugs keyed by ATS provider, de-duplicated. */
export const COMPANY_BOARDS = {
  greenhouse: dedupe(GREENHOUSE),
  lever: dedupe(LEVER),
  ashby: dedupe(ASHBY),
} as const;

/** The ATS providers Kestrel scrapes directly. */
export type AtsProvider = keyof typeof COMPANY_BOARDS;
