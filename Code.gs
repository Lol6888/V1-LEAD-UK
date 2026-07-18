// =============================================================
//  BACKEND GOOGLE APPS SCRIPT — V1 LEAD UK
// =============================================================
//  CÁCH DÙNG: Mở Apps Script editor, XOÁ HẾT nội dung Code.gs cũ,
//  dán toàn bộ file này vào, rồi:
//      Deploy > Manage deployments > (bút chì) Edit
//      > Version: New version > Deploy
//  Giữ nguyên URL deployment cũ, KHÔNG cần sửa API_URL trong script.js.
//
//  Script tự thêm 2 cột "Nhom" và "NgayTao" vào sheet nếu chưa có,
//  và tự tạo sheet "Nhom" — không cần thao tác tay trên Google Sheet.
//
//  GEMINI_API_KEY vẫn đọc từ Script Properties như cũ, không đụng tới.
// =============================================================

// --- CẤU HÌNH ---
const SPREADSHEET_ID = "1EEUyWnPPwe_3RR9K9MNvCgbSc-YpDdjU1QJxGHnArBg";
const SHEET_NAME = "sheet1";
// !!! QUAN TRỌNG: Dán ID thư mục Google Drive của bạn vào đây
const UPLOAD_FOLDER_ID = "1udrDssC5_GIFvn61zgUPnEnK1GRW65JL";
// Sheet lưu danh sách nhóm khách hàng (tự tạo nếu chưa có)
const GROUP_SHEET_NAME = "Nhom";

const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- HÀM XỬ LÝ YÊU CẦU ---
function doGet(e) {
  try {
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    const json = data.map(row => {
      let obj = {};
      headers.forEach((header, index) => { if (header) obj[header] = row[index]; });
      return obj;
    });
    return createJsonResponse(json);
  } catch (error) {
    return createJsonResponse({ status: "error", message: "Lỗi đọc Google Sheet: " + error.toString() });
  }
}

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    if (request.action === 'update') return handleUpdate(request.data);
    if (request.action === 'analyze') return handleAnalyze(request.customerId);
    if (request.action === 'uploadFile') return handleFileUpload(request.data);
    if (request.action === 'updateFileLinks') return handleUpdateFileLinks(request.data);
    if (request.action === 'create') return handleCreateCustomer(request.data);
    if (request.action === 'delete') return handleDeleteCustomer(request.data);
    if (request.action === 'getGroups') return handleGetGroups();
    if (request.action === 'createGroup') return handleCreateGroup(request.data);
    throw new Error("Hành động không hợp lệ.");
  } catch (error) {
    return createJsonResponse({ status: "error", message: "Lỗi xử lý yêu cầu: " + error.toString() });
  }
}

// --- CÁC HÀM CON ---
function handleUpdate(updatedData) {
  const idToUpdate = updatedData.ID; if (!idToUpdate) throw new Error("Không có ID để cập nhật.");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColumnIndex = headers.indexOf("ID"); if (idColumnIndex === -1) throw new Error("Không tìm thấy cột 'ID'.");
  const rowIndex = data.findIndex(row => row[idColumnIndex] == idToUpdate);
  if (rowIndex === -1) throw new Error("Không tìm thấy khách hàng với ID: " + idToUpdate);
  const rowIndexToUpdate = rowIndex + 1;
  headers.forEach((header, index) => { if (updatedData.hasOwnProperty(header)) sheet.getRange(rowIndexToUpdate, index + 1).setValue(updatedData[header]); });
  return createJsonResponse({ status: "success", message: "Cập nhật thành công!" });
}

