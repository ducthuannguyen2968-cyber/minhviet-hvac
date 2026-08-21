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
    if (roundedBtu <= 12000) {
      minCost = 16;
      maxCost = 22;
    } else if (roundedBtu <= 18000) {
      minCost = 22;
      maxCost = 29;
    } else if (roundedBtu <= 24000) {
      minCost = 28;
      maxCost = 36;
    } else if (roundedBtu <= 36000) {
      minCost = 42;
      maxCost = 55;
    } else {
      minCost = Math.round(roundedBtu * 0.0014);
      maxCost = Math.round(roundedBtu * 0.0019);
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
      const costVal = calcCostEstResult ? calcCostEstResult.textContent : '28 - 36 Tr';

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

  // 4. Daikin Product Catalog
  const daikinProducts = [
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
  ];

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

    productGrid.innerHTML = visibleProducts.map(product => `
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
          <div class="product-actions">
            <a href="${product.source}" target="_blank" rel="noopener" class="product-detail-link">Chi Tiết</a>
            <a href="tel:0934506191" class="btn btn-primary btn-sm">Gọi Tư Vấn</a>
          </div>
        </div>
      </article>
    `).join('');

    if (showAllProductsBtn) {
      const canExpand = activeProductFilter === 'all' && !showAllProducts && filteredProducts.length > 8;
      showAllProductsBtn.hidden = !canExpand;
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
