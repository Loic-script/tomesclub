// Test rapide : une salle privée est-elle cachée aux autres membres ?
// Lancer avec : npx tsx scripts/test-room-privacy.ts  (site + LiveKit démarrés)
import "dotenv/config";
import { RoomServiceClient } from "livekit-server-sdk";
import { Client } from "pg";

const SITE = "http://localhost:3000";

async function signInCookie(email: string): Promise<string> {
  const res = await fetch(`${SITE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: SITE },
    body: JSON.stringify({ email, password: "motdepasse123" }),
  });
  if (!res.ok) throw new Error(`sign-in ${email}: ${res.status}`);
  return res.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

async function roomsHtml(cookie: string): Promise<string> {
  const res = await fetch(`${SITE}/rooms`, { headers: { Cookie: cookie } });
  return res.text();
}

async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  const { rows } = await db.query(
    `SELECT id FROM "user" WHERE email = 'amy-test@example.com'`,
  );
  const amyId = rows[0].id;

  // Deux salles d'Amy : une publique, une privée.
  await db.query(
    `INSERT INTO room (id, name, topic, "isPrivate", "createdById")
     VALUES ('roomtest_pub', 'Test public room', NULL, false, $1),
            ('roomtest_priv', 'Test secret room', NULL, true, $1)
     ON CONFLICT (id) DO NOTHING`,
    [amyId],
  );

  const livekit = new RoomServiceClient(
    String(process.env.LIVEKIT_URL).replace(/^ws/, "http"),
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
  );
  await livekit.createRoom({ name: "room_roomtest_pub", emptyTimeout: 120 });
  await livekit.createRoom({ name: "room_roomtest_priv", emptyTimeout: 120 });

  const [amyHtml, benHtml] = await Promise.all([
    signInCookie("amy-test@example.com").then(roomsHtml),
    signInCookie("ben-test@example.com").then(roomsHtml),
  ]);

  console.log("Amy voit la publique :", amyHtml.includes("Test public room"));
  console.log("Amy voit SA privée   :", amyHtml.includes("Test secret room"));
  console.log("Amy voit le badge    :", amyHtml.includes("Private"));
  console.log("Ben voit la publique :", benHtml.includes("Test public room"));
  console.log("Ben voit la privée   :", benHtml.includes("Test secret room"), "(doit être false)");

  // Nettoyage
  await livekit.deleteRoom("room_roomtest_pub").catch(() => {});
  await livekit.deleteRoom("room_roomtest_priv").catch(() => {});
  await db.query(`DELETE FROM room WHERE id IN ('roomtest_pub', 'roomtest_priv')`);
  await db.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
