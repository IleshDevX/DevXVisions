document.addEventListener('DOMContentLoaded', () => {
    // Global variables
    let currentImageIndex = 0;
    let filteredImages = [];
    let slideshowInterval = null;
    let isSlideshowActive = false;
    let currentFilter = 'all';
    let currentSort = 'newest';

    // DOM elements - with proper null checks
    const galleryItems = document.querySelectorAll('.gallery-item');
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalLikes = document.getElementById('modalLikes');
    const currentImageIndexSpan = document.getElementById('currentImageIndex');
    const totalImagesSpan = document.getElementById('totalImages');
    const closeModal = document.getElementById('closeModal');
    const prevImage = document.getElementById('prevImage');
    const nextImage = document.getElementById('nextImage');
    const searchInput = document.getElementById('searchInput');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    const slideshowBtn = document.getElementById('slideshowBtn');
    const slideshowControls = document.getElementById('slideshowControls');
    const pauseSlideshow = document.getElementById('pauseSlideshow');
    const stopSlideshow = document.getElementById('stopSlideshow');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const loadingIndicator = document.getElementById('loadingIndicator');

    // Initialize
    filteredImages = Array.from(galleryItems);
    updateImageCounter();
    initializeLazyLoading();
    initializeHeroButtons();
    initializeContactForm();
    initializeInfiniteScroll();
    initializeFiltering();
    initializeMobileMenu(); // Add this initialization

    // Stats Animation
    function animateStat(id, endValue, duration = 1500, suffix = "") {
        const el = document.getElementById(id);
        if (!el) return;
        let start = 0;
        let startTimestamp = null;
        const isK = /K\+?$/.test(endValue);
        const isM = /M\+?$/.test(endValue);
        let numericEnd = parseFloat(endValue);
        if (isK) numericEnd *= 1000;
        if (isM) numericEnd *= 1000000;
        function step(timestamp) {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            let value = Math.floor(progress * numericEnd);
            if (isK) value = Math.floor(value / 1000) + (suffix || "K+");
            else if (isM) value = Math.floor(value / 1000000) + (suffix || "M+");
            else value = value + (suffix || "");
            el.textContent = progress < 1 ? value : endValue;
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }
        requestAnimationFrame(step);
    }

    function animateStats() {
        animateStat("stat-photos", "500+", 1200, "+");
        animateStat("stat-categories", "50+", 1200, "+");
        animateStat("stat-downloads", "10K+", 1200, "K+");
        // 24/7 is not a number, so skip animation
    }
    animateStats();

    // Mobile Menu Functionality - Fixed
    function initializeMobileMenu() {
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                mobileMenu.classList.toggle('active');
                
                // Toggle hamburger icon animation
                const icon = mobileMenuBtn.querySelector('svg');
                if (mobileMenu.classList.contains('active')) {
                    // Change to X icon
                    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
                } else {
                    // Change back to hamburger
                    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>';
                }
            });

            // Close mobile menu when clicking on navigation links
            const mobileNavLinks = mobileMenu.querySelectorAll('a[href^="#"]');
            mobileNavLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.remove('active');
                    // Reset hamburger icon
                    const icon = mobileMenuBtn.querySelector('svg');
                    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>';
                });
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
                    mobileMenu.classList.remove('active');
                    // Reset hamburger icon
                    const icon = mobileMenuBtn.querySelector('svg');
                    if (icon) {
                        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>';
                    }
                }
            });

            // Close mobile menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
                    mobileMenu.classList.remove('active');
                    const icon = mobileMenuBtn.querySelector('svg');
                    if (icon) {
                        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>';
                    }
                }
            });
        }
    }

    // Search functionality
    function performSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (searchTerm === '') {
            // If search is empty, reset to current filter
            applyCurrentFilter();
            return;
        }
        
        // Get all items and filter by search term
        const allItems = Array.from(galleryItems);
        const searchResults = allItems.filter(item => {
            const title = item.dataset.title.toLowerCase();
            const description = item.dataset.description.toLowerCase();
            const category = item.dataset.category.toLowerCase();
            return title.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm);
        });
        
        // Hide all items first
        galleryItems.forEach(item => {
            item.style.display = 'none';
            item.style.opacity = '0';
        });

        // Show search results with animation
        searchResults.forEach((item, index) => {
            setTimeout(() => {
                item.style.display = 'block';
                item.style.opacity = '1';
            }, index * 50);
        });

        // Update filtered images array
        filteredImages = searchResults;
        updateImageCounter();
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => performSearch(e.target.value));
    }
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', (e) => performSearch(e.target.value));
    }

    // Filter functionality
    function initializeFiltering() {
        // Category cards functionality
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const category = card.dataset.category;
                setActiveFilter(category);
                applyCurrentFilter();
                
                // Scroll to gallery
                setTimeout(() => {
                    const gallerySection = document.getElementById('gallery');
                    if (gallerySection) {
                        gallerySection.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);
            });
        });
    }

    function setActiveFilter(category) {
        // Update category cards
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach(c => c.classList.remove('active'));
        const correspondingCard = Array.from(categoryCards).find(card => card.dataset.category === category);
        if (correspondingCard) {
            correspondingCard.classList.add('active');
        }
        
        currentFilter = category;
    }

    function applyCurrentFilter() {
        // Get all gallery items (not just filtered ones)
        const allItems = Array.from(galleryItems);
        let items = allItems;
        
        // Apply category filter
        if (currentFilter !== 'all') {
            items = allItems.filter(item => {
                const itemCategory = item.dataset.category;
                return itemCategory === currentFilter;
            });
        }

        // Hide all items first
        galleryItems.forEach(item => {
            item.style.display = 'none';
            item.style.opacity = '0';
        });

        // Show filtered items with animation
        items.forEach((item, index) => {
            setTimeout(() => {
                item.style.display = 'block';
                item.style.opacity = '1';
            }, index * 50);
        });

        // Update filtered images array for modal navigation
        filteredImages = items;
        updateImageCounter();
        
        // Reset current image index if it's out of bounds
        if (currentImageIndex >= filteredImages.length) {
            currentImageIndex = 0;
        }
    }

    // Modal functionality
    function showModal(index) {
        const item = filteredImages[index];
        if (!item || !modal) return;

        currentImageIndex = index;
        const img = item.querySelector('img');
        if (modalImage && img) modalImage.src = img.src;
        if (modalTitle) modalTitle.textContent = item.dataset.title;
        if (modalDescription) modalDescription.textContent = item.dataset.description;
        if (modalLikes) modalLikes.textContent = item.dataset.likes;
        
        updateImageCounter();
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function hideModal() {
        if (!modal) return;
        modal.style.display = 'none';
        if (modalImage) modalImage.src = '';
        document.body.style.overflow = 'auto';
        stopSlideshowFunction();
    }

    function updateImageCounter() {
        if (currentImageIndexSpan) currentImageIndexSpan.textContent = currentImageIndex + 1;
        if (totalImagesSpan) totalImagesSpan.textContent = filteredImages.length;
    }

    // Gallery item clicks
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            const globalIndex = filteredImages.indexOf(item);
            if (globalIndex !== -1) {
                showModal(globalIndex);
            }
        });

        // Like functionality
        const likeBtn = item.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                likeBtn.classList.toggle('liked');
                const currentLikes = parseInt(likeBtn.dataset.likes);
                const newLikes = likeBtn.classList.contains('liked') ? currentLikes + 1 : currentLikes - 1;
                likeBtn.dataset.likes = newLikes;
                likeBtn.innerHTML = `<i class="fas fa-heart"></i> ${newLikes}`;
            });
        }

        // Share functionality
        const shareBtn = item.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (navigator.share) {
                    navigator.share({
                        title: item.dataset.title,
                        text: item.dataset.description,
                        url: window.location.href
                    });
                } else {
                    // Fallback: copy to clipboard
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                }
            });
        }

        // Download functionality
        const downloadBtn = item.querySelector('.download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const img = item.querySelector('img');
                const link = document.createElement('a');
                link.href = img.src;
                link.download = `${item.dataset.title}.jpg`;
                link.click();
            });
        }
    });

    // Modal controls
    if (closeModal) {
        closeModal.addEventListener('click', hideModal);
    }
    
    if (prevImage) {
        prevImage.addEventListener('click', () => {
            currentImageIndex = currentImageIndex > 0 ? currentImageIndex - 1 : filteredImages.length - 1;
            showModal(currentImageIndex);
        });
    }
    
    if (nextImage) {
        nextImage.addEventListener('click', () => {
            currentImageIndex = currentImageIndex < filteredImages.length - 1 ? currentImageIndex + 1 : 0;
            showModal(currentImageIndex);
        });
    }

    // Modal like functionality
    const modalLikeBtn = document.getElementById('modalLikeBtn');
    if (modalLikeBtn) {
        modalLikeBtn.addEventListener('click', () => {
            modalLikeBtn.classList.toggle('liked');
            const currentLikes = parseInt(modalLikes.textContent);
            const newLikes = modalLikeBtn.classList.contains('liked') ? currentLikes + 1 : currentLikes - 1;
            modalLikes.textContent = newLikes;
            
            // Update the original item
            const currentItem = filteredImages[currentImageIndex];
            const originalLikeBtn = currentItem.querySelector('.like-btn');
            originalLikeBtn.dataset.likes = newLikes;
            originalLikeBtn.innerHTML = `<i class="fas fa-heart"></i> ${newLikes}`;
        });
    }

    // Modal share functionality
    const modalShareBtn = document.getElementById('modalShareBtn');
    if (modalShareBtn) {
        modalShareBtn.addEventListener('click', () => {
            const currentItem = filteredImages[currentImageIndex];
            if (navigator.share) {
                navigator.share({
                    title: currentItem.dataset.title,
                    text: currentItem.dataset.description,
                    url: window.location.href
                });
            } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        });
    }

    // Modal download functionality
    const modalDownloadBtn = document.getElementById('modalDownloadBtn');
    if (modalDownloadBtn) {
        modalDownloadBtn.addEventListener('click', () => {
            const currentItem = filteredImages[currentImageIndex];
            const link = document.createElement('a');
            link.href = modalImage.src;
            link.download = `${currentItem.dataset.title}.jpg`;
            link.click();
        });
    }

    // Slideshow functionality
    if (slideshowBtn) {
        slideshowBtn.addEventListener('click', startSlideshow);
    }

    function startSlideshow() {
        if (filteredImages.length === 0) return;
        
        isSlideshowActive = true;
        if (slideshowControls) slideshowControls.classList.add('active');
        if (slideshowBtn) slideshowBtn.style.display = 'none';
        
        // Start with first image
        showModal(0);
        
        slideshowInterval = setInterval(() => {
            currentImageIndex = (currentImageIndex + 1) % filteredImages.length;
            showModal(currentImageIndex);
        }, 3000);
    }

    function stopSlideshowFunction() {
        isSlideshowActive = false;
        if (slideshowControls) slideshowControls.classList.remove('active');
        if (slideshowBtn) slideshowBtn.style.display = 'block';
        
        if (slideshowInterval) {
            clearInterval(slideshowInterval);
            slideshowInterval = null;
        }
    }

    if (pauseSlideshow) {
        pauseSlideshow.addEventListener('click', () => {
            if (slideshowInterval) {
                clearInterval(slideshowInterval);
                slideshowInterval = null;
                pauseSlideshow.innerHTML = '<i class="fas fa-play mr-2"></i>Resume';
            } else {
                slideshowInterval = setInterval(() => {
                    currentImageIndex = (currentImageIndex + 1) % filteredImages.length;
                    showModal(currentImageIndex);
                }, 3000);
                pauseSlideshow.innerHTML = '<i class="fas fa-pause mr-2"></i>Pause';
            }
        });
    }

    if (stopSlideshow) {
        stopSlideshow.addEventListener('click', stopSlideshowFunction);
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (modal && modal.style.display === 'flex') {
            switch (e.key) {
                case 'Escape':
                    hideModal();
                    break;
                case 'ArrowLeft':
                    if (prevImage) prevImage.click();
                    break;
                case 'ArrowRight':
                    if (nextImage) nextImage.click();
                    break;
                case ' ':
                    e.preventDefault();
                    if (isSlideshowActive && pauseSlideshow) {
                        pauseSlideshow.click();
                    }
                    break;
            }
        }
    });

    // Close modal by clicking outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal();
            }
        });
    }

    // Lazy loading
    function initializeLazyLoading() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        }
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Parallax effect
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.parallax-bg');
        if (parallax) {
            parallax.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });

    // Loading simulation
    if (loadingIndicator) {
        setTimeout(() => {
            loadingIndicator.style.display = 'none';
        }, 1000);
    }

    // Hero Button Handlers
    function initializeHeroButtons() {
        const exploreGalleryBtn = document.getElementById('exploreGalleryBtn');
        const browseCategoriesBtn = document.getElementById('browseCategoriesBtn');
        const startSlideshowBtn = document.getElementById('startSlideshowBtn');

        if (exploreGalleryBtn) {
            exploreGalleryBtn.addEventListener('click', () => {
                const gallery = document.getElementById('gallery');
                if (gallery) gallery.scrollIntoView({ behavior: 'smooth' });
            });
        }

        if (browseCategoriesBtn) {
            browseCategoriesBtn.addEventListener('click', () => {
                const gallery = document.getElementById('gallery');
                if (gallery) gallery.scrollIntoView({ behavior: 'smooth' });
            });
        }

        if (startSlideshowBtn) {
            startSlideshowBtn.addEventListener('click', () => {
                startSlideshow();
            });
        }
    }

    // Contact Form Handler
    function initializeContactForm() {
        const contactForm = document.getElementById('contactForm');

        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handleContactSubmission();
            });
        }
    }

    function handleContactSubmission() {
        const form = document.getElementById('contactForm');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Show loading state
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';
            submitBtn.disabled = true;
        }

        // Simulate form submission
        setTimeout(() => {
            alert('Message sent successfully! We\'ll get back to you within 24 hours.');
            form.reset();
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Send Message';
                submitBtn.disabled = false;
            }
        }, 2000);
    }

    // Infinite Scroll
    function initializeInfiniteScroll() {
        let isLoading = false;
        let currentPage = 1;
        const itemsPerPage = 9;

        // Create intersection observer for infinite scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !isLoading) {
                    loadMoreImages();
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '100px'
        });

        // Add observer to the last gallery item
        const lastItem = galleryItems[galleryItems.length - 1];
        if (lastItem) {
            observer.observe(lastItem);
        }
    }

    function loadMoreImages() {
        if (isLoading) return;
        
        isLoading = true;
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'col-span-full flex justify-center py-8';
        loadingDiv.innerHTML = '<div class="spinner"></div>';
        
        const galleryGrid = document.getElementById('galleryGrid');
        if (galleryGrid) {
            galleryGrid.appendChild(loadingDiv);

            // Simulate loading more images
            setTimeout(() => {
                // Remove loading indicator
                loadingDiv.remove();
                
                // Add more images (in a real app, these would come from an API)
                addMoreGalleryItems();
                isLoading = false;
            }, 1500);
        }
    }

    function addMoreGalleryItems() {
        const galleryGrid = document.getElementById('galleryGrid');
        if (!galleryGrid) return;
        
        const newImages = [
            {
                src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
                title: 'Mountain Vista',
                description: 'Breathtaking mountain landscape at sunset',
                category: 'landscape',
                likes: 89,
                downloads: 67
            },
            {
                src: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
                title: 'Ocean Waves',
                description: 'Powerful waves crashing against rocky shores',
                category: 'water',
                likes: 156,
                downloads: 98
            },
            {
                src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
                title: 'Forest Path',
                description: 'Mystical forest trail leading into the unknown',
                category: 'nature',
                likes: 203,
                downloads: 145
            }
        ];

        newImages.forEach((imageData, index) => {
            const galleryItem = createGalleryItem(imageData, galleryItems.length + index);
            galleryGrid.appendChild(galleryItem);
            Array.prototype.push.call(galleryItems, galleryItem);
        });

        // Update filtered images array
        filteredImages = Array.from(galleryItems);
        updateImageCounter();
    }

    function createGalleryItem(imageData, index) {
        const item = document.createElement('div');
        item.className = 'gallery-item group relative overflow-hidden rounded-lg cursor-pointer shadow-lg';
        item.setAttribute('data-category', imageData.category);
        item.setAttribute('data-title', imageData.title);
        item.setAttribute('data-description', imageData.description);
        item.setAttribute('data-date', new Date().toISOString().split('T')[0]);
        item.setAttribute('data-likes', imageData.likes);
        item.setAttribute('data-downloads', imageData.downloads);

        item.innerHTML = `
            <img src="${imageData.src}" 
                 alt="${imageData.description} - ${imageData.title} photography" 
                 class="w-full h-full object-cover transform group-hover:scale-110 transition duration-500 ease-in-out"
                 loading="lazy">
            <div class="overlay">
                <div class="overlay-content">
                    <div class="flex items-center space-x-2">
                        <span class="bg-${getCategoryColor(imageData.category)}-600 text-white px-2 py-1 rounded-full text-xs font-medium">${imageData.category.charAt(0).toUpperCase() + imageData.category.slice(1)}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="like-btn text-white hover:text-red-500" data-likes="${imageData.likes}">
                            <i class="fas fa-heart"></i> ${imageData.likes}
                        </button>
                    </div>
                </div>
                <div class="overlay-bottom">
                    <div>
                        <h3 class="text-white text-xl font-bold">${imageData.title}</h3>
                        <p class="text-gray-300 text-sm">${imageData.description}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button class="share-btn text-white hover:text-blue-400">
                            <i class="fas fa-share"></i>
                        </button>
                        <button class="download-btn text-white hover:text-green-400">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for the new item
        addGalleryItemListeners(item);

        return item;
    }

    function addGalleryItemListeners(item) {
        // Main click event
        item.addEventListener('click', () => {
            const globalIndex = filteredImages.indexOf(item);
            if (globalIndex !== -1) {
                showModal(globalIndex);
            }
        });

        // Like functionality
        const likeBtn = item.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                likeBtn.classList.toggle('liked');
                const currentLikes = parseInt(likeBtn.dataset.likes);
                const newLikes = likeBtn.classList.contains('liked') ? currentLikes + 1 : currentLikes - 1;
                likeBtn.dataset.likes = newLikes;
                likeBtn.innerHTML = `<i class="fas fa-heart"></i> ${newLikes}`;
            });
        }

        // Share functionality
        const shareBtn = item.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (navigator.share) {
                    navigator.share({
                        title: item.dataset.title,
                        text: item.dataset.description,
                        url: window.location.href
                    });
                } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                }
            });
        }

        // Download functionality
        const downloadBtn = item.querySelector('.download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const img = item.querySelector('img');
                const link = document.createElement('a');
                link.href = img.src;
                link.download = `${item.dataset.title}.jpg`;
                link.click();
            });
        }
    }

    function getCategoryColor(category) {
        const colors = {
            landscape: 'orange',
            nature: 'green',
            water: 'blue',
            wildlife: 'purple',
            urban: 'gray',
            portrait: 'pink',
            macro: 'yellow',
            other: 'indigo'
        };
        return colors[category] || 'gray';
    }

    // Enhanced animations and micro-interactions
    function initializeMicroInteractions() {
        // Add stagger animation to gallery items
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 100);
                }
            });
        }, observerOptions);

        galleryItems.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(30px)';
            item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(item);
        });
    }

    // Initialize micro-interactions
    initializeMicroInteractions();

    console.log('DevXVisions Gallery initialized successfully!');
});