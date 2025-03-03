import { Elysia, t } from "elysia";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { randomUUIDv7 } from "bun";
import { analyticTable, userTable } from "./database";
import { swagger } from "@elysiajs/swagger";
import { desc, eq } from "drizzle-orm";

const sqlite = new Database("database.db");
const db = drizzle({
  client: sqlite,
  schema: { user: userTable, analytic: analyticTable },
});

const app = new Elysia();

app.use(swagger());

app.get("/", () => "Hello Elysia");

app.get("token", async () => {
  const ohoUserId = randomUUIDv7();

  await db.insert(userTable).values({
    ohoId: ohoUserId,
  });
  const token = btoa(ohoUserId);

  return { token, ohoUserId };
});

app.post(
  "auth",
  async (req) => {
    const body = req.body;

    let token = body.ohoToken;
    let ohoUserId: string;
    if (token) {
      ohoUserId = atob(token);
      const user = await db.query.user.findFirst({
        where: eq(userTable.ohoId, ohoUserId),
      });

      if (!user) {
        return req.error("Not Found", "user not found");
      }

      if (user.userId && user.userId !== body.userId) {
        return req.error("Conflict", "user already auth");
      }

      const auth = await db.query.user.findFirst({
        where: eq(userTable.userId, body.userId),
      });

      if (auth && auth.userId !== body.userId) {
        return req.error("Conflict", "user already auth");
      }

      await db
        .update(userTable)
        .set({
          userId: body.userId,
          data: body.data,
        })
        .where(eq(userTable.ohoId, ohoUserId));
    } else {
      ohoUserId = randomUUIDv7();
      token = btoa(ohoUserId);

      await db.insert(userTable).values({
        ohoId: ohoUserId,
        userId: body.userId,
        data: body.data,
      });
    }

    return { token, ohoUserId };
  },
  {
    body: t.Object({
      userId: t.String({ description: "ไอดี user ของ website" }),
      ohoToken: t.Optional(t.String({ description: "token ของ oho" })),
      data: t.Optional(t.Any({ description: "ข้อมูล user ของ website" })),
    }),
  }
);

const analyticObj = t.Object({
  type: t.String(),
  ohoPixel: t.String(),
  clientId: t.String(),
  user: t.Optional(t.Any()),
  data: t.Optional(t.Any()),
  timestamp: t.String(),
});

app.post(
  "/analytic",
  async (req) => {
    const body = req.body;
    const data = body.list;
    if (!data) return { status: "data not found" };
    const createdAt = new Date().toISOString();

    await db.insert(analyticTable).values(
      data.map((v) => ({
        id: randomUUIDv7(),
        createdAt,
        ...v,
      }))
    );
    return { status: "ok" };
  },
  {
    body: t.Object({
      list: t.Array(analyticObj, { minItems: 1 }),
    }),
  }
);

app.get(
  "/analytic",
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

const port = Bun.env.PORT ? +Bun.env.PORT : 4000;
app.listen(port);
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
