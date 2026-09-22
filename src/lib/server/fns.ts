import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import type {
  AccessState,
  ChannelRow,
  ChannelType,
  MemberRow,
  MonitorInput,
  MonitorSummary,
  MonitorType,
  NotifyLogRow,
  PublicStatusMonitor,
  Role,
  StatusPageRow,
} from "@/lib/types";

export const getAccessState = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<AccessState> => {
    const { getAccess } = await import("./access");
    return getAccess(context.userId);
  });

export const getSetupState = createServerFn({ method: "GET" }).handler(async () => {
  const { brokerOAuthConfigured } = await import("@/lib/auth/server");
  // AppSec #9: do not disclose whether members exist via public needsSetup.
  // Always return a constant false. First owner is created with `pulsectl user add`
  // (public sign-up stays disabled — Kevin #1).
  return {
    needsSetup: false,
    allowPublicSignup: false,
    // Broker OAuth UI only when real GROK_AUTH_* (or preview) is configured (Kevin #2).
    oauthEnabled: brokerOAuthConfigured,
  };
});

export const listMonitorsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<MonitorSummary[]> => {
    const { requireMember } = await import("./access");
    const { listMonitorSummaries } = await import("./monitors");
    const { kickDueChecks } = await import("@/lib/monitor/engine");
    const { sql } = await requireMember(context.userId);
    kickDueChecks();
    return listMonitorSummaries(sql);
  });

export const getMonitorFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }): Promise<MonitorSummary | null> => {
    const { requireMember } = await import("./access");
    const { getMonitor } = await import("./monitors");
    const { sql } = await requireMember(context.userId);
    return getMonitor(sql, id);
  });

export const saveMonitorFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: MonitorInput) => input)
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    const { requireMember } = await import("./access");
    const { upsertMonitor } = await import("./monitors");
    const { sql } = await requireMember(context.userId, "editor");
    const id = await upsertMonitor(sql, context.userId, data);
    return { id };
  });

export const deleteMonitorFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const { requireMember } = await import("./access");
    const { deleteMonitor } = await import("./monitors");
    const { sql } = await requireMember(context.userId, "editor");
    await deleteMonitor(sql, id);
  });

export const setMonitorActiveFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; active: boolean }) => input)
  .handler(async ({ context, data }) => {
    const { requireMember } = await import("./access");
    const { setMonitorActive } = await import("./monitors");
    const { sql } = await requireMember(context.userId, "editor");
    await setMonitorActive(sql, data.id, data.active);
  });

export const setMonitorChannelsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { monitorId: string; channelIds: string[] }) => input)
  .handler(async ({ context, data }) => {
    const { requireMember } = await import("./access");
    const { setMonitorChannels } = await import("./channels");
    const { sql } = await requireMember(context.userId, "editor");
    await setMonitorChannels(sql, data.monitorId, data.channelIds);
  });

export const getMonitorChannelsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((monitorId: string) => monitorId)
  .handler(async ({ context, data: monitorId }) => {
    const { requireMember } = await import("./access");
    const { getMonitorChannelIds } = await import("./channels");
    const { sql } = await requireMember(context.userId);
    return getMonitorChannelIds(sql, monitorId);
  });

export const tickMonitorsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { requireMember } = await import("./access");
    const { runDueChecks } = await import("@/lib/monitor/engine");
    await requireMember(context.userId);
    return runDueChecks();
  });

export const listMembersFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<MemberRow[]> => {
    const { requireMember } = await import("./access");
    const { listMembers } = await import("./users");
    const { sql } = await requireMember(context.userId, "admin");
    return listMembers(sql);
  });

export const addMemberFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { email: string; name: string; password?: string; role: Role }) => input)
  .handler(async ({ context, data }) => {
    const { requireMember } = await import("./access");
    const { addMember } = await import("./users");
    const { sql } = await requireMember(context.userId, "admin");
    const id = await addMember(sql, context.userId, data);
    return { id };
  });

export const setMemberRoleFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string; role: Role }) => input)
  .handler(async ({ context, data }) => {
    const { requireMember } = await import("./access");
    const { setMemberRole } = await import("./users");
    const { sql } = await requireMember(context.userId, "admin");
    await setMemberRole(sql, context.userId, data.userId, data.role);
  });

export const removeMemberFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((userId: string) => userId)
  .handler(async ({ context, data: userId }) => {
    const { requireMember } = await import("./access");
    const { removeMember } = await import("./users");
    const { sql } = await requireMember(context.userId, "admin");
    await removeMember(sql, context.userId, userId);
  });

