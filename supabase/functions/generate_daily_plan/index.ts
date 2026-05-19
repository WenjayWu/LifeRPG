import { corsHeaders, currentUser, json, pickTasks, taskToRow } from "../_shared/liferpg.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { supabase, user } = await currentUser(req);
    const body = await req.json().catch(() => ({}));
    const date = body.date ?? new Date().toISOString().slice(0, 10);
    const mode = body.mode ?? "普通";
    const tasks = pickTasks(mode);
    const rows = tasks.map((task) => taskToRow(user.id, date, task));

    const { error } = await supabase
      .from("task_instances")
      .upsert(rows, { onConflict: "user_id,task_date,task_key" });
    if (error) throw error;

    await supabase.from("agent_events").insert({
      user_id: user.id,
      event_type: "generate_daily_plan",
      payload: { date, mode, tasks },
    });

    return json({ date, mode, tasks });
  } catch (error) {
    return json({ error: error.message }, error.message === "Unauthorized" ? 401 : 500);
  }
});
