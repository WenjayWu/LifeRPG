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

    // 任务数据：从 JSON 加载，失败时回退到本地 fallback
    let tasks = [];
    const FALLBACK_TASKS = [
      { key: "sun_walk", title: "晒太阳或散步 12 分钟", attr: "体能", energy: "低", time: "10 分钟", xp: 5, states: ["低能量", "烦躁", "空虚"], type: "恢复", note: "先让身体离开原地，别急着变强。", pool: "daily" },
      { key: "tidy_desk", title: "收拾桌面 10 分钟", attr: "秩序", energy: "低", time: "10 分钟", xp: 5, states: ["低能量", "无聊", "空虚"], type: "恢复", note: "只收 10 分钟，结束后允许停止。", pool: "daily" },
      { key: "read_page", title: "读一页论文或一本书", attr: "智识", energy: "低", time: "10 分钟", xp: 5, states: ["普通", "低能量"], type: "成长", note: "把门槛压低，目标是恢复进入状态的能力。", pool: "daily" },
      { key: "run_25min", title: "跑步或快走 25 分钟", attr: "体能", energy: "中", time: "30 分钟", xp: 20, states: ["烦躁", "普通", "高能量"], type: "成长", note: "适合脑子乱、身体钝的时候。", pool: "daily" },
      { key: "code_snippet", title: "做一个代码/AI 小功能", attr: "工程", energy: "中", time: "45 分钟", xp: 20, states: ["普通", "想创造", "高能量"], type: "成长", note: "只做一个可见的小改动，别开大坑。", pool: "daily" },
      { key: "sketch", title: "画一张速写或 UI 草图", attr: "创造", energy: "中", time: "30 分钟", xp: 20, states: ["想创造", "无聊", "普通"], type: "娱乐", note: "重点是动手，不追求成品。", pool: "creative" },
      { key: "social_msg", title: "给一个朋友发近况", attr: "社交", energy: "低", time: "10 分钟", xp: 5, states: ["想社交", "空虚", "普通"], type: "社交", note: "一句真诚近况就够，不需要组织大型聊天。", pool: "daily" },
      { key: "social_meal", title: "约一顿饭或一次散步", attr: "社交", energy: "中", time: "60 分钟", xp: 20, states: ["想社交", "高能量"], type: "社交", note: "优先约低压力的人。", pool: "daily" },
      { key: "boss_round", title: "完成一个两小时 Boss 回合", attr: "智识", energy: "高", time: "2 小时", xp: 60, states: ["高能量"], type: "Boss", note: "选择论文、实验复盘、代码项目中的一个推进。", pool: "daily" },
      { key: "city_explore", title: "城市探索半天副本", attr: "创造", energy: "高", time: "半天", xp: 60, states: ["无聊", "高能量", "想创造"], type: "娱乐", note: "带着一个主题出门，比如拍 12 张有结构感的照片。", pool: "creative" },
      { key: "shower_reset", title: "洗澡 + 换衣 + 清理 5 件物品", attr: "秩序", energy: "低", time: "30 分钟", xp: 20, states: ["低能量", "空虚"], type: "恢复", note: "低谷日的重启组合。", pool: "daily" },
      { key: "3d_print", title: "3D 打印/电子小项目推进一格", attr: "工程", energy: "高", time: "60 分钟", xp: 20, states: ["想创造", "高能量", "无聊"], type: "成长", note: "只推进建模、焊接、测试中的一个步骤。", pool: "daily" }
    ];

    async function loadTasks() {
      try {
        const response = await fetch('data/tasks.json');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          tasks = data.map(normalizeTask);
          console.log(`[LifeRPG] 加载任务库: ${tasks.length} 个任务`);
          return true;
        }
      } catch (error) {
        console.warn('[LifeRPG] 加载任务库失败，使用 fallback:', error.message);
      }
      tasks = FALLBACK_TASKS.map(normalizeTask);
      return false;
    }

    function normalizeTask(task) {
      return { ...task, key: task.key || task.title };
    }

    function taskKey(task) {
      return task?.key || task?.title || "";
    }

    function sameTask(a, b) {
      if (!a || !b) return false;
      return taskKey(a) === taskKey(b) || a.title === b.title;
    }

    function findTaskByKeyOrTitle(value) {
      return tasks.find(task => task.key === value || task.title === value);
    }

    const achievements = [
      { id: "first_task", name: "初出茅庐", desc: "完成第一个任务", condition: (s) => s.completedTasks.length >= 1, icon: "🌱" },
      { id: "three_tasks", name: "三连击", desc: "一天完成 3 个任务", condition: (s) => s.completedTasks.length >= 3, icon: "⚡" },
      { id: "streak_3", name: "坚持者", desc: "连续记录 3 天", condition: (s) => currentStreak(s.history) >= 3, icon: "🔥" },
      { id: "streak_7", name: "周常达人", desc: "连续记录 7 天", condition: (s) => currentStreak(s.history) >= 7, icon: "📅" },
      { id: "level_up", name: "升级了", desc: "任意属性升到 Lv.3", condition: (s) => profile.attributes.some(a => a.level >= 3), icon: "⬆️" },
      { id: "all_attrs_2", name: "全面发展", desc: "所有属性达到 Lv.2", condition: (s) => profile.attributes.every(a => a.level >= 2), icon: "🌟" },
      { id: "boss_slayer", name: "Boss 杀手", desc: "完成一个 Boss 任务", condition: (s) => s.completedTasks.some(t => findTaskByKeyOrTitle(t)?.type === "Boss"), icon: "👹" },
      { id: "social_butterfly", name: "社交蝴蝶", desc: "完成 5 个社交任务", condition: (s) => {
        const socialTasks = s.completedTasks.filter(t => findTaskByKeyOrTitle(t)?.type === "社交");
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
      today: new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-")
    };

    const remoteStore = window.LifeRpgRemoteStore ? new window.LifeRpgRemoteStore() : null;
    let remoteReady = false;
    let applyingRemote = false;
    let saveStatusTimer = null;
    let networkOnline = navigator.onLine !== false;
    let lastSyncStatus = { message: "本地模式", mode: "local" };

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
      const task = findTaskByKeyOrTitle(event.target.dataset.task);
      if (!task) return;
      const key = taskKey(task);

      if (event.target.checked) {
        // 标记完成
        if (!state.completedTasks.includes(key)) {
          state.completedTasks.push(key);
          // XP 累加
          addXp(task.attr, task.xp);
          showToast(`✓ 完成「${task.title}」 +${task.xp} XP`);
        }
      } else {
        // 取消完成
        state.completedTasks = state.completedTasks.filter(t => t !== key);
        // XP 扣除
        addXp(task.attr, -task.xp);
        showToast(`↩ 取消「${task.title}」 -${task.xp} XP`);
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
      
      // 保存到 localStorage，避免刷新丢失
      storage.setJSON("lifeRpgProfile", profile.attributes);
    }

    function loadProfile() {
      const saved = storage.getJSON("lifeRpgProfile");
      if (saved && Array.isArray(saved)) {
        saved.forEach(savedAttr => {
          const attr = profile.attributes.find(a => a.name === savedAttr.name);
          if (attr) {
            attr.level = savedAttr.level || attr.level;
            attr.xp = savedAttr.xp || 0;
            attr.next = savedAttr.next || attr.next;
          }
        });
      }
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
      // 先加载任务库（在线优先，离线回退到 fallback）
      await loadTasks();
      
      document.getElementById("todayText").textContent = new Date().toLocaleDateString("zh-CN", {
        year: "numeric", month: "2-digit", day: "2-digit", weekday: "short"
      });
      bindRemoteAuth();
      bindNetworkStatus();
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
      initMonthSelector();
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
        if (!networkOnline) {
          setSyncStatus("当前离线，恢复网络后再发送登录链接", "error");
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

    function bindNetworkStatus() {
      renderSyncStatus(lastSyncStatus.message, lastSyncStatus.mode);
      window.addEventListener("offline", () => {
        networkOnline = false;
        renderSyncStatus(lastSyncStatus.message, lastSyncStatus.mode);
      });
      window.addEventListener("online", async () => {
        networkOnline = true;
        renderSyncStatus(lastSyncStatus.message, lastSyncStatus.mode);
        if (remoteReady) {
          setSyncStatus("网络已恢复，正在同步当前页面状态", "remote");
          const saved = await persistStatus();
          if (saved) await loadRemoteSnapshot();
        }
      });
    }

    async function initRemoteStore() {
      if (!remoteStore?.isConfigured) {
        setSyncStatus("本地模式：配置 Supabase 后启用多端同步", "local");
        return;
      }
      if (!networkOnline) {
        setSyncStatus("Supabase 已配置；当前离线，恢复网络后再同步", "error");
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
      lastSyncStatus = { message, mode };
      renderSyncStatus(message, mode);
    }

    function renderSyncStatus(message, mode) {
      const status = document.getElementById("syncStatus");
      const dot = document.getElementById("syncDot");
      const box = document.getElementById("syncBox");
      if (!status || !dot) return;
      const offline = !networkOnline;
      status.textContent = offline ? "离线：暂不能同步，当前改动仅保留在本机" : message;
      dot.className = `sync-dot ${offline || mode === "error" ? "error" : mode === "remote" ? "remote" : ""}`;
      if (box) box.classList.toggle("offline", offline);
    }

    function canWriteRemote(actionLabel) {
      if (!remoteReady || applyingRemote) return false;
      if (!networkOnline) {
        setSyncStatus(`${actionLabel}未同步：当前离线，改动仅保留在本机`, "error");
        return false;
      }
      return true;
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
      if (!remoteReady || !networkOnline) return;
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
        taskPool.selected = remoteTasks.map(row => {
          const source = findTaskByKeyOrTitle(row.task_key) || findTaskByKeyOrTitle(row.title) || {};
          return {
            remoteId: row.id,
            key: source.key || row.task_key || row.title,
            title: row.title,
            type: row.task_type,
            attr: row.attribute,
            xp: row.xp,
            time: row.time_label,
            note: row.note,
            completed: row.completed
          };
        });
        state.completedTasks = taskPool.selected
          .filter(task => task.completed)
          .map(task => taskKey(task));
        storage.setJSON("lifeRpgCompletedTasks", state.completedTasks);
        taskPool.recommended = taskPool.recommended.filter(task =>
          !taskPool.selected.some(selected => sameTask(selected, task))
        );
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
      if (!canWriteRemote("状态")) return null;
      try {
        return await remoteStore.saveStatus(state.today, getScores(), state.mode);
      } catch (error) {
        setSyncStatus(`状态未保存：${error.message}`, "error");
        return null;
      }
    }

    async function persistReview(review) {
      if (!canWriteRemote("复盘")) return;
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
      const isDefeated = boss.completedRounds >= boss.rounds;
      
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
        ${isDefeated 
          ? `<div style="margin-top: 12px; padding: 10px; background: rgba(65,211,139,0.1); border-radius: 8px; text-align: center; color: var(--green);">🎉 Boss 已击败！获得 ${boss.reward.xp} XP</div>`
          : `<button class="primary-btn" style="margin-top: 12px; width: 100%;" onclick="advanceBossRound()">⚔️ 推进一回合（20分钟）</button>`
        }
      `;
    }

    function advanceBossRound() {
      const boss = bosses[0];
      if (boss.completedRounds >= boss.rounds) return;
      
      boss.completedRounds++;
      boss.currentHp = Math.max(0, boss.currentHp - Math.ceil(boss.maxHp / boss.rounds));
      
      // 保存状态
      storage.setJSON("lifeRpgBossState", { completedRounds: boss.completedRounds, currentHp: boss.currentHp });
      
      renderBoss();
      
      if (boss.completedRounds >= boss.rounds) {
        // Boss 击败，发放奖励
        addXp(boss.reward.attr, boss.reward.xp);
        showToast(`🎉 击败 ${boss.name}！${boss.reward.attr} +${boss.reward.xp} XP`);
        
        // 切换到下一个 Boss
        setTimeout(() => {
          rotateBoss();
        }, 1500);
      } else {
        showToast(`⚔️ 回合 ${boss.completedRounds}/${boss.rounds} 完成！Boss HP ${boss.currentHp}/${boss.maxHp}`);
      }
    }

    function rotateBoss() {
      // 循环切换到下一个 Boss
      const current = bosses.shift();
      bosses.push(current);
      
      // 重置新 Boss 状态
      bosses[0].completedRounds = 0;
      bosses[0].currentHp = bosses[0].maxHp;
      
      storage.setJSON("lifeRpgBossIndex", 0);
      storage.remove("lifeRpgBossState");
      
      renderBoss();
      showToast(`👹 新 Boss 出现：${bosses[0].name}！`);
    }

    function resetBoss() {
      // 重置当前 Boss
      const boss = bosses[0];
      boss.completedRounds = 0;
      boss.currentHp = boss.maxHp;
      storage.remove("lifeRpgBossState");
      renderBoss();
      showToast("🔄 Boss 已重置，准备新的挑战！");
    }

    function loadBossState() {
      const saved = storage.getJSON("lifeRpgBossState");
      if (saved) {
        bosses[0].completedRounds = saved.completedRounds || 0;
        bosses[0].currentHp = saved.currentHp || bosses[0].maxHp;
      }
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
      loadBossState();
      loadProfile();
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
      // 日常推荐从 daily 池选，与 creative 抽卡池分离
      const dailyTasks = tasks.filter(task => task.pool === "daily");
      const matched = dailyTasks.filter(task => task.states.includes(state.mode));
      const fallback = dailyTasks.filter(task => ["普通", "低能量"].some(s => task.states.includes(s)));
      taskPool.available = matched.length >= 3 ? [...matched] : [...matched, ...fallback];
      taskPool.selected = [];
      taskPool.completed = [];
      taskPool.recommended = [];
      refreshRecommended();
    }

    function refreshRecommended() {
      const pool = taskPool.available.filter(task =>
        !taskPool.selected.some(s => sameTask(s, task)) &&
        !taskPool.recommended.some(r => sameTask(r, task))
      );
      if (pool.length === 0) {
        const resetPool = tasks.filter(task =>
          !taskPool.selected.some(s => sameTask(s, task))
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
      if (taskPool.selected.some(s => sameTask(s, task))) {
        showToast("这个任务已经在清单里了");
        return;
      }
      const selectedTask = {...task, completed: false};
      taskPool.selected.push(selectedTask);
      taskPool.recommended = taskPool.recommended.filter(r => !sameTask(r, task));
      renderRecommendedTasks();
      renderTaskList();
      updateRefreshHint();
      if (canWriteRemote("任务")) {
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

    async function removeFromList(key) {
      const task = taskPool.selected.find(s => taskKey(s) === key || s.title === key);
      taskPool.selected = taskPool.selected.filter(s => taskKey(s) !== key && s.title !== key);
      renderTaskList();
      updateRefreshHint();
      if (task?.remoteId && canWriteRemote("任务删除")) {
        try {
          await remoteStore.removeTask(task.remoteId);
        } catch (error) {
          setSyncStatus(`删除未同步：${error.message}`, "error");
        }
      }
    }

    async function toggleTaskComplete(key) {
      const task = taskPool.selected.find(s => taskKey(s) === key || s.title === key);
      if (!task) return;
      const keyForState = taskKey(task);
      task.completed = !task.completed;
      if (task.completed) {
        if (!state.completedTasks.includes(keyForState)) state.completedTasks.push(keyForState);
        addXp(task.attr, task.xp);
        showToast(`✓ 完成「${task.title}」 +${task.xp} XP`);
      } else {
        state.completedTasks = state.completedTasks.filter(key => key !== keyForState);
        addXp(task.attr, -task.xp);
        showToast(`↩ 取消完成「${task.title}」 -${task.xp} XP`);
      }
      storage.setJSON("lifeRpgCompletedTasks", state.completedTasks);
      storage.set("lifeRpgCompletedDate", state.today);
      renderTaskList();
      buildStats();
      if (canWriteRemote("完成状态")) {
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
        <article class="task-card recommended ${task.type === 'Boss' ? 'boss-task' : ''}">
          <div class="task-header"><div class="task-kind">${task.type}</div></div>
          <h3>${task.title}</h3>
          <p>${task.note}</p>
          <div class="task-meta">
            <span class="pill">${task.attr}</span>
            <span class="pill">${task.time}</span>
            <span class="pill">+${task.xp} XP</span>
          </div>
          <div class="task-actions">
            <button class="primary-btn add-btn" data-task="${taskKey(task)}" type="button">➕ 加入清单</button>
            <button class="ghost-btn skip-btn" data-task="${taskKey(task)}" type="button">⏭️ 跳过</button>
          </div>
        </article>
      `).join("");
      container.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const task = findTaskByKeyOrTitle(btn.dataset.task);
          if (task) addToList(task);
        });
      });
      container.querySelectorAll('.skip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          taskPool.recommended = taskPool.recommended.filter(r => taskKey(r) !== btn.dataset.task && r.title !== btn.dataset.task);
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
            <input type="checkbox" ${task.completed ? 'checked' : ''} data-task="${taskKey(task)}">
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
          <button class="remove-btn" data-task="${taskKey(task)}" type="button">✕</button>
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
        !taskPool.selected.some(s => sameTask(s, task))
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
      // 从 creative 池抽卡，与日常推荐差异化
      const creativePool = tasks.filter(task => task.pool === "creative");
      const pool = creativePool.length ? creativePool : tasks.filter(task => task.states.includes(state.mode));
      const drawPool = pool.length ? pool : tasks;
      const task = drawPool[Math.floor(Math.random() * drawPool.length)];
      
      document.getElementById("drawResult").innerHTML = `
        <div style="margin-bottom: 12px;">
          <strong>${task.title}</strong>
          <div style="font-size: 13px; color: var(--muted); margin-top: 4px;">${task.note}</div>
          <div style="font-size: 12px; color: var(--muted); margin-top: 8px;">
            ${task.time} · ${task.attr} · +${task.xp} XP
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="primary-btn" style="flex: 1;" onclick="addDrawnTask('${task.key || task.title}')">➕ 加入清单</button>
          <button class="ghost-btn" style="flex: 1;" onclick="drawBoredom()">🔄 换一个</button>
        </div>
      `;
    }

    function addDrawnTask(taskKey) {
      const task = findTaskByKeyOrTitle(taskKey);
      if (!task) {
        showToast("任务未找到");
        return;
      }
      addToList(task);
    }

    // 月度分析功能
    function initMonthSelector() {
      const selector = document.getElementById("monthSelector");
      if (!selector) return;
      
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      // 生成过去12个月选项
      for (let i = 0; i < 12; i++) {
        const date = new Date(currentYear, currentMonth - 1 - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const value = `${year}-${String(month).padStart(2, '0')}`;
        const label = `${year}年${month}月`;
        
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        if (i === 0) option.selected = true;
        selector.appendChild(option);
      }
      
      selector.addEventListener("change", () => {
        renderMonthlyReport(selector.value);
      });
      
      // 默认加载当前月
      renderMonthlyReport(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
    }

    async function renderMonthlyReport(monthStr) {
      const [year, month] = monthStr.split("-").map(Number);
      const startDate = `${monthStr}-01`;
      const endDate = new Date(year, month, 0).toISOString().slice(0, 10);
      
      // 从 Supabase 查询月度数据
      let monthRecords = [];
      if (canWriteRemote("月度数据")) {
        try {
          const entries = await remoteStore.loadMonthEntries(startDate, endDate);
          monthRecords = entries || [];
        } catch (error) {
          console.warn("月度数据查询失败:", error);
        }
      }
      
      // 回退到本地历史数据
      if (!monthRecords.length) {
        monthRecords = state.history.filter(r => r.date >= startDate && r.date <= endDate);
      }
      
      if (!monthRecords.length) {
        document.getElementById("monthDays").textContent = "0";
        document.getElementById("monthDaysPct").textContent = "无数据";
        document.getElementById("monthEnergy").textContent = "--";
        document.getElementById("monthTasks").textContent = "0";
        document.getElementById("monthMode").textContent = "--";
        document.getElementById("monthAnalysis").innerHTML = "本月暂无记录数据。开始每日记录，月度分析会自动生成。";
        return;
      }
      
      // 聚合计算
      const daysInMonth = new Date(year, month, 0).getDate();
      const recordDays = monthRecords.length;
      const avgEnergy = (monthRecords.reduce((s, r) => s + (r.energy || 3), 0) / recordDays).toFixed(1);
      const totalTasks = monthRecords.reduce((s, r) => s + (r.completedTasks || 0), 0);
      
      // 模式分布
      const modeCounts = {};
      monthRecords.forEach(r => {
        modeCounts[r.mode] = (modeCounts[r.mode] || 0) + 1;
      });
      const dominantMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "普通";
      
      // 属性成长
      const attrGrowth = {};
      monthRecords.forEach(r => {
        Object.entries(r.xp || {}).forEach(([attr, xp]) => {
          attrGrowth[attr] = (attrGrowth[attr] || 0) + xp;
        });
      });
      
      // 更新 UI
      document.getElementById("monthDays").textContent = recordDays;
      document.getElementById("monthDaysPct").textContent = `占当月 ${Math.round(recordDays / daysInMonth * 100)}%`;
      document.getElementById("monthEnergy").textContent = avgEnergy;
      document.getElementById("monthTasks").textContent = totalTasks;
      document.getElementById("monthMode").textContent = dominantMode;
      
      // 环比变化（对比上个月）
      const prevMonthStr = getPrevMonthStr(monthStr);
      const prevRecords = state.history.filter(r => r.date >= prevMonthStr + "-01" && r.date <= getMonthEnd(prevMonthStr));
      if (prevRecords.length) {
        const prevAvgEnergy = (prevRecords.reduce((s, r) => s + (r.energy || 3), 0) / prevRecords.length).toFixed(1);
        const prevTasks = prevRecords.reduce((s, r) => s + (r.completedTasks || 0), 0);
        const energyChange = (avgEnergy - prevAvgEnergy).toFixed(1);
        const tasksChange = totalTasks - prevTasks;
        document.getElementById("monthEnergyChange").textContent = energyChange > 0 ? `↑${energyChange} 环比` : energyChange < 0 ? `↓${Math.abs(energyChange)} 环比` : "持平";
        document.getElementById("monthTasksChange").textContent = tasksChange > 0 ? `↑${tasksChange} 环比` : tasksChange < 0 ? `↓${Math.abs(tasksChange)} 环比` : "持平";
      } else {
        document.getElementById("monthEnergyChange").textContent = "无上月数据";
        document.getElementById("monthTasksChange").textContent = "无上月数据";
      }
      
      // 绘制月度趋势图
      drawMonthTrendChart(monthRecords);
      
      // 生成分析文字
      const analysis = generateMonthAnalysis(monthRecords, avgEnergy, totalTasks, dominantMode, attrGrowth, recordDays, daysInMonth);
      document.getElementById("monthAnalysis").innerHTML = analysis;
      
      // 深度分析按钮
      const deepBtn = document.getElementById("deepAnalysisBtn");
      deepBtn.onclick = () => {
        const summary = buildMonthSummaryForLyra(monthStr, monthRecords, avgEnergy, totalTasks, dominantMode, attrGrowth);
        copyToClipboard(summary);
        showToast("📋 月度数据摘要已复制，粘贴给飞书 Lyra 获取深度分析");
      };
    }

    function getPrevMonthStr(monthStr) {
      const [year, month] = monthStr.split("-").map(Number);
      const prev = new Date(year, month - 2, 1);
      return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    }

    function getMonthEnd(monthStr) {
      const [year, month] = monthStr.split("-").map(Number);
      return new Date(year, month, 0).toISOString().slice(0, 10);
    }

    function drawMonthTrendChart(monthRecords) {
      const canvas = document.getElementById("monthTrendChart");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;
      const pad = { left: 40, right: 20, top: 30, bottom: 20 };
      const plotW = w - pad.left - pad.right;
      const plotH = h - pad.top - pad.bottom;
      
      ctx.clearRect(0, 0, w, h);
      
      if (monthRecords.length < 2) {
        ctx.fillStyle = "#9aa8b6";
        ctx.font = "13px Microsoft YaHei";
        ctx.textAlign = "center";
        ctx.fillText("数据不足，需至少2天", w / 2, h / 2);
        return;
      }
      
      const isSparse = monthRecords.length < 5;
      
      // 稀疏数据提示
      if (isSparse) {
        ctx.fillStyle = "rgba(243, 185, 78, 0.8)";
        ctx.font = "11px Microsoft YaHei";
        ctx.textAlign = "right";
        ctx.fillText(`⚠️ 仅 ${monthRecords.length} 天数据，趋势仅供参考`, w - pad.right, 20);
      }
      
      const metrics = [
        { key: "energy", label: "精力", color: "#41d38b" },
        { key: "mood", label: "情绪", color: "#48c9e8" },
        { key: "body", label: "身体", color: "#f3b94e" },
        { key: "focus", label: "专注", color: "#a98bff" },
        { key: "social", label: "社交", color: "#f06d62" }
      ];
      
      // 网格线
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = pad.top + plotH * (1 - i / 5);
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(w - pad.right, y);
        ctx.stroke();
        
        ctx.fillStyle = "#9aa8b6";
        ctx.font = "10px Microsoft YaHei";
        ctx.textAlign = "right";
        ctx.fillText(i + "", pad.left - 5, y + 3);
      }
      
      // 绘制折线
      metrics.forEach(metric => {
        const validRecords = monthRecords.filter(r => r[metric.key] !== undefined && r[metric.key] !== null);
        if (validRecords.length < 2) return;
        
        const points = validRecords.map((r, i) => {
          const x = pad.left + (i / (validRecords.length - 1)) * plotW;
          const y = pad.top + plotH * (1 - (r[metric.key] || 3) / 5);
          return { x, y, date: r.date, value: r[metric.key] };
        });
        
        // 线条
        ctx.strokeStyle = metric.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        
        // 数据点
        ctx.fillStyle = metric.color;
        points.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, isSparse ? 5 : 3, 0, Math.PI * 2);
          ctx.fill();
        });
        
        // 稀疏数据：在点上方显示数值
        if (isSparse) {
          points.forEach(p => {
            ctx.fillStyle = metric.color;
            ctx.font = "bold 11px Microsoft YaHei";
            ctx.textAlign = "center";
            ctx.fillText(p.value, p.x, p.y - 10);
          });
        }
      });
      
      // 日期标签
      if (isSparse) {
        // 稀疏数据：在点下方显示日期，避免重叠
        ctx.fillStyle = "#9aa8b6";
        ctx.font = "12px Microsoft YaHei";
        ctx.textAlign = "center";
        monthRecords.forEach((r, i) => {
          const x = pad.left + (i / (monthRecords.length - 1)) * plotW;
          const date = r.date.slice(5);
          // 交替上下显示，避免重叠
          const yOffset = (i % 2 === 0) ? h - 8 : h - 22;
          ctx.fillText(date, x, yOffset);
        });
      } else {
        // 正常数据：每5天显示一个
        ctx.fillStyle = "#9aa8b6";
        ctx.font = "10px Microsoft YaHei";
        ctx.textAlign = "center";
        monthRecords.forEach((r, i) => {
          if (i % 5 === 0 || i === monthRecords.length - 1) {
            const x = pad.left + (i / (monthRecords.length - 1)) * plotW;
            const date = r.date.slice(5);
            ctx.fillText(date, x, h - 10);
          }
        });
      }
      
      // 图例 - 稀疏数据时移到左下角，避免遮挡
      const legendX = isSparse ? pad.left : w - pad.right - 200;
      const legendY = isSparse ? h - 35 : 20;
      metrics.forEach((metric, i) => {
        const x = legendX + i * 45;
        ctx.fillStyle = metric.color;
        ctx.fillRect(x, legendY, 10, 3);
        ctx.fillStyle = "#9aa8b6";
        ctx.font = "10px Microsoft YaHei";
        ctx.fillText(metric.label, x + 14, legendY + 5);
      });
    }

    function generateMonthAnalysis(records, avgEnergy, totalTasks, dominantMode, attrGrowth, recordDays, daysInMonth) {
      const lines = [];
      
      // 记录完整性
      const completeness = recordDays / daysInMonth;
      if (completeness < 0.5) {
        lines.push(`本月记录了 <strong>${recordDays}</strong> 天（占 ${Math.round(completeness * 100)}%），建议养成每日记录习惯，数据越完整分析越准确。`);
      } else if (completeness >= 0.8) {
        lines.push(`本月记录了 <strong>${recordDays}</strong> 天，数据完整度优秀，分析结果可靠。`);
      } else {
        lines.push(`本月记录了 <strong>${recordDays}</strong> 天，数据完整度良好。`);
      }
      
      // 整体状态
      lines.push(`整体状态偏向 <strong>${dominantMode}</strong>，平均精力 <strong>${avgEnergy}</strong>/5。`);
      
      // 精力评价
      if (avgEnergy < 2.5) {
        lines.push(`精力水平偏低，建议优先关注睡眠质量和作息规律，减少高强度任务安排。`);
      } else if (avgEnergy > 4) {
        lines.push(`精力充沛，适合推进重要项目和 Boss 战，但也要注意不要透支。`);
      } else {
        lines.push(`精力水平适中，保持当前节奏即可。`);
      }
      
      // 任务完成情况
      if (totalTasks > 60) {
        lines.push(`完成任务 <strong>${totalTasks}</strong> 个，执行力优秀，保持这个节奏！`);
      } else if (totalTasks > 30) {
        lines.push(`完成任务 <strong>${totalTasks}</strong> 个，进度良好，可以适当提高挑战难度。`);
      } else if (totalTasks > 0) {
        lines.push(`完成任务 <strong>${totalTasks}</strong> 个，建议降低任务门槛，从简单任务开始建立正反馈。`);
      } else {
        lines.push(`本月未完成任务，建议从最简单的恢复类任务开始。`);
      }
      
      // 属性成长
      const sortedAttrs = Object.entries(attrGrowth).sort((a, b) => b[1] - a[1]);
      if (sortedAttrs.length > 0) {
        const topAttr = sortedAttrs[0];
        lines.push(`本月成长最多的属性是 <strong>${topAttr[0]}</strong>（+${topAttr[1]} XP）。`);
        
        const weakAttrs = sortedAttrs.filter(([_, xp]) => xp === 0).map(([attr]) => attr);
        if (weakAttrs.length > 0) {
          lines.push(`${weakAttrs.join("、")} 本月零成长，建议下月安排相关任务。`);
        }
      }
      
      return lines.join("<br><br>");
    }

    function buildMonthSummaryForLyra(monthStr, records, avgEnergy, totalTasks, dominantMode, attrGrowth) {
      const lines = [
        `📊 LifeRPG 月度分析请求`,
        ``,
        `月份：${monthStr}`,
        `记录天数：${records.length}`,
        `平均精力：${avgEnergy}/5`,
        `主导模式：${dominantMode}`,
        `完成任务：${totalTasks}`,
        `属性成长：`,
        ...Object.entries(attrGrowth).map(([attr, xp]) => `  - ${attr}: +${xp} XP`),
        ``,
        `请基于以上数据生成深度月度分析，包括：`,
        `1. 整体状态评价`,
        `2. 趋势变化分析`,
        `3. 下月行动建议`,
        `4. 需要关注的异常或风险`,
      ];
      return lines.join("\n");
    }

    function copyToClipboard(text) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
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
      if (remoteReady && networkOnline) {
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
      
      // 7日趋势图
      drawTrendChart(weekRecords);
      
      // 异常检测
      const anomalies = detectAnomalies(records);
      document.getElementById("anomalyList").innerHTML = anomalies.length 
        ? anomalies.map(a => `<div class="anomaly-item">• ${a}</div>`).join("")
        : `<div class="anomaly-item">✅ 本周无异常，状态稳定。</div>`;
      
      // 行动建议
      const suggestions = generateSuggestions(weekRecords, anomalies, attrGrowth);
      document.getElementById("suggestionList").innerHTML = suggestions.map(s => `<div class="suggestion-item">• ${s}</div>`).join("");
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

    // 7日趋势折线图
    function drawTrendChart(weekRecords) {
      const canvas = document.getElementById("trendChart");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;
      const pad = { left: 40, right: 20, top: 20, bottom: 30 };
      const plotW = w - pad.left - pad.right;
      const plotH = h - pad.top - pad.bottom;
      
      ctx.clearRect(0, 0, w, h);
      
      if (weekRecords.length < 2) {
        ctx.fillStyle = "#9aa8b6";
        ctx.font = "13px Microsoft YaHei";
        ctx.textAlign = "center";
        ctx.fillText("数据不足，需至少2天", w / 2, h / 2);
        return;
      }
      
      const metrics = [
        { key: "energy", label: "精力", color: "#41d38b" },
        { key: "mood", label: "情绪", color: "#48c9e8" },
        { key: "body", label: "身体", color: "#f3b94e" },
        { key: "focus", label: "专注", color: "#a98bff" },
        { key: "social", label: "社交", color: "#f06d62" }
      ];
      
      // 绘制网格线
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = pad.top + plotH * (1 - i / 5);
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(w - pad.right, y);
        ctx.stroke();
        
        ctx.fillStyle = "#9aa8b6";
        ctx.font = "10px Microsoft YaHei";
        ctx.textAlign = "right";
        ctx.fillText(i + "", pad.left - 5, y + 3);
      }
      
      // 绘制每条折线
      metrics.forEach(metric => {
        const points = weekRecords.map((r, i) => {
          const x = pad.left + (i / (weekRecords.length - 1)) * plotW;
          const y = pad.top + plotH * (1 - (r[metric.key] || 3) / 5);
          return { x, y };
        });
        
        // 线条
        ctx.strokeStyle = metric.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        
        // 数据点
        ctx.fillStyle = metric.color;
        points.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fill();
        });
      });
      
      // 日期标签
      ctx.fillStyle = "#9aa8b6";
      ctx.font = "10px Microsoft YaHei";
      ctx.textAlign = "center";
      weekRecords.forEach((r, i) => {
        const x = pad.left + (i / (weekRecords.length - 1)) * plotW;
        const date = r.date.slice(5); // MM-DD
        ctx.fillText(date, x, h - 10);
      });
      
      // 图例
      let legendX = w - pad.right - 200;
      metrics.forEach((metric, i) => {
        ctx.fillStyle = metric.color;
        ctx.fillRect(legendX + i * 40, 5, 10, 3);
        ctx.fillStyle = "#9aa8b6";
        ctx.font = "10px Microsoft YaHei";
        ctx.fillText(metric.label, legendX + i * 40 + 14, 10);
      });
    }

    // 异常检测
    function detectAnomalies(records) {
      const anomalies = [];
      const weekRecords = records.slice(-7);
      
      if (weekRecords.length < 3) return anomalies;
      
      // 检测连续低能量
      const lowEnergyDays = weekRecords.filter(r => r.energy <= 2);
      if (lowEnergyDays.length >= 3) {
        anomalies.push(`连续 ${lowEnergyDays.length} 天精力偏低，建议优先恢复睡眠和运动`);
      }
      
      // 检测连续烦躁
      const anxiousDays = weekRecords.filter(r => r.mode === "烦躁");
      if (anxiousDays.length >= 2) {
        anomalies.push(`连续 ${anxiousDays.length} 天状态烦躁，建议减少刺激源、增加运动`);
      }
      
      // 检测社交欲持续低迷
      const lowSocialDays = weekRecords.filter(r => r.social <= 2);
      if (lowSocialDays.length >= 5) {
        anomalies.push(`社交欲持续低迷 ${lowSocialDays.length} 天，建议主动联系一位朋友`);
      }
      
      // 检测完成率下降
      if (weekRecords.length >= 5) {
        const firstHalf = weekRecords.slice(0, Math.floor(weekRecords.length / 2));
        const secondHalf = weekRecords.slice(Math.floor(weekRecords.length / 2));
        const firstTasks = firstHalf.reduce((s, r) => s + (r.completedTasks || 0), 0);
        const secondTasks = secondHalf.reduce((s, r) => s + (r.completedTasks || 0), 0);
        if (secondTasks < firstTasks * 0.5) {
          anomalies.push("任务完成率明显下降，建议降低任务难度或数量");
        }
      }
      
      // 检测属性停滞（7天某属性0 XP）
      const attrGrowth = {};
      weekRecords.forEach(r => {
        Object.entries(r.xp || {}).forEach(([attr, xp]) => {
          attrGrowth[attr] = (attrGrowth[attr] || 0) + xp;
        });
      });
      const stagnantAttrs = Object.entries(attrGrowth).filter(([_, xp]) => xp === 0).map(([attr]) => attr);
      if (stagnantAttrs.length > 0) {
        anomalies.push(`${stagnantAttrs.join("、")} 属性本周零成长，建议安排相关任务`);
      }
      
      return anomalies;
    }

    // 生成行动建议
    function generateSuggestions(weekRecords, anomalies, attrGrowth) {
      const suggestions = [];
      const avgEnergy = weekRecords.reduce((s, r) => s + (r.energy || 3), 0) / weekRecords.length;
      const avgMood = weekRecords.reduce((s, r) => s + (r.mood || 3), 0) / weekRecords.length;
      
      // 基于整体状态的建议
      if (avgEnergy < 2.5) {
        suggestions.push("精力偏低：本周优先安排恢复类任务，减少高强度工作");
      } else if (avgEnergy > 4) {
        suggestions.push("精力充沛：适合开 Boss 战，推进论文/项目大进度");
      }
      
      if (avgMood < 2.5) {
        suggestions.push("情绪偏低：增加户外活动和社交，减少独处时间");
      }
      
      // 基于属性成长的建议
      const sortedAttrs = Object.entries(attrGrowth).sort((a, b) => a[1] - b[1]);
      const weakestAttr = sortedAttrs[0];
      if (weakestAttr && weakestAttr[1] < 10) {
        suggestions.push(`${weakestAttr[0]} 成长较慢：下周多安排 1-2 个相关任务`);
      }
      
      // 基于异常的建议
      if (anomalies.some(a => a.includes("社交欲"))) {
        suggestions.push("社交破冰：给一个久未联系的朋友发消息");
      }
      if (anomalies.some(a => a.includes("烦躁"))) {
        suggestions.push("降噪行动：每天冥想 10 分钟，减少信息输入");
      }
      
      // 通用建议
      if (suggestions.length < 3) {
        suggestions.push("保持记录：连续记录有助于发现状态规律");
      }
      
      return suggestions.slice(0, 4); // 最多4条
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
