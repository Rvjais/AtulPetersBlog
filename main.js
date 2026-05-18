// Blog functionality

// Category display names with icons
const categoryNames = {
    'bariatric': { name: 'Bariatric Surgery', icon: 'fa-procedures' },
    'diabetes': { name: 'Diabetes', icon: 'fa-tint' },
    'obesity': { name: 'Obesity', icon: 'fa-weight' },
    'nutrition': { name: 'Nutrition & Diet', icon: 'fa-carrot' },
    'lifestyle': { name: 'Lifestyle & Exercise', icon: 'fa-running' },
    'heart': { name: 'Heart Health', icon: 'fa-heart' },
    'health': { name: 'General Health', icon: 'fa-stethoscope' }
};

// State
let currentPage = 1;
const postsPerPage = 12;
let filteredPosts = [...postsData];
let currentCategory = '';
let searchQuery = '';

// DOM elements
const blogGrid = document.getElementById('blogGrid');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const tagsCloud = document.getElementById('tagsCloud');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderTagsCloud();
    renderBlogPosts();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Search input
    searchInput?.addEventListener('input', debounce(handleSearch, 300));

    // Category filter dropdown
    categoryFilter?.addEventListener('change', handleCategoryChange);
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Handle search
function handleSearch(e) {
    searchQuery = e.target.value.toLowerCase().trim();
    currentPage = 1;
    applyFilters();
}

// Handle category change from dropdown
function handleCategoryChange(e) {
    currentCategory = e.target.value;
    currentPage = 1;
    applyFilters();
}

// Filter by category (from category cards or tags)
function filterByCategory(category) {
    currentCategory = category;
    if (categoryFilter) categoryFilter.value = category;
    searchInput.value = '';
    searchQuery = '';
    currentPage = 1;
    applyFilters();
}

// Apply all filters
function applyFilters() {
    filteredPosts = postsData.filter(post => {
        // Category filter
        if (currentCategory && post.category !== currentCategory) {
            return false;
        }

        // Search filter
        if (searchQuery) {
            const searchable = (post.title + ' ' + post.excerpt).toLowerCase();
            if (!searchable.includes(searchQuery)) {
                return false;
            }
        }

        return true;
    });

    renderBlogPosts();
}

// Render tags cloud in sidebar
function renderTagsCloud() {
    if (!tagsCloud) return;

    // Count posts per category
    const counts = {};
    postsData.forEach(post => {
        counts[post.category] = (counts[post.category] || 0) + 1;
    });

    // Sort categories by count
    const sortedCategories = Object.entries(counts)
        .sort((a, b) => b[1] - a[1]);

    tagsCloud.innerHTML = sortedCategories.map(([key, count]) => {
        const info = categoryNames[key] || { name: key };
        return `
            <a href="#" class="tag ${key === currentCategory ? 'active' : ''}"
               data-category="${key}" onclick="event.preventDefault(); filterByCategory('${key}')">
                ${info.name} (${count})
            </a>
        `;
    }).join('');
}

// Render blog posts
function renderBlogPosts() {
    if (!blogGrid) return;

    // Calculate pagination
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const currentPosts = filteredPosts.slice(startIndex, endIndex);

    // Show no results if empty
    if (filteredPosts.length === 0) {
        blogGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No posts found</h3>
                <p>Try adjusting your search or filter criteria</p>
            </div>
        `;
        pagination.innerHTML = '';
        return;
    }

    // Render posts
    blogGrid.innerHTML = currentPosts.map(post => `
        <article class="blog-card" onclick="window.location.href='posts/post-${post.id}.html'">
            <div class="blog-card-image">
                ${post.image
                    ? `<img src="images/${post.image}" alt="${post.title}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
                    : ''}
                <i class="fas fa-heartbeat placeholder-icon" ${post.image ? 'style="display:none;"' : ''}></i>
                <span class="blog-card-category">${categoryNames[post.category]?.name || post.category}</span>
            </div>
            <div class="blog-card-content">
                <h3 class="blog-card-title">${post.title}</h3>
                <p class="blog-card-excerpt">${post.excerpt}</p>
                <div class="blog-card-meta">
                    <span><i class="fas fa-tag"></i> ${categoryNames[post.category]?.name || post.category}</span>
                    <a href="posts/post-${post.id}.html" class="read-more">Read More <i class="fas fa-arrow-right"></i></a>
                </div>
            </div>
        </article>
    `).join('');

    // Update tags cloud active state
    renderTagsCloud();

    // Render pagination
    renderPagination(totalPages);
}

// Render pagination
function renderPagination(totalPages) {
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';

    // Previous button
    html += `
        <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // First page
    if (startPage > 1) {
        html += `<button class="pagination-btn" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">
                ${i}
            </button>
        `;
    }

    // Last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
        html += `<button class="pagination-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }

    // Next button
    html += `
        <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    pagination.innerHTML = html;
}

// Go to specific page
function goToPage(page) {
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    renderBlogPosts();

    // Scroll to top of blog grid
    document.querySelector('.main-content')?.scrollIntoView({ behavior: 'smooth' });
}

// Check if viewing single post
function isSinglePostPage() {
    return window.location.pathname.includes('/posts/post-');
}

// Get post ID from URL
function getPostIdFromUrl() {
    const match = window.location.pathname.match(/post-(\d+)\.html/);
    return match ? match[1] : null;
}

// Export for use in other files
window.blogFunctions = {
    filterByCategory,
    goToPage,
    getPostIdFromUrl,
    postsData
};