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
        fileLinkDisplay: document.getElementById('file-link-display'),
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
        // ... (Giữ nguyên không thay đổi)
    }

    async function analyzeCustomer() {
        // ... (Giữ nguyên không thay đổi)
    }
    
    async function autoSaveFileLink(fileUrl) {
        const customerId = dom.detail.id.value;
        if (!customerId) return alert("Vui lòng chọn một khách hàng trước khi thực hiện.");

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

    function renderCustomerDetails(customerId) {
        const customer = allCustomers.find(c => c.ID == customerId); if (!customer) return;
        showEmptyState(false);
        dom.detail.name.textContent = customer.TenKhachHang;
        // ... (Render các trường khác giữ nguyên)

        // Hiển thị phân tích đã lưu
        if (customer.PhanTich && customer.PhanTich.trim() !== "") {
            dom.savedAnalysisContent.textContent = customer.PhanTich;
            dom.savedAnalysisContainer.classList.remove('hidden');
            dom.analyzeBtnText.textContent = "Phân Tích Lại";
        } else {
            dom.savedAnalysisContainer.classList.add('hidden');
            dom.analyzeBtnText.textContent = "Phân Tích Tiềm năng";
        }

        // Hiển thị tệp đính kèm
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
    }
    
    // ... (Các hàm còn lại: filterAndRender, renderCustomerList, updateStatusCounts, showEmptyState giữ nguyên)

    initializeApp();
});
