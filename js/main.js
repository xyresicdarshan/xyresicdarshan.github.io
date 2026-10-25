(function () {
	'use strict';

	// Footer year
	var year = document.getElementById('year');
	if (year) year.textContent = new Date().getFullYear();

	// Mobile navigation
	var toggle = document.querySelector('.nav-toggle');
	var nav = document.getElementById('site-nav');

	function setNav(open) {
		toggle.setAttribute('aria-expanded', String(open));
		nav.classList.toggle('is-open', open);
	}

	if (toggle && nav) {
		toggle.addEventListener('click', function () {
			setNav(toggle.getAttribute('aria-expanded') !== 'true');
		});

		nav.addEventListener('click', function (e) {
			if (e.target.closest('a')) setNav(false);
		});

		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && nav.classList.contains('is-open')) {
				setNav(false);
				toggle.focus();
			}
		});

		window.matchMedia('(min-width: 1061px)').addEventListener('change', function (e) {
			if (e.matches) setNav(false);
		});
	}

	// Resume viewer: show the PDF inside the site instead of leaving the page
	var resume = document.getElementById('resume-dialog');

	if (resume && typeof resume.showModal === 'function') {
		var frame = resume.querySelector('.resume-frame');
		var fallback = resume.querySelector('.resume-fallback');
		// Browsers without a built-in PDF viewer (e.g. Chrome on Android) get open/download buttons instead
		var canShowPdf = navigator.pdfViewerEnabled !== false;

		document.querySelectorAll('[data-resume]').forEach(function (link) {
			link.addEventListener('click', function (e) {
				e.preventDefault();
				if (canShowPdf) {
					if (!frame.getAttribute('src')) frame.setAttribute('src', frame.getAttribute('data-src'));
				} else {
					frame.hidden = true;
					fallback.hidden = false;
				}
				resume.showModal();
				document.documentElement.classList.add('resume-open');
			});
		});

		resume.querySelector('[data-close]').addEventListener('click', function () { resume.close(); });

		// Clicking the dimmed backdrop closes the viewer
		resume.addEventListener('click', function (e) {
			if (e.target === resume) resume.close();
		});

		resume.addEventListener('close', function () {
			document.documentElement.classList.remove('resume-open');
		});
	}

	if (!('IntersectionObserver' in window)) {
		document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
		return;
	}

	// Reveal content as it scrolls into view
	var revealObserver = new IntersectionObserver(function (entries) {
		entries.forEach(function (entry) {
			if (entry.isIntersecting) {
				entry.target.classList.add('is-visible');
				revealObserver.unobserve(entry.target);
			}
		});
	}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

	document.querySelectorAll('.reveal').forEach(function (el) { revealObserver.observe(el); });

	// Highlight the nav link for the section in view
	var links = {};
	document.querySelectorAll('.site-nav ol a[href^="#"]').forEach(function (a) {
		links[a.getAttribute('href').slice(1)] = a;
	});

	var navObserver = new IntersectionObserver(function (entries) {
		entries.forEach(function (entry) {
			var link = links[entry.target.id];
			if (!link) return;
			if (!entry.isIntersecting) return;
			Object.keys(links).forEach(function (id) {
				links[id].classList.remove('is-active');
				links[id].removeAttribute('aria-current');
			});
			link.classList.add('is-active');
			link.setAttribute('aria-current', 'true');
		});
	}, { rootMargin: '-45% 0px -50% 0px' });

	Object.keys(links).forEach(function (id) {
		var section = document.getElementById(id);
		if (section) navObserver.observe(section);
	});
}());
