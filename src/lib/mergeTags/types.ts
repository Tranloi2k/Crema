export type MergeTagProviderId =
  | "brevo"
  | "brevo-transactional"
  | "mailchimp"
  | "sendgrid"
  | "klaviyo"
  | "generic";

export type MergeTagVariable = {
  id: string;
  label: string;
  description?: string;
  sample: string;
};

export type MergeTagProvider = {
  id: MergeTagProviderId;
  name: string;
  description: string;
  variables: MergeTagVariable[];
  format: (variableId: string) => string;
};
