/**
 * UrbanServeX Marketplace - App Logic
 * Professional, clean, and robust implementation.
 */

// --- Default Data ---
const DEFAULT_SERVICES = [
    {
        id: 1,
        name: "UrbanServeX Electrical Pro",
        type: "Electrician",
        phone: "9876543210",
        location: "Mumbai",
        verified: true,
        rating: 5,
        status: "Available",
        emergency: true,
        favorite: false
    },
    {
        id: 2,
        name: "Elite Plumbing Solutions",
        type: "Plumber",
        phone: "9123456789",
        location: "Bangalore",
        verified: true,
        rating: 4,
        status: "Busy",
        emergency: true,
        favorite: false
    }
];

// --- Application State ---
let services = [];
let currentFilter = 'All';
let searchQuery = '';
let emergencyOnly = false;
let favoritesOnly = false;
let currentSort = 'default';

const EMAILJS_CONFIG = {
    serviceId: 'service_jb0umkw',
    templateId: 'template_scj2eje',
    publicKey: 'RryijkDyrccfOk_HB',
    toEmail: 'aliyafathima467@gmail.com'
};

function isEmailJsConfigured() {
    return !Object.values(EMAILJS_CONFIG).some(value => value.startsWith('YOUR_EMAILJS_'));
}

// --- View Management ---
function showView(viewId) {
    console.log('Switching to view:', viewId);
    const views = document.querySelectorAll('.view');
    views.forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none'; // Forced hidden
    });
    
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block'; // Forced visible
        console.log('View activated:', viewId);
    } else {
        console.error('View not found:', viewId);
    }
    window.scrollTo(0, 0);
}

window.showView = showView; // Make it global for inline onclicks

function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

window.scrollToSection = scrollToSection;

function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    const statusEl = document.getElementById('contactStatus');
    const submitBtn = contactForm.querySelector('button[type="submit"]');

    if (window.emailjs && isEmailJsConfigured()) {
        window.emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
    }

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('contactName').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        const message = document.getElementById('contactMessage').value.trim();

        if (!window.emailjs) {
            alert('EmailJS could not load. Please check your internet connection and try again.');
            return;
        }

        if (!isEmailJsConfigured()) {
            alert('Please add your EmailJS service ID, template ID, and public key in script.js first.');
            return;
        }

        const templateParams = {
            from_name: name,
            from_email: email,
            reply_to: email,
            to_email: EMAILJS_CONFIG.toEmail,
            subject: `UrbanServeX contact message from ${name}`,
            message
        };

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
        }
        if (statusEl) {
            statusEl.className = 'small mb-0 text-muted';
            statusEl.textContent = 'Sending your message...';
        }

        try {
            await window.emailjs.send(
                EMAILJS_CONFIG.serviceId,
                EMAILJS_CONFIG.templateId,
                templateParams
            );

            contactForm.reset();
            if (statusEl) {
                statusEl.className = 'small mb-0 text-success fw-semibold';
                statusEl.textContent = 'Message sent successfully. We will get back to you soon.';
            }
        } catch (error) {
            console.error('EmailJS send failed:', error);
            if (statusEl) {
                statusEl.className = 'small mb-0 text-danger fw-semibold';
                statusEl.textContent = 'Message could not be sent. Please try again.';
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
            }
        }
    });
}

// --- Auth Logic ---
function setupAuthListeners() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const pass = document.getElementById('loginPassword').value;

            const users = JSON.parse(localStorage.getItem('sf_users') || '[]');
            const user = users.find(u => u.email === email && u.pass === pass);

            if (user) {
                localStorage.setItem('sf_currentUser', JSON.stringify(user));
                enterApp();
            } else {
                alert('Invalid email or password');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const pass = document.getElementById('regPassword').value;

            const users = JSON.parse(localStorage.getItem('sf_users') || '[]');
            if (users.some(u => u.email === email)) {
                alert('Email already registered');
                return;
            }

            const newUser = { name, email, pass };
            users.push(newUser);
            localStorage.setItem('sf_users', JSON.stringify(users));
            localStorage.setItem('sf_currentUser', JSON.stringify(newUser));
            
            alert('Account created successfully!');
            enterApp();
        });
    }
}

function enterApp() {
    const user = localStorage.getItem('sf_currentUser');
    const city = localStorage.getItem('userLocation');
    
    if (!user) {
        showView('loginView');
        return;
    }

    if (!city) {
        showView('homepageView');
        scrollToSection('citiesSection');
    } else {
        showView('mainAppView');
        initMainApp();
    }
}

function logout() {
    localStorage.removeItem('sf_currentUser');
    showView('homepageView');
}

