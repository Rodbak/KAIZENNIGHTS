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
    party: {
        name: 'PARTY PASS',
        nameJP: 'パーティーパス',
        price: 60,
        access: ['AFTERPARTY'],
        accessLabel: 'After Party Only',
        features: [
            'After Party Access',
            'Live DJ Performance',
            'Dance Floor Access'
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

// ===========================================
// JAPANESE DOOR PRELOADER
// ===========================================

// Lock body scroll during preloader
document.body.classList.add('loading');

// Preloader logic
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    
    // Minimum display time for the preloader (so users can see the animation)
    const minDisplayTime = 2000; // 2 seconds
    const loadTime = performance.now();
    const remainingTime = Math.max(0, minDisplayTime - loadTime);
    
    // Wait for minimum time, then trigger door opening
    setTimeout(() => {
        // Add loaded class to trigger door animation
        preloader.classList.add('loaded');
        
        // Unlock body scroll
        document.body.classList.remove('loading');
        
        // Remove preloader from DOM after animation completes
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, 1500); // Match the door transition duration
        
    }, remainingTime);
});

// Optional: Play sliding door sound effect
function playDoorSound() {
    // Uncomment to enable sound (requires audio file)
    // const audio = new Audio('door-slide.mp3');
    // audio.volume = 0.3;
    // audio.play().catch(() => {}); // Silently fail if autoplay blocked
}

// ===========================================
// KAIZEN-CHAN ANIME CHATBOT
// ===========================================

// Event information for chatbot responses
const eventInfo = {
    name: 'Kaizen Nights',
    date: 'February 6, 2026',
    venue: 'Academic City University',
    partyTime: '10PM',
    dj: 'DJ Absolute',
    mc: 'MC Amount',
    artists: ['Jaymore', 'Keli'],
    contact: '0530402249',
    tickets: {
        movie: { name: 'Movie Pass', price: 100, includes: 'Movie screening, free popcorn & drink, after party access' },
        gaming: { name: 'Gaming Pass', price: 100, includes: 'Gaming zone access, FIFA tournament entry, after party access' },
        party: { name: 'Party Pass', price: 60, includes: 'After party access only' },
        combo: { name: 'Combo Pass', price: 170, includes: 'Everything! Movie + Gaming + After Party (Save GHS 30!)' },
        vendor: { name: 'Vendor Spot', price: 200, includes: 'Prime location, table & setup space, social media promotion' }
    },
    prizes: {
        first: 'GHS 1,000',
        second: 'GHS 500',
        total: 'GHS 1,500'
    },
    arcade: 'Pay-to-play arcade machines available on site!'
};

// Chatbot state
let chatbotOpen = false;
let hasGreeted = false;

