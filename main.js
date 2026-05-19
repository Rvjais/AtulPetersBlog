// Blog functionality

// State
let currentPage = 1;
const postsPerPage = 12;
let filteredPosts = [];
let sortedPosts = [];
let currentCategory = '';
let searchQuery = '';

// DOM elements
const blogGrid = document.getElementById('blogGrid');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const tagsCloud = document.getElementById('tagsCloud');

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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    sortPostsByDate();
    filteredPosts = [...sortedPosts];
    renderTagsCloud();
    renderBlogPosts();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    searchInput?.addEventListener('input', debounce(handleSearch, 300));
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

// Sort posts by date (newest first)
function sortPostsByDate() {
    sortedPosts = [...postsData].sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
    });
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
    filteredPosts = sortedPosts.filter(post => {
        if (currentCategory && post.category !== currentCategory) {
            return false;
        }
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

// Format date for display
function formatDate(dateStr) {
    if (!dateStr || dateStr === 'NULL') return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return '';
    }
}

// Render tags cloud in sidebar
function renderTagsCloud() {
    if (!tagsCloud) return;

    const counts = {};
    postsData.forEach(post => {
        counts[post.category] = (counts[post.category] || 0) + 1;
    });

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

// Utility to strip HTML tags
function stripHtml(html) {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

// Render blog posts
function renderBlogPosts() {
    if (!blogGrid) return;

    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const currentPosts = filteredPosts.slice(startIndex, endIndex);

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

    blogGrid.innerHTML = currentPosts.map(post => {
        const title = stripHtml(post.title).trim() || 'Untitled Post';
        let excerpt = stripHtml(post.excerpt || '').trim();
        if (!excerpt || excerpt === '...' || post.is_spam) {
            const contentText = stripHtml(post.content || '').trim();
            excerpt = contentText ? contentText.substring(0, 150) + '...' : 'Read more about this topic...';
        }
        const showImage = post.image && post.image !== 'contact-form.png' && !post.is_spam;
        return `
        <article class="blog-card" onclick="window.location.href='posts/post-${post.id}.html'">
            <div class="blog-card-image">
                ${showImage
                    ? `<img src="images/${post.image}" alt="${title}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
                    : ''}
                <i class="fas fa-heartbeat placeholder-icon" ${showImage ? 'style="display:none;"' : ''}></i>
                <span class="blog-card-category">${categoryNames[post.category]?.name || post.category}</span>
            </div>
            <div class="blog-card-content">
                <h3 class="blog-card-title">${title}</h3>
                <p class="blog-card-excerpt">${excerpt}</p>
                <div class="blog-card-meta">
                    <span><i class="fas fa-calendar-alt"></i> ${formatDate(post.date)}</span>
                    <a href="posts/post-${post.id}.html" class="read-more">Read More <i class="fas fa-arrow-right"></i></a>
                </div>
            </div>
        </article>
        `;
    }).join('');

    renderTagsCloud();
    renderPagination(totalPages);
}

// Render pagination
function renderPagination(totalPages) {
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';

    html += `
        <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
        html += `<button class="pagination-btn" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">
                ${i}
            </button>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
        html += `<button class="pagination-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }

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
    document.querySelector('.main-content')?.scrollIntoView({ behavior: 'smooth' });
}

// Export for use in other files
window.blogFunctions = {
    filterByCategory,
    goToPage,
    postsData
};