window.logout = logout;

// --- City Selection ---
window.selectCity = function(city) {
    if (!city || city.trim() === '') {
        alert('Please enter a valid city name');
        return;
    }
    const cleanCity = city.trim();
    localStorage.setItem('userLocation', cleanCity);
    
    // If not logged in, go to login
    const user = localStorage.getItem('sf_currentUser');
    if (!user) {
        showView('loginView');
    } else {
        enterApp();
    }
};

// --- Initialization Refinement ---
function init() {
    const user = localStorage.getItem('sf_currentUser');
    const city = localStorage.getItem('userLocation');

    if (user && city) {
        showView('mainAppView');
        initMainApp();
    } else {
        showView('homepageView');
    }

    setupAuthListeners();
    setupContactForm();
}

function initMainApp() {
    loadServices();
    renderServices();
    setupEventListeners();
    
    const city = localStorage.getItem('userLocation');
    updateCityDisplay(city);
}

/**
 * Update the city name in the header
 */
function updateCityDisplay(city) {
    const cityText = document.getElementById('currentCityText');
    if (cityText) {
        cityText.textContent = city || 'Location';
    }
}

// --- DOM Elements ---
const servicesGrid = document.getElementById('servicesGrid');
const searchInput = document.getElementById('searchInput');
const searchSuggestions = document.getElementById('searchSuggestions');
const filterButtons = document.querySelectorAll('.filter-btn');
const emptyState = document.getElementById('emptyState');
const serviceModal = document.getElementById('serviceModal');
const openFormBtn = document.getElementById('openFormBtn');
const closeModalBtn = document.querySelector('.close-modal');
const cancelModalBtn = document.querySelector('.cancel-modal');
const addServiceForm = document.getElementById('addServiceForm');

// Booking Elements
const bookingView = document.getElementById('bookingView');
const bookingFormContent = document.getElementById('bookingFormContent');
const bookingSuccessContent = document.getElementById('bookingSuccessContent');
const detailedBookingForm = document.getElementById('detailedBookingForm');
const bookingToastc = document.getElementById('bookingToast');
const confirmBookingBtn = document.getElementById('confirmBookingBtn');

// Summary elements
const summaryService = document.getElementById('summaryService');
const summaryDateTime = document.getElementById('summaryDateTime');
const summaryCity = document.getElementById('summaryCity');

let activeBookingId = null;

// New Elements
const emergencyToggle = document.getElementById('emergencyToggle');
const favoritesToggle = document.getElementById('favoritesToggle');
const sortSelect = document.getElementById('sortSelect');

// Onboarding Elements
const onboardingOverlay = document.getElementById('onboardingOverlay');
const stepLocation = document.getElementById('stepLocation');
const stepCategory = document.getElementById('stepCategory');
const onboardingLocationInput = document.getElementById('onboardingLocation');
const onboardingCatPills = document.querySelectorAll('.cat-pill');
const progressStep = document.getElementById('progressStep');
const btnToStep2 = document.getElementById('btnToStep2');
const btnBackTo1 = document.getElementById('btnBackTo1');
const btnFinishOnboarding = document.getElementById('btnFinishOnboarding');

// --- Data Generation Constants ---
const INDIAN_CITIES = [
    "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Kolkata", 
    "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Kochi",
    "Surat", "Indore", "Patna", "Nagpur", "Bhopal", "Coimbatore"
];
const SERVICE_TYPES =[
    "Electrician",
    "Plumbing",
    "AC Repair",
    "Home Cleaning",
    "Salon at Home",
    "Laptop Repair",
    "Car Service",
    "CCTV Installation"
];
const BUSINESS_PREFIXES = ["Electrician",
    "Plumbing",
    "AC Repair",
    "Home Cleaning",
    "Salon at Home",
    "Laptop Repair",
    "Car Service",
    "CCTV Installation"];
const BUSINESS_SUFFIXES = [ "Pro",
    "Solutions",
    "Services",
    "Care",
    "Experts",
    "Studio",
    "Garage",
    "Systems"];
const INDIAN_NAMES = ["Arjun Mehta",
    "Sameer Sheikh",
    "Imran Qureshi",
    "Ayesha Noor",
    "Meher Khan",
    "Armaan Rizvi",
    "Yash Malhotra",
    "Dev Bansal"];

// --- Core Functions ---

/**
 * Generate mock services for a specific city
 */
