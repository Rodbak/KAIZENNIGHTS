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
    gaming: {
        name: 'GAMING PASS',
        nameJP: 'ゲームパス',
        price: 120,
        access: ['FIFA', 'CINEMA', 'AFTERPARTY'],
        accessLabel: 'FIFA Tournament + All Free Experiences',
        features: [
            'FIFA Tournament Entry',
            'Compete for GHS 1,500',
            'EA FC 26 Knockout',
            'All Free Experiences Included'
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
// COUNTDOWN TIMER
// ===========================================

function initCountdown() {
    // Event date: February 6, 2026 at 7PM Ghana Time (GMT)
    const eventDate = new Date('2026-02-06T19:00:00+00:00').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = eventDate - now;
        
        // Time calculations
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Update display
        const daysEl = document.getElementById('countDays');
        const hoursEl = document.getElementById('countHours');
        const minutesEl = document.getElementById('countMinutes');
        const secondsEl = document.getElementById('countSeconds');
        
        if (daysEl && hoursEl && minutesEl && secondsEl) {
            daysEl.textContent = days.toString().padStart(2, '0');
            hoursEl.textContent = hours.toString().padStart(2, '0');
            minutesEl.textContent = minutes.toString().padStart(2, '0');
            secondsEl.textContent = seconds.toString().padStart(2, '0');
        }
        
        // If event has passed
        if (distance < 0) {
            clearInterval(countdownInterval);
            if (daysEl) {
                daysEl.textContent = '00';
                hoursEl.textContent = '00';
                minutesEl.textContent = '00';
                secondsEl.textContent = '00';
            }
            const label = document.querySelector('.countdown-label');
            if (label) {
                label.textContent = '🎉 EVENT IS LIVE!';
            }
        }
    }
    
    // Update immediately then every second
    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
}

// Initialize countdown on page load
document.addEventListener('DOMContentLoaded', initCountdown);

// ===========================================
// FLOATING CTA BUTTON
// ===========================================

function initFloatingCTA() {
    const floatingCta = document.getElementById('floatingCta');
    const heroSection = document.getElementById('home');
    const passesSection = document.getElementById('passes');
    
    if (!floatingCta || !heroSection) return;
    
    function checkScroll() {
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        const passesTop = passesSection ? passesSection.offsetTop : Infinity;
        const passesBottom = passesSection ? passesSection.offsetTop + passesSection.offsetHeight : Infinity;
        const scrollY = window.scrollY + window.innerHeight;
        const currentScroll = window.scrollY;
        
        // Show floating CTA after hero section but hide when in passes section
        const pastHero = currentScroll > heroBottom - 200;
        const inPassesSection = currentScroll >= passesTop - 100 && currentScroll <= passesBottom + 100;
        
        if (pastHero && !inPassesSection) {
            floatingCta.classList.add('visible');
        } else {
            floatingCta.classList.remove('visible');
        }
    }
    
    // Check on scroll with throttle
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                checkScroll();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // Initial check
    checkScroll();
}

// Initialize floating CTA on page load
document.addEventListener('DOMContentLoaded', initFloatingCTA);

// ===========================================
// WAITLIST FORM HANDLER
// ===========================================

// ⚠️ YOUR WHATSAPP NUMBER - Receives all waitlist registrations
// Format: country code + number (no + or spaces)
const YOUR_WHATSAPP_NUMBER = '233530402249';  // Your number

document.addEventListener('DOMContentLoaded', () => {
    const waitlistForm = document.getElementById('waitlistForm');
    
    if (waitlistForm) {
        waitlistForm.addEventListener('submit', handleWaitlistSubmit);
    }
});

async function handleWaitlistSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('waitlistName').value.trim();
    const email = document.getElementById('waitlistEmail').value.trim();
    const phone = document.getElementById('waitlistPhone').value.trim();
    
    // Validate
    if (!name || !email || !phone) {
        showError('Please fill in all fields');
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    if (phone.length < 10) {
        showError('Please enter a valid phone number');
        return;
    }
    
    // Show loading
    const form = document.getElementById('waitlistForm');
    const btn = form.querySelector('.waitlist-btn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    
    btn.disabled = true;
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
    
    // Generate waitlist reference
    const waitlistRef = 'WL-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    // Prepare waitlist data
    const waitlistData = {
        ref: waitlistRef,
        name: name,
        email: email,
        phone: phone,
        event: 'KAIZEN NIGHTS - Feb 6, 2026'
    };
    
    // Store in localStorage
    const localData = {
        ...waitlistData,
        registeredAt: new Date().toISOString(),
        experiences: ['Movie Screening', 'After Party']
    };
    const waitlist = JSON.parse(localStorage.getItem('kaizenWaitlist') || '[]');
    waitlist.push(localData);
    localStorage.setItem('kaizenWaitlist', JSON.stringify(waitlist));
    
    // Reset button
    btn.disabled = false;
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
    
    // Clear form
    form.reset();
    
    // Show success modal with WhatsApp confirmation
    showWaitlistSuccessWithWhatsApp(localData);
    
    console.log('Waitlist registration saved:', localData);
}

// Success modal that sends WhatsApp notification to you
function showWaitlistSuccessWithWhatsApp(data) {
    // Create WhatsApp message
    const whatsappMessage = `🎉 *NEW KAIZEN NIGHTS REGISTRATION*

📋 *Reference:* ${data.ref}
👤 *Name:* ${data.name}
📧 *Email:* ${data.email}
📱 *WhatsApp:* ${data.phone}
🎬 *Event:* KAIZEN NIGHTS - Feb 6, 2026
✨ *Access:* Movie + After Party (FREE)
⏰ *Time:* ${new Date().toLocaleString()}`;

    const whatsappURL = `https://wa.me/${YOUR_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;
    
    // Create success modal
    const modal = document.createElement('div');
    modal.className = 'waitlist-success-modal';
    modal.innerHTML = `
        <div class="waitlist-success-content">
            <div class="success-icon">✓</div>
            <h3>ALMOST DONE!</h3>
            <p class="success-subtitle">One more step to confirm your spot 👇</p>
            
            <div class="success-details">
                <div class="detail-row">
                    <span>Name:</span>
                    <strong>${data.name}</strong>
                </div>
                <div class="detail-row">
                    <span>Reference:</span>
                    <strong class="ref-code">${data.ref}</strong>
                </div>
                <div class="detail-row">
                    <span>Event:</span>
                    <strong>FEB 6, 2026 • 7PM</strong>
                </div>
                <div class="detail-row">
                    <span>Access:</span>
                    <strong>Movie + After Party (FREE)</strong>
                </div>
            </div>
            
            <a href="${whatsappURL}" target="_blank" class="whatsapp-confirm-btn">
                <span class="wa-icon">💬</span>
                CONFIRM VIA WHATSAPP
            </a>
            <p class="whatsapp-note">Tap above to send your registration (just click send!)</p>
            
            <button class="close-success-btn secondary" onclick="this.closest('.waitlist-success-modal').remove()">
                I'll do it later
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add styles for WhatsApp button
    if (!document.getElementById('whatsapp-btn-styles')) {
        const styles = document.createElement('style');
        styles.id = 'whatsapp-btn-styles';
        styles.textContent = `
            .whatsapp-confirm-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                width: 100%;
                padding: 1rem;
                background: linear-gradient(135deg, #25D366, #128C7E);
                border: none;
                border-radius: 8px;
                color: white;
                font-family: var(--font-heading);
                font-size: 1.1rem;
                letter-spacing: 2px;
                cursor: pointer;
                text-decoration: none;
                margin-bottom: 0.5rem;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .whatsapp-confirm-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 30px rgba(37, 211, 102, 0.3);
            }
            .wa-icon {
                font-size: 1.3rem;
            }
            .whatsapp-note {
                font-size: 0.8rem;
                color: var(--light-gray);
                margin-bottom: 1rem;
            }
            .close-success-btn.secondary {
                background: transparent;
                border: 1px solid rgba(255,255,255,0.2);
                color: var(--light-gray);
            }
            .close-success-btn.secondary:hover {
                border-color: rgba(255,255,255,0.4);
                color: white;
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Animate in
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });
}

// ===========================================
// WAITLIST ADMIN HELPERS
// ===========================================

// View all waitlist registrations (run in browser console)
function viewWaitlist() {
    const waitlist = JSON.parse(localStorage.getItem('kaizenWaitlist') || '[]');
    console.log('📋 KAIZEN NIGHTS WAITLIST');
    console.log('========================');
    console.log(`Total Registrations: ${waitlist.length}`);
    console.table(waitlist);
    return waitlist;
}

// Export waitlist as CSV (run in browser console)
function exportWaitlistCSV() {
    const waitlist = JSON.parse(localStorage.getItem('kaizenWaitlist') || '[]');
    if (waitlist.length === 0) {
        console.log('No registrations yet!');
        return;
    }
    
    const headers = ['Reference', 'Name', 'Email', 'Phone', 'Registered At'];
    const csvContent = [
        headers.join(','),
        ...waitlist.map(w => [
            w.ref,
            `"${w.name}"`,
            w.email,
            w.phone,
            w.registeredAt
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaizen-waitlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    console.log(`✅ Exported ${waitlist.length} registrations to CSV!`);
}

// Clear waitlist (use with caution!)
function clearWaitlist() {
    if (confirm('Are you sure you want to clear all waitlist data? This cannot be undone!')) {
        localStorage.removeItem('kaizenWaitlist');
        console.log('🗑️ Waitlist cleared!');
    }
}

console.log('%c📋 Waitlist Admin Commands:', 'font-size: 14px; font-weight: bold; color: #22c55e;');
console.log('  viewWaitlist()     - View all registrations');
console.log('  exportWaitlistCSV() - Download as CSV file');
console.log('  clearWaitlist()    - Clear all data (careful!)');

function showWaitlistSuccess(data) {
    // Create success modal
    const modal = document.createElement('div');
    modal.className = 'waitlist-success-modal';
    modal.innerHTML = `
        <div class="waitlist-success-content">
            <div class="success-icon">✓</div>
            <h3>YOU'RE ON THE LIST!</h3>
            <p class="success-subtitle">See you at Kaizen Nights! 🎉</p>
            
            <div class="success-details">
                <div class="detail-row">
                    <span>Name:</span>
                    <strong>${data.name}</strong>
                </div>
                <div class="detail-row">
                    <span>Reference:</span>
                    <strong class="ref-code">${data.ref}</strong>
                </div>
                <div class="detail-row">
                    <span>Event:</span>
                    <strong>FEB 6, 2026 • 7PM</strong>
                </div>
                <div class="detail-row">
                    <span>Access:</span>
                    <strong>Movie + After Party (FREE)</strong>
                </div>
            </div>
            
            <div class="success-note">
                <p>📱 Screenshot this confirmation!</p>
                <p>📧 Confirmation sent to ${data.email}</p>
                <p>💬 We'll reach out via WhatsApp</p>
            </div>
            
            <button class="close-success-btn" onclick="this.closest('.waitlist-success-modal').remove()">
                GOT IT!
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animate in
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });
    
    showSuccess('You\'re on the waitlist! 🎉');
}

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
    date: 'February 6, 2026 at 7PM',
    venue: 'Academic City University',
    partyTime: '10PM',
    dj: 'DJ Absolute',
    mc: 'MC Amount',
    artists: ['Jaymore', 'Keli'],
    contact: '0530402249',
    freeEntry: true,
    passes: {
        gaming: { name: 'Gaming Pass', price: 120, includes: 'FIFA tournament entry, compete for GHS 1,500, all free experiences included' },
        vendor: { name: 'Vendor Spot', price: 200, includes: 'Prime location, table & setup space, social media promotion' }
    },
    freeExperiences: ['Movie Screening', 'After Party', 'Entry'],
    prizes: {
        first: 'GHS 1,000',
        second: 'GHS 500',
        total: 'GHS 1,500'
    },
    experiences: {
        arcade: 'Pay-to-play arcade machines with retro games, racing simulators, and skill games!',
        goKarts: 'Indoor go-kart racing track with timed laps and leaderboards!',
        movie: 'SECRET MOVIE screening with big screen, popcorn & drinks! Title revealed at event!',
        fifa: 'EA FC 26 tournament with GHS 1,500 in prizes - pay to enter on site!',
        party: 'After party with DJ Absolute, MC Amount, and live artists!'
    }
};

