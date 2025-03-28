import { Elysia, t } from "elysia";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { randomUUIDv7 } from "bun";
import { analyticTable, settingTable, domainWhitelistTable } from "./database";
import { swagger } from "@elysiajs/swagger";
import { desc, eq } from "drizzle-orm";

const sqlite = new Database("database.db");
const db = drizzle({
  client: sqlite,
  schema: {
    setting: settingTable,
    analytic: analyticTable,
    domainWhitelist: domainWhitelistTable,
  },
});

const app = new Elysia();

app.use(swagger());

app.get("/", () => "Hello Elysia");

const analyticObj = t.Object({
  ohoPixelId: t.String({ default: "0195a85c-3ae3-79b2-8489-c2006dc0a488" }),
  clientId: t.String({ default: "0195a85c-5980-723a-a504-3e9a66958f30" }),
  sessionId: t.Optional(
    t.String({ default: "0195a85c-7253-7378-9181-2e26623f390f" })
  ),
  chatUser: t.Optional(t.Any({ default: { userId: "user1234" } })),
  authUser: t.Optional(
    t.Any({
      default: {
        authUser: {
          userId: "1234",
          email: "email",
        },
      },
    })
  ),
  type: t.String({ default: "event:page:startChat" }),
  button: t.Optional(t.Any()),
  userData: t.Optional(t.Any()),
  ads: t.Optional(t.Any()),
  page: t.Optional(t.Any()),
  timestamp: t.String({ default: new Date().toISOString() }),
});

app.post(
  "/tracking",
  async (req) => {
    const body = req.body;

    const origin = req.headers.origin;
    if (origin) {
      const ohoPixelId = body.at(0)!.ohoPixelId;
      const domainWhitelist = await db.query.domainWhitelist.findFirst({
        where: eq(domainWhitelistTable.ohoPixelId, ohoPixelId),
      });

      if (!(domainWhitelist?.config ?? []).includes(origin)) {
        req.set.status = "Unauthorized";
        return;
      }
    }

    const createdAt = new Date().toISOString();
    await db.insert(analyticTable).values(
      body.map((v) => ({
        id: randomUUIDv7(),
        createdAt,
        ...v,
      }))
    );
    return { status: "ok" };
  },
  {
    body: t.Array(analyticObj, { minItems: 1 }),
  }
);

app.get(
  "/tracking",
  async (req) => {
    const query = req.query;
    const page = query.page;
    const pageSize = query.pageSize;
    const offset = (page - 1) * pageSize;
    const limit = pageSize;
    const data = await db
      .select()
      .from(analyticTable)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(analyticTable.timestamp));

    return {
      data,
    };
  },
  {
    query: t.Object({
      page: t.Number({ description: "หน้า", default: 1 }),
      pageSize: t.Number({ description: "จำนวนต่อหน้า", default: 20 }),
    }),
  }
);

app.get("/setting/:ohoPixelId", async (req) => {
  const ohoPixelId = req.params.ohoPixelId;

  const origin = req.headers.origin;
  if (origin) {
    const domainWhitelist = await db.query.domainWhitelist.findFirst({
      where: eq(domainWhitelistTable.ohoPixelId, ohoPixelId),
    });

    if (!(domainWhitelist?.config ?? []).includes(origin)) {
      req.set.status = "Unauthorized";
      return;
    }
  }

  const setting = await db.query.setting.findFirst({
    where: eq(settingTable.ohoPixelId, ohoPixelId),
  });

  if (!setting) {
    req.set.status = "Not Found";
    return;
  }

  return setting;
});

const livechat = t.Object({
  enable: t.Boolean({ default: true }),
  config: t.Any({
    default: {
      logoUrl: "url for chat logo image",
      greetingMessage: "hello chat",
      triggerAfter: 10,
      requireEmail: true,
      requireTel: true,
    },
  }),
});

const tracking = t.Object({
  enable: t.Boolean({ default: true }),
  config: t.Any({
    default: {
      autoTrackPageView: true,
      autoTrackButtonClick: true,
      clickOpenChatSelector: ["a#add-to-cart"],
    },
  }),
  eventMappings: t.Any({
    default: {
      userData: "event:userdata",
      pageView: "event:page:view",
      ads: "event:ads",
      buttonClick: "event:button:click",
      chatOpen: "event:chat:open",
    },
  }),
});

app.put(
  "/setting/:ohoPixelId",
  async (req) => {
    const ohoPixelId = req.params.ohoPixelId;

    let setting = await db.query.setting.findFirst({
      where: eq(settingTable.ohoPixelId, ohoPixelId),
    });

    if (!setting) {
      req.set.status = "Not Found";
      return;
    }

    await db
      .update(settingTable)
      .set({
        ...req.body,
      })
      .where(eq(settingTable.ohoPixelId, ohoPixelId));

    return setting;
  },
  {
    body: t.Object({
      livechat,
      tracking,
    }),
  }
);

app.post(
  "/setting",
  async (req) => {
    const ohoPixelId = req.body.ohoPixelId;
    let setting = await db.query.setting.findFirst({
      where: eq(settingTable.ohoPixelId, ohoPixelId),
    });

    if (setting) {
      req.set.status = "Conflict";
      return;
    }

    await db.insert(settingTable).values(req.body);
    await db.insert(domainWhitelistTable).values({ ohoPixelId, config: [] });

    return setting;
  },
  {
    body: t.Object({
      ohoPixelId: t.String({ default: "1234" }),
      livechat,
      tracking,
    }),
  }
);

app.get("/domain-whitelist/:ohoPixelId", async (req) => {
  const ohoPixelId = req.params.ohoPixelId;
  const condition = eq(domainWhitelistTable.ohoPixelId, ohoPixelId);
  const domainWhitelist = await db.query.domainWhitelist.findFirst({
    where: condition,
  });

  if (!domainWhitelist) {
    req.set.status = "Not Found";
    return;
  }

  return { domain: domainWhitelist.config };
});

app.put(
  "/domain-whitelist/:ohoPixelId",
  async (req) => {
    const ohoPixelId = req.params.ohoPixelId;
    const domain = req.body.domain;
    const condition = eq(domainWhitelistTable.ohoPixelId, ohoPixelId);
    const domainWhitelist = await db.query.domainWhitelist.findFirst({
      where: condition,
    });

    if (domainWhitelist) {
      await db
        .update(domainWhitelistTable)
        .set({ config: domain })
        .where(condition);
    } else {
      await db
        .insert(domainWhitelistTable)
        .values({ ohoPixelId, config: domain });
    }

    return { domain: req.body.domain };
  },
  {
    body: t.Object({ domain: t.Array(t.String()) }),
  }
);

const port = Bun.env.PORT ? +Bun.env.PORT : 4000;
app.listen(port);
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