function generateCityServices(city) {
    const generated = [];
    const count = Math.floor(Math.random() * 6) + 15; // 15-20 services

    for (let i = 0; i < count; i++) {
        const type = SERVICE_TYPES[Math.floor(Math.random() * SERVICE_TYPES.length)];
        const prefix = BUSINESS_PREFIXES[Math.floor(Math.random() * BUSINESS_PREFIXES.length)];
        const name = INDIAN_NAMES[Math.floor(Math.random() * INDIAN_NAMES.length)];
        const suffix = BUSINESS_SUFFIXES[Math.floor(Math.random() * BUSINESS_SUFFIXES.length)];
        
        // Ensure city name is ALWAYS prominent in the business name
        const businessName = Math.random() > 0.4 
            ? `${city} ${type} ${suffix}`
            : `${prefix} ${name} ${type} (${city})`;

        const phone = "9" + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
        
        generated.push({
            id: Date.now() + Math.random(),
            name: businessName,
            type: type,
            phone: phone,
            location: city, // Explicitly use the city name
            verified: Math.random() > 0.3,
            rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
            status: Math.random() > 0.3 ? "Available" : "Busy",
            emergency: Math.random() > 0.5,
            favorite: false
        });
    }
    return generated;
}

/**
 * Initialize the application
 */
function init() {
    const user = localStorage.getItem('sf_currentUser');
    const city = localStorage.getItem('userLocation');

    if (user && city) {
        showView('mainAppView');
        initMainApp();
    } else {
        showView('homepageView');
    }

    setupAuthListeners();
    setupContactForm();
}

function initMainApp() {
    loadServices();
    renderServices();
    setupEventListeners();
    
    const city = localStorage.getItem('userLocation');
    updateCityDisplay(city);
}

/**
 * Load services from localStorage or use defaults
 */
function loadServices() {
    try {
        const saved = localStorage.getItem('localServices');
        const userLocation = localStorage.getItem('userLocation');

        if (saved) {
            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) throw new Error('Invalid data format');
            
            // Check if existing data matches current location
            const dataLocation = parsed.length > 0 ? parsed[0].location : null;
            
            if (userLocation && dataLocation && dataLocation.toLowerCase() !== userLocation.toLowerCase()) {
                // Location changed, regenerate
                services = generateCityServices(userLocation);
                saveServices();
            } else {
                // Migration / Sanitization
                services = parsed.map(s => ({
                    id: s.id || Date.now() + Math.random(),
                    name: s.name || 'Unknown Provider',
                    type: s.type || 'Other',
                    phone: s.phone || 'N/A',
                    location: s.location || 'N/A',
                    verified: !!s.verified,
                    rating: Number(s.rating) || 0,
                    status: s.status || 'Available',
                    emergency: !!s.emergency,
                    favorite: !!s.favorite
                }));
            }
        } else {
            // No saved data, generate based on location if available
            if (userLocation) {
                services = generateCityServices(userLocation);
            } else {
                services = [...DEFAULT_SERVICES];
            }
            saveServices();
        }
    } catch (error) {
        console.error('Error loading services:', error);
        services = [...DEFAULT_SERVICES];
        saveServices();
    }
}

/**
 * Save services to localStorage
 */
function saveServices() {
    localStorage.setItem('localServices', JSON.stringify(services));
}

/**
 * Render service cards based on filters, search, and sorting
 */
function renderServices() {
    let filtered = services.filter(service => {
        const query = searchQuery.toLowerCase().trim();
        const name = (service.name || '').toLowerCase();
        const type = (service.type || '').toLowerCase();
        const location = (service.location || '').toLowerCase();

        const matchesSearch = 
            name.includes(query) || 
            type.includes(query) ||
            location.includes(query);
        
        const matchesFilter = currentFilter === 'All' || service.type === currentFilter;
        const matchesEmergency = !emergencyOnly || !!service.emergency;
        const matchesFavorites = !favoritesOnly || !!service.favorite;
        
        return matchesSearch && matchesFilter && matchesEmergency && matchesFavorites;
    });

    // Sorting
    if (currentSort === 'rating') {
        filtered.sort((a, b) => b.rating - a.rating);
    } else if (currentSort === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    servicesGrid.innerHTML = '';

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        filtered.forEach(service => {
            const card = createServiceCard(service);
            servicesGrid.appendChild(card);
        });
    }
}

/**
 * Create a service card element
 */
