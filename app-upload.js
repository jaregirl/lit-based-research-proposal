const STORAGE_KEY = "proposalBuilderA4DraftUploadVersion";
const SRQ_LIMITS = {
  minimum: 2,
  preferredMaximum: 5,
  maximum: 7
};
const rqPurposeOptions = {
  describe: {
    label: "Describe a level, condition, perception, practice, or experience",
    starters: "What is the level of...? What are the perceptions of...? To what extent...?"
  },
  compare: {
    label: "Compare groups, conditions, or situations",
    starters: "Is there a significant difference in...? How do groups differ in...?"
  },
  relationship: {
    label: "Determine a relationship between variables",
    starters: "Is there a significant relationship between...? What is the association between...?"
  },
  predict: {
    label: "Predict an outcome from one or more factors",
    starters: "Which factors predict...? To what extent do... predict...?"
  },
  exploreExperience: {
    label: "Explore experiences, meanings, perceptions, or processes",
    starters: "How do participants describe...? What are the experiences of...? What themes emerge regarding...?"
  },
  explain: {
    label: "Explain how or why something happens",
    starters: "How and why does...? What factors influence...? How does... occur?"
  },
  evaluate: {
    label: "Evaluate a program, strategy, intervention, or practice",
    starters: "How effective is...? How do participants evaluate...? What is the impact of...?"
  },
  develop: {
    label: "Develop a model, framework, or theory",
    starters: "What framework can be developed...? What model explains...? What theory may be generated from...?"
  }
};
const uploadStageIds = ["a1", "a2", "a3"];
let uploadTargetStage = "a1";
let pendingUploadByStage = { a1: null, a2: null, a3: null };
let pdfjsModule = null;

const stages = [
  { id: "details", code: "Info", title: "Student Details" },
  { id: "a1", code: "A1", title: "Core Construct Identification" },
  { id: "a2", code: "A2", title: "Deepened Review and Pattern Mapping" },
  { id: "a3", code: "A3", title: "From Patterns to Gaps" },
  { id: "a4", code: "A4", title: "Literature-Based Problem and Questions" },
  { id: "methodology", code: "M", title: "Methodology Builder" },
  { id: "ethics", code: "E", title: "Ethical Considerations" },
  { id: "instrumentation", code: "I", title: "Instrumentation Builder" },
  { id: "outline", code: "O", title: "Proposal Outline Generator" },
  { id: "readiness", code: "R", title: "Proposal Readiness Check" },
  { id: "submission", code: "PDF", title: "PDF Submission Generation" }
];

const fieldSets = {
  a1: [
    ["initialTopic", "Write your initial topic or area of interest.", "Begin with the topic as you currently understand it. It can come from classroom experience, curiosity, or concern."],
    ["majorNouns", "Extract the major nouns from your topic.", "List the important nouns only. These may be concepts, populations, settings, methods, or outcomes."],
    ["fifteenPageTest", "Which nouns pass the 15-page test?", "Ask: If I had to write 15 pages defining only this noun, could I? Nouns that pass may be possible core constructs."],
    ["rrlMajorityTest", "Which ONE noun would most of your 10-15 articles primarily define?", "Use the RRL majority test. The noun most likely to be defined across the literature is your core construct."],
    ["coreConstruct", "Final declaration: This study is about _____.", "State the core construct plainly. A clear construct prevents scattered literature review, artificial gap statements, and vague problem formulation."]
  ],
  a4: [
    ["literatureProblem", "State the literature-based problem.", "Use the movement from A3: what studies show, what remains less visible, and what this prevents us from understanding."],
    ["centralQuestion", "Write the central research question.", "The CRQ should respond directly to the literature-based problem, not only to personal interest."],
    ["questionType", "What kind of understanding is needed?", "Decide whether the problem requires measurement, explanation/description, or both. This will later guide methodology."],
    ["studiedGroup", "Who or what will be examined in your study?", "Use the group, context, or phenomenon made visible by the gap. Keep it feasible."],
    ["rqConstructs", "Which construct and gap ideas must appear in the questions?", "Carry forward the A1 core construct and A3 final gap. Avoid adding new variables without literature support."]
  ],
  methodology: [
    ["rqTypes", "What type of questions are being asked?", "Look at your research questions first. Their verbs usually guide the design: describe, compare, relate, evaluate, or explore."],
    ["dataNeeded", "What data are needed?", "Name the evidence needed to answer the questions: scores, survey responses, interview answers, observations, documents, or classroom outputs."],
    ["participants", "Who will participate?", "Identify the participant group, approximate number if known, grade level/program, and why they fit the study."],
    ["purpose", "What is the purpose of the study?", "State whether the study aims to describe a condition, understand an experience, test an intervention, compare groups, or improve classroom practice."]
  ],
  ethics: [
    ["participantAge", "Will participants include minors or vulnerable groups?", "If learners are below 18, plan for parent/guardian consent and child assent. Also note any group needing extra protection."],
    ["powerIssue", "Could there be teacher-student or researcher-participant power issues?", "Consider whether students might feel forced to join because of grades, authority, or classroom relationships."],
    ["dataPrivacy", "What private or sensitive information might be collected?", "List data that must be protected: names, grades, recordings, school records, responses, photos, or interview details."],
    ["permissions", "What institutional permissions will be needed?", "Think of letters or approvals from the school head, cooperating teacher, adviser, ethics committee, parents, or participants."]
  ],
  submission: [
    ["studentName", "Student Name", "Use the name required by your instructor or institution."],
    ["course", "Course", "Enter the course or subject where this app output will be submitted."],
    ["section", "Section", "Add your section, block, program, or class schedule if required."],
    ["submissionDate", "Date", "Use the date of submission or the date your instructor requires."],
    ["initialReadiness", "Initial Readiness Reflection", "Before starting A1, briefly state how ready you think your proposal idea is. Example: 2/5 because I have a topic but not yet a clear literature gap."]
  ],
  finalSubmission: [
    ["confidence", "Final Readiness Reflection", "After completing the workflow, briefly state how ready you think the proposal is and what still needs refinement. Example: 4/5 because the gap and questions are clear but the instruments need revision."],
    ["readinessChange", "What Changed and Why?", "Compare your initial and final readiness. Explain what became clearer, what changed, and what still needs work."]
  ]
};

const tableScaffolds = {
  a2Patterns: {
    type: "Use a pattern category: Context, Method, Theory, Evidence, Practice, Population, or Definition.",
    notice: "Write what repeats across studies. Do not summarize one article; look across several studies.",
    authors: "List the authors that support this pattern. Example: DeLuca et al.; Xu and Brown.",
    years: "Add publication years so the pattern is traceable."
  },
  a3Gaps: {
    type: "Carry the pattern type from A2.",
    show: "State what studies repeatedly show.",
    emphasized: "Name the focus created by those studies.",
    lessVisible: "Because studies focus on that emphasis, what becomes less visible?",
    limits: "Explain what this prevents us from understanding.",
    gap: "Write the refined gap statement. Avoid only saying 'few studies exist.'"
  },
  instrumentation: {
    rq: "Copy or summarize one research question. Each question should have a data source.",
    instrument: "Choose a tool: survey, test, interview guide, focus group guide, observation checklist, rubric, journal, or document guide.",
    description: "Describe what the instrument is and what parts, scales, prompts, indicators, or sections it contains.",
    purpose: "Explain what the instrument is meant to measure, observe, describe, compare, or explore.",
    validation: "Explain expert validation, pilot testing, reliability, inter-rater checking, or trustworthiness strategy.",
    implementation: "Explain how, when, where, and by whom the instrument will be administered or used."
  }
};

const defaultData = {
  currentStage: "details",
  startedAt: "",
  a1: {},
  a2: {
    constructs: [
      { construct: "", definition: "", context: "", notes: "" }
    ],
    patterns: [
      { type: "Context", notice: "", authors: "", years: "" },
      { type: "Method", notice: "", authors: "", years: "" },
      { type: "Theory", notice: "", authors: "", years: "" },
      { type: "Evidence", notice: "", authors: "", years: "" },
      { type: "Practice", notice: "", authors: "", years: "" },
      { type: "Population", notice: "", authors: "", years: "" },
      { type: "Definition", notice: "", authors: "", years: "" }
    ]
  },
  a3: {
    gaps: [
      { type: "Context", show: "", emphasized: "", lessVisible: "", limits: "", gap: "" },
      { type: "Method", show: "", emphasized: "", lessVisible: "", limits: "", gap: "" },
      { type: "Theory", show: "", emphasized: "", lessVisible: "", limits: "", gap: "" },
      { type: "Evidence", show: "", emphasized: "", lessVisible: "", limits: "", gap: "" },
      { type: "Practice", show: "", emphasized: "", lessVisible: "", limits: "", gap: "" },
      { type: "Population", show: "", emphasized: "", lessVisible: "", limits: "", gap: "" },
      { type: "Definition", show: "", emphasized: "", lessVisible: "", limits: "", gap: "" }
    ],
    strongestGap: "",
    weakestGap: "",
    selectionReason: "",
    finalGap: ""
  },
  a4: {
    questions: ["", "", ""],
    questionPurposes: ["", "", ""]
  },
  methodology: {
    selectedDesign: "",
    sampling: "",
    locale: "",
    collection: "",
    analysis: ""
  },
  ethics: {
    checks: {},
    draft: ""
  },
  instrumentation: {
    rows: [
      { rq: "", instrument: "", description: "", purpose: "", validation: "", implementation: "" }
    ]
  },
  outline: {
    notes: ""
  },
  readiness: {},
  submission: {}
};

const ethicsChecks = [
  "Voluntary participation",
  "Informed consent",
  "Right to withdraw",
  "Confidentiality",
  "Anonymity when appropriate",
  "Data privacy",
  "Secure data storage",
  "Institutional permission",
  "Parental consent when minors are involved",
  "Child assent when minors participate",
  "Avoidance of harm",
  "No coercion",
  "Researcher-participant power issues",
  "Ethics review requirements"
];

