// !!! QUAN TRỌNG: Dán URL ứng dụng web của bạn vào đây
const API_URL = 'https://script.google.com/macros/s/AKfycbxHJnLwuBvEqV4hH2JVkKQp9sX4Pze65MgxRvPmmT2qh83ApJAIVT4XVPb0Jd0QG5c/exec';

// --- Biến toàn cục và DOM Elements ---
let allCustomers = [];
let currentFilters = {
    status: 'all',
    location: '',
};

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
const detailIdEl = document.getElementById('detail-id');
const saveButton = document.getElementById('save-button');


// --- KHỞI CHẠY ỨNG DỤNG ---
document.addEventListener('DOMContentLoaded', () => {
    fetchCustomers();
    setupEventListeners();
    showEmptyState(true);
});


// --- CÁC HÀM XỬ LÝ DỮ LIỆU VÀ API ---

async function fetchCustomers() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Lỗi mạng hoặc API!');
        allCustomers = await response.json();
        updateStatusCounts();
        filterAndRender();
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        customerListEl.innerHTML = '<div class="loader" style="color: red;">Không thể tải dữ liệu.</div>';
    }
}

async function saveChanges() {
    const customerId = detailIdEl.value;
    if (!customerId) return;

    saveButton.disabled = true;
    saveButton.textContent = 'Đang lưu...';

    const updatedData = {
        ID: customerId,
        TrangThai: detailStatusEl.value,
        Website: detailWebsiteEl.value.trim(),
        Facebook: detailFacebookEl.value.trim(),
        Instagram: detailInstagramEl.value.trim(),
        LinkedIn: detailLinkedInEl.value.trim(),
        Khac: detailKhacEl.value.trim(),
        GhiChu: detailGhiChuEl.value,
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(updatedData),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });
        const result = await response.json();

        if (result.status === 'success') {
            // Cập nhật dữ liệu trong biến `allCustomers` để giao diện đồng bộ
            const index = allCustomers.findIndex(c => c.ID == customerId);
            if (index !== -1) {
                Object.assign(allCustomers[index], updatedData);
            }
            updateStatusCounts();
            filterAndRender(); // Render lại list để cập nhật nếu cần
            alert('Lưu thành công!');
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Lỗi khi lưu:', error);
        alert('Đã xảy ra lỗi khi lưu.');
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Lưu Thay đổi';
    }
}


// --- CÁC HÀM RENDER VÀ CẬP NHẬT GIAO DIỆN ---

function filterAndRender() {
    let filteredCustomers = [...allCustomers];

    // Lọc theo trạng thái
    if (currentFilters.status !== 'all') {
        filteredCustomers = filteredCustomers.filter(c => c.TrangThai === currentFilters.status);
    }

    // Lọc theo địa chỉ/tên
    if (currentFilters.location) {
        const searchTerm = currentFilters.location.toLowerCase();
        filteredCustomers = filteredCustomers.filter(c => 
            c.TenKhachHang.toLowerCase().includes(searchTerm) ||
            c.DiaChi.toLowerCase().includes(searchTerm)
        );
    }
    
    renderCustomerList(filteredCustomers);
}

function renderCustomerList(customers) {
    customerListEl.innerHTML = '';
    if (customers.length === 0) {
        customerListEl.innerHTML = '<div class="loader">Không tìm thấy khách hàng nào.</div>';
        return;
    }

    customers.forEach(customer => {
        const item = document.createElement('div');
        item.className = 'customer-item';
        item.dataset.id = customer.ID;
        item.innerHTML = `
            <h4>${customer.TenKhachHang}</h4>
            <p>${customer.MaNganh}</p>
            <button class="options-btn"><i class="fa-solid fa-ellipsis-vertical"></i></button>
        `;
        item.addEventListener('click', () => {
            renderCustomerDetails(customer.ID);
            document.querySelectorAll('.customer-item').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
        });
        customerListEl.appendChild(item);
    });
}

function renderCustomerDetails(customerId) {
    const customer = allCustomers.find(c => c.ID == customerId);
    if (!customer) return;

    showEmptyState(false);

    detailNameEl.textContent = customer.TenKhachHang;
    detailIndustryEl.textContent = customer.MaNganh;
    detailAddressEl.textContent = customer.DiaChi || 'Chưa có thông tin';
    detailStatusEl.value = customer.TrangThai;
    detailWebsiteEl.value = customer.Website || '';
    detailFacebookEl.value = customer.Facebook || '';
    detailInstagramEl.value = customer.Instagram || '';
    detailLinkedInEl.value = customer.LinkedIn || '';
    detailKhacEl.value = customer.Khac || '';
    detailGhiChuEl.value = customer.GhiChu || '';
    detailIdEl.value = customer.ID;
    
    saveButton.disabled = false;
    detailStatusEl.disabled = false;
}

function updateStatusCounts() {
    const counts = {
        all: allCustomers.length,
        new: 0,
        approaching: 0,
        replied: 0,
        signed: 0,
        rejected: 0,
    };
    allCustomers.forEach(c => {
        if (c.TrangThai === 'Chưa tiếp cận') counts.new++;
        if (c.TrangThai === 'Đang tiếp cận') counts.approaching++;
        if (c.TrangThai === 'Đã phản hồi') counts.replied++;
        if (c.TrangThai === 'Đã ký HĐ') counts.signed++;
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


// --- THIẾT LẬP CÁC BỘ LẮNG NGHE SỰ KIỆN ---

function setupEventListeners() {
    // Lắng nghe sự kiện click vào các nút trạng thái
    document.querySelector('.status-nav').addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.target.closest('.status-item');
        if (target) {
            document.querySelectorAll('.status-item').forEach(item => item.classList.remove('active'));
            target.classList.add('active');
            currentFilters.status = target.dataset.status;
            filterAndRender();
        }
    });

    // Lắng nghe sự kiện gõ vào ô tìm kiếm địa chỉ
    document.getElementById('location-search').addEventListener('input', (e) => {
        currentFilters.location = e.target.value;
        filterAndRender();
    });

    // Lắng nghe sự kiện click nút lưu
    saveButton.addEventListener('click', saveChanges);

    // Lưu ý về Tải tệp:
    // Với kiến trúc này, không thể tải tệp trực tiếp.
    // Nút này chỉ nên mở ra một thông báo hướng dẫn người dùng dán link vào một trường nào đó.
    document.getElementById('upload-btn').addEventListener('click', () => {
        alert('Tính năng này yêu cầu backend. Giải pháp thay thế: Hãy dán link file (Google Drive, Dropbox...) vào phần Ghi chú.');
    });
}
