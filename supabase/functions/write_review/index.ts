import { corsHeaders, currentUser, json } from "../_shared/liferpg.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { supabase, user } = await currentUser(req);
    const body = await req.json();
    const date = body.date ?? new Date().toISOString().slice(0, 10);
    const review = String(body.review ?? "");
    const { data, error } = await supabase
      .from("daily_entries")
      .upsert({
        user_id: user.id,
        entry_date: date,
        review,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,entry_date" })
      .select()
      .single();
    if (error) throw error;
    return json({ entry: data });
  } catch (error) {
    return json({ error: error.message }, error.message === "Unauthorized" ? 401 : 500);
  }
});
