import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

// Table names/shapes mirror @auth/drizzle-adapter's sqlite defaults exactly,
// so DrizzleAdapter(db, { usersTable, accountsTable, sessionsTable, verificationTokensTable })
// can be passed this schema directly.
export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  passwordHash: text("passwordHash"),
  plan: text("plan").notNull().default("free"),
  planInterval: text("planInterval"),
  planStatus: text("planStatus"),
  planCurrentPeriodEnd: integer("planCurrentPeriodEnd", { mode: "timestamp_ms" }),
  billingCustomerId: text("billingCustomerId"),
  billingSubscriptionId: text("billingSubscriptionId"),
  downgradeSelectionPending: integer("downgradeSelectionPending", { mode: "boolean" })
    .notNull()
    .default(false),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compositePk: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => ({
    compositePk: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const templates = sqliteTable("templates", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  content: text("content").notNull(), // JSON-stringified Block[]
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  locked: integer("locked", { mode: "boolean" }).notNull().default(false),
  // Read-only public preview: when isPublic is true the template is viewable at
  // /p/{publicSlug} without auth. The slug is unguessable and revoked on toggle-off.
  publicSlug: text("publicSlug").unique(),
  isPublic: integer("isPublic", { mode: "boolean" }).notNull().default(false),
});

// Periodic snapshots of a template's content so autosave (which overwrites the
// live row) can't permanently lose good work. Capped per-template on insert.
export const templateVersions = sqliteTable("template_versions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  templateId: text("templateId")
    .notNull()
    .references(() => templates.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  content: text("content").notNull(), // JSON-stringified StackBlock
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
});
