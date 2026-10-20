/* BAJEE JRF AI shared six-option bottom navigation.
   Additive only: preserves each page's existing content, routes and scripts. */
(function () {
  'use strict';
  if (document.getElementById('bajeeGlobalBottomNav')) return;

  var path = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var groups = {
    practice: ['test-engine.html','nta-exam.html','adaptive-selection.html','adaptive-test.html','ai-practice.html','ai-practice-bank.html','diagnosis.html','difficulty-progression.html','topic-concept-balancing.html','weakness-weighting.html','exam-history.html'],
    revise: ['vertical-slice.html','revision.html','revision-intelligence.html','revision-retest.html'],
    library: ['resource-library.html','master-storage.html','jrf-master-dictionary.html','knowledge-structure.html','knowledge-entity.html','knowledge-graph.html','knowledge-pyq.html','knowledge-resources.html','knowledge-analytics.html','pyq-database.html','pyq-knowledge-mapping.html','syllabus.html','paper1.html','paper2-knowledge-base.html','jrf-visual-memory.html'],
    workshop: ['workshop.html','youtube-generator.html','adaptive-recommendations.html','jrf-readiness.html','jrf-analytics.html','jrf-intelligence-core.html']
  };
  var active = 'home';
  Object.keys(groups).some(function (key) {
    if (groups[key].indexOf(path) !== -1) { active = key; return true; }
    return false;
  });

  var style = document.createElement('style');
  style.id = 'bajeeGlobalBottomNavStyles';
  style.textContent = `
    body { padding-bottom: calc(82px + env(safe-area-inset-bottom, 0px)) !important; }
    #bajeeGlobalBottomNav { position: fixed; left: 0; right: 0; bottom: 0; z-index: 900; display: flex; justify-content: space-around; align-items: stretch; gap: 2px; padding: 7px 6px calc(7px + env(safe-area-inset-bottom, 0px)); background: var(--card, #fff); color: var(--ink, #101d38); border-top: 1px solid var(--line, #dfe5ef); box-shadow: 0 -8px 24px rgba(16,29,56,.06); font-family: Inter, system-ui, sans-serif; }
    #bajeeGlobalBottomNav a { flex: 1 1 0; min-width: 0; max-width: 150px; min-height: 49px; padding: 5px 1px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; border: 0; border-radius: 10px; color: var(--muted, #59677f); text-decoration: none; font-size: 11px; line-height: 1.2; font-weight: 500; -webkit-tap-highlight-color: transparent; }
    #bajeeGlobalBottomNav a svg { width: 21px; height: 21px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
    #bajeeGlobalBottomNav a[aria-current="page"] { color: var(--ink, #101d38); background: var(--goldsoft, #fbf4e2); font-weight: 700; }
    #bajeeGlobalBottomNav a:focus-visible { outline: 3px solid var(--gold, #d4af55); outline-offset: 2px; }
    @media (max-width: 380px) { #bajeeGlobalBottomNav { padding-left: 2px; padding-right: 2px; gap: 0; } #bajeeGlobalBottomNav a { font-size: 10px; } #bajeeGlobalBottomNav a svg { width: 19px; height: 19px; } }
    @media (prefers-reduced-motion: reduce) { #bajeeGlobalBottomNav * { scroll-behavior: auto !important; transition: none !important; } }
  `;
  document.head.appendChild(style);

  var items = [
    { id: 'home', label: 'Home', href: 'index.html', icon: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>' },
    { id: 'practice', label: 'Practice', href: 'test-engine.html', icon: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>' },
    { id: 'revise', label: 'Revise', href: 'vertical-slice.html', icon: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>' },
    { id: 'ask', label: 'Ask AI', href: 'index.html?bajeeAction=ask', icon: '<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/>' },
    { id: 'library', label: 'Library', href: 'resource-library.html', icon: '<path d="M4 4h4v16H4zM10 4h4v16h-4z"/><path d="M16 6l4-1 3 14-4 1z"/>' },
    { id: 'workshop', label: 'Workshop', href: 'index.html?bajeeMode=work', icon: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.2-.5-.5-2.2z"/>' }
  ];
  var nav = document.createElement('nav');
  nav.id = 'bajeeGlobalBottomNav';
  nav.setAttribute('aria-label', 'Main navigation');
  items.forEach(function (item) {
    var a = document.createElement('a');
    a.href = item.href;
    if (item.id === active) a.setAttribute('aria-current', 'page');
    a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + item.icon + '</svg><span>' + item.label + '</span>';
    nav.appendChild(a);
  });
  document.body.appendChild(nav);
})();
