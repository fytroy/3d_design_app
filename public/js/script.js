document.addEventListener('DOMContentLoaded', () => {
    // --- Utility Functions ---
    const updateCartCount = () => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = cart.length;
        }
    };

    const displayCartItems = () => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const cartItemsDisplay = document.getElementById('cart-items-display');
        const cartTotalDisplay = document.getElementById('cart-total-display');

        if (cartItemsDisplay) {
            if (cart.length === 0) {
                cartItemsDisplay.innerHTML = '<p>Your cart is empty.</p>';
                if (cartTotalDisplay) cartTotalDisplay.textContent = 'KES 0';
                return;
            }

            let total = 0;
            let itemsHtml = '';
            cart.forEach(item => {
                total += item.price;
                itemsHtml += `
                    <div class="cart-item">
                        <span class="item-info">${item.name}</span>
                        <span class="item-price">KES ${item.price.toLocaleString()}</span>
                    </div>
                `;
            });
            cartItemsDisplay.innerHTML = itemsHtml;
            if (cartTotalDisplay) cartTotalDisplay.textContent = `KES ${total.toLocaleString()}`;
        }
    };

    // --- Global Initializations ---
    updateCartCount(); // Update cart count on page load

    // --- Smooth scrolling for navigation links ---
    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = document.querySelector('header').offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
                const offsetPosition = elementPosition - headerOffset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // --- Add to Cart Logic (on products.html) ---
    const productGrid = document.getElementById('product-grid');
    if (productGrid) {
        productGrid.addEventListener('click', (event) => {
            const addToCartBtn = event.target.closest('.add-to-cart-btn');
            if (addToCartBtn) {
                const productId = addToCartBtn.dataset.productId;
                const productName = addToCartBtn.dataset.productName;
                const productPrice = parseInt(addToCartBtn.dataset.productPrice);

                let cart = JSON.parse(localStorage.getItem('cart') || '[]');
                cart.push({ id: productId, name: productName, price: productPrice });
                localStorage.setItem('cart', JSON.stringify(cart));

                updateCartCount();
                alert(`${productName} added to cart!`);
            }
        });
    }

    // --- Checkout Page Logic (on checkout.html) ---
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        displayCartItems(); // Show items in cart on checkout page

        checkoutForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            if (cart.length === 0) {
                alert('Your cart is empty. Please add items before checking out.');
                return;
            }

            const formData = new FormData(checkoutForm);
            const orderDetails = {};
            formData.forEach((value, key) => {
                orderDetails[key] = value;
            });

            // Add cart items and total to order details
            orderDetails.cartItems = cart;
            orderDetails.totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
            orderDetails.timestamp = new Date().toISOString();
            orderDetails.orderId = 'ORD-' + Date.now(); // Simple dummy order ID

            try {
                const response = await fetch('/place-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderDetails)
                });

                if (response.ok) {
                    // Redirect to success page with order ID
                    window.location.href = `/success.html?orderId=${orderDetails.orderId}`;
                } else {
                    const errorText = await response.text();
                    alert(`Order placement failed: ${errorText}`);
                    console.error('Order placement error:', errorText);
                }
            } catch (error) {
                console.error('Network or submission error:', error);
                alert('An error occurred while placing your order. Please try again.');
            }
        });
    }

    // --- Highlight active navigation link ---
    const currentPath = window.location.pathname;
    document.querySelectorAll('nav a').forEach(link => {
        if (link.getAttribute('href') === currentPath ||
            (currentPath === '/' && link.getAttribute('href') === '/index.html') ||
            (currentPath === '/index.html' && link.getAttribute('href') === '/')
           ) {
            link.classList.add('active');
        }
    });

});