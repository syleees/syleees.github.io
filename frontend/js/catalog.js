document.addEventListener('DOMContentLoaded', function() {
    // Загрузка товаров при открытии страницы
    loadProducts();
    
    // Обработчики событий
    document.getElementById('apply-filters').addEventListener('click', applyFilters);
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
    
    // Обновление счетчика корзины
    updateCartCount();
});

async function loadProducts(filters = {}) {
    try {
        // Показываем загрузку
        document.getElementById('products-container').innerHTML = `
            <div class="empty-message">
                <i class="fas fa-spinner fa-spin"></i>
                <h3>Загрузка товаров...</h3>
            </div>
        `;
        
        // Формируем параметры запроса
        const queryParams = new URLSearchParams();
        if (filters.category && filters.category !== 'all') {
            queryParams.append('category', filters.category);
        }
        if (filters.price && filters.price !== 'all') {
            queryParams.append('price', filters.price);
        }
        if (filters.sort) {
            queryParams.append('sort', filters.sort);
        }
        
        // Запрос к API
        const response = await fetch(`http://localhost:3000/api/products?${queryParams}`);
        const products = await response.json();
        
        // Отображаем товары
        displayProducts(products);
        
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        document.getElementById('products-container').innerHTML = `
            <div class="empty-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ошибка загрузки товаров</h3>
                <p>Пожалуйста, попробуйте позже</p>
                <button onclick="loadProducts()" class="btn"><i class="fas fa-redo"></i> Попробовать снова</button>
            </div>
        `;
    }
}

function displayProducts(products) {
    const productsContainer = document.getElementById('products-container');
    
    if (products.length === 0) {
        productsContainer.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-box-open"></i>
                <h3>Товары не найдены</h3>
                <p>Попробуйте изменить параметры фильтрации</p>
            </div>
        `;
        return;
    }
    
    productsContainer.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card fade-in';
        productCard.innerHTML = `
            <img src="images/products/${product.image || 'default.jpg'}" alt="${product.name}">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-description">${product.description || 'Описание отсутствует'}</p>
                <div class="product-meta">
                    <span class="product-price">${product.price} руб.</span>
                    <span class="product-rating">
                        ${generateRatingStars(product.rating || 0)}
                        (${product.reviewsCount || 0})
                    </span>
                </div>
                <div class="product-actions">
                    <button onclick="addToCart(${product.id})" class="btn">
                        <i class="fas fa-cart-plus"></i> В корзину
                    </button>
                    <a href="product.html?id=${product.id}" class="btn btn-secondary">
                        <i class="fas fa-info-circle"></i> Подробнее
                    </a>
                </div>
            </div>
        `;
        productsContainer.appendChild(productCard);
    });
}

function generateRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === fullStars + 1 && hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    
    return stars;
}

function applyFilters() {
    const filters = {
        category: document.getElementById('category').value,
        price: document.getElementById('price').value,
        sort: document.getElementById('sort').value
    };
    
    loadProducts(filters);
}

function resetFilters() {
    document.getElementById('category').value = 'all';
    document.getElementById('price').value = 'all';
    document.getElementById('sort').value = 'popular';
    loadProducts();
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems;
    });
}

function addToCart(productId) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: productId, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // Показываем уведомление
    showNotification('Товар добавлен в корзину!');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    updateCartCount();
    
    // Обработчики фильтров
    document.getElementById('apply-filters').addEventListener('click', applyFilters);
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
});

async function loadProducts(filters = {}) {
    try {
        // Показываем индикатор загрузки
        document.getElementById('products-container').innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Загрузка товаров...</span>
            </div>
        `;

        // Формируем параметры запроса
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.price) params.append('price', filters.price);
        if (filters.sort) params.append('sort', filters.sort);

        // Запрос к API
        const response = await fetch(`http://localhost:3000/api/products?${params}`);
        const products = await response.json();

        // Отображаем товары
        displayCatalogProducts(products);
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        document.getElementById('products-container').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ошибка загрузки товаров</h3>
                <p>Попробуйте позже</p>
                <button onclick="loadProducts()" class="btn">Попробовать снова</button>
            </div>
        `;
    }
}

function displayCatalogProducts(products) {
    const container = document.getElementById('products-container');
    
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-box-open"></i>
                <h3>Товары не найдены</h3>
                <p>Попробуйте изменить параметры фильтрации</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="images/products/${product.image || 'default.jpg'}" alt="${product.name}">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-description">${product.description || ''}</p>
                <div class="product-meta">
                    <span class="product-price">${product.price} руб.</span>
                    <span class="product-rating">${generateRatingStars(product.rating || 0)} (${product.reviews || 0})</span>
                </div>
                <button onclick="addToCart(${product.id})" class="btn">В корзину</button>
                <a href="product.html?id=${product.id}" class="btn btn-secondary">Подробнее</a>
            </div>
        `;
        container.appendChild(productCard);
    });
}
