"use strict";
(() => {
  const KEYS = {
    tests: "bajee_jrf_ai_test_history_v1",
    retests: "bajee_revision_retest_history",
    aiPractice: "bajee_ai_practice_bank",
    vertical: "bajee_jrf_ai_vertical_slice_performance_v2"
  };
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  function read(key) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
    catch (error) { console.warn("JRF Intelligence Core: unable to read", key, error); return null; }
  }
  function collection(value, keys = []) {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object") return [];
    for (const key of keys) if (Array.isArray(value[key])) return value[key];
    return [];
  }
  function getQuestionId(item) { return String(item?.question_id ?? item?.questionId ?? item?.pyq_id ?? item?.id ?? "").trim(); }
  function getResults(session) {
    return collection(session?.question_results, ["question_results","results","answers","attempts","questions"]);
  }
  function answered(item) {
    if (typeof item?.answered === "boolean") return item.answered;
    return item?.selected !== undefined && item?.selected !== null && item?.selected !== "";
  }
  function correct(item) {
    if (typeof item?.is_correct === "boolean") return item.is_correct;
    if (typeof item?.isCorrect === "boolean") return item.isCorrect;
    return null;
  }
  async function loadPyqs() {
    const response = await fetch("data/pyqs/pyq-database.json", {cache:"no-store"});
    if (!response.ok) throw new Error(`PYQ database returned HTTP ${response.status}`);
    const data = await response.json();
    return collection(data, ["questions"]);
  }
  async function loadMap() {
    try {
      const response = await fetch("data/pyqs/pyq-knowledge-map.json", {cache:"no-store"});
      if (!response.ok) return [];
      const data = await response.json();
      return collection(data, ["mappings"]);
    } catch (_) { return []; }
  }
  function mappingIsVerified(mapping) { return mapping?.verified === true; }
  function verifiedEntityLink(questionId, mappings) {
    const found = mappings.filter(m => mappingIsVerified(m) && String(m?.question_id ?? m?.pyq_id ?? m?.questionId ?? "") === questionId);
    return found.map(m => m.knowledge_entity_id ?? m.entity_id ?? m.knowledge_entity).filter(Boolean);
  }
  function topicFor(item, pyqById, mappings) {
    const id = getQuestionId(item);
    const source = pyqById.get(id);
    const unit = String(item?.unit ?? source?.unit ?? source?.unit_name ?? "").trim();
    const topic = String(item?.topic ?? source?.topic ?? source?.subtopic ?? "").trim();
    return {id, unit, topic, entityLinks: verifiedEntityLink(id, mappings)};
  }
  function analyseTestHistory(history, pyqById, mappings) {
    const topics = new Map(); let totalResults = 0, answeredResults = 0, correctResults = 0, wrongResults = 0;
    history.forEach(session => {
      getResults(session).forEach(item => {
        totalResults++;
        if (!answered(item)) return;
        answeredResults++;
        const isCorrect = correct(item);
        if (isCorrect === true) correctResults++;
        if (isCorrect === false) wrongResults++;
        const meta = topicFor(item, pyqById, mappings);
        if (!meta.unit && !meta.topic) return;
        const label = [meta.unit || "Unit not recorded", meta.topic || "Topic not recorded"].join(" — ");
        if (!topics.has(label)) topics.set(label, {label, unit:meta.unit, topic:meta.topic, attempts:0, correct:0, wrong:0, unknown:0, ids:new Set(), entityLinks:new Set()});
        const row = topics.get(label); row.attempts++; row.ids.add(meta.id || "");
        if (isCorrect === true) row.correct++;
        else if (isCorrect === false) row.wrong++;
        else row.unknown++;
        meta.entityLinks.forEach(id => row.entityLinks.add(String(id)));
      });
    });
    const ranked = [...topics.values()].filter(t => t.attempts > 0).map(t => ({...t, accuracyKnown:t.correct+t.wrong, accuracy:t.correct+t.wrong ? Math.round(t.correct/(t.correct+t.wrong)*100) : null, ids:[...t.ids].filter(Boolean), entityLinks:[...t.entityLinks]}));
    ranked.sort((a,b) => (b.wrong-a.wrong) || ((a.accuracy ?? 101)-(b.accuracy ?? 101)) || (b.attempts-a.attempts));
    return {topics:ranked,totalResults,answeredResults,correctResults,wrongResults};
  }
  function countAIPractice(value) {
    if (Array.isArray(value)) return value.length;
    if (!value || typeof value !== "object") return 0;
    for (const key of ["attempts","records","history","questions","items"]) if (Array.isArray(value[key])) return value[key].length;
    return 0;
  }
  function renderTopics(topics) {
    const host = $("weakTopics");
    if (!topics.length) { host.className="empty"; host.textContent="No topic-level performance can be derived yet. Complete a test whose saved results contain question IDs and correct/incorrect states."; return; }
    host.className="";
    host.innerHTML = `<table><thead><tr><th>Unit / Topic</th><th>Attempts</th><th>Wrong</th><th>Accuracy (known answers)</th><th>Verified entity links</th></tr></thead><tbody>${topics.slice(0,8).map(t=>`<tr><td>${esc(t.label)}</td><td>${t.attempts}</td><td>${t.wrong}</td><td>${t.accuracy===null?"Insufficient answer-key evidence":`${t.accuracy}%`}</td><td>${t.entityLinks.length ? t.entityLinks.map(esc).join(", ") : "NOT YET MAPPED"}</td></tr>`).join("")}</tbody></table>`;
  }
  function render() {
    const testsRaw = read(KEYS.tests); const tests = collection(testsRaw, ["history","tests","records"]);
    const retestsRaw = read(KEYS.retests); const retests = collection(retestsRaw, ["history","retests","records"]);
    const aiRaw = read(KEYS.aiPractice);
    $("tests").textContent = tests.length;
    $("retests").textContent = retests.length;
    $("aiPractice").textContent = aiRaw === null || aiRaw === undefined ? "0" : countAIPractice(aiRaw);
    return {tests,retests,aiRaw};
  }
  async function init() {
    const streams = render();
    try {
      const [pyqs,mappings] = await Promise.all([loadPyqs(),loadMap()]);
      const pyqById = new Map(pyqs.map(q=>[String(q?.id ?? q?.question_id ?? ""),q]));
      const analysis = analyseTestHistory(streams.tests, pyqById, mappings);
      $("attempts").textContent = analysis.totalResults;
      renderTopics(analysis.topics);
      const top = analysis.topics.find(t=>t.wrong>0);
      if (top) {
        $("actionTitle").textContent = `Revise ${top.topic || top.unit || "the highest-error topic"}`;
        $("actionReason").textContent = `Saved test records show ${top.wrong} incorrect answer(s) across ${top.attempts} recorded attempt(s) for ${top.label}. ${top.entityLinks.length ? "Verified entity links exist in the mapping data." : "No verified entity mapping is available for this topic, so the recommendation stays at unit/topic level."}`;
        $("actionLinks").innerHTML = `<a class="btn" href="revision-intelligence.html">Open Revision Intelligence</a><a class="btn secondary" href="test-engine.html">Practice Test</a>`;
      } else if (streams.retests.length) {
        $("actionTitle").textContent = "Review your latest revision retest";
        $("actionReason").textContent = "Retest records exist, but no topic with a recorded incorrect answer was safely identified from the saved test history. Review the retest stream without combining it with test scores.";
        $("actionLinks").innerHTML = `<a class="btn" href="revision-retest.html">Open Revision Retest</a><a class="btn secondary" href="revision-intelligence.html">Open Revision Intelligence</a>`;
      } else if (streams.tests.length) {
        $("actionTitle").textContent = "Continue with a short mixed practice test";
        $("actionReason").textContent = "Saved test sessions exist, but the available records do not establish a specific weak topic. A new test can collect clearer evidence; no weakness is guessed.";
        $("actionLinks").innerHTML = `<a class="btn" href="test-engine.html">Start Practice Test</a>`;
      } else {
        $("actionTitle").textContent = "Complete a short diagnostic test";
        $("actionReason").textContent = "No saved test sessions were found in this browser's expected test-history key. Start a test so future recommendations can use actual performance evidence.";
        $("actionLinks").innerHTML = `<a class="btn" href="test-engine.html">Start Diagnostic Test</a>`;
      }
      $("status").innerHTML = `<span class="ok">Loaded ${pyqs.length} PYQ records.</span> ${mappings.filter(mappingIsVerified).length} verified mapping record(s) available. Test, retest and AI-practice data remain separate.`;
      $("streams").innerHTML = `<table><thead><tr><th>Stream</th><th>Records</th><th>How used</th></tr></thead><tbody><tr><td>Saved test history</td><td>${streams.tests.length} session(s); ${analysis.totalResults} result item(s)</td><td>Unit/topic error analysis when question ID and answer state exist</td></tr><tr><td>Revision retest history</td><td>${streams.retests.length} session(s)</td><td>Counted separately; not merged into test accuracy</td></tr><tr><td>AI practice bank</td><td>${streams.aiRaw === null || streams.aiRaw === undefined ? "No saved bank found" : countAIPractice(streams.aiRaw)}</td><td>Counts saved practice-bank items only; not treated as completed attempts or scores</td></tr></tbody></table>`;
      $("evidence").innerHTML = `<ul><li>PYQ metadata loaded: ${pyqs.length} question records.</li><li>Saved test sessions read: ${streams.tests.length}.</li><li>Recorded question-result items: ${analysis.totalResults}; answered items: ${analysis.answeredResults}; explicitly correct: ${analysis.correctResults}; explicitly wrong: ${analysis.wrongResults}.</li><li>Verified mapping records: ${mappings.filter(mappingIsVerified).length}. Unverified mappings are not treated as fact.</li><li>Unknown or missing answers are excluded from accuracy rather than converted into wrong answers.</li></ul>`;
    } catch (error) {
      $("attempts").textContent = "—";
      $("status").innerHTML = `<span class="bad">Could not complete evidence analysis: ${esc(error.message)}</span>`;
      $("weakTopics").textContent = "Analysis unavailable because the PYQ database could not be loaded. No recommendation was fabricated.";
      $("actionTitle").textContent = "Evidence analysis unavailable";
      $("actionReason").textContent = "Check that the page is served from the project's frontend folder and the local JSON paths are reachable.";
      $("evidence").textContent = "The analysis did not finish. Check the browser console and local server path.";
    }
  }
  init();
})();
