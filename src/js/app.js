const modes = ["低能量", "普通", "高能量", "烦躁", "空虚", "无聊", "想社交", "想创造"];
    const metrics = [
      { key: "energy", label: "精力" },
      { key: "mood", label: "情绪" },
      { key: "body", label: "身体" },
      { key: "focus", label: "专注" },
      { key: "social", label: "社交欲" }
    ];

    const profile = {
      attributes: [
        { name: "体能", level: 2, xp: 42, next: 100, color: "#41d38b" },
        { name: "智识", level: 3, xp: 68, next: 100, color: "#48c9e8" },
        { name: "创造", level: 2, xp: 55, next: 100, color: "#f3b94e" },
        { name: "工程", level: 2, xp: 35, next: 100, color: "#a98bff" },
        { name: "社交", level: 1, xp: 28, next: 100, color: "#f06d62" },
        { name: "秩序", level: 2, xp: 74, next: 100, color: "#9bd66f" }
      ],
      boss: "拖延 Boss：选择一个堆积任务，拆成 3 个 20 分钟小回合。",
      achievements: ["连续三天完成状态记录", "完成一次 30 分钟运动", "整理一次桌面"]
    };

    const tasks = [
      { title: "晒太阳或散步 12 分钟", attr: "体能", energy: "低", time: "10 分钟", xp: 5, states: ["低能量", "烦躁", "空虚"], type: "恢复", note: "先让身体离开原地，别急着变强。" },
      { title: "收拾桌面 10 分钟", attr: "秩序", energy: "低", time: "10 分钟", xp: 5, states: ["低能量", "无聊", "空虚"], type: "恢复", note: "只收 10 分钟，结束后允许停止。" },
      { title: "读一页论文或一本书", attr: "智识", energy: "低", time: "10 分钟", xp: 5, states: ["普通", "低能量"], type: "成长", note: "把门槛压低，目标是恢复进入状态的能力。" },
      { title: "跑步或快走 25 分钟", attr: "体能", energy: "中", time: "30 分钟", xp: 20, states: ["烦躁", "普通", "高能量"], type: "成长", note: "适合脑子乱、身体钝的时候。" },
      { title: "做一个代码/AI 小功能", attr: "工程", energy: "中", time: "45 分钟", xp: 20, states: ["普通", "想创造", "高能量"], type: "成长", note: "只做一个可见的小改动，别开大坑。" },
      { title: "画一张速写或 UI 草图", attr: "创造", energy: "中", time: "30 分钟", xp: 20, states: ["想创造", "无聊", "普通"], type: "娱乐", note: "重点是动手，不追求成品。" },
      { title: "给一个朋友发近况", attr: "社交", energy: "低", time: "10 分钟", xp: 5, states: ["想社交", "空虚", "普通"], type: "社交", note: "一句真诚近况就够，不需要组织大型聊天。" },
      { title: "约一顿饭或一次散步", attr: "社交", energy: "中", time: "60 分钟", xp: 20, states: ["想社交", "高能量"], type: "社交", note: "优先约低压力的人。" },
      { title: "完成一个两小时 Boss 回合", attr: "智识", energy: "高", time: "2 小时", xp: 60, states: ["高能量"], type: "Boss", note: "选择论文、实验复盘、代码项目中的一个推进。" },
      { title: "城市探索半天副本", attr: "创造", energy: "高", time: "半天", xp: 60, states: ["无聊", "高能量", "想创造"], type: "娱乐", note: "带着一个主题出门，比如拍 12 张有结构感的照片。" },
      { title: "洗澡 + 换衣 + 清理 5 件物品", attr: "秩序", energy: "低", time: "30 分钟", xp: 20, states: ["低能量", "空虚"], type: "恢复", note: "低谷日的重启组合。" },
      { title: "3D 打印/电子小项目推进一格", attr: "工程", energy: "高", time: "60 分钟", xp: 20, states: ["想创造", "高能量", "无聊"], type: "成长", note: "只推进建模、焊接、测试中的一个步骤。" }
    ];

    const achievements = [
      { id: "first_task", name: "初出茅庐", desc: "完成第一个任务", condition: (s) => s.completedTasks.length >= 1, icon: "🌱" },
      { id: "three_tasks", name: "三连击", desc: "一天完成 3 个任务", condition: (s) => s.completedTasks.length >= 3, icon: "⚡" },
      { id: "streak_3", name: "坚持者", desc: "连续记录 3 天", condition: (s) => currentStreak(s.history) >= 3, icon: "🔥" },
      { id: "streak_7", name: "周常达人", desc: "连续记录 7 天", condition: (s) => currentStreak(s.history) >= 7, icon: "📅" },
      { id: "level_up", name: "升级了", desc: "任意属性升到 Lv.3", condition: (s) => profile.attributes.some(a => a.level >= 3), icon: "⬆️" },
      { id: "all_attrs_2", name: "全面发展", desc: "所有属性达到 Lv.2", condition: (s) => profile.attributes.every(a => a.level >= 2), icon: "🌟" },
      { id: "boss_slayer", name: "Boss 杀手", desc: "完成一个 Boss 任务", condition: (s) => s.completedTasks.some(t => tasks.find(task => task.title === t)?.type === "Boss"), icon: "👹" },
      { id: "social_butterfly", name: "社交蝴蝶", desc: "完成 5 个社交任务", condition: (s) => {
        const socialTasks = s.completedTasks.filter(t => tasks.find(task => task.title === t)?.type === "社交");
        return socialTasks.length >= 5;
      }, icon: "🦋" }
    ];

    const bosses = [
      { id: "procrastination", name: "拖延 Boss", maxHp: 100, currentHp: 60, rounds: 3, completedRounds: 1, reward: { xp: 50, attr: "秩序" }, desc: "选择一个堆积任务，拆成 3 个 20 分钟小回合。" },
      { id: "distraction", name: "分心 Boss", maxHp: 80, currentHp: 80, rounds: 2, completedRounds: 0, reward: { xp: 40, attr: "专注" }, desc: "连续 45 分钟只做一件事，手机放另一个房间。" },
      { id: "perfectionism", name: "完美主义 Boss", maxHp: 120, currentHp: 120, rounds: 4, completedRounds: 0, reward: { xp: 60, attr: "创造" }, desc: "故意做一个'够烂'的版本，30 分钟内不许修改。" }
    ];

    const skills = [
      { id: "morning_run", name: "晨跑", attr: "体能", reqLevel: 3, effect: "解锁晨跑任务，体能 XP+50%", unlocked: false },
      { id: "deep_work", name: "深度工作", attr: "专注", reqLevel: 3, effect: "专注任务时间减半，XP 不变", unlocked: false },
      { id: "social_master", name: "社交达人", attr: "社交", reqLevel: 2, effect: "社交任务 XP+100%", unlocked: false },
      { id: "creative_burst", name: "创意爆发", attr: "创造", reqLevel: 4, effect: "无聊时抽卡必出创造任务", unlocked: false },
      { id: "code_ninja", name: "代码忍者", attr: "工程", reqLevel: 3, effect: "工程任务时间减半", unlocked: false },
      { id: "knowledge_seeker", name: "求知者", attr: "智识", reqLevel: 2, effect: "阅读任务 XP+50%", unlocked: false }
    ];

    const directives = {
      "低能量": "今天先恢复系统稳定性。只做低门槛任务，避免硬打高压 Boss。",
      "普通": "今天适合做 1 个成长任务、1 个生活任务、1 个轻娱乐任务，保持节奏即可。",
      "高能量": "今天可以开 Boss 战。先选一个高价值任务，给它 60 到 120 分钟完整回合。",
      "烦躁": "优先运动、出门、清理环境，让身体先降噪，再考虑学习或项目。",
      "空虚": "优先真实反馈：联系人、换环境、做一个能看见结果的小任务。",
      "无聊": "不要默认刷信息流。抽卡，换地点，做一个有一点随机性的活动。",
      "想社交": "今天适合维护关系。发消息、约饭、语音聊天都算有效推进。",
      "想创造": "把灵感落成一个小作品。画、写、建模、写代码都可以，别让它只停在脑内。"
    };

    const fallbackHistory = [
      { date: "2026-05-13", energy: 2, mood: 3, body: 2, focus: 2, social: 1, mode: "低能量", xp: { "体能": 5, "秩序": 20 }, completedTasks: 2 },
      { date: "2026-05-14", energy: 3, mood: 3, body: 3, focus: 3, social: 2, mode: "普通", xp: { "智识": 5, "创造": 20 }, completedTasks: 2 },
      { date: "2026-05-15", energy: 4, mood: 4, body: 4, focus: 4, social: 3, mode: "高能量", xp: { "智识": 60, "工程": 20 }, completedTasks: 2 },
      { date: "2026-05-16", energy: 3, mood: 2, body: 3, focus: 2, social: 1, mode: "烦躁", xp: { "体能": 20, "秩序": 5 }, completedTasks: 2 },
      { date: "2026-05-17", energy: 3, mood: 3, body: 3, focus: 2, social: 2, mode: "无聊", xp: { "创造": 60, "工程": 20 }, completedTasks: 2 },
      { date: "2026-05-18", energy: 4, mood: 3, body: 4, focus: 3, social: 4, mode: "想社交", xp: { "社交": 20, "体能": 5 }, completedTasks: 2 },
      { date: "2026-05-19", energy: 3, mood: 3, body: 3, focus: 3, social: 3, mode: "普通", xp: { "智识": 5, "创造": 20, "秩序": 5 }, completedTasks: 3 }
    ];

    // localStorage 封装（兼容隐私模式）
    const storage = {
      data: {},
      get(key) {
        try { return localStorage.getItem(key); } catch(e) { return this.data[key] || null; }
      },
      set(key, value) {
        try { localStorage.setItem(key, value); } catch(e) { this.data[key] = value; }
      },
      remove(key) {
        try { localStorage.removeItem(key); } catch(e) { delete this.data[key]; }
      },
      getJSON(key, fallback) {
        const raw = this.get(key);
        if (!raw) return fallback;
        try { return JSON.parse(raw); } catch(e) { return fallback; }
      },
      setJSON(key, value) {
        try { this.set(key, JSON.stringify(value)); } catch(e) { this.data[key] = JSON.stringify(value); }
      }
    };

    const state = {
      mode: storage.get("lifeRpgMode") || "普通",
      history: fallbackHistory,
      completedTasks: storage.getJSON("lifeRpgCompletedTasks", []),
      today: new Date().toISOString().slice(0, 10)
    };

    const remoteStore = window.LifeRpgRemoteStore ? new window.LifeRpgRemoteStore() : null;
    let remoteReady = false;
    let applyingRemote = false;
    let saveStatusTimer = null;

    // 清理过期的完成任务（非今日）
    if (state.completedTasks.length > 0) {
      const savedDate = storage.get("lifeRpgCompletedDate");
      if (savedDate !== state.today) {
        state.completedTasks = [];
        storage.setJSON("lifeRpgCompletedTasks", []);
        storage.set("lifeRpgCompletedDate", state.today);
      }
    } else {
      storage.set("lifeRpgCompletedDate", state.today);
    }

    function handleTaskComplete(event) {
      const taskTitle = event.target.dataset.task;
      const task = tasks.find(t => t.title === taskTitle);
      if (!task) return;

      if (event.target.checked) {
        // 标记完成
        if (!state.completedTasks.includes(taskTitle)) {
          state.completedTasks.push(taskTitle);
          // XP 累加
          addXp(task.attr, task.xp);
          showToast(`✓ 完成「${taskTitle}」 +${task.xp} XP`);
        }
      } else {
        // 取消完成
        state.completedTasks = state.completedTasks.filter(t => t !== taskTitle);
        // XP 扣除
        addXp(task.attr, -task.xp);
        showToast(`↩ 取消「${taskTitle}」 -${task.xp} XP`);
      }

      storage.setJSON("lifeRpgCompletedTasks", state.completedTasks);
      storage.set("lifeRpgCompletedDate", state.today);
      
      // 重新渲染任务卡片和属性面板
      renderTasks();
      buildStats();
    }

    function addXp(attrName, xp) {
      const attr = profile.attributes.find(a => a.name === attrName);
      if (!attr) return;

      attr.xp += xp;
      
      // 检查升级
      while (attr.xp >= attr.next) {
        attr.xp -= attr.next;
        attr.level += 1;
        attr.next = Math.round(attr.next * 1.5); // 下一级所需 XP 增加 50%
        showToast(`🎉 ${attr.name} 升级到 Lv.${attr.level}！`);
      }
      
      // 确保 XP 不为负
      if (attr.xp < 0) attr.xp = 0;
    }

    function showToast(message) {
      let toast = document.getElementById('lifeRpgToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'lifeRpgToast';
        toast.style.cssText = `
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #41d38b, #1f9f83);
          color: #07100d;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 800;
          z-index: 9999;
          transition: opacity 0.3s ease, transform 0.3s ease;
          opacity: 0;
          pointer-events: none;
        `;
        document.body.appendChild(toast);
      }
      
      toast.textContent = message;
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
      
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
      }, 2500);
    }

    async function init() {
      document.getElementById("todayText").textContent = new Date().toLocaleDateString("zh-CN", {
        year: "numeric", month: "2-digit", day: "2-digit", weekday: "short"
      });
      bindRemoteAuth();
      buildModeButtons();
      buildStats();
      bindInputs();
      restoreInputs();
      document.getElementById("recommendBtn").addEventListener("click", () => {
        state.mode = inferMode();
        storage.set("lifeRpgMode", state.mode);
        initTaskPool();
        persistStatus();
        updateAll();
      });
      document.getElementById("resetBtn").addEventListener("click", resetInputs);
      document.getElementById("drawBtn").addEventListener("click", drawBoredom);
      document.getElementById("copyCodexBtn").addEventListener("click", copyForCodex);
      document.getElementById("refreshTasksBtn").addEventListener("click", refreshRecommended);
      document.getElementById("historyFile").addEventListener("change", importHistory);
      document.getElementById("reviewText").value = storage.get("lifeRpgReview") || "";
      document.getElementById("reviewText").addEventListener("input", event => {
        storage.set("lifeRpgReview", event.target.value);
        persistReview(event.target.value);
      });
      initTaskPool();
      await initRemoteStore();
      updateAll();
      loadHistory();
    }

    function bindRemoteAuth() {
      const loginBtn = document.getElementById("loginBtn");
      const logoutBtn = document.getElementById("logoutBtn");
      if (!loginBtn || !logoutBtn) return;
      loginBtn.addEventListener("click", async () => {
        if (!remoteStore?.isConfigured) {
          setSyncStatus("Supabase 未配置，先填写 src/js/config.js", "error");
          return;
        }
        const email = document.getElementById("authEmail").value.trim();
        if (!email) {
          showToast("先填写登录邮箱");
          return;
        }
        try {
          await remoteStore.signInWithEmail(email);
          setSyncStatus("登录链接已发送，打开邮件完成登录", "remote");
        } catch (error) {
          setSyncStatus(`登录失败：${error.message}`, "error");
        }
      });
      logoutBtn.addEventListener("click", async () => {
        await remoteStore.signOut();
        remoteReady = false;
        setSyncStatus("已退出，当前为本地模式", "local");
        toggleAuthControls(false);
      });
    }

    async function initRemoteStore() {
      if (!remoteStore?.isConfigured) {
        setSyncStatus("本地模式：配置 Supabase 后启用多端同步", "local");
        return;
      }
      try {
        const result = await remoteStore.init();
        if (result.mode === "login") {
          setSyncStatus("Supabase 已配置，请登录以启用多端同步", "local");
          toggleAuthControls(false);
          return;
        }
        remoteReady = true;
        toggleAuthControls(true);
        setSyncStatus(`多端同步已启用：${result.user.email || "已登录"}`, "remote");
        await loadRemoteSnapshot();
        remoteStore.subscribeToday(state.today, () => {
          if (!applyingRemote) loadRemoteSnapshot();
        });
      } catch (error) {
        remoteReady = false;
        setSyncStatus(`同步不可用：${error.message}`, "error");
      }
    }

    function setSyncStatus(message, mode) {
      const status = document.getElementById("syncStatus");
      const dot = document.getElementById("syncDot");
      if (!status || !dot) return;
      status.textContent = message;
      dot.className = `sync-dot ${mode === "remote" ? "remote" : mode === "error" ? "error" : ""}`;
    }

    function toggleAuthControls(loggedIn) {
      const email = document.getElementById("authEmail");
      const login = document.getElementById("loginBtn");
      const logout = document.getElementById("logoutBtn");
      if (!email || !login || !logout) return;
      email.hidden = loggedIn;
      login.hidden = loggedIn;
      logout.hidden = !loggedIn;
    }

    async function loadRemoteSnapshot() {
      if (!remoteReady) return;
      applyingRemote = true;
      try {
        const [entry, remoteTasks, remoteAttributes, remoteHistory] = await Promise.all([
          remoteStore.loadTodayState(state.today),
          remoteStore.loadTaskInstances(state.today),
          remoteStore.loadProfileAttributes(profile.attributes),
          remoteStore.loadHistory(30)
        ]);
        profile.attributes = remoteAttributes;
        if (entry) {
          state.mode = entry.mode || state.mode;
          storage.set("lifeRpgMode", state.mode);
          metrics.forEach(metric => {
            if (entry[metric.key] != null) {
              document.getElementById(metric.key).value = entry[metric.key];
              document.getElementById(`${metric.key}Value`).textContent = entry[metric.key];
            }
          });
          if (entry.review != null) {
            document.getElementById("reviewText").value = entry.review || "";
            storage.set("lifeRpgReview", entry.review || "");
          }
        } else {
          await persistStatus();
        }
        if (remoteTasks.length) {
          taskPool.selected = remoteTasks.map(row => ({
            remoteId: row.id,
            title: row.title,
            type: row.task_type,
            attr: row.attribute,
            xp: row.xp,
            time: row.time_label,
            note: row.note,
            completed: row.completed
          }));
          state.completedTasks = taskPool.selected
            .filter(task => task.completed)
            .map(task => task.title);
          storage.setJSON("lifeRpgCompletedTasks", state.completedTasks);
          taskPool.recommended = taskPool.recommended.filter(task =>
            !taskPool.selected.some(selected => selected.title === task.title)
          );
        }
        if (remoteHistory?.length) {
          state.history = remoteHistory;
        }
        buildStats();
        renderTaskList();
        renderRecommendedTasks();
        updateRefreshHint();
        updateAll();
      } catch (error) {
        setSyncStatus(`同步失败：${error.message}`, "error");
      } finally {
        applyingRemote = false;
      }
    }

    function persistStatusDebounced() {
      clearTimeout(saveStatusTimer);
      saveStatusTimer = setTimeout(() => persistStatus(), 500);
    }

    async function persistStatus() {
      if (!remoteReady || applyingRemote) return null;
      try {
        return await remoteStore.saveStatus(state.today, getScores(), state.mode);
      } catch (error) {
        setSyncStatus(`状态未保存：${error.message}`, "error");
        return null;
      }
    }

    async function persistReview(review) {
      if (!remoteReady || applyingRemote) return;
      try {
        await remoteStore.saveReview(state.today, review);
      } catch (error) {
        setSyncStatus(`复盘未保存：${error.message}`, "error");
      }
    }

    function buildModeButtons() {
      const wrap = document.getElementById("modeButtons");
      wrap.innerHTML = modes.map(mode => `<button class="mode-btn" type="button" data-mode="${mode}">${mode}</button>`).join("");
      wrap.querySelectorAll("button").forEach(button => {
        button.addEventListener("click", () => {
          state.mode = button.dataset.mode;
          storage.set("lifeRpgMode", state.mode);
          initTaskPool();
          persistStatus();
          updateAll();
        });
      });
    }

    function buildStats() {
      const stats = document.getElementById("stats");
      stats.innerHTML = profile.attributes.map(item => {
        const pct = Math.round(item.xp / item.next * 100);
        return `
          <div class="stat">
            <div class="stat-head">
              <strong>${item.name} Lv.${item.level}</strong>
              <span>${item.xp}/${item.next} XP</span>
            </div>
            <div class="bar"><span style="width:${pct}%; background:linear-gradient(90deg, ${item.color}, #ffffff);"></span></div>
          </div>`;
      }).join("");
      document.getElementById("bossText").textContent = profile.boss;
      renderAchievements();
    }

    function bindInputs() {
      metrics.forEach(metric => {
        const input = document.getElementById(metric.key);
        const sync = () => syncMetric(metric.key);
        input.addEventListener("input", sync);
        input.addEventListener("change", sync);
        input.addEventListener("pointerup", sync);
        input.addEventListener("keyup", sync);
      });
    }

    function syncMetric(key) {
      const input = document.getElementById(key);
      document.getElementById(`${key}Value`).textContent = input.value;
      saveInputs();
      persistStatusDebounced();
      updateRadar();
    }

    function restoreInputs() {
      metrics.forEach(metric => {
        const saved = storage.get(`lifeRpg_${metric.key}`);
        if (saved) document.getElementById(metric.key).value = saved;
        syncMetric(metric.key);
      });
    }

    function saveInputs() {
      metrics.forEach(metric => storage.set(`lifeRpg_${metric.key}`, document.getElementById(metric.key).value));
    }

    function resetInputs() {
      metrics.forEach(metric => {
        document.getElementById(metric.key).value = 3;
        document.getElementById(`${metric.key}Value`).textContent = 3;
        storage.remove(`lifeRpg_${metric.key}`);
      });
      state.mode = "普通";
      storage.set("lifeRpgMode", state.mode);
      initTaskPool();
      persistStatus();
      updateAll();
    }

    function getScores() {
      return Object.fromEntries(metrics.map(metric => [metric.key, Number(document.getElementById(metric.key).value)]));
    }

    function inferMode() {
      const s = getScores();
      const avg = (s.energy + s.mood + s.body + s.focus) / 4;
      if (s.social >= 4 && s.energy >= 3) return "想社交";
      if (s.energy <= 2 || s.body <= 2) return "低能量";
      if (s.mood <= 2 && s.energy >= 3) return "烦躁";
      if (s.mood <= 2 && s.social <= 2) return "空虚";
      if (s.energy >= 4 && s.focus >= 4) return "高能量";
      if (avg >= 3.2 && s.focus <= 2) return "无聊";
      return "普通";
    }

    function checkAchievements() {
      const unlocked = JSON.parse(storage.get("lifeRpgAchievements") || "[]");
      let newUnlock = false;
      
      achievements.forEach(ach => {
        if (!unlocked.includes(ach.id) && ach.condition(state)) {
          unlocked.push(ach.id);
          newUnlock = true;
          showToast(`🏆 解锁成就「${ach.name}」：${ach.desc}`);
        }
      });
      
      if (newUnlock) {
        storage.setJSON("lifeRpgAchievements", unlocked);
        renderAchievements();
      }
    }

    function renderAchievements() {
      const unlocked = JSON.parse(storage.get("lifeRpgAchievements") || "[]");
      const container = document.getElementById("achievementText");
      if (!container) return;
      
      const html = achievements.map(ach => {
        const isUnlocked = unlocked.includes(ach.id);
        return `<span class="achievement-badge ${isUnlocked ? 'unlocked' : 'locked'}">${ach.icon} ${ach.name}</span>`;
      }).join(" ");
      
      container.innerHTML = html;
    }

    function renderBoss() {
      const boss = bosses[0]; // 当前 Boss
      const hpPct = Math.round(boss.currentHp / boss.maxHp * 100);
      const roundPct = Math.round(boss.completedRounds / boss.rounds * 100);
      
      document.getElementById("bossText").innerHTML = `
        <div style="margin-bottom: 8px;">
          <strong>${boss.name}</strong> 
          <span style="color: var(--muted); font-size: 12px;">回合 ${boss.completedRounds}/${boss.rounds}</span>
        </div>
        <div style="font-size: 13px; color: var(--muted); margin-bottom: 10px;">${boss.desc}</div>
        <div style="display: grid; gap: 6px;">
          <div style="display: flex; justify-content: space-between; font-size: 12px;">
            <span>HP</span>
            <span>${boss.currentHp}/${boss.maxHp}</span>
          </div>
          <div class="bar" style="height: 16px;">
            <span style="width: ${hpPct}%; background: linear-gradient(90deg, var(--red), #ff8a65);"></span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 4px;">
            <span>回合进度</span>
            <span>${roundPct}%</span>
          </div>
          <div class="bar" style="height: 10px; background: #0e1115;">
            <span style="width: ${roundPct}%; background: linear-gradient(90deg, var(--cyan), #80deea);"></span>
          </div>
        </div>
      `;
    }

    function renderSkillTree() {
      const container = document.getElementById("skillTree");
      if (!container) return;
      
      const html = skills.map(skill => {
        const attr = profile.attributes.find(a => a.name === skill.attr);
        const canUnlock = attr && attr.level >= skill.reqLevel;
        const isUnlocked = skill.unlocked || canUnlock;
        
        if (canUnlock && !skill.unlocked) {
          skill.unlocked = true;
          showToast(`🔓 解锁技能「${skill.name}」：${skill.effect}`);
        }
        
        return `
          <div class="skill-node ${isUnlocked ? 'unlocked' : 'locked'}">
            <div class="skill-icon">${isUnlocked ? '🔓' : '🔒'}</div>
            <div class="skill-name">${skill.name}</div>
            <div class="skill-attr">${skill.attr} Lv.${skill.reqLevel}</div>
            <div class="skill-effect">${skill.effect}</div>
          </div>
        `;
      }).join("");
      
      container.innerHTML = html;
    }

    function updateAll() {
      document.querySelectorAll(".mode-btn").forEach(button => {
        button.classList.toggle("active", button.dataset.mode === state.mode);
      });
      document.getElementById("modeBadge").textContent = state.mode;
      document.getElementById("directiveText").textContent = directives[state.mode];
      updateRadar();
      renderHistory();
      checkAchievements();
      renderAchievements();
      renderBoss();
      renderSkillTree();
      // Task pool is initialized separately
    }

    function updateRadar() {
      const canvas = document.getElementById("radar");
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = 150;
      const scores = getScores();
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.font = "15px Microsoft YaHei, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let ring = 1; ring <= 5; ring++) {
        drawPolygon(ctx, metrics.map((_, i) => point(i, ring / 5 * radius, cx, cy)), "rgba(255,255,255,.13)", null);
      }

      metrics.forEach((metric, i) => {
        const outer = point(i, radius, cx, cy);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(outer.x, outer.y);
        ctx.strokeStyle = "rgba(255,255,255,.14)";
        ctx.stroke();
        const label = point(i, radius + 34, cx, cy);
        ctx.fillStyle = "#dfeaf0";
        ctx.fillText(metric.label, label.x, label.y);
      });

      const dataPoints = metrics.map((metric, i) => point(i, scores[metric.key] / 5 * radius, cx, cy));
      drawPolygon(ctx, dataPoints, "#41d38b", "rgba(65, 211, 139, .32)");
      dataPoints.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#f3b94e";
        ctx.fill();
      });
    }

    function point(index, r, cx, cy) {
      const angle = Math.PI * 2 / metrics.length * index - Math.PI / 2;
      return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
    }

    function drawPolygon(ctx, points, stroke, fill) {
      ctx.beginPath();
      points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.closePath();
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }

    // 任务池管理
    const taskPool = {
      available: [],
      selected: [],
      completed: [],
      recommended: []
    };

    function initTaskPool() {
      const matched = tasks.filter(task => task.states.includes(state.mode));
      const fallback = tasks.filter(task => ["普通", "低能量"].some(s => task.states.includes(s)));
      taskPool.available = matched.length >= 3 ? [...matched] : [...matched, ...fallback];
      taskPool.selected = [];
      taskPool.completed = [];
      taskPool.recommended = [];
      refreshRecommended();
    }

    function refreshRecommended() {
      const pool = taskPool.available.filter(task =>
        !taskPool.selected.some(s => s.title === task.title) &&
        !taskPool.recommended.some(r => r.title === task.title)
      );
      if (pool.length === 0) {
        const resetPool = tasks.filter(task =>
          !taskPool.selected.some(s => s.title === task.title)
        );
        if (resetPool.length === 0) {
          taskPool.recommended = [];
          return;
        }
        taskPool.recommended = shuffleArray(resetPool).slice(0, 3);
      } else {
        taskPool.recommended = shuffleArray(pool).slice(0, 3);
      }
      renderRecommendedTasks();
      updateRefreshHint();
    }

    function shuffleArray(array) {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }

    async function addToList(task) {
      if (taskPool.selected.length >= 5) {
        showToast("任务清单已满（最多5个），先完成一些吧！");
        return;
      }
      if (taskPool.selected.some(s => s.title === task.title)) {
        showToast("这个任务已经在清单里了");
        return;
      }
      const selectedTask = {...task, completed: false};
      taskPool.selected.push(selectedTask);
      taskPool.recommended = taskPool.recommended.filter(r => r.title !== task.title);
      renderRecommendedTasks();
      renderTaskList();
      updateRefreshHint();
      if (remoteReady) {
        try {
          await persistStatus();
          const row = await remoteStore.addTaskToToday(state.today, selectedTask);
          selectedTask.remoteId = row?.id;
          renderTaskList();
        } catch (error) {
          setSyncStatus(`任务未同步：${error.message}`, "error");
        }
      }
      showToast(`✓ 已添加「${task.title}」到清单`);
    }

    async function removeFromList(taskTitle) {
      const task = taskPool.selected.find(s => s.title === taskTitle);
      taskPool.selected = taskPool.selected.filter(s => s.title !== taskTitle);
      renderTaskList();
      updateRefreshHint();
      if (remoteReady && task?.remoteId) {
        try {
          await remoteStore.removeTask(task.remoteId);
        } catch (error) {
          setSyncStatus(`删除未同步：${error.message}`, "error");
        }
      }
    }

    async function toggleTaskComplete(taskTitle) {
      const task = taskPool.selected.find(s => s.title === taskTitle);
      if (!task) return;
      task.completed = !task.completed;
      if (task.completed) {
        if (!state.completedTasks.includes(taskTitle)) state.completedTasks.push(taskTitle);
        addXp(task.attr, task.xp);
        showToast(`✓ 完成「${taskTitle}」 +${task.xp} XP`);
      } else {
        state.completedTasks = state.completedTasks.filter(title => title !== taskTitle);
        addXp(task.attr, -task.xp);
        showToast(`↩ 取消完成「${taskTitle}」 -${task.xp} XP`);
      }
      storage.setJSON("lifeRpgCompletedTasks", state.completedTasks);
      storage.set("lifeRpgCompletedDate", state.today);
      renderTaskList();
      buildStats();
      if (remoteReady) {
        try {
          if (!task.remoteId) {
            const row = await remoteStore.addTaskToToday(state.today, task);
            task.remoteId = row?.id;
          }
          await remoteStore.completeTask(task.remoteId, task.completed);
          await remoteStore.saveProfileAttributes(profile.attributes);
          await persistStatus();
        } catch (error) {
          setSyncStatus(`完成状态未同步：${error.message}`, "error");
        }
      }
    }

    function renderRecommendedTasks() {
      const container = document.getElementById("recommendedTasks");
      if (!container) return;
      if (taskPool.recommended.length === 0) {
        container.innerHTML = `<div class="empty-recommended"><p>没有更多推荐了，点击刷新或调整状态</p></div>`;
        return;
      }
      container.innerHTML = taskPool.recommended.map(task => `
        <article class="task-card recommended">
          <div class="task-header"><div class="task-kind">${task.type}</div></div>
          <h3>${task.title}</h3>
          <p>${task.note}</p>
          <div class="task-meta">
            <span class="pill">${task.attr}</span>
            <span class="pill">${task.time}</span>
            <span class="pill">+${task.xp} XP</span>
          </div>
          <div class="task-actions">
            <button class="primary-btn add-btn" data-task="${task.title}" type="button">➕ 加入清单</button>
            <button class="ghost-btn skip-btn" data-task="${task.title}" type="button">⏭️ 跳过</button>
          </div>
        </article>
      `).join("");
      container.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const task = tasks.find(t => t.title === btn.dataset.task);
          if (task) addToList(task);
        });
      });
      container.querySelectorAll('.skip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          taskPool.recommended = taskPool.recommended.filter(r => r.title !== btn.dataset.task);
          renderRecommendedTasks();
          updateRefreshHint();
        });
      });
    }

    function renderTaskList() {
      const container = document.getElementById("taskList");
      if (!container) return;
      if (taskPool.selected.length === 0) {
        container.innerHTML = `<div class="empty-list">还没有选择任务，从上方推荐区添加</div>`;
        updateListStats();
        return;
      }
      container.innerHTML = taskPool.selected.map(task => `
        <div class="task-list-item ${task.completed ? 'completed' : ''}">
          <label class="task-check">
            <input type="checkbox" ${task.completed ? 'checked' : ''} data-task="${task.title}">
            <span>${task.completed ? '✓' : ''}</span>
          </label>
          <div class="task-info">
            <div class="task-title">${task.title}</div>
            <div class="task-meta-small">
              <span class="pill">${task.type}</span>
              <span class="pill">${task.attr}</span>
              <span class="pill">+${task.xp} XP</span>
            </div>
          </div>
          <button class="remove-btn" data-task="${task.title}" type="button">✕</button>
        </div>
      `).join("");
      container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => toggleTaskComplete(checkbox.dataset.task));
      });
      container.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => removeFromList(btn.dataset.task));
      });
      updateListStats();
    }

    function updateRefreshHint() {
      const remaining = tasks.filter(task =>
        !taskPool.selected.some(s => s.title === task.title)
      ).length;
      const hint = document.getElementById("refreshHint");
      const count = document.getElementById("remainingCount");
      if (hint && count) {
        count.textContent = remaining;
        hint.style.display = remaining > 0 ? 'block' : 'none';
      }
    }

    function updateListStats() {
      const stats = document.getElementById("listStats");
      const xp = document.getElementById("listXp");
      if (stats && xp) {
        const completed = taskPool.selected.filter(s => s.completed).length;
        const total = taskPool.selected.length;
        const totalXp = taskPool.selected.filter(s => s.completed).reduce((sum, t) => sum + t.xp, 0);
        stats.textContent = `${completed}/${total} 任务`;
        xp.textContent = `${totalXp} XP`;
      }
    }

    function drawBoredom() {
      const pool = tasks.filter(task => task.states.includes(state.mode));
      const drawPool = pool.length ? pool : tasks;
      const task = drawPool[Math.floor(Math.random() * drawPool.length)];
      document.getElementById("drawResult").innerHTML = `<strong>${task.title}</strong><br>${task.note}<br><span class="small-muted">${task.time} · ${task.attr} · +${task.xp} XP</span>`;
    }

    async function copyForCodex() {
      const text = buildCodexPayload();
      const status = document.getElementById("copyStatus");
      try {
        await navigator.clipboard.writeText(text);
        status.textContent = "已复制。把剪贴板内容发给 Codex 即可写入 records。";
      } catch (error) {
        status.textContent = "浏览器阻止自动复制，请手动选中下方文本复制。";
        showCopyFallback(text);
      }
    }

    function buildCodexPayload() {
      const scores = getScores();
      const date = new Date().toISOString().slice(0, 10);
      const selected = taskPool.selected.length ? taskPool.selected : getCurrentRecommendedTasks();
      const review = document.getElementById("reviewText").value.trim();
      const taskLines = selected.map(task => `- ${task.type}任务：${task.title}｜${task.attr}｜+${task.xp} XP`).join("\n");
      const xpLines = summarizeXp(selected).map(([attr, xp]) => `- ${attr}：${xp}`).join("\n");
      return [
        "启动人生 RPG",
        `日期：${date}`,
        `精力：${scores.energy}`,
        `情绪：${scores.mood}`,
        `身体：${scores.body}`,
        `专注：${scores.focus}`,
        `社交欲：${scores.social}`,
        `状态：${state.mode}`,
        "今日推荐：",
        taskLines,
        "XP 归属：",
        xpLines,
        "一句复盘：",
        review || "（未填写）"
      ].join("\n");
    }

    function getCurrentRecommendedTasks() {
      const matched = tasks.filter(task => task.states.includes(state.mode));
      const fallback = tasks.filter(task => ["普通", "低能量"].some(s => task.states.includes(s)));
      const pool = matched.length >= 3 ? matched : [...matched, ...fallback];
      return pickTaskSet(pool);
    }

    function summarizeXp(selected) {
      const attrs = ["体能", "智识", "创造", "工程", "社交", "秩序"];
      const totals = Object.fromEntries(attrs.map(attr => [attr, 0]));
      selected.forEach(task => {
        totals[task.attr] = (totals[task.attr] || 0) + task.xp;
      });
      return attrs.map(attr => [attr, totals[attr]]);
    }

    function showCopyFallback(text) {
      let box = document.getElementById("codexPayloadFallback");
      if (!box) {
        box = document.createElement("textarea");
        box.id = "codexPayloadFallback";
        box.readOnly = true;
        box.style.minHeight = "180px";
        document.querySelector("aside .panel-body").appendChild(box);
      }
      box.value = text;
      box.focus();
      box.select();
    }

    async function loadHistory() {
      if (remoteReady) {
        try {
          const remoteHistory = await remoteStore.loadHistory(30);
          if (remoteHistory?.length) {
            state.history = remoteHistory;
            document.getElementById("historySource").textContent = "已从 Supabase 实时数据读取历史";
            renderHistory();
            return;
          }
        } catch (error) {
          setSyncStatus(`历史同步失败：${error.message}`, "error");
        }
      }
      if (location.protocol === "file:") {
        state.history = fallbackHistory;
        document.getElementById("historySource").textContent = "当前为本地文件模式；如需真实历史，请导入 data/history.json";
        renderHistory();
        return;
      }
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const response = await fetch("data/history.json", { cache: "no-store", signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        state.history = normalizeHistory(payload);
        document.getElementById("historySource").textContent = "已读取 data/history.json";
      } catch (error) {
        state.history = fallbackHistory;
        document.getElementById("historySource").textContent = "当前使用内置示例；本地双击受限时可手动导入 history.json";
      }
      renderHistory();
    }

    function importHistory(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          state.history = normalizeHistory(JSON.parse(reader.result));
          document.getElementById("historySource").textContent = `已导入 ${file.name}`;
          renderHistory();
        } catch (error) {
          document.getElementById("historySource").textContent = "导入失败：history.json 格式不正确";
        }
      };
      reader.readAsText(file, "utf-8");
    }

    function normalizeHistory(payload) {
      const records = Array.isArray(payload) ? payload : payload.records;
      return records
        .map(record => ({
          date: record.date,
          energy: Number(record.energy || record.scores?.energy || 0),
          mood: Number(record.mood || record.scores?.mood || 0),
          body: Number(record.body || record.scores?.body || 0),
          focus: Number(record.focus || record.scores?.focus || 0),
          social: Number(record.social || record.scores?.social || 0),
          mode: record.mode || "普通",
          xp: record.xp || {},
          completedTasks: Number(record.completedTasks || 0)
        }))
        .filter(record => record.date)
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    function renderHistory() {
      const records = state.history.slice(-30);
      if (!records.length) return;
      const lowDays = records.filter(record => record.mode === "低能量" || record.energy <= 2).length;
      const avgEnergy = average(records.map(record => record.energy));
      const streak = currentStreak(records);
      const topAttr = topXpAttribute(records);
      document.getElementById("historySummary").innerHTML = [
        { value: `${streak} 天`, label: "连续记录" },
        { value: avgEnergy.toFixed(1), label: "30 天平均精力" },
        { value: `${lowDays} 天`, label: "低能量/恢复日" },
        { value: topAttr, label: "最高频 XP 属性" }
      ].map(item => `<div class="history-kpi"><strong>${item.value}</strong><span>${item.label}</span></div>`).join("");
      drawTrend(records.slice(-7));
      renderWeeklyReport(records);
      renderHeatmap(records);
    }

    function renderWeeklyReport(records) {
      const weekRecords = records.slice(-7);
      const topAttr = topXpAttribute(weekRecords);
      
      // 模式分布饼图
      const modeCounts = {};
      weekRecords.forEach(r => {
        modeCounts[r.mode] = (modeCounts[r.mode] || 0) + 1;
      });
      drawModePie(modeCounts);
      
      // 属性成长柱状图
      const attrGrowth = {};
      weekRecords.forEach(r => {
        Object.entries(r.xp || {}).forEach(([attr, xp]) => {
          attrGrowth[attr] = (attrGrowth[attr] || 0) + xp;
        });
      });
      drawAttrGrowth(attrGrowth);
      
      // 任务完成率
      const totalTasks = weekRecords.reduce((sum, r) => sum + (r.completedTasks || 0), 0);
      const avgCompletion = weekRecords.length ? (totalTasks / weekRecords.length / 3 * 100).toFixed(0) : 0;
      document.getElementById("completionRate").textContent = `${avgCompletion}%`;
      
      // 本周总结
      const modes = Object.entries(modeCounts).sort((a, b) => b[1] - a[1]);
      const dominantMode = modes[0]?.[0] || "普通";
      const summary = `本周主导状态：<strong>${dominantMode}</strong>。<br>
        共记录 ${weekRecords.length} 天，完成任务 ${totalTasks} 个。<br>
        最高频属性：${topAttr || "暂无"}。<br>
        ${avgCompletion >= 80 ? "🎉 完成率优秀！" : avgCompletion >= 50 ? "📈 完成率良好，继续加油。" : "💪 下周争取完成更多任务！"}`;
      document.getElementById("weekSummary").innerHTML = summary;
    }

    function drawModePie(modeCounts) {
      const canvas = document.getElementById("modePie");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) / 2 - 10;
      
      ctx.clearRect(0, 0, w, h);
      
      const colors = ["#41d38b", "#48c9e8", "#f3b94e", "#a98bff", "#f06d62", "#9bd66f", "#ff8a65", "#80deea"];
      const total = Object.values(modeCounts).reduce((a, b) => a + b, 0);
      let startAngle = -Math.PI / 2;
      
      Object.entries(modeCounts).forEach(([mode, count], i) => {
        const angle = (count / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, startAngle + angle);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.strokeStyle = "#11161c";
        ctx.lineWidth = 2;
        ctx.stroke();
        startAngle += angle;
      });
      
      // 中心空白
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = "#181c22";
      ctx.fill();
      
      // 中心文字
      ctx.fillStyle = "#dfeaf0";
      ctx.font = "bold 14px Microsoft YaHei";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("模式", cx, cy - 8);
      ctx.font = "12px Microsoft YaHei";
      ctx.fillStyle = "#9aa8b6";
      ctx.fillText(`${total}天`, cx, cy + 10);
    }

    function drawAttrGrowth(attrGrowth) {
      const canvas = document.getElementById("attrGrowth");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;
      const pad = { left: 40, right: 10, top: 20, bottom: 30 };
      const plotW = w - pad.left - pad.right;
      const plotH = h - pad.top - pad.bottom;
      
      ctx.clearRect(0, 0, w, h);
      
      const attrs = Object.entries(attrGrowth).sort((a, b) => b[1] - a[1]);
      if (!attrs.length) {
        ctx.fillStyle = "#9aa8b6";
        ctx.font = "13px Microsoft YaHei";
        ctx.textAlign = "center";
        ctx.fillText("暂无 XP 数据", w / 2, h / 2);
        return;
      }
      const max = Math.max(...attrs.map(a => a[1]), 1);
      const barW = plotW / attrs.length * 0.6;
      const gap = plotW / attrs.length;
      
      attrs.forEach(([attr, xp], i) => {
        const x = pad.left + i * gap + (gap - barW) / 2;
        const barH = (xp / max) * plotH;
        const y = pad.top + plotH - barH;
        
        // 柱状图
        ctx.fillStyle = `hsl(${120 + i * 30}, 70%, 60%)`;
        ctx.fillRect(x, y, barW, barH);
        
        // 数值
        ctx.fillStyle = "#dfeaf0";
        ctx.font = "11px Microsoft YaHei";
        ctx.textAlign = "center";
        ctx.fillText(xp, x + barW / 2, y - 5);
        
        // 属性名
        ctx.fillStyle = "#9aa8b6";
        ctx.fillText(attr, x + barW / 2, h - 10);
      });
    }

    function renderHeatmap(records) {
      const container = document.getElementById("heatmap");
      if (!container) return;
      
      const days = ["日", "一", "二", "三", "四", "五", "六"];
      const today = new Date();
      let html = "";
      
      // 表头
      days.forEach(day => {
        html += `<div class="heatmap-weekday">${day}</div>`;
      });
      
      // 过去 30 天
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().slice(0, 10);
        const record = records.find(r => r.date === dateStr);
        
        let intensity = 0;
        let title = dateStr;
        if (record) {
          intensity = Math.round((record.energy + record.mood + record.body + record.focus + record.social) / 25 * 4);
          intensity = Math.min(intensity, 4);
          title = `${dateStr} 精力${record.energy} 情绪${record.mood} 身体${record.body}`;
        }
        
        const colors = [
          "rgba(255,255,255,0.05)",
          "rgba(65,211,139,0.2)",
          "rgba(65,211,139,0.4)",
          "rgba(65,211,139,0.6)",
          "rgba(65,211,139,0.9)"
        ];
        
        html += `<div class="heatmap-cell" style="background:${colors[intensity]}" title="${title}">${date.getDate()}</div>`;
      }
      
      container.innerHTML = html;
    }

    function drawTrend(records) {
      const canvas = document.getElementById("trend");
      canvas.classList.add("trend-chart");
      const cssWidth = canvas.clientWidth || 920;
      const cssHeight = canvas.clientHeight || 320;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(cssWidth * ratio);
      canvas.height = Math.round(cssHeight * ratio);
      const ctx = canvas.getContext("2d");
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const w = cssWidth;
      const h = cssHeight;
      const pad = { left: 48, right: 24, top: 26, bottom: 78 };
      const plotW = w - pad.left - pad.right;
      const plotH = h - pad.top - pad.bottom;
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      roundRect(ctx, pad.left, pad.top, plotW, plotH, 8);
      ctx.fillStyle = "rgba(255, 255, 255, .025)";
      ctx.fill();

      for (let score = 1; score <= 5; score++) {
        const y = pad.top + plotH - (score - 1) / 4 * plotH;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(w - pad.right, y);
        ctx.lineWidth = score === 1 ? 1.2 : 1;
        ctx.strokeStyle = score === 1 ? "rgba(255,255,255,.20)" : "rgba(255,255,255,.09)";
        ctx.stroke();
        ctx.fillStyle = "#9aa8b6";
        ctx.font = "12px Microsoft YaHei, PingFang SC, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(String(score), pad.left - 14, y + 4);
      }

      const series = [
        { key: "energy", label: "精力", color: "#41d38b" },
        { key: "mood", label: "情绪", color: "#f3b94e" },
        { key: "body", label: "身体", color: "#48c9e8" },
        { key: "focus", label: "专注", color: "#a98bff" },
        { key: "social", label: "社交", color: "#f06d62" }
      ];

      series.forEach((item, seriesIndex) => {
        const points = records.map((record, index) => ({
          x: pad.left + (records.length === 1 ? plotW / 2 : index / (records.length - 1) * plotW),
          y: pad.top + plotH - (record[item.key] - 1) / 4 * plotH
        }));
        ctx.beginPath();
        drawPointAlignedLine(ctx, points);
        ctx.shadowColor = item.color;
        ctx.shadowBlur = 7;
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 2.4;
        ctx.stroke();
        ctx.shadowBlur = 0;
        points.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4.2, 0, Math.PI * 2);
          ctx.fillStyle = item.color;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#11161c";
          ctx.stroke();
        });
        ctx.fillStyle = item.color;
        ctx.textAlign = "left";
        ctx.font = "12px Microsoft YaHei, PingFang SC, sans-serif";
        const lx = pad.left + (seriesIndex % 3) * 98;
        const ly = h - 42 + Math.floor(seriesIndex / 3) * 22;
        ctx.beginPath();
        ctx.arc(lx, ly - 4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(item.label, lx + 10, ly);
      });

      ctx.fillStyle = "#9aa8b6";
      ctx.textAlign = "center";
      ctx.font = "12px Microsoft YaHei, PingFang SC, sans-serif";
      records.forEach((record, index) => {
        const x = pad.left + (records.length === 1 ? plotW / 2 : index / (records.length - 1) * plotW);
        ctx.fillText(record.date.slice(5), x, h - 58);
      });
      ctx.lineWidth = 1;
    }

    function drawPointAlignedLine(ctx, points) {
      if (!points.length) return;
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach(point => ctx.lineTo(point.x, point.y));
    }

    function roundRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    function average(values) {
      const valid = values.filter(value => Number.isFinite(value) && value > 0);
      return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 0;
    }

    function currentStreak(records) {
      const dates = new Set(records.map(record => record.date));
      let cursor = new Date(records[records.length - 1].date + "T00:00:00");
      let count = 0;
      while (dates.has(cursor.toISOString().slice(0, 10))) {
        count += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
      return count;
    }

    function topXpAttribute(records) {
      const totals = {};
      records.forEach(record => {
        Object.entries(record.xp || {}).forEach(([key, value]) => {
          totals[key] = (totals[key] || 0) + Number(value || 0);
        });
      });
      const winner = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
      return winner ? winner[0] : "暂无";
    }

    init();
