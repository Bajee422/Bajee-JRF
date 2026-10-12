const modules = [
  ["📘","UGC NET Syllabus","Complete Paper I + Paper II syllabus structure.","syllabus.html"],
  ["📘","Paper I","Teaching & Research Aptitude — 10-unit Paper I knowledge base.","paper1.html"],
  ["📕","Paper II — English","English literature, language, theory, criticism and related areas."],
  ["🧠","JRF Mentor","AI mentor for concepts, authors, theories and JRF-level explanations."],
  ["📚","PYQ Intelligence","Analyse previous-year questions, patterns, topics and concepts."],
  ["📖","Study Materials","Organise PDFs, notes, presentations and reference materials."],
  ["🎥","Video Learning","Connect topic-based video lessons with the JRF knowledge base."],
  ["🎧","Audio / MP3","Build audio revision capsules and listening-based learning."],
  ["📝","Smart Tests","Future adaptive quizzes, topic tests and full mock examinations."],
  ["🔗","Knowledge Graph","Connect authors, works, years, theories, concepts and critics."],
  ["🔄","Revision","Future personalised revision queue and spaced review."],
  ["📊","Analytics","Track accuracy, mastery, weak areas and preparation progress."],
  ["🔖","Bookmarks","Save useful questions, concepts, materials, videos and explanations."],
  ["📝","My Notes","Create personal notes linked to JRF topics and knowledge items."]
];

document.getElementById("moduleGrid").innerHTML = modules.map(([icon,title,desc,link]) => `
  <div class="col-12 col-sm-6 col-lg-4">
    <article class="module-card p-4">
      <div class="module-icon mb-3">${icon}</div>
      <h3>${title}</h3>
      <p>${desc}</p>
      ${link ? `<a class="module-link" href="${link}">Open module →</a>` : `<span class="module-link">Foundation module →</span>`}
    </article>
  </div>
`).join("");
