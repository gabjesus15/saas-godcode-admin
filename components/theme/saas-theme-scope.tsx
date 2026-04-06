const STORAGE_KEY = "saas-theme";

export const THEME_SCOPE_SCRIPT = `
(function() {
	try {
		const theme = localStorage.getItem('${STORAGE_KEY}');
		if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
			document.documentElement.classList.add('dark');
			document.documentElement.setAttribute('data-theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			document.documentElement.setAttribute('data-theme', 'light');
		}
	} catch (_) {}
})();
`;

export const LIGHT_ONLY_THEME_SCRIPT = `
(function() {
	try {
		document.documentElement.classList.remove('dark');
		document.documentElement.setAttribute('data-theme', 'light');
		localStorage.removeItem('${STORAGE_KEY}');
	} catch (_) {}
})();
`;