// Chatbot state
let chatbotOpen = false;
let hasGreeted = false;

// Chatbot responses based on keywords
function getChatbotResponse(message) {
    const lowerMsg = message.toLowerCase();
    
    // Greetings
    if (lowerMsg.match(/^(hi|hello|hey|yo|sup|what's up|howdy|hola)/)) {
        return `Konnichiwa! 👋✨ Welcome to Kaizen Nights! I'm Kaizen-chan!\n\n🎉 **EVERYTHING IS FREE!** Movie & Party are FREE!\n\nJust join the waitlist! Arcade is pay-to-play, and FIFA tournament requires a Gaming Pass (GHS 120). Ask me anything! 🏎️🕹️🎬`;
    }
    
    // Free Entry
    if (lowerMsg.includes('free') && (lowerMsg.includes('entry') || lowerMsg.includes('enter') || lowerMsg.includes('get in') || lowerMsg.includes('admission'))) {
        return `🎉 **EVERYTHING IS FREE!**\n\n✅ **FREE:**\n• 🎬 Movie Screening\n• 🎉 After Party\n• 🚪 Entry\n\nJust join the waitlist to secure your spot!\n\n💰 **Pay to Play:**\n• 🏎️ Go Karts - Pay per race\n• 🕹️ Arcade - Pay per game\n• 🎮 FIFA Tournament - Gaming Pass (GHS 120)\n\nJoin the waitlist now! ✨`;
    }
    
    // Go Karts
    if (lowerMsg.includes('go kart') || lowerMsg.includes('gokart') || lowerMsg.includes('kart') || lowerMsg.includes('racing') || lowerMsg.includes('race')) {
        return `🏎️ **GO KARTS!**\n\nYes! We have an indoor go-kart racing track!\n\n• 🏁 Race your friends\n• ⏱️ Timed laps\n• 🏆 Compete for the best time on our leaderboard!\n\nPay per race on site. Feel the adrenaline rush! 🔥\n\nEntry to Kaizen Nights is FREE - just come in and race!`;
    }
    
    // Date & Time
    if (lowerMsg.includes('when') || lowerMsg.includes('date') || lowerMsg.includes('day') || lowerMsg.includes('time') || lowerMsg.includes('start')) {
        return `📅 Kaizen Nights is happening on **${eventInfo.date}**!\n\n🕖 Event starts at **7PM**\n🎉 After party starts at **${eventInfo.partyTime}**\n\nMark your calendar and don't miss it! ✨`;
    }
    
    // Location/Venue
    if (lowerMsg.includes('where') || lowerMsg.includes('venue') || lowerMsg.includes('location') || lowerMsg.includes('place')) {
        return `📍 We're at **${eventInfo.venue}**! It's going to be epic! See you there! 🏫✨`;
    }
    
    // Party time
    if (lowerMsg.includes('party') && (lowerMsg.includes('time') || lowerMsg.includes('start') || lowerMsg.includes('when'))) {
        return `🕙 The After Party starts at **${eventInfo.partyTime}**! Get ready to dance the night away with ${eventInfo.dj} and ${eventInfo.mc}! 💃🕺`;
    }
    
    // Ticket/Pass prices
    if (lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('how much') || lowerMsg.includes('ticket') || lowerMsg.includes('pass')) {
        return `🎉 **EVERYTHING IS FREE!**\n\n✅ **FREE (Join Waitlist):**\n• 🎬 Movie Screening\n• 🎉 After Party\n• 🚪 Entry\n\n💰 **Only Paid Experience:**\n• **Gaming Pass** - GHS 120 🏆\n  (FIFA tournament + compete for GHS 1,500!)\n\n🎮 **Pay to Play on Site:**\n• 🏎️ Go Karts - Pay per race\n• 🕹️ Arcade - Pay per game\n\nJoin the waitlist to secure your FREE spot! 🎫`;
    }
    
    // Movie specific
    if (lowerMsg.includes('movie pass') || (lowerMsg.includes('movie') && lowerMsg.includes('ticket'))) {
        return `🎬 **MOVIE SCREENING IS FREE!**\n\nJust join the waitlist to secure your spot!\n\n• Secret movie screening 🤫\n• Premium cinema setup\n• Snacks & drinks available on site\n• After party also FREE!\n\nJoin the waitlist now! ✨`;
    }
    
    // Secret Movie / What movie
    if (lowerMsg.includes('what movie') || lowerMsg.includes('which movie') || lowerMsg.includes('movie name') || lowerMsg.includes('secret movie') || lowerMsg.includes('film')) {
        return `🤫 **IT'S A SECRET!**\n\nThe movie will be revealed at the event! All we can say is:\n\n🔥 Highly Requested\n⭐ Fan Favorite\n🎬 Premium Experience\n\n**And it's FREE!** Just join the waitlist to secure your spot! 🎥✨`;
    }
    
    // Gaming Pass specific
    if (lowerMsg.includes('gaming pass') || lowerMsg.includes('gaming ticket') || lowerMsg.includes('gamer')) {
        return `🎮 The **Gaming Pass** is GHS 120 and includes:\n\n• 🏆 FIFA Tournament Entry\n• 💰 Compete for GHS 1,500 in prizes!\n• ⚽ EA FC 26 Knockout Format\n• ✅ All FREE experiences included!\n\n🥇 1st Place: GHS 1,000\n🥈 2nd Place: GHS 500\n\nThis is the ONLY paid pass! Are you ready to compete? 🔥`;
    }
    
    // Best value / what should I get
    if (lowerMsg.includes('combo') || lowerMsg.includes('full') || lowerMsg.includes('everything') || lowerMsg.includes('best')) {
        return `✨ **Great news - almost everything is FREE!**\n\n🎬 **Movie Screening** - FREE!\n• Just join the waitlist\n\n🎉 **After Party** - FREE!\n• Live DJ & artists included\n\n🎮 **Gaming Pass** (GHS 120) - Only if you want to compete!\n• FIFA tournament entry\n• Win up to GHS 1,500!\n\n🕹️ Arcade & Go Karts are pay-to-play on site!\n\nJoin the waitlist to get started! 🌟`;
    }
    
    // Party specific
    if (lowerMsg.includes('party pass') || lowerMsg.includes('party ticket') || lowerMsg.includes('party only') || lowerMsg.includes('after party')) {
        return `🎉 **The After Party is FREE!**\n\nJust join the waitlist to secure your spot!\n\nStarting at ${eventInfo.partyTime} featuring:\n• ${eventInfo.dj} 🎧\n• ${eventInfo.mc} 🎤\n• Live performances by Jaymore & Keli 🎵\n\nJoin the waitlist now! 💃`;
    }
    
    // FIFA/Competition
    if (lowerMsg.includes('fifa') || lowerMsg.includes('tournament') || lowerMsg.includes('competition') || lowerMsg.includes('prize')) {
        return `🏆 **FIFA Tournament** Details:\n\n• Game: EA FC 26\n• Format: Knockout\n• Total Prize Pool: **${eventInfo.prizes.total}**\n\n🥇 1st Place: ${eventInfo.prizes.first}\n🥈 2nd Place: ${eventInfo.prizes.second}\n\n🎮 **Gaming Pass Required** - GHS 120\nThis is the ONLY thing you need to pay for!\n\nMay the best player win! ⚽🔥`;
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
        return `🕹️ **ARCADE ZONE!**\n\nOur arcade is PACKED with awesome games!\n\n• 🎮 Retro arcade classics\n• 🏎️ Racing simulators\n• 🎯 Skill games & prizes\n• 👾 And much more!\n\nAll pay-to-play, so just come in (FREE entry!) and play what you like! Perfect for hanging out between the movie, races, and party! ✨`;
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
    return `Hmm, I'm not sure about that! 🤔 But I can help you with:\n\n🎉 **EVERYTHING IS FREE!**\n\n• 🎬 Movie Screening - FREE (Waitlist)\n• 🎉 After Party - FREE (Waitlist)\n• 🏎️ Go Karts - Pay to Race\n• 🕹️ Arcade Zone - Pay to Play\n• 🎮 FIFA Tournament - Gaming Pass (GHS 120)\n• 📅 Event Date & Time\n• 📞 Contact Info\n\nJust ask me anything about Kaizen Nights! ✨`;
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
