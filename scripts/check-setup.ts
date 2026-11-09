// Vérifie que tous les outils sont bien installés et connectés.
// Lancer avec : npm run check:setup
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { createParticipantToken, createRoomServiceClient } from "@/lib/livekit";

async function checkDatabase() {
  const rows = await prisma.$queryRaw<{ version: string }[]>`SELECT version()`;
  console.log("✅ PostgreSQL :", rows[0].version.split(",")[0]);
}

async function checkLiveKit() {
  const token = await createParticipantToken({ identity: "test", roomName: "test" });
  console.log("✅ LiveKit token :", `${token.slice(0, 20)}...`);

  const rooms = await createRoomServiceClient().listRooms();
  console.log(`✅ Serveur LiveKit : connecté (${rooms.length} salle(s) ouverte(s))`);
}

async function main() {
  let ok = true;

  try {
    await checkDatabase();
  } catch (error) {
    ok = false;
    console.error("❌ PostgreSQL :", (error as Error).message);
  }

  try {
    await checkLiveKit();
  } catch (error) {
    ok = false;
    console.error("❌ LiveKit :", (error as Error).message);
    console.error("   → Le serveur LiveKit est-il lancé ? (npm run livekit:dev)");
  }

  await prisma.$disconnect();
  process.exit(ok ? 0 : 1);
}

main();
