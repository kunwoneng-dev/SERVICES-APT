/* "수상한 곳 찾기 + 힌트 + 퀴즈" 형식 회차의 공통 동작. edu-bridge.js 다음에 불러온다.
 * 회차 페이지는 window.EDU_ROUND 에 데이터만 넣는다:
 *   { flags: {key: '해설 HTML'}, order: [key...], hints: {key: '힌트 이름'},
 *     quiz: [{ q, opts: [..], answer: 정답 index, fb: '해설' }] }
 * 필요한 요소: .flag[data-flag], #flagCounter, #quizCounter, #explain, #hintBtn, #hintText, #quiz, #doneBox */
(function () {
  var R = window.EDU_ROUND;
  var B = window.EduBridge;
  var found = {};
  var quizDone = 0;
  var TOTAL = R.order.length + R.quiz.length;

  function $(id) { return document.getElementById(id); }

  function report() {
    var nFound = Object.keys(found).length;
    $('flagCounter').textContent = nFound + ' / ' + R.order.length;
    $('quizCounter').textContent = quizDone + ' / ' + R.quiz.length;
    if (nFound + quizDone >= TOTAL) $('doneBox').classList.add('show');
    B.progress(nFound + quizDone, TOTAL);
  }

  function reveal(key) {
    if (found[key] || !R.flags[key]) return;
    found[key] = true;
    document.querySelectorAll('[data-flag="' + key + '"]').forEach(function (el) { el.classList.add('found'); });
    var div = document.createElement('div');
    div.className = 'ex';
    div.innerHTML = (R.order.indexOf(key) + 1) + '. ' + R.flags[key];
    $('explain').appendChild(div);
    report();
  }

  document.querySelectorAll('.flag').forEach(function (el) {
    el.addEventListener('click', function (e) { e.stopPropagation(); reveal(el.getAttribute('data-flag')); });
  });

  $('hintBtn').addEventListener('click', function () {
    var left = R.order.filter(function (k) { return !found[k]; });
    $('hintText').textContent = left.length
      ? '남은 곳: ' + left.map(function (k) { return R.hints[k]; }).join(', ')
      : '모두 찾았습니다!';
    B.resize();
  });

  var quizEl = $('quiz');
  R.quiz.forEach(function (item, qi) {
    var box = document.createElement('div');
    box.className = 'q';
    var qt = document.createElement('div');
    qt.className = 'qt';
    qt.textContent = 'Q' + (qi + 1) + '. ' + item.q;
    box.appendChild(qt);
    var btns = item.opts.map(function (txt, oi) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'opt'; b.textContent = txt;
      b.addEventListener('click', function () {
        if (box.classList.contains('answered')) return;
        if (oi === item.answer) {
          btns.forEach(function (x) { x.disabled = true; });
          b.classList.add('right');
          box.classList.add('answered');
          quizDone++;
          report();
        } else {
          b.classList.add('wrong'); b.disabled = true;
          B.resize();
        }
      });
      box.appendChild(b);
      return b;
    });
    var fb = document.createElement('div');
    fb.className = 'fb'; fb.textContent = item.fb;
    box.appendChild(fb);
    quizEl.appendChild(box);
  });

  report();
})();
