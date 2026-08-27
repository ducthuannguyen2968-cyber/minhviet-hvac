// ==========================================================================
// MINH VIET HVAC - INTERACTIVE CONTROLLER
// CÔNG TY CỔ PHẦN CƠ ĐIỆN LẠNH MINH VIỆT
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Sticky Navbar & Back-to-Top Button Handler
  const navbar = document.querySelector('.navbar');
  const backToTopBtn = document.getElementById('backToTopBtn');

  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY;
    
    // Navbar scroll effect
    if (navbar) {
      if (scrollPos > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    // Back to top visibility
    if (backToTopBtn) {
      if (scrollPos > 350) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }
  });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // 2. Mobile Menu Drawer Handler
  const openMenuBtn = document.getElementById('mobileMenuOpenBtn');
  const closeMenuBtn = document.getElementById('mobileMenuCloseBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerOverlay = document.getElementById('mobileDrawerOverlay');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  function openMobileMenu() {
    if (mobileDrawer && drawerOverlay) {
      mobileDrawer.classList.add('open');
      drawerOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMobileMenu() {
    if (mobileDrawer && drawerOverlay) {
      mobileDrawer.classList.remove('open');
      drawerOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (openMenuBtn) openMenuBtn.addEventListener('click', openMobileMenu);
  if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMobileMenu);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeMobileMenu);

  drawerLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });

  // 3. Interactive HVAC Capacity & Cost Calculator
  const roomTypeSelect = document.getElementById('calcRoomType');
  const areaRangeInput = document.getElementById('calcAreaRange');
  const areaDisplay = document.getElementById('areaDisplay');
  const ceilingSelect = document.getElementById('calcCeilingHeight');
  const sunExposureSelect = document.getElementById('calcSunExposure');
  const calcBtuResult = document.getElementById('calcBtuResult');
  const calcHpResult = document.getElementById('calcHpResult');
  const calcCostEstResult = document.getElementById('calcCostEstResult');
  const calcRecText = document.getElementById('calcRecText');
  const applyCalcBtn = document.getElementById('applyCalcToFormBtn');

  function calculateHVAC() {
    if (!areaRangeInput) return;

    const area = parseFloat(areaRangeInput.value);
    if (areaDisplay) areaDisplay.textContent = `${area} m²`;

    const roomType = roomTypeSelect ? roomTypeSelect.value : 'bedroom';
    const ceilingFactor = ceilingSelect ? parseFloat(ceilingSelect.value) / 3.0 : 1.0;
    const isHighSun = sunExposureSelect && sunExposureSelect.value === 'high';

    // Base BTU per m2
    let baseBtuPerM2 = 700; // standard bedroom
    if (roomType === 'living') baseBtuPerM2 = 850;
    if (roomType === 'dining') baseBtuPerM2 = 800;
    if (roomType === 'office') baseBtuPerM2 = 750;

    let totalBtu = area * baseBtuPerM2 * ceilingFactor;
    if (isHighSun) totalBtu *= 1.15;

    // Round to nearest 1,000 BTU
    const roundedBtu = Math.ceil(totalBtu / 1000) * 1000;
    const hp = (roundedBtu / 9000).toFixed(1);

    if (calcBtuResult) calcBtuResult.textContent = roundedBtu.toLocaleString('vi-VN');
    if (calcHpResult) calcHpResult.textContent = `${hp} HP`;

    // Estimate Cost range based on BTU and area
    let minCost = 0;
    let maxCost = 0;
    // Mức giá trọn gói (thiết bị + tư vấn cùng KTS + thi công) chủ động đặt cao hơn
    // báo giá lắp đặt thông thường của thị trường khoảng 10-15%, đúng định vị dịch vụ
    // tư vấn kiến trúc - kỹ thuật đi kèm, không chỉ lắp máy đơn thuần.
    if (roundedBtu <= 12000) {
      minCost = 18;
      maxCost = 25;
    } else if (roundedBtu <= 18000) {
      minCost = 25;
      maxCost = 33;
    } else if (roundedBtu <= 24000) {
      minCost = 32;
      maxCost = 41;
    } else if (roundedBtu <= 36000) {
      minCost = 47;
      maxCost = 62;
    } else {
      minCost = Math.round(roundedBtu * 0.00158);
      maxCost = Math.round(roundedBtu * 0.00214);
    }

    if (calcCostEstResult) {
      calcCostEstResult.textContent = `${minCost} - ${maxCost} Tr`;
    }

    // Dynamic Recommendation
    let recMessage = '';
    if (roundedBtu <= 12000) {
      recMessage = `Dàn lạnh giấu trần nối ống gió Daikin/Panasonic <strong>${roundedBtu.toLocaleString('vi-VN')} BTU (1.5 HP)</strong> + Cửa gió nan dài Linear kết hợp cấp khí tươi lọc PM2.5.`;
    } else if (roundedBtu <= 24000) {
      recMessage = `Hệ thống Multi hoặc VRV-S giấu trần <strong>${roundedBtu.toLocaleString('vi-VN')} BTU (${hp} HP)</strong> Inverter siêu êm (<22dB) + Thu hồi nhiệt ERV khử ẩm.`;
    } else {
      recMessage = `Hệ thống điều hòa trung tâm VRV/VRF <strong>${roundedBtu.toLocaleString('vi-VN')} BTU (${hp} HP)</strong> đa hướng gió + Cấp oxy tươi tự nhiên liên tục cho không gian lớn.`;
    }

    if (calcRecText) calcRecText.innerHTML = recMessage;
  }

  if (areaRangeInput) areaRangeInput.addEventListener('input', calculateHVAC);
  if (roomTypeSelect) roomTypeSelect.addEventListener('change', calculateHVAC);
  if (ceilingSelect) ceilingSelect.addEventListener('change', calculateHVAC);
  if (sunExposureSelect) sunExposureSelect.addEventListener('change', calculateHVAC);

  calculateHVAC();

  // Apply to Quote Form
  if (applyCalcBtn) {
    applyCalcBtn.addEventListener('click', () => {
      const areaVal = areaRangeInput ? areaRangeInput.value : '30';
      const btuVal = calcBtuResult ? calcBtuResult.textContent : '24.000';
      const hpVal = calcHpResult ? calcHpResult.textContent : '2.7 HP';
      const costVal = calcCostEstResult ? calcCostEstResult.textContent : '32 - 41 Tr';

      const formArea = document.getElementById('formArea');
      const formNotes = document.getElementById('formNotes');

      if (formArea) formArea.value = `${areaVal} m²`;
      if (formNotes) {
        formNotes.value = `[Từ Bộ Tính Tải] Cần báo giá hệ thống công suất: ${btuVal} BTU (${hpVal}), ước tính ngân sách ${costVal} cho diện tích ${areaVal}m², có kèm cấp khí tươi ERV lọc bụi mịn PM2.5.`;
      }

      // Smooth scroll down to form
      const quoteSection = document.getElementById('gui-ban-ve');
      if (quoteSection) {
        quoteSection.scrollIntoView({ behavior: 'smooth' });
        // Highlight form input
        if (formArea) {
          formArea.focus();
          formArea.style.borderColor = '#0088CC';
        }
      }
    });
  }

  // 4. Daikin Product Catalog (Điều Hòa Cục Bộ)
  // Danh sách mặc định dùng khi chưa cấu hình Google Sheet CSV (xem app-config.js).
  // Mô tả + thông số kỹ thuật chi tiết từng model, nguồn: minhvietco.vn (trang sản phẩm tương ứng) — 2026-08.
  const localAcDetails = {
  'FCF60CVM_RZF60CV2V': {
    description: 'Điều hòa âm trần cassette Daikin FCF60CVM/RZF60CV2V loại 1 chiều, công nghệ Inverter, công suất lạnh khoảng 20.500 BTU (~2.5HP). Luồng gió đa hướng 360° với 23 kiểu phân bổ gió, thiết kế mỏng nhẹ, mặt nạ vuông đồng bộ, khay nước ngưng phủ ion bạc kháng khuẩn. Dùng gas R32 thân thiện môi trường, dàn trao đổi nhiệt microchannel bền bỉ, giúp giảm khoảng 50% điện năng tiêu thụ hàng năm so với máy thường. Phù hợp phòng dưới 35m² (phòng khách, phòng họp, showroom).',
    specs: [
      { label: 'Công suất lạnh (Min-Max)', value: '3.2-6.0 kW · 10.900-20.500 BTU/h' },
      { label: 'Lưu lượng gió dàn lạnh (5 cấp)', value: '23.0/21.0/18.5/16.0/13.5 m³/phút' },
      { label: 'Độ ồn dàn lạnh (5 cấp)', value: '37.0/34.5/32.0/29.5/27.5 dB(A)' },
      { label: 'Kích thước dàn lạnh (C×R×S)', value: '256 × 840 × 840 mm' },
      { label: 'Kích thước mặt nạ trang trí', value: '50 × 950 × 950 mm' },
      { label: 'Trọng lượng dàn lạnh', value: '22 kg' },
      { label: 'Phạm vi vận hành dàn lạnh', value: '14-25°CWB' },
      { label: 'Nguồn điện', value: '1 pha, 220V, 50Hz' },
      { label: 'Công suất tiêu thụ điện (làm lạnh)', value: '1.53 kW' },
      { label: 'COP', value: '3.92 W/W' },
      { label: 'CSPF', value: '6.31 Wh/Wh' },
      { label: 'Loại máy nén', value: 'Swing kín' },
      { label: 'Lượng gas nạp (R32)', value: '1.2 kg (cho 30m)' },
      { label: 'Độ ồn dàn nóng (làm lạnh/ban đêm)', value: '48/44 dB(A)' },
      { label: 'Kích thước dàn nóng (C×R×S)', value: '595 × 845 × 300 mm' },
      { label: 'Trọng lượng dàn nóng', value: '41 kg' },
      { label: 'Đường ống lỏng / gas (loe)', value: 'Ø9.5 mm / Ø15.9 mm' },
      { label: 'Chiều dài ống tối đa', value: '50m (quy đổi)' },
      { label: 'Bảo hành', value: 'Máy 1 năm; máy nén 4 năm' },
      { label: 'Xuất xứ', value: 'Thái Lan' },
    ],
  },
  'FBA50BVMA9_RZA50DV2V': {
    description: 'Điều hòa âm trần nối ống gió Daikin FBA50BVMA9/RZA50DV2V, loại 2 chiều (nóng lạnh), công suất lạnh danh định 17.100 BTU/h, công nghệ Inverter điều chỉnh công suất theo tải bên ngoài giúp tiết kiệm điện. Dàn lạnh mỏng chỉ cao 245mm phù hợp trần nhà có không gian hạn chế, có 3 cấp quạt gió + chế độ tự động. Khay nước ngưng phủ ion bạc chống vi khuẩn/nấm mốc, cửa sổ kiểm tra khay nước ngưng tiện bảo trì.',
    specs: [
      { label: 'Nguồn điện', value: '1 pha, 220-240V, 50/60Hz' },
      { label: 'Công suất lạnh (danh định, Min-Max)', value: '5.0 kW (1.4-6.0) · 17.100 BTU/h (4.800-20.500)' },
      { label: 'Công suất sưởi (danh định, Min-Max)', value: '6.0 kW (1.4-7.1) · 20.500 BTU/h (4.800-24.200)' },
      { label: 'Công suất tiêu thụ điện (lạnh/sưởi)', value: '1.23 kW / 1.31 kW' },
      { label: 'COP (lạnh/sưởi)', value: '4.06 / 4.58 kW/kW' },
      { label: 'CSPF làm lạnh', value: '6.28 kWh/kWh' },
      { label: 'Lưu lượng gió dàn lạnh (Cao/Trung/Thấp)', value: '18.0/15.0/12.5 m³/phút' },
      { label: 'Áp suất tĩnh ngoài', value: '50 Pa (50-150)' },
      { label: 'Độ ồn dàn lạnh (Cao/Trung/Thấp)', value: '35.0/33.0/31.0 dB(A)' },
      { label: 'Kích thước dàn lạnh (C×R×S)', value: '245 × 1000 × 800 mm' },
      { label: 'Trọng lượng dàn lạnh', value: '37 kg' },
      { label: 'Phạm vi vận hành (lạnh/sưởi)', value: '14-25°CWB / 15-27°CDB' },
      { label: 'Loại máy nén', value: 'Swing kín' },
      { label: 'Lượng gas nạp (R32)', value: '1.7 kg (nạp sẵn cho 30m)' },
      { label: 'Độ ồn dàn nóng (lạnh/sưởi)', value: '47/49 dB(A)' },
      { label: 'Kích thước dàn nóng (C×R×S)', value: '595 × 845 × 300 mm' },
      { label: 'Trọng lượng dàn nóng', value: '45 kg' },
      { label: 'Phạm vi vận hành dàn nóng (lạnh/sưởi)', value: '-5~46°CDB / -15~15.5°CWB' },
      { label: 'Đường ống lỏng / gas (loe)', value: 'Ø9.5 mm / Ø15.9 mm' },
      { label: 'Chiều dài ống tối đa', value: '50m (quy đổi 70m)' },
    ],
  },
  'FBA60BVMA9_RZA60DV2V': {
    description: 'Điều hòa âm trần nối ống gió Daikin FBA60BVMA9/RZA60DV2V, loại 2 chiều, 21.000 BTU, gas R32, nguồn điện 1 pha. Công nghệ Inverter tiết kiệm điện, vận hành êm ái; dàn lạnh mỏng cao 245mm lắp được ở trần có không gian hạn chế; khay nước ngưng phủ ion bạc kháng khuẩn/nấm mốc; hỗ trợ liên động khóa thẻ khách sạn qua hệ thống quản lý tòa nhà bên thứ ba.',
    specs: [
      { label: 'Nguồn điện', value: '1 pha, 220-240V, 50/60Hz' },
      { label: 'Công suất lạnh (danh định, Min-Max)', value: '6.0 kW (1.4-7.1) · 20.500 BTU/h (4.800-24.200)' },
      { label: 'Công suất sưởi (danh định, Min-Max)', value: '7.1 kW (1.4-8.0) · 23.200 BTU/h (4.800-27.300)' },
      { label: 'Công suất tiêu thụ điện (lạnh/sưởi)', value: '1.64 kW / 1.81 kW' },
      { label: 'COP (lạnh/sưởi)', value: '3.66 / 3.92 kW/kW' },
      { label: 'CSPF làm lạnh', value: '5.92 kWh/kWh' },
      { label: 'Lưu lượng gió dàn lạnh (Cao/Trung/Thấp)', value: '18.0/15.0/12.5 m³/phút' },
      { label: 'Độ ồn dàn lạnh (Cao/Trung/Thấp)', value: '35.0/33.0/31.0 dB(A)' },
      { label: 'Kích thước dàn lạnh (C×R×S)', value: '245 × 1000 × 800 mm' },
      { label: 'Trọng lượng dàn lạnh', value: '37 kg' },
      { label: 'Phạm vi vận hành (lạnh/sưởi)', value: '14-25°CWB / 15-27°CDB' },
      { label: 'Loại máy nén', value: 'Swing kín' },
      { label: 'Lượng gas nạp (R32, cho 30m)', value: '1.7 kg' },
      { label: 'Độ ồn dàn nóng (lạnh/sưởi)', value: '47/49 dB(A)' },
      { label: 'Kích thước dàn nóng (C×R×S)', value: '595 × 845 × 300 mm' },
      { label: 'Trọng lượng dàn nóng', value: '45 kg' },
      { label: 'Đường ống lỏng / gas (loe)', value: 'Ø9.5 mm / Ø15.9 mm' },
      { label: 'Chiều dài ống tối đa', value: '50m (quy đổi 70m)' },
      { label: 'Bảo hành', value: 'Máy 1 năm; máy nén 5 năm' },
      { label: 'Xuất xứ', value: 'Việt Nam/Thái Lan (chính hãng)' },
    ],
  },
  'FBA71BVMA9_RZA71DV1': {
    description: 'Điều hòa âm trần nối ống gió Daikin FBA71BVMA9/RZA71DV1, loại 2 chiều, công nghệ Inverter, công suất 24.000 BTU/h. Inverter điều chỉnh công suất linh hoạt theo tải bên ngoài giúp giảm hao phí điện năng; dàn lạnh cao chỉ 245mm; khay nước ngưng phủ ion bạc chống vi khuẩn, nấm mốc, dầu mỡ gây tắc ống và mùi hôi; cửa sổ kiểm tra khay nước ngưng giúp theo dõi bụi bẩn không cần dụng cụ chuyên dụng.',
    specs: [
      { label: 'Nguồn điện', value: '1 pha, 220V, 50Hz' },
      { label: 'Công suất lạnh (danh định, Min-Max)', value: '7.1 kW (3.2-8.0) · 24.200 BTU/h (10.900-27.300)' },
      { label: 'Công suất sưởi (danh định, Min-Max)', value: '7.1 kW (3.2-8.0) · 24.200 BTU/h (10.900-27.300)' },
      { label: 'Công suất tiêu thụ điện (lạnh/sưởi)', value: '2.22 kW / 2.0 kW' },
      { label: 'COP (lạnh/sưởi)', value: '3.2 / 3.2 W/W' },
      { label: 'CSPF', value: '5.69 kWh/kWh' },
      { label: 'Lưu lượng gió dàn lạnh (Cao/Trung/Thấp)', value: '23.0/19.5/16.0 m³/phút' },
      { label: 'Độ ồn dàn lạnh (Cao/Trung/Thấp)', value: '38.0/35.0/33.0 dB(A)' },
      { label: 'Kích thước dàn lạnh (C×R×S)', value: '245 × 1000 × 800 mm' },
      { label: 'Trọng lượng dàn lạnh', value: '37 kg' },
      { label: 'Phạm vi vận hành (lạnh/sưởi)', value: '14-25°CWB / 15-27°CDB' },
      { label: 'Kích thước dàn nóng (C×R×S)', value: '990 × 940 × 320 mm' },
      { label: 'Trọng lượng dàn nóng', value: '73 kg' },
      { label: 'Loại máy nén', value: 'Swing kín' },
      { label: 'Lượng gas nạp (R32)', value: '2.6 kg (nạp sẵn cho 30m)' },
      { label: 'Độ ồn dàn nóng (lạnh/sưởi)', value: '48/50 dB(A)' },
      { label: 'Đường ống lỏng / gas (loe)', value: 'Ø9.5 mm / Ø15.9 mm' },
      { label: 'Chiều dài ống tối đa', value: '50m (quy đổi 70m)' },
      { label: 'Bảo hành', value: 'Máy 1 năm; máy nén 5 năm' },
      { label: 'Xuất xứ', value: 'Thái Lan' },
    ],
  },
  'FTF35XAV1V_RF35XAV1V': {
    description: 'Điều hòa Daikin FTF35XAV1V/RF35XAV1V, loại 1 chiều 12.000BTU, đời model 2023 sản xuất tại nhà máy Daikin Việt Nam. Thiết kế Flat Coanda tinh tế, chế độ làm lạnh nhanh Powerful chỉ 1 chạm, màng lọc Apatite Titan kháng khuẩn khử mùi (tuổi thọ 3 năm). Vận hành êm với 5 cấp quạt gió, độ ồn thấp nhất 25dB(A) ở chế độ im lặng, chế độ Sleep tự động điều chỉnh nhiệt độ theo giấc ngủ tự nhiên. Dùng gas R32, đạt CSPF 3.71 (3 sao) giúp tiết kiệm điện tới 20%.',
    specs: [
      { label: 'Công suất', value: '1.5HP · 3.26 kW / 11.100 BTU/h' },
      { label: 'Nguồn điện', value: '1 pha, 220V, 50Hz' },
      { label: 'Dòng điện vận hành', value: '4.3 A' },
      { label: 'Công suất tiêu thụ điện', value: '933 W' },
      { label: 'CSPF', value: '3.71' },
      { label: 'Lưu lượng gió dàn lạnh (Cao/Trung/Thấp)', value: '11.4/8.3/7.3 m³/phút' },
      { label: 'Độ ồn dàn lạnh (Cao/Trung/Thấp)', value: '39/33/30 dB(A)' },
      { label: 'Kích thước dàn lạnh (C×R×S)', value: '283 × 770 × 242 mm' },
      { label: 'Trọng lượng dàn lạnh', value: '9 kg' },
      { label: 'Độ ồn dàn nóng', value: '51 dB(A)' },
      { label: 'Kích thước dàn nóng (C×R×S)', value: '550 × 658 × 275 mm' },
      { label: 'Trọng lượng dàn nóng', value: '30 kg' },
      { label: 'Loại máy nén', value: 'Rotary kín' },
      { label: 'Môi chất lạnh', value: 'R-32, 0.71 kg' },
      { label: 'Phạm vi nhiệt độ vận hành', value: '19.4°C đến 46°C' },
      { label: 'Đường ống lỏng / gas', value: 'Ø6.4mm / Ø12.7mm' },
      { label: 'Chiều dài ống tối đa', value: '20m' },
    ],
  },
  'FTF50XV1V_RF50XV1V': {
    description: 'Điều hòa Daikin FTF50XV1V/RF50XV1V, loại 1 chiều 18.000BTU/H, ra mắt tháng 8/2022 thay thế model FTC50NV1V. Làm lạnh nhanh chóng, đạt lưu lượng gió tối đa trong vòng 20 phút; vận hành cực êm chỉ 28dB(A) ở dàn lạnh. Màng lọc Apatit Titan vô hiệu hóa vi khuẩn và virus; dàn nóng phủ lớp sơn acrylic và màng chống gỉ chống ăn mòn; dùng gas R32 hiệu suất cao. Phù hợp phòng dưới 30m². Sản xuất tại Thái Lan.',
    specs: [
      { label: 'Công suất', value: '2HP · 5.02 kW / 17.100 BTU/h' },
      { label: 'Nguồn điện', value: '1 pha, 220V, 50Hz' },
      { label: 'Dòng điện vận hành', value: '7.9 A' },
      { label: 'Công suất tiêu thụ điện', value: '1.630 W' },
      { label: 'CSPF', value: '3.27' },
      { label: 'Lưu lượng gió dàn lạnh (Cao/Trung/Thấp)', value: '18.1/15/11 m³/phút' },
      { label: 'Độ ồn dàn lạnh (Cao/Trung/Thấp)', value: '45/40/35 dB(A)' },
      { label: 'Kích thước dàn lạnh (C×R×S)', value: '295 × 990 × 263 mm' },
      { label: 'Trọng lượng dàn lạnh', value: '13 kg' },
      { label: 'Loại máy nén', value: 'Rotary dạng kín' },
      { label: 'Môi chất lạnh', value: 'R-32, 0.73 kg' },
      { label: 'Độ ồn dàn nóng', value: '52 dB(A)' },
      { label: 'Kích thước dàn nóng (C×R×S)', value: '595 × 845 × 300 mm' },
      { label: 'Trọng lượng dàn nóng', value: '37 kg' },
      { label: 'Phạm vi vận hành', value: '19.4 đến 46°CDB' },
      { label: 'Đường ống lỏng / gas', value: 'Ø6.4mm / Ø15.9mm' },
      { label: 'Chiều dài ống tối đa', value: '20m' },
    ],
  },
  'FTF25XAV1V_RF25XAV1V': {
    description: 'Điều hòa Daikin FTF25XAV1V/RF25XAV1V, loại 1 chiều 9.000BTU, ra mắt 2023, sản xuất tại nhà máy Daikin Việt Nam, thiết kế Flat Coanda tinh tế, phù hợp phòng dưới 15m² (phòng ngủ, phòng làm việc). Chế độ làm lạnh nhanh Powerful 1 chạm; màng lọc Apatit Titan kháng khuẩn/kháng virus; vận hành êm với 5 cấp quạt, độ ồn thấp nhất 25dB(A); chế độ Sleep tự điều chỉnh nhiệt độ dần dần; gas R32 thế hệ mới; đạt CSPF 3.62 giúp giảm khoảng 20% chi phí điện.',
    specs: [
      { label: 'Công suất', value: '1HP · 2.72 kW / 9.300 BTU/h' },
      { label: 'Nguồn điện', value: '1 pha, 220V, 50Hz' },
      { label: 'Dòng điện vận hành', value: '3.8 A' },
      { label: 'Công suất tiêu thụ điện', value: '798 W' },
      { label: 'CSPF', value: '3.62' },
      { label: 'Lưu lượng gió dàn lạnh (Cao/Trung/Thấp)', value: '10.2/8.3/5.9 m³/phút' },
      { label: 'Độ ồn dàn lạnh (Cao/Trung/Thấp)', value: '38/33/26 dB(A)' },
      { label: 'Kích thước dàn lạnh (C×R×S)', value: '283 × 770 × 242 mm' },
      { label: 'Trọng lượng dàn lạnh', value: '9 kg' },
      { label: 'Loại máy nén', value: 'Rotary kín' },
      { label: 'Môi chất lạnh', value: 'R-32, 0.65 kg' },
      { label: 'Độ ồn dàn nóng', value: '50 dB(A)' },
      { label: 'Kích thước dàn nóng (C×R×S)', value: '418 × 695 × 244 mm' },
      { label: 'Trọng lượng dàn nóng', value: '26 kg' },
      { label: 'Phạm vi nhiệt độ vận hành', value: '19.4°C đến 46°C' },
      { label: 'Đường ống lỏng / gas', value: 'Ø6.4mm / Ø9.5mm' },
      { label: 'Chiều dài ống tối đa', value: '15m' },
    ],
  },
  'FTKB35XVMV_RKB35XVMV': {
    description: 'Điều hòa Daikin 1 chiều Inverter 12.000BTU/H FTKB35XVMV/RKB35XVMV (đời 2023). Công nghệ luồng gió Coanda đi dọc trần nhà phân bổ đều khắp phòng; chế độ Powerful đạt nhiệt độ cài đặt trong 20 phút; màng lọc kép Enzyme Blue và PM2.5 loại bỏ mùi, vi khuẩn, bụi mịn; chức năng chống nấm mốc tự sấy khô dàn lạnh sau vận hành; vận hành êm 23dB(A); chịu điện áp đến 440V. Phù hợp phòng dưới 20m².',
    specs: [
      { label: 'Công suất danh định (Min-Max)', value: '1.5HP · 3.6 kW (1.2-3.8) · 12.300 BTU/h (4.100-13.000)' },
      { label: 'Nguồn điện', value: '1 pha, 220-240V/50Hz, 220-230V/60Hz' },
      { label: 'Công suất tiêu thụ điện (Min-Max)', value: '1.260 / 370 W' },
      { label: 'CSPF', value: '5.56' },
      { label: 'Lưu lượng gió dàn lạnh (Cao/Trung/Thấp/Im lặng)', value: '10.7/8.8/7.1/5.5 m³/phút' },
      { label: 'Độ ồn dàn lạnh (Cao/Trung/Thấp/Im lặng)', value: '37/33/28/20 dB(A)' },
      { label: 'Kích thước dàn lạnh (C×R×S)', value: '285 × 770 × 242 mm' },
      { label: 'Trọng lượng dàn lạnh', value: '8 kg' },
      { label: 'Loại máy nén', value: 'Swing kín' },
      { label: 'Môi chất lạnh', value: 'R-32, 0.49 kg' },
      { label: 'Độ ồn dàn nóng', value: '47/44 dB(A)' },
      { label: 'Kích thước dàn nóng (C×R×S)', value: '550 × 675 × 284 mm' },
      { label: 'Trọng lượng dàn nóng', value: '22 kg' },
      { label: 'Phạm vi nhiệt độ vận hành', value: '19.4-46°CDB' },
      { label: 'Đường ống lỏng / gas', value: 'Ø6.4mm / Ø9.5mm' },
      { label: 'Chiều dài ống tối đa', value: '15m' },
      { label: 'Bảo hành', value: 'Máy 1 năm, máy nén 5 năm' },
    ],
  },
  'FTKB50XVMV_RKB50XVMV': {
    description: 'Điều hòa Daikin 1 chiều Inverter 18.000BTU/H FTKB50XVMV/RKB50XVMV, đời 2023. Chế độ Powerful tăng tốc độ quạt và tần số máy nén lên tối đa để đạt nhiệt độ nhanh chóng; màng lọc Enzyme Blue diệt 99.9% vi khuẩn và giảm 90% mùi hôi trong 1 giờ; công nghệ luồng gió Coanda hướng lên trần phân bổ đều khắp phòng; chịu điện áp ổn định đến 440V; vận hành êm 23dB(A).',
    specs: [
      { label: 'Công suất danh định (Min-Max)', value: '2HP · 5.3 kW (1.6-5.4) · 18.100 BTU/h (5.500-18.400)' },
      { label: 'Nguồn điện', value: '1 pha, 220-240V/50Hz, 220-230V/60Hz' },
      { label: 'Công suất tiêu thụ điện (Min-Max)', value: '1.920 / 620 W' },
      { label: 'CSPF', value: '4.77' },
      { label: 'Lưu lượng gió dàn lạnh (Cao/Trung/Thấp/Im lặng)', value: '12.9/10.6/8.6/6.5 m³/phút' },
      { label: 'Độ ồn dàn lạnh (Cao/Trung/Thấp/Im lặng)', value: '44/40/35/25 dB(A)' },
      { label: 'Kích thước dàn lạnh (C×R×S)', value: '285 × 770 × 242 mm' },
      { label: 'Trọng lượng dàn lạnh', value: '8 kg' },
      { label: 'Loại máy nén', value: 'Swing kín' },
      { label: 'Môi chất lạnh', value: 'R-32, 0.78 kg' },
      { label: 'Độ ồn dàn nóng', value: '50/47 dB(A)' },
      { label: 'Kích thước dàn nóng (C×R×S)', value: '550 × 675 × 284 mm' },
      { label: 'Trọng lượng dàn nóng', value: '26 kg' },
      { label: 'Phạm vi nhiệt độ vận hành', value: '19.4-46°C' },
      { label: 'Đường ống lỏng / gas', value: 'Ø6.4mm / Ø12.7mm' },
      { label: 'Chiều dài ống tối đa', value: '30m' },
    ],
  },
  'FTKB25XVMV_RKB25XVMV': {
    description: 'Điều hòa Daikin 1 chiều Inverter 9.000BTU (đời tháng 3/2023), phù hợp phòng dưới 15m². Công nghệ luồng gió Coanda đi dọc trần nhà phân bổ đều khắp phòng; chế độ Powerful đạt lưu lượng gió tối đa trong 20 phút. Màng lọc kép Enzyme Blue và PM2.5 loại bỏ mùi và vi khuẩn; chức năng chống nấm mốc tự động chạy quạt 1 giờ sau khi làm lạnh/hút ẩm. Độ ồn thấp nhất 19dB(A); CSPF 5.21.',
    specs: [
      { label: 'Công suất danh định (Min-Max)', value: '1HP · 2.7 kW (1.0-2.9) · 9.200 BTU/h (3.400-9.900)' },
      { label: 'Nguồn điện', value: '1 pha, 220-240V/50Hz, 220-230V/60Hz' },
      { label: 'Công suất tiêu thụ điện (Min-Max)', value: '995 / 286 W' },
      { label: 'CSPF', value: '5.21' },
      { label: 'Lưu lượng gió dàn lạnh (Cao/Trung/Thấp/Im lặng)', value: '9.9/8.4/7.1/4.6 m³/phút' },
      { label: 'Độ ồn dàn lạnh (Cao/Trung/Thấp/Im lặng)', value: '36/32/27/19 dB(A)' },
      { label: 'Kích thước dàn lạnh (C×R×S)', value: '285 × 770 × 242 mm' },
      { label: 'Trọng lượng dàn lạnh', value: '8 kg' },
      { label: 'Loại máy nén', value: 'Swing kín' },
      { label: 'Môi chất lạnh', value: 'R-32, 0.41 kg' },
      { label: 'Độ ồn dàn nóng', value: '47/44 dB(A)' },
      { label: 'Kích thước dàn nóng (C×R×S)', value: '418 × 695 × 244 mm' },
      { label: 'Trọng lượng dàn nóng', value: '19 kg' },
      { label: 'Đường ống lỏng / gas', value: 'Ø6.4mm / Ø9.5mm' },
      { label: 'Chiều dài ống tối đa', value: '15m' },
      { label: 'Bảo hành', value: 'Máy 1 năm, máy nén 5 năm' },
    ],
  },
  'FTHF35VAVMV_RHF35VAVMV': {
    description: 'Điều hòa Daikin 2 chiều 12.000BTU/H FTHF35VAVMV/RHF35VAVMV, công nghệ Inverter tiết kiệm điện, vận hành êm ái, phù hợp phòng dưới 20m². Luồng gió Coanda hướng dọc trần, tránh gió lạnh thổi trực tiếp vào người; màng lọc Enzyme Blue khử mùi và dị nguyên tới 99.9%; màng lọc bụi mịn loại bỏ bụi, vi khuẩn, phấn hoa, lông thú; chế độ Sleep phù hợp gia đình có trẻ nhỏ.',
    specs: [
      { label: 'Công suất lạnh (danh định, Min-Max)', value: '3.5 kW (1.2-3.8) · 11.900 BTU/h (4.100-13.000)' },
      { label: 'Công suất sưởi (danh định, Min-Max)', value: '3.5 kW (1.2-3.8) · 11.900 BTU/h (4.100-13.000)' },
      { label: 'Nguồn điện', value: '1 pha, 220-240V/50Hz, 220-230V/60Hz' },
      { label: 'Công suất tiêu thụ điện (Min-Max)', value: '980 W (160-1.070)' },
      { label: 'CSPF', value: '5.50' },
      { label: 'Lưu lượng gió dàn lạnh (Cao, lạnh/sưởi)', value: '11.5 / 12.1 m³/phút' },
      { label: 'Độ ồn dàn lạnh - lạnh (Cao/Trung/Thấp/Im lặng)', value: '41/36/30/26 dB(A)' },
      { label: 'Độ ồn dàn lạnh - sưởi (Cao/Trung/Thấp/Im lặng)', value: '41/36/31/28 dB(A)' },
      { label: 'Kích thước dàn lạnh (C×R×S)', value: '285 × 770 × 242 mm' },
      { label: 'Trọng lượng dàn lạnh', value: '9 kg' },
      { label: 'Loại máy nén', value: 'Swing kín' },
      { label: 'Môi chất lạnh', value: 'R-32, 0.70 kg' },
      { label: 'Độ ồn dàn nóng (lạnh/sưởi, Cao)', value: '48/48 dB(A)' },
      { label: 'Kích thước dàn nóng (C×R×S)', value: '550 × 675 × 284 mm' },
      { label: 'Trọng lượng dàn nóng', value: '26 kg' },
      { label: 'Phạm vi vận hành (lạnh/sưởi)', value: '10-46°CDB / 1-18°CDB' },
      { label: 'Đường ống lỏng / gas', value: 'Ø6.4mm / Ø9.5mm' },
      { label: 'Chiều dài ống tối đa', value: '15m' },
    ],
  },
  'FTHF50VVMV_RHF50VVMV': {
    description: 'Điều hòa Daikin 2 chiều 18.000BTU/H FTHF50VVMV/RHF50VVMV - mát lạnh mùa hè, ấm áp mùa đông. Máy nén Inverter tiết kiệm điện tới 50%, vận hành êm; công nghệ Coanda hướng luồng gió dọc trần phân bổ êm ái; màng lọc Enzyme Blue loại bỏ mùi, nấm mốc, dị nguyên tới 99.9%; lớp phủ kép (acrylic + chống thấm nước) chống ăn mòn, mưa axit, gỉ sét. Phù hợp phòng dưới 30m².',
    specs: [
      { label: 'Công suất danh định (lạnh)', value: '5.0 kW / 17.100 BTU/h' },
      { label: 'Công suất Min-Max', value: '1.6–6.0 kW · 5.500–20.500 BTU/h' },
      { label: 'Nguồn điện', value: '1 pha, 220–240V/50Hz, 220–230V/60Hz' },
      { label: 'Công suất tiêu thụ điện (Min-Max)', value: '1.315 W (350–1.740)' },
      { label: 'CSPF', value: '6.30' },
      { label: 'Lưu lượng gió dàn lạnh (Cao, lạnh/sưởi)', value: '17.1 / 18.0 m³/phút' },
      { label: 'Độ ồn dàn lạnh - lạnh', value: '44/40/35/28 dB(A)' },
      { label: 'Độ ồn dàn lạnh - sưởi', value: '44/40/35/32 dB(A)' },
      { label: 'Kích thước dàn lạnh (C×R×S)', value: '295 × 990 × 281 mm' },
      { label: 'Trọng lượng dàn lạnh', value: '13 kg' },
      { label: 'Loại máy nén', value: 'Swing kín' },
      { label: 'Môi chất lạnh', value: 'R-32, 1.0 kg' },
      { label: 'Độ ồn dàn nóng (lạnh/sưởi)', value: '47/48 dB(A)' },
      { label: 'Kích thước dàn nóng (C×R×S)', value: '595 × 845 × 300 mm' },
      { label: 'Trọng lượng dàn nóng', value: '36 kg' },
      { label: 'Phạm vi vận hành (lạnh/sưởi)', value: '10–46°CDB / 1–18°CDB' },
      { label: 'Đường ống lỏng / gas', value: 'Ø6.4mm / Ø12.7mm' },
      { label: 'Chiều dài ống tối đa', value: '30m' },
      { label: 'Bảo hành', value: 'Máy 1 năm, máy nén 5 năm' },
    ],
  },
  'FTHF25VAVMV_RHF25VAVMV': {
    description: 'Điều hòa Daikin 2 chiều 9.000BTU/H FTHF25VAVMV/RHF25VAVMV, phù hợp phòng dưới 15m². Công nghệ Inverter giảm khoảng 50% điện năng tiêu thụ; luồng gió Coanda hướng dọc trần phân bổ êm ái; màng lọc Enzyme Blue khử mùi và dị nguyên tới 99.9%; chế độ Sleep phù hợp gia đình có trẻ nhỏ; màng lọc bụi mịn bảo vệ hô hấp.',
    specs: [
      { label: 'Công suất lạnh danh định (Min-Max)', value: '2.5 kW (1.0-3.4) · 8.500 BTU/h (3.400-11.600)' },
      { label: 'Công suất sưởi danh định (Min-Max)', value: '2.5 kW (1.0-3.4) · 8.500 BTU/h (3.400-11.600)' },
      { label: 'Nguồn điện', value: '1 pha, 220-240V/50Hz, 220-230V/60Hz' },
      { label: 'Công suất tiêu thụ điện (lạnh/sưởi, Min-Max)', value: '555 W (160-950) / 555 W (160-980)' },
      { label: 'CSPF', value: '6.30' },
      { label: 'Lưu lượng gió dàn lạnh (Cao, lạnh/sưởi)', value: '9.9 / 10.4 m³/phút' },
      { label: 'Độ ồn dàn lạnh - lạnh (Cao/Trung/Thấp/Im lặng)', value: '40/35/29/25 dB(A)' },
      { label: 'Độ ồn dàn lạnh - sưởi (Cao/Trung/Thấp/Im lặng)', value: '40/35/30/27 dB(A)' },
      { label: 'Kích thước dàn lạnh (C×R×S)', value: '285 × 770 × 242 mm' },
      { label: 'Trọng lượng dàn lạnh', value: '9 kg' },
      { label: 'Loại máy nén', value: 'Swing kín' },
      { label: 'Môi chất lạnh', value: 'R-32, 0.70 kg' },
      { label: 'Độ ồn dàn nóng (lạnh/sưởi)', value: '48/48 dB(A)' },
      { label: 'Kích thước dàn nóng (C×R×S)', value: '550 × 675 × 284 mm' },
      { label: 'Trọng lượng dàn nóng', value: '26 kg' },
      { label: 'Phạm vi vận hành (lạnh/sưởi)', value: '10-46°CDB / 1-18°CDB' },
      { label: 'Đường ống lỏng / gas', value: 'Ø6.4mm / Ø9.5mm' },
      { label: 'Chiều dài ống tối đa', value: '15m' },
      { label: 'Bảo hành', value: 'Máy 1 năm, máy nén 5 năm' },
    ],
  },
  'FCF100CVM_RZF100CVM': {
    description: 'Điều hòa âm trần cassette Daikin FCF100CVM/RZF100CVM, công suất lạnh 34.000 BTU/h, loại 1 chiều, công nghệ Inverter tiết kiệm điện. Luồng gió đa hướng 360° với 23 kiểu gió, phù hợp không gian dưới 50m² (showroom, phòng họp). Dùng gas R32, công nghệ 2 cảm biến điều khiển gió độc lập, màng lọc kháng khuẩn, bảo vệ khi điện áp thấp. Hàng chính hãng Thái Lan, bảo hành máy 1 năm/máy nén 4 năm.',
    specs: [
      { label: 'Công suất lạnh (Min-Max)', value: '10.0 kW (5.0-11.2) · 34.100 BTU/h (17.100-38.200)' },
      { label: 'Nguồn điện', value: '1 pha, 220V-240V/50Hz, 220-230V/60Hz' },
      { label: 'Công suất tiêu thụ điện (làm lạnh)', value: '2.97 kW' },
      { label: 'COP', value: '3.37 W/W' },
      { label: 'CSPF', value: '5.50 Wh/Wh' },
      { label: 'Lưu lượng gió dàn lạnh (5 cấp)', value: '34.5/31.0/27.5/24.0/20.0 m³/phút' },
      { label: 'Độ ồn dàn lạnh (5 cấp)', value: '45.0/41.5/38.0/35.0/32.5 dB(A)' },
      { label: 'Kích thước dàn lạnh (C×R×S)', value: '298 × 840 × 840 mm' },
      { label: 'Trọng lượng dàn lạnh', value: '24 kg' },
      { label: 'Phạm vi vận hành dàn lạnh', value: '14-25°CWB' },
      { label: 'Kích thước dàn nóng (C×R×S)', value: '695 × 930 × 350 mm' },
      { label: 'Trọng lượng dàn nóng', value: '48 kg' },
      { label: 'Loại máy nén', value: 'Swing rotary kín' },
      { label: 'Độ ồn dàn nóng (làm lạnh/ban đêm)', value: '49/45 dB(A)' },
      { label: 'Lượng gas nạp (R32)', value: '1.3 kg (cho 30m)' },
      { label: 'Đường ống lỏng / gas (loe)', value: 'Ø9.5 mm / Ø15.9 mm' },
      { label: 'Bảo hành', value: 'Máy 1 năm, máy nén 4 năm' },
      { label: 'Xuất xứ', value: 'Thái Lan' },
    ],
  },
  'FCF100CVM_RZF100CYM': {
    description: 'Điều hòa âm trần cassette Daikin FCF100CVM/RZF100CYM, công suất lạnh 34.000 BTU (4HP), công nghệ Inverter, dùng gas R32, vận hành nguồn điện 3 pha. Phù hợp không gian dưới 50m², luồng gió đa hướng 360° với 23 kiểu gió. Màng lọc kháng khuẩn, chống nấm mốc; bảo vệ tự động khi điện áp thấp. Hàng chính hãng sản xuất tại Thái Lan, bảo hành máy 1 năm/máy nén 4 năm.',
    specs: [
      { label: 'Nguồn điện', value: '3 pha, 380-415V/50Hz, 380V/60Hz' },
      { label: 'Công suất lạnh (Min-Max)', value: '10.0 kW (5.0-11.2) · 34.100 BTU/h (17.100-38.200)' },
      { label: 'Công suất tiêu thụ điện', value: '2.97 kW' },
      { label: 'COP', value: '3.37 kW/kW' },
      { label: 'CSPF', value: '5.50 kWh/kWh' },
      { label: 'Lưu lượng gió dàn lạnh (5 cấp)', value: '34.5/31.0/27.5/24.0/20.0 m³/phút' },
      { label: 'Độ ồn dàn lạnh (5 cấp)', value: '45.0/41.5/38.0/35.0/32.5 dB(A)' },
      { label: 'Kích thước dàn lạnh / mặt nạ (C×R×S)', value: '298×840×840 mm / 50×950×950 mm' },
      { label: 'Trọng lượng dàn lạnh / mặt nạ', value: '24 kg / 5.5 kg' },
      { label: 'Kích thước dàn nóng (C×R×S)', value: '695 × 930 × 350 mm' },
      { label: 'Trọng lượng dàn nóng', value: '48 kg' },
      { label: 'Loại máy nén', value: 'Swing rotary, kín' },
      { label: 'Lượng gas nạp (R32)', value: '1.3 kg (cho đường ống 30m)' },
      { label: 'Độ ồn dàn nóng (làm lạnh/ban đêm)', value: '49/45 dB(A)' },
      { label: 'Đường ống lỏng / gas (loe)', value: 'Ø9.5 mm / Ø15.9 mm' },
      { label: 'Bảo hành', value: 'Máy 1 năm, máy nén 4 năm' },
      { label: 'Xuất xứ', value: 'Thái Lan' },
    ],
  },
  'FCF125CVM_RZF125CVM': {
    description: 'Điều hòa âm trần cassette Daikin FCF125CVM/RZF125CVM, công suất lạnh 42.000 BTU/H (5HP), loại 1 chiều, công nghệ Inverter dùng gas R32, phù hợp không gian dưới 60m². Luồng gió đa hướng 360° với 23 kiểu gió; giúp giảm khoảng 50% điện năng tiêu thụ hàng năm so với máy thường; màng lọc kháng khuẩn, chống nấm mốc. Hàng chính hãng Thái Lan, bảo hành máy 1 năm/máy nén 4 năm.',
    specs: [
      { label: 'Công suất lạnh (danh định, Min-Max)', value: '12.5 kW (5.7-14.0) · 42.700 BTU/h (19.500-47.800)' },
      { label: 'Nguồn điện', value: '1 pha, 220V-240V/50Hz, 220-230V/60Hz' },
      { label: 'Công suất tiêu thụ điện (làm lạnh)', value: '4.18 kW' },
      { label: 'COP', value: '2.99 W/W' },
      { label: 'CSPF', value: '5.15 Wh/Wh' },
      { label: 'Lưu lượng gió dàn lạnh (5 cấp)', value: '36.5/33.0/29.0/25.0/21.0 m³/phút' },
      { label: 'Độ ồn dàn lạnh (5 cấp)', value: '46.0/43.0/40.0/36.0/32.5 dB(A)' },
      { label: 'Kích thước dàn lạnh (C×R×S)', value: '298 × 840 × 840 mm' },
      { label: 'Trọng lượng dàn lạnh', value: '24 kg' },
      { label: 'Kích thước dàn nóng (C×R×S)', value: '990 × 940 × 320 mm' },
      { label: 'Trọng lượng dàn nóng', value: '64 kg' },
      { label: 'Loại máy nén', value: 'Swing rotary kín' },
      { label: 'Độ ồn dàn nóng (làm lạnh/ban đêm)', value: '52/45 dB(A)' },
      { label: 'Lượng gas nạp (R32)', value: '1.9 kg (nạp sẵn cho 30m)' },
      { label: 'Đường ống lỏng / gas (loe)', value: 'Ø9.5 mm / Ø15.9 mm' },
      { label: 'Bảo hành', value: 'Máy 1 năm, máy nén 4 năm' },
      { label: 'Xuất xứ', value: 'Thái Lan' },
    ],
  },
  'FCF140CVM_RZF140CVM': {
    description: 'Điều hòa âm trần cassette Daikin FCF140CVM/RZF140CVM, công suất lạnh 47.800 BTU/h, loại 1 chiều, công nghệ Inverter giúp giảm khoảng 50% điện năng tiêu thụ hàng năm so với máy thường, dùng gas R32. Luồng gió đa hướng 360° phân bố đồng đều khắp không gian với 23 kiểu gió; dàn trao đổi nhiệt microchannel bằng nhôm chống ăn mòn. Phù hợp không gian dưới 70m² (văn phòng, cửa hàng, phòng họp). Bảo hành máy 1 năm/máy nén 4 năm.',
    specs: [
      { label: 'Công suất lạnh (danh định, Min-Max)', value: '14.0 kW (6.2-15.5) · 47.800 BTU/h (21.200-52.900)' },
      { label: 'Nguồn điện', value: '1 pha, 220V-240V/50Hz, 220-230V/60Hz' },
      { label: 'Công suất tiêu thụ điện (làm lạnh)', value: '5.47 kW' },
      { label: 'COP', value: '2.56 W/W' },
      { label: 'CSPF', value: '5.00 Wh/Wh' },
      { label: 'Lưu lượng gió dàn lạnh (5 cấp)', value: '36.5/33.0/29.0/25.0/21.0 m³/phút' },
      { label: 'Độ ồn dàn lạnh (5 cấp)', value: '46.0/43.0/40.0/36.0/32.5 dB(A)' },
      { label: 'Kích thước dàn lạnh (C×R×S)', value: '298 × 840 × 840 mm' },
      { label: 'Trọng lượng dàn lạnh', value: '24 kg' },
      { label: 'Kích thước dàn nóng (C×R×S)', value: '990 × 940 × 320 mm' },
      { label: 'Trọng lượng dàn nóng', value: '64 kg' },
      { label: 'Loại dàn trao đổi nhiệt', value: 'Microchannel' },
      { label: 'Loại máy nén', value: 'Swing, kín' },
      { label: 'Độ ồn dàn nóng (làm lạnh/ban đêm)', value: '54/45 dB(A)' },
      { label: 'Lượng gas nạp (R32)', value: '1.9 kg (cho 30m)' },
      { label: 'Đường ống lỏng / gas (loe)', value: 'Ø9.5 mm / Ø15.9 mm' },
      { label: 'Bảo hành', value: 'Máy 1 năm, máy nén 4 năm' },
    ],
  },
  'FCF50CVM_RZF50CV2V': {
    description: 'Điều hòa âm trần cassette Daikin FCF50CVM/RZF50CV2V, công suất lạnh 17.100 BTU/h, phù hợp không gian đến 30m². Luồng gió đa hướng, công nghệ Inverter tiết kiệm khoảng 50% điện năng so với máy không Inverter; công nghệ 2 cảm biến điều khiển hướng gió độc lập; màng lọc kháng khuẩn, khay nước ngưng phủ ion bạc. Vận hành êm với 5 cấp gió và điều chỉnh luồng gió tự động.',
    specs: [
      { label: 'Công suất lạnh (danh định, Min-Max)', value: '5.0 kW (3.2-6.5) · 17.100 BTU/h (10.900-19.100)' },
      { label: 'Nguồn điện', value: '1 pha, 220V, 50Hz' },
      { label: 'Công suất tiêu thụ điện (làm lạnh)', value: '1.14 kW' },
      { label: 'COP', value: '4.39 W/W' },
      { label: 'CSPF', value: '6.60 Wh/Wh' },
      { label: 'Lưu lượng gió dàn lạnh (5 cấp)', value: '23.0/21.0/18.5/16.0/13.5 m³/phút' },
      { label: 'Độ ồn dàn lạnh (5 cấp)', value: '37.0/34.5/32.0/29.5/27.5 dB(A)' },
      { label: 'Kích thước dàn lạnh (C×R×S)', value: '256 × 840 × 840 mm' },
      { label: 'Trọng lượng dàn lạnh', value: '22 kg' },
      { label: 'Loại máy nén', value: 'Swing kín' },
      { label: 'Lượng gas nạp (R32)', value: '1.2 kg (nạp sẵn cho 30m)' },
      { label: 'Độ ồn dàn nóng (làm lạnh/ban đêm)', value: '48/44 dB(A)' },
      { label: 'Kích thước dàn nóng (C×R×S)', value: '595 × 845 × 300 mm' },
      { label: 'Trọng lượng dàn nóng', value: '41 kg' },
      { label: 'Đường ống lỏng / gas (loe)', value: 'Ø9.5 mm / Ø15.9 mm' },
      { label: 'Chiều dài ống tối đa', value: '50m (quy đổi)' },
    ],
  },
  'FCF71CVM_RZF71CV2V': {
    description: 'Điều hòa âm trần cassette Daikin FCF71CVM/RZF71CV2V, loại 1 chiều 24.000BTU (2.5HP), 1 pha, gas R32, công nghệ Inverter. Luồng gió đa hướng với 23 kiểu gió, điều khiển hướng gió độc lập từng cửa gió; công nghệ 2 cảm biến tự động tối ưu luồng gió; màng lọc xử lý kháng khuẩn, chống mốc; bảo vệ tự động ngắt khi điện áp thấp. Phù hợp không gian dưới 40m². Hàng chính hãng Thái Lan, bảo hành máy 1 năm/máy nén 4 năm.',
    specs: [
      { label: 'Công suất lạnh danh định', value: '7.1 kW / 24.200 BTU/h' },
      { label: 'Nguồn điện', value: '1 pha, 220V, 50Hz' },
      { label: 'Công suất tiêu thụ điện (làm lạnh)', value: '1.93 kW' },
      { label: 'COP', value: '3.68 W/W' },
      { label: 'CSPF', value: '6.17 Wh/Wh' },
      { label: 'Lưu lượng gió dàn lạnh (5 cấp)', value: '23.0/21.0/18.5/16.0/13.5 m³/phút' },
      { label: 'Độ ồn dàn lạnh (5 cấp)', value: '37.0/34.5/32.0/29.5/27.5 dB(A)' },
      { label: 'Kích thước dàn lạnh (C×R×S)', value: '256 × 840 × 840 mm' },
      { label: 'Trọng lượng dàn lạnh', value: '22 kg' },
      { label: 'Loại máy nén', value: 'Swing dạng kín' },
      { label: 'Lượng gas nạp (R32)', value: '1.2 kg (cho 30m)' },
      { label: 'Độ ồn dàn nóng (làm lạnh/ban đêm)', value: '48/44 dB(A)' },
      { label: 'Kích thước dàn nóng (C×R×S)', value: '595 × 845 × 300 mm' },
      { label: 'Trọng lượng dàn nóng', value: '41 kg' },
      { label: 'Đường ống lỏng / gas (loe)', value: 'Ø9.5 mm / Ø15.9 mm' },
      { label: 'Chiều dài ống tối đa', value: '50m (quy đổi)' },
      { label: 'Bảo hành', value: 'Máy 1 năm, máy nén 4 năm' },
      { label: 'Xuất xứ', value: 'Thái Lan' },
    ],
  },
  };

  let daikinProducts = [
    {
      categories: ['cassette', 'inverter'], label: 'Cassette',
      name: 'Daikin Cassette 1 Chiều Inverter 20.500 BTU', model: 'FCF60CVM / RZF60CV2V',
      capacity: '20.500 BTU/h', price: '35.260.000 ₫', image: 'assets/products/cassette-fcf-series.webp',
      source: 'https://minhvietco.vn/product/dieu-hoa-am-tran-cassette-daikin-fcf60cvm-rzf60cv2v-20-500btu-loai-1-chieu-inverter/'
    },
    {
      categories: ['duct', 'inverter', 'two-way'], label: 'Nối Ống Gió',
      name: 'Daikin Nối Ống Gió 2 Chiều Inverter 18.000 BTU', model: 'FBA50BVMA9 / RZA50DV2V',
      capacity: '18.000 BTU/h', price: '29.550.000 ₫', image: 'assets/products/duct-fba50.webp',
      source: 'https://minhvietco.vn/product/dieu-hoa-am-tran-noi-ong-gio-daikin-fba50bvma9-rza50dv2v-17-100btu-h-2-chieu-inverter/'
    },
    {
      categories: ['duct', 'inverter', 'two-way'], label: 'Nối Ống Gió',
      name: 'Daikin Nối Ống Gió 2 Chiều Inverter 20.500 BTU', model: 'FBA60BVMA9 / RZA60DV2V',
      capacity: '20.500 BTU/h', price: '37.100.000 ₫', image: 'assets/products/duct-fba60.webp',
      source: 'https://minhvietco.vn/product/dieu-hoa-am-tran-noi-ong-gio-daikin-fba60bvma9-rza60dv2v-20-500btu-h-loai-2-chieu-inverter/'
    },
    {
      categories: ['duct', 'inverter', 'two-way'], label: 'Nối Ống Gió',
      name: 'Daikin Nối Ống Gió 2 Chiều Inverter 24.200 BTU', model: 'FBA71BVMA9 / RZA71DV1',
      capacity: '24.200 BTU/h', price: '38.380.000 ₫', image: 'assets/products/duct-fba71.webp',
      source: 'https://minhvietco.vn/product/dieu-hoa-am-tran-noi-ong-gio-daikin-fba71bvma9-rza71dv1-24-200btu-h-2-chieu-inverter/'
    },
    {
      categories: ['wall'], label: 'Treo Tường 1 Chiều',
      name: 'Daikin Treo Tường 1 Chiều 12.000 BTU', model: 'FTF35XAV1V / RF35XAV1V',
      capacity: '12.000 BTU/h', price: '9.700.000 ₫', image: 'assets/products/ftf35.webp',
      source: 'https://minhvietco.vn/product/dieu-hoa-daikin-1-chieu-12000btu-ftf35xav1v-rf35xav1v/'
    },
    {
      categories: ['wall'], label: 'Treo Tường 1 Chiều',
      name: 'Daikin Treo Tường 1 Chiều 18.000 BTU', model: 'FTF50XV1V / RF50XV1V',
      capacity: '18.000 BTU/h', price: '15.030.000 ₫', image: 'assets/products/ftf50.webp',
      source: 'https://minhvietco.vn/product/dieu-hoa-daikin-1-chieu-18000btu-ftf50xv1v-rf50xv1v/'
    },
    {
      categories: ['wall'], label: 'Treo Tường 1 Chiều',
      name: 'Daikin Treo Tường 1 Chiều 9.000 BTU', model: 'FTF25XAV1V / RF25XAV1V',
      capacity: '9.000 BTU/h', price: '7.630.000 ₫', image: 'assets/products/ftf25.webp',
      source: 'https://minhvietco.vn/product/dieu-hoa-daikin-1-chieu-9000btu-ftf25xav1v-rf25xav1v/'
    },
    {
      categories: ['wall', 'inverter'], label: 'Treo Tường Inverter',
      name: 'Daikin 1 Chiều Inverter 12.000 BTU', model: 'FTKB35XVMV / RKB35XVMV',
      capacity: '12.000 BTU/h', price: '11.100.000 ₫', image: 'assets/products/ftkb35.webp',
      source: 'https://minhvietco.vn/product/dieu-hoa-daikin-1-chieu-inverter-12000btu-ftkb35xvmv-rkb35xvmv/'
    },
    {
      categories: ['wall', 'inverter'], label: 'Treo Tường Inverter',
      name: 'Daikin 1 Chiều Inverter 18.000 BTU', model: 'FTKB50XVMV / RKB50XVMV',
      capacity: '18.000 BTU/h', price: '17.260.000 ₫', image: 'assets/products/ftkb50.webp',
      source: 'https://minhvietco.vn/product/dieu-hoa-daikin-1-chieu-inverter-18000btu-ftkb50xvmv-rkb50xvmv/'
    },
    {
      categories: ['wall', 'inverter'], label: 'Treo Tường Inverter',
      name: 'Daikin 1 Chiều Inverter 9.000 BTU', model: 'FTKB25XVMV / RKB25XVMV',
      capacity: '9.000 BTU/h', price: '9.130.000 ₫', image: 'assets/products/ftkb25.webp',
      source: 'https://minhvietco.vn/product/dieu-hoa-daikin-1-chieu-inverter-9000btu-ftkb25xvmv-rkb25xvmv/'
    },
    {
      categories: ['wall', 'inverter', 'two-way'], label: 'Treo Tường 2 Chiều',
      name: 'Daikin 2 Chiều Inverter 12.000 BTU', model: 'FTHF35VAVMV / RHF35VAVMV',
      capacity: '12.000 BTU/h', price: '13.870.000 ₫', image: 'assets/products/fthf35.webp',
      source: 'https://minhvietco.vn/product/dieu-hoa-daikin-2-chieu-12000btu-fthf35vavmv-rhf35vavmv/'
    },
    {
      categories: ['wall', 'inverter', 'two-way'], label: 'Treo Tường 2 Chiều',
      name: 'Daikin 2 Chiều Inverter 18.000 BTU', model: 'FTHF50VVMV / RHF50VVMV',
      capacity: '18.000 BTU/h', price: '20.820.000 ₫', image: 'assets/products/fthf50.webp',
      source: 'https://minhvietco.vn/product/dieu-hoa-daikin-2-chieu-18000btu-fthf50vvmv-rhf5vvmv/'
    },
    {
      categories: ['wall', 'inverter', 'two-way'], label: 'Treo Tường 2 Chiều',
      name: 'Daikin 2 Chiều Inverter 9.000 BTU', model: 'FTHF25VAVMV / RHF25VAVMV',
      capacity: '9.000 BTU/h', price: '11.270.000 ₫', image: 'assets/products/fthf25.webp',
      source: 'https://minhvietco.vn/product/dieu-hoa-daikin-2-chieu-9000btu-fthf25vavmv-rhf25vavmv/'
    },
    {
      categories: ['cassette', 'inverter'], label: 'Cassette',
      name: 'Daikin Cassette 1 Chiều Inverter 34.000 BTU', model: 'FCF100CVM / RZF100CVM',
      capacity: '34.000 BTU/h', price: '43.560.000 ₫', image: 'assets/products/cassette-fcf-series.webp',
      source: 'https://minhvietco.vn/product/dieu-hoa-daikin-am-tran-cassette-fcf100cvm-rzf100cvm-34-000btu-h-loai-1-chieu-inverter/'
    },
    {
      categories: ['cassette', 'inverter'], label: 'Cassette',
      name: 'Daikin Cassette 1 Chiều Inverter 34.000 BTU', model: 'FCF100CVM / RZF100CYM',
      capacity: '34.000 BTU/h', price: '45.950.000 ₫', image: 'assets/products/cassette-fcf-series.webp',
      source: 'https://minhvietco.vn/product/dieu-hoa-daikin-am-tran-cassette-fcf100cvm-rzf100cym-34-000btu-h-loai-1-chieu-inverter/'
    },
    {
      categories: ['cassette', 'inverter'], label: 'Cassette',
      name: 'Daikin Cassette 1 Chiều Inverter 42.000 BTU', model: 'FCF125CVM / RZF125CVM',
      capacity: '42.000 BTU/h', price: '47.450.000 ₫', image: 'assets/products/cassette-fcf-series.webp',
      source: 'https://minhvietco.vn/product/dieu-hoa-daikin-am-tran-cassette-fcf125cvm-rzf125cvm-42-000btu-h-loai-1-chieu-inverter/'
    },
    {
      categories: ['cassette', 'inverter'], label: 'Cassette',
      name: 'Daikin Cassette 1 Chiều Inverter 47.800 BTU', model: 'FCF140CVM / RZF140CVM',
      capacity: '47.800 BTU/h', price: '51.600.000 ₫', image: 'assets/products/cassette-fcf140.webp',
      source: 'https://minhvietco.vn/product/dieu-hoa-daikin-am-tran-cassette-fcf140cvm-rzf140cvm-47-800btu-h-loai-1-chieu-inverter/'
    },
    {
      categories: ['cassette', 'inverter'], label: 'Cassette',
      name: 'Daikin Cassette 1 Chiều Inverter 17.100 BTU', model: 'FCF50CVM / RZF50CV2V',
      capacity: '17.100 BTU/h', price: '28.300.000 ₫', image: 'assets/products/cassette-fcf50.webp',
      source: 'https://minhvietco.vn/product/dieu-hoa-daikin-am-tran-cassette-fcf50cvm-rzf50cv2v-17-100btu-loai-1-chieu-inverter/'
    },
    {
      categories: ['cassette', 'inverter'], label: 'Cassette',
      name: 'Daikin Cassette 1 Chiều Inverter 24.000 BTU', model: 'FCF71CVM / RZF71CV2V',
      capacity: '24.000 BTU/h', price: '36.750.000 ₫', image: 'assets/products/cassette-fcf71.webp',
      source: 'https://minhvietco.vn/product/dieu-hoa-daikin-am-tran-cassette-fcf71cvm-rzf71cv2v-24000btu-h-loai-1-chieu-inverter/'
    }
  ].map(product => {
    const key = product.model.replace(/\s*\/\s*/g, '_');
    const detail = localAcDetails[key];
    return detail ? { ...product, description: detail.description, specs: detail.specs } : product;
  });

  const productGrid = document.getElementById('productGrid');
  const productFilterButtons = document.querySelectorAll('.product-filter-btn');
  const showAllProductsBtn = document.getElementById('showAllProductsBtn');
  let activeProductFilter = 'all';
  let showAllProducts = false;

  function renderProducts() {
    if (!productGrid) return;

    const filteredProducts = activeProductFilter === 'all'
      ? daikinProducts
      : daikinProducts.filter(product => product.categories.includes(activeProductFilter));
    const visibleProducts = activeProductFilter === 'all' && !showAllProducts
      ? filteredProducts.slice(0, 8)
      : filteredProducts;

    productGrid.innerHTML = visibleProducts.map(product => {
      const originalIndex = daikinProducts.indexOf(product);
      return `
      <article class="product-card">
        <div class="product-image-wrap">
          <span class="product-type-badge">${product.label}</span>
          <img src="${product.image}" alt="${product.name} - ${product.model}" loading="lazy" decoding="async">
        </div>
        <div class="product-card-body">
          <div>
            <h3 class="product-name">${product.name}</h3>
            <div class="product-model">Model: <strong>${product.model}</strong></div>
            <div class="product-spec-row">
              <span>${product.capacity}</span>
              <span>Daikin chính hãng</span>
            </div>
          </div>
          <div class="product-price-block">
            <span>Giá tham khảo</span>
            <strong>${product.price}</strong>
          </div>
          <div class="vrv-card-actions">
            <button type="button" class="btn btn-outline-mv btn-sm" data-local-detail="${originalIndex}">Xem Chi Tiết & Thông Số</button>
            <a href="tel:0934506191" class="btn btn-primary btn-sm">Gọi Tư Vấn</a>
          </div>
        </div>
      </article>
    `;
    }).join('');

    if (showAllProductsBtn) {
      const canExpand = activeProductFilter === 'all' && !showAllProducts && filteredProducts.length > 8;
      showAllProductsBtn.hidden = !canExpand;
      if (activeProductFilter === 'all') {
        showAllProductsBtn.textContent = `Xem Toàn Bộ ${daikinProducts.length} Sản Phẩm`;
      }
    }
  }

  productFilterButtons.forEach(button => {
    button.addEventListener('click', () => {
      productFilterButtons.forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      activeProductFilter = button.getAttribute('data-product-filter') || 'all';
      showAllProducts = activeProductFilter !== 'all';
      renderProducts();
    });
  });

  showAllProductsBtn?.addEventListener('click', () => {
    showAllProducts = true;
    renderProducts();
  });

  renderProducts();

  // 4b. Cập nhật model/giá Điều Hòa Cục Bộ từ Google Sheet (nếu đã cấu hình)
  // Cho phép nhân viên tự sửa giá/model trong Google Sheet mà không cần sửa code.
  function parseCsv(text) {
    const lines = text.replace(/\r/g, '').split('\n').filter(line => line.trim() !== '');
    if (!lines.length) return [];

    function parseLine(line) {
      const cells = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (inQuotes) {
          if (char === '"') {
            if (line[i + 1] === '"') { current += '"'; i++; }
            else inQuotes = false;
          } else {
            current += char;
          }
        } else if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          cells.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      cells.push(current);
      return cells.map(cell => cell.trim());
    }

    const headers = parseLine(lines[0]).map(h => h.toLowerCase());
    return lines.slice(1).map(line => {
      const cells = parseLine(line);
      const row = {};
      headers.forEach((header, index) => { row[header] = cells[index] ?? ''; });
      return row;
    });
  }

  async function loadLocalAcProductsFromSheet() {
    const csvUrl = window.MINH_VIET_CONFIG?.productSheetCsvUrl;
    if (!csvUrl) return;

    try {
      const response = await fetch(csvUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const csvText = await response.text();
      const rows = parseCsv(csvText);

      const parsedProducts = rows
        .filter(row => {
          const visibility = (row.an_hien || '').trim().toLowerCase();
          return visibility !== 'khong' && visibility !== 'không';
        })
        .map(row => {
          const model = row.model || '';
          const key = model.replace(/\s*\/\s*/g, '_');
          const detail = localAcDetails[key];
          return {
            categories: (row.categories || '').split('|').map(c => c.trim()).filter(Boolean),
            label: row.label || '',
            name: row.name || '',
            model,
            capacity: row.capacity || '',
            price: row.price || '',
            image: (row.image || '').trim() || 'assets/products/placeholder.svg',
            ...(detail ? { description: detail.description, specs: detail.specs } : {}),
          };
        })
        .filter(p => p.name && p.model);

      if (parsedProducts.length) {
        daikinProducts = parsedProducts;
        activeProductFilter = 'all';
        showAllProducts = false;
        productFilterButtons.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-product-filter') === 'all'));
        renderProducts();
      }
    } catch (error) {
      console.warn('Không tải được bảng giá từ Google Sheet, dùng danh sách mặc định.', error);
    }
  }

  loadLocalAcProductsFromSheet();

  // 4c. Danh mục Điều Hòa Trung Tâm VRV/VRF
  // Nguồn: daikinvietnam.co (dàn nóng, dàn lạnh) và anvietco.vn (điều khiển, thông gió ERV) — 2026-08.
  const vrvImageBase = 'assets/products/vrv/';
  const vrvImages = {
    'vrv-h': vrvImageBase + 'vrv-h.jpg',
    'vrv-ivs': vrvImageBase + 'vrv-ivs.jpg',
    'vrv-vi': vrvImageBase + 'vrv-vi.jpg',
    'indoor': vrvImageBase + 'indoor.jpg',
    'control-wired': vrvImageBase + 'control-wired.png',
    'control-wireless': vrvImageBase + 'control-wireless.png',
    'ventilation': vrvImageBase + 'ventilation.png',
  };

  const vrvBaseCatalog = [
    // ===================== VRV H SERIES (dàn nóng, 2 chiều) =====================
    {
      category: 'outdoor', icon: 'outdoor', label: 'Dàn Nóng VRV H',
      name: 'Dàn Nóng Daikin VRV H RXYQ10AYM', model: 'RXYQ10AYM',
      capacity: '10 HP · 28,0 kW · 95.500 BTU/h', imageGroup: 'vrv-h',
      description: 'Dàn nóng điều hòa trung tâm Daikin VRV H RXYQ10AYM là dòng 2 chiều (làm lạnh/sưởi ấm) thuộc thế hệ VRV H, kết hợp công nghệ VRV, VRT và VAV để tối ưu tiết kiệm năng lượng. Sử dụng máy nén Scroll kín, ga R-410A, phù hợp cho các công trình vừa và nhỏ.',
      specs: [
        { label: 'Công suất lạnh', value: '95.500 BTU/h (28,0 kW)' },
        { label: 'Công suất sưởi', value: '107.000 BTU/h (31,5 kW)' },
        { label: 'Công suất tiêu thụ (lạnh/sưởi)', value: '6,84 kW / 7,23 kW' },
        { label: 'Nguồn điện', value: '3 pha 4 dây, 380-415V, 50Hz/60Hz' },
        { label: 'Kích thước (C×R×S)', value: '1.657 × 930 × 765 mm' },
        { label: 'Trọng lượng', value: '200 kg' },
        { label: 'Môi chất lạnh', value: 'R-410A, 6,7 kg' },
        { label: 'Đường ống lỏng / gas', value: 'φ9,5 mm / φ22,2 mm (hàn)' },
        { label: 'Độ ồn', value: '57 dB(A)' },
        { label: 'Phạm vi vận hành lạnh/sưởi', value: '-5°C~49°C / -20°C~15,5°C' },
        { label: 'Số dàn lạnh kết nối tối đa', value: '16 dàn' },
        { label: 'Xuất xứ', value: 'Thái Lan' },
        { label: 'Bảo hành', value: '5 năm' },
      ],
    },
    {
      category: 'outdoor', icon: 'outdoor', label: 'Dàn Nóng VRV H',
      name: 'Dàn Nóng Daikin VRV H RXYQ12AYM', model: 'RXYQ12AYM',
      capacity: '12 HP · 33,5 kW · 114.000 BTU/h', imageGroup: 'vrv-h',
      description: 'Dàn nóng Daikin VRV H RXYQ12AYM loại 2 chiều tiết kiệm diện tích lắp đặt nhờ máy nén Scroll kín kiểu mới, cho hiệu suất cao. Hệ thống điều khiển môi chất lạnh hoàn toàn tự động giúp vận hành ổn định ngay cả ở tải thấp.',
      specs: [
        { label: 'Công suất lạnh', value: '114.000 BTU/h (33,5 kW)' },
        { label: 'Công suất sưởi', value: '128.000 BTU/h (37,5 kW)' },
        { label: 'Công suất tiêu thụ (lạnh/sưởi)', value: '8,70 kW / 8,91 kW' },
        { label: 'Nguồn điện', value: '3 pha 4 dây, 380-415V, 50Hz/60Hz' },
        { label: 'Kích thước (C×R×S)', value: '1.657 × 930 × 765 mm' },
        { label: 'Trọng lượng', value: '200 kg' },
        { label: 'Môi chất lạnh', value: 'R-410A, 7,6 kg' },
        { label: 'Đường ống lỏng / gas', value: 'φ12,7 mm / φ28,6 mm (hàn)' },
        { label: 'Độ ồn', value: '59 dB(A)' },
        { label: 'Phạm vi vận hành lạnh/sưởi', value: '-5°C~49°C / -20°C~15,5°C' },
        { label: 'Số dàn lạnh kết nối tối đa', value: '19 dàn' },
        { label: 'Xuất xứ', value: 'Thái Lan' },
        { label: 'Bảo hành', value: '5 năm' },
      ],
    },
    {
      category: 'outdoor', icon: 'outdoor', label: 'Dàn Nóng VRV H',
      name: 'Dàn Nóng Daikin VRV H RXYQ14AYM', model: 'RXYQ14AYM',
      capacity: '14 HP · 40,0 kW · 136.000 BTU/h', imageGroup: 'vrv-h',
      description: 'Dàn nóng Daikin VRV H RXYQ14AYM 14HP loại 2 chiều, thuộc thế hệ thứ 5 của dòng điều hòa trung tâm VRV, kết hợp công nghệ VRV, VRT và VAV đạt cả tiêu chí tiết kiệm năng lượng lẫn điều hòa không khí tối ưu.',
      specs: [
        { label: 'Công suất lạnh', value: '136.000 BTU/h (40,0 kW)' },
        { label: 'Công suất sưởi', value: '154.000 BTU/h (45,0 kW)' },
        { label: 'Công suất tiêu thụ (lạnh/sưởi)', value: '10,7 kW / 11,0 kW' },
        { label: 'Nguồn điện', value: '3 pha 4 dây, 380-415V, 50Hz/60Hz' },
        { label: 'Kích thước (C×R×S)', value: '1.657 × 1.240 × 765 mm' },
        { label: 'Trọng lượng', value: '285 kg' },
        { label: 'Môi chất lạnh', value: 'R-410A, 9,1 kg' },
        { label: 'Đường ống lỏng / gas', value: 'φ12,7 mm / φ28,6 mm (hàn)' },
        { label: 'Độ ồn', value: '60 dB(A)' },
        { label: 'Phạm vi vận hành lạnh/sưởi', value: '-5°C~49°C / -20°C~15,5°C' },
        { label: 'Số dàn lạnh kết nối tối đa', value: '22 dàn' },
        { label: 'Điều khiển công suất', value: '11-100%' },
        { label: 'Xuất xứ', value: 'Thái Lan' },
        { label: 'Bảo hành', value: '5 năm' },
      ],
    },
    {
      category: 'outdoor', icon: 'outdoor', label: 'Dàn Nóng VRV H',
      name: 'Dàn Nóng Daikin VRV H RXYQ18AYM', model: 'RXYQ18AYM',
      capacity: '18 HP · 50,0 kW · 171.000 BTU/h', imageGroup: 'vrv-h',
      description: 'Dàn nóng Daikin VRV H RXYQ18AYM 18HP loại 2 chiều kết hợp công nghệ VRV, VRT (Smart VRT) và VAV, điều khiển môi chất lạnh hoàn toàn tự động, tối ưu hiệu suất máy nén Scroll.',
      specs: [
        { label: 'Công suất lạnh', value: '171.000 BTU/h (50,0 kW)' },
        { label: 'Công suất sưởi', value: '191.000 BTU/h (56,0 kW)' },
        { label: 'Công suất tiêu thụ (lạnh/sưởi)', value: '15,3 kW / 14,9 kW' },
        { label: 'Nguồn điện', value: '3 pha 4 dây, 380-415V, 50Hz/60Hz' },
        { label: 'Kích thước (C×R×S)', value: '1.657 × 1.240 × 765 mm' },
        { label: 'Trọng lượng', value: '305 kg' },
        { label: 'Môi chất lạnh', value: 'R-410A, 11,8 kg' },
        { label: 'Đường ống lỏng / gas', value: 'φ15,9 mm / φ28,6 mm (hàn)' },
        { label: 'Độ ồn', value: '61 dB(A)' },
        { label: 'Phạm vi vận hành lạnh/sưởi', value: '-5°C~49°C / -20°C~15,5°C' },
        { label: 'Số dàn lạnh kết nối tối đa', value: '29 dàn' },
        { label: 'Xuất xứ', value: 'Thái Lan' },
        { label: 'Bảo hành', value: '5 năm' },
      ],
    },
    {
      category: 'outdoor', icon: 'outdoor', label: 'Dàn Nóng VRV H',
      name: 'Dàn Nóng Daikin VRV H RXYQ20AYM', model: 'RXYQ20AYM',
      capacity: '20 HP · 55,9 kW · 191.000 BTU/h', imageGroup: 'vrv-h',
      description: 'Dàn nóng Daikin VRV H RXYQ20AYM 20HP loại 2 chiều thuộc thế hệ thứ 5 của dòng điều hòa trung tâm, trang bị công nghệ Smart VRT, tự động nạp môi chất lạnh và chế độ vận hành ban đêm êm ái.',
      specs: [
        { label: 'Công suất lạnh', value: '191.000 BTU/h (55,9 kW)' },
        { label: 'Công suất sưởi', value: '215.000 BTU/h (63,0 kW)' },
        { label: 'Công suất tiêu thụ (lạnh/sưởi)', value: '13,9 kW / 17,1 kW' },
        { label: 'Nguồn điện', value: '3 pha 4 dây, 380-415V, 50Hz/60Hz' },
        { label: 'Kích thước (C×R×S)', value: '1.657 × 1.240 × 765 mm' },
        { label: 'Trọng lượng', value: '325 kg' },
        { label: 'Môi chất lạnh', value: 'R-410A, 11,8 kg' },
        { label: 'Đường ống lỏng / gas', value: 'φ15,9 mm / φ28,6 mm (hàn)' },
        { label: 'Độ ồn', value: '65 dB(A)' },
        { label: 'Phạm vi vận hành lạnh/sưởi', value: '-5°C~49°C / -20°C~15,5°C' },
        { label: 'Tỉ lệ công suất kết hợp', value: '50-200% (tối đa 32-40 dàn lạnh)' },
        { label: 'Xuất xứ', value: 'Thái Lan' },
        { label: 'Bảo hành', value: '5 năm' },
      ],
    },

    // ===================== VRV IVS SERIES (mini VRV, dàn nóng, 2 chiều) =====================
    {
      category: 'outdoor', icon: 'outdoor', label: 'Dàn Nóng Mini VRV IVs',
      name: 'Dàn Nóng Daikin VRV IVs RXYMQ5AVE', model: 'RXYMQ5AVE / RXYMQ5BVM',
      capacity: '5 HP · 14,0 kW · 47.800 BTU/h', imageGroup: 'vrv-ivs',
      description: 'Dàn nóng Mini VRV IVs Daikin RXYMQ5AVE loại 2 chiều, thiết kế cho căn hộ cao cấp, biệt thự, cửa hàng, văn phòng nhỏ. Chiều cao dàn nóng chỉ 990mm — tối ưu cho không gian lắp đặt hạn chế.',
      specs: [
        { label: 'Công suất lạnh', value: '47.800 BTU/h (14,0 kW)' },
        { label: 'Công suất tiêu thụ (lạnh/sưởi)', value: '3,83 kW / 3,04 kW' },
        { label: 'Nguồn điện', value: '1 pha, 220-240V, 50/60Hz' },
        { label: 'Kích thước (C×R×S)', value: '990 × 940 × 320 mm' },
        { label: 'Trọng lượng', value: '78 kg' },
        { label: 'Môi chất lạnh', value: 'R-410A, 3,4 kg' },
        { label: 'Đường ống lỏng / gas', value: '9,5 mm / 15,9 mm (loe)' },
        { label: 'Độ ồn (lạnh/sưởi)', value: '53/54 dB(A)' },
        { label: 'Phạm vi vận hành lạnh/sưởi', value: '-5°C~46°C / -20°C~15,5°C' },
        { label: 'Số dàn lạnh kết nối tối đa', value: '8 dàn' },
        { label: 'Xuất xứ', value: 'Thái Lan' },
        { label: 'Bảo hành', value: '5 năm' },
      ],
    },
    {
      category: 'outdoor', icon: 'outdoor', label: 'Dàn Nóng Mini VRV IVs',
      name: 'Dàn Nóng Daikin VRV IVs RXYMQ6BVM', model: 'RXYMQ6BVM',
      capacity: '6 HP · 16,0 kW · 54.600 BTU/h', imageGroup: 'vrv-ivs',
      description: 'Dàn nóng Mini VRV IVs Daikin RXYMQ6BVM loại 2 chiều, hướng tới căn hộ cao cấp, biệt thự, văn phòng, khách sạn cỡ nhỏ. So với thế hệ trước, kích thước lắp đặt giảm 58%, trọng lượng giảm 25% và COP tăng 12%.',
      specs: [
        { label: 'Công suất lạnh', value: '54.600 BTU/h (16,0 kW)' },
        { label: 'Công suất tiêu thụ (lạnh/sưởi)', value: '4,51 kW / 3,59 kW' },
        { label: 'Nguồn điện', value: '1 pha, 220-240V, 50/60Hz' },
        { label: 'Kích thước (C×R×S)', value: '990 × 940 × 320 mm' },
        { label: 'Trọng lượng', value: '80 kg' },
        { label: 'Môi chất lạnh', value: 'R-410A, 4,0 kg' },
        { label: 'Đường ống lỏng / gas', value: '9,5 mm / 19,1 mm' },
        { label: 'Độ ồn (lạnh/sưởi)', value: '55/56 dB(A)' },
        { label: 'Phạm vi vận hành lạnh/sưởi', value: '-5°C~46°C / -20°C~15,5°C' },
        { label: 'Số dàn lạnh kết nối tối đa', value: '9 dàn' },
        { label: 'Xuất xứ', value: 'Thái Lan' },
        { label: 'Bảo hành', value: '4 năm thiết bị / 18 tháng lắp đặt' },
      ],
    },
    {
      category: 'outdoor', icon: 'outdoor', label: 'Dàn Nóng Mini VRV IVs',
      name: 'Dàn Nóng Daikin VRV IVs RXYMQ8AY1', model: 'RXYMQ8AY1',
      capacity: '8 HP · 22,4 kW · 76.400 BTU/h', imageGroup: 'vrv-ivs',
      description: 'Dàn nóng Daikin RXYMQ8AY1 thuộc hệ Mini VRV IVs, thiết kế nhỏ gọn, sang trọng, tính thẩm mỹ cao, phù hợp căn hộ cao cấp, biệt thự và không gian tới khoảng 150m².',
      specs: [
        { label: 'Công suất lạnh', value: '76.400 BTU/h (22,4 kW)' },
        { label: 'Công suất sưởi', value: '85.300 BTU/h (25,0 kW)' },
        { label: 'Nguồn điện', value: '3 pha, 380-415V, 50Hz' },
        { label: 'Kích thước (C×R×S)', value: '1.430 × 940 × 320 mm' },
        { label: 'Trọng lượng', value: '138 kg' },
        { label: 'Môi chất lạnh', value: 'R-410A, 5,8 kg' },
        { label: 'Đường ống lỏng / gas', value: '9,5 mm / 19,1 mm (hàn)' },
        { label: 'Độ ồn (lạnh/sưởi)', value: '57/58 dB(A)' },
        { label: 'Phạm vi vận hành lạnh/sưởi', value: '-5°C~46°C / -20°C~15,5°C' },
        { label: 'Số dàn lạnh kết nối tối đa', value: '13 dàn' },
        { label: 'Chiều dài đường ống tối đa', value: '250 m' },
        { label: 'Xuất xứ', value: 'Thái Lan' },
        { label: 'Bảo hành', value: '5 năm' },
      ],
    },
    {
      category: 'outdoor', icon: 'outdoor', label: 'Dàn Nóng Mini VRV IVs',
      name: 'Dàn Nóng Daikin VRV IVs RXYMQ9AY1', model: 'RXYMQ9AY1',
      capacity: '9 HP · 24,0 kW · 81.900 BTU/h', imageGroup: 'vrv-ivs',
      description: 'Dàn nóng Daikin RXYMQ9AY1 nằm trong hệ thống điều hòa tổng Mini VRV IVs, cực kỳ tiết kiệm không gian lắp đặt nhờ dàn nóng nhỏ gọn, kết nối được tối đa 14 dàn lạnh.',
      specs: [
        { label: 'Công suất lạnh', value: '81.900 BTU/h (24,0 kW)' },
        { label: 'Công suất tiêu thụ (lạnh/sưởi)', value: '6,88 kW / 6,82 kW' },
        { label: 'Nguồn điện', value: '3 pha, 380-415V, 50Hz' },
        { label: 'Kích thước (C×R×S)', value: '1.430 × 940 × 320 mm' },
        { label: 'Trọng lượng', value: '138 kg' },
        { label: 'Môi chất lạnh', value: 'R-410A, 5,8 kg' },
        { label: 'Đường ống lỏng / gas', value: '9,5 mm / 22,2 mm (hàn)' },
        { label: 'Độ ồn (lạnh/sưởi)', value: '58/59 dB(A)' },
        { label: 'Số dàn lạnh kết nối tối đa', value: '14 dàn' },
        { label: 'Xuất xứ', value: 'Thái Lan' },
        { label: 'Bảo hành', value: '5 năm' },
      ],
    },

    // ===================== VRV VI SERIES (dàn nóng, 2 chiều, thế hệ mới nhất) =====================
    {
      category: 'outdoor', icon: 'outdoor', label: 'Dàn Nóng VRV VI',
      name: 'Dàn Nóng Daikin VRV VI RXYQ8BYM', model: 'RXYQ8BYM',
      capacity: '8 HP · 22,4 kW · 76.400 BTU/h', imageGroup: 'vrv-vi',
      description: 'Dàn nóng điều hòa trung tâm Daikin VRV VI RXYQ8BYM loại 2 chiều là thế hệ mới nhất của Daikin, phân phối chính thức tại Việt Nam từ tháng 9/2023. Thiết kế nhỏ gọn, tiết kiệm diện tích lắp đặt, mang tới giải pháp điều hòa tổng hoàn hảo cho công trình.',
      specs: [
        { label: 'Công suất lạnh', value: '76.400 BTU/h (22,4 kW)' },
        { label: 'Công suất sưởi', value: '85.300 BTU/h (25,0 kW)' },
        { label: 'Nguồn điện', value: '3 pha 4 dây, 380-415V, 50Hz/60Hz' },
        { label: 'Kích thước (C×R×S)', value: '1.660 × 930 × 765 mm' },
        { label: 'Trọng lượng', value: '215 kg' },
        { label: 'Môi chất lạnh', value: 'R-410A, 6,9 kg' },
        { label: 'Đường ống lỏng / gas', value: 'φ9,5 mm / φ19,1 mm (hàn)' },
        { label: 'Độ ồn', value: '56 dB(A), mức áp âm 78 dB' },
        { label: 'EER (TCVN13256:2021)', value: '5,45' },
        { label: 'Phạm vi vận hành lạnh/sưởi', value: '-5°C~52°C / -25°C~15,5°C' },
        { label: 'Xuất xứ', value: 'Thái Lan' },
        { label: 'Bảo hành', value: '5 năm' },
      ],
    },
    {
      category: 'outdoor', icon: 'outdoor', label: 'Dàn Nóng VRV VI',
      name: 'Dàn Nóng Daikin VRV VI RXYQ10BYM', model: 'RXYQ10BYM',
      capacity: '10 HP · 28,0 kW · 95.500 BTU/h', imageGroup: 'vrv-vi',
      description: 'Dàn nóng Daikin VRV VI RXYQ10BYM 10HP loại 2 chiều, thế hệ 2024, trang bị công nghệ điều khiển VRT Smart II và khả năng tự nạp môi chất lạnh, cải thiện hiệu suất năng lượng so với thế hệ trước.',
      specs: [
        { label: 'Công suất lạnh', value: '95.500 BTU/h (28,0 kW)' },
        { label: 'Công suất sưởi', value: '107.000 BTU/h (31,5 kW)' },
        { label: 'Nguồn điện', value: '3 pha 4 dây, 380-415V, 50Hz/60Hz' },
        { label: 'Kích thước (C×R×S)', value: '1.660 × 930 × 765 mm' },
        { label: 'Trọng lượng', value: '225 kg' },
        { label: 'Môi chất lạnh', value: 'R-410A, 7,1 kg' },
        { label: 'Đường ống lỏng / gas', value: 'φ9,5 mm / φ22,2 mm (hàn)' },
        { label: 'Độ ồn', value: '57/58 dB(A), mức áp âm 79 dB' },
        { label: 'EER (TCVN13256:2021)', value: '5,11' },
        { label: 'Phạm vi vận hành lạnh/sưởi', value: '-5°C~52°C / -25°C~15,5°C' },
        { label: 'Số dàn lạnh kết nối tối đa', value: '16-25 dàn' },
        { label: 'Xuất xứ', value: 'Thái Lan' },
        { label: 'Bảo hành', value: '5 năm' },
      ],
    },
    {
      category: 'outdoor', icon: 'outdoor', label: 'Dàn Nóng VRV VI',
      name: 'Dàn Nóng Daikin VRV VI RXYQ12BYM', model: 'RXYQ12BYM',
      capacity: '12 HP · 33,5 kW · 114.000 BTU/h', imageGroup: 'vrv-vi',
      description: 'Dàn nóng Daikin VRV VI RXYQ12BYM 12HP loại 2 chiều, thế hệ mới nhất phân phối tại Việt Nam từ tháng 9/2023, thiết kế nhỏ gọn tiết kiệm diện tích lắp đặt.',
      specs: [
        { label: 'Công suất lạnh', value: '114.000 BTU/h (33,5 kW)' },
        { label: 'Công suất sưởi', value: '128.000 BTU/h (37,5 kW)' },
        { label: 'Công suất tiêu thụ (lạnh/sưởi)', value: '8,70 kW / 9,67 kW' },
        { label: 'Nguồn điện', value: '3 pha 4 dây, 380-415V, 50Hz/60Hz' },
        { label: 'Kích thước (C×R×S)', value: '1.660 × 930 × 765 mm' },
        { label: 'Trọng lượng', value: '225 kg' },
        { label: 'Môi chất lạnh', value: 'R-410A, 7,2 kg' },
        { label: 'Đường ống lỏng / gas', value: 'φ12,7 mm / φ28,6 mm (hàn)' },
        { label: 'Độ ồn', value: '60/62 dB(A), mức áp âm 83 dB' },
        { label: 'EER (TCVN13256:2021)', value: '4,75' },
        { label: 'Phạm vi vận hành lạnh/sưởi', value: '-5°C~52°C / -25°C~15,5°C' },
        { label: 'Số dàn lạnh kết nối tối đa', value: '19 (30) dàn' },
        { label: 'Xuất xứ', value: 'Thái Lan' },
        { label: 'Bảo hành', value: '5 năm' },
      ],
    },
    {
      category: 'outdoor', icon: 'outdoor', label: 'Dàn Nóng VRV VI',
      name: 'Dàn Nóng Daikin VRV VI RXYQ14BYM', model: 'RXYQ14BYM',
      capacity: '14 HP · 40,0 kW · 136.000 BTU/h', imageGroup: 'vrv-vi',
      description: 'Dàn nóng điều hòa trung tâm Daikin VRV VI RXYQ14BYM 14HP loại 2 chiều là thế hệ mới nhất của Daikin phân phối tại Việt Nam, sử dụng máy nén Scroll kép hiệu suất cao.',
      specs: [
        { label: 'Công suất lạnh', value: '136.000 BTU/h (40,0 kW)' },
        { label: 'Công suất sưởi', value: '154.000 BTU/h (45,0 kW)' },
        { label: 'Nguồn điện', value: '3 pha 4 dây, 380-415V, 50Hz/60Hz' },
        { label: 'Kích thước (C×R×S)', value: '1.660 × 1.240 × 765 mm' },
        { label: 'Trọng lượng', value: '310 kg' },
        { label: 'Môi chất lạnh', value: 'R-410A, 9,7 kg' },
        { label: 'Đường ống lỏng / gas', value: 'φ12,7 mm / φ28,6 mm (hàn)' },
        { label: 'Độ ồn', value: '61 dB(A), mức áp âm 83 dB' },
        { label: 'EER (TCVN13256:2021)', value: '4,85' },
        { label: 'Phạm vi vận hành lạnh/sưởi', value: '-5°C~52°C / -25°C~15,5°C' },
        { label: 'Xuất xứ', value: 'Thái Lan' },
        { label: 'Bảo hành', value: '5 năm' },
      ],
    },
    {
      category: 'outdoor', icon: 'outdoor', label: 'Dàn Nóng VRV VI',
      name: 'Dàn Nóng Daikin VRV VI RXYQ16BYM', model: 'RXYQ16BYM',
      capacity: '16 HP · 45,0 kW · 154.000 BTU/h', imageGroup: 'vrv-vi',
      description: 'Dàn nóng điều hòa trung tâm Daikin VRV VI (VRV 6H) RXYQ16BYM 16HP loại 2 chiều là thế hệ mới nhất của Daikin phân phối tại Việt Nam.',
      specs: [
        { label: 'Công suất lạnh', value: '154.000 BTU/h (45,0 kW)' },
        { label: 'Công suất sưởi', value: '171.000 BTU/h (50,0 kW)' },
        { label: 'Nguồn điện', value: '3 pha 4 dây, 380-415V, 50Hz/60Hz' },
        { label: 'Kích thước (C×R×S)', value: '1.660 × 1.240 × 765 mm' },
        { label: 'Trọng lượng', value: '310 kg' },
        { label: 'Môi chất lạnh', value: 'R-410A, 9,9 kg' },
        { label: 'Đường ống lỏng / gas', value: 'φ12,7 mm / φ28,6 mm (hàn)' },
        { label: 'Độ ồn', value: '61 dB(A), mức áp âm 83 dB' },
        { label: 'EER (TCVN13256:2021)', value: '4,74' },
        { label: 'Phạm vi vận hành lạnh/sưởi', value: '-5°C~52°C / -25°C~15,5°C' },
        { label: 'Xuất xứ', value: 'Thái Lan' },
        { label: 'Bảo hành', value: '5 năm' },
      ],
    },
    {
      category: 'outdoor', icon: 'outdoor', label: 'Dàn Nóng VRV VI',
      name: 'Dàn Nóng Daikin VRV VI RXYQ18BYM', model: 'RXYQ18BYM',
      capacity: '18 HP · 50,0 kW · 171.000 BTU/h', imageGroup: 'vrv-vi',
      description: 'Dàn nóng điều hòa trung tâm Daikin VRV VI RXYQ18BYM 18HP loại 2 chiều là thế hệ mới nhất của Daikin phân phối tại Việt Nam, chính thức từ tháng 9/2023, thiết kế nhỏ gọn tiết kiệm diện tích lắp đặt.',
      specs: [
        { label: 'Công suất lạnh', value: '171.000 BTU/h (50,0 kW)' },
        { label: 'Công suất sưởi', value: '191.000 BTU/h (56,0 kW)' },
        { label: 'Công suất tiêu thụ (lạnh/sưởi)', value: '14,3 kW / 14,9 kW' },
        { label: 'Nguồn điện', value: '3 pha 4 dây, 380-415V, 50Hz/60Hz' },
        { label: 'Điều khiển công suất', value: '5-100%' },
        { label: 'Kích thước (C×R×S)', value: '1.660 × 1.240 × 765 mm' },
        { label: 'Trọng lượng', value: '340 kg' },
        { label: 'EER (TCVN13256:2021)', value: '4,88' },
        { label: 'Độ ồn', value: '61/61 dB(A), mức áp âm 85 dB' },
        { label: 'Môi chất lạnh', value: 'R-410A, 11,7 kg' },
        { label: 'Đường ống lỏng / gas', value: 'φ15,9 mm / φ28,6 mm (hàn)' },
        { label: 'Phạm vi vận hành lạnh/sưởi', value: '-5°C~52°C / -25°C~15,5°C' },
        { label: 'Xuất xứ', value: 'Thái Lan' },
        { label: 'Bảo hành', value: '5 năm' },
      ],
    },
    {
      category: 'outdoor', icon: 'outdoor', label: 'Dàn Nóng VRV VI',
      name: 'Dàn Nóng Daikin VRV VI RXYQ20BYM', model: 'RXYQ20BYM',
      capacity: '20 HP · 56,0 kW · 191.000 BTU/h', imageGroup: 'vrv-vi',
      description: 'Dàn nóng điều hòa trung tâm Daikin VRV VI RXYQ20BYM 20HP loại 2 chiều là thế hệ mới nhất của Daikin phân phối tại Việt Nam, trang bị công nghệ VRT Smart II, tự động nạp môi chất lạnh và hiệu suất được nâng cao.',
      specs: [
        { label: 'Công suất lạnh', value: '191.000 BTU/h (56,0 kW)' },
        { label: 'Công suất sưởi', value: '215.000 BTU/h (63,0 kW)' },
        { label: 'Nguồn điện', value: '3 pha 4 dây, 380-415V, 50Hz/60Hz' },
        { label: 'Kích thước (C×R×S)', value: '1.660 × 1.240 × 765 mm' },
        { label: 'Trọng lượng', value: '340 kg' },
        { label: 'Môi chất lạnh', value: 'R-410A, 11,7 kg' },
        { label: 'Đường ống lỏng / gas', value: 'φ15,9 mm / φ28,6 mm (hàn)' },
        { label: 'Độ ồn', value: '65/66 dB(A), mức áp âm 90 dB' },
        { label: 'EER (TCVN13256:2021)', value: '4,71' },
        { label: 'Phạm vi vận hành lạnh/sưởi', value: '-5°C~52°C / -25°C~15,5°C' },
        { label: 'Xuất xứ', value: 'Thái Lan' },
        { label: 'Bảo hành', value: '5 năm' },
      ],
    },

    // ===================== DÀN LẠNH =====================
    {
      category: 'indoor', icon: 'indoor', label: 'Dàn Lạnh Âm Trần Nối Ống Gió',
      name: 'Dàn Lạnh Daikin FXSQ25PAVE9 (Âm Trần Nối Ống Gió)', model: 'FXSQ25PAVE9',
      capacity: '9.600 BTU/h · 2,8 kW', imageGroup: 'indoor',
      description: 'Dàn lạnh giấu trần nối ống gió VRV Daikin FXSQ25PAVE9 dùng công nghệ biến tần (inverter) tiết kiệm năng lượng, thiết kế mỏng gọn phù hợp không gian 12-15m². Máy có bơm thoát nước ngưng tích hợp (đẩy cao 850mm), hỗ trợ hồi gió cả từ đáy và phía sau linh hoạt cho việc lắp đặt.',
      specs: [
        { label: 'Công suất lạnh', value: '9.600 BTU/h (2,8 kW)' },
        { label: 'Công suất sưởi', value: '10.900 BTU/h (3,2 kW)' },
        { label: 'Nguồn điện', value: '1 pha, 220-240V, 50/60Hz' },
        { label: 'Kích thước (C×R×S)', value: '245 × 550 × 800 mm' },
        { label: 'Trọng lượng', value: '25 kg' },
        { label: 'Lưu lượng gió', value: '9/7,5/6,5 m³/phút (5 cấp tốc độ)' },
        { label: 'Độ ồn', value: '33/30/28 dB(A)' },
        { label: 'Đường ống lỏng / gas', value: '6,4 mm / 12,7 mm (loe)' },
        { label: 'Cột áp tĩnh', value: '30-150 Pa (mặc định 50 Pa)' },
        { label: 'Xuất xứ', value: 'Việt Nam' },
        { label: 'Bảo hành', value: '12 tháng' },
      ],
    },

    // ===================== BỘ ĐIỀU KHIỂN =====================
    {
      category: 'control', icon: 'control', label: 'Điều Khiển Có Dây',
      name: 'Điều Khiển Có Dây Daikin BRC1E63', model: 'BRC1E63',
      capacity: 'Điều khiển có dây, màn hình LCD', imageGroup: 'control-wired',
      description: 'BRC1E63 là bộ điều khiển có dây tiêu chuẩn cho hệ VRV/Multi S/NX của Daikin, màn hình LCD đơn sắc có đèn nền. Hỗ trợ giới hạn dải nhiệt độ, hẹn giờ theo tuần, điều chỉnh 5 cấp tốc độ gió, tính năng SETBACK duy trì nhiệt độ phòng khi không sử dụng, và theo dõi điện năng tiêu thụ theo ngày/tuần/tháng.',
      specs: [
        { label: 'Loại', value: 'Điều khiển từ xa có dây, gắn tường' },
        { label: 'Tính năng chính', value: 'Giới hạn nhiệt độ, hẹn giờ tuần, tắt màn hình tự động, điều khiển hướng gió 5 cấp, SETBACK' },
        { label: 'Tương thích ngược', value: 'BRC1E62, BRC1C62' },
        { label: 'Xuất xứ', value: 'Trung Quốc' },
      ],
    },
    {
      category: 'control', icon: 'control', label: 'Điều Khiển Có Dây',
      name: 'Điều Khiển Có Dây Daikin BRC2E61', model: 'BRC2E61',
      capacity: 'Điều khiển có dây, 6 phím, 85×85mm', imageGroup: 'control-wired',
      description: 'BRC2E61 là bộ điều khiển có dây đơn giản với thiết kế trực quan, thao tác qua 6 phím bấm cho các chức năng cơ bản: bật/tắt, chọn chế độ, chỉnh nhiệt độ, tốc độ gió, hướng gió và hẹn giờ. Thay thế cho bộ điều khiển BRC1C62-9.',
      specs: [
        { label: 'Loại', value: 'Điều khiển có dây, gắn tường, 6 phím' },
        { label: 'Kích thước', value: '85 × 85 mm' },
        { label: 'Chức năng', value: 'Bật/tắt, chọn chế độ, chỉnh nhiệt độ, tốc độ gió, hướng gió lên/xuống, hẹn giờ' },
        { label: 'Thay thế cho', value: 'BRC1C62-9' },
        { label: 'Xuất xứ', value: 'Malaysia' },
      ],
    },
    {
      category: 'control', icon: 'control', label: 'Điều Khiển Không Dây',
      name: 'Điều Khiển Không Dây Daikin BRC4C65', model: 'BRC4C65',
      capacity: 'Kèm bộ nhận tín hiệu, 300g', imageGroup: 'control-wireless',
      description: 'BRC4C65 là bộ điều khiển từ xa không dây thuộc dòng BRC-C,E Series của Daikin, đi kèm bộ nhận tín hiệu gọn nhẹ lắp rời trên trần hoặc tường. Có đèn nền hỗ trợ sử dụng ban đêm, cài đặt tương tự điều khiển có dây. Thường dùng cho các dàn lạnh giấu trần nối ống gió như FXDQ, FXMQ-P.',
      specs: [
        { label: 'Loại', value: 'Điều khiển từ xa không dây kèm bộ nhận tín hiệu' },
        { label: 'Tương thích', value: 'Dàn lạnh giấu trần nối ống gió FXDQ, FXMQ-P' },
        { label: 'Trọng lượng', value: '300 g' },
        { label: 'Tính năng', value: 'Đèn nền ban đêm, cài đặt tương đương điều khiển có dây' },
        { label: 'Xuất xứ', value: 'Nhật Bản' },
        { label: 'Bảo hành', value: '1 năm' },
      ],
    },

    // ===================== THÔNG GIÓ THU HỒI NHIỆT (VAM) =====================
    {
      category: 'ventilation', icon: 'ventilation', label: 'Thông Gió Thu Hồi Nhiệt VAM',
      name: 'Thiết Bị Thông Gió Thu Hồi Nhiệt Daikin VAM150HVE', model: 'VAM150HVE',
      capacity: '150 m³/h', imageGroup: 'ventilation',
      description: 'Thiết bị thông gió thu hồi nhiệt (HRV) Daikin VAM150HVE loại bỏ khí bẩn trong phòng và cấp khí tươi lọc qua phin lọc PM2.5, cân bằng nhiệt độ và độ ẩm giữa không khí trong nhà và ngoài trời, giảm tải cho hệ thống điều hòa tới 31%. Phù hợp phòng diện tích 20-40m².',
      specs: [
        { label: 'Lưu lượng gió (cao/thấp)', value: '150 m³/h / 95-100 m³/h' },
        { label: 'Nguồn điện', value: '1 pha, 220-240V, 50/60Hz' },
        { label: 'Kích thước (R×S×C)', value: '278 × 810 × 551 mm' },
        { label: 'Trọng lượng', value: '24 kg' },
        { label: 'Đường kính ống nối', value: 'Ø100 mm' },
        { label: 'Hiệu suất trao đổi nhiệt (lạnh/sưởi)', value: '79-84% / 79-85%' },
        { label: 'Công suất tiêu thụ (cao/thấp)', value: '111-125 W / 57-58 W' },
        { label: 'Độ ồn (cao/thấp)', value: '26-29,5 dB(A) / 20,5-23,5 dB(A)' },
        { label: 'Diện tích phù hợp', value: '20-40 m²' },
        { label: 'Xuất xứ', value: 'Malaysia' },
      ],
    },
    {
      category: 'ventilation', icon: 'ventilation', label: 'Thông Gió Thu Hồi Nhiệt VAM',
      name: 'Thiết Bị Thông Gió Thu Hồi Nhiệt Daikin VAM250HVE', model: 'VAM250HVE',
      capacity: '250 m³/h', imageGroup: 'ventilation',
      description: 'Thiết bị thông gió thu hồi nhiệt Daikin VAM250HVE mang lại sự cân bằng nhiệt độ giữa không khí trong nhà và ngoài trời, lọc sạch bụi bẩn nhờ phin lọc PM2.5, tiết kiệm đến 31% năng lượng điều hòa. Phù hợp phòng 30-60m².',
      specs: [
        { label: 'Lưu lượng gió (cao/thấp)', value: '250 m³/h / 155 m³/h' },
        { label: 'Nguồn điện', value: '1 pha, 220-240V, 50/60Hz' },
        { label: 'Kích thước (R×S×C)', value: '278 × 810 × 551 mm' },
        { label: 'Trọng lượng', value: '24 kg' },
        { label: 'Đường kính ống nối', value: 'Ø150 mm' },
        { label: 'Hiệu suất trao đổi nhiệt', value: '75-79% (tùy chế độ)' },
        { label: 'Công suất tiêu thụ', value: '60-141 W (tùy chế độ)' },
        { label: 'Diện tích phù hợp', value: '30-60 m²' },
        { label: 'Xuất xứ', value: 'Malaysia' },
      ],
    },
    {
      category: 'ventilation', icon: 'ventilation', label: 'Thông Gió Thu Hồi Nhiệt VAM',
      name: 'Thiết Bị Thông Gió Thu Hồi Nhiệt Daikin VAM350HVE', model: 'VAM350HVE',
      capacity: '350 m³/h', imageGroup: 'ventilation',
      description: 'Thiết bị thông gió thu hồi nhiệt Daikin VAM350HVE cân bằng nhiệt độ giữa không khí trong nhà và ngoài trời, lọc sạch bụi bẩn, giảm độ ẩm cao, mang dưỡng khí tự nhiên vào phòng. Trang bị lọc PM2.5, giảm khoảng 31% tải cho hệ thống điều hòa.',
      specs: [
        { label: 'Lưu lượng gió (cao/thấp)', value: '350 m³/h / 230 m³/h' },
        { label: 'Nguồn điện', value: '1 pha, 220-240V, 50/60Hz' },
        { label: 'Kích thước (R×S×C)', value: '306 × 879 × 800 mm' },
        { label: 'Trọng lượng', value: '32 kg' },
        { label: 'Đường kính ống nối', value: 'Ø150 mm' },
        { label: 'Hiệu suất trao đổi nhiệt (cao/thấp)', value: '79% / 82%' },
        { label: 'Công suất tiêu thụ (cao/thấp)', value: '200 W / 122 W' },
        { label: 'Độ ồn tối đa', value: '34,5 dB(A)' },
        { label: 'Xuất xứ', value: 'Malaysia' },
      ],
    },
    {
      category: 'ventilation', icon: 'ventilation', label: 'Thông Gió Thu Hồi Nhiệt VAM',
      name: 'Thiết Bị Thông Gió Thu Hồi Nhiệt Daikin VAM500HVE', model: 'VAM500HVE',
      capacity: '500 m³/h', imageGroup: 'ventilation',
      description: 'Thiết bị thông gió thu hồi nhiệt HRV Daikin VAM500HVE cân bằng nhiệt độ giữa không khí trong nhà và ngoài trời, lọc sạch bụi bẩn, giảm độ ẩm cao. Vỏ máy bằng thép mạ kẽm, cách nhiệt bằng polyurethane không cháy.',
      specs: [
        { label: 'Lưu lượng gió (cao/thấp)', value: '500 m³/h / 295-320 m³/h' },
        { label: 'Nguồn điện', value: '1 pha, 220-240V, 50/60Hz' },
        { label: 'Kích thước (R×S×C)', value: '306 × 879 × 800 mm' },
        { label: 'Trọng lượng', value: '32 kg' },
        { label: 'Đường kính ống nối', value: 'Ø200 mm' },
        { label: 'Vỏ máy / cách nhiệt', value: 'Thép mạ kẽm / Polyurethane không cháy' },
        { label: 'Hiệu suất trao đổi nhiệt', value: '74-80,5% (tùy chế độ)' },
        { label: 'Công suất tiêu thụ', value: '128-270 W (tùy chế độ)' },
        { label: 'Độ ồn', value: '24-36 dB(A) tùy chế độ' },
        { label: 'Xuất xứ', value: 'Malaysia' },
      ],
    },
    {
      category: 'ventilation', icon: 'ventilation', label: 'Thông Gió Thu Hồi Nhiệt VAM',
      name: 'Thiết Bị Thông Gió Thu Hồi Nhiệt Daikin VAM1000HVE', model: 'VAM1000HVE',
      capacity: '1.000 m³/h', imageGroup: 'ventilation',
      description: 'Thiết bị thông gió thu hồi nhiệt HRV Daikin VAM1000HVE dành cho không gian lớn, cân bằng nhiệt độ trong-ngoài nhà, lọc bụi PM2.5, tiết kiệm đến 31% năng lượng điều hòa, có chế độ vận hành ban đêm linh hoạt và tùy chọn kết nối cảm biến CO2.',
      specs: [
        { label: 'Lưu lượng gió tối đa', value: '1.000 m³/h' },
        { label: 'Nguồn điện', value: '1 pha, 220-240V, 50/60Hz' },
        { label: 'Kích thước (R×S×C)', value: '387 × 1.111-1.112 × 1.214 mm' },
        { label: 'Trọng lượng', value: '63-67 kg' },
        { label: 'Đường kính ống nối', value: 'Ø250 mm' },
        { label: 'Hiệu suất trao đổi nhiệt', value: '74-80,5% (tùy chế độ)' },
        { label: 'Công suất tiêu thụ', value: '476-760 W (tùy chế độ)' },
        { label: 'Độ ồn', value: '35-42,5 dB(A)' },
        { label: 'Diện tích phù hợp', value: '180-260 m²' },
        { label: 'Xuất xứ', value: 'Malaysia' },
      ],
    },
  ];

  // Bảng tra cứu mô tả/thông số/ảnh theo model — dùng để giữ nguyên dữ liệu kỹ thuật
  // đã kiểm chứng ngay cả khi danh mục được nạp từ Google Sheet (xem loadVrvProductsFromSheet).
  const vrvDetailsByModel = {};
  vrvBaseCatalog.forEach(product => {
    const key = product.model.replace(/\s*\/\s*/g, '_');
    vrvDetailsByModel[key] = {
      category: product.category,
      icon: product.icon,
      label: product.label,
      description: product.description,
      specs: product.specs,
      imageGroup: product.imageGroup,
    };
  });

  let vrvProducts = vrvBaseCatalog.map(product => ({ ...product, image: vrvImages[product.imageGroup] || '' }));

  const vrvIconPaths = {
    outdoor: '<rect x="3" y="7" width="18" height="10" rx="2"/><line x1="7" y1="7" x2="7" y2="17"/><line x1="12" y1="7" x2="12" y2="17"/><line x1="17" y1="7" x2="17" y2="17"/>',
    indoor: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01"/>',
    control: '<rect x="7" y="2" width="10" height="20" rx="2"/><line x1="10" y1="6" x2="14" y2="6"/><circle cx="12" cy="11" r="1.5"/><line x1="9" y1="16" x2="15" y2="16"/>',
    ventilation: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  };

  const vrvProductGrid = document.getElementById('vrvProductGrid');
  const vrvFilterButtons = document.querySelectorAll('[data-vrv-filter]');
  let activeVrvFilter = 'all';

  function renderVrvProducts() {
    if (!vrvProductGrid) return;
    const filtered = activeVrvFilter === 'all'
      ? vrvProducts
      : vrvProducts.filter(product => product.category === activeVrvFilter);

    vrvProductGrid.innerHTML = filtered.map(product => {
      const originalIndex = vrvProducts.indexOf(product);
      const photo = product.image
        ? `<img src="${product.image}" alt="${product.name}" loading="lazy" decoding="async">`
        : `<div class="vrv-icon-inner"><svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${vrvIconPaths[product.icon] || vrvIconPaths.outdoor}</svg></div>`;

      return `
      <article class="product-card">
        <div class="product-image-wrap vrv-icon-wrap">
          <span class="product-type-badge">${product.label}</span>
          ${photo}
        </div>
        <div class="product-card-body">
          <div>
            <h3 class="product-name">${product.name}</h3>
            <div class="product-model">Model: <strong>${product.model}</strong></div>
            <div class="product-spec-row">
              <span>${product.capacity}</span>
              <span>Daikin chính hãng</span>
            </div>
          </div>
          <div class="product-price-block">
            <span>Liên hệ nhận báo giá theo công trình</span>
          </div>
          <div class="vrv-card-actions">
            <button type="button" class="btn btn-outline-mv btn-sm" data-vrv-detail="${originalIndex}">Xem Chi Tiết & Thông Số</button>
            <a href="tel:0934506191" class="btn btn-primary btn-sm">Gọi Tư Vấn Báo Giá</a>
          </div>
        </div>
      </article>
    `;
    }).join('');
  }

  vrvFilterButtons.forEach(button => {
    button.addEventListener('click', () => {
      vrvFilterButtons.forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      activeVrvFilter = button.getAttribute('data-vrv-filter') || 'all';
      renderVrvProducts();
    });
  });

  renderVrvProducts();

  // 4d-2. Cập nhật danh mục VRV/VRF từ Google Sheet (nếu đã cấu hình)
  async function loadVrvProductsFromSheet() {
    const csvUrl = window.MINH_VIET_CONFIG?.vrvSheetCsvUrl;
    if (!csvUrl) return;

    try {
      const response = await fetch(csvUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const csvText = await response.text();
      const rows = parseCsv(csvText);

      const parsedProducts = rows
        .filter(row => {
          const visibility = (row.an_hien || '').trim().toLowerCase();
          return visibility !== 'khong' && visibility !== 'không';
        })
        .map(row => {
          const model = row.model || '';
          const key = model.replace(/\s*\/\s*/g, '_');
          const detail = vrvDetailsByModel[key];
          const category = row.category || detail?.category || 'outdoor';
          const icon = detail?.icon || category;
          const image = (row.image || '').trim() || (detail?.imageGroup ? vrvImages[detail.imageGroup] : '') || '';
          return {
            category,
            icon,
            label: row.label || detail?.label || '',
            name: row.name || '',
            model,
            capacity: row.capacity || '',
            image,
            ...(detail ? { description: detail.description, specs: detail.specs } : {}),
          };
        })
        .filter(p => p.name && p.model);

      if (parsedProducts.length) {
        vrvProducts = parsedProducts;
        activeVrvFilter = 'all';
        vrvFilterButtons.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-vrv-filter') === 'all'));
        renderVrvProducts();
      }
    } catch (error) {
      console.warn('Không tải được danh mục VRV/VRF từ Google Sheet, dùng danh sách mặc định.', error);
    }
  }

  loadVrvProductsFromSheet();

  // 4e. Modal Chi Tiết Sản Phẩm VRV/VRF
  const productDetailModal = document.getElementById('productDetailModal');
  const productDetailModalCloseBtn = document.getElementById('productDetailModalCloseBtn');
  const productDetailIcon = document.getElementById('productDetailIcon');
  const productDetailLabel = document.getElementById('productDetailLabel');
  const productDetailName = document.getElementById('productDetailName');
  const productDetailModel = document.getElementById('productDetailModel');
  const productDetailDesc = document.getElementById('productDetailDesc');
  const productDetailSpecTable = document.getElementById('productDetailSpecTable');

  function openProductDetailModal(product) {
    if (!productDetailModal) return;

    if (productDetailIcon) {
      productDetailIcon.innerHTML = product.image
        ? `<img src="${product.image}" alt="${product.name}">`
        : `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${vrvIconPaths[product.icon] || vrvIconPaths.outdoor}</svg>`;
    }
    if (productDetailLabel) productDetailLabel.textContent = product.label || '';
    if (productDetailName) productDetailName.textContent = product.name || '';
    if (productDetailModel) productDetailModel.innerHTML = `Model: <strong>${product.model || ''}</strong>`;
    if (productDetailDesc) {
      productDetailDesc.textContent = product.description
        || `${product.name} – ${product.capacity}. Liên hệ hotline để được kỹ sư tư vấn cấu hình phù hợp với công trình của bạn.`;
    }
    if (productDetailSpecTable) {
      const specs = (product.specs && product.specs.length) ? product.specs : [{ label: 'Công suất', value: product.capacity }];
      productDetailSpecTable.innerHTML = specs.map(spec => `<tr><td>${spec.label}</td><td>${spec.value}</td></tr>`).join('');
    }

    productDetailModal.classList.add('show');
  }

  vrvProductGrid?.addEventListener('click', (e) => {
    const detailBtn = e.target.closest('[data-vrv-detail]');
    if (!detailBtn) return;
    const index = Number(detailBtn.getAttribute('data-vrv-detail'));
    const product = vrvProducts[index];
    if (product) openProductDetailModal(product);
  });

  productGrid?.addEventListener('click', (e) => {
    const detailBtn = e.target.closest('[data-local-detail]');
    if (!detailBtn) return;
    const index = Number(detailBtn.getAttribute('data-local-detail'));
    const product = daikinProducts[index];
    if (product) openProductDetailModal(product);
  });

  productDetailModalCloseBtn?.addEventListener('click', () => {
    productDetailModal?.classList.remove('show');
  });

  productDetailModal?.addEventListener('click', (e) => {
    if (e.target === productDetailModal) {
      productDetailModal.classList.remove('show');
    }
  });

  // 4f. Modal QR Thanh Toán
  const paymentModal = document.getElementById('paymentModal');
  const paymentModalCloseBtn = document.getElementById('paymentModalCloseBtn');
  const openPaymentModalBtn = document.getElementById('openPaymentModalBtn');
  const openPaymentModalBtnMobile = document.getElementById('openPaymentModalBtnMobile');
  const paymentCopyBtn = document.getElementById('paymentCopyBtn');
  const paymentAccNumber = document.getElementById('paymentAccNumber');

  function openPaymentModal() {
    paymentModal?.classList.add('show');
    closeMobileMenu();
  }

  openPaymentModalBtn?.addEventListener('click', openPaymentModal);
  openPaymentModalBtnMobile?.addEventListener('click', openPaymentModal);

  paymentModalCloseBtn?.addEventListener('click', () => {
    paymentModal?.classList.remove('show');
  });

  paymentModal?.addEventListener('click', (e) => {
    if (e.target === paymentModal) {
      paymentModal.classList.remove('show');
    }
  });

  paymentCopyBtn?.addEventListener('click', async () => {
    const accNumber = paymentAccNumber?.textContent?.trim() || '';
    try {
      await navigator.clipboard.writeText(accNumber);
      paymentCopyBtn.textContent = 'Đã chép!';
      setTimeout(() => { paymentCopyBtn.textContent = 'Sao chép'; }, 1500);
    } catch (err) {
      paymentCopyBtn.textContent = 'Lỗi, thử lại';
      setTimeout(() => { paymentCopyBtn.textContent = 'Sao chép'; }, 1500);
    }
  });

  // 4d. Chuyển đổi giữa Điều Hòa Cục Bộ và Điều Hòa Trung Tâm VRV/VRF
  const productSegmentButtons = document.querySelectorAll('.product-segment-btn');
  const localAcPanel = document.getElementById('localAcPanel');
  const vrvPanel = document.getElementById('vrvPanel');

  productSegmentButtons.forEach(button => {
    button.addEventListener('click', () => {
      productSegmentButtons.forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      const segment = button.getAttribute('data-product-segment');
      if (localAcPanel) localAcPanel.hidden = segment !== 'local';
      if (vrvPanel) vrvPanel.hidden = segment !== 'vrv';
    });
  });

  // 5. Project Showcase Category Filter
  const filterTabs = document.querySelectorAll('.filter-tab-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filterValue = tab.getAttribute('data-filter');

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 6. Drag & Drop File Upload Handler
  const dropzone = document.getElementById('blueprintDropzone');
  const fileInput = document.getElementById('blueprintFileInput');
  const filePreview = document.getElementById('filePreview');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const removeFileBtn = document.getElementById('removeFileBtn');

  if (dropzone && fileInput) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, preventDefaults, false);
      document.body.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        fileInput.files = files;
        handleFileSelected(files[0]);
      }
    });

    fileInput.addEventListener('change', function() {
      if (this.files && this.files.length > 0) {
        handleFileSelected(this.files[0]);
      }
    });

    if (removeFileBtn) {
      removeFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.value = '';
        if (filePreview) filePreview.style.display = 'none';
        const defaultContent = dropzone.querySelector('.upload-content-default');
        if (defaultContent) defaultContent.style.display = 'block';
      });
    }
  }

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleFileSelected(file) {
    const maxFileSize = window.MINH_VIET_CONFIG?.maxFileSizeBytes || 4 * 1024 * 1024;
    if (file.size > maxFileSize) {
      fileInput.value = '';
      window.alert('Tệp vượt quá 4MB. Vui lòng chọn tệp nhỏ hơn hoặc gọi hotline 0934 506 191 để được hỗ trợ gửi bản vẽ.');
      return;
    }
    const defaultContent = dropzone.querySelector('.upload-content-default');
    if (defaultContent) defaultContent.style.display = 'none';
    if (filePreview && fileNameDisplay) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      fileNameDisplay.innerHTML = `📄 <strong>${file.name}</strong> (${fileSizeMB} MB)`;
      filePreview.style.display = 'flex';
    }
  }

  // 6. FAQ Accordion Handler
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(otherItem => otherItem.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });

  // 7. Form Submission to Netlify Function & Google Sheets
  const quoteForm = document.getElementById('quoteForm');
  const successModal = document.getElementById('successModal');
  const successModalCloseBtn = document.getElementById('successModalCloseBtn');

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
      reader.onerror = () => reject(new Error('Không thể đọc tệp đính kèm.'));
      reader.readAsDataURL(file);
    });
  }

  if (quoteForm) {
    quoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const errorBox = document.getElementById('quoteFormError');
      if (errorBox) {
        errorBox.style.display = 'none';
        errorBox.textContent = '';
      }

      if (!quoteForm.checkValidity()) {
        quoteForm.reportValidity();
        return;
      }

      const submitBtn = quoteForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = `⏳ Đang gửi hồ sơ tới kỹ sư Minh Việt...`;

      try {
        const selectedFile = fileInput?.files?.[0] || null;
        const payload = {
          fullName: document.getElementById('formFullName')?.value.trim() || '',
          phone: document.getElementById('formPhone')?.value.trim() || '',
          projectType: document.getElementById('formProjectType')?.value || '',
          area: document.getElementById('formArea')?.value.trim() || '',
          notes: document.getElementById('formNotes')?.value.trim() || '',
          website: document.getElementById('formWebsite')?.value || '',
          source: window.location.href,
          file: selectedFile ? {
            name: selectedFile.name,
            type: selectedFile.type || 'application/octet-stream',
            size: selectedFile.size,
            base64: await fileToBase64(selectedFile),
          } : null,
        };

        const endpoint = window.MINH_VIET_CONFIG?.leadEndpoint || '/api/submit-lead';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
          throw new Error(result.message || 'Hệ thống chưa nhận được yêu cầu.');
        }

        if (window.gtag) gtag('event', 'gui_form_bao_gia_thanh_cong');
        if (successModal) successModal.classList.add('show');
        quoteForm.reset();
        if (filePreview) filePreview.style.display = 'none';
        const defaultContent = dropzone?.querySelector('.upload-content-default');
        if (defaultContent) defaultContent.style.display = 'block';
      } catch (error) {
        if (errorBox) {
          errorBox.textContent = `${error.message} Vui lòng gọi 0934 506 191 để được hỗ trợ ngay.`;
          errorBox.style.display = 'block';
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  if (successModalCloseBtn && successModal) {
    successModalCloseBtn.addEventListener('click', () => {
      successModal.classList.remove('show');
    });

    successModal.addEventListener('click', (e) => {
      if (e.target === successModal) {
        successModal.classList.remove('show');
      }
    });
  }

  // 8. Animated Counters via IntersectionObserver
  const counterItems = document.querySelectorAll('.counter-item');
  let animatedCounters = false;

  function runCounters() {
    counterItems.forEach(counter => {
      const target = parseFloat(counter.getAttribute('data-target'));
      const prefix = counter.getAttribute('data-prefix') || '';
      const suffix = counter.getAttribute('data-suffix') || '';
      const decimals = parseInt(counter.getAttribute('data-decimals')) || 0;
      const duration = 1600;
      const startTime = performance.now();

      function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentVal = (target * easeProgress).toFixed(decimals);

        counter.textContent = `${prefix}${currentVal}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(updateNumber);
        } else {
          counter.textContent = `${prefix}${target}${suffix}`;
        }
      }

      requestAnimationFrame(updateNumber);
    });
  }

  // 9. Scroll Reveal Observer
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        
        // If benefits section reached, trigger counters
        if (entry.target.closest('#benefits') && !animatedCounters) {
          animatedCounters = true;
          runCounters();
        }
      }
    });
  }, { threshold: 0.12 });

  revealElements.forEach(el => revealObserver.observe(el));

  // 10. Smooth Scroll for all anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

});

// ==========================================================================
// ĐO LƯỜNG GOOGLE ANALYTICS 4
// Ghi nhận 2 hành động liên hệ quan trọng nhất. Sự kiện gửi form thành công
// được bắn ngay tại chỗ hiện popup báo thành công ở phần 7 phía trên.
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {

  function track(name, params) {
    if (window.gtag) gtag('event', name, params || {});
  }

  document.querySelectorAll('a[href^="tel:"]').forEach((a) => {
    a.addEventListener('click', () => {
      track('bam_hotline', { vi_tri: a.className || 'khac' });
    });
  });

  document.querySelectorAll('a[href*="zalo.me"]').forEach((a) => {
    a.addEventListener('click', () => {
      track('bam_zalo', { vi_tri: a.className || 'khac' });
    });
  });

});

// ==========================================================================
// CHATBOT TƯ VẤN — kịch bản lấy từ sales_script.md
// Chatbot dạng luật (rule-based): dò từ khóa trong câu khách gõ để trả lời
// đúng theo kịch bản, không gọi API ngoài. Khi khách có ý định mua hoặc đã
// hỏi từ 3 câu trở lên, tự động hiện nút dẫn tới form "Gửi Bản Vẽ" (#gui-ban-ve).
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {

  const launcherBtn = document.getElementById('chatbotLauncherBtn');
  const chatWindow = document.getElementById('mvChatWindow');
  const closeBtn = document.getElementById('mvChatCloseBtn');
  const messagesEl = document.getElementById('mvChatMessages');
  const quickRepliesEl = document.getElementById('mvChatQuickReplies');
  const chatForm = document.getElementById('mvChatForm');
  const chatInput = document.getElementById('mvChatInput');

  if (!launcherBtn || !chatWindow || !chatForm || !chatInput) return;

  const GREETING = 'Em chào anh/chị, em là trợ lý của Minh Việt HVAC ạ 👋<br>Bên em chuyên tư vấn và thi công điều hòa trung tâm, điều hòa giấu trần và hệ thống cấp khí tươi cho biệt thự, penthouse, văn phòng.<br>Anh/chị đang tìm hiểu cho công trình nào ạ — nhà đang xây, đang cải tạo, hay đã ở rồi muốn nâng cấp lại hệ thống điều hòa?';

  const FAQ = [
    {
      label: 'Chi phí lắp đặt khoảng bao nhiêu?',
      keywords: ['chi phi', 'gia bao nhieu', 'bao nhieu tien', 'gia lap dat', 'gia dieu hoa', 'bao gia'],
      answer: 'Còn tùy diện tích và loại hệ thống anh/chị chọn ạ. Ví dụ với gói trọn gói (thiết bị + tư vấn kiến trúc-kỹ thuật + thi công): dưới 12.000 BTU khoảng 18-25 triệu, 18.000-24.000 BTU khoảng 32-41 triệu, còn hệ trung tâm VRV/VRF thì không có giá cố định vì phải khảo sát thực tế mới tính chính xác được. Anh/chị cho em xin diện tích phòng/công trình, em ước tính nhanh cho ạ.'
    },
    {
      label: 'Nhà đã hoàn thiện, còn lắp giấu trần được không?',
      keywords: ['hoan thien', 'giau tran', 'da o roi', 'noi that roi', 'sua lai nha'],
      answer: 'Được ạ, thật sự vẫn làm được bình thường. Kỹ sư bên em sẽ xuống khảo sát trực tiếp trần thạch cao và hạ tầng hiện có, để tìm đường đi ống gió hợp lý nhất — hạn chế tối đa việc phải cắt sửa trần, giữ nguyên gần như 100% thẩm mỹ ban đầu của nhà mình.'
    },
    {
      label: 'VRV/VRF có đáng tiền hơn máy treo tường không?',
      keywords: ['vrv', 'vrf', 'trung tam', 'dang tien hon', 'may treo tuong'],
      answer: 'Đầu tư ban đầu thì cao hơn máy treo tường khoảng 20-30% thật đó anh/chị. Nhưng đổi lại tiết kiệm điện 30-35% về lâu dài, bền gấp đôi (15-20 năm so với 7-10 năm), và chỉ cần 1 dàn nóng cho cả nhà nên ban công không bị chằng chịt máy móc. Với biệt thự/penthouse thì khoản này còn giúp giữ giá trị nhà khi sang nhượng nữa ạ.'
    },
    {
      label: 'Khảo sát, vẽ thiết kế 2D có tính phí không?',
      keywords: ['khao sat', 'thiet ke 2d', 've 2d', 'co phi khong', 'mien phi'],
      answer: 'Miễn phí 100% ạ, không thu một đồng nào. Bên em chỉ ký hợp đồng thi công khi anh/chị đã ưng ý với phương án bố trí và bảng dự toán rõ ràng, không phát sinh. Cứ để kỹ sư khảo sát và ra bản vẽ trước, chưa quyết định lắp cũng không sao ạ.'
    },
    {
      label: 'Sao giá bên mình cao hơn chỗ khác báo?',
      keywords: ['sao gia', 'cao hon', 'noi khac bao gia', 're hon', 'so sanh gia', 'dat hon'],
      answer: 'Thật sự giá đó có thể rẻ hơn vì bên kia chỉ tính tiền lắp máy thôi anh/chị. Minh Việt tính thêm phần ngồi cùng kiến trúc sư ngay từ đầu, để giải pháp điều hòa không phá vỡ thiết kế công trình — cái này không thấy trên báo giá, nhưng là cái giúp anh/chị không phải đập ra làm lại sau này. Anh/chị cứ so sánh thoải mái, em tin công trình mình làm sẽ ít rủi ro hơn.'
    },
    {
      label: 'Có cần lắp thêm cấp khí tươi ERV không?',
      keywords: ['khi tuoi', 'erv', 'oxy', 'thong gio', 'co2'],
      answer: 'Máy lạnh chỉ làm mát chứ không cấp thêm oxy anh/chị ạ — phòng đóng kín lâu dễ tích CO2, đó là lý do nhiều nhà mới xây ở rất lạnh mà vẫn thấy mệt, khó ngủ sâu. Hệ ERV bên em thu hồi tới 80% nhiệt trước khi cấp khí mới vào nên gần như không phát sinh thêm điện đáng kể, mà giải quyết đúng vấn đề đó. Nếu ngân sách chưa thoải mái, mình có thể ưu tiên lắp phòng ngủ trước ạ.'
    },
    {
      label: 'Thi công mất bao lâu, quy trình thế nào?',
      keywords: ['quy trinh', 'bao lau', 'thi cong mat', 'tien do', 'may ngay'],
      answer: 'Bên em làm theo 5 bước chuẩn: khảo sát thực địa → thiết kế bản vẽ 2D → thi công ống & dây (đi ống đồng dày, thử áp suất Nitơ kiểm tra rò rỉ trước khi đóng trần) → lắp máy & đo kiểm lưu lượng gió từng phòng → bàn giao và kích hoạt bảo hành. Thời gian cụ thể phụ thuộc quy mô công trình, để em xin thông tin rồi báo lịch chính xác cho anh/chị nhé.'
    },
    {
      label: 'Bảo hành, bảo trì sau này thế nào?',
      keywords: ['bao hanh', 'bao tri', 'hong thi sao', 'sua chua', 'hu hong'],
      answer: 'Máy bảo hành 1 năm, block máy nén 4-5 năm tùy dòng ạ. Quan trọng hơn là bên em có đội kỹ thuật thường trực, cam kết có mặt xử lý trong 2-4 tiếng nếu có sự cố ở nội thành, hỗ trợ 24/7. Khi anh/chị gửi bản vẽ đăng ký khảo sát, còn được tặng luôn 1 năm bảo dưỡng định kỳ miễn phí tận nhà nữa ạ.'
    },
    {
      label: 'Minh Việt đã làm công trình nào rồi?',
      keywords: ['du an nao', 'kinh nghiem', 'lam roi chua', 'cong trinh nao', 'da lam'],
      answer: 'Dạ có ạ. Bên em từng làm biệt thự Vinhomes Riverside (hệ Daikin VRV-H), nhà máy Dự Phát 8.000m² (Daikin VRV-IV), showroom Hyundai Thành Công, văn phòng Gamuda Land, cùng vài khách sạn ở Hà Nội. Nếu công trình anh/chị tương tự loại nào trong số này, em gửi thêm thông tin chi tiết để anh/chị hình dung rõ hơn nhé.'
    },
    {
      label: 'Sao chọn Minh Việt thay vì đơn vị khác?',
      keywords: ['sao chon minh viet', 'vi sao chon', 'khac gi doi thu', 'don vi khac'],
      answer: 'Câu này em trả lời thật lòng: mấy đơn vị kia cũng tốt, có bên là đại lý chính hãng, có bên nhiều chi nhánh — cái đó em không phủ nhận. Nhưng cái Minh Việt làm khác là ngồi cùng kiến trúc sư của anh/chị ngay từ bản vẽ đầu tiên, chứ không chỉ nhận bản vẽ rồi lắp cho xong việc. Máy chạy tốt mà công trình vẫn đẹp, đúng ý đồ thiết kế ban đầu — đó mới là cái tụi em theo đuổi hơn chục năm nay.'
    }
  ];

  const BUY_KEYWORDS = ['mua', 'dang ky', 'bao gia chi tiet', 'khao sat thuc te', 'chot don', 'chot', 'lien he ky su', 'muon mua', 'quan tam', 'gui ban ve', 'so dien thoai', 'dat lich'];
  const STALL_KEYWORDS = ['suy nghi', 'tham khao', 'chua can gap', 'de sau', 'tu quyet dinh', 'chua voi'];

  let hasGreeted = false;
  let userMessageCount = 0;
  let closingShown = false;

  function normalize(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd');
  }

  function scrollMessagesToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function appendMessage(content, sender) {
    const row = document.createElement('div');
    row.className = 'mv-chat-msg mv-chat-msg-' + sender;
    const bubble = document.createElement('div');
    bubble.className = 'mv-chat-bubble';
    if (sender === 'user') {
      bubble.textContent = content;
    } else {
      bubble.innerHTML = content;
    }
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    scrollMessagesToBottom();
  }

  function appendCtaButton(label) {
    const wrap = document.createElement('div');
    wrap.className = 'mv-chat-cta-wrap';
    const cta = document.createElement('a');
    cta.href = '#gui-ban-ve';
    cta.className = 'btn btn-orange mv-chat-cta-btn';
    cta.textContent = label;
    cta.addEventListener('click', () => {
      closeChat();
      window.setTimeout(() => {
        document.getElementById('formFullName')?.focus();
      }, 500);
    });
    wrap.appendChild(cta);
    messagesEl.appendChild(wrap);
    scrollMessagesToBottom();
  }

  function showTyping() {
    const row = document.createElement('div');
    row.className = 'mv-chat-msg mv-chat-msg-bot';
    row.id = 'mvChatTypingRow';
    row.innerHTML = '<div class="mv-chat-bubble mv-chat-typing"><span></span><span></span><span></span></div>';
    messagesEl.appendChild(row);
    scrollMessagesToBottom();
  }

  function hideTyping() {
    document.getElementById('mvChatTypingRow')?.remove();
  }

  function showQuickReplies() {
    quickRepliesEl.innerHTML = '';
    if (closingShown) return;
    FAQ.slice(0, 4).forEach((item) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'mv-chat-chip';
      chip.textContent = item.label;
      chip.addEventListener('click', () => handleUserMessage(item.label));
      quickRepliesEl.appendChild(chip);
    });
    const buyChip = document.createElement('button');
    buyChip.type = 'button';
    buyChip.className = 'mv-chat-chip mv-chat-chip-primary';
    buyChip.textContent = 'Tôi muốn nhận báo giá';
    buyChip.addEventListener('click', () => handleUserMessage('Tôi muốn nhận báo giá và đăng ký khảo sát'));
    quickRepliesEl.appendChild(buyChip);
  }

  function showClosingPitch() {
    if (closingShown) return;
    closingShown = true;
    quickRepliesEl.innerHTML = '';
    appendMessage('Nghe anh/chị chia sẻ vậy em thấy công trình mình khá hợp với giải pháp bên em vừa tư vấn đó ạ. Để chính xác nhất thì mình cần một buổi khảo sát thực tế hoặc anh/chị gửi bản vẽ mặt bằng qua — hoàn toàn miễn phí, kỹ sư trưởng bên em sẽ lên luôn bản vẽ tính tải 2D (trị giá 5 triệu, đang miễn phí đợt này) và báo giá chi tiết trong khoảng 2 tiếng.<br><br>Anh/chị bấm nút bên dưới để lại thông tin, kỹ sư sẽ liên hệ ngay ạ, chưa có bản vẽ sẵn cũng không sao.', 'bot');
    appendCtaButton('Gửi Bản Vẽ – Nhận Báo Giá Miễn Phí');
  }

  function handleUserMessage(text) {
    appendMessage(text, 'user');
    userMessageCount += 1;
    quickRepliesEl.innerHTML = '';

    const normalized = normalize(text);
    const matched = FAQ.find((item) => item.keywords.some((k) => normalized.includes(k)));
    const wantsToBuy = BUY_KEYWORDS.some((k) => normalized.includes(k));
    const stalls = !wantsToBuy && STALL_KEYWORDS.some((k) => normalized.includes(k));

    showTyping();
    window.setTimeout(() => {
      hideTyping();

      if (matched) {
        appendMessage(matched.answer, 'bot');
      } else if (stalls) {
        appendMessage('Dạ không sao ạ, cứ từ từ anh/chị nhé, đây là quyết định cho cả công trình mà, cân nhắc kỹ là đúng rồi. Anh/chị cứ để lại thông tin, có bản vẽ tính tải 2D miễn phí trong tay trước cho chắc, sau này cần thì mình bàn tiếp cũng được ạ.', 'bot');
      } else if (!wantsToBuy) {
        appendMessage('Dạ em chưa chắc hiểu đúng ý anh/chị lắm. Anh/chị chọn nhanh 1 câu hỏi bên dưới hoặc gõ cụ thể hơn giúp em nhé, không thì gọi hotline 0934 506 191 em hỗ trợ luôn ạ.', 'bot');
      }

      if (wantsToBuy || userMessageCount >= 3) {
        showClosingPitch();
      } else {
        showQuickReplies();
      }
    }, 550);
  }

  function openChat() {
    chatWindow.classList.add('open');
    chatWindow.setAttribute('aria-hidden', 'false');
    launcherBtn.classList.add('chat-open');
    launcherBtn.closest('.floating-contact-widget')?.classList.add('mv-chat-active');
    if (!hasGreeted) {
      hasGreeted = true;
      appendMessage(GREETING, 'bot');
      showQuickReplies();
    }
    chatInput.focus();
  }

  function closeChat() {
    chatWindow.classList.remove('open');
    chatWindow.setAttribute('aria-hidden', 'true');
    launcherBtn.classList.remove('chat-open');
    launcherBtn.closest('.floating-contact-widget')?.classList.remove('mv-chat-active');
  }

  launcherBtn.addEventListener('click', () => {
    if (chatWindow.classList.contains('open')) {
      closeChat();
    } else {
      openChat();
    }
  });

  closeBtn?.addEventListener('click', closeChat);

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = chatInput.value.trim();
    if (!value) return;
    chatInput.value = '';
    handleUserMessage(value);
  });

  // Tự động bật khung chat chào khách ngay khi vào web, chỉ 1 lần mỗi phiên
  // truy cập (tránh làm phiền nếu khách load lại trang nhiều lần).
  const AUTO_OPEN_KEY = 'mvChatAutoOpened';
  let autoOpened = false;
  try {
    autoOpened = sessionStorage.getItem(AUTO_OPEN_KEY) === '1';
  } catch (e) {}

  if (!autoOpened) {
    window.setTimeout(() => {
      openChat();
      try {
        sessionStorage.setItem(AUTO_OPEN_KEY, '1');
      } catch (e) {}
    }, 2500);
  }
});