function handleAnalyze(customerId) {
  try {
    const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error("Chưa cấu hình Gemini API Key.");

    const allSheetData = sheet.getDataRange().getValues();
    const headers = allSheetData[0].slice();
    const sheetData = allSheetData.slice(1);
    const idColumnIndex = headers.indexOf("ID");
    const row = sheetData.find(r => r[idColumnIndex] == customerId);
    if (!row) throw new Error("Không tìm thấy dữ liệu khách hàng.");

    let customerData = {}; headers.forEach((header, index) => { customerData[header] = row[index]; });

    const prompt = `Bạn là một Giám đốc Sáng tạo và Chiến lược gia Kỹ thuật số cao cấp. Nhiệm vụ của bạn là thực hiện một cuộc kiểm tra toàn diện về website và sự hiện diện trên mạng xã hội của một doanh nghiệp. Phân tích của bạn phải cực kỳ cụ thể, tập trung vào thiết kế, trải nghiệm người dùng, chất lượng nội dung, và đề xuất các chiến dịch sáng tạo. Phân tích của bạn phải dựa *trực tiếp* vào các URL được cung cấp. Trả lời bằng tiếng Việt. Thực hiện kiểm tra chi tiết website và sự hiện diện kỹ thuật số cho doanh nghiệp sau.
- Tên doanh nghiệp: ${customerData.TenKhachHang}
- Ngành nghề: ${customerData.MaNganh || 'Không có'}
- Địa chỉ: ${customerData.DiaChi || 'Không có'}
- Website: ${customerData.Website || 'Không có'}
- Facebook: ${customerData.Facebook || 'Không có'}
- Instagram: ${customerData.Instagram || 'Không có'}

**PHẦN 1: KIỂM TRA WEBSITE (Dựa trên URL Website)**
1.  **Phân tích sâu URL Website:** ${customerData.Website}. Nếu không có website, hãy nêu rõ không thể phân tích.
2.  **Đánh giá từ góc độ chuyên gia:**
    * **Thiết kế Trực quan & Thương hiệu:** Ấn tượng đầu tiên, thẩm mỹ, tính hiện đại, sự nhất quán của thương hiệu.
    * **UI/UX (Giao diện & Trải nghiệm Người dùng):** Mức độ dễ điều hướng, sự rõ ràng, tính thân thiện với di động, hiệu quả của CTA.
    * **Phân tích sâu về SEO hiện tại của Website:** Mức độ hiển thị, đánh giá trên google, google maps, đánh giá người dùng.
    * **Khía cạnh Kỹ thuật:** Các vấn đề tiềm ẩn như tốc độ tải, bảo mật (HTTPS), bố cục responsive.
    -   **Chiến lược Nội dung Website:** Thông điệp có rõ ràng, thuyết phục và xây dựng được lòng tin không?

**PHẦN 2: KIỂM TRA MẠNG XÃ HỘI (Dựa trên URL Facebook/Instagram)**
1.  **Phân tích sâu các kênh MXH được cung cấp.**
2.  **Đánh giá từ góc độ Giám đốc Sáng tạo:**
    * **Sự Gắn kết Thương hiệu:** Hình ảnh, màu sắc, văn phong trên MXH có nhất quán với website không?
    * **Chất lượng Nội dung & Hình ảnh:** Các bài đăng có được đầu tư không? Hình ảnh có chuyên nghiệp, sắc nét, hấp dẫn không? Nội dung có mang lại giá trị (giải trí, giáo dục) hay chỉ bán hàng?
    * **Chiến lược Thu hút:** Nội dung có được thiết kế để tạo ra tương tác không?

**PHẦN 3: TỔNG KẾT VÀ KẾ HOẠCH HÀNH ĐỘNG**
1.  **Tổng hợp các điểm yếu chính** từ cả website và mạng xã hội.
2.  **Đề xuất Kế hoạch Hành động:**
    * Các bước cụ thể để khắc phục vấn đề của website.
    * **Gợi ý các chiến dịch nội dung và hình ảnh cụ thể** cho mạng xã hội. Ví dụ: "Thực hiện chuỗi video 'Hậu trường sản xuất' để tăng tính chân thực" hoặc "Tổ chức một cuộc thi ảnh với hashtag thương hiệu để thu hút người dùng". Hãy đưa ra những ý tưởng sáng tạo, phù hợp với ngành nghề của họ.

**PHẦN 4: EMAIL TIẾP CẬN CÁ NHÂN HÓA**

Dựa trên toàn bộ phân tích từ PHẦN 1, 2 và 3, hãy viết **một email tiếp cận ngắn gọn, chuyên nghiệp và thuyết phục**, cho thấy bạn thật sự hiểu doanh nghiệp ${customerData.TenKhachHang}.

🎯 **Mục tiêu:** - Hãy thể hiện bạn *đã hiểu họ*, *hiểu thị trường họ đang ở*, *hiểu vấn đề và cơ hội* của họ.
- Gợi mở hướng hợp tác hoặc một ý tưởng chiến lược có giá trị (thay vì chào hàng).
- Giọng văn nên chân thực, có chiều sâu chiến lược, mang phong cách của một **Giám đốc Sáng tạo / Chiến lược gia cấp cao**.

📐 **Cấu trúc email:**

1. **Subject line (3 lựa chọn ngắn gọn, gợi mở):**
   - “Một góc nhìn khác về cách ${customerData.TenKhachHang} đang kể câu chuyện thương hiệu của mình”
   - “Ý tưởng để ${customerData.TenKhachHang} tạo khác biệt trong ngành ${customerData.MaNganh || 'doanh nghiệp của bạn'}”
   - “Nhìn thấy tiềm năng lớn từ cách ${customerData.TenKhachHang} đang xuất hiện online”
   - Dựa vào phần tích ở 3 phần trên, hãy cho ra 3 subject line phù hợp với trường hợp của Khách Hàng nhất

2. **Opening (Câu mở đầu tinh tế):**
   - Bắt đầu bằng một nhận xét cụ thể về họ (ví dụ: tone màu, cách website thể hiện, loại nội dung, hoặc cảm xúc mà thương hiệu họ tạo ra).
   - Ví dụ:
     > Tôi ấn tượng với cách ${customerData.TenKhachHang} đang duy trì hình ảnh nhất quán trên website và mạng xã hội – điều mà ít thương hiệu trong ngành ${customerData.MaNganh} làm tốt được.

3. **Insight cá nhân hóa (Từ kết quả phân tích 3 phần trước):**
   - Nêu 1–2 điểm bạn “nhận ra” về cách họ đang làm digital marketing, thể hiện bạn hiểu họ ở tầng chiến lược.
   - Ví dụ:
     > Tuy nhiên, có vẻ thương hiệu vẫn chưa khai thác hết tiềm năng storytelling – đặc biệt là cách website dẫn dắt cảm xúc người xem, hoặc chuỗi nội dung trên Facebook vẫn đang dừng ở mức mô tả sản phẩm, chưa thực sự kể câu chuyện của người dùng.

4. **Value Proposition tinh tế (đề xuất giá trị):**
   - Đưa ra lời gợi mở nhẹ nhàng, cho thấy bạn có ý tưởng / hướng đi để họ cải thiện.
   - Ví dụ:
     > Tôi có một vài ý tưởng nhỏ về cách ${customerData.TenKhachHang} có thể tăng độ nhận diện thương hiệu và tạo kết nối mạnh hơn với khách hàng tiềm năng qua digital touchpoints.

5. **CTA tự nhiên, không bán hàng:**
   - Gợi ý họ phản hồi, hoặc mở ra cuộc trò chuyện.
   - Ví dụ:
     > Anh/chị có sẵn lòng trao đổi 10–15 phút trong tuần này không? Tôi tin chỉ cần một góc nhìn mới cũng có thể giúp đội của ${customerData.TenKhachHang} tiết kiệm khá nhiều thời gian trong chiến lược digital sắp tới.


---

💡 **Gợi ý cho AI khi sinh nội dung cụ thể:**
- Sử dụng kết quả từ PHẦN 1, 2, 3 để chèn vào email một cách tự nhiên:
Ví dụ:
- Nếu website load chậm → nói “Tốc độ tải chậm có thể đang làm giảm trải nghiệm khách hàng cao cấp mà thương hiệu hướng tới.”
- Nếu fanpage chưa có chiến dịch nội dung dài hạn → nói “Tôi tin chuỗi nội dung theo chủ đề có thể giúp ${customerData.TenKhachHang} tạo cộng đồng mạnh hơn.”
- Nếu thiết kế tốt → khen thật, rồi chuyển hướng sang ý tưởng nâng tầm.

---

📩 **Kết quả mong đợi khi AI sinh ra:**
> Email phải giống như được viết thủ công bởi một chuyên gia thương hiệu — hiểu họ, có thiện chí, có insight, có giá trị.
> Không có câu “Tôi audit bạn”, không spam, không bán hàng, mà mở ra cơ hội trò chuyện thực sự.

Cung cấp kết quả phân tích của bạn với trình bày dễ đọc, dễ hiểu`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const options = {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.error) throw new Error("Lỗi từ Gemini API: " + result.error.message);
    if (!result.candidates || result.candidates.length === 0) throw new Error("Gemini API không trả về kết quả hợp lệ.");

    const analysisText = result.candidates[0].content.parts[0].text;

    const phanTichColumnIndex = headers.indexOf("PhanTich");
    if (phanTichColumnIndex === -1) throw new Error("Không tìm thấy cột 'PhanTich'.");
    const analysisRowIndex = sheetData.findIndex(r => r[idColumnIndex] == customerId);
    if (analysisRowIndex !== -1) {
      sheet.getRange(analysisRowIndex + 2, phanTichColumnIndex + 1).setValue(analysisText);
    }

    return createJsonResponse({ status: "success", analysis: analysisText });
  } catch(error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

function handleFileUpload(fileData) {
  try {
    const { fileName, mimeType, data } = fileData;
    const decodedData = Utilities.base64Decode(data);
    const blob = Utilities.newBlob(decodedData, mimeType, fileName);

    const folder = DriveApp.getFolderById(UPLOAD_FOLDER_ID);
    const file = folder.createFile(blob);
    const fileUrl = file.getUrl();

    return createJsonResponse({
      status: 'success',
      fileInfo: { url: fileUrl, name: fileName }
    });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: 'Lỗi tải tệp lên Drive: ' + error.toString() });
  }
}

