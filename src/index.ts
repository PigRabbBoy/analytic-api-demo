import { Elysia, t } from "elysia";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { randomUUIDv7 } from "bun";
import { analyticTable } from "./database";
import { swagger } from "@elysiajs/swagger";

const sqlite = new Database("database.db");
const db = drizzle({ client: sqlite });

const app = new Elysia();

app.use(swagger());

app.get("/", () => "Hello Elysia");

app.post(
  "/analytic",
  async (req) => {
    const body = req.body as any;
    const id = randomUUIDv7();

    // await db.insert(analyticTable).values({})
  },
  {
    body: t.Object({
      userId: t.String(),
      data: t.Any(),
    }),
  }
);

app.get("/analytic", (req) => {}, {
qurey:{}
});

const port = Bun.env.PORT ? +Bun.env.PORT : 4000;
app.listen(port);
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