function createServiceCard(service) {
    const cardCol = document.createElement('div');
    cardCol.className = 'col';
    
    // Rating Stars
    const rating = service.rating || 0;
    const starsHtml = Array.from({ length: 5 }, (_, i) => 
        `<span class="star ${i < rating ? 'filled' : ''}">★</span>`
    ).join('');

    cardCol.innerHTML = `
        <div class="service-card shadow-sm h-100" data-type="${service.type}">
            <div class="card-top d-flex justify-content-between align-items-start mb-3">
                <div class="card-badges d-flex flex-wrap gap-1">
                    ${service.verified ? `
                        <span class="verified-badge">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Verified
                        </span>
                    ` : ''}
                    ${service.emergency ? `<span class="emergency-badge badge bg-danger-subtle text-danger border-0">24/7 Emergency</span>` : ''}
                </div>
                <div class="card-actions d-flex gap-1">
                    <button class="action-btn favorite-btn ${service.favorite ? 'active' : ''} btn btn-link p-1 text-decoration-none" onclick="window.toggleFavorite(${service.id})" title="Toggle Favorite">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${service.favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    </button>
                    <button class="action-btn delete-btn btn btn-link p-1 text-decoration-none text-muted" onclick="window.deleteService(${service.id})" title="Delete Service">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            </div>
            
            <div class="card-header border-0 bg-transparent p-0 mb-2">
                <h3 class="service-name h5 fw-bold mb-1">${escapeHtml(service.name || 'N/A')}</h3>
                <div class="rating-display mb-2">
                    ${starsHtml}
                </div>
            </div>

            <div class="mb-3">
                <span class="service-type-tag">${escapeHtml(service.type || 'Other')}</span>
            </div>
            
            <div class="service-info d-flex flex-column gap-2">
                <div class="status-indicator d-flex align-items-center gap-2 small fw-bold">
                    <span class="status-dot ${(service.status || 'Available').toLowerCase()} rounded-circle" style="width: 8px; height: 8px; display: inline-block;"></span>
                    <span class="text-uppercase" style="letter-spacing: 0.5px; font-size: 0.7rem;">${service.status || 'Available'}</span>
                </div>
                <div class="info-item d-flex align-items-center gap-2 text-muted small">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    <span>${escapeHtml(service.phone || 'N/A')}</span>
                </div>
                <div class="info-item d-flex align-items-center gap-2 text-muted small">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span>${escapeHtml(service.location || 'N/A')}</span>
                </div>
            </div>

            <button type="button" class="btn btn-custom btn-book-now" onclick="event.preventDefault(); event.stopPropagation(); window.initiateBooking(${service.id})">
                Book Now
            </button>
        </div>
    `;
    
    return cardCol;
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Search
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderServices();
        handleSearchSuggestions(e.target.value);
    });

    // Close suggestions on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#mainSearchContainer')) {
            searchSuggestions.classList.add('hidden');
        }
    });

    // Category pills
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-category');
            renderServices();
        });
    });

    // Emergency & Favorites toggles
    emergencyToggle.addEventListener('change', (e) => {
        emergencyOnly = e.target.checked;
        renderServices();
    });

    favoritesToggle.addEventListener('change', (e) => {
        favoritesOnly = e.target.checked;
        renderServices();
    });

    // Sorting
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderServices();
    });

    // Modal controls
    openFormBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    // Form submission
    addServiceForm.addEventListener('submit', handleFormSubmit);

    // Booking Confirmation
    if (detailedBookingForm) {
        detailedBookingForm.addEventListener('submit', handleBookingConfirm);
        
        // Real-time summary updates
        const updateSummary = () => {
            const date = document.getElementById('bookingDate').value;
            const slot = document.getElementById('bookingTimeSlot').value;
            summaryDateTime.textContent = (date && slot) ? `${date} | ${slot}` : '---';
        };

        document.getElementById('bookingDate').addEventListener('change', updateSummary);
        document.getElementById('bookingTimeSlot').addEventListener('change', updateSummary);

        const bookingPhoneInput = document.getElementById('bookingUserPhone');
        if (bookingPhoneInput) {
            bookingPhoneInput.addEventListener('input', () => {
                bookingPhoneInput.value = bookingPhoneInput.value.replace(/\D/g, '').slice(0, 10);
            });
        }
    }
}

/**
 * Initiate booking flow
 */
window.initiateBooking = function(id) {
    console.log('Initiating booking for ID:', id);
    const service = services.find(s => s.id === id);
    if (!service) {
        console.error('Service not found for ID:', id);
        return;
    }

    activeBookingId = id;
    
    // Reset view state
    if (bookingFormContent) bookingFormContent.classList.remove('hidden');
    if (bookingSuccessContent) bookingSuccessContent.classList.add('hidden');
    if (detailedBookingForm) detailedBookingForm.reset();

    // Populate Service Info
    const nameEl = document.getElementById('bookingServiceName');
    const locEl = document.getElementById('bookingLocation');
    const catEl = document.getElementById('bookingCategory');
    const ratEl = document.getElementById('bookingRating');

    if (nameEl) nameEl.textContent = service.name;
    if (locEl) locEl.textContent = service.location;
    if (catEl) catEl.textContent = service.type;
    if (ratEl) ratEl.textContent = `⭐ ${service.rating || '4.0'}`;
    
    // Summary defaults
    if (summaryService) summaryService.textContent = service.name;
    if (summaryCity) summaryCity.textContent = service.location;
    if (summaryDateTime) summaryDateTime.textContent = '---';

    // Pre-fill user details if logged in
    const currentUser = JSON.parse(localStorage.getItem('sf_currentUser'));
    if (currentUser && document.getElementById('bookingUserName')) {
        document.getElementById('bookingUserName').value = currentUser.name || '';
    }
    
    showView('bookingView');
};

