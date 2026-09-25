/**
 * Інтерактивний функціонал для сайту «Інструкція картографа-початківця v2.0»
 */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initSearch();
  initChecklist();
  initDeltaZCalculator();
  initScaleCalculator();
  initCopyButtons();
  initScrollSpy();
  initMobileSidebar();
  initLinksTracker();
  initQuiz();
});

// ==========================================
// 1. ТЕМА ОФОРМЛЕННЯ (DARK / LIGHT)
// ==========================================
function initTheme() {
  const toggleBtn = document.getElementById("themeToggle");
  const metaTheme = document.querySelector('meta[name="color-scheme"]');
  
  const savedTheme = localStorage.getItem("carto_theme") || 
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  applyTheme(savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem("carto_theme", next);
      showToast(`Увімкнено ${next === "dark" ? "темну" : "світлу"} тему`);
    });
  }

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (!localStorage.getItem("carto_theme")) {
      applyTheme(e.matches ? "dark" : "light");
    }
  });

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (metaTheme) metaTheme.content = theme;
    if (toggleBtn) {
      toggleBtn.innerHTML = theme === "dark" ? "☀️" : "🌙";
      toggleBtn.title = theme === "dark" ? "Перемкнути на світлу тему" : "Перемкнути на темну тему";
    }
  }
}

// ==========================================
// 2. ЖИВИЙ ПОШУК ТА ФІЛЬТРАЦІЯ
// ==========================================
function initSearch() {
  const searchInput = document.getElementById("searchInput");
  const filterPills = document.querySelectorAll(".pill-btn");
  const sections = document.querySelectorAll(".guide-section");

  if (!searchInput) return;

  // Гаряча клавіша "/" для фокусу на пошук
  window.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
    if (e.key === "Escape" && document.activeElement === searchInput) {
      searchInput.value = "";
      filterContent("");
      searchInput.blur();
    }
  });

  searchInput.addEventListener("input", (e) => {
    filterContent(e.target.value.trim().toLowerCase());
  });

  filterPills.forEach(pill => {
    pill.addEventListener("click", () => {
      filterPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      const category = pill.dataset.filter;

      if (category === "all") {
        sections.forEach(sec => sec.style.display = "block");
      } else {
        sections.forEach(sec => {
          if (sec.dataset.category && sec.dataset.category.includes(category)) {
            sec.style.display = "block";
          } else {
            sec.style.display = "none";
          }
        });
      }
    });
  });

  function filterContent(query) {
    if (!query) {
      sections.forEach(sec => sec.style.display = "block");
      removeHighlights();
      return;
    }

    let matchCount = 0;
    sections.forEach(sec => {
      const text = sec.innerText.toLowerCase();
      if (text.includes(query)) {
        sec.style.display = "block";
        matchCount++;
      } else {
        sec.style.display = "none";
      }
    });

    if (matchCount === 0) {
      showToast("Нічого не знайдено за запитом: " + query);
    }
  }

  function removeHighlights() {
    document.querySelectorAll(".search-highlight").forEach(el => {
      el.outerHTML = el.innerHTML;
    });
  }
}

// ==========================================
// 3. ІНТЕРАКТИВНИЙ ЧЕКЛІСТ ТА ПРОГРЕС
// ==========================================
function initChecklist() {
  const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
  const progressBar = document.getElementById("progressBarFill");
  const progressText = document.getElementById("checklistStatsText");
  const resetBtn = document.getElementById("resetChecklistBtn");
  const exportBtn = document.getElementById("exportChecklistBtn");

  const STORAGE_KEY = "carto_checklist_v2";
  let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

  // Відновлення стану
  checkboxes.forEach((cb, idx) => {
    const id = cb.id || `check_${idx}`;
    cb.id = id;
    if (state[id]) {
      cb.checked = true;
      cb.closest(".checklist-item").classList.add("completed");
    }

    cb.addEventListener("change", () => {
      state[id] = cb.checked;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      cb.closest(".checklist-item").classList.toggle("completed", cb.checked);
      updateProgress();
    });
  });

  updateProgress();

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Скинути всі позначки в чеклісті?")) {
        state = {};
        localStorage.removeItem(STORAGE_KEY);
        checkboxes.forEach(cb => {
          cb.checked = false;
          cb.closest(".checklist-item").classList.remove("completed");
        });
        updateProgress();
        showToast("Чекліст скинуто");
      }
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      let report = `# ЗВІТ САМОПЕРЕВІРКИ КАРТОГРАФА (Civil 3D)\n`;
      report += `Дата: ${new Date().toLocaleDateString('uk-UA')}\n`;
      let total = checkboxes.length;
      let completed = 0;

      checkboxes.forEach(cb => {
        const text = cb.closest(".checklist-item").querySelector(".item-text").innerText.trim();
        const status = cb.checked ? "[x]" : "[ ]";
        if (cb.checked) completed++;
        report += `${status} ${text}\n`;
      });

      const percent = Math.round((completed / total) * 100);
      report = `## Прогрес: ${completed}/${total} (${percent}%)\n\n` + report;

      navigator.clipboard.writeText(report).then(() => {
        showToast("📋 Звіт самоперевірки скопійовано в буфер обміну!");
      });
    });
  }

  function updateProgress() {
    const total = checkboxes.length;
    if (total === 0) return;
    const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
    const percent = Math.round((checked / total) * 100);

    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressText) progressText.innerText = `${checked} з ${total} (${percent}%)`;
  }
}

