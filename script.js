document.addEventListener('DOMContentLoaded', () => {
    // !!! QUAN TRỌNG: Dán URL Apps Script MỚI NHẤT của bạn vào đây
    const API_URL = 'https://script.google.com/macros/s/AKfycbw-6fl8v5IATVCbxISudLxpxhIz7-zPGs5DxXsvimpYuLM54sf9k5jRY3ineyuhSLA/exec';

    let allCustomers = [];
    let currentFilters = { status: 'all', location: '' };

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
            setupEventListeners();
            updateStatusCounts();
            filterAndRender();
        } catch (error) {
            dom.customerList.innerHTML = `<div class="loader" style="color: red;">Không thể tải dữ liệu: ${error.message}</div>`;
        }
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
            if (files.length > 0) {
                handleFiles(files);
            }
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
    }

    async function saveChanges() {
        dom.buttons.save.disabled = true;
        dom.buttons.save.textContent = 'Đang lưu...';
        const customer = allCustomers.find(c => c.ID == dom.detail.id.value);
        const requestBody = {
            action: 'update',
            data: {
                ID: dom.detail.id.value, TrangThai: dom.detail.status.value,
                Website: dom.detail.website.value.trim(), Facebook: dom.detail.facebook.value.trim(),
                Instagram: dom.detail.instagram.value.trim(), LinkedIn: dom.detail.linkedin.value.trim(),
                Khac: dom.detail.khac.value.trim(), GhiChu: dom.detail.ghiChu.value, 
                LinkTep: customer.LinkTep || '[]'
            }
        };
        try {
            const response = await fetch(API_URL, { 
                method: 'POST', 
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(requestBody) 
            });
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message);
            const index = allCustomers.findIndex(c => c.ID == requestBody.data.ID);
            if (index !== -1) Object.assign(allCustomers[index], requestBody.data);
            updateStatusCounts();
            alert('Lưu thành công!');
        } catch (error) { alert(`Lỗi khi lưu: ${error.message}`); } 
        finally { dom.buttons.save.disabled = false; dom.buttons.save.textContent = 'Lưu Thay đổi'; }
    }

    async function analyzeCustomer() {
        const customerId = dom.detail.id.value; if (!customerId) return;
        dom.spinner.classList.remove('hidden'); dom.buttons.analyze.disabled = true;
        dom.modal.result.innerHTML = 'Đang gửi yêu cầu đến Gemini...'; dom.modal.overlay.classList.remove('hidden');
        const requestBody = { action: 'analyze', customerId: customerId };
        try {
            const response = await fetch(API_URL, { 
                method: 'POST', 
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(requestBody) 
            });
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message);
            dom.modal.result.textContent = result.analysis;
            const index = allCustomers.findIndex(c => c.ID == customerId);
            if (index !== -1) {
                allCustomers[index].PhanTich = result.analysis;
                renderCustomerDetails(customerId);
            }
        } catch (error) { dom.modal.result.textContent = `Lỗi khi phân tích: ${error.message}`; } 
        finally { dom.spinner.classList.add('hidden'); dom.buttons.analyze.disabled = false; }
    }
    
    async function updateFileLinks(updateData) {
        const customerId = dom.detail.id.value;
        if (!customerId) return alert("Vui lòng chọn một khách hàng trước.");
        
        dom.uploadProgress.textContent = "Đang cập nhật...";
        dom.uploadProgress.classList.remove('hidden');

        const requestBody = { action: 'updateFileLinks', data: { customerId, ...updateData } };
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(requestBody)
            });
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message);
            const index = allCustomers.findIndex(c => c.ID == customerId);
            if (index !== -1) allCustomers[index].LinkTep = JSON.stringify(result.updatedLinks);
            renderCustomerDetails(customerId);
        } catch (error) {
            alert("Lỗi khi cập nhật link tệp: " + error.message);
        } finally {
            dom.uploadProgress.classList.add('hidden');
        }
    }

    async function handleFiles(files) {
        const customerId = dom.detail.id.value;
        if (!customerId) return alert("Vui lòng chọn một khách hàng trước khi tải tệp.");

        let uploadedLinks = [];
        dom.uploadProgress.textContent = `Đang tải lên 0/${files.length}...`;
        dom.uploadProgress.classList.remove('hidden');

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            dom.uploadProgress.textContent = `Đang tải lên ${i + 1}/${files.length}: ${file.name}...`;
            try {
                const fileData = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = e => resolve(e.target.result.split(',')[1]);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(file);
                });

                const fileInfo = { fileName: file.name, mimeType: file.type, data: fileData };
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({ action: 'uploadFile', data: fileInfo })
                });
                const result = await response.json();
                if (result.status !== 'success') throw new Error(result.message);
                uploadedLinks.push(result.fileUrl);
            } catch (error) {
                alert(`Lỗi khi tải tệp ${file.name}: ${error.message}`);
            }
        }
        
        if (uploadedLinks.length > 0) {
            await updateFileLinks({ newLinks: uploadedLinks });
        }
        dom.uploadProgress.classList.add('hidden');
        dom.fileInput.value = '';
    }

    function renderCustomerDetails(customerId) {
        const customer = allCustomers.find(c => c.ID == customerId); if (!customer) return;
        showEmptyState(false);
        dom.detail.name.textContent = customer.TenKhachHang;
        dom.detail.industry.textContent = customer.MaNganh;
        dom.detail.address.textContent = customer.DiaChi || 'Chưa có thông tin';
        const currentStatus = customer.TrangThai || 'Chưa tiếp cận';
        dom.detail.status.innerHTML = statusOptions.map(opt => `<option value="${opt}" ${currentStatus === opt ? 'selected' : ''}>${opt}</option>`).join('');
        dom.detail.website.value = customer.Website || ''; dom.detail.facebook.value = customer.Facebook || '';
        dom.detail.instagram.value = customer.Instagram || ''; dom.detail.linkedin.value = customer.LinkedIn || '';
        dom.detail.khac.value = customer.Khac || ''; dom.detail.ghiChu.value = customer.GhiChu || '';
        dom.detail.id.value = customer.ID;

        if (customer.PhanTich && customer.PhanTich.trim() !== "") {
            dom.savedAnalysisContent.textContent = customer.PhanTich;
            dom.savedAnalysisContainer.classList.remove('hidden');
            dom.analyzeBtnText.textContent = "Phân Tích Lại";
        } else {
            dom.savedAnalysisContainer.classList.add('hidden');
            dom.analyzeBtnText.textContent = "Phân Tích Tiềm năng";
        }

        dom.fileList.innerHTML = ''; 
        let fileLinks = [];
        try {
            if (customer.LinkTep) fileLinks = JSON.parse(customer.LinkTep);
        } catch(e) { /* ignore */ }
        
        if (Array.isArray(fileLinks) && fileLinks.length > 0) {
            fileLinks.forEach(url => {
                const fileName = decodeURIComponent(url.split('/').pop().split('?')[0]);
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                const fileItemHTML = `
                    <div class="file-item">
                        ${isImage ? `<img src="${url}" alt="Preview">` : `<i class="fa-solid fa-file"></i>`}
                        <span onclick="window.open('${url}', '_blank')" title="${fileName}">${fileName}</span>
                        <button class="delete-btn" data-url="${url}" title="Xóa tệp">&times;</button>
                    </div>`;
                dom.fileList.innerHTML += fileItemHTML;
            });
        }
        
        [dom.buttons.save, dom.buttons.analyze, dom.detail.status].forEach(el => el.disabled = false);
    }
    
    function filterAndRender() {
        // ... (Giữ nguyên)
    }
    function updateStatusCounts() {
        // ... (Giữ nguyên)
    }
    function showEmptyState(show) { 
        // ... (Giữ nguyên)
    }

    initializeApp();
});