/**
 * Handle booking confirmation
 */
function handleBookingConfirm(e) {
    e.preventDefault();
    const service = services.find(s => s.id === activeBookingId);
    if (!service) return;

    const bookingData = {
        id: Date.now(),
        serviceId: service.id,
        serviceName: service.name,
        userName: document.getElementById('bookingUserName').value,
        userPhone: document.getElementById('bookingUserPhone').value,
        date: document.getElementById('bookingDate').value,
        slot: document.getElementById('bookingTimeSlot').value,
        address: document.getElementById('bookingAddress').value,
        issue: document.getElementById('bookingIssue').value,
        payment: document.querySelector('input[name="paymentMethod"]:checked').value,
        userEmail: JSON.parse(localStorage.getItem('sf_currentUser')).email,
        timestamp: new Date().toISOString()
    };

    // Save booking to history
    const bookings = JSON.parse(localStorage.getItem('sf_bookings') || '[]');
    bookings.push(bookingData);
    localStorage.setItem('sf_bookings', JSON.stringify(bookings));

    // UI Feedback: Show Success State
    document.getElementById('successMessage').innerHTML = `Your booking for <b>${service.name}</b> has been scheduled successfully. ✅`;
    bookingFormContent.classList.add('hidden');
    bookingSuccessContent.classList.remove('hidden');
    window.scrollTo(0, 0);
}

/**
 * Interaction handlers
 */
window.toggleFavorite = function(id) {
    const service = services.find(s => s.id === id);
    if (service) {
        service.favorite = !service.favorite;
        saveServices();
        renderServices();
    }
};

window.deleteService = function(id) {
    if (confirm('Are you sure you want to remove this service?')) {
        services = services.filter(s => s.id !== id);
        saveServices();
        renderServices();
    }
};

/**
 * Handle new service registration
 */
function handleFormSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('serviceName').value.trim();
    const type = document.getElementById('serviceType').value;
    const rating = parseInt(document.getElementById('serviceRating').value);
    const phone = document.getElementById('servicePhone').value.trim();
    const status = document.getElementById('serviceStatus').value;
    const location = document.getElementById('serviceLocation').value.trim();
    const verified = document.getElementById('serviceVerified').checked;
    const emergency = document.getElementById('serviceEmergency').checked;

    if (!name || !type || !phone || !location) return;

    const newService = {
        id: Date.now(),
        name,
        type,
        rating,
        phone,
        status,
        location,
        verified,
        emergency,
        favorite: false
    };

    services.unshift(newService);
    saveServices();
    renderServices();
    
    addServiceForm.reset();
    closeModal();
}

/**
 * Handle city search suggestions and fallbacks
 */
function handleSearchSuggestions(query) {
    if (!query || query.length < 2) {
        searchSuggestions.classList.add('hidden');
        return;
    }

    const lowerQuery = query.toLowerCase();
    const matches = INDIAN_CITIES.filter(city => 
        city.toLowerCase().includes(lowerQuery)
    );

    searchSuggestions.innerHTML = '';
    searchSuggestions.classList.remove('hidden');

    if (matches.length > 0) {
        matches.slice(0, 5).forEach(city => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.innerHTML = `
                <span class="icon">📍</span>
                <span class="city-name">${city}</span>
            `;
            item.onclick = () => {
                searchInput.value = city;
                searchQuery = city;
                selectCity(city);
                searchSuggestions.classList.add('hidden');
            };
            searchSuggestions.appendChild(item);
        });
    } else {
        const fallback = document.createElement('div');
        fallback.className = 'suggestion-fallback';
        fallback.innerHTML = `
            We have these cities now, we will try to explore <span>${escapeHtml(query)}</span> soon!
        `;
        searchSuggestions.appendChild(fallback);
    }
}

/**
 * Modal visibility helpers
 */
function openModal() {
    serviceModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    serviceModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

/**
 * Simple HTML escaping for security
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// --- Run App ---
init();
