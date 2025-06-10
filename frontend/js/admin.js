document.addEventListener('DOMContentLoaded', function() {
    // Проверка авторизации администратора
    checkAdminAuth();
    
    // Инициализация админ-панели
    initAdminPanel();
    
    // Загрузка данных для dashboard
    loadDashboardData();
    
    // Загрузка товаров
    loadProducts();
    
    // Загрузка заказов
    loadOrders();
    
    // Загрузка пользователей
    loadUsers();
});

// Проверка авторизации администратора
function checkAdminAuth() {
    const authToken = localStorage.getItem('adminToken');
    if (!authToken) {
        window.location.href = 'login.html?admin=true';
    }
}

// Выход из админ-панели
function logoutAdmin() {
    localStorage.removeItem('adminToken');
    window.location.href = 'login.html';
}

// Инициализация админ-панели
function initAdminPanel() {
    // Добавляем кнопку выхода
    const userPanel = document.querySelector('.admin-user');
    if (userPanel) {
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn btn-danger';
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Выход';
        logoutBtn.addEventListener('click', logoutAdmin);
        userPanel.appendChild(logoutBtn);
    }

    // Переключение между разделами
    document.querySelectorAll('.admin-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Убираем активный класс у всех ссылок
            document.querySelectorAll('.admin-menu li').forEach(item => {
                item.classList.remove('active');
            });
            
            // Добавляем активный класс текущей ссылке
            this.parentElement.classList.add('active');
            
            // Скрываем все разделы
            document.querySelectorAll('.admin-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Показываем выбранный раздел
            const sectionId = this.getAttribute('href').substring(1);
            document.getElementById(sectionId).classList.add('active');
        });
    });
    
    // Модальное окно для товаров
    const modal = document.getElementById('product-modal');
    const addProductBtn = document.getElementById('add-product');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    
    addProductBtn.addEventListener('click', () => {
        document.getElementById('modal-title').textContent = 'Добавить товар';
        document.getElementById('product-form').reset();
        document.getElementById('product-form').dataset.mode = 'add';
        document.getElementById('image-preview').innerHTML = '';
        modal.style.display = 'block';
    });
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Загрузка изображений
    document.getElementById('modal-images').addEventListener('change', function(e) {
        const preview = document.getElementById('image-preview');
        preview.innerHTML = '';
        
        for (const file of e.target.files) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = document.createElement('img');
                img.src = event.target.result;
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Обработка формы товара
    document.getElementById('product-form').addEventListener('submit', saveProduct);
}

// Загрузка данных для dashboard
async function loadDashboardData() {
    try {
        const authToken = localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:3000/api/admin/dashboard', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                logoutAdmin();
            }
            throw new Error('Ошибка загрузки данных');
        }
        
        const data = await response.json();
        
        // Обновляем статистику
        document.getElementById('orders-count').textContent = data.ordersCount;
        document.getElementById('revenue').textContent = `${data.revenue.toLocaleString()} руб.`;
        document.getElementById('users-count').textContent = data.usersCount;
        document.getElementById('products-count').textContent = data.productsCount;
        
        // Строим графики
        renderSalesChart(data.salesData);
        renderProductsChart(data.topProducts);
        
        // Заполняем таблицу последних заказов
        renderRecentOrders(data.recentOrders);
        
    } catch (error) {
        console.error('Ошибка загрузки данных dashboard:', error);
        showAdminAlert('Ошибка загрузки данных', 'danger');
    }
}

