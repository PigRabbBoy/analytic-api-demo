import { Elysia, t } from "elysia";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { randomUUIDv7 } from "bun";
import { analyticTable } from "./database";
import { swagger } from "@elysiajs/swagger";
import { desc } from "drizzle-orm";

const sqlite = new Database("database.db");
const db = drizzle({ client: sqlite });

const app = new Elysia();

app.use(swagger());

app.get("/", () => "Hello Elysia");

app.post(
  "/analytic",
  async (req) => {
    const body = req.body;
    const data = Array.isArray(body.data) ? body.data : [body.data];
    const createdAt = new Date().toISOString()

    await db.insert(analyticTable).values(
      data.map((v) => ({
        id: randomUUIDv7(),
        userId: body.userId,
        data: v,
        createdAt,
      }))
    );
    return { status: "ok" };
  },
  {
    body: t.Object({
      userId: t.String({
        description: "ไอดีของ user",
      }),
      data: t.Any({ description: "ข้อมูลที่ต้องการเก็บ" }),
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
      .orderBy(desc(analyticTable.createdAt));

    return {
      data,
    };
  },
  {
    query: t.Object({
      page: t.Number({ description: "หน้า" }),
      pageSize: t.Number({ description: "จำนวนต่อหน้า" }),
    }),
  }
);

const port = Bun.env.PORT ? +Bun.env.PORT : 4000;
app.listen(port);
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
