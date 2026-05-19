import { corsHeaders, currentUser, json } from "../_shared/liferpg.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { supabase, user } = await currentUser(req);
    const body = await req.json().catch(() => ({}));
    const rangeEnd = body.rangeEnd ?? new Date().toISOString().slice(0, 10);
    const end = new Date(`${rangeEnd}T00:00:00`);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const rangeStart = body.rangeStart ?? start.toISOString().slice(0, 10);

    const { data: entries, error } = await supabase
      .from("daily_entries")
      .select("entry_date,energy,mood,body,focus,social,mode,task_instances(completed,xp,attribute)")
      .gte("entry_date", rangeStart)
      .lte("entry_date", rangeEnd)
      .order("entry_date", { ascending: true });
    if (error) throw error;

    const modeCounts: Record<string, number> = {};
    const xp: Record<string, number> = {};
    let completedTasks = 0;
    for (const entry of entries ?? []) {
      modeCounts[entry.mode] = (modeCounts[entry.mode] ?? 0) + 1;
      for (const task of entry.task_instances ?? []) {
        if (!task.completed) continue;
        completedTasks += 1;
        xp[task.attribute] = (xp[task.attribute] ?? 0) + Number(task.xp ?? 0);
      }
    }
    const dominantMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "暂无";
    const topAttr = Object.entries(xp).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "暂无";
    const summary = `本周主导状态：${dominantMode}。记录 ${entries?.length ?? 0} 天，完成任务 ${completedTasks} 个，最高频 XP 属性：${topAttr}。`;
    const metrics = { modeCounts, xp, completedTasks };

    const { data: report, error: reportError } = await supabase
      .from("weekly_reports")
      .upsert({
        user_id: user.id,
        range_start: rangeStart,
        range_end: rangeEnd,
        summary,
        metrics,
      }, { onConflict: "user_id,range_start,range_end" })
      .select()
      .single();
    if (reportError) throw reportError;
    return json({ report });
  } catch (error) {
    return json({ error: error.message }, error.message === "Unauthorized" ? 401 : 500);
  }
});
