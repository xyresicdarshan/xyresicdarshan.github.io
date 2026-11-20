(function () {
	'use strict';

	// Footer year
	var year = document.getElementById('year');
	if (year) year.textContent = new Date().getFullYear();

	// Tiles fade up as they enter the viewport, staggered within each row
	var tiles = document.querySelectorAll('.tile');
	var showAll = function () { tiles.forEach(function (t) { t.classList.add('is-in'); }); };

	if ('IntersectionObserver' in window) {
		var tileObserver = new IntersectionObserver(function (entries) {
			var visible = entries.filter(function (e) { return e.isIntersecting; });
			visible.forEach(function (entry, i) {
				entry.target.style.transitionDelay = (i * 70) + 'ms';
				entry.target.classList.add('is-in');
				tileObserver.unobserve(entry.target);
				setTimeout(function () { entry.target.style.transitionDelay = ''; }, 900 + i * 70);
			});
		}, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
		tiles.forEach(function (t) { tileObserver.observe(t); });
	} else {
		showAll();
	}

	// Print everything: show every tile and expand every role
	window.addEventListener('beforeprint', function () {
		showAll();
		document.querySelectorAll('details').forEach(function (d) { d.open = true; });
	});

	// Resume viewer: show the PDF inside the site instead of leaving the page
	var resume = document.getElementById('resume-dialog');

	if (resume && typeof resume.showModal === 'function') {
		var iframe = resume.querySelector('.resume-frame');
		var pages = resume.querySelector('.resume-pages');
		var fallback = resume.querySelector('.resume-fallback');
		var status = resume.querySelector('.resume-status');
		var pdfUrl = iframe.getAttribute('data-src').split('#')[0];
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
			iframe.hidden = true;
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
					if (!iframe.getAttribute('src')) iframe.setAttribute('src', iframe.getAttribute('data-src'));
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

}());