// ==========================================
// 4. КАЛЬКУЛЯТОР ΔZ ТА ПЕРЕВІРКА ДОПУСКУ
// ==========================================
function initDeltaZCalculator() {
  const tableBody = document.getElementById("deltaZTableBody");
  const addRowBtn = document.getElementById("addDeltaRowBtn");
  const loadSampleBtn = document.getElementById("loadDeltaSampleBtn");
  const copyTableBtn = document.getElementById("copyDeltaTableBtn");
  const statusBanner = document.getElementById("deltaStatusBanner");
  const avgOutput = document.getElementById("deltaAvgOutput");
  const spreadOutput = document.getElementById("deltaSpreadOutput");

  if (!tableBody) return;

  function calculate() {
    const rows = tableBody.querySelectorAll("tr");
    let deltas = [];
    let sumZ = 0;

    rows.forEach(row => {
      const zProj = parseFloat(row.querySelector(".input-z-proj").value);
      const zCloud = parseFloat(row.querySelector(".input-z-cloud").value);
      const deltaCell = row.querySelector(".output-delta");

      if (!isNaN(zProj) && !isNaN(zCloud)) {
        const diff = +(zCloud - zProj).toFixed(3);
        deltaCell.innerText = (diff >= 0 ? "+" : "") + diff.toFixed(3);
        deltaCell.style.fontWeight = "600";
        deltas.push(diff);
        sumZ += diff;
      } else {
        deltaCell.innerText = "—";
      }
    });

    if (deltas.length > 0) {
      const avg = sumZ / deltas.length;
      const min = Math.min(...deltas);
      const max = Math.max(...deltas);
      const spread = +(max - min).toFixed(3);

      avgOutput.innerText = (avg >= 0 ? "+" : "") + avg.toFixed(3) + " м";
      spreadOutput.innerText = spread.toFixed(3) + " м (" + (spread * 100).toFixed(1) + " см)";

      if (spread > 0.05) {
        // Розкид більше 5 см - деформація
        statusBanner.className = "callout callout-danger";
        statusBanner.innerHTML = `
          <div class="callout-title">⚠️ УВАГА: Розкид понад 5 см (${(spread * 100).toFixed(1)} см) — ДЕФОРМАЦІЯ ХМАРИ</div>
          <p>Розкид відхилень перевищує допустимий ліміт 0.05 м. Зсувом це не лікується! <strong>Зупини роботу та напиши замовнику (Шаблон Б).</strong></p>
        `;
      } else {
        // Допустимий системний зсув
        statusBanner.className = "callout callout-success";
        statusBanner.innerHTML = `
          <div class="callout-title">✅ НОРМА: Систематичний зсув (розкид ${(spread * 100).toFixed(1)} см &le; 5 см)</div>
          <p>Виправлення: виділи хмару в Civil 3D &rarr; <code>MOVE</code> &rarr; змісти на <strong>Z = ${(-avg).toFixed(3)} м</strong>.</p>
        `;
      }
    } else {
      avgOutput.innerText = "—";
      spreadOutput.innerText = "—";
      statusBanner.className = "callout callout-info";
      statusBanner.innerHTML = `Введіть контрольні точки для автоматичного аналізу відхилення.`;
    }
  }

  function addRow(pt = "", zp = "", zc = "", note = "") {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="text" class="form-control form-control-sm" value="${pt}" placeholder="№ точ."></td>
      <td><input type="number" step="0.001" class="form-control form-control-sm input-z-proj" value="${zp}" placeholder="62.480"></td>
      <td><input type="number" step="0.001" class="form-control form-control-sm input-z-cloud" value="${zc}" placeholder="62.315"></td>
      <td class="output-delta" style="font-family: var(--font-mono);">—</td>
      <td><input type="text" class="form-control form-control-sm" value="${note}" placeholder="Примітка"></td>
      <td style="text-align: center;"><button class="btn btn-outline btn-sm delete-row-btn" title="Видалити">✕</button></td>
    `;
    tr.querySelectorAll("input").forEach(inp => inp.addEventListener("input", calculate));
    tr.querySelector(".delete-row-btn").addEventListener("click", () => {
      tr.remove();
      calculate();
    });
    tableBody.appendChild(tr);
    calculate();
  }

  if (addRowBtn) addRowBtn.addEventListener("click", () => addRow());

  if (loadSampleBtn) {
    loadSampleBtn.addEventListener("click", () => {
      tableBody.innerHTML = "";
      addRow("101", "62.480", "62.315", "Асфальт (зсув -0.165)");
      addRow("102", "63.120", "62.951", "Бордюр (зсув -0.169)");
      addRow("103", "61.850", "61.685", "Ґрунт (зсув -0.165)");
      addRow("104", "64.200", "64.032", "Вхід (зсув -0.168)");
      calculate();
      showToast("Тестові дані завантажено");
    });
  }

  if (copyTableBtn) {
    copyTableBtn.addEventListener("click", () => {
      const rows = tableBody.querySelectorAll("tr");
      let md = "| № точки | Z проєктна | Z у хмарі | ΔZ | Примітка |\n|---|---|---|---|---|\n";
      rows.forEach(r => {
        const inputs = r.querySelectorAll("input");
        const delta = r.querySelector(".output-delta").innerText;
        md += `| ${inputs[0].value} | ${inputs[1].value} | ${inputs[2].value} | ${delta} | ${inputs[3].value} |\n`;
      });
      md += `\nСереднє ΔZ: ${avgOutput.innerText}, Розкид: ${spreadOutput.innerText}\n`;
      navigator.clipboard.writeText(md).then(() => {
        showToast("Таблицю скопійовано для звіту проєкту");
      });
    });
  }

  // Перша порожня строка
  addRow();
}

// ==========================================
// 5. КАЛЬКУЛЯТОР МАСШТАБІВ ТА ГОРИЗОНТАЛЕЙ
// ==========================================
function initScaleCalculator() {
  const scaleSelect = document.getElementById("scaleCalcSelect");
  const minorInterval = document.getElementById("calcMinorInterval");
  const majorInterval = document.getElementById("calcMajorInterval");
  const textHeight = document.getElementById("calcTextHeight");
  const vpScale = document.getElementById("calcVpScale");
  const paperRec = document.getElementById("calcPaperRec");

  if (!scaleSelect) return;

  function update() {
    const scale = parseInt(scaleSelect.value);
    const minor = scale / 1000;
    const major = minor * 5;

    minorInterval.innerText = `${minor.toFixed(2)} м`;
    majorInterval.innerText = `${major.toFixed(2)} м`;
    vpScale.innerText = `1/${scale}XP`;

    if (scale === 250) {
      textHeight.innerText = "0.40 м";
      paperRec.innerText = "ISO A1 (деталізований план)";
    } else if (scale === 500) {
      textHeight.innerText = "0.80 м";
      paperRec.innerText = "ISO A1 / A2";
    } else if (scale === 1250) {
      textHeight.innerText = "2.00 м";
      paperRec.innerText = "ISO A1 / A0";
    } else if (scale === 2500) {
      textHeight.innerText = "4.00 м";
      paperRec.innerText = "ISO A0";
    }
  }

  scaleSelect.addEventListener("change", update);
  update();
}

// ==========================================
// 6. КОПІЮВАННЯ ТЕКСТІВ ТА ШАБЛОНІВ
// ==========================================
function initCopyButtons() {
  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.copyTarget;
      let text = "";
      if (targetId) {
        const target = document.getElementById(targetId);
        text = target ? target.innerText : "";
      } else {
        const box = btn.closest(".template-box") || btn.closest(".code-block");
        const content = box.querySelector(".template-content") || box.querySelector("code");
        text = content ? content.innerText : "";
      }

      if (text) {
        navigator.clipboard.writeText(text).then(() => {
          showToast("Скопійовано в буфер обміну!");
        });
      }
    });
  });
}

// ==========================================
// 7. ТРЕКЕР ПОСИЛАНЬ «ДОДАТИ ПОСИЛАННЯ»
// ==========================================
function initLinksTracker() {
  const missingLinks = document.querySelectorAll(".missing-link-tag");
  const linksCountBadge = document.getElementById("linksCountBadge");

  if (linksCountBadge) {
    linksCountBadge.innerText = missingLinks.length;
  }

  missingLinks.forEach((tag, idx) => {
    tag.title = "Місце для посилання. Клікніть, щоб ввести реальне посилання";
    tag.addEventListener("click", () => {
      const currentUrl = localStorage.getItem(`link_${idx}`) || "";
      const newUrl = prompt("Введіть посилання на матеріал (Google Drive / JOT App):", currentUrl);
      if (newUrl !== null) {
        if (newUrl.trim() !== "") {
          localStorage.setItem(`link_${idx}`, newUrl.trim());
          tag.outerHTML = `<a href="${newUrl.trim()}" target="_blank" class="tag tag-success" style="text-decoration:none;">🔗 Відкрити матеріал</a>`;
          showToast("Посилання збережено!");
        }
      }
    });

    // Перевірка вже збереженого
    const saved = localStorage.getItem(`link_${idx}`);
    if (saved) {
      tag.outerHTML = `<a href="${saved}" target="_blank" class="tag tag-success" style="text-decoration:none;">🔗 Відкрити матеріал</a>`;
    }
  });
}

// ==========================================
// 8. SCROLLSPY ТА НАВІГАЦІЯ
// ==========================================
function initScrollSpy() {
  const sections = document.querySelectorAll(".guide-section");
  const navLinks = document.querySelectorAll(".nav-link");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
        });
      }
    });
  }, {
    rootMargin: "-20% 0px -70% 0px"
  });

  sections.forEach(sec => observer.observe(sec));
}

// ==========================================
// 9. МОБІЛЬНЕ МЕНЮ
// ==========================================
function initMobileSidebar() {
  const toggleBtn = document.getElementById("sidebarToggle");
  const sidebar = document.querySelector(".app-sidebar");

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });

    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 992) {
          sidebar.classList.remove("open");
        }
      });
    });
  }
}

// ==========================================
// 10. УНІВЕРСАЛЬНИЙ TOAST
// ==========================================
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.innerHTML = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ==========================================
// 11. ІНТЕРАКТИВНІ ТЕСТИ ДЛЯ САМОПЕРЕВІРКИ (24 ПИТАННЯ)
// ==========================================
function initQuiz() {
  const container = document.getElementById("quizQuestionsContainer");
  const percentText = document.getElementById("quizPercentText");
  const scoreCircle = document.getElementById("quizScoreCircle");
  const answeredCountEl = document.getElementById("quizAnsweredCount");
  const correctCountEl = document.getElementById("quizCorrectCount");
  const wrongCountEl = document.getElementById("quizWrongCount");
  const statusBadge = document.getElementById("quizStatusBadge");
  const resetBtn = document.getElementById("resetQuizBtn");
  const filterBtns = document.querySelectorAll(".quiz-filter-btn");

  if (!container) return;

  const STORAGE_KEY = "carto_quiz_answers_v2";

  // Банк із 24 детальних запитань за матеріалами інструкції v2.0
  const questions = [
    {
      id: "q1",
      category: "Організація",
      title: "Що ви повинні зробити згідно з «Правилом 15 хвилин», якщо ви застрягли над завданням і немає прогресу?",
      options: [
        { text: "Сидіти до кінця дня і самостійно розбиратися, щоб показати старанність", correct: false, reason: "Неправильно! Довге самостійне колупання перестає бути навчанням і стає втратою робочого часу." },
        { text: "Запитати у старшого картографа чи менеджера рівно через 15 хвилин відсутності прогресу", correct: true, reason: "Правильно! (Розділ 1). 15 хвилин — це чітка межа. Питати — абсолютно нормально й очікувано." },
        { text: "Пропустити цю ділянку і повернутися до неї наприкінці проєкту", correct: false, reason: "Неправильно! Помилка чи затримка на ранньому етапі паралізує побудову поверхні." },
        { text: "Написати замовнику в приватні повідомлення з проханням допомогти", correct: false, reason: "Неправильно! Замовник не консультує з базових операцій CAD." }
      ]
    },
    {
      id: "q2",
      category: "Civil 3D",
      title: "Яке значення системної змінної OSNAPZ має бути встановлено під час оцифрування рельєфу та 3D-поліліній з хмари точок?",
      options: [
        { text: "OSNAPZ = 1, оскільки при цьому легше замикати контури", correct: false, reason: "Неправильно! За OSNAPZ = 1 координата Z ігнорується, і всі лінії впадуть у Z=0 — ви отримаєте плоский план без висот!" },
        { text: "OSNAPZ = 2, щоб увімкнути режим автоматичної інтерполяції висот", correct: false, reason: "Неправильно! Такого значення змінної не існує." },
        { text: "OSNAPZ = 0, щоб Civil 3D брав реальні координати X, Y, Z безпосередньо з точок хмари", correct: true, reason: "Правильно! (Розділ 2.10). Тільки за OSNAPZ = 0 лінії повторюють фактичний рельєф." },
        { text: "Значення не має, якщо ввімкнено режим 3D Object Snap (F4)", correct: false, reason: "Неправильно! OSNAPZ є пріоритетним системним перемикачем." }
      ]
    },
    {
      id: "q3",
      category: "Хмара точок",
      title: "Ви порівняли контрольну зйомку з хмарою: на одній точці ΔZ = +0.02 м, а на іншій +0.38 м (розкид 36 см). Ваші дії?",
      options: [
        { text: "Порахувати середнє ΔZ та опустити всю хмару командою MOVE", correct: false, reason: "Неправильно! Розкид понад 5 см свідчить про внутрішню деформацію хмари. Зсувом MOVE це не лікується!" },
        { text: "Вручну підтягнути вершини ліній під позначки контрольних точок замовника", correct: false, reason: "Неправильно! Геометрична підгонка на око дасть фальшивий план." },
        { text: "Збільшити децимацію хмари в ReCap, щоб згладити невідповідність", correct: false, reason: "Неправильно! Децимація зменшує щільність, а не усуває деформацію." },
        { text: "Зупинити роботу та негайно написати замовнику листом (Шаблон Б) про деформацію хмари", correct: true, reason: "Правильно! (Розділ 3.4). Розкид > 5 см — це брак сканування. Руками такі деформації не виправляють." }
      ]
    },
    {
      id: "q4",
      category: "Хмара точок",
      title: "Який робочий поріг максимального розкиду ΔZ між точками допускається для виправлення хмари звичайним зміщенням (MOVE)?",
      options: [
        { text: "До 15 см", correct: false, reason: "Неправильно! 15 см — це груба неприпустима похибка." },
        { text: "До 5 см (0.05 м)", correct: true, reason: "Правильно! (Розділ 3.4). До 5 см — вважається систематичним зсувом і компенсується MOVE." },
        { text: "До 10 см для ґрунту і 5 см для асфальту", correct: false, reason: "Неправильно! Загальний робочий орієнтир стандарту — 5 см." },
        { text: "До 1 метра", correct: false, reason: "Неправильно! Це катастрофічна невідповідність." }
      ]
    },
    {
      id: "q5",
      category: "Файли",
      title: "У чому полягає принципова різниця між файлами SURFACE.dwg та IDAN.dwg?",
      options: [
        { text: "У файлі IDAN лежить тільки плоский план з Z=0, а в SURFACE — 3D лінії", correct: false, reason: "Неправильно! IDAN містить тільки чисті 3D-лінії та пікети." },
        { text: "У SURFACE міститься сама TIN-поверхня з горизонталями, а в IDAN її немає — лише вихідні 3D-полілінії та пікети", correct: true, reason: "Правильно! (Розділи 1.8, 9.1). IDAN — це сировина для вивантаження REG/DIS, поверхні в ньому бути не повинно." },
        { text: "IDAN містить готові підписи та штамп, а SURFACE — лише сирі точки", correct: false, reason: "Неправильно! Підписи та штамп лежать у MAP.dwg." },
        { text: "Це однакові файли, просто збережені під різними назвами", correct: false, reason: "Неправильно! Замовник використовує їх у різних цілях." }
      ]
    },
    {
      id: "q6",
      category: "Файли",
      title: "Яку висоту Z (Elevation) повинні мати об'єкти у фінальному оформленому файлі MAP.dwg?",
      options: [
        { text: "Усе має бути сплющено до Elevation = 0 (абсолютно плоске 2D креслення)", correct: true, reason: "Правильно! (Розділ 9.1). Файл MAP — це плоска карта для візуального перегляду замовником." },
        { text: "Усі лінії та блоки повинні мати реальну висоту Z з хмари точок", correct: false, reason: "Неправильно! Реальне 3D залишається у файлах SURFACE та IDAN." },
        { text: "Будівлі мають Z=0, а лінії бордюрів та асфальту повинні зберігати 3D координати", correct: false, reason: "Неправильно! У MAP абсолютно все сплющується до нуля." },
        { text: "Тільки блоки висотних точок мають Z, решта об'єктів — Z=0", correct: false, reason: "Неправильно! У MAP навіть блоки пікетів мають Z=0, а висота вказана атрибутом." }
      ]
    },
    {
      id: "q7",
      category: "Векторизація",
      title: "Як правильно оцифровувати бордюрний камінь для коректної побудови рельєфу?",
      options: [
        { text: "Однією 3D-полілінією по центру бордюру з кроком 5 метрів", correct: false, reason: "Неправильно! Втрачається вертикальна стінка та укіс бордюру." },
        { text: "2D полілінією з накладанням штриховки бордюрного каменю", correct: false, reason: "Неправильно! Бордюр бере участь у побудові TIN-поверхні." },
        { text: "Двома паралельними 3D-полілініями: окремо верхня кромка і окремо нижня (стик з асфальтом) з різними відмітками Z", correct: true, reason: "Правильно! (Розділи 4.5, 4.9). Дві лінії фіксують перепад висоти та укіс бордюру." },
        { text: "Тільки точками блоків висоти через кожні 2 метри", correct: false, reason: "Неправильно! Бордюр є лінійною структурною лінією Breakline." }
      ]
    },
    {
      id: "q8",
      category: "Векторизація",
      title: "Чи повинні паркани та огорожі додаватися до побудови TIN-поверхні?",
      options: [
        { text: "Ні, паркани — це штучні об'єкти, вони йдуть тільки в карту MAP", correct: false, reason: "Неправильно! Це типова помилка початківців." },
        { text: "Тільки якщо висота паркану перевищує 3 метри", correct: false, reason: "Неправильно! Знімаються всі паркани по лінії дотику з землею." },
        { text: "Так, обов'язково 3D-полілініями як Breaklines, бо паркан майже завжди є бровкою перелому рельєфу", correct: true, reason: "Правильно! (Розділ 4.3). Якщо пропустити паркан, горизонталі «розтечуться» крізь перепад висот." },
        { text: "Паркани замінюються точками пікетів у кутах огорожі", correct: false, reason: "Неправильно! Потрібна безперервна структурна лінія." }
      ]
    },
    {
      id: "q9",
      category: "Векторизація",
      title: "Звідки картограф бере геометрію підземних інженерних комунікацій (труби, кабелі)?",
      options: [
        { text: "Знаходить їх безпосередньо у хмарі точок лазерного сканування", correct: false, reason: "Неправильно! Лазерний сканер не проникає крізь ґрунт і не бачить підземних мереж!" },
        { text: "Виключно з архівних або викопіювальних схем замовника, прив'язуючи їх до видимих на поверхні люків", correct: true, reason: "Правильно! (Розділи 1.3, 4.9). З хмари знімаються тільки люки, кришки та колодязі на поверхні." },
        { text: "З'єднує люки найкоротшою прямою лінією на власний розсуд", correct: false, reason: "Неправильно! Вигадувати траси комунікацій категорично заборонено." },
        { text: "Підземні мережі наносяться 3D-полілініями та обов'язково додаються в TIN-поверхню", correct: false, reason: "Неправильно! Підземні мережі не беруть участі в рельєфі." }
      ]
    },
    {
      id: "q10",
      category: "Шрифти",
      title: "Яка підміна літер івриту найчастіше виникає через збій шрифтів і є непомітною на перший погляд?",
      options: [
        { text: "Буква א (алеф) підміняється на ט (тет)", correct: true, reason: "Правильно! (Розділ 2.7). Підпис здається візуально схожим, але це спотворення слова. Завжди звіряйте контрольні слова з еталоном!" },
        { text: "Букви автоматично замінюються на латинські еквіваленти", correct: false, reason: "Неправильно! Такого збою не буває при заміні шрифтів AutoCAD." },
        { text: "Текст починає читатися зліва направо замість справа наліво", correct: false, reason: "Неправильно! Напрямок тексту регулюється системою." },
        { text: "Букви завжди перетворюються на суцільні чорні прямокутники", correct: false, reason: "Неправильно! Підміна алеф/тет виглядає майже нормально, тому вона найпідступніша." }
      ]
    },
    {
      id: "q11",
      category: "Шрифти",
      title: "Що означає поява знаків питання «?» у текстових підписах креслення?",
      options: [
        { text: "Це позначення невідомого матеріалу труби чи породи дерева", correct: false, reason: "Неправильно! Це технічна помилка рендерингу символу." },
        { text: "Символ не рендериться шрифтом через відсутність потрібного .shx або .ttf файлу; знаки «?» заборонені", correct: true, reason: "Правильно! (Розділ 2.7). Поява знаків «?» — це аварійний сигнал про проблему зі шрифтом." },
        { text: "Замовник просить уточнити цей об'єкт на місцевості", correct: false, reason: "Неправильно!" },
        { text: "Це тимчасова позначка, яку дозволено залишати на фінальному кресленні", correct: false, reason: "Неправильно! Знаки «?» у зданих файлах суворо заборонені." }
      ]
    },
    {
      id: "q12",
      category: "Шари",
      title: "Що означає префікс «-X» у назвах шарів (наприклад, -X_TREES)?",
      options: [
        { text: "Цей шар буде видалено плагіном перед фінальною здачею", correct: false, reason: "Неправильно! Шар не видаляється, а виключається з вибірки поверхні." },
        { text: "Це обов'язкова вимога ізраїльського державного стандарту MAVAT", correct: false, reason: "Неправильно! Це внутрішня домовленість нашої команди." },
        { text: "Це внутрішнє маркування: об'єкти на цьому шарі НЕ беруться в побудову TIN-поверхні", correct: true, reason: "Правильно! (Розділ 2.8). Дозволяє одним рухом відфільтрувати зайве при імпорті даних у поверхню." },
        { text: "Це шари, які експортуються у формат REG замість DIS", correct: false, reason: "Неправильно! Префікс стосується фільтрації рельєфу." }
      ]
    },
    {
      id: "q13",
      category: "Поверхня",
      title: "Який крок основних горизонталей (Minor interval) встановлюється для масштабу 1:250 за базовою формулою?",
      options: [
        { text: "0.50 м", correct: false, reason: "Неправильно! 0.50 м використовується для масштабу 1:500." },
        { text: "0.25 м (за формулою: масштаб ÷ 1000 = 250 ÷ 1000)", correct: true, reason: "Правильно! (Розділ 7.1). Для 1:250 Minor = 0.25 м, Major = 1.25 м." },
        { text: "0.10 м", correct: false, reason: "Неправильно! Надто густі горизонталі для цього масштабу." },
        { text: "Крок горизонталей обирається довільно на розсуд картографа", correct: false, reason: "Неправильно! Крок суворо регламентований стандартом." }
      ]
    },
    {
      id: "q14",
      category: "Поверхня",
      title: "Як правильно вчинити з горизонталями рельєфу всередині контурів будівель?",
      options: [
        { text: "Горизонталі під будівлями обов'язково видаляються (вирізаються) або маскуються", correct: true, reason: "Правильно! (Розділ 7.5). Над шарами будівель (наприклад, M2200) горизонталей бути не повинно." },
        { text: "Залишити як є — горизонталі показують, який був схил під фундаментом", correct: false, reason: "Неправильно! За стандартом рельєф усередині будівель не відображається." },
        { text: "Перефарбувати їх у червоний колір для позначення перепаду висоти цоколя", correct: false, reason: "Неправильно! Це грубе порушення стандарту оформлення." },
        { text: "Зробити їх пунктирною тонкою лінією", correct: false, reason: "Неправильно! Вони повністю видаляються з-під контуру." }
      ]
    },
    {
      id: "q15",
      category: "Висоти",
      title: "Яка функція JOT Complex Plugin переносить фізичну координату Z блоку сітки в текстовий атрибут HEIGHT?",
      options: [
        { text: "MOVE", correct: false, reason: "Неправильно! MOVE лише зміщує геометрію у просторі." },
        { text: "Z2A (Z &rarr; Attribute)", correct: true, reason: "Правильно! (Розділи 2.11, 6.4). Спочатку Move Block to Surface садить блок на TIN, а Z2A записує значення висоти в атрибут підпису." },
        { text: "OVERKILL", correct: false, reason: "Неправильно! OVERKILL видаляє графічні дублікати." },
        { text: "Blocks on Vertices", correct: false, reason: "Неправильно! Ця функція лише вставляє блоки у вершини сітки." }
      ]
    },
    {
      id: "q16",
      category: "Контроль",
      title: "Як обов'язково перевірити згенеровані файли REG та DIS перед здачею замовнику?",
      options: [
        { text: "Достатньо перевірити розмір файлів у провіднику Windows (має бути більше 1 КБ)", correct: false, reason: "Неправильно! Це не гарантує цілісність та коректність координат." },
        { text: "Відкрити їх у Блокноті й порахувати кількість рядків", correct: false, reason: "Неправильно! Це не дає гарантії геометричної точності." },
        { text: "Виконати зворотний імпорт (Import REG/DIS) у нове порожнє креслення і перевірити точки й 3D-лінії", correct: true, reason: "Правильно! (Розділ 9.2). Це займає 2 хвилини й виявляє 99% помилок експорту." },
        { text: "Перевірка не потрібна, бо плагін ніколи не допускає збоїв", correct: false, reason: "Неправильно! Перевірка результату експорту є обов'язковим стандартом якості." }
      ]
    },
    {
      id: "q17",
      category: "Комунікація",
      title: "Коли ви зобов'язані попередити менеджера (Iryna), якщо бачите, що не встигаєте до дедлайну?",
      options: [
        { text: "Вранці в день дедлайну, коли термін уже настав", correct: false, reason: "Неправильно! У день дедлайну менеджер уже не встигне домовитися про перенесення." },
        { text: "Спробувати таємно надолужити вночі та на вихідних, не турбуючи керівництво", correct: false, reason: "Неправильно! Прийом «мовчки на вихідних» заборонено інструкцією." },
        { text: "Щойно стало очевидно, що графік відстає (того ж самого дня)", correct: true, reason: "Правильно! (Розділ 9.4). Чим раніше повідомити, тим легше узгодити новий термін без штрафів." },
        { text: "Надіслати замовнику чорновий неповний файл, щоб формально закрити термін", correct: false, reason: "Неправильно! Неперевірені файли надсилати суворо заборонено." }
      ]
    },
    {
      id: "q18",
      category: "Комунікація",
      title: "Ви отримали зауваження від старшого картографа, але впевнені, що ваше рішення правильне. Як діяти?",
      options: [
        { text: "Мовчки переробити як сказали, а потім скаржитися колегам", correct: false, reason: "Неправильно! Ви даремно зіпсуєте правильну роботу й витратите купу часу." },
        { text: "Обговорити зауваження аргументовано ДО того, як виправляти креслення", correct: true, reason: "Правильно! (Розділ 11.2). Питання: «Я зробив так, бо тут не видно основи через кущі — як краще показати?» рятує від марної переробки." },
        { text: "Проігнорувати зауваження й відправити замовнику напряму", correct: false, reason: "Неправильно! Перший місяць здача тільки через підтвердження старшого картографа." },
        { text: "Написати скаргу менеджеру на упередженість старшого картографа", correct: false, reason: "Неправильно! Технічні питання вирішуються професійним діалогом зі старшим колегою." }
      ]
    },
    {
      id: "q19",
      category: "Векторизація",
      title: "Знайди помилку: Яка дія під час оцифрування будівель є ГРУБОЮ ПОМИЛКОЮ?",
      options: [
        { text: "Оцифровувати контур будівлі звичайною 2D-полілінією командою PL з увімкненим ORTHO (F8)", correct: false, reason: "Це правильна дія! Будівлі знімаються у 2D з ортогональною прив'язкою кутів." },
        { text: "Оцифрувати цоколь будівлі як 3D-полілінію і включити її в TIN-поверхню як Breakline", correct: true, reason: "Правильно (це груба помилка)! (Розділ 4.3). Будівлі НЕ беруть участі у поверхні, вони спотворять рельєф!" },
        { text: "Обов'язково замикати контур будівлі через PEDIT → Close", correct: false, reason: "Це правильна дія! Контур будівлі завжди має бути замкненим." },
        { text: "Видалити горизонталі з-під контуру будівлі", correct: false, reason: "Це правильна дія! Над фундаментами будівель горизонталей бути не повинно." }
      ]
    },
    {
      id: "q20",
      category: "Оформлення",
      title: "Знайди помилку: Яка дія з оформлення плану є КРИТИЧНОЮ ПОМИЛКОЮ?",
      options: [
        { text: "Залишити в підписах знаки питання «?» замість нерозпізнаних літер івриту", correct: true, reason: "Правильно (це критична помилка)! (Розділ 2.7). Знаки «?» у підписах суворо заборонені — це сигнал браку шрифту." },
        { text: "Використовувати висоту тексту 0.4 для масштабу 1:250", correct: false, reason: "Це правильна дія! 0.4 м — стандартна висота тексту для масштабу 1:250." },
        { text: "Зафіксувати рамку Viewport параметром Display Locked = Yes", correct: false, reason: "Це правильна дія! Блокування захищає масштаб вікна від випадкового збою зумом." },
        { text: "Розставити координатні підписи сітки через кожні 25 метрів по осях X та Y", correct: false, reason: "Це правильна дія! Координатна сітка оформлюється з кроком 25 м." }
      ]
    },
    {
      id: "q21",
      category: "Файли",
      title: "Знайди помилку: Що з переліченого ЗАБОРОНЕНО залишати у файлі IDAN.dwg?",
      options: [
        { text: "3D-полілінії бордюрів та країв асфальту", correct: false, reason: "Це дозволено і необхідно! Вони беруть участь у поверхні." },
        { text: "Блоки висотних точок рельєфу з координатами X, Y, Z", correct: false, reason: "Це дозволено і необхідно! Вони йдуть у файл точок REG." },
        { text: "Контури будівель, штриховки, підписи назв вулиць та саму TIN-поверхню", correct: true, reason: "Правильно (це заборонено)! (Розділ 9.1). Усе зайве потрапить у REG/DIS і призведе до браку здачі." },
        { text: "3D-полілінії парканів (breaklines)", correct: false, reason: "Це дозволено і необхідно! Паркани формують лінії перелому рельєфу DIS." }
      ]
    },
    {
      id: "q22",
      category: "Поверхня",
      title: "Команда MAPTRIM та обрізка горизонталей: яка ключова вимога до контуру межі?",
      options: [
        { text: "Межа для обрізки функцією MAPTRIM повинна бути виключно 2D полілінією з Z = 0", correct: true, reason: "Правильно! (Розділ 7.3). Якщо межа має висоту Z, відмінну від нуля, MAPTRIM працює некоректно!" },
        { text: "Межа обов'язково повинна бути тривимірною 3D-полілінією з найвищою відміткою ділянки", correct: false, reason: "Неправильно! З 3D межею команда обрізки дає геометричний збій." },
        { text: "Перед запуском MAPTRIM потрібно обов'язково розбити (EXPLODE) межу на окремі лінії", correct: false, reason: "Неправильно! Межа повинна бути єдиним замкненим полігоном." },
        { text: "Обрізку можна виконувати лише у вікні Layout через відображення Viewport", correct: false, reason: "Неправильно! MAPTRIM виконується у просторі моделі." }
      ]
    },
    {
      id: "q23",
      category: "Блоки",
      title: "Генерація точкових об'єктів плагіном VisionSpot: яке обов'язкове правило контролю?",
      options: [
        { text: "VisionSpot має 100% точність, тому результат можна одразу експортувати без ручної перевірки", correct: false, reason: "Неправильно! Автоматика завжди дає хибні спрацювання та пропускає затемнені люки." },
        { text: "Результат VisionSpot обов'язково перевіряється очима на предмет пропусків або хибних точок на кущах і машинах", correct: true, reason: "Правильно! (Розділи 2.13, 5.1). Ручна перевірка автоматики обов'язкова до перетворення точок у блоки." },
        { text: "VisionSpot призначений виключно для розпізнавання підземних кабелів", correct: false, reason: "Неправильно! Він шукає люки, дерева, опори та знаки на поверхні." },
        { text: "Після VisionSpot усі точки автоматично перетворюються на 3D-горизонталі", correct: false, reason: "Неправильно! Точки конвертуються у тематичні блоки об'єктів." }
      ]
    },
    {
      id: "q24",
      category: "Комунікація",
      title: "Англомовні листи замовнику: яке головне правило безпеки діє в команді?",
      options: [
        { text: "Можна відправляти самостійно без попередження, якщо лист звичайного інформаційного характеру", correct: false, reason: "Неправильно! Будь-який лист замовнику попередньо показують Iryna." },
        { text: "Будь-який лист замовнику обов'язково показується менеджеру Iryna перед відправкою, а менеджер завжди в копії", correct: true, reason: "Правильно! (Розділи 1.2, 1.6). Формулювання в листі визначає відповідальність за графік робіт." },
        { text: "Замовнику дозволено писати лише через особисті приватні повідомлення", correct: false, reason: "Неправильно! Усі домовленості ведуться суворо в офіційних спільних каналах." },
        { text: "Якщо замовник надіслав пошкоджений файл, треба написати йому звинувачення в недбалості", correct: false, reason: "Неправильно! Тон має бути коректним і без звинувачень (Шаблон В)." }
      ]
    }
  ];

  let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

  function renderQuiz(filter = "all") {
    container.innerHTML = "";

    questions.forEach((q, qIndex) => {
      const isAnswered = state[q.id] !== undefined;
      const selectedIndex = state[q.id];
      const isCorrect = isAnswered && q.options[selectedIndex].correct;

      // Фільтрація карток
      if (filter === "wrong" && (!isAnswered || isCorrect)) return;
      if (filter === "unanswered" && isAnswered) return;

      const card = document.createElement("div");
      card.className = "quiz-question-card";
      card.id = `card_${q.id}`;

      let optionsHtml = "";
      q.options.forEach((opt, oIndex) => {
        let optClass = "quiz-option";
        if (isAnswered) {
          optClass += " locked";
          if (selectedIndex === oIndex) {
            optClass += opt.correct ? " correct" : " wrong";
          } else if (opt.correct) {
            optClass += " revealed-correct";
          }
        }

        const letter = String.fromCharCode(65 + oIndex); // A, B, C, D
        optionsHtml += `
          <div class="${optClass}" data-qid="${q.id}" data-oid="${oIndex}">
            <span class="option-marker">${letter}</span>
            <span>${opt.text}</span>
          </div>
        `;
      });

      let explHtml = "";
      if (isAnswered) {
        const selectedOpt = q.options[selectedIndex];
        const explClass = selectedOpt.correct ? "quiz-explanation show-correct" : "quiz-explanation show-wrong";
        explHtml = `
          <div class="${explClass}">
            <strong>${selectedOpt.correct ? "✅ Правильно!" : "❌ Помилка!"}</strong> ${selectedOpt.reason}
          </div>
        `;
      }

      card.innerHTML = `
        <div class="question-header">
          <div>
            <div class="question-number">Питання ${qIndex + 1} з ${questions.length}</div>
            <div class="question-title">${q.title}</div>
          </div>
          <span class="question-badge">${q.category}</span>
        </div>
        <div class="quiz-options">${optionsHtml}</div>
        ${explHtml}
      `;

      card.querySelectorAll(".quiz-option:not(.locked)").forEach(optEl => {
        optEl.addEventListener("click", () => {
          const qid = optEl.dataset.qid;
          const oid = parseInt(optEl.dataset.oid);
          state[qid] = oid;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          renderQuiz(getActiveFilter());
          updateScore();
        });
      });

      container.appendChild(card);
    });

    updateScore();
  }

  function updateScore() {
    const total = questions.length;
    const answeredKeys = Object.keys(state);
    const answeredCount = answeredKeys.length;
    let correctCount = 0;

    answeredKeys.forEach(qid => {
      const q = questions.find(item => item.id === qid);
      if (q && q.options[state[qid]] && q.options[state[qid]].correct) {
        correctCount++;
      }
    });

    const wrongCount = answeredCount - correctCount;
    const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    if (answeredCountEl) answeredCountEl.innerText = `${answeredCount} / ${total}`;
    if (correctCountEl) correctCountEl.innerText = correctCount;
    if (wrongCountEl) wrongCountEl.innerText = wrongCount;
    if (percentText) percentText.innerText = `${percent}%`;

    if (scoreCircle) {
      scoreCircle.style.setProperty("--percent", percent);
    }

    if (statusBadge) {
      if (answeredCount === 0) {
        statusBadge.className = "score-badge pending";
        statusBadge.innerText = "Тест не розпочато";
      } else if (percent >= 90) {
        statusBadge.className = "score-badge pass";
        statusBadge.innerText = "🏆 Відмінно! Повна готовність до самостійної роботи";
      } else if (percent >= 75) {
        statusBadge.className = "score-badge pass";
        statusBadge.innerText = "👍 Добре! Зверни увагу на виділені червоним помилки";
      } else {
        statusBadge.className = "score-badge fail";
        statusBadge.innerText = "⚠️ Потрібно повторити розділи інструкції перед здачею";
      }
    }
  }

  function getActiveFilter() {
    const active = document.querySelector(".quiz-filter-btn.active");
    return active ? active.dataset.filter : "all";
  }

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderQuiz(btn.dataset.filter);
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Скинути всі відповіді в тестах?")) {
        state = {};
        localStorage.removeItem(STORAGE_KEY);
        renderQuiz("all");
        showToast("Тести скинуто. Можна пройти повторно!");
      }
    });
  }

  renderQuiz("all");
}