let state = normalizeState(loadState());

const els = {
  stageNav: document.getElementById("stageNav"),
  stageTitle: document.getElementById("stageTitle"),
  stageForm: document.getElementById("stageForm"),
  feedback: document.getElementById("feedback"),
  issueList: document.getElementById("issueList"),
  completionText: document.getElementById("completionText"),
  completionBar: document.getElementById("completionBar"),
  alignmentScore: document.getElementById("alignmentScore"),
  currentStage: document.getElementById("currentStage"),
  previewDialog: document.getElementById("previewDialog"),
  submissionPreview: document.getElementById("submissionPreview"),
  importFile: document.getElementById("importFile")
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return clone(defaultData);
  try {
    return { ...clone(defaultData), ...JSON.parse(saved) };
  } catch {
    return clone(defaultData);
  }
}

function normalizeState(nextState) {
  const normalized = { ...clone(defaultData), ...nextState };
  if (!normalized.startedAt) normalized.startedAt = new Date().toISOString();
  normalized.a1 = { ...clone(defaultData.a1), ...(nextState.a1 || {}) };
  normalized.a2 = { ...clone(defaultData.a2), ...(nextState.a2 || {}) };
  normalized.a3 = { ...clone(defaultData.a3), ...(nextState.a3 || {}) };
  normalized.a4 = { ...clone(defaultData.a4), ...(nextState.a4 || {}) };
  normalized.methodology = { ...clone(defaultData.methodology), ...(nextState.methodology || {}) };
  normalized.ethics = { ...clone(defaultData.ethics), ...(nextState.ethics || {}) };
  normalized.instrumentation = { ...clone(defaultData.instrumentation), ...(nextState.instrumentation || {}) };
  normalized.outline = { ...clone(defaultData.outline), ...(nextState.outline || {}) };
  normalized.submission = { ...clone(defaultData.submission), ...(nextState.submission || {}) };
  if (!Array.isArray(normalized.a2.patterns)) normalized.a2.patterns = clone(defaultData.a2.patterns);
  if (!Array.isArray(normalized.a3.gaps)) normalized.a3.gaps = clone(defaultData.a3.gaps);
  if (!Array.isArray(normalized.a4.questions)) normalized.a4.questions = ["", "", ""];
  if (!Array.isArray(normalized.a4.questionPurposes)) normalized.a4.questionPurposes = [];
  normalized.a4.questionPurposes = normalized.a4.questions.map((_, index) => normalized.a4.questionPurposes[index] || "");
  if (!Array.isArray(normalized.instrumentation.rows)) normalized.instrumentation.rows = clone(defaultData.instrumentation.rows);
  normalized.instrumentation.rows = normalized.instrumentation.rows.map(normalizeInstrumentRow);
  return normalized;
}

