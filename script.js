const STORAGE_KEY = "adhd-med-tracker-logs";

const effectSections = [
  {
    key: "mental",
    title: "精神状态",
    options: [
      "更清醒",
      "更平静",
      "更专注",
      "思路更清楚",
      "更有动力",
      "焦虑增加",
      "烦躁",
      "情绪变平",
      "易怒",
      "心情低落",
    ],
  },
  {
    key: "execution",
    title: "执行状态",
    options: [
      "更容易开始任务",
      "更容易持续做事",
      "更容易收尾",
      "更少拖延",
      "更能按计划行动",
      "还是很难开始",
      "开始了但难持续",
      "容易卡住",
      "容易分心",
      "过度专注",
    ],
  },
  {
    key: "cognition",
    title: "注意力与认知",
    options: [
      "注意力提升",
      "分心减少",
      "记忆更清楚",
      "脑雾减少",
      "信息处理更顺",
      "仍然脑雾明显",
      "容易走神",
      "思维过快",
      "思维混乱",
    ],
  },
  {
    key: "body",
    title: "身体感受",
    options: [
      "食欲下降",
      "没胃口",
      "口干",
      "头痛",
      "恶心",
      "胃不舒服",
      "心跳加快",
      "心慌",
      "头晕",
      "困倦",
    ],
  },
  {
    key: "duration",
    title: "药效过程",
    options: [
      "起效很快",
      "起效平稳",
      "感觉不到明显起效",
      "药效持续稳定",
      "药效过早消退",
      "晚上还有残余药效",
      "药效退去时情绪变差",
      "药效退去时特别饿",
      "药效退去时很疲惫",
    ],
  },
  {
    key: "social",
    title: "生活功能",
    options: [
      "更容易沟通",
      "更能处理工作/学习",
      "更能处理家务",
      "更能管理时间",
      "更能遵守安排",
      "社交压力更大",
      "更想回避人",
    ],
  },
];

const scoreFields = [
  { key: "clarityScore", title: "清醒度" },
  { key: "anxietyScore", title: "焦虑程度" },
  { key: "moodScore", title: "情绪稳定度" },
  { key: "taskStartScore", title: "开始任务能力" },
  { key: "focusScore", title: "持续专注能力" },
  { key: "taskFinishScore", title: "完成任务能力" },
];

const sleepReasonOptions = [
  "脑子停不下来",
  "心慌/紧张",
  "身体还有药效感",
  "手机停不下来",
  "环境影响",
  "其他",
];

const selectedEffects = Object.fromEntries(effectSections.map((section) => [section.key, new Set()]));
const selectedSleepReasons = new Set();

const form = document.querySelector("#log-form");
const effectsRoot = document.querySelector("#effects-sections");
const scoresRoot = document.querySelector("#score-fields");
const sleepReasonsRoot = document.querySelector("#sleep-reasons");
const historyList = document.querySelector("#history-list");
const insightsRoot = document.querySelector("#insights");
const resetButton = document.querySelector("#reset-btn");
const sleepDifficultyInputs = document.querySelectorAll('input[name="sleepDifficulty"]');
const editingBanner = document.querySelector("#editing-banner");
const editingText = document.querySelector("#editing-text");
const cancelEditButton = document.querySelector("#cancel-edit-btn");

let editingLogId = null;

function getLogs() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function setLogs(logs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

function setEditingState(log) {
  editingLogId = log?.id || null;
  editingBanner.classList.toggle("show", Boolean(log));

  if (log) {
    editingText.textContent = `正在编辑 ${log.date} 的记录`;
  }
}

function renderEffectSections() {
  effectsRoot.innerHTML = "";

  effectSections.forEach((section) => {
    const card = document.createElement("details");
    card.className = "effect-accordion";

    const summary = document.createElement("summary");
    summary.innerHTML = `
      <span>${section.title}</span>
      <span class="effect-summary-meta">
        <span class="effect-summary-count" id="${section.key}-count">未选</span>
        <span class="effect-summary-arrow">⌄</span>
      </span>
    `;
    card.appendChild(summary);

    const content = document.createElement("div");
    content.className = "effect-content";

    const group = document.createElement("div");
    group.className = "chip-group";

    section.options.forEach((option) => {
      const chip = makeChip(option, () => {
        toggleSetValue(selectedEffects[section.key], option);
        chip.classList.toggle("active", selectedEffects[section.key].has(option));
        updateEffectCount(section.key);
      });

      group.appendChild(chip);
    });

    content.appendChild(group);
    card.appendChild(content);
    effectsRoot.appendChild(card);
    updateEffectCount(section.key);
  });
}

function renderScoreFields() {
  scoresRoot.innerHTML = "";

  scoreFields.forEach((field) => {
    const card = document.createElement("section");
    card.className = "score-card";

    const title = document.createElement("h4");
    title.innerHTML = `${field.title}<output id="${field.key}Output">3</output>`;
    card.appendChild(title);

    const input = document.createElement("input");
    input.type = "range";
    input.min = "1";
    input.max = "5";
    input.step = "1";
    input.value = "3";
    input.name = field.key;
    input.id = field.key;
    input.addEventListener("input", (event) => {
      document.querySelector(`#${field.key}Output`).textContent = event.target.value;
    });

    card.appendChild(input);
    scoresRoot.appendChild(card);
  });
}

function renderSleepReasons() {
  sleepReasonsRoot.innerHTML = "";

  sleepReasonOptions.forEach((reason) => {
    const chip = makeChip(reason, () => {
      toggleSetValue(selectedSleepReasons, reason);
      chip.classList.toggle("active", selectedSleepReasons.has(reason));
    });
    sleepReasonsRoot.appendChild(chip);
  });

  updateSleepReasonsVisibility();
}

function makeChip(text, onClick) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "chip";
  chip.textContent = text;
  chip.addEventListener("click", onClick);
  return chip;
}

