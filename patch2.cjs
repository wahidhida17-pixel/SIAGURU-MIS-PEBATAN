const fs = require('fs');
const content = fs.readFileSync('src/contexts/SchoolSettingsContext.tsx', 'utf8');

const target = `  useEffect(() => {
    // Initial fetch and real-time subscription
    const unsubscribe = settingsService.subscribeGeneralSettings((newSettings) => {
      setSettings(newSettings);
      setIsLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);`;

const addition = `  useEffect(() => {
    // Initial fetch and real-time subscription
    const unsubscribe = settingsService.subscribeGeneralSettings((newSettings) => {
      setSettings(newSettings);
      setIsLoading(false);
      
      // Inject dynamic branding
      if (newSettings.schoolName) {
        document.title = \`SIAGURU \${newSettings.schoolName.toUpperCase()}\`;
      }
      
      const setLinkRef = (rel, href) => {
        let link = document.querySelector(\`link[rel="\${rel}"]\`);
        if (!link) {
          link = document.createElement('link');
          link.rel = rel;
          document.head.appendChild(link);
        }
        link.href = href;
      };

      if (newSettings.faviconURL) {
        setLinkRef('icon', newSettings.faviconURL);
      } else if (newSettings.logoURL) {
        setLinkRef('icon', newSettings.logoURL);
      }
      
      if (newSettings.appIconURL) {
        setLinkRef('apple-touch-icon', newSettings.appIconURL);
      } else if (newSettings.logoURL) {
        setLinkRef('apple-touch-icon', newSettings.logoURL);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);`;

const result = content.replace(target, addition);
fs.writeFileSync('src/contexts/SchoolSettingsContext.tsx', result, 'utf8');
