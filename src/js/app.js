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

    const state = {
      mode: localStorage.getItem("lifeRpgMode") || "普通",
      history: fallbackHistory
    };

    function init() {
      document.getElementById("todayText").textContent = new Date().toLocaleDateString("zh-CN", {
        year: "numeric", month: "2-digit", day: "2-digit", weekday: "short"
      });
      buildModeButtons();
      buildStats();
      bindInputs();
      restoreInputs();
      updateAll();
      document.getElementById("recommendBtn").addEventListener("click", () => {
        state.mode = inferMode();
        localStorage.setItem("lifeRpgMode", state.mode);
        updateAll();
      });
      document.getElementById("resetBtn").addEventListener("click", resetInputs);
      document.getElementById("drawBtn").addEventListener("click", drawBoredom);
      document.getElementById("copyCodexBtn").addEventListener("click", copyForCodex);
      document.getElementById("historyFile").addEventListener("change", importHistory);
      document.getElementById("reviewText").value = localStorage.getItem("lifeRpgReview") || "";
      document.getElementById("reviewText").addEventListener("input", event => {
        localStorage.setItem("lifeRpgReview", event.target.value);
      });
      loadHistory();
    }

    function buildModeButtons() {
      const wrap = document.getElementById("modeButtons");
      wrap.innerHTML = modes.map(mode => `<button class="mode-btn" type="button" data-mode="${mode}">${mode}</button>`).join("");
      wrap.querySelectorAll("button").forEach(button => {
        button.addEventListener("click", () => {
          state.mode = button.dataset.mode;
          localStorage.setItem("lifeRpgMode", state.mode);
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
      document.getElementById("achievementText").textContent = profile.achievements.join("；") + "。";
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
      updateRadar();
    }

    function restoreInputs() {
      metrics.forEach(metric => {
        const saved = localStorage.getItem(`lifeRpg_${metric.key}`);
        if (saved) document.getElementById(metric.key).value = saved;
        syncMetric(metric.key);
      });
    }

    function saveInputs() {
      metrics.forEach(metric => localStorage.setItem(`lifeRpg_${metric.key}`, document.getElementById(metric.key).value));
    }

    function resetInputs() {
      metrics.forEach(metric => {
        document.getElementById(metric.key).value = 3;
        document.getElementById(`${metric.key}Value`).textContent = 3;
        localStorage.removeItem(`lifeRpg_${metric.key}`);
      });
      state.mode = "普通";
      localStorage.setItem("lifeRpgMode", state.mode);
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

    function updateAll() {
      document.querySelectorAll(".mode-btn").forEach(button => {
        button.classList.toggle("active", button.dataset.mode === state.mode);
      });
      document.getElementById("modeBadge").textContent = state.mode;
      document.getElementById("directiveText").textContent = directives[state.mode];
      updateRadar();
      renderTasks();
      renderHistory();
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

    function renderTasks() {
      const matched = tasks.filter(task => task.states.includes(state.mode));
      const fallback = tasks.filter(task => ["普通", "低能量"].some(s => task.states.includes(s)));
      const pool = matched.length >= 3 ? matched : [...matched, ...fallback];
      const selected = pickTaskSet(pool);
      const totalXp = selected.reduce((sum, task) => sum + task.xp, 0);
      document.getElementById("xpHint").textContent = `今日推荐 XP：${totalXp}`;
      document.getElementById("taskCards").innerHTML = selected.map(task => `
        <article class="task-card">
          <div class="task-kind">${task.type}</div>
          <h3>${task.title}</h3>
          <p>${task.note}</p>
          <div class="task-meta">
            <span class="pill">${task.attr}</span>
            <span class="pill">${task.time}</span>
            <span class="pill">+${task.xp} XP</span>
          </div>
        </article>
      `).join("");
    }

    function pickTaskSet(pool) {
      const wanted = ["恢复", "成长", state.mode === "想社交" ? "社交" : "娱乐"];
      const chosen = [];
      wanted.forEach(type => {
        const found = pool.find(task => task.type === type && !chosen.includes(task));
        if (found) chosen.push(found);
      });
      pool.forEach(task => {
        if (chosen.length < 3 && !chosen.includes(task)) chosen.push(task);
      });
      return chosen.slice(0, 3);
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
      const selected = getCurrentRecommendedTasks();
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