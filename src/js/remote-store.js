(function () {
  const TABLES = {
    dailyEntries: "daily_entries",
    taskInstances: "task_instances",
    profileAttributes: "profile_attributes",
    agentEvents: "agent_events"
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getConfig() {
    return window.LIFERPG_CONFIG || {};
  }

  function createSupabaseClient() {
    const config = getConfig();
    if (!window.supabase || !config.supabaseUrl || !config.supabaseAnonKey) {
      return null;
    }
    return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: { eventsPerSecond: 10 }
      }
    });
  }

  class LifeRpgRemoteStore {
    constructor() {
      this.client = createSupabaseClient();
      this.user = null;
      this.channel = null;
    }

    get isConfigured() {
      return Boolean(this.client);
    }

    async init() {
      if (!this.client) return { mode: "local", user: null };
      const { data, error } = await this.client.auth.getSession();
      if (error) throw error;
      this.user = data.session?.user || null;
      return { mode: this.user ? "remote" : "login", user: this.user };
    }

    async signInWithEmail(email) {
      if (!this.client) throw new Error("Supabase 未配置");
      const config = getConfig();
      const { error } = await this.client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: config.redirectTo }
      });
      if (error) throw error;
      return true;
    }

    async signOut() {
      if (!this.client) return;
      await this.client.auth.signOut();
      this.user = null;
    }

    requireUser() {
      if (!this.user) throw new Error("尚未登录 Supabase");
      return this.user.id;
    }

    async loadTodayState(date) {
      if (!this.client || !this.user) return null;
      const { data, error } = await this.client
        .from(TABLES.dailyEntries)
        .select("*")
        .eq("entry_date", date)
        .maybeSingle();
      if (error) throw error;
      return data;
    }

    async saveStatus(date, scores, mode, schedule = "") {
      if (!this.client || !this.user) return null;
      const payload = {
        user_id: this.requireUser(),
        entry_date: date,
        energy: scores.energy,
        mood: scores.mood,
        body: scores.body,
        focus: scores.focus,
        social: scores.social,
        mode,
        schedule,
        updated_at: new Date().toISOString()
      };
      const { data, error } = await this.client
        .from(TABLES.dailyEntries)
        .upsert(payload, { onConflict: "user_id,entry_date" })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    async saveReview(date, review) {
      if (!this.client || !this.user) return null;
      const { data, error } = await this.client
        .from(TABLES.dailyEntries)
        .upsert({
          user_id: this.requireUser(),
          entry_date: date,
          review,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id,entry_date" })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    async loadTaskInstances(date) {
      if (!this.client || !this.user) return [];
      const { data, error } = await this.client
        .from(TABLES.taskInstances)
        .select("*")
        .eq("task_date", date)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    }

    async addTaskToToday(date, task) {
      if (!this.client || !this.user) return null;
      const payload = {
        user_id: this.requireUser(),
        task_date: date,
        task_key: task.key || task.title,
        title: task.title,
        task_type: task.type,
        attribute: task.attr,
        xp: task.xp,
        time_label: task.time,
        note: task.note,
        completed: Boolean(task.completed)
      };
      const { data: existing, error: existingError } = await this.client
        .from(TABLES.taskInstances)
        .select("id,task_key")
        .eq("task_date", date)
        .eq("title", task.title)
        .order("created_at", { ascending: true });
      if (existingError) throw existingError;
      const current = (existing || []).find(row => row.task_key === payload.task_key) || existing?.[0];
      if (current) {
        const { data, error } = await this.client
          .from(TABLES.taskInstances)
          .update(payload)
          .eq("id", current.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await this.client
        .from(TABLES.taskInstances)
        .upsert(payload, { onConflict: "user_id,task_date,task_key" })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    async completeTask(taskInstanceId, completed) {
      if (!this.client || !this.user || !taskInstanceId) return null;
      const { data, error } = await this.client
        .from(TABLES.taskInstances)
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq("id", taskInstanceId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    async removeTask(taskInstanceId) {
      if (!this.client || !this.user || !taskInstanceId) return null;
      const { error } = await this.client
        .from(TABLES.taskInstances)
        .delete()
        .eq("id", taskInstanceId);
      if (error) throw error;
      return true;
    }

    async loadProfileAttributes(defaultAttributes) {
      if (!this.client || !this.user) return clone(defaultAttributes);
      const { data, error } = await this.client
        .from(TABLES.profileAttributes)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      if (!data?.length) {
        await this.saveProfileAttributes(defaultAttributes);
        return clone(defaultAttributes);
      }
      const colorByName = Object.fromEntries(defaultAttributes.map(item => [item.name, item.color]));
      return data.map(item => ({
        name: item.name,
        level: item.level,
        xp: item.xp,
        next: item.next_xp,
        color: item.color || colorByName[item.name] || "#41d38b"
      }));
    }

    async saveProfileAttributes(attributes) {
      if (!this.client || !this.user) return null;
      const rows = attributes.map((item, index) => ({
        user_id: this.requireUser(),
        name: item.name,
        level: item.level,
        xp: item.xp,
        next_xp: item.next,
        color: item.color,
        sort_order: index
      }));
      const { data, error } = await this.client
        .from(TABLES.profileAttributes)
        .upsert(rows, { onConflict: "user_id,name" })
        .select();
      if (error) throw error;
      return data;
    }

    async loadHistory(limit = 30) {
      if (!this.client || !this.user) return null;
      const { data, error } = await this.client
        .from(TABLES.dailyEntries)
        .select("entry_date,energy,mood,body,focus,social,mode,task_instances(completed,xp,attribute)")
        .order("entry_date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []).reverse().map(entry => {
        const xp = {};
        const completedTasks = (entry.task_instances || []).filter(task => task.completed).length;
        (entry.task_instances || []).forEach(task => {
          if (!task.completed) return;
          xp[task.attribute] = (xp[task.attribute] || 0) + Number(task.xp || 0);
        });
        return {
          date: entry.entry_date,
          energy: entry.energy,
          mood: entry.mood,
          body: entry.body,
          focus: entry.focus,
          social: entry.social,
          mode: entry.mode || "普通",
          xp,
          completedTasks
        };
      });
    }

    async generateDailyPlan(date, scores, mode) {
      if (!this.client || !this.user) return null;
      const { data, error } = await this.client.functions.invoke("generate_daily_plan", {
        body: { date, scores, mode }
      });
      if (error) throw error;
      return data;
    }

    async logAgentEvent(eventType, payload) {
      if (!this.client || !this.user) return null;
      const { data, error } = await this.client
        .from(TABLES.agentEvents)
        .insert({
          user_id: this.user.id,
          event_type: eventType,
          payload
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    subscribeToday(date, onChange) {
      if (!this.client || !this.user) return null;
      if (this.channel) this.client.removeChannel(this.channel);
      this.channel = this.client
        .channel(`liferpg:${this.user.id}:${date}`)
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: TABLES.dailyEntries,
          filter: `entry_date=eq.${date}`
        }, onChange)
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: TABLES.taskInstances,
          filter: `task_date=eq.${date}`
        }, onChange)
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: TABLES.profileAttributes
        }, onChange)
        .subscribe();
      return this.channel;
    }
  }

  window.LifeRpgRemoteStore = LifeRpgRemoteStore;
})();
