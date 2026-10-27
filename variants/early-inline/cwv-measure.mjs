// Historical self-written observer experiment, corrected labels; not standard Web Vitals/RUM.
import { chromium } from 'playwright';

const URL = process.env.TARGET_URL || 'http://127.0.0.1:8770/';
const RUNS = Number(process.env.RUNS || '3');
if (!Number.isInteger(RUNS) || RUNS < 1 || RUNS > 30) throw new Error('RUNS must be an integer from 1 to 30');

async function measureOnce(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 注入采集器（缓冲的 PerformanceObserver）
  await page.addInitScript(() => {
    window.__cwv = { lcpCandidateMs: null, supportedEntryTypes: [...PerformanceObserver.supportedEntryTypes], nonInputShiftSum: 0, maxObservedEventDurationMs: null, fcp: 0, ttfb: 0, dcl: 0, load: 0, longTasks: [] };
    try {
      new PerformanceObserver((l) => {
        const e = [...l.getEntries()].pop();
        if (e) window.__cwv.lcpCandidateMs = e.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {}
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          if (!e.hadRecentInput) window.__cwv.nonInputShiftSum += e.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (e) {}
    try {
      // 记录事件时长最大值；缺少标准INP生命周期/交互分组口径。
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          if (e.duration > 0 && (!window.__cwv.maxObservedEventDurationMs || e.duration > window.__cwv.maxObservedEventDurationMs)) {
            window.__cwv.maxObservedEventDurationMs = e.duration;
          }
        }
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
    } catch (e) {}
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          if (e.duration > 50) window.__cwv.longTasks.push(Math.round(e.duration));
        }
      }).observe({ type: 'longtask', buffered: true });
    } catch (e) {}
  });

  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(1800); // 等待 LCP 稳定 + 动画完成

  // 合成点击导航，仅取得有限的Event Timing样本。
  try {
    await page.locator('nav a').first().click();
    await page.waitForTimeout(400);
  } catch (e) {}

  const m = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find((p) => p.name === 'first-contentful-paint');
    return {
      supportedEntryTypes: window.__cwv.supportedEntryTypes,
      lcpCandidateMs: window.__cwv.lcpCandidateMs,
      nonInputShiftSum: window.__cwv.nonInputShiftSum,
      maxObservedEventDurationMs: window.__cwv.maxObservedEventDurationMs,
      ttfb: nav ? nav.responseStart : 0,
      fcp: fcp ? fcp.startTime : 0,
      dcl: nav ? nav.domContentLoadedEventEnd : 0,
      load: nav ? nav.loadEventEnd : 0,
      longTasks: window.__cwv.longTasks,
      domNodes: document.querySelectorAll('*').length,
      resources: performance.getEntriesByType('resource').length,
    };
  });
  await page.close();
  return m;
}

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
const results = [];
for (let i = 0; i < RUNS; i++) results.push(await measureOnce(browser));
const browserVersion = browser.version();
await browser.close();

// 描述本机合成导航的中位数和范围，不计算/冒称现场访问p75。
function describe(values) {
  const a=values.filter(v=>v !== null && Number.isFinite(v)).sort((a,b)=>a-b);
  if (!a.length) return {observed:0,median:null,min:null,max:null};
  const mid=Math.floor(a.length/2), round=n=>Math.round(n*100000000)/100000000;
  return {observed:a.length,median:round(a.length%2?a[mid]:(a[mid-1]+a[mid])/2),min:round(a[0]),max:round(a.at(-1))};
}
console.log(JSON.stringify({
  url:URL,runs:RUNS,browser:browserVersion,viewport:{width:1440,height:900},
  scope:'Local synthetic navigation only. maxObservedEventDurationMs is not INP; nonInputShiftSum is not modern session-window CLS. No CrUX/RUM or pass/fail verdict. Missing entries are null.',
  detail:results,summary:Object.fromEntries(['lcpCandidateMs','nonInputShiftSum','maxObservedEventDurationMs','ttfb','fcp','dcl','load'].map(k=>[k,describe(results.map(r=>r[k]))]))
},null,2));
