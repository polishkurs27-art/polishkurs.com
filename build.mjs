#!/usr/bin/env node
// Builds the site into dist/:  /  (PL),  /ua/,  /by/.   Run:  node build.mjs
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { renderPage } from './src/page.mjs';

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const at = (...p) => path.join(here, ...p);
const json = async (f) => JSON.parse(await readFile(at('content', f), 'utf8'));

const shared = await json('shared.json');
const langs = await Promise.all(['pl.json', 'ua.json', 'by.json'].map(json));

await rm(at('dist'), { recursive: true, force: true });
await mkdir(at('dist/assets/video'), { recursive: true });
await cp(at('src/assets'), at('dist/assets'), { recursive: true });
for (const f of ['styles.css', 'main.js']) await cp(at('src', f), at('dist/assets', f));

// Most-viewed Shorts first. YouTube keeps a "popular Shorts" list for every channel (UUPS + channel id).
// YouTube's feeds go down now and then, so each one is tried a few times, and if none answers the build
// keeps the videos the live site already shows; the pinned list in shared.json is the last resort.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function readFeed(query) {
  let res;
  for (let attempt = 1; attempt <= 3; attempt++) {
    res = await fetch(`https://www.youtube.com/feeds/videos.xml?${query}`, { signal: AbortSignal.timeout(8000) }).catch(() => null);
    if (res?.ok) break;
    if (attempt < 3) await sleep(3000);
  }
  if (!res?.ok) throw new Error(res ? `HTTP ${res.status}` : 'no response');
  return [...(await res.text()).matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
    .map(([, e]) => ({
      id: e.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1],
      title: decodeEntities(e.match(/<title>([^<]*)<\/title>/)?.[1] ?? ''),
      views: Number(e.match(/<media:statistics views="(\d+)"/)?.[1] ?? 0),
      short: /href="https:\/\/www\.youtube\.com\/shorts\//.test(e),
    }))
    .filter((v) => v.id && v.short);
}

async function publishedVideos() {
  const res = await fetch(`${shared.site.url}/`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ids = [...(await res.text()).matchAll(/data-video="([\w-]{11})"/g)].map((m) => m[1]);
  return [...new Set(ids)].map((id) => ({ id, title: '', views: 0 }));
}

async function topVideos() {
  const { channelId, count, fallback } = shared.youtube;
  for (const query of [`playlist_id=UUPS${channelId.slice(2)}`, `channel_id=${channelId}`]) {
    try {
      const found = (await readFeed(query)).sort((x, y) => y.views - x.views).slice(0, count);
      if (found.length) return found;
      throw new Error('no Shorts in feed');
    } catch (err) {
      console.warn(`! YouTube feed "${query}" unavailable (${err.message})`);
    }
  }
  const live = await publishedVideos().catch(() => []);
  if (live.length >= count) {
    console.warn('! Keeping the videos the live site already shows');
    return live.slice(0, count);
  }
  console.warn('! Using the pinned video list from shared.json');
  return fallback.slice(0, count).map((id) => ({ id, title: '', views: 0 }));
}

const decodeEntities = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

// Thumbnails are stored with the site so the page makes no YouTube requests until a video is opened.
async function fetchThumb(video) {
  const remote = `https://i.ytimg.com/vi/${video.id}/oar2.jpg`;
  try {
    const res = await fetch(remote, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const jpg = at('dist/assets/video', `${video.id}.jpg`);
    await writeFile(jpg, Buffer.from(await res.arrayBuffer()));
    try {
      await run('cwebp', ['-quiet', '-q', '76', '-resize', '405', '0', jpg, '-o', jpg.replace(/\.jpg$/, '.webp')]);
      await rm(jpg);
      return { ...video, local: true, thumb: `video/${video.id}.webp` };
    } catch {
      return { ...video, local: true, thumb: `video/${video.id}.jpg` }; // cwebp not installed
    }
  } catch {
    return { ...video, local: false, thumb: remote };
  }
}

const videos = await Promise.all((await topVideos()).map(fetchThumb));

const v = createHash('sha1')
  .update(await readFile(at('src/styles.css')))
  .update(await readFile(at('src/main.js')))
  .digest('hex')
  .slice(0, 8);

for (const t of langs) {
  const dir = at('dist', t.dir);
  await mkdir(dir, { recursive: true });
  const html = renderPage(t, shared, { root: t.dir ? '../' : '', langs, videos, v });
  await writeFile(path.join(dir, 'index.html'), html);
}

const urls = langs.map((l) => `${shared.site.url}/${l.dir ? l.dir + '/' : ''}`);
await writeFile(
  at('dist/sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u}</loc></url>`)
    .join('\n')}\n</urlset>\n`
);
await writeFile(at('dist/robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${shared.site.url}/sitemap.xml\n`);

console.log(`Built ${langs.length} pages, ${videos.length} videos -> dist/`);
console.log(`Videos by views: ${videos.map((x) => `${x.id} (${x.views})`).join(', ')}`);
if (!shared.form.accessKey) console.warn('! Forms are not connected yet: set form.accessKey in content/shared.json');
