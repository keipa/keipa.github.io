'use strict';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const progressBar    = document.getElementById('progress-bar');
const viewList       = document.getElementById('view-list');
const viewArticle    = document.getElementById('view-article');
const postsContainer = document.getElementById('posts-container');
const articleTitle   = document.getElementById('article-title');
const articleDate    = document.getElementById('article-date');
const articleBody    = document.getElementById('article-body');
const navCrumb       = document.getElementById('nav-crumb');
const backBtn        = document.getElementById('back-btn');

document.getElementById('footer-year').textContent = new Date().getFullYear();

// ── marked config ─────────────────────────────────────────────────────────────
marked.use({ gfm: true, breaks: false });

// ── Posts cache ───────────────────────────────────────────────────────────────
let postsCache = null;

async function getPosts() {
  if (postsCache) return postsCache;
  const res = await fetch('posts.json');
  if (!res.ok) throw new Error('Could not load posts.json');
  postsCache = await res.json();
  return postsCache;
}

// ── Format date ───────────────────────────────────────────────────────────────
function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

// ── View transition ───────────────────────────────────────────────────────────
function showView(el) {
  viewList.classList.remove('active');
  viewArticle.classList.remove('active');
  el.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// ── Reading progress ──────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  if (!viewArticle.classList.contains('active')) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 0) return;
  progressBar.style.width = Math.min((window.scrollY / max) * 100, 100) + '%';
}, { passive: true });

// ── Load & render post list ───────────────────────────────────────────────────
async function loadPosts() {
  try {
    const data = await getPosts();
    renderPostList(data.posts);
  } catch {
    postsContainer.innerHTML = '<p class="error-msg">Could not load posts.</p>';
  }
}

function renderPostList(posts) {
  if (!posts.length) {
    postsContainer.innerHTML = '<p class="error-msg">No posts yet.</p>';
    return;
  }

  const html = posts.map(p => `
    <a class="post-card" href="?post=${p.slug}" data-slug="${p.slug}">
      <div class="post-date">${formatDate(p.date)}</div>
      <div class="post-title">${p.title}</div>
      <div class="post-desc">${p.description}</div>
    </a>
  `).join('');

  postsContainer.innerHTML = `<div class="posts-list">${html}</div>`;

  postsContainer.querySelectorAll('.post-card').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      openPost(card.dataset.slug);
    });
  });
}

// ── Open a post ───────────────────────────────────────────────────────────────
async function openPost(slug, pushState = true) {
  if (pushState) {
    history.pushState({ post: slug }, '', `?post=${encodeURIComponent(slug)}`);
  }

  showView(viewArticle);
  progressBar.classList.add('visible');
  progressBar.style.width = '0%';
  navCrumb.textContent = '…';
  articleTitle.textContent = '';
  articleDate.textContent = '';
  articleBody.innerHTML = `
    <div class="loader" aria-label="Loading article">
      <div class="loader-dot"></div>
      <div class="loader-dot"></div>
      <div class="loader-dot"></div>
    </div>`;

  try {
    const [data, mdRes] = await Promise.all([
      getPosts(),
      fetch(`posts/${encodeURIComponent(slug)}.md`)
    ]);

    const post = data.posts.find(p => p.slug === slug);
    if (!post) throw new Error('Post not found in manifest');
    if (!mdRes.ok) throw new Error('Markdown file not found');

    const md = await mdRes.text();
    // Strip the leading # heading — already shown in article-meta
    const mdBody = md.replace(/^\s*#{1,6}\s+[^\n]*\n?/, '');
    const html = await marked.parse(mdBody);

    articleTitle.textContent = post.title;
    articleDate.textContent  = formatDate(post.date);
    navCrumb.textContent     = post.title;
    articleBody.innerHTML    = html;

    articleBody.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));

    document.title = `${post.title} — keipa`;

  } catch {
    articleBody.innerHTML = '<p class="error-msg">Could not load this post.</p>';
    navCrumb.textContent  = 'error';
  }
}

// ── Go back to list ───────────────────────────────────────────────────────────
function goBack(pushState = true) {
  if (pushState) history.pushState({}, '', './');
  navCrumb.textContent = 'blog';
  progressBar.classList.remove('visible');
  progressBar.style.width = '0%';
  document.title = 'Blog — keipa';
  showView(viewList);
}

backBtn.addEventListener('click', () => goBack());

// ── Browser back / forward ────────────────────────────────────────────────────
window.addEventListener('popstate', () => {
  const slug = new URLSearchParams(window.location.search).get('post');
  if (slug) {
    openPost(slug, false);
  } else {
    goBack(false);
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────
(function init() {
  loadPosts();
  const slug = new URLSearchParams(window.location.search).get('post');
  if (slug) openPost(slug, false);
})();
