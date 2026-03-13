const STORAGE_KEY = "saas-theme";

const themeScript = `
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

export function SaasThemeScope() {
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