export const setMemberPasswordFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string; password: string }) => input)
  .handler(async ({ context, data }) => {
    const { requireMember } = await import("./access");
    const { setPassword } = await import("./users");
    const { sql } = await requireMember(context.userId, "admin");
    await setPassword(sql, data.userId, data.password);
  });

export const listChannelsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ChannelRow[]> => {
    const { requireMember } = await import("./access");
    const { listChannels } = await import("./channels");
    const { sql } = await requireMember(context.userId);
    return listChannels(sql);
  });

export const saveChannelFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id?: string; name: string; type: ChannelType; config: Record<string, string>; active?: boolean; applyToAll?: boolean }) => input)
  .handler(async ({ context, data }) => {
    const { requireMember } = await import("./access");
    const { upsertChannel } = await import("./channels");
    const { sql } = await requireMember(context.userId, "admin");
    const id = await upsertChannel(sql, context.userId, data);
    return { id };
  });

export const deleteChannelFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const { requireMember } = await import("./access");
    const { deleteChannel } = await import("./channels");
    const { sql } = await requireMember(context.userId, "admin");
    await deleteChannel(sql, id);
  });

export const testChannelFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const { requireMember } = await import("./access");
    const { sendTestChannel } = await import("@/lib/monitor/notify");
    const { sql } = await requireMember(context.userId, "admin");
    await sendTestChannel(sql, id);
  });

export const listNotifyLogFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<NotifyLogRow[]> => {
    const { requireMember } = await import("./access");
    const { listNotifyLog } = await import("./channels");
    const { sql } = await requireMember(context.userId);
    return listNotifyLog(sql);
  });

export const listPagesFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<StatusPageRow[]> => {
    const { requireMember } = await import("./access");
    const { listPages } = await import("./pages");
    const { sql } = await requireMember(context.userId);
    return listPages(sql);
  });

export const savePageFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      id?: string;
      slug: string;
      title: string;
      description: string;
      published: boolean;
      monitorIds: string[];
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const { requireMember } = await import("./access");
    const { upsertPage } = await import("./pages");
    const { sql } = await requireMember(context.userId, "editor");
    const id = await upsertPage(sql, context.userId, data);
    return { id };
  });

export const deletePageFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const { requireMember } = await import("./access");
    const { deletePage } = await import("./pages");
    const { sql } = await requireMember(context.userId, "editor");
    await deletePage(sql, id);
  });

export const getPublicStatusFn = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(
    async ({
      data: slug,
    }): Promise<{ title: string; description: string; monitors: PublicStatusMonitor[] } | null> => {
      const { getSql } = await import("@/lib/db");
      const { getPublicPage } = await import("./pages");
      // Do not kickDueChecks on the public status path (Kevin AppSec #5) —
      // engine boot / authenticated dashboard paths own scheduling.
      const sql = await getSql();
      return getPublicPage(sql, slug);
    },
  );

export const getSiteNameFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { requireMember } = await import("./access");
    const { sql } = await requireMember(context.userId);
    const rows = await sql<{ value: string }>`select value from site_settings where key = 'site_name'`;
    return { siteName: rows[0]?.value ?? "Pulsewatch" };
  });

export const setSiteNameFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((siteName: string) => siteName)
  .handler(async ({ context, data: siteName }) => {
    const { requireMember } = await import("./access");
    const { sql } = await requireMember(context.userId, "admin");
    const value = siteName.trim() || "Pulsewatch";
    await sql`
      insert into site_settings (key, value) values ('site_name', ${value})
      on conflict (key) do update set value = excluded.value
    `;
  });

export const exportBackupFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { requireMember } = await import("./access");
    const { exportBackup } = await import("./backup");
    const { sql } = await requireMember(context.userId, "admin");
    return exportBackup(sql);
  });

export const restoreBackupFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { backup: unknown; mode: "merge" | "replace" }) => input)
  .handler(async ({ context, data }) => {
    const { requireMember } = await import("./access");
    const { parseBackup, restoreBackup } = await import("./backup");
    const { sql } = await requireMember(context.userId, "admin");
    const backup = parseBackup(data.backup);
    const users = await sql<{ email: string }>`select email from "user" where id = ${context.userId}`;
    return restoreBackup(sql, backup, {
      mode: data.mode === "replace" ? "replace" : "merge",
      actorId: context.userId,
      actorEmail: users[0]?.email ?? null,
    });
  });

