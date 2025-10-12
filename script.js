document.addEventListener('DOMContentLoaded', () => {
    // !!! QUAN TRỌNG: Dán URL Apps Script MỚI NHẤT của bạn vào đây
    const API_URL = 'https://script.google.com/macros/s/AKfycbwTZW2LeEbWOnGGwrPeynZ1u5H-tadSAyfdUPkNRes8wVHOQwqnO0hIFoXV8sQ25oI/exec';

    let allCustomers = [];
    let currentFilters = { status: 'all', location: '' };

    // DOM Elements
    const dom = {
        customerList: document.getElementById('customer-list'),
        customerDetails: document.getElementById('customer-details'),
        emptyState: document.getElementById('empty-state'),
        detail: {
            name: document.getElementById('detail-name'),
            industry: document.getElementById('detail-industry'),
            address: document.getElementById('detail-address'),
            status: document.getElementById('detail-status'),
            website: document.getElementById('detail-website'),
            facebook: document.getElementById('detail-facebook'),
            instagram: document.getElementById('detail-instagram'),
            linkedin: document.getElementById('detail-linkedin'),
            khac: document.getElementById('detail-khac'),
            ghiChu: document.getElementById('detail-ghichu'),
            fileLink: document.getElementById('detail-filelink'),
            id: document.getElementById('detail-id'),
        },
        buttons: {
            save: document.getElementById('save-button'),
            analyze: document.getElementById('analyze-btn'),
        },
        modal: {
            overlay: document.getElementById('ai-modal'),
            result: document.getElementById('ai-result'),
            close: document.getElementById('close-modal-btn'),
        },
        spinner: document.querySelector('.spinner'),
        statusNav: document.querySelector('.status-nav'),
        locationSearch: document.getElementById('location-search'),
    };
    
    const statusOptions = ['Chưa tiếp cận', 'Đang tiếp cận', 'Đã phản hồi', 'Đã ký HĐ', 'Đã từ chối'];

    // --- MAIN FUNCTIONS ---
    async function initializeApp() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Lỗi mạng hoặc API không hợp lệ.');
            allCustomers = await response.json();
            updateStatusCounts();
            filterAndRender();
        } catch (error) {
            dom.customerList.innerHTML = `<div class="loader" style="color: red;">Không thể tải dữ liệu: ${error.message}</div>`;
        }
    }

    function filterAndRender() {
        const filtered = allCustomers.filter(c => {
            // SỬA LỖI: Nếu TrangThai trống, mặc định coi là "Chưa tiếp cận"
            const customerStatus = c.TrangThai || 'Chưa tiếp cận';
            
            const nameMatch = (c.TenKhachHang || '').toLowerCase().includes(currentFilters.location);
            const addressMatch = (c.DiaChi || '').toLowerCase().includes(currentFilters.location);
            const statusMatch = currentFilters.status === 'all' || customerStatus === currentFilters.status;
            
            return statusMatch && (nameMatch || addressMatch);
        });
        renderCustomerList(filtered);
    }

    function renderCustomerDetails(customerId) {
        const customer = allCustomers.find(c => c.ID == customerId); 
        if (!customer) return;

        showEmptyState(false);
        dom.detail.name.textContent = customer.TenKhachHang;
        dom.detail.industry.textContent = customer.MaNganh;
        dom.detail.address.textContent = customer.DiaChi || 'Chưa có thông tin';
        
        // SỬA LỖI: Gán trạng thái mặc định nếu trống
        const currentStatus = customer.TrangThai || 'Chưa tiếp cận';
        dom.detail.status.innerHTML = statusOptions.map(opt => `<option value="${opt}" ${currentStatus === opt ? 'selected' : ''}>${opt}</option>`).join('');
        
        dom.detail.website.value = customer.Website || ''; 
        dom.detail.facebook.value = customer.Facebook || '';
        dom.detail.instagram.value = customer.Instagram || ''; 
        dom.detail.linkedin.value = customer.LinkedIn || '';
        dom.detail.khac.value = customer.Khac || ''; 
        dom.detail.ghiChu.value = customer.GhiChu || '';
        dom.detail.fileLink.value = customer.LinkTep || ''; 
        dom.detail.id.value = customer.ID;
        
        [dom.buttons.save, dom.buttons.analyze, dom.detail.status].forEach(el => el.disabled = false);
    }
    
    function renderCustomerList(customers) {
        dom.customerList.innerHTML = customers.length === 0 
            ? '<div class="loader">Không tìm thấy khách hàng.</div>'
            : customers.map(c => `
                <div class="customer-item" data-id="${c.ID}">
                    <h4>${c.TenKhachHang || 'Khách hàng không tên'}</h4><p>${c.MaNganh || 'Không có ngành nghề'}</p>
                </div>`).join('');
    }

    function updateStatusCounts() {
        const counts = { all: allCustomers.length, new: 0, approaching: 0, replied: 0, signed: 0, rejected: 0 };
        allCustomers.forEach(c => {
            const status = c.TrangThai || 'Chưa tiếp cận'; // Mặc định
            if (status === 'Chưa tiếp cận') counts.new++; 
            if (status === 'Đang tiếp cận') counts.approaching++;
            if (status === 'Đã phản hồi') counts.replied++; 
            if (status === 'Đã ký HĐ') counts.signed++;
            if (status === 'Đã từ chối') counts.rejected++;
        });
        document.getElementById('count-all').textContent = counts.all; 
        document.getElementById('count-new').textContent = counts.new;
        document.getElementById('count-approaching').textContent = counts.approaching; 
        document.getElementById('count-replied').textContent = counts.replied;
        document.getElementById('count-signed').textContent = counts.signed; 
        document.getElementById('count-rejected').textContent = counts.rejected;
    }

    function showEmptyState(show) { 
        dom.emptyState.classList.toggle('hidden', !show); 
        dom.customerDetails.classList.toggle('hidden', show); 
    }

    // --- EVENT LISTENERS ---
    dom.statusNav.addEventListener('click', e => {
        const target = e.target.closest('.status-item');
        if (target) {
            e.preventDefault();
            dom.statusNav.querySelector('.active').classList.remove('active');
            target.classList.add('active');
            currentFilters.status = target.dataset.status;
            filterAndRender();
        }
    });
    dom.locationSearch.addEventListener('input', e => { 
        currentFilters.location = e.target.value.toLowerCase(); 
        filterAndRender(); 
    });
    dom.customerList.addEventListener('click', e => {
        const item = e.target.closest('.customer-item');
        if (item) {
            if (dom.customerList.querySelector('.selected')) {
                dom.customerList.querySelector('.selected').classList.remove('selected');
            }
            item.classList.add('selected');
            renderCustomerDetails(item.dataset.id);
        }
    });

    // ... (Các hàm save, analyze, và modal events giữ nguyên)

    // --- INITIALIZE ---
    initializeApp();
});
