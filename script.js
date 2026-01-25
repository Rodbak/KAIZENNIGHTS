// ============================================
// KAIZEN NIGHTS - Ticket Booking System
// With Paystack Payment Integration
// ============================================

// ===========================================
// CONFIGURATION - UPDATE THESE VALUES
// ===========================================
const PAYSTACK_PUBLIC_KEY = 'pk_live_1eec1975ed29dad045aacc2721079b66e52cd90d';
// Get your keys from: https://dashboard.paystack.com/#/settings/developers

// State Management
let selectedTicket = null;
let ticketPrice = 0;
let selectedPaymentMethod = null;
let paymentReference = null;

// Ticket Data with Access Levels
const ticketData = {
    movie: {
        name: 'MOVIE PASS',
        nameJP: '映画パス',
        price: 100,
        access: ['CINEMA', 'SNACKS'],
        accessLabel: 'Cinema + Snacks',
        features: [
            'Movie Theater Entry',
            'Full Movie Screening',
            '1 Free Drink',
            '1 Free Popcorn'
        ]
    },
    gaming: {
        name: 'GAMING PASS',
        nameJP: 'ゲームパス',
        price: 100,
        access: ['GAMING', 'FIFA'],
        accessLabel: 'Gaming + FIFA',
        features: [
            'Gaming Zone Access',
            'Multiple Gaming Machines',
            'FIFA Tournament Entry',
            'Compete for GHS 1,500'
        ]
    },
    combo: {
        name: 'COMBO PASS',
        nameJP: 'コンボパス',
        price: 170,
        access: ['CINEMA', 'SNACKS', 'GAMING', 'FIFA', 'AFTERPARTY'],
        accessLabel: 'FULL ACCESS',
        features: [
            'Movie Theater Entry',
            '1 Free Drink + Popcorn',
            'Gaming Zone Access',
            'FIFA Tournament Entry',
            'After Party Access',
            'SAVE GHS 30!'
        ]
    },
    vendor: {
        name: 'VENDOR SPOT',
        nameJP: '出店者',
        price: 200,
        access: ['VENDOR'],
        accessLabel: 'Vendor Area',
        features: [
            'Prime Location',
            'Access to 500+ Attendees',
            'Table & Setup Space',
            'Social Media Promotion'
        ]
    }
};

// Select Ticket
function selectTicket(type, price) {
    selectedTicket = type;
    ticketPrice = price;
    
    // Update modal content
    const ticket = ticketData[type];
    document.getElementById('selectedTicketName').textContent = ticket.name;
    document.getElementById('selectedTicketPrice').textContent = `GHS ${price}`;
    
    // Reset form and steps
    resetCheckout();
    
    // Show/hide vendor fields
    const vendorFields = document.getElementById('vendorFields');
    if (type === 'vendor') {
        vendorFields.classList.remove('hidden');
        document.getElementById('standName').setAttribute('required', 'required');
        document.getElementById('products').setAttribute('required', 'required');
    } else {
        vendorFields.classList.add('hidden');
        document.getElementById('standName').removeAttribute('required');
        document.getElementById('products').removeAttribute('required');
    }
    
    // Open modal
    openModal();
    
    // Update total
    updateTotal();
}

