/* ===== Horizontal Nav (menu → screens) ===== */
const navItems = document.querySelectorAll(".top-nav-menu li");
const track = document.getElementById("screens");
const screens = Array.from(track.children);
const indexById = Object.fromEntries(screens.map((sec, i) => [sec.id, i]));
let current = 0;


const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.top-nav-menu');

function closeMenu() {
    navMenu.classList.remove('open');
    navToggle.classList.remove('open');
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('open');
      navToggle.classList.toggle('open');
    });

    // 메뉴 안을 클릭할 때는 바깥 클릭으로 취급 안 되게
    navMenu.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // 문서 아무 곳이나 클릭하면 메뉴 닫기
    document.addEventListener('click', () => {
      if (navMenu.classList.contains('open')) {
        closeMenu();
      }
    });

    // 화면 리사이즈 시(예: 가로로 눕혔다가 다시 세로), 넓어지면 메뉴 강제 닫기
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        closeMenu();
      }
    });
  }

function setActiveScreen(id) {
  screens.forEach(sec => {
    const active = sec.id === id;
    sec.classList.toggle("active", active);
  });
}

/* 메뉴 클릭 등으로 페이지 이동 */
function goTo(id, opts = { updateHash: true }) {
  const idx = indexById[id];
  if (idx == null) return;

  current = idx;

  // 화면 전환
  setActiveScreen(id);

  // 메뉴 active 처리
  navItems.forEach(n =>
    n.classList.toggle("active", n.getAttribute("data-target") === id)
  );

  // 주소창 해시 업데이트
  if (opts.updateHash) {
    history.replaceState(null, "", `#${id}`);
  }

  // 페이지 이동할 때 항상 맨 위로
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "auto",
  });
}

/* 처음 로드 시: 해시 보고 이동 or home */
(function initFromHash() {
  const hash = window.location.hash.replace("#", "");
  if (hash && indexById[hash] != null) {
    goTo(hash, { updateHash: false });
  } else {
    goTo("home", { updateHash: false });
  }
})();

/* 상단 메뉴 클릭 */
navItems.forEach(item => {
  item.addEventListener("click", () =>
    goTo(item.getAttribute("data-target"))
  );
});

/* 로고 클릭 → home */
const logo = document.querySelector(".logo");
if (logo) {
  logo.addEventListener("click", (e) => {
    e.preventDefault();
    goTo("home");
  });
}

/* 주소창 해시로 이동 */
window.addEventListener("hashchange", () => {
  const hash = window.location.hash.replace("#", "");
  if (hash && indexById[hash] != null) {
    goTo(hash, { updateHash: false });
  }
});

/* Touch swipe between screens (좌우 스와이프로 페이지 전환만) */
let sx = 0, dx = 0, touching = false;
track.addEventListener('touchstart', e => {
  touching = true;
  sx = e.touches[0].clientX;
  dx = 0;
}, { passive: true });

track.addEventListener('touchmove', e => {
  if (touching) dx = e.touches[0].clientX - sx;
}, { passive: true });

track.addEventListener('touchend', () => {
  if (!touching) return;
  touching = false;
  if (Math.abs(dx) > 60) {
    if (dx < 0 && current < screens.length - 1) {
      goTo(screens[current + 1].id);
    } else if (dx > 0 && current > 0) {
      goTo(screens[current - 1].id);
    }
  }
});


/* Sub-tabs */
const subTabs = document.querySelectorAll(".sub-tab");
const tabPanels = {
  explain: document.getElementById("tab-explain"),
  history: document.getElementById("tab-history"),
  visit: document.getElementById("tab-visit"),
};

subTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const key = tab.getAttribute("data-tab");
    subTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    Object.keys(tabPanels).forEach(k => {
      tabPanels[k].classList.toggle("active", k === key);
    });
  });
});


/* ===== Collection Detail Page + 뒤로가기 연동 ===== */
const collectionSection = document.getElementById("collection");