function normalizeInstrumentRow(row = {}) {
  return {
    rq: row.rq || "",
    instrument: row.instrument || "",
    description: row.description || row.data || "",
    purpose: row.purpose || row.sample || "",
    validation: row.validation || "",
    implementation: row.implementation || row.source || ""
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateDashboard();
}

function currentIndex() {
  return stages.findIndex((stage) => stage.id === state.currentStage);
}

function value(path, fallback = "") {
  const [section, key] = path.split(".");
  return state[section]?.[key] ?? fallback;
}

function setValue(section, key, nextValue) {
  state[section][key] = nextValue;
  saveState();
}

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString([], {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatDuration(startValue, endDate = new Date()) {
  const startDate = new Date(startValue);
  if (Number.isNaN(startDate.getTime())) return "Not recorded";
  const totalMinutes = Math.max(0, Math.round((endDate - startDate) / 60000));
  if (totalMinutes < 1) return "Less than 1 minute";
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(`${days} day${days === 1 ? "" : "s"}`);
  if (hours) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (minutes) parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  return parts.join(", ");
}

function sentence(parts) {
  return parts.filter((part) => String(part || "").trim()).join(" ");
}

function renderNav() {
  els.stageNav.innerHTML = stages.map((stage) => {
    const done = stageCompletion(stage.id) > 0.55 ? "done" : "";
    const active = state.currentStage === stage.id ? "active" : "";
    const index = stages.findIndex((item) => item.id === stage.id);
    const isNext = index === currentIndex() + 1 ? "next-step" : "";
    return `
      <button class="stage-tab ${active} ${isNext}" type="button" data-stage="${stage.id}" title="Step ${index + 1}: ${stage.title}">
        <span class="stage-code">${stage.code}</span>
        <span class="stage-label"><small>Step ${index + 1}${isNext ? " - Next" : ""}</small>${stage.title}</span>
        <span class="status-dot ${done}" aria-hidden="true"></span>
      </button>
    `;
  }).join("");
}

function render() {
  const stage = stages[currentIndex()];
  els.stageTitle.textContent = `${stage.code} - ${stage.title}`;
  els.currentStage.textContent = stage.code;
  renderNav();
  renderStage();
  syncStudentDetailsFields();
  updateStudentDetailsButtonVisibility();
  updateUploadButtonLabel();
  updateDashboard();
}

function updateStudentDetailsButtonVisibility() {
  const button = document.getElementById("studentDetailsBtn");
  if (!button) return;
  button.hidden = state.currentStage !== "details";
}

function updateUploadButtonLabel() {
  const button = document.getElementById("uploadFormsBtn");
  if (!button) return;
  if (state.currentStage === "a1") {
    button.textContent = "Upload A1 Form";
    button.disabled = false;
  } else if (state.currentStage === "a2") {
    button.textContent = "Upload A2 Form";
    button.disabled = false;
  } else if (state.currentStage === "a3") {
    button.textContent = "Upload A3 Form";
  } else {
    button.hidden = true;
    return;
  }
  button.hidden = false;
  button.disabled = false;
}

function renderStage() {
  const id = state.currentStage;
  if (id === "a1") return renderA1();
  if (id === "details") return renderStudentDetailsStage();
  if (id === "a2") return renderA2();
  if (id === "a3") return renderA3();
  if (id === "a4") return renderA4();
  if (id === "methodology") return renderMethodology();
  if (id === "ethics") return renderEthics();
  if (id === "instrumentation") return renderInstrumentation();
  if (id === "outline") return renderOutline();
  if (id === "readiness") return renderReadiness();
  return renderSubmission();
}

function renderFields(section, fields) {
  return `
    <div class="field-grid">
      ${fields.map(([key, label, scaffold], index) => `
        <div class="field ${index === fields.length - 1 ? "full" : ""}">
          <label for="${section}-${key}">${label}</label>
          <textarea id="${section}-${key}" data-section="${section}" data-key="${key}">${escapeHtml(value(`${section}.${key}`))}</textarea>
          <p class="hint">${escapeHtml(section === "submission" ? scaffold : `${scaffold} This is a working draft, and you can refine it later.`)}</p>
        </div>
      `).join("")}
    </div>
  `;
}

function renderStudentDetailsStage() {
  els.stageForm.innerHTML = `
    <section class="output-box">
      <h3>Student Details</h3>
      <p class="hint">These details will appear in the proposal summary and PDF submission. You can update them later from the Student Details button.</p>
    </section>
    ${renderFields("submission", fieldSets.submission)}
  `;
}

function renderA1() {
  const topic = buildTopic();
  els.stageForm.innerHTML = `
    ${renderFields("a1", fieldSets.a1)}
    <section class="output-box">
      <h3>A1 Output</h3>
      <div class="generated-text">${escapeHtml(topic || "Your core construct declaration will appear here.")}</div>
    </section>
  `;
}

function renderA2() {
  els.stageForm.innerHTML = `
    <section class="table-wrap">
      <h3>Pattern Mapping Matrix</h3>
      <p class="hint">Read at least 10-15 peer-reviewed journal articles directly related to your A1 core construct. Do not summarize each article separately. Look for repetition across studies.</p>
      <div class="table-scroll">
        <div class="editable-list">
          ${state.a2.patterns.map((row, index) => tableRow("a2Patterns", index, ["type", "notice", "authors", "years"], ["Pattern Type", "What do you notice across studies?", "Supporting Authors", "Year"])).join("")}
        </div>
      </div>
      <button type="button" data-add-row="a2Patterns">Add Pattern</button>
    </section>
    <section class="field">
      <label for="a2-synthesis">Short synthesis</label>
      <textarea id="a2-synthesis" data-section="a2" data-key="synthesis">${escapeHtml(value("a2.synthesis"))}</textarea>
      <p class="hint">Write 5-7 sentences: What seems heavily studied? What approaches dominate? What keeps recurring? What feels less developed?</p>
    </section>
  `;
}

function renderA3() {
  els.stageForm.innerHTML = `
    <section class="table-wrap">
      <h3>A3 Matrix: From Patterns to Gaps</h3>
      <p class="hint">A gap is not simply what is missing. It is what cannot yet be understood because studies emphasize certain approaches, groups, methods, or explanations.</p>
      <div class="table-scroll">
        <div class="editable-list">
          ${state.a3.gaps.map((row, index) => tableRow("a3Gaps", index, ["type", "show", "emphasized", "lessVisible", "limits", "gap"], ["Pattern Type", "Studies repeatedly show...", "What is emphasized", "What is not captured / less visible", "What this limits us from understanding", "Refined Gap Statement"])).join("")}
        </div>
      </div>
      <button type="button" data-add-row="a3Gaps">Add Gap Row</button>
    </section>
    <div class="field-grid">
      <div class="field">
        <label for="a3-strongestGap">Strongest gap</label>
        <textarea id="a3-strongestGap" data-section="a3" data-key="strongestGap">${escapeHtml(value("a3.strongestGap"))}</textarea>
        <p class="hint">Choose a gap that is specific, connected to the pattern, shows what cannot yet be understood, and can be examined in a real context.</p>
      </div>
      <div class="field">
        <label for="a3-weakestGap">Weakest gap</label>
        <textarea id="a3-weakestGap" data-section="a3" data-key="weakestGap">${escapeHtml(value("a3.weakestGap"))}</textarea>
        <p class="hint">A weak gap often repeats the pattern, only says something is missing, is too broad, or cannot realistically be investigated.</p>
      </div>
      <div class="field">
        <label for="a3-selectionReason">Reason for selection</label>
        <textarea id="a3-selectionReason" data-section="a3" data-key="selectionReason">${escapeHtml(value("a3.selectionReason"))}</textarea>
        <p class="hint">Explain why the strongest gap is more useful for your study than the weaker gap.</p>
      </div>
      <div class="field">
        <label for="a3-finalGap">Final gap to carry forward</label>
        <textarea id="a3-finalGap" data-section="a3" data-key="finalGap">${escapeHtml(value("a3.finalGap"))}</textarea>
        <p class="hint">State what remains insufficiently understood and why that limitation exists.</p>
      </div>
    </div>
    <section class="output-box">
      <h3>A3 Output</h3>
      <div class="generated-text">${escapeHtml(value("a3.finalGap") || "Your final literature gap will appear here.")}</div>
    </section>
  `;
}

function renderA4() {
  els.stageForm.innerHTML = `
    ${renderFields("a4", fieldSets.a4)}
    <section class="output-box">
      <h3>Research Question Builder</h3>
      <div class="generated-text">Start with purpose before wording. Ask: What specific information should this question answer? Then choose the purpose and use the suggested starters.</div>
    </section>
    <section class="table-wrap">
      <h3>Specific Research Questions</h3>
      <p class="hint">Each SRQ should be traceable to the central question, the A3 final gap, and the A1 core construct. Add ${SRQ_LIMITS.minimum}-${SRQ_LIMITS.maximum} questions as needed.</p>
      <div class="editable-list">
        ${state.a4.questions.map((question, index) => `
          <div class="question-row">
            <label>
              <span class="hint">Question ${index + 1} purpose</span>
              <select data-question-purpose="${index}">
                <option value="">Choose the purpose of this question</option>
                ${Object.entries(rqPurposeOptions).map(([key, option]) => `<option value="${key}" ${state.a4.questionPurposes[index] === key ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
              </select>
            </label>
            <textarea data-array="a4.questions" data-index="${index}" aria-label="Research question ${index + 1}">${escapeHtml(question)}</textarea>
            <button class="row-remove" type="button" data-remove-question="${index}">X</button>
            <p class="hint">${escapeHtml(questionStarterHint(index))}</p>
          </div>
        `).join("")}
      </div>
      <button type="button" data-add-question>Add Question</button>
    </section>
  `;
}

function questionStarterHint(index) {
  const purpose = state.a4.questionPurposes[index];
  if (!purpose || !rqPurposeOptions[purpose]) {
    return "Choose a purpose first. The app will suggest question starters based on what the question is trying to find out.";
  }
  return `Suggested starters: ${rqPurposeOptions[purpose].starters}`;
}

function renderMethodology() {
  els.stageForm.innerHTML = `
    ${renderFields("methodology", fieldSets.methodology)}
    <section class="field">
      <label for="selectedDesign">Recommended or selected research design</label>
      <select id="selectedDesign" data-section="methodology" data-key="selectedDesign">
        ${["", "Descriptive Quantitative", "Correlational Quantitative", "Comparative Quantitative", "Quasi-experimental", "Phenomenology", "Case Study", "Narrative Inquiry", "Basic Qualitative Study", "Mixed Methods", "Action Research"].map((option) => `
          <option value="${option}" ${value("methodology.selectedDesign") === option ? "selected" : ""}>${option || "Select after reviewing recommendation"}</option>
        `).join("")}
      </select>
      <p class="hint">${escapeHtml(recommendMethodology())}</p>
    </section>
    ${methodologyOutputFields()}
  `;
}

function methodologyOutputFields() {
  const fields = [
    ["sampling", "Sampling", "Explain how participants will be chosen. Examples: purposive, convenience, total enumeration, random sampling, or intact class selection."],
    ["locale", "Locale", "Describe the school, classroom, community, or online setting without exposing private details unnecessarily."],
    ["collection", "Data Collection", "Sequence the steps: permission, consent, instrument administration, interview/observation, retrieval, and safekeeping."],
    ["analysis", "Data Analysis", "Match analysis to data: frequency/mean, t-test, correlation, thematic analysis, content analysis, or reflection cycle."]
  ];
  return `<div class="field-grid">${fields.map(([key, label]) => `
    <div class="field">
      <label for="methodology-${key}">${label}</label>
      <textarea id="methodology-${key}" data-section="methodology" data-key="${key}">${escapeHtml(value(`methodology.${key}`))}</textarea>
      <p class="hint">${escapeHtml(fields.find((field) => field[0] === key)[2])} This can change after your adviser checks the design.</p>
    </div>
  `).join("")}</div>`;
}

function renderEthics() {
  els.stageForm.innerHTML = `
    ${renderFields("ethics", fieldSets.ethics)}
    <section class="field">
      <h3>Ethics Checklist</h3>
      <p class="hint">Select only safeguards that apply, then explain them in your own context. If learners are minors, consent and assent usually need special attention.</p>
      ${ethicsChecks.map((item) => `
        <label class="hint"><input class="small-input" type="checkbox" data-ethics-check="${escapeHtml(item)}" ${state.ethics.checks[item] ? "checked" : ""}> ${item}</label>
      `).join("")}
    </section>
    <section class="output-box">
      <h3>Draft Ethical Considerations Section</h3>
      <textarea data-section="ethics" data-key="draft">${escapeHtml(value("ethics.draft") || buildEthicsDraft())}</textarea>
      <p class="hint">Risk level: ${escapeHtml(ethicsRisk().label)}. ${escapeHtml(ethicsRisk().reason)}</p>
    </section>
  `;
}

function renderInstrumentation() {
  syncInstrumentationRows();
  const rows = state.instrumentation.rows;
  els.stageForm.innerHTML = `
    <section class="table-wrap">
      <h3>Instrumentation Alignment Table</h3>
      <p class="hint">Each non-empty research question from A4 gets one instrumentation row. The question purpose from A4 is shown so the instrument plan matches what the question is trying to find out.</p>
      <div class="table-scroll">
        <div class="editable-list">
          ${rows.map((row, index) => instrumentationRow(index)).join("")}
        </div>
      </div>
      <button type="button" data-add-row="instrumentation">Add Instrument Row</button>
    </section>
  `;
}

function syncInstrumentationRows() {
  const existingRows = state.instrumentation.rows.map(normalizeInstrumentRow);
  const questions = state.a4.questions.filter((question) => question.trim());
  const nextRows = questions.map((question, index) => {
    const existing = existingRows[index] || emptyRowFor("instrumentation");
    return { ...existing, rq: question };
  });
  const extraRows = existingRows.slice(questions.length).filter((row) =>
    row.instrument || row.description || row.purpose || row.validation || row.implementation
  );
  state.instrumentation.rows = nextRows.concat(extraRows);
}

function instrumentationRow(index) {
  const row = state.instrumentation.rows[index];
  const purposeKey = state.a4.questionPurposes[index] || "";
  const purpose = rqPurposeOptions[purposeKey];
  const purposeHint = purpose
    ? `Question purpose from A4: ${purpose.label}. Suggested question starters: ${purpose.starters}`
    : "No A4 question purpose selected yet. Return to A4 and choose the purpose of this question.";
  return `
    <div class="table-row instrumentation-row" style="--cols:6">
      <section class="output-box">
        <h3>Research Question ${index + 1}</h3>
        <div class="generated-text">${escapeHtml(row.rq || "No research question has been entered yet.")}</div>
        <p class="hint">${escapeHtml(purposeHint)}</p>
      </section>
      ${["instrument", "description", "purpose", "validation", "implementation"].map((key) => `
        <label>
          <span class="hint">${escapeHtml(key[0].toUpperCase() + key.slice(1))}</span>
          <textarea data-table="instrumentation" data-index="${index}" data-key="${key}">${escapeHtml(row[key] || "")}</textarea>
          <span class="hint">${escapeHtml(instrumentationScaffold(key, purposeKey))}</span>
        </label>
      `).join("")}
      <button class="row-remove" type="button" data-remove-row="instrumentation:${index}">X</button>
    </div>
  `;
}

function instrumentationScaffold(key, purposeKey) {
  const purposeSpecific = {
    describe: "Name the level, condition, perception, practice, or experience this instrument will describe.",
    compare: "Name the comparable data the instrument will gather from each group, condition, or situation.",
    relationship: "Name the variables or constructs the instrument will measure so their relationship can be examined.",
    predict: "Name the predictor and outcome data the instrument will gather.",
    exploreExperience: "Name the experiences, meanings, perceptions, or processes the instrument will explore.",
    explain: "Name the evidence the instrument will gather to explain how or why the phenomenon occurs.",
    evaluate: "Name the evidence the instrument will gather about effectiveness, implementation, or impact.",
    develop: "Name the evidence the instrument will gather to support model, framework, or theory development."
  };
  const base = {
    instrument: "Choose a tool: survey, test, interview guide, focus group guide, observation checklist, rubric, journal, or document guide.",
    description: "Describe the instrument parts, scales, prompts, indicators, sections, and sample item or example indicator.",
    purpose: purposeSpecific[purposeKey] || "Explain what data this instrument needs to collect for the research question.",
    validation: "Explain expert validation, pilot testing, reliability, inter-rater checking, or trustworthiness strategy.",
    implementation: "Explain the source of data and how, when, where, and by whom the instrument will be administered or used."
  };
  return base[key] || "Add a clear, study-specific detail.";
}

function renderOutline() {
  els.stageForm.innerHTML = `
    <section class="output-box">
      <h3>Proposal Outline</h3>
      <div class="generated-text">${escapeHtml(buildOutline())}</div>
    </section>
    <section class="field">
      <label for="outline-notes">Instructor notes or local format reminders</label>
      <textarea id="outline-notes" data-section="outline" data-key="notes">${escapeHtml(value("outline.notes"))}</textarea>
      <p class="hint">Add school-specific headings, adviser instructions, citation style, or chapter labels here. This helps you adapt the outline without asking the app to write the manuscript.</p>
    </section>
  `;
}

function renderReadiness() {
  const report = readinessReport();
  els.stageForm.innerHTML = `
    <section class="output-box">
      <h3>Proposal Readiness Score</h3>
      <div class="generated-text">${report.score}/100 - ${report.label}</div>
    </section>
    <section class="checker-panel">
      <h3>Alignment Report</h3>
      <div class="feedback">${report.items.map(feedbackHtml).join("")}</div>
    </section>
  `;
}

function renderSubmission() {
  els.stageForm.innerHTML = `
    <section class="output-box">
      <h3>Submission Tools</h3>
      <div class="generated-text">Complete the readiness reflection after reviewing the proposal readiness report. Then preview the submission and use Generate PDF or Print.</div>
    </section>
    <section class="output-box">
      <h3>Initial Readiness Reflection</h3>
      <div class="generated-text">${escapeHtml(value("submission.initialReadiness") || "No initial readiness reflection has been entered yet. Return to Info - Student Details to add it.")}</div>
      <p class="hint">This is read-only here. Edit it in Info - Student Details if correction is needed.</p>
    </section>
    ${renderFields("submission", fieldSets.finalSubmission)}
  `;
}

function tableRow(section, index, keys, labels) {
  const row = getTableRows(section)[index];
  return `
    <div class="table-row ${section}-row" style="--cols:${keys.length}">
      ${keys.map((key, keyIndex) => `
        <label>
          <span class="hint">${labels[keyIndex]}</span>
          <textarea data-table="${section}" data-index="${index}" data-key="${key}">${escapeHtml(row[key] || "")}</textarea>
          <span class="hint">${escapeHtml(tableScaffolds[section]?.[key] || "Add a clear, study-specific detail.")}</span>
        </label>
      `).join("")}
      <button class="row-remove" type="button" data-remove-row="${section}:${index}">X</button>
    </div>
  `;
}

function getTableRows(section) {
  if (section === "a2Patterns") return state.a2.patterns;
  if (section === "a3Gaps") return state.a3.gaps;
  return state.instrumentation.rows;
}

function emptyRowFor(section) {
  if (section === "a2Patterns") return { type: "", notice: "", authors: "", years: "" };
  if (section === "a3Gaps") return { type: "", show: "", emphasized: "", lessVisible: "", limits: "", gap: "" };
  return { rq: "", instrument: "", description: "", purpose: "", validation: "", implementation: "" };
}

function buildTopic() {
  const a1 = state.a1;
  if (a1.coreConstruct) return `This study is about ${a1.coreConstruct}.`;
  if (a1.rrlMajorityTest) return `This study is about ${a1.rrlMajorityTest}.`;
  if (a1.initialTopic) return `Initial topic: ${a1.initialTopic}`;
  return "";
}

function buildProblem() {
  if (state.a4.literatureProblem) return state.a4.literatureProblem;
  if (state.a3.finalGap) return `Based on the reviewed literature, ${state.a3.finalGap}`;
  return "Use A3 to identify what studies show, what becomes less visible, and what this prevents us from understanding. Then state the literature-based problem here.";
}

function recommendMethodology() {
  const text = `${state.a4.questionType || ""} ${state.methodology.rqTypes || ""} ${state.methodology.purpose || ""}`.toLowerCase();
  if (text.includes("relat") || text.includes("correl")) return "Recommendation: Correlational quantitative design, because the questions examine relationships between constructs.";
  if (text.includes("compar") || text.includes("difference")) return "Recommendation: Comparative quantitative design, because the questions compare groups or categories.";
  if (text.includes("effect") || text.includes("improv") || text.includes("experiment")) return "Recommendation: Quasi-experimental design may fit if an intervention is tested with measurable outcomes.";
  if (text.includes("experience") || text.includes("explor") || text.includes("describe their")) return "Recommendation: Qualitative design such as phenomenology, case study, or basic qualitative study may fit.";
  if (text.includes("action") || text.includes("classroom intervention")) return "Recommendation: Action research may fit if the goal is to improve practice in a specific classroom.";
  if (text.includes("mixed")) return "Recommendation: Mixed methods may fit if both numeric trends and participant explanations are needed.";
  return "Recommendation: Add question type and data needs to receive a methodology suggestion. Do not force the method; let the research questions guide it.";
}

function buildEthicsDraft() {
  const selected = ethicsChecks.filter((item) => state.ethics.checks[item]);
  return `The study will observe ethical standards including ${selected.length ? selected.join(", ") : "voluntary participation, informed consent, confidentiality, data privacy, and institutional permission"}. Participants will be informed about the purpose of the study, their right to withdraw, and how their data will be protected. This section can be refined based on school ethics review requirements.`;
}

function ethicsRisk() {
  const text = `${state.ethics.participantAge || ""} ${state.ethics.powerIssue || ""} ${state.ethics.dataPrivacy || ""}`.toLowerCase();
  if (text.includes("minor") || text.includes("child") || text.includes("sensitive") || text.includes("trauma")) {
    return { label: "Higher Risk", reason: "Minors, vulnerable groups, or sensitive data require stronger safeguards and review." };
  }
  if (text.includes("student") || text.includes("teacher") || text.includes("grade") || text.includes("private")) {
    return { label: "Moderate Risk", reason: "School-based data and power relationships need careful consent and confidentiality planning." };
  }
  return { label: "Minimal Risk", reason: "No major risk markers are currently described, but ethics review may still be required." };
}

function buildOutline() {
  const core = state.a1.coreConstruct || state.a1.rrlMajorityTest || "[A1 core construct]";
  const gap = state.a3.finalGap || "[A3 final gap]";
  const problem = state.a4.literatureProblem || "[A4 literature-based problem]";
  const crq = state.a4.centralQuestion || "[A4 central research question]";
  const srqs = state.a4.questions.filter(Boolean).map((question, index) => `  ${index + 1}. ${question}`).join("\n") || "  [Add specific research questions from A4]";
  const patterns = state.a2.patterns.filter((row) => row.notice).map((row) => `  - ${row.type}: ${row.notice}`).join("\n") || "  [Add A2 literature patterns]";

  return `Chapter 1: The Problem and Its Scope
Introduction
- Rationale
  Explain why the study is worth doing by connecting the concern to the literature gap: ${gap}
- Background of the Study
  Anchor this section on the core construct: ${core}
  Use these literature patterns as the basis:
${patterns}

Statement of the Problem
- General Statement
  Carry forward this literature-based problem: ${problem}
- Specific Statements in Question Form
  Central research question: ${crq}
${srqs}
- Hypothesis/Assumptions
  Add hypotheses for quantitative testing or assumptions for qualitative/descriptive work when required.
- Significance
  Explain who benefits from understanding the gap: ${gap}

Methodology
- Design
  Current selected design: ${state.methodology.selectedDesign || "[Select methodology]"}
- Scope and Limitations/Delimitations
  Identify participant boundaries, locale boundaries, construct boundaries, and what the study will not cover.
- Participants
  ${state.methodology.participants || "[Describe participants]"}
  Sampling: ${state.methodology.sampling || "[Describe sampling]"}
- Locale
  ${state.methodology.locale || "[Describe locale]"}
- Instrumentation
  Describe each instrument, its purpose, validation, and how it will be implemented.
- Data Procedure
  Data gathering: ${state.methodology.collection || "[Describe data gathering procedure]"}
  Data analysis: ${state.methodology.analysis || "[Describe data analysis]"}
  Ethical considerations: Carry forward the ethics safeguards selected in the app.

Definition of Terms
- Operational Definition of Key Terms
  Define ${core} and other key terms as used in this study. Operational definitions may be based on indicators, instruments, participant context, procedures, or how the construct will be measured or observed.

Appendices
- Permission Letter
- Consent Forms
- Instruments
- Validation Forms`;
}

function runChecks(stageId = state.currentStage) {
  const checks = {
    a1: checkA1,
    details: checkStudentDetails,
    a2: checkA2,
    a3: checkA3,
    a4: checkA4,
    methodology: checkMethodology,
    ethics: checkEthics,
    instrumentation: checkInstrumentation,
    outline: () => [{ level: "green", text: "The outline is ready to guide drafting. Add institution-specific notes if your instructor requires a format." }],
    readiness: () => readinessReport().items,
    submission: checkFinalSubmission
  };
  return checks[stageId]();
}

function checkA1() {
  const results = [];
  results.push(flag(Boolean(state.a1.initialTopic), "Initial topic is stated.", "Write the initial topic or area of interest."));
  results.push(flag(Boolean(state.a1.majorNouns), "Major nouns have been extracted.", "List the major nouns from the topic."));
  results.push(flag(Boolean(state.a1.fifteenPageTest), "Possible core constructs passed the 15-page test.", "Identify which nouns are rich enough to define deeply."));
  results.push(flag(Boolean(state.a1.rrlMajorityTest), "RRL majority test is answered.", "Choose the one noun most of your 10-15 articles would primarily define."));
  results.push(flag(Boolean(state.a1.coreConstruct), "Core construct declaration is clear.", "Complete the declaration: This study is about _____."));
  return results;
}

function checkA2() {
  const rows = state.a2.patterns.filter((row) => row.notice || row.authors || row.years);
  const results = [
    flag(Boolean(state.a1.coreConstruct || state.a1.rrlMajorityTest), "A1 core construct is available to guide the review.", "Complete A1 before mapping literature patterns."),
    flag(rows.length >= 3, "Several literature patterns are identified.", "Add patterns across at least three categories such as context, method, theory, evidence, practice, population, or definition."),
    flag(Boolean(state.a2.synthesis), "Short synthesis is written.", "Write a 5-7 sentence synthesis of what is heavily studied, dominant, recurring, and less developed.")
  ];
  rows.forEach((row) => {
    if (!row.authors) results.push({ level: "yellow", text: `${row.type || "A pattern"} needs supporting authors.` });
    if (!row.years) results.push({ level: "yellow", text: `${row.type || "A pattern"} needs publication years.` });
  });
  return results;
}

function checkA3() {
  const rows = state.a3.gaps.filter((row) => row.show || row.lessVisible || row.limits || row.gap);
  const results = [
    flag(rows.length >= 1, "At least one gap row is developed.", "Use A2 patterns to identify what becomes less visible and what this limits us from understanding."),
    flag(Boolean(state.a3.strongestGap), "Strongest gap is selected.", "Select the strongest gap."),
    flag(Boolean(state.a3.weakestGap), "Weakest gap is identified.", "Identify a weaker gap so the selection is deliberate."),
    flag(Boolean(state.a3.selectionReason), "Selection reason is explained.", "Explain why the strongest gap is stronger."),
    flag(Boolean(state.a3.finalGap), "Final gap is ready to carry forward.", "Write the final gap clearly.")
  ];
  rows.forEach((row) => {
    if (row.gap && /lack|lacks|few studies|missing/i.test(row.gap) && !row.limits) {
      results.push({ level: "yellow", text: `${row.type || "A gap"} may only state absence. Explain what this limits us from understanding.` });
    }
    if (row.lessVisible && !row.limits) results.push({ level: "yellow", text: `${row.type || "A gap"} needs the limitation in understanding.` });
  });
  return results;
}

function checkA4() {
  const questions = state.a4.questions.filter((q) => q.trim());
  const text = questions.join(" ").toLowerCase();
  const core = (state.a1.coreConstruct || state.a1.rrlMajorityTest || "").toLowerCase();
  const results = [
    flag(Boolean(state.a3.finalGap), "A3 final gap is available.", "Complete A3 first so the problem is traceable from literature."),
    flag(Boolean(state.a4.literatureProblem), "Literature-based problem is stated.", "Translate the final gap into a problem statement."),
    flag(Boolean(state.a4.centralQuestion), "Central research question is written.", "Write the CRQ that responds to the problem."),
    flag(questions.length >= SRQ_LIMITS.minimum && questions.length <= SRQ_LIMITS.maximum, `There are ${SRQ_LIMITS.minimum}-${SRQ_LIMITS.maximum} specific research questions.`, `Add ${SRQ_LIMITS.minimum}-${SRQ_LIMITS.maximum} SRQs that unpack the central question.`),
    flag(Boolean(state.a4.questionType), "Needed understanding is identified.", "Name whether the study needs measurement, explanation/description, or both."),
    flag(Boolean(state.a4.studiedGroup), "Study focus is visible.", "Clarify who or what will be examined.")
  ];
  if (core && !`${state.a4.centralQuestion || ""} ${text} ${state.a4.literatureProblem || ""}`.toLowerCase().includes(core.split(" ")[0])) {
    results.push({ level: "yellow", text: `The core construct "${state.a1.coreConstruct || state.a1.rrlMajorityTest}" may be missing from the problem or questions.` });
  }
  questions.forEach((q, index) => {
    if (/^(do|does|is|are|will)\b/i.test(q) && !/significant|level|relationship|difference|experience|extent/i.test(q)) {
      results.push({ level: "yellow", text: `Question ${index + 1} may read like a yes/no opinion question.` });
    }
  });
  results.push(...questionStructureWarnings(questions));
  return results;
}

function questionStructureWarnings(questions) {
  const warnings = [];
  if (questions.length > SRQ_LIMITS.preferredMaximum) {
    warnings.push({
      level: "yellow",
      text: `There are ${questions.length} specific research questions. This can be acceptable, but check whether some are only sub-parts of another question or can be combined.`
    });
  }
  const starts = new Map();
  questions.forEach((question, index) => {
    const start = normalizeQuestion(question).split(" ").slice(0, 5).join(" ");
    if (!start) return;
    if (starts.has(start)) {
      warnings.push({
        level: "yellow",
        text: `Questions ${starts.get(start) + 1} and ${index + 1} begin very similarly. Check whether they are separate questions or repeated parts of the same inquiry.`
      });
    } else {
      starts.set(start, index);
    }
    if ((question.match(/\band\b/gi) || []).length >= 2) {
      warnings.push({
        level: "yellow",
        text: `Question ${index + 1} may be double-barreled. Check whether it asks more than one question at once.`
      });
    }
  });
  for (let i = 0; i < questions.length; i += 1) {
    for (let j = i + 1; j < questions.length; j += 1) {
      if (questionOverlap(questions[i], questions[j]) >= 0.72) {
        warnings.push({
          level: "yellow",
          text: `Questions ${i + 1} and ${j + 1} have substantial overlap. Check whether one is a sub-question or duplicate of the other.`
        });
      }
    }
  }
  return warnings;
}

function normalizeQuestion(question) {
  return String(question || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(what|how|is|there|the|a|an|of|in|to|for|among|with|and|or|does|do)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function questionOverlap(first, second) {
  const firstTokens = new Set(normalizeQuestion(first).split(" ").filter((token) => token.length > 3));
  const secondTokens = new Set(normalizeQuestion(second).split(" ").filter((token) => token.length > 3));
  if (!firstTokens.size || !secondTokens.size) return 0;
  const shared = [...firstTokens].filter((token) => secondTokens.has(token)).length;
  return shared / Math.min(firstTokens.size, secondTokens.size);
}

function checkMethodology() {
  const rec = recommendMethodology().toLowerCase();
  const design = (state.methodology.selectedDesign || "").toLowerCase();
  return [
    flag(Boolean(state.methodology.selectedDesign), "A research design is selected.", "Select or enter a research design after reviewing the recommendation."),
    flag(!design || rec.includes(design.split(" ")[0]) || rec.includes("add question"), "Methodology appears aligned with the question type.", "Review whether the method matches the research questions."),
    flag(Boolean(state.methodology.participants), "Participants are described.", "Describe who will participate."),
    flag(Boolean(state.methodology.collection), "Data collection is planned.", "Add how data will be collected."),
    flag(Boolean(state.methodology.analysis), "Data analysis is planned.", "Add how the data will be analyzed.")
  ];
}

function checkEthics() {
  const checked = Object.values(state.ethics.checks).filter(Boolean).length;
  return [
    flag(checked >= 6, "Core ethics safeguards are selected.", "Select the ethics safeguards that apply to the study."),
    flag(Boolean(state.ethics.permissions), "Institutional permission is considered.", "Name the permission needed from the school or office."),
    flag(Boolean(value("ethics.draft") || buildEthicsDraft()), "A draft ethics section is available.", "Generate or write a draft ethics section.")
  ];
}

function checkInstrumentation() {
  const rows = state.instrumentation.rows.map(normalizeInstrumentRow).filter((row) => row.rq || row.instrument || row.description);
  const results = [flag(rows.length > 0, "At least one instrument row is listed.", "Add instruments for each research question.")];
  rows.forEach((row, index) => {
    if (!row.rq) results.push({ level: "red", text: `Row ${index + 1}: research question is missing.` });
    if (!row.instrument) results.push({ level: "red", text: `Row ${index + 1}: instrument is missing.` });
    if (!row.description) results.push({ level: "yellow", text: `Row ${index + 1}: instrument description is missing.` });
    if (!row.purpose) results.push({ level: "yellow", text: `Row ${index + 1}: instrument purpose is missing.` });
    if (!row.validation) results.push({ level: "yellow", text: `Row ${index + 1}: validation or reliability/trustworthiness is missing.` });
    if (!row.implementation) results.push({ level: "yellow", text: `Row ${index + 1}: instrument implementation is missing.` });
  });
  return results;
}

function checkStudentDetails() {
  return [
    flag(Boolean(state.submission.studentName), "Student name is included.", "Add student name."),
    flag(Boolean(state.submission.course), "Course is included.", "Add course."),
    flag(Boolean(state.submission.submissionDate), "Date is included.", "Add the submission date."),
    flag(Boolean(state.submission.initialReadiness), "Initial readiness reflection is included.", "Add an initial readiness reflection before A1.")
  ];
}

function checkFinalSubmission() {
  return [
    flag(Boolean(state.submission.confidence), "Final readiness reflection is included.", "Add a final readiness reflection after completing the workflow."),
    flag(Boolean(state.submission.readinessChange), "Change explanation is included.", "Explain what changed from the initial reflection and why.")
  ];
}

function flag(condition, pass, fail) {
  return { level: condition ? "green" : "yellow", text: condition ? pass : fail };
}

function feedbackHtml(item) {
  return `<div class="feedback-item ${item.level}">${escapeHtml(item.text)}</div>`;
}

function readinessReport() {
  const checks = [
    ["Core Construct to Literature Patterns", Boolean(state.a1.coreConstruct || state.a1.rrlMajorityTest) && state.a2.patterns.some((row) => row.notice && row.authors)],
    ["Patterns to Gap", state.a2.patterns.some((row) => row.notice) && Boolean(state.a3.finalGap)],
    ["Gap to Problem", Boolean(state.a3.finalGap) && Boolean(state.a4.literatureProblem)],
    ["Problem to Questions", Boolean(state.a4.literatureProblem) && Boolean(state.a4.centralQuestion) && state.a4.questions.some(Boolean)],
    ["Questions to Methodology", state.a4.questions.some(Boolean) && Boolean(state.methodology.selectedDesign)],
    ["Methodology to Instruments", Boolean(state.methodology.selectedDesign) && state.instrumentation.rows.some((row) => row.instrument)],
    ["Instruments to Analysis", state.instrumentation.rows.some((row) => row.validation) && Boolean(state.methodology.analysis)],
    ["Ethics to Participants", Boolean(state.methodology.participants) && Object.values(state.ethics.checks).some(Boolean)]
  ];
  const items = checks.map(([name, ok]) => ({
    level: ok ? "green" : "red",
    text: ok ? `${name}: aligned.` : `${name}: major alignment issue or missing detail.`
  }));
  const score = Math.round((checks.filter(([, ok]) => ok).length / checks.length) * 100);
  const label = score >= 80 ? "Ready" : score >= 50 ? "Needs Revision" : "Major Alignment Issue";
  return { score, label, items };
}

function stageCompletion(stageId) {
  const section = state[stageId] || {};
  if (stageId === "details") {
    const fields = ["studentName", "course", "section", "submissionDate", "initialReadiness"];
    return fields.filter((field) => state.submission[field]).length / fields.length;
  }
  if (stageId === "submission") {
    return ["confidence", "readinessChange"].filter((field) => state.submission[field]).length / 2;
  }
  if (stageId === "a1") {
    const fields = ["initialTopic", "majorNouns", "fifteenPageTest", "rrlMajorityTest", "coreConstruct"];
    return fields.filter((field) => state.a1[field]).length / fields.length;
  }
  if (stageId === "a2") {
    const patternProgress = Math.min(state.a2.patterns.filter((row) => row.notice && row.authors).length / 3, 1);
    return (patternProgress + (state.a2.synthesis ? 1 : 0)) / 2;
  }
  if (stageId === "a3") {
    const gapProgress = Math.min(state.a3.gaps.filter((row) => row.lessVisible && row.limits && row.gap).length / 1, 1);
    const selectionFields = ["strongestGap", "weakestGap", "selectionReason", "finalGap"];
    return (gapProgress + selectionFields.filter((field) => state.a3[field]).length / selectionFields.length) / 2;
  }
  if (stageId === "a4") {
    const fields = ["literatureProblem", "centralQuestion", "questionType", "studiedGroup", "rqConstructs"];
    return (fields.filter((field) => state.a4[field]).length / fields.length + Math.min(state.a4.questions.filter(Boolean).length / 3, 1)) / 2;
  }
  if (stageId === "instrumentation") {
    return state.instrumentation.rows.some((row) => row.rq && row.instrument) ? 1 : 0;
  }
  if (stageId === "readiness") return readinessReport().score / 100;
  const values = Object.values(section).filter((item) => typeof item === "string");
  return values.length ? values.filter(Boolean).length / values.length : 0;
}

function updateDashboard() {
  const completion = Math.round((stages.reduce((sum, stage) => sum + stageCompletion(stage.id), 0) / stages.length) * 100);
  const score = readinessReport().score;
  els.completionText.textContent = `${completion}%`;
  els.completionBar.style.width = `${completion}%`;
  els.alignmentScore.textContent = score;
  const issues = readinessReport().items.filter((item) => item.level !== "green").slice(0, 5);
  els.issueList.innerHTML = issues.length ? issues.map((item) => `<li>${escapeHtml(item.text)}</li>`).join("") : "<li>No major alignment issues detected.</li>";
}

function showFeedback() {
  const items = runChecks();
  els.feedback.innerHTML = items.map(feedbackHtml).join("");
  updateDashboard();
}

function wordCount(text = "") {
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

function instrumentationOutputHtml(rows) {
  const labels = [
    ["rq", "Research Question"],
    ["instrument", "Instrument"],
    ["description", "Description"],
    ["purpose", "Purpose"],
    ["validation", "Validation"],
    ["implementation", "Implementation"]
  ];
  rows = rows.map(normalizeInstrumentRow);
  const shouldStack = rows.some((row) => wordCount(Object.values(row).join(" ")) > 150);
  if (shouldStack) {
    return `<div class="instrument-cards">${rows.map((row, index) => `
      <section class="instrument-card">
        <h3>Instrument Row ${index + 1}</h3>
        ${labels.map(([key, label]) => `<p><strong>${label}:</strong> ${escapeHtml(row[key])}</p>`).join("")}
      </section>
    `).join("")}</div>`;
  }
  const instrumentRows = rows.map((row) => `<tr><td>${escapeHtml(row.rq)}</td><td>${escapeHtml(row.instrument)}</td><td>${escapeHtml(row.description)}</td><td>${escapeHtml(row.purpose)}</td><td>${escapeHtml(row.validation)}</td><td>${escapeHtml(row.implementation)}</td></tr>`).join("");
  return `<table><thead><tr><th>Research Question</th><th>Instrument</th><th>Description</th><th>Purpose</th><th>Validation</th><th>Implementation</th></tr></thead><tbody>${instrumentRows}</tbody></table>`;
}

function readinessPrintSummaryHtml(report) {
  const warnings = report.items.filter((item) => item.level !== "green");
  const methodologyReady = Boolean(state.methodology.selectedDesign && state.methodology.participants && state.methodology.collection && state.methodology.analysis);
  const ethicsReady = Boolean(state.methodology.participants && Object.values(state.ethics.checks).some(Boolean));
  const instrumentsReady = state.instrumentation.rows.map(normalizeInstrumentRow).some((row) => row.rq && row.instrument && row.description && row.purpose && row.validation && row.implementation);
  const statusRows = [
    ["Readiness score", `${report.score}/100 - ${report.label}`],
    ["Alignment status", report.score >= 80 ? "Ready for adviser review" : report.score >= 50 ? "Needs revision before submission" : "Major alignment issues remain"],
    ["Methodology status", methodologyReady ? "Methodology has the required core details." : "Methodology is missing design, participants, data gathering, or data analysis details."],
    ["Ethics status", ethicsReady ? "Ethics safeguards have been started." : "Ethics safeguards need more detail before data gathering."],
    ["Formatting status", "Letter-size print layout with 1-inch margins is applied."],
    ["Instrumentation status", instrumentsReady ? "At least one instrument row includes alignment and validation details." : "Instrumentation needs clearer alignment or validation details."]
  ];
  return `
    <div class="readiness-summary">
      ${statusRows.map(([label, text]) => `<p><strong>${label}:</strong> ${escapeHtml(text)}</p>`).join("")}
    </div>
    <h3>Warnings</h3>
    ${warnings.length ? `<ul class="warning-list">${warnings.map((item) => `<li>${escapeHtml(item.text)}</li>`).join("")}</ul>` : "<p>No major warnings detected.</p>"}
  `;
}

function outlineHtml() {
  const majorHeadings = new Set([
    "Chapter 1: The Problem and Its Scope",
    "Introduction",
    "Statement of the Problem",
    "Methodology",
    "Definition of Terms",
    "Appendices"
  ]);
  const subsectionHeadings = new Set([
    "Rationale",
    "Background of the Study",
    "General Statement",
    "Specific Statements in Question Form",
    "Hypothesis/Assumptions",
    "Significance",
    "Design",
    "Scope and Limitations/Delimitations",
    "Participants",
    "Locale",
    "Instrumentation",
    "Data Procedure",
    "Operational Definition of Key Terms"
  ]);
  return buildOutline().split("\n").map((line) => {
    const text = line.trim();
    if (!text) return "";
    if (majorHeadings.has(text)) {
      return `<h3>${escapeHtml(text)}</h3>`;
    }
    if (text.startsWith("- ") && subsectionHeadings.has(text.slice(2))) {
      return `<h4>${escapeHtml(text.slice(2))}</h4>`;
    }
    return `<p>${escapeHtml(text.replace(/^- /, ""))}</p>`;
  }).join("");
}

function buildSubmissionHtml() {
  const report = readinessReport();
  const generatedAt = new Date();
  const printedBy = value("submission.studentName") || "__________";
  const startedAt = formatTimestamp(state.startedAt);
  const workDuration = formatDuration(state.startedAt, generatedAt);
  const patternRows = state.a2.patterns.map((row) => `<tr><td>${escapeHtml(row.type)}</td><td>${escapeHtml(row.notice)}</td><td>${escapeHtml(row.authors)}</td><td>${escapeHtml(row.years)}</td></tr>`).join("");
  const gapRows = state.a3.gaps.map((row) => `<tr><td>${escapeHtml(row.type)}</td><td>${escapeHtml(row.show)}</td><td>${escapeHtml(row.emphasized)}</td><td>${escapeHtml(row.lessVisible)}</td><td>${escapeHtml(row.limits)}</td><td>${escapeHtml(row.gap)}</td></tr>`).join("");
  const instrumentOutput = instrumentationOutputHtml(state.instrumentation.rows);
  return `
    <h1>Lit-Based Proposal Builder</h1>
    <p><strong>Student Name:</strong> ${escapeHtml(value("submission.studentName"))}<br>
    <strong>Course:</strong> ${escapeHtml(value("submission.course"))}<br>
    <strong>Section:</strong> ${escapeHtml(value("submission.section"))}<br>
    <strong>Date:</strong> ${escapeHtml(value("submission.submissionDate"))}</p>
    <h2>Readiness Reflections</h2>
    <h3>Initial Readiness Reflection</h3>
    <p>${escapeHtml(value("submission.initialReadiness"))}</p>
    <h3>Final Readiness Reflection</h3>
    <p>${escapeHtml(value("submission.confidence"))}</p>
    <h3>What Changed and Why</h3>
    <p>${escapeHtml(value("submission.readinessChange"))}</p>
    <h2>A1 Core Construct</h2>
    <p>${escapeHtml(buildTopic())}</p>
    <h2 class="major-section">A2 Literature Pattern Mapping</h2>
    <table><thead><tr><th>Pattern Type</th><th>What appears across studies</th><th>Supporting Authors</th><th>Year</th></tr></thead><tbody>${patternRows}</tbody></table>
    <h2 class="major-section">A3 Literature Gap</h2>
    <table><thead><tr><th>Pattern Type</th><th>Studies Repeatedly Show</th><th>Emphasized</th><th>Less Visible</th><th>Limits Understanding Of</th><th>Refined Gap</th></tr></thead><tbody>${gapRows}</tbody></table>
    <p><strong>Final gap:</strong> ${escapeHtml(value("a3.finalGap"))}</p>
    <h2 class="major-section">A4 Literature-Based Problem</h2>
    <p>${escapeHtml(buildProblem())}</p>
    <p><strong>Central research question:</strong> ${escapeHtml(value("a4.centralQuestion"))}</p>
    <h2>Specific Research Questions</h2>
    <ol>${state.a4.questions.filter(Boolean).map((q) => `<li>${escapeHtml(q)}</li>`).join("")}</ol>
    <h2 class="major-section">Methodology</h2>
    <p><strong>Research Design:</strong> ${escapeHtml(value("methodology.selectedDesign"))}</p>
    <p><strong>Scope and Limitations/Delimitations:</strong> This study is bounded by the selected participants, locale, constructs, instruments, and data procedures described below.</p>
    <p><strong>Participants:</strong> ${escapeHtml(value("methodology.participants"))}</p>
    <p><strong>Sampling:</strong> ${escapeHtml(value("methodology.sampling"))}</p>
    <p><strong>Locale:</strong> ${escapeHtml(value("methodology.locale"))}</p>
    <h2 class="major-section">Instrumentation</h2>
    <p>Each instrument should include its description, purpose, validation, and implementation.</p>
    ${instrumentOutput}
    <h2>Data Procedure</h2>
    <p><strong>Data Gathering:</strong> ${escapeHtml(value("methodology.collection"))}</p>
    <p><strong>Data Analysis:</strong> ${escapeHtml(value("methodology.analysis"))}</p>
    <h2 class="major-section">Ethical Considerations</h2>
    <p>${escapeHtml(value("ethics.draft") || buildEthicsDraft())}</p>
    <h2>Definition of Terms</h2>
    <p>Define the core construct and key terms as used in this study. Operational definitions may be based on indicators, instruments, participant context, procedures, or how each construct will be measured or observed.</p>
    <h2>Chapter 1 Template Alignment</h2>
    <div class="chapter-template">${outlineHtml()}</div>
    <h2 class="major-section">Proposal Readiness Report</h2>
    ${readinessPrintSummaryHtml(report)}
    <footer><p>Generated by Lit-Based Proposal Builder<br>
    Printed by ${escapeHtml(printedBy)} on ${escapeHtml(formatTimestamp(generatedAt))}.<br>
    Started work on ${escapeHtml(startedAt)}.<br>
    Duration of work: ${escapeHtml(workDuration)}.</p></footer>
  `;
}

function previewSubmission() {
  els.submissionPreview.innerHTML = buildSubmissionHtml();
  els.previewDialog.showModal();
}

function printSubmission() {
  const printTarget = document.getElementById("printSubmission");
  printTarget.innerHTML = buildSubmissionHtml();
  document.body.classList.add("printing-submission");
  window.print();
  window.setTimeout(() => {
    document.body.classList.remove("printing-submission");
    printTarget.innerHTML = "";
  }, 500);
}

function syncStudentDetailsFields() {
  ["studentName", "course", "section", "submissionDate", "initialReadiness"].forEach((key) => {
    const field = document.getElementById(`details-${key}`);
    if (field) field.value = value(`submission.${key}`);
  });
}

function openStudentDetails() {
  syncStudentDetailsFields();
  document.getElementById("studentDetailsDialog").showModal();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "proposal-builder-a4-draft.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function extractUploadFile(file) {
  if (file.name.toLowerCase().endsWith(".docx")) {
    const ZipReader = getZipReader();
    if (!ZipReader) {
      throw new Error("The DOCX reader is still loading. Please try again in a few seconds.");
    }
    const arrayBuffer = await file.arrayBuffer();
    return extractDocxText(arrayBuffer, ZipReader);
  }
  if (file.name.toLowerCase().endsWith(".pdf")) {
    return extractPdfText(await file.arrayBuffer());
  }
  return file.text();
}

async function getPdfJs() {
  if (!pdfjsModule) {
    pdfjsModule = await import("./pdf.min.mjs");
    pdfjsModule.GlobalWorkerOptions.workerSrc = "./pdf.worker.min.mjs";
  }
  return pdfjsModule;
}

async function extractPdfText(arrayBuffer) {
  const pdfjs = await getPdfJs();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str || "").join(" "));
  }
  return pages.join("\n");
}

function getZipReader() {
  if (typeof globalThis !== "undefined" && globalThis.JSZip) return globalThis.JSZip;
  if (typeof window !== "undefined" && window.JSZip) return window.JSZip;
  if (typeof JSZip !== "undefined") return JSZip;
  return null;
}

async function extractDocxText(arrayBuffer, ZipReader) {
  const zip = await ZipReader.loadAsync(arrayBuffer);
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) throw new Error("This DOCX file does not contain readable document text.");
  const xmlText = await documentFile.async("text");
  const xml = new DOMParser().parseFromString(xmlText, "application/xml");
  const body = Array.from(xml.getElementsByTagNameNS("*", "body"))[0];
  if (!body) return extractTextFromNode(xml).join("\n");
  const blocks = [];
  Array.from(body.childNodes).forEach((node) => {
    if (node.nodeType !== 1) return;
    if (node.localName === "p") {
      const line = extractTextFromNode(node).join("").trim();
      if (line) blocks.push(line);
    }
    if (node.localName === "tbl") {
      Array.from(node.getElementsByTagNameNS("*", "tr")).forEach((row) => {
        const cells = Array.from(row.getElementsByTagNameNS("*", "tc")).map((cell) => extractTextFromNode(cell).join(" ").replace(/\s+/g, " ").trim());
        if (cells.some(Boolean)) blocks.push(cells.join(" | "));
      });
    }
  });
  return blocks.join("\n");
}

function extractTextFromNode(node) {
  return Array.from(node.getElementsByTagNameNS("*", "t")).map((item) => item.textContent || "");
}

function detectFormType(fileName, text) {
  const joined = `${fileName}\n${text}`.toLowerCase();
  if (joined.includes("a1") || joined.includes("core construct")) return "a1";
  if (joined.includes("a2") || joined.includes("pattern mapping")) return "a2";
  if (joined.includes("a3") || joined.includes("patterns to gaps") || joined.includes("gap statement")) return "a3";
  return "unknown";
}

function compactLines(text) {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function afterLabel(text, labels) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`${escaped}\\s*[:\\-]?\\s*([^\\n]+)`, "i"));
    if (match && match[1]) return match[1].trim();
  }
  return "";
}

function parseA1Upload(text) {
  const lines = compactLines(text);
  const topic = afterLabel(text, ["Topic", "Write your topic"]) || lines.find((line) => /topic/i.test(line) && line.length < 160) || "";
  const declaration = afterLabel(text, ["My study is about", "This study is about", "Final Declaration"]);
  const nounLine = afterLabel(text, ["List all major nouns below", "major nouns", "nouns"]);
  const fifteen = afterLabel(text, ["15-page test", "15 Page Test", "could I"]);
  const majority = afterLabel(text, ["If I review 15 journal articles, most of them will primarily define", "RRL Majority Test"]);
  return {
    initialTopic: cleanExtract(topic),
    majorNouns: cleanExtract(nounLine),
    fifteenPageTest: cleanExtract(fifteen),
    rrlMajorityTest: cleanExtract(majority || declaration),
    coreConstruct: cleanExtract(declaration || majority)
  };
}

function parseA2Upload(text) {
  const lines = compactLines(text);
  const patternTypes = ["Context", "Method", "Theory", "Evidence", "Practice", "Population", "Definition"];
  const patterns = [];
  for (const type of patternTypes) {
    const line = lines.find((item) => item.toLowerCase().startsWith(type.toLowerCase()) && item.length > type.length + 8);
    if (line) {
      const parts = line.split(/\t|\s{2,}|\|/).map((part) => part.trim()).filter(Boolean);
      patterns.push({
        type,
        notice: cleanExtract(parts[1] || line.replace(new RegExp(`^${type}`, "i"), "")),
        authors: cleanExtract(parts[2] || ""),
        years: cleanExtract(parts[3] || "")
      });
    }
  }
  const synthesisIndex = lines.findIndex((line) => /short synthesis/i.test(line));
  const synthesis = synthesisIndex >= 0 ? lines.slice(synthesisIndex + 1, synthesisIndex + 8).join(" ") : "";
  return { patterns: patterns.length ? patterns : clone(defaultData.a2.patterns), synthesis: cleanExtract(synthesis) };
}

function parseA3Upload(text) {
  const lines = compactLines(text);
  const patternTypes = ["Context", "Method", "Theory", "Evidence", "Practice", "Population", "Definition"];
  const gaps = [];
  for (const type of patternTypes) {
    const line = lines.find((item) => item.toLowerCase().startsWith(type.toLowerCase()) && /limited|less visible|understanding|because studies/i.test(item));
    if (line) {
      const parts = line.split(/\t|\s{2,}|\|/).map((part) => part.trim()).filter(Boolean);
      gaps.push({
        type,
        show: cleanExtract(parts[1] || ""),
        emphasized: cleanExtract(parts[2] || ""),
        lessVisible: cleanExtract(parts[3] || ""),
        limits: cleanExtract(parts[4] || ""),
        gap: cleanExtract(parts[5] || line)
      });
    }
  }
  const finalGap = afterLabel(text, ["Final Gap", "Write your selected strongest gap clearly", "Gap statement based on A3 matrix"]) || lines.find((line) => /limited understanding|limited clarity/i.test(line)) || "";
  return {
    gaps: gaps.length ? gaps : clone(defaultData.a3.gaps),
    strongestGap: cleanExtract(afterLabel(text, ["Strongest gap"])),
    weakestGap: cleanExtract(afterLabel(text, ["Weakest gap"])),
    selectionReason: cleanExtract(afterLabel(text, ["Reason"])),
    finalGap: cleanExtract(finalGap)
  };
}

function cleanExtract(text) {
  return String(text || "")
    .replace(/_{3,}/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[|:\-\s]+/, "")
    .trim();
}

function mergeUploadStage(target, stageId, extractedStageData) {
  const merged = clone(target);
  if (stageId === "a1" && extractedStageData) {
    merged.a1 = { ...merged.a1, ...nonEmptyObject(extractedStageData) };
  }
  if (stageId === "a2" && extractedStageData) {
    merged.a2 = { ...merged.a2, ...nonEmptyObject({ synthesis: extractedStageData.synthesis }) };
    if (extractedStageData.patterns?.some((row) => row.notice || row.authors || row.years)) merged.a2.patterns = extractedStageData.patterns;
  }
  if (stageId === "a3" && extractedStageData) {
    merged.a3 = { ...merged.a3, ...nonEmptyObject(extractedStageData) };
    if (extractedStageData.gaps?.some((row) => row.gap || row.lessVisible || row.limits)) merged.a3.gaps = extractedStageData.gaps;
  }
  return normalizeState(merged);
}

function nonEmptyObject(obj) {
  return Object.fromEntries(Object.entries(obj || {}).filter(([, item]) => {
    if (Array.isArray(item)) return item.length > 0;
    return Boolean(item);
  }));
}

function uploadPreviewHtml(extracted) {
  const cards = [];
  if (extracted.a1) cards.push(uploadCard("A1 Core Construct", extracted.a1));
  if (extracted.a2) cards.push(uploadCard("A2 Pattern Mapping", extracted.a2));
  if (extracted.a3) cards.push(uploadCard("A3 Gap Mapping", extracted.a3));
  return cards.length ? cards.join("") : `<div class="feedback-item yellow">No A1-A3 form could be detected. Try uploading the accomplished A1, A2, or A3 form, or use a text version.</div>`;
}

function uploadCard(title, data) {
  return `<div class="upload-card"><h3>${escapeHtml(title)}</h3><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre></div>`;
}

async function handleFormUpload(files) {
  const extracted = {};
  const messages = [];
  for (const file of files) {
    try {
      const text = await extractUploadFile(file);
      const type = detectFormType(file.name, text);
      if (type !== uploadTargetStage) {
        messages.push(`${file.name}: ${type === "unknown" ? "not recognized" : `${type.toUpperCase()} detected, but current target is ${uploadTargetStage.toUpperCase()}`}`);
        continue;
      }
      if (type === "a1") extracted.a1 = { ...(extracted.a1 || {}), ...parseA1Upload(text) };
      if (type === "a2") extracted.a2 = { ...(extracted.a2 || {}), ...parseA2Upload(text) };
      if (type === "a3") extracted.a3 = { ...(extracted.a3 || {}), ...parseA3Upload(text) };
      messages.push(`${file.name}: ${type.toUpperCase()} detected and ready for review`);
    } catch (error) {
      messages.push(`${file.name}: ${error.message}`);
    }
  }
  pendingUploadByStage[uploadTargetStage] = extracted[uploadTargetStage] || null;
  document.getElementById("uploadFeedback").innerHTML = `
    ${messages.map((message) => `<div class="feedback-item ${message.includes("not recognized") ? "yellow" : "green"}">${escapeHtml(message)}</div>`).join("")}
    ${uploadPreviewHtml({ [uploadTargetStage]: pendingUploadByStage[uploadTargetStage] })}
  `;
}

function openUploadDialog() {
  if (!uploadStageIds.includes(state.currentStage)) {
    alert("Upload is available only for A1, A2, and A3 accomplished forms. Go to A1, A2, or A3 first.");
    return;
  }
  const stageId = state.currentStage;
  uploadTargetStage = stageId;
  const stage = stages.find((item) => item.id === stageId);
  document.getElementById("uploadDialogTitle").textContent = `Upload ${stage.code} Accomplished Form`;
  document.getElementById("uploadDialogHint").textContent = `Upload the accomplished ${stage.code} form as DOCX, PDF, or text. The extracted entries will apply only to ${stage.code}: ${stage.title}.`;
  document.getElementById("applyUploadBtn").textContent = `Apply to ${stage.code}`;
  document.getElementById("formUploadFile").value = "";
  pendingUploadByStage[stageId] = null;
  document.getElementById("uploadFeedback").textContent = `No ${stage.code} file selected yet.`;
  document.getElementById("uploadDialog").showModal();
}

function attachEvents() {
  document.addEventListener("input", (event) => {
    const target = event.target;
    if (target.dataset.section && target.dataset.key) {
      setValue(target.dataset.section, target.dataset.key, target.value);
    }
    if (target.dataset.array === "a4.questions") {
      state.a4.questions[Number(target.dataset.index)] = target.value;
      saveState();
    }
    if (target.dataset.questionPurpose !== undefined) {
      state.a4.questionPurposes[Number(target.dataset.questionPurpose)] = target.value;
      saveState();
      renderStage();
    }
    if (target.dataset.table) {
      const collection = getTableRows(target.dataset.table);
      collection[Number(target.dataset.index)][target.dataset.key] = target.value;
      saveState();
    }
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.dataset.ethicsCheck) {
      state.ethics.checks[target.dataset.ethicsCheck] = target.checked;
      if (!state.ethics.draft) state.ethics.draft = buildEthicsDraft();
      saveState();
      renderStage();
    }
    if (target.dataset.section && target.dataset.key) {
      setValue(target.dataset.section, target.dataset.key, target.value);
      if (target.tagName === "SELECT") renderStage();
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target.closest("button");
    if (!target) return;
    if (target.dataset.stage) {
      state.currentStage = target.dataset.stage;
      saveState();
      render();
    }
    if (target.dataset.addRow) {
      getTableRows(target.dataset.addRow).push(emptyRowFor(target.dataset.addRow));
      saveState();
      renderStage();
    }
    if (target.dataset.removeRow) {
      const [section, index] = target.dataset.removeRow.split(":");
      const rows = getTableRows(section);
      rows.splice(Number(index), 1);
      saveState();
      renderStage();
    }
    if (target.dataset.addQuestion !== undefined) {
      if (state.a4.questions.length < SRQ_LIMITS.maximum) {
        state.a4.questions.push("");
        state.a4.questionPurposes.push("");
      }
      saveState();
      renderStage();
    }
    if (target.dataset.removeQuestion !== undefined) {
      const index = Number(target.dataset.removeQuestion);
      state.a4.questions.splice(index, 1);
      state.a4.questionPurposes.splice(index, 1);
      saveState();
      renderStage();
    }
  });

  document.getElementById("backBtn").addEventListener("click", () => {
    const next = Math.max(0, currentIndex() - 1);
    state.currentStage = stages[next].id;
    saveState();
    render();
  });

  document.getElementById("nextBtn").addEventListener("click", () => {
    const next = Math.min(stages.length - 1, currentIndex() + 1);
    state.currentStage = stages[next].id;
    saveState();
    render();
  });

  document.getElementById("saveBtn").addEventListener("click", saveState);
  document.getElementById("checkBtn").addEventListener("click", showFeedback);
  document.getElementById("summaryBtn").addEventListener("click", previewSubmission);
  document.getElementById("previewBtn").addEventListener("click", previewSubmission);
  document.getElementById("studentDetailsBtn").addEventListener("click", openStudentDetails);
  document.getElementById("closeStudentDetailsBtn").addEventListener("click", () => document.getElementById("studentDetailsDialog").close());
  document.getElementById("closePreviewBtn").addEventListener("click", () => els.previewDialog.close());
  document.getElementById("printBtn").addEventListener("click", printSubmission);
  document.getElementById("pdfBtn").addEventListener("click", printSubmission);
  document.getElementById("exportBtn").addEventListener("click", exportJson);
  document.getElementById("importBtn").addEventListener("click", () => els.importFile.click());
  document.getElementById("uploadFormsBtn").addEventListener("click", openUploadDialog);
  document.getElementById("closeUploadBtn").addEventListener("click", () => document.getElementById("uploadDialog").close());
  document.getElementById("clearUploadBtn").addEventListener("click", () => {
    pendingUploadByStage[uploadTargetStage] = null;
    document.getElementById("formUploadFile").value = "";
    document.getElementById("uploadFeedback").textContent = `No ${uploadTargetStage.toUpperCase()} file selected yet.`;
  });
  document.getElementById("applyUploadBtn").addEventListener("click", () => {
    const pending = pendingUploadByStage[uploadTargetStage];
    if (!pending) {
      alert(`Upload and review an ${uploadTargetStage.toUpperCase()} form first.`);
      return;
    }
    state = mergeUploadStage(state, uploadTargetStage, pending);
    saveState();
    render();
    document.getElementById("uploadDialog").close();
  });
  document.getElementById("formUploadFile").addEventListener("change", (event) => {
    handleFormUpload(Array.from(event.target.files || []));
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm("Reset this draft? This clears saved work in this browser.")) {
      state = normalizeState(clone(defaultData));
      saveState();
      render();
    }
  });

  els.importFile.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      state = normalizeState({ ...clone(defaultData), ...JSON.parse(await file.text()) });
      saveState();
      render();
    } catch {
      alert("This JSON backup could not be imported.");
    }
  });
}

attachEvents();
render();
saveState();
setInterval(saveState, 30000);
