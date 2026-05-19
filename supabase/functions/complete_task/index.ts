import { corsHeaders, currentUser, json } from "../_shared/liferpg.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { supabase, user } = await currentUser(req);
    const { taskInstanceId, completed } = await req.json();
    const { data, error } = await supabase
      .from("task_instances")
      .update({
        completed: Boolean(completed),
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", taskInstanceId)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) throw error;
    return json({ task: data });
  } catch (error) {
    return json({ error: error.message }, error.message === "Unauthorized" ? 401 : 500);
  }
});
