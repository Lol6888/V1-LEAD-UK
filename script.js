document.addEventListener('DOMContentLoaded', () => {
    // !!! QUAN TRỌNG: Hãy đảm bảo bạn dán URL Apps Script MỚI NHẤT của bạn vào đây
    const API_URL = 'https://script.google.com/macros/s/AKfycbwTZW2LeEbWOnGGwrPeynZ1u5H-tadSAyfdUPkNRes8wVHOQwqnO0hIFoXV8sQ25oI/exec';

    // Biến lưu trữ toàn bộ dữ liệu
    let allCustomers = [];
    let currentFilters = { status: 'all', location: '' };

    // Lấy tất cả các thành phần trên trang web để điều khiển
    const customerListEl = document.getElementById('customer-list');
    const customerDetailsEl = document.getElementById('customer-details');
    const emptyStateEl = document.getElementById('empty-state');
    const detailNameEl = document.getElementById('detail-name');
    const detailIndustryEl = document.getElementById('detail-industry');
    const detailAddressEl = document.getElementById('detail-address');
    const detailStatusEl = document.getElementById('detail-status');
    const detailWebsiteEl = document.getElementById('detail-website');
    const detailFacebookEl = document.getElementById('detail-facebook');
    const detailInstagramEl = document.getElementById('detail-instagram');
    const detailLinkedInEl = document.getElementById('detail-linkedin');
    const detailKhacEl = document.getElementById('detail-khac');
    const detailGhiChuEl = document.getElementById('detail-ghichu');
    const detailFileLinkEl = document.getElementById('detail-filelink');
    const detailIdEl = document.getElementById('detail-id');
    const saveButton = document.getElementById('save-button');
    const analyzeButton = document.getElementById('analyze-btn');
    const spinner = document.querySelector('.spinner');
    const modal = document.getElementById('ai-modal');
    const aiResultEl = document.getElementById('ai-result');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // Mảng các trạng thái để tạo dropdown
    const statusOptions = ['Chưa tiếp cận', 'Đang tiếp cận', 'Đã phản hồi', 'Đã ký HĐ', 'Đã từ chối'];

    // --- HÀM KHỞI ĐỘNG ---
    async function initializeApp() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Lỗi mạng hoặc API không hợp lệ.');
            allCustomers = await response.json();
            // Sau khi có dữ liệu, cập nhật mọi thứ
            updateStatusCounts();
            filterAndRender();
            setupEventListeners();
        } catch (error) {
            customerListEl.innerHTML = `<div class="loader" style="color: red;">Không thể tải dữ liệu: ${error.message}</div>`;
        }
    }

    // --- CÁC HÀM GỌI API (BACKEND) ---
    async function saveChanges() {
        saveButton.disabled = true;
        saveButton.textContent = 'Đang lưu...';
        const requestBody = {
            action: 'update',
            data: {
                ID: detailIdEl.value, TrangThai: detailStatusEl.value,
                Website: detailWebsiteEl.value.trim(), Facebook: detailFacebookEl.value.trim(),
                Instagram: detailInstagramEl.value.trim(), LinkedIn: detailLinkedInEl.value.trim(),
                Khac: detailKhacEl.value.trim(), GhiChu: detailGhiChuEl.value, LinkTep: detailFileLinkEl.value.trim()
            }
        };
        try {
            const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify(requestBody), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message);
            // Cập nhật lại dữ liệu trên giao diện mà không cần tải lại trang
            const index = allCustomers.findIndex(c => c.ID == requestBody.data.ID);
            if (index !== -1) Object.assign(allCustomers[index], requestBody.data);
            updateStatusCounts();
            alert('Lưu thành công!');
        } catch (error) { alert(`Lỗi khi lưu: ${error.message}`); } 
        finally { saveButton.disabled = false; saveButton.textContent = 'Lưu Thay đổi'; }
    }

    async function analyzeCustomer() {
        const customerId = detailIdEl.value; if (!customerId) return;
        spinner.classList.remove('hidden'); analyzeButton.disabled = true;
        aiResultEl.innerHTML = 'Đang gửi yêu cầu đến Gemini, vui lòng chờ...'; modal.classList.remove('hidden');
        const requestBody = { action: 'analyze', customerId: customerId };
        try {
            const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify(requestBody), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message);
            aiResultEl.textContent = result.analysis;
        } catch (error) { aiResultEl.textContent = `Lỗi khi phân tích: ${error.message}`; } 
        finally { spinner.classList.add('hidden'); analyzeButton.disabled = false; }
    }

    // --- CÁC HÀM HIỂN THỊ VÀ CẬP NHẬT GIAO DIỆN ---
    function filterAndRender() {
        let filtered = allCustomers.filter(c => {
            const nameMatch = (c.TenKhachHang || '').toLowerCase().includes(currentFilters.location);
            const addressMatch = (c.DiaChi || '').toLowerCase().includes(currentFilters.location);
            const statusMatch = currentFilters.status === 'all' || c.TrangThai === currentFilters.status;
            return statusMatch && (nameMatch || addressMatch);
        });
        renderCustomerList(filtered);
    }

    function renderCustomerList(customers) {
        customerListEl.innerHTML = customers.length === 0 
            ? '<div class="loader">Không tìm thấy khách hàng.</div>'
            : customers.map(c => `
                <div class="customer-item" data-id="${c.ID}">
                    <h4>${c.TenKhachHang || 'Khách hàng không tên'}</h4>
                    <p>${c.MaNganh || 'Không có ngành nghề'}</p>
                    <button class="options-btn"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                </div>`).join('');
    }

    function renderCustomerDetails(customerId) {
        const customer = allCustomers.find(c => c.ID == customerId);
        if (!customer) return;

        showEmptyState(false);
        detailNameEl.textContent = customer.TenKhachHang;
        detailIndustryEl.textContent = customer.MaNganh;
        detailAddressEl.textContent = customer.DiaChi || 'Chưa có thông tin';
        detailStatusEl.innerHTML = statusOptions.map(opt => `<option value="${opt}" ${customer.TrangThai === opt ? 'selected' : ''}>${opt}</option>`).join('');
        detailWebsiteEl.value = customer.Website || ''; 
        detailFacebookEl.value = customer.Facebook || '';
        detailInstagramEl.value = customer.Instagram || ''; 
        detailLinkedInEl.value = customer.LinkedIn || '';
        detailKhacEl.value = customer.Khac || ''; 
        detailGhiChuEl.value = customer.GhiChu || '';
        detailFileLinkEl.value = customer.LinkTep || ''; 
        detailIdEl.value = customer.ID;
        
        // Kích hoạt các nút
        [saveButton, analyzeButton, detailStatusEl].forEach(el => el.disabled = false);
    }

    function updateStatusCounts() {
        const counts = { all: allCustomers.length, new: 0, approaching: 0, replied: 0, signed: 0, rejected: 0 };
        allCustomers.forEach(c => {
            if (c.TrangThai === 'Chưa tiếp cận') counts.new++; if (c.TrangThai === 'Đang tiếp cận') counts.approaching++;
            if (c.TrangThai === 'Đã phản hồi') counts.replied++; if (c.TrangThai === 'Đã ký HĐ') counts.signed++;
            if (c.TrangThai === 'Đã từ chối') counts.rejected++;
        });
        document.getElementById('count-all').textContent = counts.all; 
        document.getElementById('count-new').textContent = counts.new;
        document.getElementById('count-approaching').textContent = counts.approaching; 
        document.getElementById('count-replied').textContent = counts.replied;
        document.getElementById('count-signed').textContent = counts.signed; 
        document.getElementById('count-rejected').textContent = counts.rejected;
    }

    function showEmptyState(show) { 
        emptyStateEl.classList.toggle('hidden', !show); 
        customerDetailsEl.classList.toggle('hidden', show); 
    }

    // --- HÀM GẮN CÁC SỰ KIỆN (CLICK, GÕ PHÍM...) ---
    function setupEventListeners() {
        // Lọc theo trạng thái
        document.querySelector('.status-nav').addEventListener('click', e => {
            const target = e.target.closest('.status-item');
            if (target) {
                e.preventDefault();
                document.querySelectorAll('.status-item').forEach(item => item.classList.remove('active'));
                target.classList.add('active');
                currentFilters.status = target.dataset.status;
                filterAndRender();
            }
        });

        // Lọc theo ô tìm kiếm
        document.getElementById('location-search').addEventListener('input', e => { 
            currentFilters.location = e.target.value.toLowerCase(); 
            filterAndRender(); 
        });

        // Nhấp vào một khách hàng trong danh sách
        customerListEl.addEventListener('click', e => {
            const item = e.target.closest('.customer-item');
            if (item) {
                renderCustomerDetails(item.dataset.id);
                document.querySelectorAll('.customer-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
            }
        });

        // Các nút chức năng
        saveButton.addEventListener('click', saveChanges);
        analyzeButton.addEventListener('click', analyzeCustomer);
        closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
    }

    // --- CHẠY ỨNG DỤNG ---
    initializeApp();
});
