<?php
/**
 * Server-side render for blog posts (/blog/<slug>/), added 23 Oct 2026.
 *
 * post.html is a client-side template: before JavaScript runs it has the generic
 * title "Article" and a canonical pointing at /blog/, so search engines could see
 * every post as a copy of the blog index. This script fetches the published post
 * from Supabase on the server and writes the real title, description, canonical,
 * Open Graph tags, Article schema and article text into the HTML before it is sent.
 * cms-public.js still runs afterwards and renders the same post (with related posts).
 *
 * If Supabase cannot be reached the page still works exactly as before, with a
 * corrected canonical. Unknown slugs return a real 404.
 */
declare(strict_types=1);

const SITE = 'https://azzar.co.zw';
const SITE_NAME = 'Azzar Fencing and Steel';
const SUPABASE_URL = 'https://idwtldsvwdsxyddrmued.supabase.co';
// Publishable key, already public in /assets/js/supabase-config.js (RLS limits it to published content).
const SUPABASE_KEY = 'sb_publishable__5d-oTjlLwthZd0hWhudkQ_f6I_rXcm';

function h(?string $s): string { return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

function fetch_post(string $slug): array {
    $fixture = getenv('AZZAR_POST_FIXTURE');           // local testing only
    if ($fixture) { $raw = @file_get_contents($fixture); $code = 200; }
    else {
        $url = SUPABASE_URL . '/rest/v1/content_items?type=eq.blog&status=eq.published&limit=1'
             . '&select=slug,title,seo_title,seo_description,excerpt,body_html,cover_url,published_at,updated_at,tags'
             . '&slug=eq.' . rawurlencode($slug);
        $headers = ['apikey: ' . SUPABASE_KEY, 'Authorization: Bearer ' . SUPABASE_KEY, 'Accept: application/json'];
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => $headers, CURLOPT_TIMEOUT => 5, CURLOPT_CONNECTTIMEOUT => 3]);
            $raw = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
        } else {
            $ctx = stream_context_create(['http' => ['header' => implode("\r\n", $headers), 'timeout' => 5]]);
            $raw = @file_get_contents($url, false, $ctx); $code = $raw === false ? 0 : 200;
        }
    }
    if ($raw === false || $code !== 200) return ['ok' => false, 'post' => null];
    $rows = json_decode((string)$raw, true);
    return ['ok' => is_array($rows), 'post' => (is_array($rows) && $rows) ? $rows[0] : null];
}

function clean_body(string $html): string {
    // Mirror the client-side sanitiser: drop active content and event handlers.
    $html = preg_replace('#<(script|style|object|embed|form|input|button|iframe)\b[^>]*>.*?</\1>#is', '', $html);
    $html = preg_replace('#<(script|style|object|embed|form|input|button|iframe)\b[^>]*/?>#is', '', $html);
    $html = preg_replace('#\son[a-z]+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)#i', '', $html);
    $html = preg_replace('#\s(href|src)\s*=\s*("|\')\s*(javascript|data|vbscript):[^"\']*\2#i', '', $html);
    return $html;
}

$tpl = file_get_contents(__DIR__ . '/post.html');
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$slug = preg_match('#^/blog/([a-z0-9]+(?:-[a-z0-9]+)*)/?$#', $path, $m) ? $m[1] : '';
$canonical = SITE . '/blog/' . ($slug ? $slug . '/' : '');

header('Content-Type: text/html; charset=UTF-8');
$tpl = preg_replace('#<link rel="canonical" href="[^"]*"\s*/?>#', '<link rel="canonical" href="' . h($canonical) . '"/>', $tpl, 1);

