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

  navMenu.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.addEventListener('click', () => {
    if (navMenu.classList.contains('open')) {
      closeMenu();
    }
  });

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

function goTo(id, opts = { updateHash: true }) {
  const idx = indexById[id];
  if (idx == null) return;

  current = idx;

  setActiveScreen(id);

  navItems.forEach(n =>
    n.classList.toggle("active", n.getAttribute("data-target") === id)
  );

  if (id === "collection" && typeof window.__showCollectionListFromNav === "function") {
    window.__showCollectionListFromNav();
  }

  if (typeof window.__showCollectionListFromNav === "function") {
  if (typeof window.__stopDetailVideo === "function") {
    window.__stopDetailVideo();
  }
}

  if (opts.updateHash) {
    history.replaceState(null, "", `#${id}`);
  }

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "auto",
  });
}

(function initFromHash() {
  const hash = window.location.hash.replace("#", "");
  if (hash && indexById[hash] != null) {
    goTo(hash, { updateHash: false });
  } else {
    goTo("home", { updateHash: false });
  }
})();

navItems.forEach(item => {
  item.addEventListener("click", () =>
    goTo(item.getAttribute("data-target"))
  );
});

const logo = document.querySelector(".logo");
if (logo) {
  logo.addEventListener("click", (e) => {
    e.preventDefault();
    goTo("home");
  });
}

window.addEventListener("hashchange", () => {
  const hash = window.location.hash.replace("#", "");
  if (hash && indexById[hash] != null) {
    goTo(hash, { updateHash: false });
  }
});

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


/* ===== Collection Detail Page + 검색 + Pagination + 뒤로가기 연동 ===== */
const collectionSection = document.getElementById("collection");