function handleUpdateFileLinks(data) {
  try {
    const { customerId, newLinks, linkToDelete } = data;
    if (!customerId) throw new Error("Không có ID khách hàng.");

    const allSheetData = sheet.getDataRange().getValues();
    const headers = allSheetData[0];
    const sheetData = allSheetData.slice(1);
    const idColumnIndex = headers.indexOf("ID");
    const linkTepColumnIndex = headers.indexOf("LinkTep");

    if (idColumnIndex === -1) throw new Error("Không tìm thấy cột 'ID'.");
    if (linkTepColumnIndex === -1) throw new Error("Không tìm thấy cột 'LinkTep'.");

    const rowIndexInSheetData = sheetData.findIndex(row => row[idColumnIndex] == customerId);
    if (rowIndexInSheetData === -1) throw new Error("Không tìm thấy khách hàng.");

    const cellRow = rowIndexInSheetData + 2;
    const cell = sheet.getRange(cellRow, linkTepColumnIndex + 1);
    const currentValue = cell.getValue();

    let linksArray = [];
    try {
      if (currentValue && typeof currentValue === 'string') linksArray = JSON.parse(currentValue);
    } catch (e) { linksArray = []; }

    if (newLinks && newLinks.length > 0) {
      linksArray.push(...newLinks);
    }

    if (linkToDelete) {
      linksArray = linksArray.filter(linkObj => linkObj.url !== linkToDelete);
    }

    cell.setValue(JSON.stringify(linksArray));

    return createJsonResponse({ status: "success", updatedLinks: linksArray });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

// --- THÊM KHÁCH HÀNG MỚI ---
function handleCreateCustomer(data) {
  try {
    const ten = String((data && data.TenKhachHang) || "").trim();
    if (!ten) throw new Error("Tên khách hàng không được để trống.");

    const headers = ensureColumns_(["Nhom", "NgayTao"]);
    const idColumnIndex = headers.indexOf("ID");
    if (idColumnIndex === -1) throw new Error("Không tìm thấy cột 'ID'.");

    // ID mới = ID số lớn nhất hiện có + 1
    let newId = 1;
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const ids = sheet.getRange(2, idColumnIndex + 1, lastRow - 1, 1).getValues();
      ids.forEach(r => {
        const n = parseInt(r[0], 10);
        if (!isNaN(n) && n >= newId) newId = n + 1;
      });
    }

    const record = {
      ID: newId,
      TenKhachHang: ten,
      MaNganh: String(data.MaNganh || "").trim(),
      QuocGia: String(data.QuocGia || "").trim(),
      DiaChi: String(data.DiaChi || "").trim(),
      TrangThai: String(data.TrangThai || "Chưa tiếp cận").trim(),
      Website: String(data.Website || "").trim(),
      Facebook: String(data.Facebook || "").trim(),
      Instagram: String(data.Instagram || "").trim(),
      LinkedIn: String(data.LinkedIn || "").trim(),
      Khac: String(data.Khac || "").trim(),
      GhiChu: String(data.GhiChu || ""),
      Nhom: String(data.Nhom || "").trim(),
      PhanTich: "",
      LinkTep: "[]",
      NgayTao: new Date().toISOString()
    };

    // Ghi theo header nên thứ tự cột trong sheet không quan trọng
    const row = headers.map(h => record.hasOwnProperty(h) ? record[h] : "");
    sheet.appendRow(row);

    return createJsonResponse({ status: "success", customer: record });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

// --- XOÁ KHÁCH HÀNG ---
// Chỉ xoá dòng trong sheet. Tệp đính kèm trên Drive được giữ lại.
function handleDeleteCustomer(data) {
  try {
    const idToDelete = (data && data.ID);
    if (!idToDelete) throw new Error("Không có ID để xoá.");

    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    const idColumnIndex = headers.indexOf("ID");
    if (idColumnIndex === -1) throw new Error("Không tìm thấy cột 'ID'.");

    const rowIndex = allData.findIndex(row => row[idColumnIndex] == idToDelete);
    if (rowIndex === -1) throw new Error("Không tìm thấy khách hàng với ID: " + idToDelete);
    if (rowIndex === 0) throw new Error("Không thể xoá dòng tiêu đề.");

    sheet.deleteRow(rowIndex + 1);

    return createJsonResponse({ status: "success", deletedId: idToDelete });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

// Đảm bảo các cột trong `names` tồn tại; cột thiếu sẽ được thêm vào cuối.
// Trả về mảng header sau khi đã bổ sung.
function ensureColumns_(names) {
  let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const missing = names.filter(n => headers.indexOf(n) === -1);
  if (missing.length > 0) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
    headers = headers.concat(missing);
  }
  return headers;
}

// --- NHÓM KHÁCH HÀNG ---
function getGroupSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let groupSheet = ss.getSheetByName(GROUP_SHEET_NAME);
  if (!groupSheet) {
    groupSheet = ss.insertSheet(GROUP_SHEET_NAME);
    groupSheet.getRange(1, 1).setValue("TenNhom");
  }
  return groupSheet;
}

function handleGetGroups() {
  try {
    const groupSheet = getGroupSheet_();
    let groups = [];
    if (groupSheet.getLastRow() > 1) {
      groups = groupSheet.getRange(2, 1, groupSheet.getLastRow() - 1, 1)
        .getValues()
        .map(r => String(r[0] || "").trim())
        .filter(Boolean);
    }
    return createJsonResponse({ status: "success", groups: groups });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

function handleCreateGroup(data) {
  try {
    const name = String((data && data.name) || "").trim();
    if (!name) throw new Error("Tên nhóm không được để trống.");

    const groupSheet = getGroupSheet_();
    let groups = [];
    if (groupSheet.getLastRow() > 1) {
      groups = groupSheet.getRange(2, 1, groupSheet.getLastRow() - 1, 1)
        .getValues()
        .map(r => String(r[0] || "").trim())
        .filter(Boolean);
    }
    if (groups.some(g => g.toLowerCase() === name.toLowerCase())) {
      throw new Error('Nhóm "' + name + '" đã tồn tại.');
    }

    groupSheet.appendRow([name]);
    return createJsonResponse({ status: "success", groups: groups.concat([name]) });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}
