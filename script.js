document.addEventListener('DOMContentLoaded', function () {
    // --- Element Selections ---
    const siteHeader = document.getElementById('site-header');
    const logoBtn = document.getElementById('logo-btn');
    const sidebar = document.getElementById('sidebar');
    const backdropOverlay = document.getElementById('backdrop-overlay');
    const heroSearchInput = document.getElementById('hero-search-input');
    const heroSearchBtn = document.getElementById('hero-search-btn');
    const heroSuggestionsBox = document.getElementById('hero-suggestions');
    const panels = document.querySelectorAll('.panel');
    const sidebarLinks = document.querySelectorAll('.sidebar-content ul li a');
    const closeButtons = document.querySelectorAll('.close-btn');
    const heroButton = document.querySelector('.hero-button');
    const schemesSection = document.getElementById('schemes-section');
    const backToHeroBtn = document.getElementById('back-to-hero-btn');
    const schemeSearchInput = document.getElementById('scheme-search-input');
    const schemeSuggestionsBox = document.getElementById('scheme-suggestions');
    const schemeCategories = document.querySelectorAll('.scheme-category');
    const noResultsMessage = document.getElementById('no-results-message');
    const allSchemeCards = document.querySelectorAll('.scheme-card');

    let activePanel = null; 

    // --- Data Source for Search ---
    const allSchemes = Array.from(allSchemeCards).map(card => {
        return {
            title: card.querySelector('h3').textContent,
            keywords: (card.dataset.keywords || '') + ' ' + card.querySelector('p').textContent
        };
    });
    const allSchemeTitles = allSchemes.map(s => s.title);

    // --- Levenshtein Distance Function for Fuzzy Search ---
    const levenshtein = (a, b) => {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = [];
        for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
        for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
                }
            }
        }
        return matrix[b.length][a.length];
    };

    // --- Reusable Functions ---
    const openSchemesPanel = () => {
        schemesSection.classList.add('active');
        siteHeader.classList.add('schemes-view-active');
        document.body.classList.add('no-scroll');
    };

    const closeSchemesPanel = () => {
        schemesSection.classList.remove('active');
        siteHeader.classList.remove('schemes-view-active');
        document.body.classList.remove('no-scroll');
    };

    const filterSchemes = (searchTerm) => {
        let totalVisibleCards = 0;
        const searchWords = searchTerm.split(' ').filter(w => w.length > 0);

        schemeCategories.forEach(category => {
            let categoryHasVisibleCards = false;
            const cardsInCategory = category.querySelectorAll('.scheme-card');
            
            cardsInCategory.forEach(card => {
                const cardTitle = card.querySelector('h3').textContent.toLowerCase();
                const cardText = card.textContent.toLowerCase();
                
                let isMatch = false;
                if (!searchTerm) {
                    isMatch = true;
                } else {
                    // Check if any search word is a substring or close in spelling
                    isMatch = searchWords.some(word => 
                        cardText.includes(word) || levenshtein(word, cardTitle.split(' ')[0]) < 2
                    );
                }

                card.style.display = isMatch ? 'flex' : 'none';
                if (isMatch) {
                    categoryHasVisibleCards = true;
                    totalVisibleCards++;
                }
            });
            category.style.display = categoryHasVisibleCards ? 'block' : 'none';
        });
        noResultsMessage.style.display = totalVisibleCards === 0 ? 'block' : 'none';
    };

    const updateSuggestions = (input, suggestionsBox) => {
        const searchTerm = input.value.toLowerCase();
        suggestionsBox.querySelector('ul').innerHTML = '';
        if (!searchTerm) {
            suggestionsBox.style.display = 'none';
            return;
        }

        const suggestions = allSchemeTitles.filter(title => 
            title.toLowerCase().includes(searchTerm) || levenshtein(searchTerm, title.toLowerCase().split(' ')[0]) < 2
        ).slice(0, 5); // Limit to 5 suggestions

        if (suggestions.length > 0) {
            suggestions.forEach(title => {
                const li = document.createElement('li');
                li.textContent = title;
                suggestionsBox.querySelector('ul').appendChild(li);
            });
            suggestionsBox.style.display = 'block';
        } else {
            suggestionsBox.style.display = 'none';
        }
    };
    
    // --- Sidebar and Right Panel Logic ---
    const closeAllSidePanels = () => {
        sidebar.classList.remove('active');
        panels.forEach(p => p.classList.remove('active'));
        activePanel = null;
        backdropOverlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
    };
    
    const openSidebar = () => {
        closeAllSidePanels();
        sidebar.classList.add('active');
        activePanel = 'sidebar';
        backdropOverlay.classList.add('active');
        document.body.classList.add('no-scroll');
    };

    const openPanel = (panelId) => {
        panels.forEach(p => {
            if(p.id !== panelId) p.classList.remove('active');
        });
        const panelToOpen = document.getElementById(panelId);
        if (panelToOpen) {
            panelToOpen.classList.add('active');
            activePanel = panelId;
            backdropOverlay.classList.add('active'); 
            document.body.classList.add('no-scroll');
        }
    };
    
    // --- Event Listeners ---

    logoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (schemesSection.classList.contains('active')) closeSchemesPanel();
        else if (sidebar.classList.contains('active') || activePanel) closeAllSidePanels();
        else openSidebar();
    });
    
    heroButton.addEventListener('click', () => {
        openSchemesPanel();
        schemeSearchInput.value = '';
        filterSchemes('');
    });

    heroSearchBtn.addEventListener('click', () => {
        const searchTerm = heroSearchInput.value.toLowerCase();
        openSchemesPanel();
        schemeSearchInput.value = heroSearchInput.value;
        filterSchemes(searchTerm);
        heroSuggestionsBox.style.display = 'none';
    });

    backToHeroBtn.addEventListener('click', closeSchemesPanel);

    heroSearchInput.addEventListener('input', () => updateSuggestions(heroSearchInput, heroSuggestionsBox));
    schemeSearchInput.addEventListener('input', (e) => {
        updateSuggestions(schemeSearchInput, schemeSuggestionsBox);
        filterSchemes(e.target.value.toLowerCase());
    });


    heroSuggestionsBox.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            heroSearchInput.value = e.target.textContent;
            heroSuggestionsBox.style.display = 'none';
            heroSearchBtn.click();
        }
    });

    schemeSuggestionsBox.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            schemeSearchInput.value = e.target.textContent;
            schemeSuggestionsBox.style.display = 'none';
            filterSchemes(e.target.textContent.toLowerCase());
        }
    });

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.stopPropagation();
            openPanel(e.currentTarget.getAttribute('data-panel'));
        });
    });

    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (btn.id === 'close-sidebar-btn') closeAllSidePanels();
            else { 
                const panelToClose = document.getElementById(e.currentTarget.getAttribute('data-panel'));
                if (panelToClose) {
                    panelToClose.classList.remove('active');
                    activePanel = 'sidebar';
                }
            }
        });
    });

    backdropOverlay.addEventListener('click', () => {
        if(activePanel && activePanel !== 'sidebar'){
            document.getElementById(activePanel).classList.remove('active');
            activePanel = 'sidebar';
        } else { 
            closeAllSidePanels();
        }
    });

    document.addEventListener('click', (e) => {
        if (!heroSearchInput.parentElement.contains(e.target)) heroSuggestionsBox.style.display = 'none';
        if (!schemeSearchInput.parentElement.contains(e.target)) schemeSuggestionsBox.style.display = 'none';
    });

    document.querySelectorAll('.sidebar, .panel').forEach(el => {
        el.addEventListener('click', e => e.stopPropagation());
    });
});