if (collectionSection) {
  const detailBox = document.getElementById("collection-detail");
  const detailClose = document.getElementById("detail-close");

  // 목록 영역들
  const collectionSearch = collectionSection.querySelector(".collection-search");
  const collectionGrid = collectionSection.querySelector(".collection-grid");
  const pagination = collectionSection.querySelector(".pagination");

  // 상세 영역 내부 요소 (#collection-detail 안)
  const detailTitle = detailBox.querySelector(".detail-info-title");
  const detailMeta = detailBox.querySelector(".detail-meta");
  const detailDesc = detailBox.querySelector(".detail-desc-box");

  // 처음엔 "목록 상태"를 기본 state로 심어두기
  function ensureCollectionBaseState() {
    if (!history.state || typeof history.state.collectionDetail === "undefined") {
      history.replaceState({ collectionDetail: false }, "");
    }
  }
  ensureCollectionBaseState();

  // 화면 토글 함수들
  function showCollectionList(scroll = true) {
    detailBox.style.display = "none";
    if (collectionSearch) collectionSearch.style.display = "";
    if (collectionGrid) collectionGrid.style.display = "";
    if (pagination) pagination.style.display = "";
  }

  function showCollectionDetail(scroll = true) {
    if (collectionSearch) collectionSearch.style.display = "none";
    if (collectionGrid) collectionGrid.style.display = "none";
    if (pagination) pagination.style.display = "none";
    detailBox.style.display = "block";
  }

  // 카드에서 상세 내용 채우기
  function fillDetailFromItem(it) {
    const tpl = it.querySelector(".detail-template");
    const nameEl = it.querySelector(".collection-name");

    if (tpl) {
      const tTitle = tpl.querySelector(".detail-title");
      const tMeta = tpl.querySelector(".detail-meta");
      const tDesc = tpl.querySelector(".detail-desc");

      if (tTitle) detailTitle.innerHTML = tTitle.innerHTML;
      else if (nameEl) detailTitle.textContent = nameEl.textContent.trim();

      detailMeta.innerHTML = tMeta ? tMeta.innerHTML : "";
      detailDesc.innerHTML = tDesc ? tDesc.innerHTML : "";
    } else {
      if (nameEl) detailTitle.textContent = nameEl.textcontent?.trim?.() || "";
      detailMeta.innerHTML = "";
      detailDesc.innerHTML = "";
    }
  }

  // 소장품 카드 클릭 → 상세 페이지로 전환 + history.pushState
  document.querySelectorAll(".collection-item").forEach(it => {
    it.addEventListener("click", () => {
      fillDetailFromItem(it);           
      showCollectionDetail(true);       
      history.pushState(             
        { collectionDetail: true },
        "",
        window.location.href         
      );

      // 상세로 들어갈 때도 맨 위로 올리고 싶으면 이 줄 유지
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  });

  // "목록" 버튼 → history.back()으로 뒤로가기와 동일하게 동작
  if (detailClose) {
    detailClose.addEventListener("click", () => {
      history.back();
    });
  }

  // 브라우저 뒤로가기 / 앞으로가기 버튼 눌렀을 때 처리
  window.addEventListener("popstate", (event) => {
    if (event.state && event.state.collectionDetail) {
       showCollectionDetail(false);
    } else {
       showCollectionList(false);
    }
  });
}


/* ===== Home Hero Slider ===== */
(function () {
  const hero = document.querySelector('.hero');
  const trackSlides = document.getElementById('slides');
  if (!hero || !trackSlides) return;

  const slides = Array.from(trackSlides.children);
  const dots = Array.from(hero.querySelectorAll('.dot'));
  slides.forEach((el, i) => { if (!el.id) el.id = `slide${i + 1}`; });
  dots.forEach((d, i) => { d.setAttribute('aria-controls', slides[i].id); });

  let index = 0;
  const DURATION = 6000;
  let timer = null;

  function setActiveDot(i) {
    dots.forEach((d, k) => {
      const active = k === i;
      d.classList.toggle('active', active);
      d.setAttribute('aria-selected', String(active));
      d.setAttribute('tabindex', active ? '0' : '-1');
    });
  }
  function go(to, opts = { animate: true }) {
    index = (to + slides.length) % slides.length;
    trackSlides.style.transition = opts.animate ? 'transform .6s ease' : 'none';
    trackSlides.style.transform = `translateX(-${index * 100}%)`;
    setActiveDot(index);
  }
  function play() { stop(); timer = setInterval(() => go(index + 1), DURATION); }
  function stop() { if (timer) clearInterval(timer); timer = null; }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => go(i));
    dot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        go(i);
      }
    });
  });
  hero.addEventListener('mouseenter', stop);
  hero.addEventListener('mouseleave', play);

  // touch swipe on hero
  let sx = 0, dx = 0, touching = false;
  hero.addEventListener('touchstart', e => { touching = true; sx = e.touches[0].clientX; dx = 0; stop(); }, { passive: true });
  hero.addEventListener('touchmove', e => { if (touching) dx = e.touches[0].clientX - sx; }, { passive: true });
  hero.addEventListener('touchend', () => {
    touching = false;
    if (Math.abs(dx) > 50) { dx < 0 ? go(index + 1) : go(index - 1); }
    play();
  });

  go(0, { animate: false });
  play();
})();