// Open Modal
function openModal() {
    const modal = document.getElementById('checkoutModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close Modal
function closeModal() {
    const modal = document.getElementById('checkoutModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Reset after animation
    setTimeout(() => {
        resetCheckout();
    }, 300);
}

// Reset Checkout
function resetCheckout() {
    // Reset steps
    document.querySelectorAll('.checkout-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById('step1').classList.add('active');
    
    // Reset form
    document.getElementById('customerForm').reset();
    document.getElementById('quantity').value = '1';
    
    // Reset payment method selection
    selectedPaymentMethod = null;
    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.getElementById('momoNumberInput').classList.add('hidden');
    
    // Reset pay button
    const payBtn = document.getElementById('payNowBtn');
    payBtn.disabled = true;
    payBtn.querySelector('.btn-text').textContent = 'SELECT A PAYMENT METHOD';
    
    // Reset reference
    paymentReference = null;
}

// Update Total
function updateTotal() {
    const quantity = parseInt(document.getElementById('quantity').value);
    const total = ticketPrice * quantity;
    
    document.getElementById('totalAmount').textContent = `GHS ${total}`;
    document.getElementById('paymentAmount').textContent = `GHS ${total}`;
}

// Select Payment Method
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    // Update UI
    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.querySelector(`[data-method="${method}"]`).classList.add('selected');
    
    // Show/hide MoMo phone input
    const momoInput = document.getElementById('momoNumberInput');
    if (method === 'momo') {
        momoInput.classList.remove('hidden');
        // Pre-fill with customer phone if available
        const customerPhone = document.getElementById('phone').value;
        if (customerPhone) {
            document.getElementById('momoPhone').value = customerPhone.replace(/\D/g, '').slice(-10);
        }
    } else {
        momoInput.classList.add('hidden');
    }
    
    // Update button
    const payBtn = document.getElementById('payNowBtn');
    payBtn.disabled = false;
    if (method === 'momo') {
        payBtn.querySelector('.btn-text').textContent = 'PAY WITH MOBILE MONEY';
    } else {
        payBtn.querySelector('.btn-text').textContent = 'PAY WITH CARD';
    }
}

// Navigate to Step
function goToStep(stepNumber) {
    // Validate current step before proceeding
    if (stepNumber === 2) {
        if (!validateStep1()) return;
    }
    
    // Update steps visibility
    document.querySelectorAll('.checkout-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(`step${stepNumber}`).classList.add('active');
    
    // Scroll modal to top
    document.querySelector('.modal-content').scrollTop = 0;
}

// Validate Step 1
function validateStep1() {
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    if (!fullName) {
        showError('Please enter your full name');
        return false;
    }
    
    if (!email || !isValidEmail(email)) {
        showError('Please enter a valid email address');
        return false;
    }
    
    if (!phone || phone.length < 10) {
        showError('Please enter a valid WhatsApp number');
        return false;
    }
    
    // Validate vendor fields if vendor ticket selected
    if (selectedTicket === 'vendor') {
        const standName = document.getElementById('standName').value.trim();
        const products = document.getElementById('products').value.trim();
        
        if (!standName) {
            showError('Please enter your stand/business name');
            return false;
        }
        
        if (!products) {
            showError('Please describe what you will be selling');
            return false;
        }
    }
    
    return true;
}

// Email Validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Generate unique reference
function generateReference() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `KZN-${timestamp}-${random}`.toUpperCase();
}

// ===========================================
// PAYSTACK PAYMENT INTEGRATION
// ===========================================

function initiatePayment() {
    if (!selectedPaymentMethod) {
        showError('Please select a payment method');
        return;
    }
    
    // Validate MoMo phone if needed
    if (selectedPaymentMethod === 'momo') {
        const momoPhone = document.getElementById('momoPhone').value.replace(/\D/g, '');
        if (!momoPhone || momoPhone.length !== 10) {
            showError('Please enter a valid 10-digit mobile money number');
            return;
        }
    }
    
    // Get customer details
    const customerEmail = document.getElementById('email').value.trim();
    const customerPhone = document.getElementById('phone').value.trim();
    const customerName = document.getElementById('fullName').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value);
    const totalAmount = ticketPrice * quantity;
    
    // Generate reference
    paymentReference = generateReference();
    
    // Show loading state
    const payBtn = document.getElementById('payNowBtn');
    payBtn.disabled = true;
    payBtn.querySelector('.btn-text').classList.add('hidden');
    payBtn.querySelector('.btn-loader').classList.remove('hidden');
    
    if (selectedPaymentMethod === 'card') {
        // Card payment via Paystack popup
        initiateCardPayment(customerEmail, customerPhone, customerName, totalAmount, quantity);
    } else {
        // Mobile Money payment
        initiateMoMoPayment(customerEmail, customerPhone, customerName, totalAmount, quantity);
    }
}

// Card Payment with Paystack Popup
function initiateCardPayment(email, phone, name, amount, quantity) {
    const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: amount * 100, // Paystack uses pesewas (amount in smallest currency unit)
        currency: 'GHS',
        ref: paymentReference,
        metadata: {
            custom_fields: [
                {
                    display_name: "Customer Name",
                    variable_name: "customer_name",
                    value: name
                },
                {
                    display_name: "Phone Number",
                    variable_name: "phone_number",
                    value: phone
                },
                {
                    display_name: "Ticket Type",
                    variable_name: "ticket_type",
                    value: ticketData[selectedTicket].name
                },
                {
                    display_name: "Quantity",
                    variable_name: "quantity",
                    value: quantity.toString()
                }
            ]
        },
        callback: function(response) {
            // Payment successful
            console.log('Payment successful:', response);
            handlePaymentSuccess(response.reference, amount, quantity);
        },
        onClose: function() {
            // User closed popup
            resetPayButton();
            showError('Payment cancelled. Please try again.');
        }
    });
    
    handler.openIframe();
}

