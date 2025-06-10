document.addEventListener('DOMContentLoaded', function() {
    // Общие функции для всех страниц
    
    // Обновление счетчика корзины
    updateCartCount();
    
    // Инициализация корзины, если ее нет
    if (!localStorage.getItem('cart')) {
        localStorage.setItem('cart', JSON.stringify([]));
    }
});

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

// Для страницы товара
if (document.querySelector('.product-detail')) {
    loadProductDetails();
}

async function loadProductDetails() {
    const productId = new URLSearchParams(window.location.search).get('id');
    if (!productId) {
        window.location.href = 'catalog.html';
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:3000/api/products/${productId}`);
        const product = await response.json();
        
        if (!product) {
            window.location.href = 'catalog.html';
            return;
        }
        
        displayProductDetails(product);
    } catch (error) {
        console.error('Ошибка загрузки товара:', error);
        document.querySelector('.product-container').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ошибка загрузки товара</h3>
                <p>Пожалуйста, попробуйте позже</p>
                <a href="catalog.html" class="btn">Вернуться в каталог</a>
            </div>
        `;
    }
}

function displayProductDetails(product) {
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-price').textContent = `${product.price} руб.`;
    document.getElementById('product-description').textContent = product.description || 'Описание отсутствует';
    
    // Загрузка изображений
    const mainImage = document.getElementById('main-product-image');
    mainImage.src = `images/products/${product.image || 'default.jpg'}`;
    mainImage.alt = product.name;
    
    // Характеристики
    const specsList = document.getElementById('product-specs');
    if (product.specifications && product.specifications.length > 0) {
        product.specifications.forEach(spec => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${spec.name}:</strong> ${spec.value}`;
            specsList.appendChild(li);
        });
    } else {
        specsList.innerHTML = '<li>Характеристики отсутствуют</li>';
    }
    
    // Отзывы
    const reviewsList = document.querySelector('.reviews-list');
    if (product.reviews && product.reviews.length > 0) {
        product.reviews.forEach(review => {
            const reviewElement = document.createElement('div');
            reviewElement.className = 'review';
            reviewElement.innerHTML = `
                <div class="review-header">
                    <span class="review-author">${review.author}</span>
                    <span class="review-rating">${generateRatingStars(review.rating)}</span>
                    <span class="review-date">${new Date(review.date).toLocaleDateString()}</span>
                </div>
                <div class="review-content">
                    <p>${review.text}</p>
                </div>
            `;
            reviewsList.appendChild(reviewElement);
        });
    } else {
        reviewsList.innerHTML = '<p>Отзывов пока нет. Будьте первым!</p>';
    }
    
    // Обработчик добавления в корзину
    document.getElementById('add-to-cart').addEventListener('click', () => {
        const quantity = parseInt(document.getElementById('product-qty').value) || 1;
        addToCartWithQuantity(product.id, quantity);
    });
    
    // Обработчики изменения количества
    document.getElementById('increase-qty').addEventListener('click', () => {
        const input = document.getElementById('product-qty');
        input.value = parseInt(input.value) + 1;
    });
    
    document.getElementById('decrease-qty').addEventListener('click', () => {
        const input = document.getElementById('product-qty');
        if (parseInt(input.value) > 1) {
            input.value = parseInt(input.value) - 1;
        }
    });
}

function addToCartWithQuantity(productId, quantity) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ id: productId, quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showNotification(`Товар (${quantity} шт.) добавлен в корзину!`);
}
// Функция загрузки товаров
async function loadProducts() {
    try {
        // Показываем индикатор загрузки
        const productsGrid = document.querySelector('.products-grid');
        productsGrid.innerHTML = '<div class="loading">Загрузка товаров...</div>';

        // Запрос к API
        const response = await fetch('http://localhost:3000/api/products');
        const products = await response.json();

        // Отображаем товары
        displayProducts(products);
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        document.querySelector('.products-grid').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ошибка загрузки товаров</h3>
                <p>Попробуйте обновить страницу</p>
            </div>
        `;
    }
}

// Функция отображения товаров
function displayProducts(products) {
    const productsGrid = document.querySelector('.products-grid');
    
    if (!products || products.length === 0) {
        productsGrid.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-box-open"></i>
                <h3>Товары не найдены</h3>
                <p>Попробуйте позже</p>
            </div>
        `;
        return;
    }

    productsGrid.innerHTML = '';
    
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
                    <span class="product-rating">★★★★☆ (${product.reviews || 0})</span>
                </div>
                <button onclick="addToCart(${product.id})" class="btn">В корзину</button>
                <a href="product.html?id=${product.id}" class="btn btn-secondary">Подробнее</a>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
}

// Вызываем при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    updateCartCount();
});