document.addEventListener('DOMContentLoaded', () => {
    // !!! QUAN TRỌNG: Dán URL Apps Script MỚI NHẤT của bạn vào đây
    const API_URL = 'https://script.google.com/macros/s/AKfycbwOP3Swbs-knjXuU-Aw8difM5c2VEcydzibDz3j_6khshbuICcThlY9UoHYEqoIZyA/exec';

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
            fileLink: document.getElementById('detail-filelink'),
            id: document.getElementById('detail-id'),
        },
        buttons: {
            save: document.getElementById('save-button'),
            analyze: document.getElementById('analyze-btn'),
            upload: document.getElementById('upload-btn'),
            deleteFile: document.getElementById('delete-file-btn'),
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
        filePreviewContainer: document.getElementById('file-preview-container'),
        filePreviewImg: document.getElementById('file-preview-img'),
        filePreviewIcon: document.getElementById('file-preview-icon'),
        filePreviewName: document.getElementById('file-preview-name'),
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
        
        dom.buttons.upload.addEventListener('click', (e) => { e.preventDefault(); dom.fileInput.click(); });
        
        dom.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleFile(file);
        });
        
        dom.buttons.deleteFile.addEventListener('click', () => {
            if (confirm("Bạn có chắc chắn muốn xóa tệp đính kèm này không?")) {
                autoSaveFileLink("");
            }
        });
    }

    async function saveChanges() {
        dom.buttons.save.disabled = true;
        dom.buttons.save.textContent = 'Đang lưu...';
        const requestBody = {
            action: 'update',
            data: {
                ID: dom.detail.id.value, TrangThai: dom.detail.status.value,
                Website: dom.detail.website.value.trim(), Facebook: dom.detail.facebook.value.trim(),
                Instagram: dom.detail.instagram.value.trim(), LinkedIn: dom.detail.linkedin.value.trim(),
                Khac: dom.detail.khac.value.trim(), GhiChu: dom.detail.ghiChu.value, 
                LinkTep: dom.detail.fileLink.value.trim()
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
    
    async function autoSaveFileLink(fileUrl) {
        const customerId = dom.detail.id.value;
        if (!customerId) return alert("Vui lòng chọn một khách hàng trước.");

        const requestBody = { action: 'updateFileLink', data: { customerId, fileUrl } };
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(requestBody)
            });
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message);
            const index = allCustomers.findIndex(c => c.ID == customerId);
            if (index !== -1) allCustomers[index].LinkTep = fileUrl;
            renderCustomerDetails(customerId);
            if (fileUrl) alert("Tải lên và lưu link tệp thành công!");
            else alert("Đã xóa tệp đính kèm!");
        } catch (error) {
            alert("Lỗi khi tự động lưu link tệp: " + error.message);
        }
    }

    function handleFile(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const fileData = e.target.result.split(',')[1];
            const fileInfo = { fileName: file.name, mimeType: file.type, data: fileData };
            dom.uploadProgress.classList.remove('hidden');
            dom.buttons.upload.classList.add('hidden');
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({ action: 'uploadFile', data: fileInfo })
                });
                const result = await response.json();
                if (result.status !== 'success') throw new Error(result.message);
                await autoSaveFileLink(result.fileUrl);
            } catch (error) {
                alert('Lỗi khi tải tệp lên: ' + error.message);
            } finally {
                dom.uploadProgress.classList.add('hidden');
                dom.buttons.upload.classList.remove('hidden');
                dom.fileInput.value = '';
            }
        };
        reader.readAsDataURL(file);
    }

    function filterAndRender() {
        const filtered = allCustomers.filter(c => {
            const customerStatus = c.TrangThai || 'Chưa tiếp cận';
            const nameMatch = (c.TenKhachHang || '').toLowerCase().includes(currentFilters.location);
            const addressMatch = (c.DiaChi || '').toLowerCase().includes(currentFilters.location);
            const statusMatch = currentFilters.status === 'all' || customerStatus === currentFilters.status;
            return statusMatch && (nameMatch || addressMatch);
        });
        renderCustomerList(filtered);
    }

    function renderCustomerList(customers) {
        dom.customerList.innerHTML = customers.length === 0 
            ? '<div class="loader">Không tìm thấy khách hàng.</div>'
            : customers.map(c => `
                <div class="customer-item" data-id="${c.ID}">
                    <h4>${c.TenKhachHang || 'Khách hàng không tên'}</h4><p>${c.MaNganh || 'Không có ngành nghề'}</p>
                </div>`).join('');
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
        dom.detail.fileLink.value = customer.LinkTep || ''; dom.detail.id.value = customer.ID;

        if (customer.PhanTich && customer.PhanTich.trim() !== "") {
            dom.savedAnalysisContent.textContent = customer.PhanTich;
            dom.savedAnalysisContainer.classList.remove('hidden');
            dom.analyzeBtnText.textContent = "Phân Tích Lại";
        } else {
            dom.savedAnalysisContainer.classList.add('hidden');
            dom.analyzeBtnText.textContent = "Phân Tích Tiềm năng";
        }

        if (customer.LinkTep && customer.LinkTep.trim() !== "") {
            dom.fileUploadPrompt.classList.add('hidden');
            dom.filePreviewContainer.classList.remove('hidden');
            const fileName = customer.LinkTep.split('/').pop().split('?')[0];
            dom.filePreviewName.textContent = decodeURIComponent(fileName);
            if (/\.(jpg|jpeg|png|gif|webp)$/i.test(customer.LinkTep)) {
                dom.filePreviewImg.src = customer.LinkTep;
                dom.filePreviewImg.classList.remove('hidden');
                dom.filePreviewIcon.classList.add('hidden');
            } else {
                dom.filePreviewImg.classList.add('hidden');
                dom.filePreviewIcon.classList.remove('hidden');
            }
        } else {
            dom.fileUploadPrompt.classList.remove('hidden');
            dom.filePreviewContainer.classList.add('hidden');
        }

        [dom.buttons.save, dom.buttons.analyze, dom.detail.status].forEach(el => el.disabled = false);
    }
    
    // HÀM BỊ THIẾU ĐÃ ĐƯỢC BỔ SUNG
    function updateStatusCounts() {
        const counts = { all: allCustomers.length, new: 0, approaching: 0, replied: 0, signed: 0, rejected: 0 };
        allCustomers.forEach(c => {
            const status = c.TrangThai || 'Chưa tiếp cận';
            if (status === 'Chưa tiếp cận') counts.new++; if (status === 'Đang tiếp cận') counts.approaching++;
            if (status === 'Đã phản hồi') counts.replied++; if (status === 'Đã ký HĐ') counts.signed++;
            if (status === 'Đã từ chối') counts.rejected++;
        });
        document.getElementById('count-all').textContent = counts.all; 
        document.getElementById('count-new').textContent = counts.new;
        document.getElementById('count-approaching').textContent = counts.approaching; 
        document.getElementById('count-replied').textContent = counts.replied;
        document.getElementById('count-signed').textContent = counts.signed; 
        document.getElementById('count-rejected').textContent = counts.rejected;
    }

    // HÀM BỊ THIẾU ĐÃ ĐƯỢC BỔ SUNG
    function showEmptyState(show) { 
        dom.emptyState.classList.toggle('hidden', !show); 
        dom.customerDetails.classList.toggle('hidden', show); 
    }

    initializeApp();
});
