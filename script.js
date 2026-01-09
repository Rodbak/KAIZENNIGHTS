// ============================================
// KAIZEN NIGHTS - Ticket Booking System
// ============================================

// State Management
let selectedTicket = null;
let ticketPrice = 0;
let uploadedFile = null;

// Ticket Data
const ticketData = {
    basic: {
        name: 'CINEMA PASS',
        nameJP: 'ベーシック',
        price: 50,
        features: [
            'Cinema Room Access',
            'One Movie Screening',
            'Comfortable Seating'
        ]
    },
    premium: {
        name: 'PREMIUM PASS',
        nameJP: 'プレミアム',
        price: 80,
        features: [
            'Cinema Room Access',
            'All Movie Screenings',
            'Priority Seating',
            'Gaming Zone Access',
            'Basic Snacks & Drinks'
        ]
    },
    ultimate: {
        name: 'VIP PASS',
        nameJP: 'アルティメット',
        price: 120,
        features: [
            'Cinema Room Access',
            'All Movie Screenings',
            'VIP Front Row Seating',
            'Unlimited Gaming Zone',
            'Premium Snacks & Drinks',
            'Exclusive Kaizen Merch'
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
    
    // Reset upload
    removeFile();
    document.getElementById('transactionRef').value = '';
}

// Update Total
function updateTotal() {
    const quantity = parseInt(document.getElementById('quantity').value);
    const total = ticketPrice * quantity;
    
    document.getElementById('totalAmount').textContent = `GHS ${total}`;
    document.getElementById('paymentAmount').textContent = `GHS ${total}`;
}

// Navigate to Step
function goToStep(stepNumber) {
    // Validate current step before proceeding
    if (stepNumber === 2) {
        if (!validateStep1()) return;
    }
    
    if (stepNumber === 3) {
        // Nothing special needed
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
    
    return true;
}

// Email Validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show Error
function showError(message) {
    // Create error toast
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
        <span class="error-icon">⚠</span>
        <span class="error-message">${message}</span>
    `;
    
    // Add styles if not exists
    if (!document.getElementById('toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .error-toast {
                position: fixed;
                bottom: 2rem;
                left: 50%;
                transform: translateX(-50%);
                background: #E71C23;
                color: white;
                padding: 1rem 1.5rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                z-index: 3000;
                animation: toastSlide 0.3s ease-out;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            }
            .error-icon {
                font-size: 1.2rem;
            }
            .error-message {
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

// Handle File Upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        showError('File is too large. Maximum size is 5MB');
        return;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        showError('Invalid file type. Please upload an image or PDF');
        return;
    }
    
    uploadedFile = file;
    
    // Show preview
    const preview = document.getElementById('uploadPreview');
    const previewImage = document.getElementById('previewImage');
    const fileName = document.getElementById('fileName');
    
    preview.classList.remove('hidden');
    fileName.textContent = file.name;
    
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        previewImage.style.display = 'none';
    }
    
    // Hide upload area
    document.getElementById('uploadArea').style.display = 'none';
}

// Remove File
function removeFile() {
    uploadedFile = null;
    document.getElementById('proofUpload').value = '';
    document.getElementById('uploadPreview').classList.add('hidden');
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('previewImage').src = '';
}

// Submit Order
function submitOrder() {
    // Validate file upload
    if (!uploadedFile) {
        showError('Please upload your payment proof');
        return;
    }
    
    // Disable submit button
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'SUBMITTING...';
    
    // Collect order data
    const orderData = {
        ticket: selectedTicket,
        ticketName: ticketData[selectedTicket].name,
        price: ticketPrice,
        quantity: parseInt(document.getElementById('quantity').value),
        total: ticketPrice * parseInt(document.getElementById('quantity').value),
        customer: {
            name: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim()
        },
        transactionRef: document.getElementById('transactionRef').value.trim(),
        proofFileName: uploadedFile.name,
        submittedAt: new Date().toISOString()
    };
    
    // Store order in localStorage (for demo purposes)
    const orders = JSON.parse(localStorage.getItem('kaizenOrders') || '[]');
    orders.push(orderData);
    localStorage.setItem('kaizenOrders', JSON.stringify(orders));
    
    // Simulate submission delay
    setTimeout(() => {
        // Update confirmation phone
        document.getElementById('confirmPhone').textContent = orderData.customer.phone;
        
        // Go to confirmation step
        goToStep(4);
        
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = 'SUBMIT FOR VERIFICATION';
        
        console.log('Order submitted:', orderData);
    }, 1500);
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
console.log('%cWelcome to Kaizen Nights Booking System!', 'font-size: 12px; color: #888;');
