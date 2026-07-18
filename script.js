document.addEventListener('DOMContentLoaded', () => {
    // !!! QUAN TRỌNG: Dán URL Apps Script MỚI NHẤT của bạn vào đây
    const API_URL = 'https://script.google.com/macros/s/AKfycbzHu-mbqV9yj-aTnxlSav4NLuTUQ2Reo-VUoLw_0IshiaSBETD-ixNdOeuORQu_Yo8/exec'; // Giữ nguyên URL từ file bạn cung cấp

    let allCustomers = [];
    let allGroups = [];
    let currentFilters = { status: 'all', location: '', industry: '', country: '', group: '', social: [] };

    const dom = {
        mainContainer: document.querySelector('.main-container'),
        openSidebarBtn: document.getElementById('open-sidebar-btn'),
        closeSidebarBtn: document.getElementById('close-sidebar-btn'),
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
            nhom: document.getElementById('detail-nhom'),
            id: document.getElementById('detail-id'),
            // Header elements
            country: document.getElementById('detail-country'),
            countrySeparator: document.getElementById('detail-country-separator'),
            addressLine: document.getElementById('detail-address-line'),
            websiteLine: document.getElementById('detail-website-line'),
            websiteLink: document.getElementById('detail-website-link'),
            facebookLine: document.getElementById('detail-facebook-line'),
            facebookLink: document.getElementById('detail-facebook-link'),
            instagramLine: document.getElementById('detail-instagram-line'),
            instagramLink: document.getElementById('detail-instagram-link'),
            linkedInLine: document.getElementById('detail-linkedin-line'),
            linkedInLink: document.getElementById('detail-linkedin-link'),
        },
        buttons: {
            save: document.getElementById('save-button'),
            analyze: document.getElementById('analyze-btn'),
            headerSeeMore: document.getElementById('header-see-more-btn'), // Nút xem thêm mới
        },
        modal: {
            overlay: document.getElementById('ai-modal'),
            result: document.getElementById('ai-result'),
            close: document.getElementById('close-modal-btn'),
        },
        detailsModal: {
            overlay: document.getElementById('details-modal'),
            name: document.getElementById('details-modal-name'),
            content: document.getElementById('details-modal-content'),
            close: document.getElementById('close-details-modal-btn'),
        },
        spinner: document.querySelector('.spinner'),
        statusNav: document.querySelector('.status-nav'),
        locationSearch: document.getElementById('location-search'),
        industryFilter: document.getElementById('industry-filter'),
        countryFilter: document.getElementById('country-filter'),
        socialFilters: document.querySelectorAll('.social-filters input[type="checkbox"]'),
        savedAnalysisContainer: document.getElementById('saved-analysis-container'),
        savedAnalysisContent: document.getElementById('saved-analysis-content'),
        analyzeBtnText: document.getElementById('analyze-btn-text'),
        fileInput: document.getElementById('file-input'),
        uploadProgress: document.getElementById('upload-progress'),
        fileUploadPrompt: document.getElementById('file-upload-prompt'),
        fileList: document.getElementById('file-list'),
        groupFilter: document.getElementById('group-filter'),
        addModal: {
            overlay: document.getElementById('add-customer-modal'),
            form: document.getElementById('add-customer-form'),
            openBtn: document.getElementById('add-customer-btn'),
            close: document.getElementById('close-add-modal-btn'),
            cancel: document.getElementById('cancel-add-btn'),
            submit: document.getElementById('submit-add-btn'),
            submitText: document.getElementById('submit-add-text'),
            spinner: document.getElementById('add-spinner'),
            error: document.getElementById('add-customer-error'),
            inlineGroupBtn: document.getElementById('add-group-inline-btn'),
            fields: {
                TenKhachHang: document.getElementById('new-ten'),
                MaNganh: document.getElementById('new-nganh'),
                QuocGia: document.getElementById('new-quocgia'),
                DiaChi: document.getElementById('new-diachi'),
                TrangThai: document.getElementById('new-trangthai'),
                Nhom: document.getElementById('new-nhom'),
                Website: document.getElementById('new-website'),
                Facebook: document.getElementById('new-facebook'),
                Instagram: document.getElementById('new-instagram'),
                LinkedIn: document.getElementById('new-linkedin'),
                Khac: document.getElementById('new-khac'),
                GhiChu: document.getElementById('new-ghichu'),
            },
        },
        groupModal: {
            overlay: document.getElementById('group-modal'),
            form: document.getElementById('create-group-form'),
            openBtn: document.getElementById('manage-groups-btn'),
            close: document.getElementById('close-group-modal-btn'),
            input: document.getElementById('new-group-name'),
            submit: document.getElementById('submit-group-btn'),
            error: document.getElementById('group-error'),
            list: document.getElementById('group-list'),
        },
    };

    const statusOptions = ['Chưa tiếp cận', 'Đang tiếp cận', 'Đã phản hồi', 'Đã ký HĐ', 'Đã từ chối'];

    // Gửi 1 request POST tới Apps Script và trả về payload đã kiểm tra status.
    async function postToApi(requestBody) {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message || 'API trả về lỗi không rõ.');
        return result;
    }

    // --- KHỞI TẠO ỨNG DỤNG ---
    async function initializeApp() {
        showLoader(true);
        console.log("Initializing app, fetching data from:", API_URL);
        try {
            const response = await fetch(API_URL);
            console.log("API Response Status:", response.status);
            if (!response.ok) {
                const errorText = await response.text();
                console.error("API Fetch Error:", response.status, response.statusText, errorText);
                throw new Error(`Lỗi mạng hoặc API (${response.status})`);
            }
            let responseData;
            const responseText = await response.text();
            try {
                 responseData = JSON.parse(responseText);
                 if (!Array.isArray(responseData)) {
                     console.error("Dữ liệu trả về không phải mảng:", responseData);
                     throw new Error('Dữ liệu API trả về không đúng định dạng (không phải mảng).');
                 }
                 allCustomers = responseData;
                 console.log("Data loaded successfully:", allCustomers.length, "customers");
            } catch (jsonError) {
                 console.error("JSON Parsing Error:", jsonError, "Raw Response Text:", responseText);
                 throw new Error('Không thể đọc dữ liệu từ API (lỗi JSON).');
            }

            await loadGroups();
            populateIndustryFilter();
            populateCountryFilter();
            setupEventListeners();
            updateStatusCounts();
            filterAndRender();
        } catch (error) {
            console.error("Initialization Error:", error);
            dom.customerList.innerHTML = `<div class="loader" style="color: red;">Không thể tải dữ liệu: ${error.message}</div>`;
        } finally {
             showLoader(false);
        }
    }

    // --- ĐIỀN DỮ LIỆU BỘ LỌC ---
    function populateIndustryFilter() {
        try {
            if (!Array.isArray(allCustomers)) {
                 console.warn("allCustomers is not ready for populateIndustryFilter");
                 return;
            }
            const allIndustryStrings = allCustomers.map(c => c.MaNganh).filter(Boolean);
            const individualIndustries = allIndustryStrings.flatMap(maNganh => maNganh.split(';').map(s => s.trim()));
            const uniqueIndustries = [...new Set(individualIndustries)].filter(Boolean);
            uniqueIndustries.sort();
            dom.industryFilter.innerHTML = '<option value="">Tất cả ngành nghề</option>';
            uniqueIndustries.forEach(industry => {
                const option = document.createElement('option');
                option.value = industry;
                option.textContent = industry;
                dom.industryFilter.appendChild(option);
            });
        } catch (error) {
            console.error("Error populating industry filter:", error);
        }
    }
    function populateCountryFilter() {
         try {
             if (!Array.isArray(allCustomers)) {
                 console.warn("allCustomers is not ready for populateCountryFilter");
                 return;
             }
            const countries = [...new Set(allCustomers.map(c => c.QuocGia).filter(Boolean))];
            countries.sort();
            dom.countryFilter.innerHTML = '<option value="">Tất cả quốc gia</option>';
            countries.forEach(country => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = country;
                dom.countryFilter.appendChild(option);
            });
         } catch (error) {
             console.error("Error populating country filter:", error);
         }
    }

    // --- NHÓM KHÁCH HÀNG ---
    // Nếu backend chưa có action getGroups, suy ra danh sách nhóm từ dữ liệu
    // khách hàng để app vẫn chạy được thay vì chết cả trang.
    async function loadGroups() {
        try {
            const result = await postToApi({ action: 'getGroups' });
            allGroups = Array.isArray(result.groups) ? result.groups : [];
        } catch (error) {
            console.warn("Không lấy được danh sách nhóm từ API, suy ra từ dữ liệu khách hàng:", error.message);
            allGroups = [...new Set(allCustomers.map(c => (c.Nhom || '').trim()).filter(Boolean))];
        }
        allGroups.sort((a, b) => a.localeCompare(b, 'vi'));
        renderGroupOptions();
    }

    // Đổ danh sách nhóm vào cả 3 chỗ: bộ lọc, form thêm mới, và ô chọn ở chi tiết.
    function renderGroupOptions() {
        const optionsHTML = allGroups.map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');

        const keepFilter = dom.groupFilter.value;
        dom.groupFilter.innerHTML = '<option value="">Tất cả nhóm</option>' + optionsHTML;
        dom.groupFilter.value = allGroups.includes(keepFilter) ? keepFilter : '';

        const keepNew = dom.addModal.fields.Nhom.value;
        dom.addModal.fields.Nhom.innerHTML = '<option value="">-- Không thuộc nhóm nào --</option>' + optionsHTML;
        dom.addModal.fields.Nhom.value = allGroups.includes(keepNew) ? keepNew : '';

        const keepDetail = dom.detail.nhom.value;
        dom.detail.nhom.innerHTML = '<option value="">-- Không thuộc nhóm nào --</option>' + optionsHTML;
        dom.detail.nhom.value = allGroups.includes(keepDetail) ? keepDetail : '';
    }

    function renderGroupList() {
        if (allGroups.length === 0) {
            dom.groupModal.list.innerHTML = '<li class="empty">Chưa có nhóm nào. Tạo nhóm đầu tiên ở trên.</li>';
            return;
        }
        dom.groupModal.list.innerHTML = allGroups.map(g => {
            const count = allCustomers.filter(c => (c.Nhom || '').trim() === g).length;
            return `<li><span>${escapeHtml(g)}</span><span class="group-count">${count} khách hàng</span></li>`;
        }).join('');
    }

    async function createGroup(name) {
        const trimmed = name.trim();
        if (!trimmed) throw new Error('Tên nhóm không được để trống.');
        if (allGroups.some(g => g.toLowerCase() === trimmed.toLowerCase())) {
            throw new Error(`Nhóm "${trimmed}" đã tồn tại.`);
        }
        const result = await postToApi({ action: 'createGroup', data: { name: trimmed } });
        allGroups = Array.isArray(result.groups) ? result.groups : allGroups.concat([trimmed]);
        allGroups.sort((a, b) => a.localeCompare(b, 'vi'));
        renderGroupOptions();
        return trimmed;
    }

    // Form có thể cuộn nên phải kéo ô báo lỗi vào tầm nhìn, nếu không
    // người dùng bấm nút mà tưởng như không có gì xảy ra.
    function showFormError(element, message) {
        element.textContent = message;
        element.classList.remove('hidden');
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[ch]);
    }

    // --- GẮN SỰ KIỆN ---
    function setupEventListeners() {
        // Sự kiện lọc
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
        dom.industryFilter.addEventListener('change', e => {
            currentFilters.industry = e.target.value;
            filterAndRender();
        });
        dom.countryFilter.addEventListener('change', e => {
            currentFilters.country = e.target.value;
            filterAndRender();
        });
        dom.groupFilter.addEventListener('change', e => {
            currentFilters.group = e.target.value;
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

        // Sự kiện chọn khách hàng và xem thêm
        dom.customerList.addEventListener('click', e => {
            const item = e.target.closest('.customer-item');
            const seeMoreBtn = e.target.closest('.see-more-btn:not(.header-see-more)');
            if (seeMoreBtn) {
                e.stopPropagation();
                renderFullDetails(seeMoreBtn.dataset.id);
            } else if (item) {
                dom.customerList.querySelector('.selected')?.classList.remove('selected');
                item.classList.add('selected');
                renderCustomerDetails(item.dataset.id);
                 if (window.innerWidth <= 768) {
                     dom.mainContainer.classList.remove('sidebar-open');
                 }
            }
        });

        // Nút chức năng
        dom.buttons.save.addEventListener('click', saveChanges);
        dom.buttons.analyze.addEventListener('click', analyzeCustomer);
        dom.buttons.headerSeeMore.addEventListener('click', (e) => { // Gắn sự kiện cho nút mới
             const customerId = e.target.dataset.id;
             if (customerId) {
                 renderFullDetails(customerId);
             }
        });

        // Modals
        dom.modal.close.addEventListener('click', () => dom.modal.overlay.classList.add('hidden'));
        dom.modal.overlay.addEventListener('click', e => {
            if (e.target === dom.modal.overlay) dom.modal.overlay.classList.add('hidden');
        });
        dom.detailsModal.close.addEventListener('click', () => dom.detailsModal.overlay.classList.add('hidden'));
        dom.detailsModal.overlay.addEventListener('click', e => {
            if (e.target === dom.detailsModal.overlay) dom.detailsModal.overlay.classList.add('hidden');
        });

        // Tải tệp
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

        // Thêm khách hàng mới
        dom.addModal.openBtn.addEventListener('click', openAddCustomerModal);
        dom.addModal.close.addEventListener('click', closeAddCustomerModal);
        dom.addModal.cancel.addEventListener('click', closeAddCustomerModal);
        dom.addModal.overlay.addEventListener('click', e => {
            if (e.target === dom.addModal.overlay) closeAddCustomerModal();
        });
        dom.addModal.form.addEventListener('submit', submitNewCustomer);
        dom.addModal.inlineGroupBtn.addEventListener('click', createGroupFromPrompt);

        // Quản lý nhóm
        dom.groupModal.openBtn.addEventListener('click', () => {
            dom.groupModal.error.classList.add('hidden');
            dom.groupModal.input.value = '';
            renderGroupList();
            dom.groupModal.overlay.classList.remove('hidden');
        });
        dom.groupModal.close.addEventListener('click', () => dom.groupModal.overlay.classList.add('hidden'));
        dom.groupModal.overlay.addEventListener('click', e => {
            if (e.target === dom.groupModal.overlay) dom.groupModal.overlay.classList.add('hidden');
        });
        dom.groupModal.form.addEventListener('submit', async e => {
            e.preventDefault();
            dom.groupModal.error.classList.add('hidden');
            dom.groupModal.submit.disabled = true;
            dom.groupModal.submit.textContent = 'Đang tạo...';
            try {
                await createGroup(dom.groupModal.input.value);
                dom.groupModal.input.value = '';
                renderGroupList();
            } catch (error) {
                console.error("Create Group Error:", error);
                showFormError(dom.groupModal.error, error.message);
            } finally {
                dom.groupModal.submit.disabled = false;
                dom.groupModal.submit.textContent = 'Tạo';
            }
        });

        // Toggle Sidebar (chỉ hoạt động trên mobile)
        dom.openSidebarBtn.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                dom.mainContainer.classList.add('sidebar-open');
            }
        });
        dom.closeSidebarBtn.addEventListener('click', () => {
             if (window.innerWidth <= 768) {
                dom.mainContainer.classList.remove('sidebar-open');
            }
        });
    }

    // --- GỌI API ---
    async function saveChanges() {
        dom.buttons.save.disabled = true;
        dom.buttons.save.textContent = 'Đang lưu...';
        const customerId = dom.detail.id.value;
        const customerIndex = allCustomers.findIndex(c => c.ID == customerId);
        if (customerIndex === -1) {
            alert('Lỗi: Không tìm thấy khách hàng hiện tại.');
            dom.buttons.save.disabled = false;
            dom.buttons.save.textContent = 'Lưu Thay đổi';
            return;
        }

        let currentLinkTep = '[]';
         try {
            if (allCustomers[customerIndex].LinkTep && allCustomers[customerIndex].LinkTep !== 'N/A' && allCustomers[customerIndex].LinkTep !== '') {
                JSON.parse(allCustomers[customerIndex].LinkTep);
                currentLinkTep = allCustomers[customerIndex].LinkTep;
            }
        } catch(e) { console.warn("Could not parse existing LinkTep, saving as empty array"); }

        const requestBody = {
            action: 'update',
            data: {
                ID: customerId, TrangThai: dom.detail.status.value,
                Website: dom.detail.website.value.trim(), Facebook: dom.detail.facebook.value.trim(),
                Instagram: dom.detail.instagram.value.trim(), LinkedIn: dom.detail.linkedin.value.trim(),
                Khac: dom.detail.khac.value.trim(), GhiChu: dom.detail.ghiChu.value,
                Nhom: dom.detail.nhom.value,
                LinkTep: currentLinkTep
            }
        };
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(requestBody)
            });
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message);

            Object.keys(requestBody.data).forEach(key => {
                 if (key !== 'LinkTep') {
                    allCustomers[customerIndex][key] = requestBody.data[key];
                 }
            });

            updateStatusCounts();
            filterAndRender();
            dom.customerList.querySelector(`.customer-item[data-id="${customerId}"]`)?.classList.add('selected');
            alert('Lưu thành công!');
        } catch (error) {
            console.error("Save Changes Error:", error);
            alert(`Lỗi khi lưu: ${error.message}`);
        } finally {
            dom.buttons.save.disabled = false;
            dom.buttons.save.textContent = 'Lưu Thay đổi';
        }
    }

    function openAddCustomerModal() {
        dom.addModal.form.reset();
        dom.addModal.error.classList.add('hidden');
        dom.addModal.fields.TrangThai.innerHTML = statusOptions
            .map(opt => `<option value="${opt}">${opt}</option>`).join('');
        // Nếu đang lọc theo 1 nhóm thì mặc định chọn luôn nhóm đó cho tiện
        renderGroupOptions();
        if (currentFilters.group) dom.addModal.fields.Nhom.value = currentFilters.group;
        dom.addModal.overlay.classList.remove('hidden');
        dom.addModal.fields.TenKhachHang.focus();
    }

    function closeAddCustomerModal() {
        dom.addModal.overlay.classList.add('hidden');
    }

    // Dùng chung cho nút tạo nhóm nhanh trong form thêm khách hàng.
    async function createGroupFromPrompt() {
        const name = prompt('Tên nhóm mới:');
        if (name === null) return;
        try {
            const created = await createGroup(name);
            dom.addModal.fields.Nhom.value = created;
        } catch (error) {
            console.error("Create Group Error:", error);
            alert(`Lỗi khi tạo nhóm: ${error.message}`);
        }
    }

    async function submitNewCustomer(e) {
        e.preventDefault();
        const ten = dom.addModal.fields.TenKhachHang.value.trim();
        if (!ten) {
            showFormError(dom.addModal.error, 'Vui lòng nhập tên khách hàng.');
            return;
        }

        dom.addModal.error.classList.add('hidden');
        dom.addModal.submit.disabled = true;
        dom.addModal.submitText.textContent = 'Đang tạo...';
        dom.addModal.spinner.classList.remove('hidden');

        const data = {};
        Object.keys(dom.addModal.fields).forEach(key => {
            const value = dom.addModal.fields[key].value;
            data[key] = key === 'GhiChu' ? value : value.trim();
        });

        try {
            const result = await postToApi({ action: 'create', data });
            // Backend trả về bản ghi đã tạo (kèm ID) -> chèn thẳng vào danh sách
            const created = result.customer || { ...data, ID: Date.now(), NgayTao: new Date().toISOString() };
            allCustomers.push(created);

            populateIndustryFilter();
            populateCountryFilter();
            updateStatusCounts();
            closeAddCustomerModal();

            // Nhảy sang tab "Khách hàng mới thêm" và mở luôn khách vừa tạo
            dom.statusNav.querySelector('.active')?.classList.remove('active');
            dom.statusNav.querySelector('[data-status="moi-them"]')?.classList.add('active');
            currentFilters.status = 'moi-them';
            filterAndRender();

            const newItem = dom.customerList.querySelector(`.customer-item[data-id="${created.ID}"]`);
            if (newItem) newItem.classList.add('selected');
            renderCustomerDetails(created.ID);
        } catch (error) {
            console.error("Create Customer Error:", error);
            showFormError(dom.addModal.error, `Lỗi khi tạo khách hàng: ${error.message}`);
        } finally {
            dom.addModal.submit.disabled = false;
            dom.addModal.submitText.textContent = 'Tạo Khách hàng';
            dom.addModal.spinner.classList.add('hidden');
        }
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
             if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message);
            dom.modal.result.textContent = result.analysis;
            const index = allCustomers.findIndex(c => c.ID == customerId);
            if (index !== -1) {
                allCustomers[index].PhanTich = result.analysis;
                renderCustomerDetails(customerId);
            }
        } catch (error) {
             console.error("Analyze Customer Error:", error);
             dom.modal.result.textContent = `Lỗi khi phân tích: ${error.message}`;
        } finally {
            dom.spinner.classList.add('hidden');
            dom.buttons.analyze.disabled = false;
        }
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
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message);
            const index = allCustomers.findIndex(c => c.ID == customerId);
            if (index !== -1) {
                allCustomers[index].LinkTep = JSON.stringify(result.updatedLinks);
            }
            renderCustomerDetails(customerId);
        } catch (error) {
             console.error("Update File Links Error:", error);
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
                 if (!response.ok) throw new Error(`API Error: ${response.status}`);
                const result = await response.json();
                if (result.status !== 'success') throw new Error(result.message);
                uploadedLinks.push(result.fileInfo);
            } catch (error) {
                 console.error(`Upload File Error (${file.name}):`, error);
                alert(`Lỗi khi tải tệp ${file.name}: ${error.message}`);
            }
        }
        if (uploadedLinks.length > 0) {
            await updateFileLinks({ newLinks: uploadedLinks });
        }
        dom.uploadProgress.classList.add('hidden');
        dom.fileInput.value = '';
    }

    // --- HIỂN THỊ GIAO DIỆN ---
    function filterAndRender() {
        try {
             if (!Array.isArray(allCustomers)) {
                console.warn("allCustomers is not ready for filtering");
                dom.customerList.innerHTML = `<div class="loader">Dữ liệu chưa sẵn sàng...</div>`;
                return;
            }
            const filtered = allCustomers.filter(c => {
                const customerStatus = c.TrangThai || 'Chưa tiếp cận';
                const nameMatch = (c.TenKhachHang || '').toLowerCase().includes(currentFilters.location);
                const addressMatch = (c.DiaChi || '').toLowerCase().includes(currentFilters.location);
                const searchMatch = nameMatch || addressMatch;
                const statusMatch = currentFilters.status === 'all'
                                    || (currentFilters.status === 'moi-them' ? isRecentlyAdded(c) : customerStatus === currentFilters.status);
                const groupMatch = currentFilters.group === '' || (c.Nhom || '').trim() === currentFilters.group;
                const industryMatch = currentFilters.industry === '' || (c.MaNganh && c.MaNganh.includes(currentFilters.industry));
                const countryMatch = currentFilters.country === '' || c.QuocGia === currentFilters.country;
                const socialMatch = currentFilters.social.length === 0 ||
                                    currentFilters.social.some(social => c[social] && String(c[social]).trim() !== '');
                return statusMatch && searchMatch && industryMatch && countryMatch && groupMatch && socialMatch;
            });
            // Tab "mới thêm" sắp xếp khách mới nhất lên đầu
            if (currentFilters.status === 'moi-them') {
                filtered.sort((a, b) => String(b.NgayTao || '').localeCompare(String(a.NgayTao || '')));
            }
            renderCustomerList(filtered);
        } catch (error) {
            console.error("Error during filtering/rendering:", error);
            dom.customerList.innerHTML = `<div class="loader" style="color: red;">Lỗi hiển thị dữ liệu.</div>`;
        }
    }

    // "Mới thêm" = được tạo từ app này (có NgayTao) trong vòng 30 ngày gần nhất.
    const RECENT_DAYS = 30;
    function isRecentlyAdded(customer) {
        if (!customer.NgayTao) return false;
        const created = new Date(customer.NgayTao);
        if (isNaN(created.getTime())) return false;
        return (Date.now() - created.getTime()) <= RECENT_DAYS * 24 * 60 * 60 * 1000;
    }

    function renderCustomerList(customers) {
        dom.customerList.innerHTML = '';
        if (!customers || !Array.isArray(customers) || customers.length === 0) {
             dom.customerList.innerHTML = '<div class="loader">Không tìm thấy khách hàng.</div>';
             return;
        }
        customers.forEach(c => {
             const item = document.createElement('div');
             item.className = 'customer-item';
             item.dataset.id = c.ID;
             const group = (c.Nhom || '').trim();
             const badges = [];
             if (isRecentlyAdded(c)) badges.push('<span class="badge badge-new">Mới</span>');
             if (group) badges.push(`<span class="badge badge-group"><i class="fa-solid fa-folder"></i> ${escapeHtml(group)}</span>`);
             item.innerHTML = `
                 <h4>${c.TenKhachHang || 'Khách hàng không tên'}</h4>
                 <p>${c.MaNganh || 'Không có ngành nghề'}</p>
                 ${badges.length ? `<div class="badges">${badges.join('')}</div>` : ''}
                 <button class="see-more-btn" data-id="${c.ID}">Xem thêm</button>
             `;
             dom.customerList.appendChild(item);
        });
    }

    function renderCustomerDetails(customerId) {
        const customer = allCustomers.find(c => c.ID == customerId);
        if (!customer) {
            console.error(`Customer with ID ${customerId} not found in allCustomers`);
            showEmptyState(true);
            return;
        }
        showEmptyState(false);

        // --- Cập nhật Header ---
        dom.detail.name.textContent = customer.TenKhachHang || 'N/A';
        dom.detail.industry.textContent = customer.MaNganh || 'N/A';

        if (customer.DiaChi && String(customer.DiaChi).trim()) {
            dom.detail.address.textContent = customer.DiaChi;
            dom.detail.addressLine.classList.remove('hidden');
        } else {
            dom.detail.addressLine.classList.add('hidden');
        }

        if (customer.QuocGia && String(customer.QuocGia).trim()) {
            dom.detail.country.textContent = customer.QuocGia;
            dom.detail.country.classList.remove('hidden');
            dom.detail.countrySeparator.classList.remove('hidden');
        } else {
            dom.detail.country.classList.add('hidden');
            dom.detail.countrySeparator.classList.add('hidden');
        }

        ['Website', 'Facebook', 'Instagram', 'LinkedIn'].forEach(linkKey => {
            const lineElement = dom.detail[`${linkKey.toLowerCase()}Line`];
            const linkElement = dom.detail[`${linkKey.toLowerCase()}Link`];
            if(lineElement && linkElement) {
                const urlValue = customer[linkKey] ? String(customer[linkKey]).trim() : '';
                if (urlValue) {
                    const url = urlValue;
                    linkElement.href = url.startsWith('http') ? url : 'https://' + url;
                    linkElement.textContent = url;
                    lineElement.classList.remove('hidden');
                } else {
                    lineElement.classList.add('hidden');
                }
            } else {
                 console.warn(`Header elements for ${linkKey} not found.`);
            }
        });

        // Cập nhật nút Xem thêm trong header
        dom.buttons.headerSeeMore.dataset.id = customerId;
        dom.buttons.headerSeeMore.classList.remove('hidden');


        const currentStatus = customer.TrangThai || 'Chưa tiếp cận';
        dom.detail.status.innerHTML = statusOptions.map(opt => `<option value="${opt}" ${currentStatus === opt ? 'selected' : ''}>${opt}</option>`).join('');

        // --- Cập nhật Form ---
        dom.detail.website.value = customer.Website || '';
        dom.detail.facebook.value = customer.Facebook || '';
        dom.detail.instagram.value = customer.Instagram || '';
        dom.detail.linkedin.value = customer.LinkedIn || '';
        dom.detail.khac.value = customer.Khac || '';
        dom.detail.ghiChu.value = customer.GhiChu || '';
        dom.detail.id.value = customer.ID;

        // Nhóm: nếu nhóm đang lưu chưa có trong danh sách thì vẫn hiện để không mất dữ liệu
        const customerGroup = (customer.Nhom || '').trim();
        if (customerGroup && !allGroups.includes(customerGroup)) {
            allGroups.push(customerGroup);
            allGroups.sort((a, b) => a.localeCompare(b, 'vi'));
            renderGroupOptions();
        }
        dom.detail.nhom.value = customerGroup;

        // Cập nhật Phân tích đã lưu
        if (customer.PhanTich && customer.PhanTich.trim() !== "") {
            dom.savedAnalysisContent.textContent = customer.PhanTich;
            dom.savedAnalysisContainer.classList.remove('hidden');
            dom.analyzeBtnText.textContent = "Phân Tích Lại";
        } else {
            dom.savedAnalysisContainer.classList.add('hidden');
            dom.analyzeBtnText.textContent = "Phân Tích Tiềm năng";
        }

        // Cập nhật Danh sách tệp đính kèm
        dom.fileList.innerHTML = '';
        let fileObjects = [];
        try { if (customer.LinkTep && customer.LinkTep !== '[]') fileObjects = JSON.parse(customer.LinkTep); }
        catch(e) { console.error("Error parsing LinkTep JSON in renderCustomerDetails:", e, customer.LinkTep); }

        const uploadPromptSpan = dom.fileUploadPrompt.querySelector('span');

        if (Array.isArray(fileObjects) && fileObjects.length > 0) {
            fileObjects.forEach(linkObj => {
                if (linkObj && linkObj.url && linkObj.name) {
                    const { url, name } = linkObj;
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
                    const fileItemHTML = `
                        <div class="file-item">
                            ${isImage ? `<img src="${url}" alt="Preview" loading="lazy">` : `<i class="fa-solid fa-file"></i>`}
                            <span onclick="window.open('${url}', '_blank')" title="${name}">${name}</span>
                            <button class="delete-btn" data-url="${url}" title="Xóa tệp">&times;</button>
                        </div>`;
                    dom.fileList.innerHTML += fileItemHTML;
                }
            });
             if(uploadPromptSpan) uploadPromptSpan.textContent = 'Kéo & thả hoặc nhấp để tải thêm tệp';
        } else {
             if(uploadPromptSpan) uploadPromptSpan.textContent = 'Chưa có tệp nào được đính kèm.';
        }

        [dom.buttons.save, dom.buttons.analyze, dom.detail.status, dom.detail.nhom].forEach(el => { if(el) el.disabled = false; });
    }

    function renderFullDetails(customerId) {
        const customer = allCustomers.find(c => c.ID == customerId);
        if (!customer) return;

        dom.detailsModal.name.textContent = customer.TenKhachHang || "Chi tiết Khách hàng";
        let contentHTML = '';
        const preferredOrder = ['ID','TenKhachHang', 'Nhom', 'MaNganh', 'QuocGia', 'DiaChi', 'TrangThai', 'NgayTao', 'Website', 'Facebook', 'Instagram', 'LinkedIn', 'Khac', 'GhiChu', 'PhanTich', 'LinkTep'];
        const allKeys = Object.keys(customer);
        const orderedKeys = preferredOrder.filter(key => allKeys.includes(key));
        allKeys.forEach(key => { if (!preferredOrder.includes(key)) orderedKeys.push(key); });

        orderedKeys.forEach(key => {
             let value = customer[key];
             if ((value === null || value === undefined || String(value).trim() === '') && !['TrangThai', 'PhanTich', 'LinkTep'].includes(key)) return;
             value = value || 'N/A';
             let dtClass = ''; let ddClass = '';
             let displayKey = key;

             if (key === 'PhanTich') {
                 displayKey = 'Phân tích AI'; dtClass = 'full-width'; ddClass = 'full-width';
                 value = value !== 'N/A' ? `<pre>${value}</pre>` : 'Chưa có phân tích.';
             } else if (key === 'LinkTep') {
                 displayKey = 'Tệp đính kèm'; dtClass = 'full-width file-list'; ddClass = 'full-width';
                 let fileObjects = [];
                 try { if(value && value !== 'N/A' && value !== '[]') fileObjects = JSON.parse(value); } catch(e){}
                 if (Array.isArray(fileObjects) && fileObjects.length > 0) {
                     value = '<ul>' + fileObjects.map(linkObj => `<li><a href="${linkObj.url}" target="_blank">${linkObj.name}</a></li>`).join('') + '</ul>';
                 } else { value = 'Không có tệp.'; }
             } else if (key === 'ID') { displayKey = 'ID'; }
              else if (key === 'TenKhachHang') { displayKey = 'Tên'; }
              else if (key === 'DiaChi') { displayKey = 'Địa Chỉ'; }
              else if (key === 'MaNganh') { displayKey = 'Ngành'; }
              else if (key === 'TrangThai') { displayKey = 'Trạng Thái'; value = value !== 'N/A' ? value : 'Chưa tiếp cận'; }
              else if (key === 'GhiChu') { displayKey = 'Ghi Chú'; }
              else if (key === 'QuocGia') { displayKey = 'Quốc Gia'; }
              else if (key === 'Nhom') { displayKey = 'Nhóm'; }
              else if (key === 'NgayTao') {
                  displayKey = 'Ngày Tạo';
                  const d = new Date(value);
                  value = isNaN(d.getTime()) ? value : d.toLocaleString('vi-VN');
              }
              else if (['Website','Facebook','Instagram','LinkedIn','Khac'].includes(key)) {
                  const urlValue = String(value);
                  value = value !== 'N/A' ? `<a href="${urlValue.startsWith('http') ? urlValue : 'https://'+urlValue}" target="_blank">${urlValue}</a>` : value;
              }
             contentHTML += `<dt class="${dtClass}">${displayKey}</dt><dd class="${ddClass}">${value}</dd>`;
        });

        dom.detailsModal.content.innerHTML = contentHTML;
        dom.detailsModal.overlay.classList.remove('hidden');
    }

    function updateStatusCounts() {
        try {
            if (!Array.isArray(allCustomers)) {
                console.warn("allCustomers is not an array or is empty during updateStatusCounts");
                return;
            }
            const counts = { all: allCustomers.length, new: 0, approaching: 0, replied: 0, signed: 0, rejected: 0, recent: 0 };
            allCustomers.forEach(c => {
                if (isRecentlyAdded(c)) counts.recent++;
                const status = c.TrangThai || 'Chưa tiếp cận';
                if (status === 'Chưa tiếp cận') counts.new++; if (status === 'Đang tiếp cận') counts.approaching++;
                if (status === 'Đã phản hồi') counts.replied++; if (status === 'Đã ký HĐ') counts.signed++;
                if (status === 'Đã từ chối') counts.rejected++;
            });
            const countRecentEl = document.getElementById('count-recent');
            if(countRecentEl) countRecentEl.textContent = counts.recent;
            const countAllEl = document.getElementById('count-all');
            const countNewEl = document.getElementById('count-new');
            const countApproachingEl = document.getElementById('count-approaching');
            const countRepliedEl = document.getElementById('count-replied');
            const countSignedEl = document.getElementById('count-signed');
            const countRejectedEl = document.getElementById('count-rejected');

            if(countAllEl) countAllEl.textContent = counts.all;
            if(countNewEl) countNewEl.textContent = counts.new;
            if(countApproachingEl) countApproachingEl.textContent = counts.approaching;
            if(countRepliedEl) countRepliedEl.textContent = counts.replied;
            if(countSignedEl) countSignedEl.textContent = counts.signed;
            if(countRejectedEl) countRejectedEl.textContent = counts.rejected;
        } catch (error) {
             console.error("Error updating status counts:", error);
        }
    }

    function showEmptyState(show) {
        if (dom.emptyState && dom.customerDetails) {
            dom.emptyState.classList.toggle('hidden', !show);
            dom.customerDetails.classList.toggle('hidden', show);
        } else {
             console.error("Empty state or customer details element not found");
        }
    }

    function showLoader(isLoading) {
        const loader = dom.customerList?.querySelector('.loader');
        if (loader) {
            loader.style.display = isLoading ? 'block' : 'none';
        }
    }

    initializeApp();
});
