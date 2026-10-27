// Mobile navigation and progressive visual enhancement; no tracking or network calls.
const toggle = document.getElementById('navToggle');
const links = document.getElementById('navLinks');
const setOpen = open => { links.classList.toggle('open', open); toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单'); };
toggle.addEventListener('click', () => setOpen(!links.classList.contains('open')));
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && links.classList.contains('open')) { setOpen(false); toggle.focus(); } });
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
 const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('show'); observer.unobserve(entry.target); } }), { threshold: .15 });
 document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
} else document.querySelectorAll('.reveal').forEach(element => element.classList.add('show'));
