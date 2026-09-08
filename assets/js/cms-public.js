(function () {
  'use strict';

  const config = window.CONTENT_CMS_SUPABASE || {};
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url || '') &&
    !String(config.publishableKey || '').startsWith('YOUR_');
  const localArticleCovers = {
    'electric-gate-motors-zimbabwe-guide': '/images/real/electric-gate-motor/electric-gate-motor-installation-01.jpg'
  };
  const legacyArticleImages = {
    'electric-gate-motor-d5-controller.jpg': '/images/real/electric-gate-motor/electric-gate-motor-d5-controller.jpg',
    'electric-gate-motor-app-setup.jpg': '/images/real/electric-gate-motor/electric-gate-motor-app-setup.jpg'
  };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[char]);
  }

  function safeUrl(value) {
    if (!value) return '';
    try {
      const base = /^https?:$/.test(window.location.protocol) ? `${window.location.origin}/` : 'http://127.0.0.1:4182/';
      const url = new URL(String(value).trim(), base);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (_) { return ''; }
  }

  function mediaUrl(value) {
    const url = safeUrl(value);
    if (!url) return '';
    try {
      const parsed = new URL(url);
      const localPath = legacyArticleImages[parsed.pathname.split('/').pop()];
      return localPath ? safeUrl(localPath) : url;
    } catch (_) { return url; }
  }

  function googleDrivePreviewUrl(value) {
    try {
      const url = new URL(String(value || '').trim());
      if (url.hostname !== 'drive.google.com') return '';
      const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
      const id = pathMatch?.[1] || url.searchParams.get('id');
      return id ? `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview` : '';
    } catch (_) { return ''; }
  }

  function blogPostUrl(slug) {
    return `/blog/${encodeURIComponent(String(slug || '').trim())}/`;
  }

  function slugFromLocation() {
    const legacySlug = new URLSearchParams(location.search).get('slug');
    if (legacySlug) return legacySlug;
    const match = location.pathname.match(/\/blog\/([^/]+)\/?$/i);
    if (!match || /^(?:index|post)\.html$/i.test(match[1])) return '';
    try { return decodeURIComponent(match[1]); } catch (_) { return match[1]; }
  }

  function activateMediaFallbacks(root) {
    root.querySelectorAll('img.blog-card-img').forEach((image) => {
      const showFallback = () => {
        const fallback = document.createElement('div');
        fallback.className = 'blog-card-img-ph';
        fallback.setAttribute('aria-hidden', 'true');
        image.replaceWith(fallback);
      };
      image.addEventListener('error', showFallback, { once: true });
      if (image.complete && image.naturalWidth === 0) showFallback();
    });
  }

  function firstBodyImageUrl(html) {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(String(html), 'text/html');
    return mediaUrl(doc.querySelector('img')?.getAttribute('src'));
  }

  function sanitiseRichText(html, promotedImageUrl = '') {
    const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
    if (promotedImageUrl) {
      const promotedImage = [...doc.querySelectorAll('img')]
        .find((image) => mediaUrl(image.getAttribute('src')) === promotedImageUrl);
      (promotedImage?.closest('figure') || promotedImage)?.remove();
    }
    doc.querySelectorAll('script,style,object,embed,form,input,button').forEach((node) => node.remove());
    doc.querySelectorAll('iframe').forEach((frame) => {
      const src = googleDrivePreviewUrl(frame.getAttribute('src'));
      if (!src) { frame.remove(); return; }
      [...frame.attributes].forEach((attribute) => frame.removeAttribute(attribute.name));
      frame.src = src;
      frame.title = 'Google Drive video';
      frame.loading = 'lazy';
      frame.allow = 'autoplay; fullscreen';
      frame.setAttribute('allowfullscreen', '');
    });
    doc.body.querySelectorAll('*').forEach((node) => {
      [...node.attributes].forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        if (name.startsWith('on') || (['href', 'src'].includes(name) && !safeUrl(attribute.value))) {
          node.removeAttribute(attribute.name);
        } else if (name === 'src' && node.tagName === 'IMG') {
          node.setAttribute(attribute.name, mediaUrl(attribute.value));
        }
      });
    });
    doc.querySelectorAll('table').forEach((table) => {
      if (table.parentElement?.classList.contains('table-scroll')) return;
      const wrapper = doc.createElement('div');
      wrapper.className = 'table-scroll';
      wrapper.setAttribute('role', 'region');
      wrapper.setAttribute('aria-label', table.getAttribute('aria-label') || 'Scrollable data table');
      wrapper.tabIndex = 0;
      table.before(wrapper);
      wrapper.append(table);
    });
    return doc.body.innerHTML;
  }

  function mediaMarkup(item, className, fallbackImage = '') {
    const video = safeUrl(item.video_url);
    const cover = mediaUrl(item.cover_url) || mediaUrl(fallbackImage);
    if (video) return `<video class="${className}" controls preload="metadata" playsinline${cover ? ` poster="${escapeHtml(cover)}"` : ''}><source src="${escapeHtml(video)}"></video>`;
    if (cover) return `<img class="${className}" src="${escapeHtml(cover)}" alt="${escapeHtml(item.title)}" loading="lazy">`;
    return `<div class="${className} cms-media-placeholder" aria-hidden="true"></div>`;
  }

  function cardMediaMarkup(item, className) {
    const cover = mediaUrl(item.cover_url);
    const bodyImage = cover ? '' : firstBodyImageUrl(item.body_html);
    const image = cover || bodyImage;
    if (image) return `<img class="${className}" src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}" loading="lazy">`;
    return `<div class="${className} cms-media-placeholder" aria-hidden="true"></div>`;
  }

  async function getClient() {
    if (!configured || !window.supabase?.createClient) return null;
    if (window.CONTENT_CMS_PUBLIC_CLIENT) return window.CONTENT_CMS_PUBLIC_CLIENT;
    window.CONTENT_CMS_PUBLIC_CLIENT = window.supabase.createClient(config.url, config.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    return window.CONTENT_CMS_PUBLIC_CLIENT;
  }

  async function fetchPublished(type, options = {}) {
    const client = await getClient();
    if (!client) return [];
    let query = client.from('content_items').select('*').eq('type', type).eq('status', 'published');
    query = type === 'blog'
      ? query.order('published_at', { ascending: false }).order('id', { ascending: false })
      : query.order('featured', { ascending: false }).order('sort_order', { ascending: true }).order('published_at', { ascending: false });
    if (options.slug) query = query.eq('slug', options.slug).limit(1);
    if (options.limit) query = query.limit(options.limit);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async function fetchPublishedBlogPage(page = 1, pageSize = 3) {
    const client = await getClient();
    if (!client) return { posts: [], total: 0 };
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, count, error } = await client.from('content_items')
      .select('*', { count: 'exact' })
      .eq('type', 'blog')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, to);
    if (error) throw error;
    return { posts: data || [], total: count || 0 };
  }

  async function renderProjects() {
    const section = document.querySelector('[data-cms-projects]');
    const grid = document.querySelector('[data-cms-project-grid]');
    if (!section || !grid) return;
    try {
      const projects = await fetchPublished('project');
      if (!projects.length) return;
      grid.innerHTML = projects.map((item) => {
        const tags = (item.tags || []).join(' · ');
        const href = item.external_url ? safeUrl(item.external_url) : '';
        return `<article class="project-card cms-project-card">
          ${mediaMarkup(item, 'cms-project-media')}
          <div class="project-card-body">
            <p class="project-card-meta">${escapeHtml(tags || 'Portfolio project')}</p>
            <h3 class="project-card-title">${escapeHtml(item.title)}</h3>
            <p class="project-card-text">${escapeHtml(item.excerpt || '')}</p>
            ${href ? `<div class="project-card-actions"><a class="project-card-link project-card-link--primary" href="${escapeHtml(href)}" target="_blank" rel="noopener">View project</a></div>` : ''}
          </div>
        </article>`;
      }).join('');
      section.hidden = false;
    } catch (error) { console.error('Could not load projects.', error); }
  }

  function blogCards(posts) {
    return posts.map((item) => `<a class="blog-card" href="${blogPostUrl(item.slug)}">
      ${cardMediaMarkup(item, 'blog-card-img')}
      <div class="blog-card-body">
        <div class="blog-card-meta">${escapeHtml((item.tags || [])[0] || 'Insight')} <span>${new Date(item.published_at).toLocaleDateString('en-ZW', { month: 'short', year: 'numeric' })}</span></div>
        <div class="blog-card-title">${escapeHtml(item.title)}</div>
      </div>
    </a>`).join('');
  }

  function paginationMarkup(page, pageCount) {
    return `<button type="button" data-cms-page="prev"${page <= 1 ? ' disabled' : ''}>Previous</button>
      <span aria-live="polite">Page ${page} of ${pageCount}</span>
      <button type="button" data-cms-page="next"${page >= pageCount ? ' disabled' : ''}>Next</button>`;
  }

  function setupBlogCarousel(section, track, itemCount) {
    let controls = section.querySelector('[data-cms-carousel-controls]');
    if (!controls) {
      controls = document.createElement('nav');
      controls.className = 'blog-carousel-controls';
      controls.dataset.cmsCarouselControls = '';
      controls.setAttribute('aria-label', 'Article carousel controls');
      track.after(controls);
    }

    let page = 0;
    let pageCount = 1;
    let timer = null;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const cardsPerPage = () => window.innerWidth <= 640 ? 1 : window.innerWidth <= 960 ? 2 : 3;
    const paintControls = () => {
      pageCount = Math.max(1, Math.ceil(itemCount / cardsPerPage()));
      page = Math.min(page, pageCount - 1);
      const disabled = pageCount === 1 ? ' disabled' : '';
      controls.innerHTML = `<button type="button" class="blog-carousel-arrow" data-carousel-prev aria-label="Previous articles"${disabled}>&#8592;</button>
        <div class="blog-carousel-dots" role="group" aria-label="Choose article page">${Array.from({ length: pageCount }, (_, index) => `<button type="button" class="blog-carousel-dot${index === page ? ' is-active' : ''}" data-carousel-page="${index}" aria-label="Show article page ${index + 1}"${index === page ? ' aria-current="true"' : ''}></button>`).join('')}</div>
        <button type="button" class="blog-carousel-arrow" data-carousel-next aria-label="Next articles"${disabled}>&#8594;</button>`;
      controls.hidden = false;
    };
    const goTo = (nextPage, smooth = true) => {
      page = (nextPage + pageCount) % pageCount;
      const pageOffset = pageCount > 1 ? (track.scrollWidth - track.clientWidth) / (pageCount - 1) : 0;
      track.scrollTo({ left: page * pageOffset, behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
      paintControls();
    };
    const stop = () => { if (timer) window.clearInterval(timer); timer = null; };
    const start = () => {
      stop();
      if (!reduceMotion && pageCount > 1) timer = window.setInterval(() => goTo(page + 1), 5500);
    };

    paintControls();
    controls.addEventListener('click', (event) => {
      const dot = event.target.closest('[data-carousel-page]');
      if (dot) goTo(Number(dot.dataset.carouselPage));
      else if (event.target.closest('[data-carousel-prev]')) goTo(page - 1);
      else if (event.target.closest('[data-carousel-next]')) goTo(page + 1);
      start();
    });
    track.addEventListener('scroll', () => {
      window.requestAnimationFrame(() => {
        const pageOffset = pageCount > 1 ? (track.scrollWidth - track.clientWidth) / (pageCount - 1) : 0;
        const nextPage = pageOffset > 0 ? Math.min(pageCount - 1, Math.round(track.scrollLeft / pageOffset)) : 0;
        if (nextPage !== page) { page = nextPage; paintControls(); }
      });
    }, { passive: true });
    section.addEventListener('mouseenter', stop);
    section.addEventListener('mouseleave', start);
    section.addEventListener('focusin', stop);
    section.addEventListener('focusout', start);
    section.addEventListener('touchstart', stop, { passive: true });
    window.addEventListener('resize', () => { paintControls(); goTo(page, false); });
    start();
  }

  async function renderBlogFeed(section, requestedPage = 1) {
    const track = section.querySelector('[data-cms-blog-grid]');
    if (!track) return;
    const carousel = section.dataset.carousel === 'true';
    const pageSize = Math.min(24, Math.max(1, Number.parseInt(section.dataset.pageSize || '3', 10) || 3));
    const paginated = section.dataset.pagination === 'true';
    try {
      if (carousel) {
        const posts = await fetchPublished('blog');
        if (!posts.length) return;
        track.classList.add('is-carousel');
        track.innerHTML = blogCards(posts);
        activateMediaFallbacks(track);
        section.hidden = false;
        setupBlogCarousel(section, track, posts.length);
        return;
      }
      const initial = await fetchPublishedBlogPage(1, pageSize);
      if (!initial.posts.length) return;
      const pageCount = Math.max(1, Math.ceil(initial.total / pageSize));
      const page = Math.min(pageCount, Math.max(1, requestedPage));
      const result = page === 1 ? initial : await fetchPublishedBlogPage(page, pageSize);
      track.classList.add('is-static');
      track.innerHTML = `<div class="carousel-set">${blogCards(result.posts)}</div>`;
      activateMediaFallbacks(track);
      let controls = section.querySelector('[data-cms-blog-pagination]');
      if (paginated && pageCount > 1) {
        if (!controls) {
          controls = document.createElement('nav');
          controls.dataset.cmsBlogPagination = '';
          controls.setAttribute('aria-label', 'Blog pagination');
          track.after(controls);
        }
        controls.innerHTML = paginationMarkup(page, pageCount);
        controls.hidden = false;
        controls.onclick = (event) => {
          const direction = event.target.closest('[data-cms-page]')?.dataset.cmsPage;
          if (!direction) return;
          renderBlogFeed(section, direction === 'next' ? page + 1 : page - 1);
        };
      } else if (controls) controls.hidden = true;
      section.hidden = false;
    } catch (error) { console.error('Could not load blog posts.', error); }
  }

  function renderLatestPosts() {
    document.querySelectorAll('[data-cms-blog]').forEach((section) => renderBlogFeed(section));
  }

  async function renderBlogIndex() {
    const grid = document.querySelector('[data-blog-index]');
    if (!grid) return;
    try {
      const posts = await fetchPublished('blog');
      grid.innerHTML = posts.length ? posts.map((item) => `<article class="article-card">
        <a href="${blogPostUrl(item.slug)}">${cardMediaMarkup(item, 'article-card-media')}</a>
        <div class="article-card-copy"><p class="eyebrow">${escapeHtml((item.tags || [])[0] || 'Insight')}</p><h2><a href="${blogPostUrl(item.slug)}">${escapeHtml(item.title)}</a></h2><p>${escapeHtml(item.excerpt || '')}</p></div>
      </article>`).join('') : '<p class="cms-empty">New articles are coming soon.</p>';
    } catch (_) { grid.innerHTML = '<p class="cms-empty">Articles are temporarily unavailable.</p>'; }
  }

  async function renderBlogPost() {
    const article = document.querySelector('[data-blog-post]');
    if (!article) return;
    const slug = slugFromLocation();
    if (!slug) { article.innerHTML = '<p class="cms-empty">Article not found.</p>'; return; }
    try {
      const [item] = await fetchPublished('blog', { slug });
      if (!item) throw new Error('Not found');
      document.title = `${item.seo_title || item.title} | ${config.siteName || 'My Site'}`;
      const description = document.querySelector('meta[name="description"]');
      if (description) description.content = item.seo_description || item.excerpt || '';
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); }
      if (config.siteUrl) canonical.href = `${String(config.siteUrl).replace(/\/$/, '')}${blogPostUrl(item.slug)}`;
      if (location.pathname.endsWith('/post.html')) history.replaceState({}, '', blogPostUrl(item.slug));
      const related = (await fetchPublished('blog', { limit: 4 })).filter((post) => post.slug !== item.slug).slice(0, 3);
      const promotedImage = !safeUrl(item.cover_url) && !safeUrl(item.video_url)
        ? mediaUrl(localArticleCovers[item.slug]) || firstBodyImageUrl(item.body_html)
        : '';
      article.innerHTML = `<header class="post-header"><p class="eyebrow">${escapeHtml((item.tags || []).join(' · ') || 'Insight')}</p><h1>${escapeHtml(item.title)}</h1><p class="post-deck">${escapeHtml(item.excerpt || '')}</p><time>${new Date(item.published_at).toLocaleDateString('en-ZW', { day: 'numeric', month: 'long', year: 'numeric' })}</time></header>
        <div class="post-lead-media">${mediaMarkup(item, 'post-media', promotedImage)}</div>
        <div class="post-body">${sanitiseRichText(item.body_html, promotedImage)}</div>
        ${related.length ? `<aside class="related-posts"><div class="related-posts-header"><h2>Keep reading</h2><a href="/blog/">View all articles</a></div><div class="related-posts-grid">${related.map((post) => `<a class="related-post-card" href="${blogPostUrl(post.slug)}">${cardMediaMarkup(post, 'related-post-media')}<span>${escapeHtml(post.title)}</span></a>`).join('')}</div></aside>` : ''}`;
    } catch (_) { article.innerHTML = '<p class="cms-empty">This article could not be found.</p>'; }
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderProjects(); renderLatestPosts(); renderBlogIndex(); renderBlogPost();
  });
})();