$res = $slug ? fetch_post($slug) : ['ok' => true, 'post' => null];
if (!$res['ok']) { echo $tpl; exit; }                     // Supabase unreachable: fall back to the client-side page
if (!$res['post']) {                                       // published post not found
    http_response_code(404);
    $tpl = str_replace('</title>', '</title>' . "\n  " . '<meta name="robots" content="noindex"/>', $tpl);
    echo str_replace('<p class="cms-empty">Loading article…</p>', '<p class="cms-empty">This article could not be found. <a href="/blog/">View all articles</a></p>', $tpl);
    exit;
}

$p = $res['post'];
$title = trim((string)($p['seo_title'] ?: $p['title']));
$desc = trim((string)($p['seo_description'] ?: $p['excerpt']));
$image = (string)($p['cover_url'] ?? '');
if (!$image && $slug === 'electric-gate-motors-zimbabwe-guide') $image = SITE . '/images/real/electric-gate-motor/electric-gate-motor-installation-01.webp';
if (!$image && preg_match('#<img[^>]+src="([^"]+)"#i', (string)$p['body_html'], $im)) $image = $im[1];
if (!$image) $image = SITE . '/images/real/clearvue/clearvue-residential-installation-01.webp';
if (substr($image, 0, 1) === '/') $image = SITE . $image;
$published = (string)($p['published_at'] ?? '');
$modified = (string)($p['updated_at'] ?? $published);
$tags = is_array($p['tags'] ?? null) ? $p['tags'] : [];

$ld = [
    ['@context' => 'https://schema.org', '@type' => 'BlogPosting', 'headline' => (string)$p['title'], 'description' => $desc, 'image' => $image,
     'datePublished' => $published, 'dateModified' => $modified, 'mainEntityOfPage' => $canonical, 'keywords' => implode(', ', $tags), 'inLanguage' => 'en-ZW',
     'author' => ['@type' => 'Organization', 'name' => SITE_NAME, 'url' => SITE . '/'],
     'publisher' => ['@type' => 'Organization', 'name' => SITE_NAME, 'url' => SITE . '/']],
    ['@context' => 'https://schema.org', '@type' => 'BreadcrumbList', 'itemListElement' => [
        ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => SITE . '/'],
        ['@type' => 'ListItem', 'position' => 2, 'name' => 'Blog', 'item' => SITE . '/blog/'],
        ['@type' => 'ListItem', 'position' => 3, 'name' => (string)$p['title'], 'item' => $canonical]]],
];
$head = '<meta property="og:type" content="article"/>' . "\n  "
      . '<meta property="og:title" content="' . h($title) . '"/>' . "\n  "
      . '<meta property="og:description" content="' . h($desc) . '"/>' . "\n  "
      . '<meta property="og:url" content="' . h($canonical) . '"/>' . "\n  "
      . '<meta property="og:image" content="' . h($image) . '"/>' . "\n  "
      . '<meta name="twitter:card" content="summary_large_image"/>' . "\n  ";
foreach ($ld as $o) $head .= '<script type="application/ld+json">' . json_encode($o, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) . '</script>' . "\n  ";

$tpl = preg_replace('#<title>.*?</title>#s', '<title>' . h($title . ' | ' . SITE_NAME) . '</title>', $tpl, 1);
$tpl = preg_replace('#<meta name="description" content="[^"]*"\s*/?>#', '<meta name="description" content="' . h($desc) . '"/>', $tpl, 1);
$tpl = str_replace('</head>', '  ' . $head . "\n</head>", $tpl);

$date = $published ? date('j F Y', strtotime($published)) : '';
$article = '<header class="post-header"><p class="eyebrow">' . h(implode(' · ', $tags) ?: 'Insight') . '</p><h1>' . h((string)$p['title']) . '</h1>'
         . '<p class="post-deck">' . h((string)$p['excerpt']) . '</p>' . ($date ? '<time datetime="' . h($published) . '">' . h($date) . '</time>' : '') . '</header>'
         . '<div class="post-body">' . clean_body((string)$p['body_html']) . '</div>';
$tpl = str_replace('<p class="cms-empty">Loading article…</p>', $article, $tpl);
echo $tpl;