function updateEffectCount(sectionKey) {
  const countNode = document.querySelector(`#${sectionKey}-count`);
  if (!countNode) return;

  const count = selectedEffects[sectionKey].size;
  countNode.textContent = count ? `已选 ${count}` : "未选";
}

function updateSleepReasonsVisibility() {
  const selected = document.querySelector('input[name="sleepDifficulty"]:checked')?.value;
  sleepReasonsRoot.hidden = selected !== "是";
}

function toggleSetValue(set, value) {
  if (set.has(value)) {
    set.delete(value);
  } else {
    set.add(value);
  }
}

function createLogFromForm() {
  const formData = new FormData(form);

  return {
    id: crypto.randomUUID(),
    date: formData.get("date"),
    takenAt: formData.get("takenAt"),
    medicationName: formData.get("medicationName"),
    dose: formData.get("dose"),
    otherMedications: formData.get("otherMedications"),
    effects: Object.fromEntries(
      effectSections.map((section) => [section.key, Array.from(selectedEffects[section.key])]),
    ),
    scores: Object.fromEntries(scoreFields.map((field) => [field.key, Number(formData.get(field.key))])),
    sleep: {
      bedTime: formData.get("bedTime"),
      sleepTime: formData.get("sleepTime"),
      wakeCount: Number(formData.get("wakeCount") || 0),
      morningState: formData.get("morningState"),
      sleepDifficulty: formData.get("sleepDifficulty"),
      sleepReasons: Array.from(selectedSleepReasons),
    },
    note: formData.get("note"),
    createdAt: new Date().toISOString(),
  };
}

function renderHistory() {
  const logs = getLogs().sort((a, b) => new Date(b.date) - new Date(a.date));
  historyList.innerHTML = "";

  if (!logs.length) {
    historyList.innerHTML = '<div class="empty-card">还没有记录，先保存今天第一条吧。</div>';
    return;
  }

  logs.slice(0, 8).forEach((log) => {
    const card = document.createElement("article");
    card.className = "history-card";

    const strong = document.createElement("strong");
    strong.textContent = `${log.date} · ${log.medicationName} ${log.dose || ""}`.trim();
    card.appendChild(strong);

    const summary = document.createElement("p");
    const execution = log.effects.execution.slice(0, 2).join("、") || "未记录执行状态";
    const mental = log.effects.mental.slice(0, 2).join("、") || "未记录精神状态";
    summary.textContent = `吃药时间 ${log.takenAt || "--:--"}，执行：${execution}，精神：${mental}`;
    card.appendChild(summary);

    const meta = document.createElement("div");
    meta.className = "history-meta";

    if (log.sleep.sleepDifficulty === "是") {
      meta.appendChild(makeMiniTag("入睡困难"));
    }

    if (log.otherMedications) {
      meta.appendChild(makeMiniTag(`其他药物：${log.otherMedications}`));
    }

    if (!meta.children.length) {
      meta.appendChild(makeMiniTag("无额外标记"));
    }

    card.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "history-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "history-btn";
    editButton.textContent = "编辑";
    editButton.addEventListener("click", () => startEditing(log.id));

    actions.appendChild(editButton);
    card.appendChild(actions);
    historyList.appendChild(card);
  });
}

function makeMiniTag(text) {
  const tag = document.createElement("span");
  tag.className = "mini-tag";
  tag.textContent = text;
  return tag;
}