// Mobile Money Payment with Paystack
function initiateMoMoPayment(email, phone, name, amount, quantity) {
    const momoPhone = document.getElementById('momoPhone').value.replace(/\D/g, '');
    const network = document.getElementById('momoNetwork').value;
    
    // Map network to Paystack provider codes
    const providerMap = {
        'mtn': 'mtn',
        'vod': 'vod',
        'tgo': 'tgo'
    };
    
    // For MoMo, we'll use Paystack's charge API
    // Note: In production, this should go through your backend
    // Here we'll use Paystack popup with mobile_money channel
    
    const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: amount * 100,
        currency: 'GHS',
        ref: paymentReference,
        channels: ['mobile_money'],
        metadata: {
            custom_fields: [
                {
                    display_name: "Customer Name",
                    variable_name: "customer_name",
                    value: name
                },
                {
                    display_name: "MoMo Number",
                    variable_name: "momo_number",
                    value: momoPhone
                },
                {
                    display_name: "Network",
                    variable_name: "network",
                    value: network.toUpperCase()
                },
                {
                    display_name: "Ticket Type",
                    variable_name: "ticket_type",
                    value: ticketData[selectedTicket].name
                },
                {
                    display_name: "Quantity",
                    variable_name: "quantity",
                    value: quantity.toString()
                }
            ]
        },
        callback: function(response) {
            console.log('MoMo Payment successful:', response);
            handlePaymentSuccess(response.reference, amount, quantity);
        },
        onClose: function() {
            resetPayButton();
            showError('Payment cancelled. Please try again.');
        }
    });
    
    handler.openIframe();
    
    // Alternative: Show the MoMo waiting screen
    // This is for when you implement direct MoMo charge via backend
    // showMoMoWaitingScreen(momoPhone, amount);
}

// Show MoMo waiting screen (for direct charge flow)
function showMoMoWaitingScreen(phone, amount) {
    document.getElementById('promptPhone').textContent = formatPhoneDisplay(phone);
    document.getElementById('processingAmount').textContent = `GHS ${amount}`;
    goToStep(3);
    resetPayButton();
}

// Format phone for display
function formatPhoneDisplay(phone) {
    if (phone.length === 10) {
        return `${phone.slice(0,3)} ${phone.slice(3,6)} ${phone.slice(6)}`;
    }
    return phone;
}

// Check payment status (for MoMo direct charge)
function checkPaymentStatus() {
    // In production, this would call your backend to verify payment
    showSuccess('Checking payment status...');
    
    // Simulate checking - in real implementation, call your backend
    setTimeout(() => {
        // This would be based on actual payment verification
        showError('Still waiting for payment confirmation. Please ensure you entered your PIN.');
    }, 2000);
}

// Handle successful payment
function handlePaymentSuccess(reference, amount, quantity) {
    const ticket = ticketData[selectedTicket];
    
    // Update receipt
    document.getElementById('receiptTicket').textContent = ticket.name;
    document.getElementById('receiptQty').textContent = quantity;
    document.getElementById('receiptTotal').textContent = `GHS ${amount}`;
    document.getElementById('receiptRef').textContent = reference;
    document.getElementById('receiptAccess').textContent = ticket.accessLabel;
    
    // Update confirmation details
    document.getElementById('confirmPhone').textContent = document.getElementById('phone').value;
    document.getElementById('confirmEmail').textContent = document.getElementById('email').value;
    
    // Create ticket data for QR code
    const orderData = {
        ref: reference,
        event: 'KAIZEN NIGHTS',
        date: '2026-02-06',
        ticket: selectedTicket,
        ticketName: ticket.name,
        access: ticket.access,
        qty: quantity,
        total: amount,
        customer: {
            name: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim()
        },
        paid: new Date().toISOString(),
        valid: true
    };
    
    // Add vendor info if vendor ticket
    if (selectedTicket === 'vendor') {
        orderData.vendor = {
            standName: document.getElementById('standName').value.trim(),
            products: document.getElementById('products').value.trim()
        };
    }
    
    // Generate QR Code with ticket data
    generateTicketQR(orderData);
    
    // Store order locally
    const orders = JSON.parse(localStorage.getItem('kaizenOrders') || '[]');
    orders.push(orderData);
    localStorage.setItem('kaizenOrders', JSON.stringify(orders));
    
    console.log('Order saved:', orderData);
    
    // Show success step
    goToStep(4);
    resetPayButton();
    
    // Show success toast
    showSuccess('Payment successful! 🎉');
}

