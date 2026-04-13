// --- STATE MANAGEMENT ---
window.PocketReaderLogic = (function () {

    const state = {
        currentChapter: 1, // 1-based index
        fontSize: 18,
        theme: 'light',
        lang: 'en', // 'en', 'cn', 'id', or 'fr'
        scrollPos: 0
    };

    // --- DOM ELEMENTS ---
    const dom = {
        bookElement: document.getElementById('book'),
        readerContainer: document.getElementById('reader'),
        pageDisplay: document.getElementById('chapter-display'),
        prevBtn: document.getElementById('prev-btn'),
        nextBtn: document.getElementById('next-btn'),
        menuTag: document.getElementById('menu-tag'),
        settingsDrawer: document.getElementById('settings-drawer'),
        settingsOverlay: document.getElementById('settings-overlay'),
        closeSettings: document.getElementById('close-settings'),
        themeBtns: document.querySelectorAll('.theme-btn:not(.lang-btn)'), // Exclude lang buttons from theme logic
        langBtns: document.querySelectorAll('.lang-btn'),
        fontSlider: document.getElementById('font-size-slider'),
        tocList: document.getElementById('toc-list')
    };

    // --- INITIALIZATION ---
    function init() {
        // Initialize Analytics
        if (window.Analytics) {
            window.Analytics.init();
        }

        loadProgress();
        renderChapter('none'); // Initial render, no animation
        setupEventListeners();
        applyTheme(state.theme);
        applyFontSize(state.fontSize);
        updateLangBtns(state.lang); // Visual update
        buildTOC();

        // Track initial progress
        trackReadingProgress();

        console.log("Pocket Reader Initialized (Slide Engine + i18n)");
    }

    // --- ANALYTICS HELPER ---
    function trackReadingProgress() {
        if (!window.Analytics) return;

        const total = PocketReader.bookContent.length;
        if (total === 0) return;

        // Track specific chapter view for advanced analytics (Time on Page, Path, etc.)
        // Logic will handle percentage calculation internally
        window.Analytics.trackView(state.currentChapter, total);
    }

    // --- RENDER LOGIC (SLIDE SYSTEM) ---
    function renderChapter(direction) {
        const bookContent = PocketReader.bookContent;
        const chapterIndex = state.currentChapter - 1;
        const chapterData = bookContent[chapterIndex];

        if (!chapterData) return;

        // Track progress whenever we render a new chapter
        trackReadingProgress();

        // Determine Content Language
        let title, content;
        if (state.lang === 'cn') {
            title = chapterData.title_cn || chapterData.title;
            content = chapterData.content_cn || chapterData.content;
        } else if (state.lang === 'id') {
            title = chapterData.title_id || chapterData.title;
            content = chapterData.content_id || chapterData.content;
        } else if (state.lang === 'fr') {
            title = chapterData.title_fr || chapterData.title;
            content = chapterData.content_fr || chapterData.content;
        } else {
            title = chapterData.title;
            content = chapterData.content;
        }

        // --- PARAGRAPH PROCESSING ---
        // Convert double newlines to <p> tags, and single newlines to <br> if they exist
        // This ensures the raw text data is properly organized for HTML rendering
        if (content) {
            // Check if content is already HTML (starts with <)
            if (content.trim().startsWith('<')) {
                // Do nothing, assume pre-formatted HTML
            } else {
                // Convert raw text: double newlines to <p>, single to <br>
                content = content
                    .replace(/\r\n/g, '\n') // Normalize CRLF to LF
                    .split(/\n\n+/) // Split by 2 or more newlines
                    .map(para => para.trim())
                    .filter(para => para.length > 0)
                    .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
                    .join('');
            }
        }

        // 1. Create new page element
        const pageDiv = document.createElement('div');
        pageDiv.classList.add('page');

        // 2. Add animation class based on direction
        if (direction === 'next') {
            pageDiv.classList.add('slide-next');
        } else if (direction === 'prev') {
            pageDiv.classList.add('slide-prev');
        }

        // 2b. Check if Cover
        if (title === 'COVER') {
            pageDiv.classList.add('page-cover');
        }

        // 3. Inject Content
        pageDiv.innerHTML = `
        <div class="page-content">
            <div class="page-header">
                ${chapterData.cover && state.currentChapter === 1 ? `<img src="${chapterData.cover}" class="cover-img" alt="Cover">` : ''}
                <h1>${title}</h1>
            </div>
            <div class="page-text">
                ${content}
            </div>
            <div class="page-footer">
                ${state.currentChapter} / ${bookContent.length}
            </div>
        </div>
    `;

        // 4. Update DOM
        dom.bookElement.innerHTML = ''; // Clear previous
        dom.bookElement.appendChild(pageDiv);

        // 5. Update UI
        updateDisplay();
        // Scroll to top of window for Full Width layout
        window.scrollTo(0, 0);
    }

    // --- STATE ACTIONS ---
    function nextChapter() {
        const total = PocketReader.bookContent.length;
        if (state.currentChapter < total) {
            state.currentChapter++;
            renderChapter('next');
            saveProgress();
        }
    }

    function prevChapter() {
        if (state.currentChapter > 1) {
            state.currentChapter--;
            renderChapter('prev');
            saveProgress();
        }
    }

    function jumpToChapter(index) {
        const oldIndex = state.currentChapter;
        state.currentChapter = index;
        const direction = index > oldIndex ? 'next' : 'prev';
        renderChapter(direction);
        saveProgress();
        closeMenu();
    }

    function setLanguage(lang) {
        if (state.lang === lang) return;
        state.lang = lang;
        updateLangBtns(lang);
        renderChapter('none'); // Re-render current chapter in new language
        buildTOC(); // Re-build TOC in new language
        saveProgress();
    }

    // --- CORE FUNCTIONS ---

    function updateDisplay() {
        const bookContent = PocketReader.bookContent;
        // Localized Title from Data
        const chapterData = bookContent[state.currentChapter - 1];
        let partLabel;
        if (state.lang === 'cn') {
            partLabel = chapterData.title_cn || chapterData.title;
        } else if (state.lang === 'id') {
            partLabel = chapterData.title_id || chapterData.title;
        } else if (state.lang === 'fr') {
            partLabel = chapterData.title_fr || chapterData.title;
        } else {
            partLabel = chapterData.title;
        }
        dom.pageDisplay.textContent = partLabel;

        const total = bookContent.length;
        dom.prevBtn.style.opacity = state.currentChapter === 1 ? '0.3' : '1';
        dom.prevBtn.disabled = state.currentChapter === 1;

        dom.nextBtn.style.opacity = state.currentChapter === total ? '0.3' : '1';
        dom.nextBtn.disabled = state.currentChapter === total;

        // Update Active TOC
        const tocItems = document.querySelectorAll('.toc-list li');
        tocItems.forEach((item, idx) => {
            if (idx === state.currentChapter - 1) item.classList.add('active');
            else item.classList.remove('active');
        });
    }

    function loadProgress() {
        const saved = localStorage.getItem('pocketReaderProgress');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                state.currentChapter = parsed.currentChapter || 1;
                state.fontSize = parsed.fontSize || 18;
                state.theme = parsed.theme || 'light';
                state.lang = parsed.lang || 'en'; // Default to EN

                dom.fontSlider.value = state.fontSize;
                updateThemeBtns(state.theme);
            } catch (e) {
                console.error("Save file corrupted, resetting.");
            }
        }
    }

    function saveProgress() {
        const safeState = {
            currentChapter: state.currentChapter,
            fontSize: state.fontSize,
            theme: state.theme,
            lang: state.lang
        };
        localStorage.setItem('pocketReaderProgress', JSON.stringify(safeState));
    }

    function applyTheme(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        state.theme = themeName;
        updateThemeBtns(themeName);
        saveProgress();
    }

    function updateThemeBtns(activeTheme) {
        dom.themeBtns.forEach(btn => {
            if (btn.dataset.theme === activeTheme) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }

    function updateLangBtns(activeLang) {
        dom.langBtns.forEach(btn => {
            if (btn.dataset.lang === activeLang) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }

    function applyFontSize(size) {
        // Set global CSS variable on Root for persistence across chapter renders
        document.documentElement.style.setProperty('--dynamic-font-size', `${size}px`);
        state.fontSize = size;
        saveProgress();
    }

    function buildTOC() {
        const bookContent = PocketReader.bookContent;
        dom.tocList.innerHTML = '';

        bookContent.forEach((chapter, index) => {
            if (chapter.isChapterStart) {
                const li = document.createElement('li');
                // Use localized title
                let title;
                if (state.lang === 'cn') {
                    title = chapter.title_cn || chapter.title;
                } else if (state.lang === 'id') {
                    title = chapter.title_id || chapter.title;
                } else if (state.lang === 'fr') {
                    title = chapter.title_fr || chapter.title;
                } else {
                    title = chapter.title;
                }
                li.textContent = title;

                li.addEventListener('click', () => jumpToChapter(index + 1));
                dom.tocList.appendChild(li);
            }
        });
    }

    // --- EVENTS ---

    function setupEventListeners() {
        // Nav
        dom.prevBtn.addEventListener('click', prevChapter);
        dom.nextBtn.addEventListener('click', nextChapter);

        // Keyboard Nav
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') nextChapter();
            if (e.key === 'ArrowLeft') prevChapter();
        });

        // Settings
        function openMenu() {
            dom.settingsDrawer.classList.add('open');
            dom.settingsOverlay.classList.add('visible');
        }

        // Global close menu function for reuse
        window.closeMenu = function () {
            dom.settingsDrawer.classList.remove('open');
            dom.settingsOverlay.classList.remove('visible');
        }

        dom.menuTag.addEventListener('click', openMenu);
        dom.closeSettings.addEventListener('click', closeMenu);
        dom.settingsOverlay.addEventListener('click', closeMenu);

        // Theme & Font
        dom.themeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => applyTheme(e.target.dataset.theme));
        });

        // Lang
        dom.langBtns.forEach(btn => {
            btn.addEventListener('click', (e) => setLanguage(e.target.dataset.lang));
        });

        dom.fontSlider.addEventListener('input', (e) => {
            applyFontSize(e.target.value);
        });
    }

    return { init };
})();

// document.addEventListener('DOMContentLoaded', init); // Moved to Gatekeeper
