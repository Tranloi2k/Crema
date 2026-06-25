import type { MergeTagProvider, MergeTagProviderId } from "@/lib/mergeTags/types";

const BREVO_CONTACT_VARS = [
  { id: "FIRSTNAME", label: "First name", sample: "Alex" },
  { id: "LASTNAME", label: "Last name", sample: "Nguyen" },
  { id: "EMAIL", label: "Email", sample: "alex@example.com" },
  { id: "SMS", label: "Phone (SMS)", sample: "+84901234567" },
  { id: "COMPANY", label: "Company", sample: "Acme Inc." },
] as const;

export const MERGE_TAG_PROVIDERS: MergeTagProvider[] = [
  {
    id: "brevo",
    name: "Brevo (Marketing)",
    description: "Contact attributes for Brevo campaigns — {{ contact.ATTRIBUTE }}",
    variables: [
      ...BREVO_CONTACT_VARS.map((v) => ({ ...v, description: `contact.${v.id}` })),
      { id: "unsubscribe", label: "Unsubscribe link", sample: "#unsubscribe", description: "Unsubscribe URL" },
      { id: "mirror", label: "View in browser", sample: "#mirror", description: "Mirror link" },
    ],
    format: (id) =>
      id === "unsubscribe" || id === "mirror" ? `{{ ${id} }}` : `{{ contact.${id} }}`,
  },
  {
    id: "brevo-transactional",
    name: "Brevo (Transactional)",
    description: "Template params for Brevo SMTP / API — {{ params.KEY }}",
    variables: [
      { id: "name", label: "Recipient name", sample: "Alex" },
      { id: "email", label: "Recipient email", sample: "alex@example.com" },
      { id: "order_id", label: "Order ID", sample: "ORD-1042" },
      { id: "amount", label: "Amount", sample: "$49.00" },
      { id: "reset_link", label: "Reset link", sample: "https://example.com/reset" },
      { id: "verification_code", label: "Verification code", sample: "482910" },
    ],
    format: (id) => `{{ params.${id} }}`,
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Merge tags — *|TAG|*",
    variables: [
      { id: "FNAME", label: "First name", sample: "Alex" },
      { id: "LNAME", label: "Last name", sample: "Nguyen" },
      { id: "EMAIL", label: "Email address", sample: "alex@example.com" },
      { id: "COMPANY", label: "Company", sample: "Acme Inc." },
      { id: "UNSUB", label: "Unsubscribe", sample: "#unsubscribe" },
    ],
    format: (id) => `*|${id}|*`,
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Handlebars — {{variable}}",
    variables: [
      { id: "first_name", label: "First name", sample: "Alex" },
      { id: "last_name", label: "Last name", sample: "Nguyen" },
      { id: "email", label: "Email", sample: "alex@example.com" },
      { id: "company", label: "Company", sample: "Acme Inc." },
      { id: "unsubscribe_url", label: "Unsubscribe URL", sample: "#unsubscribe" },
    ],
    format: (id) => `{{${id}}}`,
  },
  {
    id: "klaviyo",
    name: "Klaviyo",
    description: "Django-style — {{ person|lookup:'field' }}",
    variables: [
      { id: "first_name", label: "First name", sample: "Alex" },
      { id: "last_name", label: "Last name", sample: "Nguyen" },
      { id: "email", label: "Email", sample: "alex@example.com" },
      { id: "organization", label: "Organization", sample: "Acme Inc." },
    ],
    format: (id) => `{{ person.${id}|default:'' }}`,
  },
  {
    id: "generic",
    name: "Generic",
    description: "Simple {{variable}} placeholders",
    variables: [
      { id: "first_name", label: "First name", sample: "Alex" },
      { id: "last_name", label: "Last name", sample: "Nguyen" },
      { id: "email", label: "Email", sample: "alex@example.com" },
      { id: "company", label: "Company", sample: "Acme Inc." },
    ],
    format: (id) => `{{${id}}}`,
  },
];

const PROVIDER_MAP = new Map(MERGE_TAG_PROVIDERS.map((p) => [p.id, p]));

export function getMergeTagProvider(id: MergeTagProviderId): MergeTagProvider {
  return PROVIDER_MAP.get(id) ?? PROVIDER_MAP.get("brevo")!;
}

export function formatMergeTag(providerId: MergeTagProviderId, variableId: string): string {
  return getMergeTagProvider(providerId).format(variableId);
}

export const MERGE_TAG_PROVIDER_STORAGE_KEY = "crema-merge-tag-provider";

export function loadMergeTagProviderId(): MergeTagProviderId {
  if (typeof window === "undefined") return "brevo";
  const stored = localStorage.getItem(MERGE_TAG_PROVIDER_STORAGE_KEY);
  if (stored && PROVIDER_MAP.has(stored as MergeTagProviderId)) {
    return stored as MergeTagProviderId;
  }
  return "brevo";
}

export function saveMergeTagProviderId(id: MergeTagProviderId): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MERGE_TAG_PROVIDER_STORAGE_KEY, id);
}
