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
// 11. ІНТЕРАКТИВНІ ТЕСТИ ДЛЯ САМОПЕРЕВІРКИ
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

  // Банк детальних запитань за матеріалами інструкції v2.0
  const questions = [
    {
      id: "q1",
      category: "Організація",
      title: "Що ви повинні зробити згідно з «Правилом 15 хвилин», якщо ви застрягли над завданням і немає прогресу?",
      options: [
        { text: "Сидіти до кінця дня і самостійно розбиратися, щоб показати старанність", correct: false, reason: "Неправильно! Довге самостійне колупання перестає бути навчанням і стає втратою робочого часу." },
        { text: "Запитати у старшого картографа чи менеджера рівно через 15 хвилин відсутності прогресу", correct: true, reason: "Правильно! (Розділ 1). 15 хвилин — це чітка межа. Питати — абсолютно нормально й очікувано." },
        { text: "Пропустити цю ділянку і повернутися до неї наприкінці проєкту", correct: false, reason: "Неправильно! Помилка чи затримка на ранньому етапі паралізує побудову поверхні." }
      ]
    },
    {
      id: "q2",
      category: "Civil 3D",
      title: "Яке значення системної змінної OSNAPZ має бути встановлено під час оцифрування рельєфу та 3D-поліліній з хмари точок?",
      options: [
        { text: "OSNAPZ = 1", correct: false, reason: "Неправильно! За OSNAPZ = 1 координата Z ігнорується, і всі лінії впадуть у Z=0 — ви отримаєте плоский план без висот!" },
        { text: "OSNAPZ = 0", correct: true, reason: "Правильно! (Розділ 2.10). OSNAPZ = 0 змушує Civil 3D брати повні 3D-координати X, Y, Z безпосередньо з точок хмари." },
        { text: "Значення не має, бо висота береться з шаблону", correct: false, reason: "Неправильно! OSNAPZ — головний перемикач висотної прив'язки." }
      ]
    },
    {
      id: "q3",
      category: "Хмара точок",
      title: "Ви звірили контрольну зйомку з хмарою: на одній точці ΔZ = +0.02 м, а на іншій +0.38 м (розкид 36 см). Ваші дії?",
      options: [
        { text: "Порахувати середнє ΔZ та опустити всю хмару командою MOVE", correct: false, reason: "Неправильно! Розкид понад 5 см свідчить про внутрішню деформацію хмари. Зсувом MOVE це не лікується!" },
        { text: "Зупинити роботу та негайно написати замовнику листом (Шаблон Б) про деформацію хмари", correct: true, reason: "Правильно! (Розділ 3.4). Розкид > 5 см — це брак сканування. Руками такі деформації не виправляють." },
        { text: "Підігнати відмітки вручну під контрольні точки замовника", correct: false, reason: "Неправильно! Підгонка на око дасть геометрично хибну карту, що виявиться на будівництві." }
      ]
    },
    {
      id: "q4",
      category: "Хмара точок",
      title: "Який максимальний допустимий розкид ΔZ між контрольними точками для виправлення хмари звичайним зміщенням (MOVE)?",
      options: [
        { text: "До 15 см", correct: false, reason: "Неправильно! 15 см — це катастрофічна похибка для топоплану." },
        { text: "До 5 см (0.05 м)", correct: true, reason: "Правильно! (Розділ 3.4). 5 см — наш робочий поріг між систематичним зсувом та деформацією." },
        { text: "До 1 метра", correct: false, reason: "Неправильно!" }
      ]
    },
    {
      id: "q5",
      category: "Файли",
      title: "У чому полягає принципова різниця між файлами SURFACE.dwg та IDAN.dwg?",
      options: [
        { text: "Це однакові файли, просто збережені під різними назвами", correct: false, reason: "Неправильно! Замовник суворо розрізняє ці файли." },
        { text: "У SURFACE міститься сама TIN-поверхня з горизонталями, а в IDAN її немає — лише вихідні 3D-полілінії та пікети", correct: true, reason: "Правильно! (Розділи 1.8, 9.1). IDAN — це сировина для вивантаження REG/DIS, поверхні в ньому бути не повинно." },
        { text: "У SURFACE лежить плоский план, а в IDAN — 3D модель", correct: false, reason: "Неправильно! Плоский план лежить у файлі MAP.dwg." }
      ]
    },
    {
      id: "q6",
      category: "Файли",
      title: "Яку висоту Z (Elevation) повинні мати об'єкти у фінальному оформленому файлі MAP.dwg?",
      options: [
        { text: "Усі лінії та блоки повинні мати реальну висоту Z з хмари точок", correct: false, reason: "Неправильно! Реальне 3D залишається у файлах SURFACE та IDAN." },
        { text: "Усе має бути сплющено до Elevation = 0 (абсолютно плоске 2D креслення)", correct: true, reason: "Правильно! (Розділ 9.1). Файл MAP — це плоска карта для візуального перегляду замовником." },
        { text: "Будівлі мають Z=0, а рельєф Z=100", correct: false, reason: "Неправильно!" }
      ]
    },
    {
      id: "q7",
      category: "Векторизація",
      title: "Як правильно оцифровувати бордюрний камінь для коректної побудови рельєфу?",
      options: [
        { text: "Однією 3D-полілінією по центру бордюру", correct: false, reason: "Неправильно! Рельєф не отримає вертикальної стінки бордюру." },
        { text: "Двома паралельними 3D-полілініями: окремо верхня кромка і окремо нижня (стик з асфальтом) з різними відмітками Z", correct: true, reason: "Правильно! (Розділи 4.5, 4.9). Дві лінії фіксують перепад висоти та укіс бордюру." },
        { text: "Звичайною 2D полілінією з блоком у центрі", correct: false, reason: "Неправильно!" }
      ]
    },
    {
      id: "q8",
      category: "Векторизація",
      title: "Чи повинні паркани та огорожі додаватися до побудови TIN-поверхні?",
      options: [
        { text: "Ні, паркани — це штучні об'єкти, вони йдуть тільки в карту MAP", correct: false, reason: "Неправильно! Це типова помилка початківців." },
        { text: "Так, обов'язково 3D-полілініями як Breaklines, бо паркан майже завжди є бровкою перелому рельєфу", correct: true, reason: "Правильно! (Розділ 4.3). Якщо пропустити паркан, горизонталі «розтечуться» крізь перепад висот." },
        { text: "Тільки якщо висота паркану перевищує 3 метри", correct: false, reason: "Неправильно!" }
      ]
    },
    {
      id: "q9",
      category: "Векторизація",
      title: "Звідки картограф бере геометрію підземних інженерних комунікацій (труби, кабелі)?",
      options: [
        { text: "Знаходить їх безпосередньо у хмарі точок лазерного сканування", correct: false, reason: "Неправильно! Лазерний сканер не проникає крізь ґрунт і не бачить підземних мереж!" },
        { text: "Виключно з архівних або викопіювальних схем замовника, прив'язуючи їх до видимих на поверхні люків", correct: true, reason: "Правильно! (Розділи 1.3, 4.9). З хмари знімаються тільки люки, кришки та колодязі на поверхні." },
        { text: "З'єднує люки найкоротшою прямою лінією на власний розсуд", correct: false, reason: "Неправильно! Вигадувати траси комунікацій категорично заборонено." }
      ]
    },
    {
      id: "q10",
      category: "Шрифти",
      title: "Яка підміна літер івриту найчастіше виникає через збій шрифтів і є непомітною на перший погляд?",
      options: [
        { text: "Буква א (алеф) підміняється на ט (тет)", correct: true, reason: "Правильно! (Розділ 2.7). Підпис здається візуально схожим, але це спотворення слова. Завжди звіряйте контрольні слова з еталоном!" },
        { text: "Буква ש підміняється на цифру 8", correct: false, reason: "Неправильно!" },
        { text: "Слова автоматично перекладаються англійською", correct: false, reason: "Неправильно!" }
      ]
    },
    {
      id: "q11",
      category: "Шрифти",
      title: "Що означає поява знаків питання «?» у текстових підписах креслення?",
      options: [
        { text: "Це позначення невідомого матеріалу труби чи породи дерева", correct: false, reason: "Неправильно!" },
        { text: "Символ не рендериться шрифтом через відсутність потрібного .shx або .ttf файлу; знаки «?» заборонені", correct: true, reason: "Правильно! (Розділ 2.7). Поява знаків «?» — це аварійний сигнал про проблему зі шрифтом." },
        { text: "Замовник просить уточнити цей об'єкт на місцевості", correct: false, reason: "Неправильно!" }
      ]
    },
    {
      id: "q12",
      category: "Шари",
      title: "Що означає префікс «-X» у назвах шарів (наприклад, -X_TREES)?",
      options: [
        { text: "Цей шар буде видалено перед здачею", correct: false, reason: "Неправильно!" },
        { text: "Це наша внутрішня домовленість: об'єкти на цьому шарі НЕ беруться в побудову TIN-поверхні", correct: true, reason: "Правильно! (Розділ 2.8). Дозволяє одним рухом відфільтрувати зайве при імпорті даних у поверхню." },
        { text: "Це секретний шар замовника", correct: false, reason: "Неправильно!" }
      ]
    },
    {
      id: "q13",
      category: "Поверхня",
      title: "Який крок основних горизонталей (Minor interval) встановлюється для масштабу 1:250 за базовою формулою?",
      options: [
        { text: "0.50 м", correct: false, reason: "Неправильно! 0.50 м використовується для масштабу 1:500." },
        { text: "0.25 м (за формулою: масштаб ÷ 1000 = 250 ÷ 1000)", correct: true, reason: "Правильно! (Розділ 7.1). Для 1:250 Minor = 0.25 м, Major = 1.25 м." },
        { text: "1.00 м", correct: false, reason: "Неправильно!" }
      ]
    },
    {
      id: "q14",
      category: "Поверхня",
      title: "Як правильно вчинити з горизонталями рельєфу всередині контурів будівель?",
      options: [
        { text: "Залишити як є — горизонталі показують, який був схил під фундаментом", correct: false, reason: "Неправильно! За стандартом рельєф усередині будівель не відображається." },
        { text: "Горизонталі під будівлями обов'язково видаляються (вирізаються) або маскуються", correct: true, reason: "Правильно! (Розділ 7.5). Над шарами будівель (наприклад, M2200) горизонталей бути не повинно." },
        { text: "Зробити їх пунктирною червоною лінією", correct: false, reason: "Неправильно!" }
      ]
    },
    {
      id: "q15",
      category: "Висоти",
      title: "Яка функція JOT Complex Plugin переносить фізичну координату Z блоку сітки в текстовий атрибут HEIGHT?",
      options: [
        { text: "MOVE", correct: false, reason: "Неправильно! MOVE лише зміщує геометрію." },
        { text: "Z2A (Z &rarr; Attribute)", correct: true, reason: "Правильно! (Розділи 2.11, 6.4). Спочатку Move Block to Surface садить блок на TIN, а Z2A записує значення висоти в атрибут підпису." },
        { text: "OVERKILL", correct: false, reason: "Неправильно! OVERKILL видаляє дублікати." }
      ]
    },
    {
      id: "q16",
      category: "Контроль",
      title: "Як обов'язково перевірити згенеровані файли REG та DIS перед здачею замовнику?",
      options: [
        { text: "Відкрити їх у Блокноті й порахувати кількість рядків", correct: false, reason: "Неправильно! Це не дає гарантії геометричної точності." },
        { text: "Виконати зворотний імпорт (Import REG/DIS) у нове порожнє креслення і перевірити точки й 3D-лінії", correct: true, reason: "Правильно! (Розділ 9.2). Це займає 2 хвилини й виявляє 99% помилок експорту." },
        { text: "Перевірка не потрібна, бо плагін ніколи не помиляється", correct: false, reason: "Неправильно!" }
      ]
    },
    {
      id: "q17",
      category: "Комунікація",
      title: "Коли ви зобов'язані попередити менеджера (Iryna), якщо бачите, що не встигаєте до дедлайну?",
      options: [
        { text: "Вранці в день дедлайну, коли термін уже настав", correct: false, reason: "Неправильно! У день дедлайну менеджер уже не встигне домовитися про перенесення." },
        { text: "Щойно стало очевидно, що графік відстає (того ж самого дня)", correct: true, reason: "Правильно! (Розділ 9.4). Чим раніше повідомити, тим легше узгодити новий термін без штрафів." },
        { text: "Нічого не казати, а мовчки працювати у вихідні", correct: false, reason: "Неправильно!" }
      ]
    },
    {
      id: "q18",
      category: "Комунікація",
      title: "Ви отримали зауваження від старшого картографа, але впевнені, що ваше рішення правильне. Як діяти?",
      options: [
        { text: "Мовчки переробити як сказали, а потім скаржитися колегам", correct: false, reason: "Неправильно! Ви даремно зіпсуєте правильну роботу й витратите купу часу." },
        { text: "Обговорити зауваження аргументовано ДО того, як виправляти креслення", correct: true, reason: "Правильно! (Розділ 11.2). Питання: «Я зробив так, бо тут не видно основи через кущі — як краще показати?» рятує від марної переробки." },
        { text: "Проігнорувати зауваження й відправити замовнику", correct: false, reason: "Неправильно! Перший місяць здача тільки через підтвердження старшого картографа." }
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

      // Фільтри
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

        const letter = String.fromCharCode(65 + oIndex); // A, B, C...
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
            <strong>${selectedOpt.correct ? "✅ Відмінно!" : "❌ Помилка!"}</strong> ${selectedOpt.reason}
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

      // Події кліку на варіанти
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

  // Первинний рендер
  renderQuiz("all");
}
