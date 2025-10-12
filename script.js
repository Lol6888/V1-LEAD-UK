// !!! QUAN TRỌNG: Dán URL ứng dụng web bạn đã sao chép ở Bước 2 vào đây
const API_URL = 'AKfycbxHJnLwuBvEqV4hH2JVkKQp9sX4Pze65MgxRvPmmT2qh83ApJAIVT4XVPb0Jd0QG5c';

let allCustomers = []; // Biến để lưu trữ toàn bộ dữ liệu khách hàng

const customerListEl = document.getElementById('customer-list');
const detailNameEl = document.getElementById('detail-name');
const detailInfoEl = document.getElementById('detail-info');
const detailStatusEl = document.getElementById('detail-status');
const detailWebsiteEl = document.getElementById('detail-website');
const detailFacebookEl = document.getElementById('detail-facebook');
const detailInstagramEl = document.getElementById('detail-instagram');
const detailLinkedInEl = document.getElementById('detail-linkedin');
const detailKhacEl = document.getElementById('detail-khac');
const detailGhiChuEl = document.getElementById('detail-ghichu');
const detailIdEl = document.getElementById('detail-id');
const saveButton = document.getElementById('save-button');

// 1. Hàm lấy dữ liệu từ Google Sheets
async function fetchCustomers() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Lỗi mạng hoặc API!');
        }
        allCustomers = await response.json();
        renderCustomerList(allCustomers);
        updateCounts();
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        customerListEl.innerHTML = '<div class="loader">Không thể tải dữ liệu. Vui lòng thử lại.</div>';
    }
}

// 2. Hàm hiển thị danh sách khách hàng bên trái
function renderCustomerList(customers) {
    customerListEl.innerHTML = ''; // Xóa danh sách cũ
    if (customers.length === 0) {
        customerListEl.innerHTML = '<div class="loader">Không có khách hàng nào.</div>';
        return;
    }
    customers.forEach(customer => {
        const item = document.createElement('div');
        item.className = 'customer-item';
        item.dataset.id = customer.ID;
        item.innerHTML = `
            <h4>${customer.TenKhachHang}</h4>
            <p>${customer.MaNganh} - ${customer.DiaChi}</p>
        `;
        // Thêm sự kiện click để xem chi tiết
        item.addEventListener('click', () => {
            renderCustomerDetails(customer.ID);
            // Đánh dấu item được chọn
            document.querySelectorAll('.customer-item').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
        });
        customerListEl.appendChild(item);
    });
}

// 3. Hàm hiển thị chi tiết khách hàng bên phải
function renderCustomerDetails(customerId) {
    const customer = allCustomers.find(c => c.ID == customerId);
    if (!customer) return;

    detailNameEl.textContent = customer.TenKhachHang;
    detailInfoEl.textContent = `${customer.MaNganh} - ${customer.DiaChi}`;
    detailStatusEl.value = customer.TrangThai;
    detailWebsiteEl.value = customer.Website || '';
    detailFacebookEl.value = customer.Facebook || '';
    detailInstagramEl.value = customer.Instagram || '';
    detailLinkedInEl.value = customer.LinkedIn || '';
    detailKhacEl.value = customer.Khac || '';
    detailGhiChuEl.value = customer.GhiChu || '';
    detailIdEl.value = customer.ID;
    
    // Bật các trường và nút lưu
    saveButton.disabled = false;
    detailStatusEl.disabled = false;
}

// 4. Hàm lưu thay đổi
async function saveChanges() {
    saveButton.disabled = true;
    saveButton.textContent = 'Đang lưu...';

    const updatedData = {
        ID: detailIdEl.value,
        TrangThai: detailStatusEl.value,
        Website: detailWebsiteEl.value,
        Facebook: detailFacebookEl.value,
        Instagram: detailInstagramEl.value,
        LinkedIn: detailLinkedInEl.value,
        Khac: detailKhacEl.value,
        GhiChu: detailGhiChuEl.value,
    };
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(updatedData),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Apps Script yêu cầu text/plain
            }
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('Lưu thành công!');
            // Cập nhật lại dữ liệu trong biến `allCustomers` để giao diện đồng bộ
            const index = allCustomers.findIndex(c => c.ID == updatedData.ID);
            if (index !== -1) {
                allCustomers[index] = { ...allCustomers[index], ...updatedData };
            }
            updateCounts(); // Cập nhật lại số lượng
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Lỗi khi lưu:', error);
        alert('Đã xảy ra lỗi khi lưu. Vui lòng thử lại.');
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Lưu Thay đổi';
    }
}

// 5. Hàm cập nhật số lượng trên các nút filter
function updateCounts() {
    document.getElementById('count-all').textContent = allCustomers.length;
    const countNew = allCustomers.filter(c => c.TrangThai === 'Chưa tiếp cận').length;
    document.getElementById('count-new').textContent = countNew;
}

// Gắn sự kiện cho nút lưu
saveButton.addEventListener('click', saveChanges);

// Chạy hàm fetchCustomers khi trang được tải lần đầu
document.addEventListener('DOMContentLoaded', fetchCustomers);