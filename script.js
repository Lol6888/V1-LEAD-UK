document.addEventListener('DOMContentLoaded', () => {
    // !!! QUAN TRỌNG: Dán URL Apps Script MỚI NHẤT của bạn vào đây
    const API_URL = 'https://script.google.com/macros/s/AKfycbzHu-mbqV9yj-aTnxlSav4NLuTUQ2Reo-VUoLw_0IshiaSBETD-ixNdOeuORQu_Yo8/exec';

    let allCustomers = [];
    let currentFilters = { status: 'all', location: '', industry: '', social: [] };

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
        industryFilter: document.getElementById('industry-filter'),
        socialFilters: document.querySelectorAll('.social-filters input[type="checkbox"]'),
        savedAnalysisContainer: document.getElementById('saved-analysis-container'),
        savedAnalysisContent: document.getElementById('saved-analysis-content'),
        analyzeBtnText: document.getElementById('analyze-btn-text'),
        fileInput: document.getElementById('file-input'),
        uploadProgress: document.getElementById('upload-progress'),
        fileUploadPrompt: document.getElementById('file-upload-prompt'),
        fileList: document.getElementById('file-list'),
    };
    
    const statusOptions = ['Chưa tiếp cận', 'Đang tiếp cận', 'Đã phản hồi', 'Đã ký HĐ', 'Đã từ chối'];

    async function initializeApp() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Lỗi mạng hoặc API không hợp lệ.');
            allCustomers = await response.json();
            populateIndustryFilter();
            setupEventListeners();
            updateStatusCounts();
            filterAndRender();
        } catch (error) {
            dom.customerList.innerHTML = `<div class="loader" style="color: red;">Không thể tải dữ liệu: ${error.message}</div>`;
        }
    }

    function populateIndustryFilter() {
        const allIndustryStrings = allCustomers.map(c => c.MaNganh).filter(Boolean);
        const individualIndustries = allIndustryStrings.flatMap(maNganh => maNganh.split(';').map(s => s.trim()));
        const uniqueIndustries = [...new Set(individualIndustries)].filter(Boolean);
        uniqueIndustries.sort();
        uniqueIndustries.forEach(industry => {
            const option = document.createElement('option');
            option.value = industry;
            option.textContent = industry;
            dom.industryFilter.appendChild(option);
        });
    }

    function setupEventListeners() {
        dom.statusNav.addEventListener('click', e => {
            const target = e.target.closest('.status-item');
            if (target) {
                e.preventDefault();
                dom.statusNav.querySelector('.active')?.classList.remove('active');
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
                dom.customerList.querySelector('.selected')?.classList.remove('selected');
                item.classList.add('selected');
                renderCustomerDetails(item.dataset.id);
            }
        });
        dom.buttons.save.addEventListener('click', saveChanges);
        dom.buttons.analyze.addEventListener('click', analyzeCustomer);
        dom.modal.close.addEventListener('click', () => dom.modal.overlay.classList.add('hidden'));
        dom.modal.overlay.addEventListener('click', e => { 
            if (e.target === dom.modal.overlay) dom.modal.overlay.classList.add('hidden'); 
        });
        dom.fileUploadPrompt.addEventListener('click', () => dom.fileInput.click());
        dom.fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) handleFiles(files);
        });
        dom.fileList.addEventListener('click', e => {
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                if (confirm("Bạn có chắc chắn muốn xóa tệp này không?")) {
                    const fileUrlToDelete = deleteBtn.dataset.url;
                    updateFileLinks({ linkToDelete: fileUrlToDelete });
                }
            }
        });
        dom.industryFilter.addEventListener('change', e => {
            currentFilters.industry = e.target.value;
            filterAndRender();
        });
        dom.socialFilters.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                currentFilters.social = Array.from(dom.socialFilters)
                    .filter(i => i.checked)
                    .map(i => i.value);
                filterAndRender();
            });
        });
    }

    async function saveChanges() {
        // ... (Giữ nguyên không thay đổi)
    }

    async function analyzeCustomer() {
        // ... (Giữ nguyên không thay đổi)
    }
    
    async function updateFileLinks(updateData) {
        // ... (Giữ nguyên không thay đổi)
    }

    async function handleFiles(files) {
        // ... (Giữ nguyên không thay đổi)
    }

    function renderCustomerDetails(customerId) {
        // ... (Giữ nguyên không thay đổi)
    }
    
    function filterAndRender() {
        const filtered = allCustomers.filter(c => {
            const customerStatus = c.TrangThai || 'Chưa tiếp cận';
            const nameMatch = (c.TenKhachHang || '').toLowerCase().includes(currentFilters.location);
            const addressMatch = (c.DiaChi || '').toLowerCase().includes(currentFilters.location);
            const searchMatch = nameMatch || addressMatch;
            const statusMatch = currentFilters.status === 'all' || customerStatus === currentFilters.status;
            const industryMatch = currentFilters.industry === '' || (c.MaNganh && c.MaNganh.includes(currentFilters.industry));
            const socialMatch = currentFilters.social.length === 0 || 
                                currentFilters.social.some(social => c[social] && c[social].trim() !== '');
            return statusMatch && searchMatch && industryMatch && socialMatch;
        });
        renderCustomerList(filtered);
    }
    
    function renderCustomerList(customers) {
        // ... (Giữ nguyên không thay đổi)
    }

    function updateStatusCounts() {
        // ... (Giữ nguyên không thay đổi)
    }

    function showEmptyState(show) { 
        // ... (Giữ nguyên không thay đổi)
    }

    initializeApp();
});
