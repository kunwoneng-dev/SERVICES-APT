/* warning.jsp(부모 창)와 주고받는 메시지 처리. 모든 회차 페이지가 사용한다.
 *  보냄: edu-ready, edu-progress {done,total}, edu-complete, edu-resize {height}
 *  받음: edu-user {name,email} — 페이지 안의 '홍길동' / 'honggildong@kunwoneng.com' 글자를 실제 값으로 바꾼다.
 *  v1 을 크게 바꿔야 하면 v2 폴더를 새로 만든다(지난 회차가 함께 바뀌지 않도록). */
(function () {
  var PLACEHOLDER_NAME = '홍길동';
  var PLACEHOLDER_EMAIL = 'honggildong@kunwoneng.com';
  // 수신자 정보는 회사 도메인(또는 로컬 테스트)에서 온 메시지만 받는다
  var TRUSTED_PARENT = /^https?:\/\/(([a-z0-9-]+\.)*kunwoneng\.com|localhost|127\.0\.0\.1)(:\d+)?$/i;

  var user = null;
  var completed = false;

  function post(data) {
    try { if (window.parent && window.parent !== window) window.parent.postMessage(data, '*'); } catch (e) {}
  }

  function resize() {
    post({ type: 'edu-resize', height: document.documentElement.scrollHeight });
  }

  function progress(done, total) {
    post({ type: 'edu-progress', done: done, total: total });
    if (total > 0 && done >= total && !completed) {
      completed = true;
      post({ type: 'edu-complete' });
    }
    resize();
  }

  function replaceIn(root) {
    if (!user || !root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var n, list = [];
    while ((n = walker.nextNode())) list.push(n);
    list.forEach(function (t) {
      var v = t.nodeValue, o = v;
      if (user.email) v = v.split(PLACEHOLDER_EMAIL).join(user.email);
      if (user.name) v = v.split(PLACEHOLDER_NAME).join(user.name);
      if (v !== o) t.nodeValue = v;
    });
  }

  window.addEventListener('message', function (ev) {
    if (!TRUSTED_PARENT.test(ev.origin)) return;
    var d = ev.data;
    if (!d || d.type !== 'edu-user') return;
    var name = typeof d.name === 'string' ? d.name.trim().slice(0, 40) : '';
    var email = typeof d.email === 'string' ? d.email.trim().slice(0, 120) : '';
    if (!name && !email) return;
    user = { name: name, email: email };
    replaceIn(document.body);
    resize();
  });

  // 해설 카드처럼 나중에 생기는 글자에도 적용
  if (window.MutationObserver) {
    new MutationObserver(function (muts) {
      if (!user) return;
      muts.forEach(function (m) { m.addedNodes.forEach(function (n) { replaceIn(n.nodeType === 3 ? n.parentNode : n); }); });
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  window.addEventListener('load', function () { post({ type: 'edu-ready' }); resize(); });
  if (window.ResizeObserver) new ResizeObserver(resize).observe(document.documentElement);
  else setInterval(resize, 1000);

  window.EduBridge = { progress: progress, resize: resize, post: post };
})();
