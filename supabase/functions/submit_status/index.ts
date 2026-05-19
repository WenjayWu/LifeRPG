import { corsHeaders, currentUser, json, parseStatusInput, pickTasks, taskToRow } from "../_shared/liferpg.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { supabase, user } = await currentUser(req);
    const body = await req.json();
    const text = String(body.text ?? "");
    const date = body.date ?? new Date().toISOString().slice(0, 10);
    const status = parseStatusInput(text);
    const tasks = pickTasks(status.mode);

    const { error: entryError } = await supabase.from("daily_entries").upsert({
      user_id: user.id,
      entry_date: date,
      energy: status.scores.energy,
      mood: status.scores.mood,
      body: status.scores.body,
      focus: status.scores.focus,
      social: status.scores.social,
      mode: status.mode,
      schedule: status.schedule,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,entry_date" });
    if (entryError) throw entryError;

    const { error: taskError } = await supabase
      .from("task_instances")
      .upsert(tasks.map((task) => taskToRow(user.id, date, task)), { onConflict: "user_id,task_date,task_key" });
    if (taskError) throw taskError;

    await supabase.from("agent_events").insert({
      user_id: user.id,
      event_type: "submit_status",
      payload: { date, text, status, tasks },
    });

    return json({ date, status, tasks });
  } catch (error) {
    return json({ error: error.message }, error.message === "Unauthorized" ? 401 : 500);
  }
});
