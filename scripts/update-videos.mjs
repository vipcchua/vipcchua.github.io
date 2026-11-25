import { readFile, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright-core'
import links from '../src/data/video-links.json' with { type: 'json' }

const output = new URL('../src/data/videos.json', import.meta.url)
const previousVideos = JSON.parse(await readFile(output, 'utf8').catch(error => {
  if (error.code === 'ENOENT') return '[]'
  throw error
}))
let browser

async function fetchDouyinAuthor(id) {
  try {
    browser ??= await chromium.launch({ channel: 'chrome' })
    const page = await browser.newPage()
    try {
      await page.goto(`https://open.douyin.com/player/video?vid=${id}&autoplay=0`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      })
      const label = page.locator('.video-info-container .video-title').filter({ hasText: /^@/ }).first()
      return (await label.innerText({ timeout: 6000 })).trim().replace(/^@/, '')
    } finally {
      await page.close()
    }
  } catch {
    console.warn(`${id} 未能读取抖音昵称，继续使用已有昵称（如有）`)
    return previousVideos.find(video => video.id === id)?.author
  }
}

async function fetchBilibili(id) {
  const response = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${id}`, {
    headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.bilibili.com/' },
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw new Error(`${id} 请求失败（HTTP ${response.status}）`)
  const { code, message, data } = await response.json()
  if (code !== 0 || !data?.stat) throw new Error(`${id} 获取失败：${message}`)

  return {
    id,
    platform: 'bilibili',
    url: `https://www.bilibili.com/video/${id}/`,
    title: data.title,
    cover: data.pic.replace(/^http:/, 'https:'),
    author: data.owner.name,
    duration: data.duration,
    publishedAt: data.pubdate,
    views: data.stat.view,
    likes: data.stat.like,
    favorites: data.stat.favorite,
  }
}

async function fetchDouyin(id) {
  const response = await fetch(`https://open.douyin.com/api/douyin/v1/video/get_iframe_by_video?video_id=${id}`, {
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw new Error(`${id} 请求失败（HTTP ${response.status}）`)
  const { err_no, err_msg, data } = await response.json()
  if (err_no !== 0 || !data?.iframe_code) throw new Error(`${id} 获取失败：${err_msg}`)

  return {
    id,
    platform: 'douyin',
    url: `https://www.douyin.com/video/${id}`,
    title: data.video_title || '抖音视频',
    author: await fetchDouyinAuthor(id),
    width: data.video_width,
    height: data.video_height,
  }
}

async function parseLink(link) {
  const url = new URL(link)
  if (url.protocol !== 'https:') throw new Error(`请填写 HTTPS 视频链接：${link}`)
  if (['www.bilibili.com', 'bilibili.com', 'm.bilibili.com'].includes(url.hostname)) {
    const id = /^\/video\/(BV[0-9A-Za-z]{10})\/?$/.exec(url.pathname)?.[1]
    if (id) return { id, fetchVideo: fetchBilibili }
  }

  let target = url
  if (url.hostname === 'v.douyin.com') {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    })
    const location = response.headers.get('location')
    if (!location) throw new Error(`抖音短链接未返回视频地址：${link}`)
    target = new URL(location, url)
  }
  if (target.protocol === 'https:' && ['www.douyin.com', 'douyin.com'].includes(target.hostname)) {
    const id = /^\/video\/(\d+)\/?$/.exec(target.pathname)?.[1]
    if (id) return { id, fetchVideo: fetchDouyin }
  }
  if (target.protocol === 'https:' && target.hostname === 'www.iesdouyin.com') {
    const id = /^\/share\/video\/(\d+)\/?$/.exec(target.pathname)?.[1]
    if (id) return { id, fetchVideo: fetchDouyin }
  }
  throw new Error(`请填写 B 站或抖音视频链接：${link}`)
}

try {
  const videos = []
  const seen = new Set()
  for (const entry of links) {
    const link = typeof entry === 'string' ? entry : entry?.url
    if (typeof link !== 'string') throw new Error('请填写视频链接，或为视频对象填写 url 字段')
    const { id, fetchVideo } = await parseLink(link)
    if (seen.has(id)) continue
    const video = await fetchVideo(id)
    if (video.platform === 'douyin' && typeof entry === 'object') {
      for (const field of ['views', 'likes', 'favorites']) {
        const value = entry[field]
        if (value == null) continue
        if (!Number.isSafeInteger(value) || value < 0) {
          throw new Error(`${id} 的 ${field} 必须是非负整数或 null`)
        }
        video[field] = value
      }
    }
    videos.push(video)
    seen.add(id)
    console.log(`已读取 ${id} · ${video.title}`)
  }

  await writeFile(output, JSON.stringify(videos, null, 2) + '\n')
} finally {
  await browser?.close()
}