// Отображение графика продаж
function renderSalesChart(data) {
    const ctx = document.getElementById('sales-chart').getContext('2d');
    
    const labels = data.map(item => item.date);
    const values = data.map(item => item.total);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Продажи (руб.)',
                data: values,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y.toLocaleString()} руб.`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString() + ' руб.';
                        }
                    }
                }
            }
        }
    });
}

// Отображение графика популярных товаров
function renderProductsChart(products) {
    const ctx = document.getElementById('products-chart').getContext('2d');
    
    const labels = products.map(item => item.name);
    const values = products.map(item => item.sales);
    const colors = generateChartColors(values.length);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Продажи (шт.)',
                data: values,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('0.2', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Генерация цветов для графика
function generateChartColors(count) {
    const colors = [];
    const hueStep = 360 / count;
    
    for (let i = 0; i < count; i++) {
        const hue = i * hueStep;
        colors.push(`hsla(${hue}, 70%, 60%, 0.7)`);
    }
    
    return colors;
}

// Отображение последних заказов
function renderRecentOrders(orders) {
    const tbody = document.querySelector('#orders-table tbody');
    tbody.innerHTML = '';
    
    orders.forEach(order => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${order.id}</td>
            <td>${order.customerName}</td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td>${order.total.toLocaleString()} руб.</td>
            <td><span class="status-badge ${getStatusClass(order.status)}">${getStatusText(order.status)}</span></td>
            <td>
                <button class="btn btn-small" onclick="viewOrder(${order.id})"><i class="fas fa-eye"></i></button>
                <button class="btn btn-small btn-success" onclick="changeOrderStatus(${order.id}, 'processing')"><i class="fas fa-cog"></i></button>
                <button class="btn btn-small btn-danger" onclick="changeOrderStatus(${order.id}, 'cancelled')"><i class="fas fa-times"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Получение класса для статуса заказа
function getStatusClass(status) {
    switch (status) {
        case 'completed': return 'status-completed';
        case 'processing': return 'status-processing';
        case 'cancelled': return 'status-cancelled';
        default: return 'status-pending';
    }
}

// Получение текста для статуса заказа
function getStatusText(status) {
    switch (status) {
        case 'completed': return 'Завершен';
        case 'processing': return 'В обработке';
        case 'cancelled': return 'Отменен';
        default: return 'Ожидает';
    }
}

// Просмотр заказа
function viewOrder(orderId) {
    window.location.href = `order-details.html?id=${orderId}`;
}

// Изменение статуса заказа
async function changeOrderStatus(orderId, status) {
    try {
        const authToken = localStorage.getItem('adminToken');
        const response = await fetch(`http://localhost:3000/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка изменения статуса');
        }
        
        showAdminAlert('Статус заказа успешно изменен', 'success');
        loadDashboardData();
        loadOrders();
        
    } catch (error) {
        console.error('Ошибка изменения статуса заказа:', error);
        showAdminAlert('Ошибка изменения статуса', 'danger');
    }
}

// Загрузка товаров
async function loadProducts() {
    try {
        const authToken = localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:3000/api/admin/products', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                logoutAdmin();
            }
            throw new Error('Ошибка загрузки товаров');
        }
        
        const products = await response.json();
        renderProductsTable(products);
        
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        showAdminAlert('Ошибка загрузки товаров', 'danger');
    }
}

