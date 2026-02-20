const syncThakathon = async () => {
  const APP_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${APP_URL}/api/sync/thakathon`, { cache: "no-store" });
    const data = await res.json();
    console.log(
      `[Thakathon Sync] ${new Date().toISOString()} -`,
      data.success
        ? `Synced ${data.synced} teams, ${data.membersLinked} members`
        : `Failed: ${data.error}`
    );
  } catch (error) {
    console.error("[Thakathon Sync] Error:", error);
  }
};

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const SYNC_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours

    // Initial sync after 30 seconds (let server start first)
    setTimeout(syncThakathon, 30_000);

    // Then every 3 hours
    setInterval(syncThakathon, SYNC_INTERVAL);

    console.log("[Thakathon Sync] Scheduled every 3 hours");
  }
}
