document.addEventListener('DOMContentLoaded', function() {
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const mainMenu = document.getElementById('main-menu');
    menuToggleBtn.addEventListener('click', () => mainMenu.classList.add('menu-open'));
    closeMenuBtn.addEventListener('click', () => mainMenu.classList.remove('menu-open'));

    const gallery = document.querySelector('.wallpaper-gallery');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const pageTitle = document.getElementById('page-title');
    const itemsPerLoad = 30;

    let allWallpaperElements = [];
    let activeCategory = 'all-god';
    let visibleCount = 0;
    const likedItems = JSON.parse(localStorage.getItem('likedWallpapers')) || {};
    const downloadCounts = JSON.parse(localStorage.getItem('downloadCounts')) || {};

    function createWallpaperElement(data, iteration) {
        const uniqueId = `${data.id}-${iteration}`;
        const imageUrl = `${data.id}.jpg`;
        const container = document.createElement('div');
        container.className = 'wallpaper-container';
        container.dataset.id = uniqueId;
        container.dataset.category = data.cat;
        container.id = uniqueId;
        const isLiked = likedItems[uniqueId];
        const heartIconClass = isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        const likeCount = isLiked ? '1' : '0';
        const currentDownloadCount = downloadCounts[uniqueId] || 0;
        container.innerHTML = `
            <img src="${imageUrl}" alt="Wallpaper" loading="lazy">
            <div class="action-buttons">
                <button class="like-btn ${isLiked ? 'liked' : ''}"><i class="${heartIconClass}"></i><span class="like-count">${likeCount}</span></button>
                <button class="share-btn"><i class="fa-solid fa-share-nodes"></i></button>
                <button class="download-counter-btn" title="Downloads"><i class="fa-solid fa-circle-down"></i><span class="download-count">${currentDownloadCount}</span></button>
            </div>
            <a href="#" class="download-button" data-image-url="${imageUrl}" data-extra-link="${data.link}">Download</a>`;
        return container;
    }

    function generateWallpapers() {
        const totalWallpapers = 330;
        for (let i = 0; i < totalWallpapers; i++) {
            const data = wallpaperData[i % wallpaperData.length];
            const iteration = Math.floor(i / wallpaperData.length) + 1;
            const el = createWallpaperElement(data, iteration);
            gallery.appendChild(el);
        }
        allWallpaperElements = Array.from(gallery.querySelectorAll('.wallpaper-container'));
    }

    function filterAndDisplayWallpapers(scrollToId = null) {
        visibleCount = 0;
        let itemsShown = 0;
        const filteredWallpapers = allWallpaperElements.filter(w => w.dataset.category.includes(activeCategory));
        allWallpaperElements.forEach(w => w.classList.add('hidden'));
        let targetElement = null;
        if (scrollToId) {
            let targetIndex = -1;
            filteredWallpapers.forEach((w, index) => { if (w.id === scrollToId) targetIndex = index; });
            if (targetIndex !== -1) {
                const showUpToIndex = (Math.floor(targetIndex / itemsPerLoad) + 1) * itemsPerLoad;
                filteredWallpapers.forEach((w, index) => {
                    if (index < showUpToIndex) {
                        w.classList.remove('hidden');
                        itemsShown++;
                    }
                });
                targetElement = document.getElementById(scrollToId);
            }
        }
        if (!targetElement) {
            filteredWallpapers.forEach(w => {
                if (itemsShown < itemsPerLoad) {
                    w.classList.remove('hidden');
                    itemsShown++;
                }
            });
        }
        visibleCount = itemsShown;
        loadMoreBtn.classList.toggle('hidden', visibleCount >= filteredWallpapers.length);
        if (targetElement) {
            setTimeout(() => {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetElement.style.transition = 'box-shadow 0.3s';
                targetElement.style.boxShadow = '0 0 15px 5px rgba(0, 123, 255, 0.7)';
                setTimeout(() => { targetElement.style.boxShadow = '3px 3px 8px #888888'; }, 2500);
            }, 100);
        }
    }

    loadMoreBtn.addEventListener('click', () => {
        let itemsShown = 0;
        const filteredWallpapers = allWallpaperElements.filter(w => w.dataset.category.includes(activeCategory));
        filteredWallpapers.forEach(w => {
            if (w.classList.contains('hidden') && itemsShown < itemsPerLoad) {
                w.classList.remove('hidden');
                itemsShown++;
            }
        });
        visibleCount += itemsShown;
        loadMoreBtn.classList.toggle('hidden', visibleCount >= filteredWallpapers.length);
    });

    document.querySelectorAll('.category-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            activeCategory = e.target.dataset.category;
            pageTitle.textContent = e.target.textContent;
            mainMenu.classList.remove('menu-open');
            window.location.hash = '';
            filterAndDisplayWallpapers();
        });
    });

    gallery.addEventListener('click', async function(event) {
        const target = event.target.closest('button, a.download-button');
        if (!target) return;
        const container = target.closest('.wallpaper-container');
        if (!container) return;
        const wallpaperId = container.dataset.id;
        if (target.classList.contains('like-btn')) {
            const countSpan = target.querySelector('.like-count');
            const icon = target.querySelector('i');
            const isLiked = target.classList.toggle('liked');
            if (isLiked) {
                likedItems[wallpaperId] = true;
                countSpan.textContent = '1';
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
            } else {
                delete likedItems[wallpaperId];
                countSpan.textContent = '0';
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
            }
            localStorage.setItem('likedWallpapers', JSON.stringify(likedItems));
        }
        if (target.classList.contains('share-btn')) {
            const pageUrl = window.location.origin + window.location.pathname + '#' + wallpaperId;
            const shareData = { title: document.title, text: 'Check out this awesome wallpaper!', url: pageUrl };
            try {
                if (navigator.share) { await navigator.share(shareData); } 
                else {
                    navigator.clipboard.writeText(pageUrl).then(() => alert('Link Copied to Clipboard!')).catch(err => console.error('Failed to copy: ', err));
                }
            } catch (err) { console.error("Share failed:", err.message); }
        }
        if (target.matches('a.download-button')) {
            event.preventDefault();
            const currentCount = downloadCounts[wallpaperId] || 0;
            downloadCounts[wallpaperId] = currentCount + 1;
            localStorage.setItem('downloadCounts', JSON.stringify(downloadCounts));
            container.querySelector('.download-count').textContent = downloadCounts[wallpaperId];
            const imageUrl = target.dataset.imageUrl;
            const extraLink = target.dataset.extraLink;
            if (imageUrl) {
                const encodedImageUrl = encodeURIComponent(imageUrl);
                const encodedExtraLink = encodeURIComponent(extraLink);
                window.open(`timer.html?image=${encodedImageUrl}&redirect=${encodedExtraLink}`, '_blank');
            }
        }
    });
    
    function handleDeepLink() {
        if (window.location.hash) {
            const wallpaperId = window.location.hash.substring(1);
            const element = document.getElementById(wallpaperId);
            if(element) {
                const category = element.dataset.category.split(' ')[0];
                if (category !== 'all-god') {
                    activeCategory = category;
                    const catLink = document.querySelector(`.category-link[data-category="${category}"]`);
                    if(catLink) pageTitle.textContent = catLink.textContent;
                }
            }
        }
        filterAndDisplayWallpapers(window.location.hash.substring(1));
    }
    
    generateWallpapers();
    handleDeepLink();
});