function renderInsights() {
  const logs = getLogs();
  insightsRoot.innerHTML = "";

  if (!logs.length) {
    insightsRoot.innerHTML = '<div class="empty-card">保存几条记录后，这里会开始总结你的个人规律。</div>';
    return;
  }

  const averageFocus = average(logs.map((log) => log.scores.focusScore));
  const averageStart = average(logs.map((log) => log.scores.taskStartScore));
  const sleepDifficultyCount = logs.filter((log) => log.sleep.sleepDifficulty === "是").length;
  const lateDoseCount = logs.filter((log) => (log.takenAt || "") >= "12:00").length;
  const appetiteCount = logs.filter((log) => log.effects.body.includes("食欲下降") || log.effects.body.includes("没胃口")).length;
  const otherMedicationCount = logs.filter((log) => log.otherMedications.trim()).length;

  const insightItems = [
    {
      title: "执行状态",
      text: `最近 ${logs.length} 条记录里，你的平均开始任务能力是 ${averageStart.toFixed(1)} / 5，平均持续专注能力是 ${averageFocus.toFixed(1)} / 5。`,
    },
    {
      title: "睡眠影响",
      text: `有 ${sleepDifficultyCount} 条记录提到入睡困难，${lateDoseCount} 条记录是在中午 12:00 之后服药，值得继续观察这两者是否相关。`,
    },
    {
      title: "副作用趋势",
      text: `食欲下降或没胃口在 ${appetiteCount} 条记录中出现；同时记录其他药物的天数有 ${otherMedicationCount} 天。`,
    },
  ];

  insightItems.forEach((item) => {
    const card = document.createElement("article");
    card.className = "insight-card";

    const strong = document.createElement("strong");
    strong.textContent = item.title;
    card.appendChild(strong);

    const text = document.createElement("p");
    text.textContent = item.text;
    card.appendChild(text);

    insightsRoot.appendChild(card);
  });
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function resetSelections() {
  Object.values(selectedEffects).forEach((set) => set.clear());
  selectedSleepReasons.clear();
  document.querySelectorAll(".chip").forEach((chip) => chip.classList.remove("active"));
}

function resetForm() {
  form.reset();
  document.querySelector("#date").value = todayDate();
  document.querySelector("#takenAt").value = currentTime();
  document.querySelector("#wakeCount").value = 0;

  scoreFields.forEach((field) => {
    const input = document.querySelector(`#${field.key}`);
    const output = document.querySelector(`#${field.key}Output`);
    input.value = 3;
    output.textContent = "3";
  });

  resetSelections();
  setEditingState(null);
  updateSleepReasonsVisibility();
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  window.setTimeout(() => toast.remove(), 2200);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function currentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function startEditing(logId) {
  const logs = getLogs();
  const log = logs.find((item) => item.id === logId);
  if (!log) return;

  resetForm();

  document.querySelector("#date").value = log.date || todayDate();
  document.querySelector("#takenAt").value = log.takenAt || "";
  document.querySelector("#medicationName").value = log.medicationName || "哌甲酯";
  document.querySelector("#dose").value = log.dose || "";
  document.querySelector("#otherMedications").value = log.otherMedications || "";
  document.querySelector("#bedTime").value = log.sleep?.bedTime || "";
  document.querySelector("#sleepTime").value = log.sleep?.sleepTime || "";
  document.querySelector("#wakeCount").value = log.sleep?.wakeCount ?? 0;
  document.querySelector("#morningState").value = log.sleep?.morningState || "一般";
  document.querySelector("#note").value = log.note || "";

  const sleepDifficultyValue = log.sleep?.sleepDifficulty || "否";
  const sleepRadio = document.querySelector(`input[name="sleepDifficulty"][value="${sleepDifficultyValue}"]`);
  if (sleepRadio) sleepRadio.checked = true;

  effectSections.forEach((section) => {
    selectedEffects[section.key].clear();
    (log.effects?.[section.key] || []).forEach((value) => selectedEffects[section.key].add(value));
  });

  selectedSleepReasons.clear();
  (log.sleep?.sleepReasons || []).forEach((value) => selectedSleepReasons.add(value));

  scoreFields.forEach((field) => {
    const input = document.querySelector(`#${field.key}`);
    const output = document.querySelector(`#${field.key}Output`);
    const value = log.scores?.[field.key] || 3;
    input.value = value;
    output.textContent = String(value);
  });

  document.querySelectorAll(".effect-accordion .chip").forEach((chip) => {
    const text = chip.textContent;
    const section = effectSections.find((item) => item.options.includes(text));
    if (!section) return;
    chip.classList.toggle("active", selectedEffects[section.key].has(text));
  });

  document.querySelectorAll("#sleep-reasons .chip").forEach((chip) => {
    chip.classList.toggle("active", selectedSleepReasons.has(chip.textContent));
  });

  effectSections.forEach((section) => updateEffectCount(section.key));
  updateSleepReasonsVisibility();
  setEditingState(log);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const logs = getLogs();
  const nextLog = createLogFromForm();

  if (editingLogId) {
    const updatedLogs = logs.map((log) => (log.id === editingLogId ? { ...nextLog, id: editingLogId } : log));
    setLogs(updatedLogs);
    showToast("历史记录已更新");
  } else {
    logs.push(nextLog);
    setLogs(logs);
    showToast("已保存到本地浏览器");
  }

  renderHistory();
  renderInsights();
  resetForm();
});

cancelEditButton.addEventListener("click", () => {
  resetForm();
});

resetButton.addEventListener("click", () => {
  resetForm();
});

sleepDifficultyInputs.forEach((input) => {
  input.addEventListener("change", updateSleepReasonsVisibility);
});

document.querySelector("#date").value = todayDate();
document.querySelector("#takenAt").value = currentTime();

renderEffectSections();
renderScoreFields();
renderSleepReasons();
renderHistory();
renderInsights();
