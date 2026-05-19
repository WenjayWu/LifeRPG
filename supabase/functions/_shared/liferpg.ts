import { createClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const tasksDb = [
  { title: "晒太阳或散步 12 分钟", attr: "体能", time: "10 分钟", xp: 5, states: ["低能量", "烦躁", "空虚"], type: "恢复", note: "先让身体离开原地，别急着变强。" },
  { title: "收拾桌面 10 分钟", attr: "秩序", time: "10 分钟", xp: 5, states: ["低能量", "无聊", "空虚"], type: "恢复", note: "只收 10 分钟，结束后允许停止。" },
  { title: "读一页论文或一本书", attr: "智识", time: "10 分钟", xp: 5, states: ["普通", "低能量"], type: "成长", note: "把门槛压低，目标是恢复进入状态的能力。" },
  { title: "跑步或快走 25 分钟", attr: "体能", time: "30 分钟", xp: 20, states: ["烦躁", "普通", "高能量"], type: "成长", note: "适合脑子乱、身体钝的时候。" },
  { title: "做一个代码/AI 小功能", attr: "工程", time: "45 分钟", xp: 20, states: ["普通", "想创造", "高能量"], type: "成长", note: "只做一个可见的小改动，别开大坑。" },
  { title: "画一张速写或 UI 草图", attr: "创造", time: "30 分钟", xp: 20, states: ["想创造", "无聊", "普通"], type: "娱乐", note: "重点是动手，不追求成品。" },
  { title: "给一个朋友发近况", attr: "社交", time: "10 分钟", xp: 5, states: ["想社交", "空虚", "普通"], type: "社交", note: "一句真诚近况就够，不需要组织大型聊天。" },
  { title: "约一顿饭或一次散步", attr: "社交", time: "60 分钟", xp: 20, states: ["想社交", "高能量"], type: "社交", note: "优先约低压力的人。" },
  { title: "完成一个两小时 Boss 回合", attr: "智识", time: "2 小时", xp: 60, states: ["高能量"], type: "Boss", note: "选择论文、实验复盘、代码项目中的一个推进。" },
  { title: "城市探索半天副本", attr: "创造", time: "半天", xp: 60, states: ["无聊", "高能量", "想创造"], type: "娱乐", note: "带着一个主题出门，比如拍 12 张有结构感的照片。" },
  { title: "洗澡 + 换衣 + 清理 5 件物品", attr: "秩序", time: "30 分钟", xp: 20, states: ["低能量", "空虚"], type: "恢复", note: "低谷日的重启组合。" },
  { title: "3D 打印/电子小项目推进一格", attr: "工程", time: "60 分钟", xp: 20, states: ["想创造", "高能量", "无聊"], type: "成长", note: "只推进建模、焊接、测试中的一个步骤。" },
];

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function supabaseForRequest(req: Request) {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );
}

export async function currentUser(req: Request) {
  const supabase = supabaseForRequest(req);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Unauthorized");
  return { supabase, user: data.user };
}

export function pickTasks(mode: string) {
  const matched = tasksDb.filter((task) => task.states.includes(mode));
  const fallback = tasksDb.filter((task) => task.states.some((state) => ["普通", "低能量"].includes(state)));
  const pool = matched.length >= 3 ? matched : [...matched, ...fallback];
  const wanted = ["恢复", "成长", mode === "想社交" ? "社交" : "娱乐"];
  const chosen: typeof tasksDb = [];
  for (const type of wanted) {
    const found = pool.find((task) => task.type === type && !chosen.includes(task));
    if (found) chosen.push(found);
  }
  for (const task of pool) {
    if (chosen.length >= 3) break;
    if (!chosen.includes(task)) chosen.push(task);
  }
  return chosen.slice(0, 3);
}

export function parseStatusInput(text: string) {
  const scoreMap: Record<string, string> = { "精力": "energy", "情绪": "mood", "身体": "body", "专注": "focus", "社交欲": "social" };
  const scores: Record<string, number> = {};
  for (const [label, key] of Object.entries(scoreMap)) {
    const match = text.match(new RegExp(`${label}(?:\\s*1-5)?[：:\\s]*(\\d)`));
    scores[key] = match ? Number(match[1]) : 3;
  }
  const modeNames = ["低能量", "普通", "高能量", "烦躁", "空虚", "无聊", "想社交", "想创造"];
  const explicit = text.match(/(?:状态|模式|现在更像)[：:\s]*([^\s，,。]+)/)?.[1];
  const mode = modeNames.find((name) => explicit?.includes(name) || text.includes(name)) ?? "普通";
  const schedule = text.match(/(?:硬性安排|今天安排|计划)[：:]\s*(.+?)(?:\n|$)/)?.[1]?.trim() ?? "";
  return { scores, mode, schedule };
}

export function taskToRow(userId: string, date: string, task: typeof tasksDb[number]) {
  return {
    user_id: userId,
    task_date: date,
    task_key: task.title,
    title: task.title,
    task_type: task.type,
    attribute: task.attr,
    xp: task.xp,
    time_label: task.time,
    note: task.note,
  };
}