// Generate QR Code for ticket verification
function generateTicketQR(orderData) {
    const qrContainer = document.getElementById('qrCode');
    qrContainer.innerHTML = ''; // Clear previous QR code
    
    // Create QR data string - contains all verification info
    const qrData = JSON.stringify({
        r: orderData.ref,           // Reference
        t: orderData.ticket,        // Ticket type
        a: orderData.access,        // Access levels
        q: orderData.qty,           // Quantity
        n: orderData.customer.name, // Customer name
        p: orderData.customer.phone,// Phone
        d: orderData.paid           // Payment timestamp
    });
    
    // Use QR Server API - most reliable method (works everywhere)
    const encodedData = encodeURIComponent(qrData);
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}&bgcolor=FFFFFF&color=000000&margin=10`;
    
    const img = document.createElement('img');
    img.src = qrImageUrl;
    img.alt = 'Ticket QR Code';
    img.style.display = 'block';
    img.style.width = '200px';
    img.style.height = '200px';
    
    // Handle image load error
    img.onerror = function() {
        console.error('QR API failed, showing reference code');
        qrContainer.innerHTML = `
            <div style="padding:30px;text-align:center;font-family:monospace;font-size:16px;background:#fff;color:#000;border-radius:8px;">
                <strong style="font-size:20px;">${orderData.ref}</strong>
                <br><br>
                <small style="color:#666;">Reference Code</small>
            </div>`;
    };
    
    qrContainer.appendChild(img);
    console.log('QR Code image requested:', qrImageUrl);
}

// Reset pay button state
function resetPayButton() {
    const payBtn = document.getElementById('payNowBtn');
    payBtn.disabled = false;
    payBtn.querySelector('.btn-text').classList.remove('hidden');
    payBtn.querySelector('.btn-loader').classList.add('hidden');
}

// Show Error
function showError(message) {
    showToast(message, 'error');
}

// Show Success
function showSuccess(message) {
    showToast(message, 'success');
}

// Toast notification
function showToast(message, type = 'error') {
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? '✓' : '⚠';
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    
    // Add styles if not exists
    if (!document.getElementById('toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast {
                position: fixed;
                bottom: 2rem;
                left: 50%;
                transform: translateX(-50%);
                color: white;
                padding: 1rem 1.5rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                z-index: 3000;
                animation: toastSlide 0.3s ease-out;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                border-radius: 4px;
            }
            .toast-error {
                background: #E71C23;
            }
            .toast-success {
                background: #22c55e;
            }
            .toast-icon {
                font-size: 1.2rem;
            }
            .toast-message {
                font-size: 0.95rem;
            }
            @keyframes toastSlide {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'toastSlide 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Close modal on outside click
document.getElementById('checkoutModal').addEventListener('click', (e) => {
    if (e.target.id === 'checkoutModal') {
        closeModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
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

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(0, 0, 0, 0.95)';
    } else {
        navbar.style.background = 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, transparent 100%)';
    }
});

// Add entrance animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe ticket cards and stats
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.ticket-card, .stat').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Quantity change with keyboard
document.getElementById('quantity')?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        setTimeout(updateTotal, 0);
    }
});

// Console message for developers
console.log('%c🎬 KAIZEN NIGHTS', 'font-size: 24px; font-weight: bold; color: #E71C23;');
console.log('%cPowered by Paystack Payment Gateway', 'font-size: 12px; color: #888;');
