document.addEventListener('DOMContentLoaded', function() {
    // Загрузка товаров в корзину
    loadCartItems();
    
    // Обработчики событий
    document.getElementById('order-form').addEventListener('submit', placeOrder);
});

async function loadCartItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        document.getElementById('cart-items').innerHTML = '<p>Ваша корзина пуста</p>';
        updateTotals(0, 0);
        return;
    }
    
    try {
        // Получаем информацию о товарах из базы данных
        const response = await fetch('http://localhost:3000/api/products/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productIds: cart.map(item => item.id) })
        });
        
        const products = await response.json();
        
        // Сопоставляем товары с данными из корзины
        const cartItems = cart.map(cartItem => {
            const product = products.find(p => p.id == cartItem.id);
            return { ...product, quantity: cartItem.quantity };
        });
        
        // Отображаем товары
        displayCartItems(cartItems);
        
        // Обновляем итоговые суммы
        const subtotal = calculateSubtotal(cartItems);
        const shipping = calculateShipping(subtotal);
        updateTotals(subtotal, shipping);
        
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
        document.getElementById('cart-items').innerHTML = '<p>Произошла ошибка при загрузке корзины</p>';
    }
}

function displayCartItems(items) {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = '';
    
    items.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="item-product">
                <img src="images/products/${item.image}" alt="${item.name}">
                <div>
                    <h4>${item.name}</h4>
                    <button class="remove-item" data-id="${item.id}">Удалить</button>
                </div>
            </div>
            <div class="item-price">${item.price} руб.</div>
            <div class="item-quantity">
                <button class="decrease-qty" data-id="${item.id}">-</button>
                <span>${item.quantity}</span>
                <button class="increase-qty" data-id="${item.id}">+</button>
            </div>
            <div class="item-total">${item.price * item.quantity} руб.</div>
        `;
        cartItemsContainer.appendChild(cartItem);
    });
    
    // Добавляем обработчики для кнопок
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', removeFromCart);
    });
    
    document.querySelectorAll('.decrease-qty').forEach(button => {
        button.addEventListener('click', decreaseQuantity);
    });
    
    document.querySelectorAll('.increase-qty').forEach(button => {
        button.addEventListener('click', increaseQuantity);
    });
}

function calculateSubtotal(items) {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function calculateShipping(subtotal) {
    // Бесплатная доставка от 5000 руб.
    return subtotal >= 5000 ? 0 : 300;
}

function updateTotals(subtotal, shipping) {
    document.getElementById('subtotal').textContent = `${subtotal} руб.`;
    document.getElementById('shipping').textContent = `${shipping} руб.`;
    document.getElementById('grand-total').textContent = `${subtotal + shipping} руб.`;
}

function removeFromCart(e) {
    const productId = e.target.getAttribute('data-id');
    let cart = JSON.parse(localStorage.getItem('cart'));
    
    cart = cart.filter(item => item.id != productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    loadCartItems();
}

function decreaseQuantity(e) {
    const productId = e.target.getAttribute('data-id');
    let cart = JSON.parse(localStorage.getItem('cart'));
    
    const item = cart.find(item => item.id == productId);
    if (item.quantity > 1) {
        item.quantity -= 1;
    } else {
        cart = cart.filter(item => item.id != productId);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCartItems();
}

function increaseQuantity(e) {
    const productId = e.target.getAttribute('data-id');
    let cart = JSON.parse(localStorage.getItem('cart'));
    
    const item = cart.find(item => item.id == productId);
    item.quantity += 1;
    
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCartItems();
}

async function placeOrder(e) {
    e.preventDefault();
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert('Ваша корзина пуста!');
        return;
    }
    
    const orderData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        payment: document.getElementById('payment').value,
        comments: document.getElementById('comments').value,
        products: cart
    };
    
    try {
        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Очищаем корзину
            localStorage.setItem('cart', JSON.stringify([]));
            
            // Перенаправляем на страницу подтверждения
            window.location.href = `order-success.html?orderId=${result.orderId}`;
        } else {
            alert(`Ошибка: ${result.message}`);
        }
    } catch (error) {
        console.error('Ошибка оформления заказа:', error);
        alert('Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте позже.');
    }
}