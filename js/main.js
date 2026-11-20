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
		var pages = resume.querySelector('.resume-pages');
		var fallback = resume.querySelector('.resume-fallback');
		var status = resume.querySelector('.resume-status');
		var pdfUrl = frame.getAttribute('data-src').split('#')[0];
		var PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
		// Browsers without a built-in PDF viewer (e.g. Chrome on Android) get the pages drawn by PDF.js instead
		var canShowPdf = navigator.pdfViewerEnabled !== false;
		var rendering = null;

		var showError = function () {
			pages.hidden = true;
			fallback.hidden = false;
			status.textContent = "The resume couldn't be displayed here. You can download it instead.";
			fallback.querySelector('.resume-fallback-actions').hidden = false;
		};

		var loadPdfJs = function () {
			return new Promise(function (resolve, reject) {
				if (window.pdfjsLib) return resolve(window.pdfjsLib);
				var s = document.createElement('script');
				s.src = PDFJS + 'pdf.min.js';
				s.onload = function () {
					window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js';
					resolve(window.pdfjsLib);
				};
				s.onerror = reject;
				document.head.appendChild(s);
			});
		};

		var renderPages = function () {
			frame.hidden = true;
			fallback.hidden = false;
			return loadPdfJs()
				.then(function (pdfjs) { return pdfjs.getDocument(pdfUrl).promise; })
				.then(function (pdf) {
					var width = pages.clientWidth || resume.clientWidth;
					var dpr = window.devicePixelRatio || 1;
					var chain = Promise.resolve();
					for (var n = 1; n <= pdf.numPages; n++) {
						chain = chain.then(function (num) {
							return pdf.getPage(num).then(function (page) {
								var fit = page.getViewport({ scale: 1 });
								var viewport = page.getViewport({ scale: Math.min(width - 24, 900) / fit.width * dpr });
								var canvas = document.createElement('canvas');
								canvas.width = viewport.width;
								canvas.height = viewport.height;
								canvas.setAttribute('role', 'img');
								canvas.setAttribute('aria-label', 'Resume page ' + num + ' of ' + pdf.numPages);
								pages.appendChild(canvas);
								return page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
							});
						}.bind(null, n));
					}
					return chain;
				})
				.then(function () { fallback.hidden = true; pages.hidden = false; })
				.catch(showError);
		};

		document.querySelectorAll('[data-resume]').forEach(function (link) {
			link.addEventListener('click', function (e) {
				e.preventDefault();
				resume.showModal();
				document.documentElement.classList.add('resume-open');
				if (canShowPdf) {
					if (!frame.getAttribute('src')) frame.setAttribute('src', frame.getAttribute('data-src'));
				} else if (!rendering) {
					pages.hidden = false;
					rendering = renderPages();
				}
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