// Chatbot responses based on keywords
function getChatbotResponse(message) {
    const lowerMsg = message.toLowerCase();
    
    // Greetings
    if (lowerMsg.match(/^(hi|hello|hey|yo|sup|what's up|howdy|hola)/)) {
        return `Konnichiwa! 👋✨ Welcome to Kaizen Nights! I'm Kaizen-chan, your anime event assistant! How can I help you today? Feel free to ask about tickets, the event, performers, or anything else!`;
    }
    
    // Date & Time
    if (lowerMsg.includes('when') || lowerMsg.includes('date') || lowerMsg.includes('day')) {
        return `📅 Kaizen Nights is happening on **${eventInfo.date}**! Mark your calendar and don't miss it! The after party starts at **${eventInfo.partyTime}** 🎉`;
    }
    
    // Location/Venue
    if (lowerMsg.includes('where') || lowerMsg.includes('venue') || lowerMsg.includes('location') || lowerMsg.includes('place')) {
        return `📍 We're at **${eventInfo.venue}**! It's going to be epic! See you there! 🏫✨`;
    }
    
    // Party time
    if (lowerMsg.includes('party') && (lowerMsg.includes('time') || lowerMsg.includes('start') || lowerMsg.includes('when'))) {
        return `🕙 The After Party starts at **${eventInfo.partyTime}**! Get ready to dance the night away with ${eventInfo.dj} and ${eventInfo.mc}! 💃🕺`;
    }
    
    // Ticket prices
    if (lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('how much') || lowerMsg.includes('ticket')) {
        return `🎟️ Here are our ticket options:\n\n` +
            `• **Movie Pass** - GHS 100\n  (Movie + popcorn + drink + after party)\n\n` +
            `• **Gaming Pass** - GHS 100\n  (Gaming + FIFA tournament + after party)\n\n` +
            `• **Party Pass** - GHS 60\n  (After party only)\n\n` +
            `• **Combo Pass** - GHS 170 ⭐ BEST VALUE!\n  (Everything included, save GHS 30!)\n\n` +
            `Click the TICKETS section to get yours! 🎫`;
    }
    
    // Movie Pass specific
    if (lowerMsg.includes('movie pass') || (lowerMsg.includes('movie') && lowerMsg.includes('ticket'))) {
        return `🎬 The **Movie Pass** is GHS 100 and includes:\n• Full movie screening\n• Free popcorn 🍿\n• Free drink 🥤\n• After party access!\n\nPerfect for film lovers! 🎥`;
    }
    
    // Gaming Pass specific
    if (lowerMsg.includes('gaming pass') || lowerMsg.includes('gaming ticket') || lowerMsg.includes('gamer')) {
        return `🎮 The **Gaming Pass** is GHS 100 and includes:\n• Gaming zone access\n• FIFA tournament entry\n• Chance to win GHS 1,500!\n• After party access!\n\n🕹️ Plus there are pay-to-play **arcade machines** on site too!\n\nAre you ready to compete? 🏆`;
    }
    
    // Combo Pass specific
    if (lowerMsg.includes('combo') || lowerMsg.includes('full') || lowerMsg.includes('everything') || lowerMsg.includes('best')) {
        return `⭐ The **Combo Pass** is our BEST VALUE at GHS 170!\n\nYou get EVERYTHING:\n• Movie screening 🎬\n• Free popcorn & drink 🍿🥤\n• Gaming zone access 🎮\n• FIFA tournament entry 🏆\n• After party access 🎉\n\nYou save GHS 30! It's the ultimate experience! 💫`;
    }
    
    // Party Pass specific
    if (lowerMsg.includes('party pass') || lowerMsg.includes('party ticket') || lowerMsg.includes('party only')) {
        return `🎉 The **Party Pass** is GHS 60 and gives you access to the After Party starting at ${eventInfo.partyTime}!\n\nFeaturing:\n• ${eventInfo.dj} 🎧\n• ${eventInfo.mc} 🎤\n• Live performances by Jaymore & Keli 🎵\n\nLet's party! 💃`;
    }
    
    // FIFA/Competition
    if (lowerMsg.includes('fifa') || lowerMsg.includes('tournament') || lowerMsg.includes('competition') || lowerMsg.includes('prize')) {
        return `🏆 **FIFA Tournament** Details:\n\n• Game: EA FC 26\n• Format: Knockout\n• Total Prize Pool: **${eventInfo.prizes.total}**\n\n🥇 1st Place: ${eventInfo.prizes.first}\n🥈 2nd Place: ${eventInfo.prizes.second}\n\nGet a Gaming Pass or Combo Pass to enter! May the best player win! 🎮⚽`;
    }
    
    // Artists/Performers
    if (lowerMsg.includes('artist') || lowerMsg.includes('perform') || lowerMsg.includes('who is') || lowerMsg.includes('lineup') || lowerMsg.includes('jaymore') || lowerMsg.includes('keli')) {
        return `🎤 **Performing Artists:**\n\n✨ **Jaymore**\n✨ **Keli**\n\nPlus:\n🎧 **${eventInfo.dj}** on the decks\n🎤 **${eventInfo.mc}** keeping the energy high!\n\nIt's going to be legendary! 🔥`;
    }
    
    // DJ
    if (lowerMsg.includes('dj')) {
        return `🎧 **${eventInfo.dj}** will be spinning the hottest tracks at the After Party starting at ${eventInfo.partyTime}! Get ready to dance! 💃🕺🔥`;
    }
    
    // MC
    if (lowerMsg.includes('mc') || lowerMsg.includes('host')) {
        return `🎤 **${eventInfo.mc}** is our MC for the night! They'll be keeping the energy HIGH and the vibes RIGHT! 🔥✨`;
    }
    
    // Contact
    if (lowerMsg.includes('contact') || lowerMsg.includes('call') || lowerMsg.includes('whatsapp') || lowerMsg.includes('phone') || lowerMsg.includes('reach') || lowerMsg.includes('number')) {
        return `📞 You can reach us on WhatsApp!\n\n**${eventInfo.contact}**\n\nCall or message anytime! We're here to help! 💬✨`;
    }
    
    // Vendor
    if (lowerMsg.includes('vendor') || lowerMsg.includes('sell') || lowerMsg.includes('booth') || lowerMsg.includes('stand')) {
        return `🏪 Want to be a **Vendor** at Kaizen Nights?\n\n• Vendor Spot: GHS 200\n• Prime location\n• Access to 500+ attendees\n• Table & setup space provided\n• Social media promotion\n\nPerfect for food, drinks, merch, and more! Book now! 🛍️`;
    }
    
    // Food/Drinks
    if (lowerMsg.includes('food') || lowerMsg.includes('drink') || lowerMsg.includes('snack') || lowerMsg.includes('popcorn')) {
        return `🍿 Movie Pass & Combo Pass holders get:\n• 1 FREE Popcorn 🍿\n• 1 FREE Drink 🥤\n\nPlus our vendors will have delicious food and drinks available for purchase! 🍔🥤`;
    }
    
    // Arcade
    if (lowerMsg.includes('arcade') || lowerMsg.includes('machine') || lowerMsg.includes('games on site') || lowerMsg.includes('other games')) {
        return `🕹️ **Arcade Machines!**\n\nYes! We have pay-to-play arcade machines available on site! 🎮\n\nCome enjoy some classic arcade gaming fun while you're at the event! Perfect for chilling between activities! 👾✨`;
    }
    
    // Thanks
    if (lowerMsg.includes('thank') || lowerMsg.includes('thanks') || lowerMsg.includes('arigatou')) {
        return `Arigatou gozaimasu! 🙏✨ You're welcome! If you have any more questions, I'm always here to help! See you at Kaizen Nights! 🎉💫`;
    }
    
    // Bye
    if (lowerMsg.includes('bye') || lowerMsg.includes('goodbye') || lowerMsg.includes('later') || lowerMsg.includes('see you')) {
        return `Sayonara! 👋✨ Don't forget to get your tickets! See you at Kaizen Nights on ${eventInfo.date}! じゃね! 🎉🌸`;
    }
    
    // Default response
    return `Hmm, I'm not sure about that! 🤔 But I can help you with:\n\n• 📅 Event date & time\n• 📍 Venue location\n• 🎟️ Ticket prices\n• 🎤 Performing artists\n• 🏆 FIFA tournament\n• 🕹️ Arcade machines\n• 📞 Contact info\n\nJust ask me anything about Kaizen Nights! ✨`;
}

// Toggle chatbot window
function toggleChatbot() {
    const chatWindow = document.getElementById('chatbotWindow');
    const notification = document.getElementById('chatNotification');
    
    chatbotOpen = !chatbotOpen;
    
    if (chatbotOpen) {
        chatWindow.classList.add('active');
        notification.classList.add('hidden');
        
        // Send greeting if first time
        if (!hasGreeted) {
            setTimeout(() => {
                addBotMessage("Konnichiwa! 👋✨ I'm Kaizen-chan! Ask me anything about Kaizen Nights - tickets, performers, venue, or dates! 🎉");
                hasGreeted = true;
            }, 500);
        }
        
        // Focus input
        setTimeout(() => {
            document.getElementById('chatInput').focus();
        }, 300);
    } else {
        chatWindow.classList.remove('active');
    }
}

// Add bot message to chat
function addBotMessage(text) {
    const messagesContainer = document.getElementById('chatMessages');
    
    // Show typing indicator first
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = `
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Remove typing and show message after delay
    setTimeout(() => {
        typingDiv.remove();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message bot';
        messageDiv.innerHTML = `<div class="bot-name">Kaizen-chan</div>${formatMessage(text)}`;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 800 + Math.random() * 500);
}

// Add user message to chat
function addUserMessage(text) {
    const messagesContainer = document.getElementById('chatMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user';
    messageDiv.textContent = text;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Format message (convert **text** to bold)
function formatMessage(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
}

// Send message
function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addUserMessage(message);
    input.value = '';
    
    // Get and display bot response
    const response = getChatbotResponse(message);
    addBotMessage(response);
}

// Send quick reply
function sendQuickReply(question) {
    document.getElementById('chatInput').value = question;
    sendMessage();
}

// Handle Enter key in chat input
function handleChatKeypress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Initialize chatbot on page load
document.addEventListener('DOMContentLoaded', () => {
    // Show notification after 3 seconds
    setTimeout(() => {
        const notification = document.getElementById('chatNotification');
        if (notification && !chatbotOpen) {
            notification.classList.remove('hidden');
        }
    }, 3000);
});

console.log('%c🤖 Kaizen-chan Chatbot Loaded!', 'font-size: 14px; color: #ff0080;');