if (collectionSection) {
  const detailBox = document.getElementById("collection-detail");
  const detailClose = document.getElementById("detail-close");

  const collectionSearch = collectionSection.querySelector(".collection-search");
  const searchForm = collectionSection.querySelector(".collection-search-form");
  const searchInput = searchForm ? searchForm.querySelector("input") : null;

  const collectionGrid = collectionSection.querySelector(".collection-grid");
  const pagination = collectionSection.querySelector(".pagination");

  const detailImg = detailBox.querySelector(".detail-thumb img");
  const detailTitle = detailBox.querySelector(".detail-info-title");
  const detailMeta = detailBox.querySelector(".detail-meta");
  const detailDesc = detailBox.querySelector(".detail-desc-box");
  const detailCurator = detailBox.querySelector(".curator");

  const allItems = Array.from(collectionGrid.querySelectorAll(".collection-item"));
  let filteredItems = allItems.slice();
  const itemsPerPage = 6;
  let currentCollectionPage = 1;

  const searchMsg = document.createElement("p");
  searchMsg.className = "collection-search-msg";
  searchMsg.style.fontSize = "14px";
  searchMsg.style.margin = "10px 0 0";
  searchMsg.style.display = "none";
  if (collectionSearch) {
    collectionSearch.appendChild(searchMsg);
  }

  function stopDetailVideo() {
    if (!detailCurator) return;
    const iframe = detailCurator.querySelector("iframe");
    if (iframe) {
      iframe.src = "";
    }
    detailCurator.innerHTML = "";
  }

  window.__stopDetailVideo = stopDetailVideo;

  function setSearchMessage(text) {
    if (!searchMsg) return;
    if (text) {
      searchMsg.textContent = text;
      searchMsg.style.display = "block";
    } else {
      searchMsg.textContent = "";
      searchMsg.style.display = "none";
    }
  }

  function rebuildPagination() {
    if (!pagination) return;

    const totalItems = filteredItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

    pagination.innerHTML = "";
    for (let i = 1; i <= totalPages; i++) {
      const span = document.createElement("span");
      span.textContent = i;
      if (i === 1) span.classList.add("active");
      pagination.appendChild(span);
    }
  }

  function showCollectionPage(page) {
    const totalItems = filteredItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    if (page < 1 || page > totalPages) return;

    currentCollectionPage = page;

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    const visibleSet = new Set(filteredItems.slice(start, end));

    allItems.forEach((item) => {
      item.style.display = visibleSet.has(item) ? "" : "none";
    });

    if (pagination) {
      Array.from(pagination.children).forEach((p, idx) => {
        p.classList.toggle("active", idx === page - 1);
      });
    }
  }

  function applySearch() {
    if (!searchInput) return;

    const q = searchInput.value.trim();
    if (!q) {
      filteredItems = allItems.slice();
      setSearchMessage("");
    } else {
      const lowerQ = q.toLowerCase();
      filteredItems = allItems.filter(it => {
        const nameEl = it.querySelector(".collection-name");
        const titleEl = it.querySelector(".detail-template .detail-title");
        const nameText = nameEl ? nameEl.textContent : "";
        const titleText = titleEl ? titleEl.textContent : "";
        const combined = (nameText + " " + titleText).toLowerCase();
        return combined.includes(lowerQ);
      });

      if (filteredItems.length === 0) {
        setSearchMessage("검색 결과가 없습니다.");
      } else {
        setSearchMessage("");
      }
    }

    currentCollectionPage = 1;
    rebuildPagination();
    showCollectionPage(1);
  }

  if (searchForm && searchInput) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      applySearch();
    });

    searchInput.addEventListener("input", () => {
      if (searchInput.value.trim() === "") {
        applySearch();
      }
    });
  }

  rebuildPagination();
  showCollectionPage(1);

  if (pagination) {
    pagination.addEventListener("click", (e) => {
      if (e.target.tagName === "SPAN") {
        const p = Number(e.target.textContent);
        if (!isNaN(p)) showCollectionPage(p);
      }
    });
  }

  function ensureCollectionBaseState() {
    if (!history.state || typeof history.state.collectionDetail === "undefined") {
      history.replaceState({ collectionDetail: false }, "");
    }
  }
  ensureCollectionBaseState();

  function showCollectionList(scroll = true) {
    detailBox.style.display = "none";
    if (collectionSearch) collectionSearch.style.display = "";
    if (collectionGrid) collectionGrid.style.display = "";
    if (pagination) pagination.style.display = "";

    showCollectionPage(currentCollectionPage);

    if (scroll) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }

  function showCollectionDetail(scroll = true) {
    if (collectionSearch) collectionSearch.style.display = "none";
    if (collectionGrid) collectionGrid.style.display = "none";
    if (pagination) pagination.style.display = "none";
    detailBox.style.display = "block";

    if (scroll) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }

  window.__showCollectionListFromNav = function () {
    showCollectionList(false);
  };

  function fillDetailFromItem(it) {
    const tpl = it.querySelector(".detail-template");
    const nameEl = it.querySelector(".collection-name");
    const thumbImg = it.querySelector(".collection-thumb img");

    if (thumbImg && detailImg) {
      detailImg.src = thumbImg.src;
      const nameText = nameEl ? nameEl.textContent.trim() : "";
      detailImg.alt = nameText || thumbImg.alt || "";
    }

    if (tpl) {
      const tTitle = tpl.querySelector(".detail-title");
      const tMeta = tpl.querySelector(".detail-meta");
      const tDesc = tpl.querySelector(".detail-desc");
      const tCurator = tpl.querySelector(".curator");

      if (tTitle) detailTitle.innerHTML = tTitle.innerHTML;
      else if (nameEl) detailTitle.textContent = nameEl.textContent.trim();

      detailMeta.innerHTML = tMeta ? tMeta.innerHTML : "";
      detailDesc.innerHTML = tDesc ? tDesc.innerHTML : "";

      if (detailCurator) {
        if (tCurator) {
          detailCurator.style.display = "block";
          detailCurator.innerHTML = tCurator.innerHTML;
        } else {
          detailCurator.innerHTML = "";
          detailCurator.style.display = "none";
        }
      }
    } else {
      if (nameEl) detailTitle.textContent = nameEl.textContent?.trim?.() || "";
      detailMeta.innerHTML = "";
      detailDesc.innerHTML = "";
      if (detailCurator) {
        detailCurator.innerHTML = "";
        detailCurator.style.display = "none";
      }
    }
  }

  allItems.forEach(it => {
    it.addEventListener("click", () => {
      fillDetailFromItem(it);
      showCollectionDetail(true);
      history.pushState(
        { collectionDetail: true },
        "",
        window.location.href
      );
    });
  });

  if (detailClose) {
    detailClose.addEventListener("click", () => {
      stopDetailVideo();
      history.back();
    });
  }

  window.addEventListener("popstate", (event) => {
    stopDetailVideo();
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