// Отображение таблицы товаров
function renderProductsTable(products) {
    const tbody = document.querySelector('#products-table tbody');
    tbody.innerHTML = '';
    
    products.forEach(product => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${product.id}</td>
            <td><img src="../images/products/${product.image || 'default.jpg'}" alt="${product.name}" class="product-thumbnail"></td>
            <td>${product.name}</td>
            <td>${getCategoryName(product.category)}</td>
            <td>${product.price.toLocaleString()} руб.</td>
            <td><span class="status-badge ${product.status === 'active' ? 'status-completed' : 'status-cancelled'}">${product.status === 'active' ? 'Активен' : 'Не активен'}</span></td>
            <td>
                <button class="btn btn-small" onclick="editProduct(${product.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-small btn-danger" onclick="deleteProduct(${product.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Получение названия категории
function getCategoryName(category) {
    switch (category) {
        case 'protein': return 'Протеин';
        case 'gainer': return 'Гейнер';
        case 'amino': return 'Аминокислоты';
        case 'vitamin': return 'Витамины';
        case 'accessory': return 'Аксессуары';
        default: return 'Другое';
    }
}

// Редактирование товара
async function editProduct(productId) {
    try {
        const authToken = localStorage.getItem('adminToken');
        const response = await fetch(`http://localhost:3000/api/admin/products/${productId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки товара');
        }
        
        const product = await response.json();
        
        // Заполняем форму данными товара
        document.getElementById('modal-title').textContent = 'Редактировать товар';
        document.getElementById('modal-name').value = product.name;
        document.getElementById('modal-price').value = product.price;
        document.getElementById('modal-category').value = product.category;
        document.getElementById('modal-status').value = product.status;
        document.getElementById('modal-description').value = product.description || '';
        document.getElementById('modal-featured').checked = product.featured || false;
        
        // Показываем текущее изображение
        const preview = document.getElementById('image-preview');
        preview.innerHTML = '';
        if (product.image) {
            const img = document.createElement('img');
            img.src = `../images/products/${product.image}`;
            preview.appendChild(img);
        }
        
        // Устанавливаем режим редактирования
        document.getElementById('product-form').dataset.mode = 'edit';
        document.getElementById('product-form').dataset.productId = productId;
        
        // Показываем модальное окно
        document.getElementById('product-modal').style.display = 'block';
        
    } catch (error) {
        console.error('Ошибка загрузки товара:', error);
        showAdminAlert('Ошибка загрузки товара', 'danger');
    }
}

// Удаление товара
async function deleteProduct(productId) {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
        return;
    }
    
    try {
        const authToken = localStorage.getItem('adminToken');
        const response = await fetch(`http://localhost:3000/api/admin/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка удаления товара');
        }
        
        showAdminAlert('Товар успешно удален', 'success');
        loadProducts();
        loadDashboardData();
        
    } catch (error) {
        console.error('Ошибка удаления товара:', error);
        showAdminAlert('Ошибка удаления товара', 'danger');
    }
}

// Сохранение товара (добавление/редактирование)
async function saveProduct(e) {
    e.preventDefault();
    
    const form = e.target;
    const isEditMode = form.dataset.mode === 'edit';
    const productId = isEditMode ? form.dataset.productId : null;
    
    const formData = new FormData();
    formData.append('name', document.getElementById('modal-name').value);
    formData.append('price', document.getElementById('modal-price').value);
    formData.append('category', document.getElementById('modal-category').value);
    formData.append('status', document.getElementById('modal-status').value);
    formData.append('description', document.getElementById('modal-description').value);
    formData.append('featured', document.getElementById('modal-featured').checked);
    
    // Добавляем изображения
    const imageInput = document.getElementById('modal-images');
    if (imageInput.files.length > 0) {
        for (let i = 0; i < imageInput.files.length; i++) {
            formData.append('images', imageInput.files[i]);
        }
    }
    
    try {
        const authToken = localStorage.getItem('adminToken');
        const url = isEditMode 
            ? `http://localhost:3000/api/admin/products/${productId}`
            : 'http://localhost:3000/api/admin/products';
            
        const response = await fetch(url, {
            method: isEditMode ? 'PUT' : 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(isEditMode ? 'Ошибка обновления товара' : 'Ошибка добавления товара');
        }
        
        showAdminAlert(
            isEditMode ? 'Товар успешно обновлен' : 'Товар успешно добавлен',
            'success'
        );
        
        // Закрываем модальное окно и обновляем данные
        document.getElementById('product-modal').style.display = 'none';
        loadProducts();
        loadDashboardData();
        
    } catch (error) {
        console.error('Ошибка сохранения товара:', error);
        showAdminAlert(
            isEditMode ? 'Ошибка обновления товара' : 'Ошибка добавления товара',
            'danger'
        );
    }
}

// Загрузка заказов
async function loadOrders() {
    try {
        const authToken = localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:3000/api/admin/orders', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                logoutAdmin();
            }
            throw new Error('Ошибка загрузки заказов');
        }
        
        const orders = await response.json();
        renderOrdersTable(orders);
        
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        showAdminAlert('Ошибка загрузки заказов', 'danger');
    }
}

// Отображение таблицы заказов
function renderOrdersTable(orders) {
    const tbody = document.querySelector('#orders-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    orders.forEach(order => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${order.id}</td>
            <td>${order.customerName}</td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td>${order.total.toLocaleString()} руб.</td>
            <td><span class="status-badge ${getStatusClass(order.status)}">${getStatusText(order.status)}</span></td>
            <td>
                <button class="btn btn-small" onclick="viewOrder(${order.id})"><i class="fas fa-eye"></i></button>
                <button class="btn btn-small btn-success" onclick="changeOrderStatus(${order.id}, 'processing')"><i class="fas fa-cog"></i></button>
                <button class="btn btn-small btn-danger" onclick="changeOrderStatus(${order.id}, 'cancelled')"><i class="fas fa-times"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Загрузка пользователей
async function loadUsers() {
    try {
        const authToken = localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:3000/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                logoutAdmin();
            }
            throw new Error('Ошибка загрузки пользователей');
        }
        
        const users = await response.json();
        renderUsersTable(users);
        
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        showAdminAlert('Ошибка загрузки пользователей', 'danger');
    }
}

// Отображение таблицы пользователей
function renderUsersTable(users) {
    const tbody = document.querySelector('#users-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name || 'Не указано'}</td>
            <td>${user.email}</td>
            <td>${user.phone || 'Не указан'}</td>
            <td>${new Date(user.registeredAt).toLocaleDateString()}</td>
            <td><span class="status-badge ${user.role === 'admin' ? 'status-completed' : 'status-pending'}">${user.role === 'admin' ? 'Админ' : 'Пользователь'}</span></td>
            <td>
                <button class="btn btn-small" onclick="editUser(${user.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-small btn-danger" onclick="deleteUser(${user.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Показ уведомлений в админ-панели
function showAdminAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `admin-alert admin-alert-${type}`;
    alert.innerHTML = `
        <span>${message}</span>
        <button class="close-alert">&times;</button>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.classList.add('show');
    }, 10);
    
    // Закрытие уведомления
    alert.querySelector('.close-alert').addEventListener('click', () => {
        alert.classList.remove('show');
        setTimeout(() => {
            alert.remove();
        }, 300);
    });
    
    // Автоматическое закрытие через 5 секунд
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => {
            alert.remove();
        }, 300);
    }, 5000);
}