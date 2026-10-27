import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
// 视觉验证与人工节流实验；不代表物理弱设备/真实业务。
import { chromium } from 'playwright';

const OUTPUT_DIR = resolve(process.env.OUTPUT_DIR || 'artifacts');
await mkdir(OUTPUT_DIR, { recursive: true });
const URL = process.env.TARGET_URL || 'http://127.0.0.1:8770/';
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });

// ===== 1. 正常环境截图 =====
const page1 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page1.goto(URL, { waitUntil: 'load' });
await page1.waitForTimeout(2000);
await page1.screenshot({ path: resolve(OUTPUT_DIR, 'normal-1.png') });
await page1.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page1.waitForTimeout(900);
await page1.screenshot({ path: resolve(OUTPUT_DIR, 'normal-2.png') });
await page1.close();
console.log('screenshots done');

// ===== 2. 人工节流实验（不等同物理弱设备） =====
const cdp = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  serviceWorkers: 'block',
});
const page2 = await cdp.newPage();
const session = await cdp.newCDPSession(page2);
await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await session.send('Network.emulateNetworkConditions', {
  offline: false, latency: 100, downloadThroughput: 750 * 1024 / 8, uploadThroughput: 375 * 1024 / 8,
});

await page2.addInitScript(() => {
  window.__cwv = { lcpCandidateMs: null, nonInputShiftSum: 0, maxObservedEventDurationMs: null, longTasks: 0 };
  try {
    new PerformanceObserver((l) => {
      const e = [...l.getEntries()].pop();
      if (e) window.__cwv.lcpCandidateMs = e.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {}
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cwv.nonInputShiftSum += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (e) {}
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (e.duration > 0 && (!window.__cwv.maxObservedEventDurationMs || e.duration > window.__cwv.maxObservedEventDurationMs)) window.__cwv.maxObservedEventDurationMs = e.duration;
      }
    }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
  } catch (e) {}
  try {
    new PerformanceObserver(() => { window.__cwv.longTasks += 1; }).observe({ type: 'longtask', buffered: true });
  } catch (e) {}
});

await page2.goto(URL, { waitUntil: 'load' });
await page2.waitForTimeout(2500);
try { await page2.locator('nav a').first().click(); await page2.waitForTimeout(500); } catch (e) {}

const m = await page2.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');
  const fcp = paint.find((p) => p.name === 'first-contentful-paint');
  return {
    lcpCandidateMs: window.__cwv.lcpCandidateMs === null ? null : Math.round(window.__cwv.lcpCandidateMs), nonInputShiftSum: Number(window.__cwv.nonInputShiftSum.toFixed(4)),
    maxObservedEventDurationMs: window.__cwv.maxObservedEventDurationMs ? Math.round(window.__cwv.maxObservedEventDurationMs) : null,
    ttfb: nav ? Math.round(nav.responseStart) : 0,
    fcp: fcp ? Math.round(fcp.startTime) : 0,
    dcl: nav ? Math.round(nav.domContentLoadedEventEnd) : 0,
    load: nav ? Math.round(nav.loadEventEnd) : 0,
    longTasks: window.__cwv.longTasks,
  };
});
console.log('ARTIFICIAL-THROTTLE-LAB:', JSON.stringify({scope:'CPU4x, latency100ms, down750kbps/up375kbps, one synthetic navigation; not a physical device, standard INP/CLS or field data',browser:browser.version(),observation:m}, null, 2));
await browser.close();
