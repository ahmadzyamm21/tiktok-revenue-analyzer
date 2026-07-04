// TikTok Revenue & Omset Analyzer - Logic script
document.addEventListener('DOMContentLoaded', () => {
    console.log("TikTok Revenue & Omset Analyzer v1.3.0 loaded (Laporan Pencairan Resi active).");
    // ------------------------------------------
    // State variables
    // ------------------------------------------
    let revenueLogs = JSON.parse(localStorage.getItem('tiktok_revenue_logs')) || [];
    let targetRevenue = parseFloat(localStorage.getItem('tiktok_target_revenue')) || 100000000;
    let shopName = localStorage.getItem('shop_name') || 'My TikTok Shop';
    let currentLogoBase64 = localStorage.getItem('shop_logo_base64') || null;
    let withdrawalsList = JSON.parse(localStorage.getItem('tiktok_withdrawals')) || [];
    let orderItemsDb = JSON.parse(localStorage.getItem('tiktok_order_items')) || [];
    let orderPayouts = JSON.parse(localStorage.getItem('tiktok_order_payouts')) || {};
    let dailyGmvAdsDb = JSON.parse(localStorage.getItem('tiktok_daily_gmv_ads')) || {};
    let analysisMonth = localStorage.getItem('tiktok_analysis_month') || '2026-05';

    let revenueTrendChart = null;
    let channelDonutChart = null;

    // Sanitize any invalid elements in local storage
    if (!Array.isArray(revenueLogs)) {
        revenueLogs = [];
        localStorage.setItem('tiktok_revenue_logs', JSON.stringify([]));
    }

    // ------------------------------------------
    // DOM Elements queries
    // ------------------------------------------
    const tabMenuItems = document.querySelectorAll('.menu-item');
    const tabContents = document.querySelectorAll('.tab-content');

    const shopNameDisplay = document.getElementById('shop-name-display');
    const shopLogoContainer = document.getElementById('shop-logo-container');
    const shopBadgeContainer = document.getElementById('shop-badge-container');

    const kpiTargetRev = document.getElementById('kpi-target-rev');
    const kpiTargetPct = document.getElementById('kpi-target-pct');
    const kpiGrossRev = document.getElementById('kpi-gross-rev');
    const kpiOrderCount = document.getElementById('kpi-order-count');
    const kpiNetRev = document.getElementById('kpi-net-rev');
    const kpiVoucherDeduction = document.getElementById('kpi-voucher-deduction');
    const kpiAov = document.getElementById('kpi-aov');
    const kpiDailyAvg = document.getElementById('kpi-daily-avg');

    const targetProgressBar = document.getElementById('target-progress-bar');
    const targetProgressText = document.getElementById('target-progress-text');
    const targetRemainingValue = document.getElementById('target-remaining-value');
    const targetNeededDaily = document.getElementById('target-needed-daily');

    const revenueLogForm = document.getElementById('revenue-log-form');
    const logsTableBody = document.getElementById('logs-table-body');
    const btnCancelEdit = document.getElementById('btn-cancel-edit');
    const formTitle = document.getElementById('form-title');

    const settingsModal = document.getElementById('settings-modal');
    const btnOpenSettings = document.getElementById('btn-open-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const btnSaveSettings = document.getElementById('btn-save-settings');

    const settingsShopName = document.getElementById('settings-shop-name');
    const settingsTargetRevenue = document.getElementById('settings-target-revenue');
    const settingsMonthlyHpp = document.getElementById('settings-monthly-hpp');
    const settingsAnalysisMonth = document.getElementById('settings-analysis-month');
    const settingsShopLogoFile = document.getElementById('settings-shop-logo-file');
    const btnUploadLogoTrigger = document.getElementById('btn-upload-logo-trigger');
    const settingsLogoPreviewIcon = document.getElementById('settings-logo-preview-icon');
    const settingsLogoPreviewImg = document.getElementById('settings-logo-preview-img');

    const kpiNetProfit = document.getElementById('kpi-net-profit');
    const kpiNetProfitSubtext = document.getElementById('kpi-net-profit-subtext');
    const cardNetProfit = document.getElementById('card-net-profit');

    let monthlyHpp = parseInt(localStorage.getItem('tiktok_monthly_hpp')) || 0;

    const btnExportFullBackup = document.getElementById('btn-export-full-backup');
    const inputFullBackupFile = document.getElementById('input-full-backup-file');

    const btnExportCsv = document.getElementById('btn-export-csv');
    const btnPrintLogs = document.getElementById('btn-print-logs');
    const btnPrintDashboard = document.getElementById('btn-print-dashboard');

    const channelsCardsContainer = document.getElementById('channels-cards-container');
    const channelRecommendationsList = document.getElementById('channel-recommendations-list');

    const toast = document.getElementById('toast');

    // Set auto-date to today's date in daily input form
    const logDateInput = document.getElementById('log-date');
    if (logDateInput) {
        logDateInput.value = new Date().toISOString().split('T')[0];
    }

    // ------------------------------------------
    // Utility functions
    // ------------------------------------------
    function formatRupiah(value) {
        return 'Rp ' + Math.round(value).toLocaleString('id-ID');
    }

    function showToast(msg, type = 'info') {
        const toastMessage = toast.querySelector('.toast-message');
        toastMessage.textContent = msg;
        
        toast.className = 'toast';
        if (type === 'success') toast.classList.add('success');
        if (type === 'error') toast.classList.add('error');
        
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Load logo and settings
    function loadShopSettings() {
        shopNameDisplay.textContent = shopName;
        settingsShopName.value = shopName;
        settingsTargetRevenue.value = targetRevenue;
        settingsMonthlyHpp.value = monthlyHpp;
        if (settingsAnalysisMonth) settingsAnalysisMonth.value = analysisMonth;

        const activeMonthBadge = document.getElementById('active-month-badge');
        if (activeMonthBadge) {
            const parts = analysisMonth.split('-');
            const yearStr = parts[0];
            const monthStr = parts[1];
            const monthsIndo = {
                '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
                '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
                '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
            };
            activeMonthBadge.textContent = `${monthsIndo[monthStr] || monthStr} ${yearStr}`;
        }

        if (currentLogoBase64) {
            shopLogoContainer.innerHTML = `<img src="${currentLogoBase64}" style="width: 100%; height: 100%; object-fit: cover;">`;
            settingsLogoPreviewIcon.style.display = 'none';
            settingsLogoPreviewImg.src = currentLogoBase64;
            settingsLogoPreviewImg.style.display = 'block';
        } else {
            shopLogoContainer.innerHTML = `<i class="fas fa-store text-cyan" id="shop-logo-icon" style="font-size: 16px;"></i>`;
            settingsLogoPreviewIcon.style.display = 'block';
            settingsLogoPreviewImg.style.display = 'none';
        }
    }

    // Tab switcher
    tabMenuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const tabId = item.getAttribute('data-tab');
            if (!tabId) return;
            e.preventDefault();
            
            tabMenuItems.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            item.classList.add('active');
            const targetContent = document.getElementById(tabId);
            if (targetContent) targetContent.classList.add('active');

            // Redraw charts if switching to Dashboard
            if (tabId === 'tab-dashboard') {
                updateCharts();
            }
            if (tabId === 'tab-payouts') {
                renderPayoutsTable();
            }
        });
    });

    // Modal Control
    if (btnOpenSettings) btnOpenSettings.addEventListener('click', () => settingsModal.classList.add('show'));
    if (shopBadgeContainer) shopBadgeContainer.addEventListener('click', () => settingsModal.classList.add('show'));
    if (btnCloseSettings) btnCloseSettings.addEventListener('click', () => settingsModal.classList.remove('show'));
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) settingsModal.classList.remove('show');
        });
    }

    // Revert and clean up theme overrides (always dark theme)
    localStorage.removeItem('theme');
    document.body.classList.remove('light-theme');

    // Logo image uploader base64 conversion
    if (btnUploadLogoTrigger) {
        btnUploadLogoTrigger.addEventListener('click', () => settingsShopLogoFile.click());
    }
    if (settingsShopLogoFile) {
        settingsShopLogoFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    showToast('Ukuran file logo maksimal adalah 2MB!', 'error');
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(evt) {
                    currentLogoBase64 = evt.target.result;
                    settingsLogoPreviewIcon.style.display = 'none';
                    settingsLogoPreviewImg.src = currentLogoBase64;
                    settingsLogoPreviewImg.style.display = 'block';
                    showToast('Logo berhasil diunggah. Klik Simpan untuk menerapkan.', 'success');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Save Shop settings & target
    if (btnSaveSettings) {
        btnSaveSettings.addEventListener('click', () => {
            const newName = settingsShopName.value.trim();
            const newTarget = parseFloat(settingsTargetRevenue.value);
            const newHpp = parseInt(settingsMonthlyHpp.value) || 0;
            
            if (!newName) {
                showToast('Nama toko tidak boleh kosong!', 'error');
                return;
            }
            if (isNaN(newTarget) || newTarget < 0) {
                showToast('Target bulanan tidak valid!', 'error');
                return;
            }

            shopName = newName;
            targetRevenue = newTarget;
            monthlyHpp = newHpp;
            localStorage.setItem('shop_name', newName);
            localStorage.setItem('tiktok_target_revenue', newTarget.toString());
            localStorage.setItem('tiktok_monthly_hpp', newHpp.toString());
            
            if (settingsAnalysisMonth) {
                analysisMonth = settingsAnalysisMonth.value;
                localStorage.setItem('tiktok_analysis_month', analysisMonth);
            }
            if (currentLogoBase64) {
                localStorage.setItem('shop_logo_base64', currentLogoBase64);
            }

            loadShopSettings();
            calculateMetrics();
            updateCharts();
            settingsModal.classList.remove('show');
            showToast('Pengaturan toko berhasil disimpan!', 'success');
        });
    }

    const btnClearDatabase = document.getElementById('btn-clear-database');
    if (btnClearDatabase) {
        btnClearDatabase.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin menghapus dan mengosongkan seluruh database? Tindakan ini akan menghapus semua Catatan Harian, Riwayat Penarikan, dan Database HPP SKU yang tersimpan!')) {
                revenueLogs = [];
                withdrawalsList = [];
                hppSkuDb = {};
                orderItemsDb = [];
                orderPayouts = {};
                dailyGmvAdsDb = {};
                
                localStorage.removeItem('tiktok_revenue_logs');
                localStorage.removeItem('tiktok_withdrawals');
                localStorage.removeItem('tiktok_sku_hpp');
                localStorage.removeItem('tiktok_order_items');
                localStorage.removeItem('tiktok_order_payouts');
                localStorage.removeItem('tiktok_daily_gmv_ads');
                
                renderHppTable();
                renderDailyLogs();
                renderWithdrawals();
                if (typeof renderPayoutsTable === 'function') renderPayoutsTable();
                calculateMetrics();
                updateCharts();
                
                settingsModal.classList.remove('show');
                showToast('Seluruh database toko berhasil dikosongkan!', 'success');
            }
        });
    }

    // ------------------------------------------
    // Calculation & Render Logic
    // ------------------------------------------
    function saveLogsToStorage() {
        localStorage.setItem('tiktok_revenue_logs', JSON.stringify(revenueLogs));
    }

    function rebuildRevenueLogs() {
        if (!orderItemsDb || orderItemsDb.length === 0 || !orderPayouts || Object.keys(orderPayouts).length === 0) {
            return;
        }

        let returnResolutions = {};
        try {
            returnResolutions = JSON.parse(localStorage.getItem('tiktok_return_resolutions')) || {};
        } catch (e) {
            returnResolutions = {};
        }

        const dailyAgg = {};
        const orderIdCounts = {};
        orderItemsDb.forEach(item => {
            if (item.date) {
                orderIdCounts[item.orderId] = (orderIdCounts[item.orderId] || 0) + 1;
            }
        });

        orderItemsDb.forEach(item => {
            if (!item.date) return;
            const date = item.date;
            const payoutInfo = orderPayouts[item.orderId];
            const statusLower = (item.status || '').toLowerCase();
            const isCancelledOnly = statusLower.includes('batal') || statusLower === 'cancelled';
            
            const resolution = returnResolutions[item.orderId] || 'pending';
            const isSettled = (payoutInfo && payoutInfo.amount > 0) || resolution === 'menang';
            
            const hasResi = item.trackingId && item.trackingId.trim() !== '' && item.trackingId.trim() !== '-';
            const hasShipped = item.shippedTime && item.shippedTime.trim() !== '' && item.shippedTime.trim() !== '-';
            const hasValidShipment = hasResi && (!isCancelledOnly ? true : hasShipped);
            
            const isReturnedOnly = hasValidShipment && (
                statusLower.includes('retur') || 
                statusLower.includes('refund') || 
                statusLower.includes('return') || 
                isCancelledOnly ||
                (payoutInfo && payoutInfo.isReturned)
            ) && !isSettled;

            if (isSettled || isReturnedOnly) {
                if (!dailyAgg[date]) {
                    dailyAgg[date] = {
                        gross: 0,
                        orders: 0,
                        refunds: 0,
                        vouchers: 0,
                        adminFees: 0,
                        adsSpend: 0,
                        adjustments: 0,
                        hpp: 0,
                        uniqueOrders: new Set(),
                        orderIds: []
                    };
                }
                const agg = dailyAgg[date];
                
                let itemGross = 0;
                if (item.subtotalBeforeDiscount && item.subtotalBeforeDiscount > 0) {
                    itemGross = item.subtotalBeforeDiscount;
                } else if (item.originalPrice && item.originalPrice > 0) {
                    itemGross = item.originalPrice * item.qty;
                } else {
                    const fullAmt = payoutInfo ? (payoutInfo.originalAmount || payoutInfo.amount) : 0;
                    itemGross = fullAmt / (orderIdCounts[item.orderId] || 1);
                }
                agg.gross += itemGross;

                // Calculate HPP based on status and return resolutions:
                // Selesai/completed atau Banding Menang -> yes HPP
                // Retur tapi barang hilang/rusak (rugi HPP) -> yes HPP
                // Retur tapi barang kembali ke stok -> no HPP
                let calculatedHpp = 0;
                const skuInfo = hppSkuDb[item.sku];
                const hppVal = skuInfo ? (skuInfo.hpp || 0) : 0;
                const itemHpp = (item.qty || 1) * hppVal;

                if (statusLower.includes('selesai') || statusLower.includes('completed') || resolution === 'menang') {
                    calculatedHpp = itemHpp;
                } else if (isReturnedOnly && resolution === 'rugi') {
                    calculatedHpp = itemHpp;
                }
                agg.hpp += calculatedHpp;

                if (!agg.uniqueOrders.has(item.orderId)) {
                    agg.uniqueOrders.add(item.orderId);
                    agg.orders += 1;
                    agg.orderIds.push(item.orderId);

                    if (payoutInfo) {
                        // If Banding Menang, refunds is treated as 0 or not calculated as loss
                        const refundAmount = resolution === 'menang' ? 0 : (payoutInfo.refund || 0);
                        agg.refunds += refundAmount;
                        agg.vouchers += (payoutInfo.voucher || 0);
                        agg.adminFees += (payoutInfo.adminFees || 0);
                        agg.adsSpend += (payoutInfo.ads || 0);
                        agg.adjustments += (payoutInfo.adjustments || 0);
                    }
                }
            }
        });

        // Ensure all dates with GMV ads are present in dailyAgg
        Object.keys(dailyGmvAdsDb).forEach(dateKey => {
            if (dailyGmvAdsDb[dateKey] > 0) {
                if (!dailyAgg[dateKey]) {
                    dailyAgg[dateKey] = {
                        gross: 0,
                        orders: 0,
                        refunds: 0,
                        vouchers: 0,
                        adminFees: 0,
                        adsSpend: 0,
                        adjustments: 0,
                        hpp: 0,
                        uniqueOrders: new Set(),
                        orderIds: []
                    };
                }
            }
        });

        const rebuiltLogs = Object.keys(dailyAgg).map(dateKey => {
            const agg = dailyAgg[dateKey];
            const gmvAds = dailyGmvAdsDb[dateKey] || 0;
            return {
                id: 'log_imp_' + dateKey.replace(/-/g, '') + '_' + Date.now(),
                date: dateKey,
                orders: agg.orders,
                gross: agg.gross,
                refunds: agg.refunds,
                vouchers: agg.vouchers,
                adminFees: agg.adminFees,
                adsSpend: agg.adsSpend + gmvAds,
                adjustments: agg.adjustments,
                hpp: agg.hpp,
                orderIds: agg.orderIds,
                channels: { ads: 30, affiliate: 25, live: 25, video: 20 }
            };
        });

        const manualLogs = revenueLogs.filter(l => !l.id.startsWith('log_imp_'));
        revenueLogs = [...manualLogs, ...rebuiltLogs];
        revenueLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
        saveLogsToStorage();
    }

    function calculateMetrics() {
        rebuildRevenueLogs();
        let totalGross = 0;
        let totalRefunds = 0;
        let totalVouchers = 0;
        let totalOrders = 0;
        let totalAdminFees = 0;
        let totalAdsSpend = 0;
        let totalAdjustments = 0;
        let totalHppFromLogs = 0;

        revenueLogs.forEach(log => {
            if (!log.date || !log.date.startsWith(analysisMonth)) return;
            totalGross += log.gross;
            totalRefunds += log.refunds;
            totalVouchers += (log.vouchers || 0);
            totalOrders += log.orders;
            totalAdminFees += (log.adminFees || 0);
            totalAdsSpend += (log.adsSpend || 0);
            totalAdjustments += (log.adjustments || 0);
            totalHppFromLogs += (log.hpp || 0);
        });

        const totalNet = totalGross - totalRefunds - totalVouchers;
        const totalPayout = totalNet - totalAdminFees - totalAdsSpend + totalAdjustments;
        const targetPct = targetRevenue > 0 ? (totalNet / targetRevenue) * 100 : 0;

        let displayGross = totalGross;
        let displayOrders = totalOrders;

        if (orderItemsDb && orderItemsDb.length > 0) {
            const orderIdCounts = {};
            orderItemsDb.forEach(item => {
                if (item.date && item.date.startsWith(analysisMonth)) {
                    orderIdCounts[item.orderId] = (orderIdCounts[item.orderId] || 0) + 1;
                }
            });
            
            let sumGross = 0;
            const uniqueOrderIds = new Set();
            let returnResolutions = {};
            try {
                returnResolutions = JSON.parse(localStorage.getItem('tiktok_return_resolutions')) || {};
            } catch (e) {
                returnResolutions = {};
            }

            orderItemsDb.forEach(item => {
                if (!item.date || !item.date.startsWith(analysisMonth)) return;
                const payoutInfo = orderPayouts[item.orderId];
                const statusLower = (item.status || '').toLowerCase();
                const isCancelledOnly = statusLower.includes('batal') || statusLower === 'cancelled';
                
                const resolution = returnResolutions[item.orderId] || 'pending';
                const isSettled = (payoutInfo && payoutInfo.amount > 0) || resolution === 'menang';
                
                const hasResi = item.trackingId && item.trackingId.trim() !== '' && item.trackingId.trim() !== '-';
                const hasShipped = item.shippedTime && item.shippedTime.trim() !== '' && item.shippedTime.trim() !== '-';
                const hasValidShipment = hasResi && (!isCancelledOnly ? true : hasShipped);
                const isReturnedOnly = hasValidShipment && (statusLower.includes('retur') || 
                                       statusLower.includes('refund') || 
                                       statusLower.includes('return') || 
                                       (isCancelledOnly && item.trackingId) || 
                                       (payoutInfo && payoutInfo.isReturned) ||
                                       (item.returnType && (item.returnType.includes('return') || item.returnType.includes('refund'))) ||
                                       (item.returnQty && item.returnQty > 0)) && !isSettled;
                
                if (isSettled || isReturnedOnly) {
                    let itemGross = 0;
                    if (item.subtotalBeforeDiscount && item.subtotalBeforeDiscount > 0) {
                        itemGross = item.subtotalBeforeDiscount;
                    } else if (item.originalPrice && item.originalPrice > 0) {
                        itemGross = item.originalPrice * item.qty;
                    } else {
                        const fullAmt = payoutInfo ? (payoutInfo.originalAmount || payoutInfo.amount) : 0;
                        itemGross = fullAmt / (orderIdCounts[item.orderId] || 1);
                    }
                    sumGross += itemGross;
                    uniqueOrderIds.add(item.orderId);
                }
            });
            displayGross = sumGross;
            displayOrders = uniqueOrderIds.size;
        }

        const aov = displayOrders > 0 ? displayGross / displayOrders : 0;

        // Calculate needed daily average
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const remainingDays = Math.max(1, daysInMonth - today.getDate());

        const remainingTarget = Math.max(0, targetRevenue - totalNet);
        const dailyNeeded = remainingTarget / remainingDays;

        // Set UI text content
        kpiTargetRev.textContent = formatRupiah(targetRevenue);
        kpiTargetPct.textContent = `Progress: ${targetPct.toFixed(1)}%`;
        kpiGrossRev.textContent = formatRupiah(displayGross);
        kpiOrderCount.textContent = `Total: ${displayOrders} Order`;
        kpiNetRev.textContent = formatRupiah(totalPayout);
        
        let subtext = `Omset Net: ${formatRupiah(totalNet)} | Admin: -${formatRupiah(totalAdminFees)} | Iklan: -${formatRupiah(totalAdsSpend)}`;
        if (totalAdjustments > 0) {
            subtext += ` | Penyesuaian: +${formatRupiah(totalAdjustments)}`;
        }
        kpiVoucherDeduction.textContent = subtext;
        
        // Render Net Profit Card dynamically
        const activeHpp = totalHppFromLogs > 0 ? totalHppFromLogs : monthlyHpp;
        if (cardNetProfit && kpiNetProfit && kpiNetProfitSubtext) {
            if (activeHpp > 0) {
                cardNetProfit.style.display = 'flex';
                const netProfitVal = totalPayout - activeHpp;
                kpiNetProfit.textContent = formatRupiah(netProfitVal);
                
                if (netProfitVal < 0) {
                    kpiNetProfit.style.color = 'var(--accent-pink)';
                } else {
                    kpiNetProfit.style.color = 'var(--accent-green)';
                }
                
                const marginPctVal = displayGross > 0 ? (netProfitVal / displayGross) * 100 : 0;
                kpiNetProfitSubtext.textContent = `HPP: ${formatRupiah(activeHpp)} | Margin Bersih: ${marginPctVal.toFixed(1)}%`;
            } else {
                cardNetProfit.style.display = 'none';
            }
        }
        
        kpiAov.textContent = formatRupiah(aov);

        const dailyAvgVal = revenueLogs.length > 0 ? displayGross / revenueLogs.length : 0;
        kpiDailyAvg.textContent = `Rata-rata Harian: ${formatRupiah(dailyAvgVal)}`;

        // Progress ring rendering
        targetProgressText.textContent = `${Math.min(100, Math.round(targetPct))}%`;
        
        // Progress ring circumference math: 2 * Math.PI * r = 2 * 3.14159 * 70 = 439.82
        const strokeDashOffset = 439.82 - (Math.min(100, targetPct) / 100) * 439.82;
        targetProgressBar.style.strokeDashoffset = strokeDashOffset;

        targetRemainingValue.textContent = formatRupiah(remainingTarget);
        if (remainingTarget > 0) {
            targetNeededDaily.textContent = `Butuh ${formatRupiah(dailyNeeded)} / hari untuk mencapai target`;
            targetNeededDaily.style.color = 'var(--accent-cyan)';
        } else {
            targetNeededDaily.textContent = `Target Bulanan Tercapai! 🎉`;
            targetNeededDaily.style.color = 'var(--accent-green)';
        }

        renderChannelAnalysis(totalNet);

        // Update Rincian Laba Rugi Table
        const pnlGross = document.getElementById('pnl-gross-rev');
        const pnlVoucher = document.getElementById('pnl-voucher-deduction');
        const pnlVoucherPct = document.getElementById('pnl-voucher-pct');
        const pnlRefund = document.getElementById('pnl-refund-deduction');
        const pnlRefundPct = document.getElementById('pnl-refund-pct');
        const pnlNetRevText = document.getElementById('pnl-net-rev');
        const pnlNetRevPctText = document.getElementById('pnl-net-rev-pct');
        const pnlAdmin = document.getElementById('pnl-admin-fees');
        const pnlAdminPct = document.getElementById('pnl-admin-pct');
        const pnlAds = document.getElementById('pnl-ads-spend');
        const pnlAdsPct = document.getElementById('pnl-ads-pct');
        const pnlPayout = document.getElementById('pnl-net-payout');
        const pnlPayoutPct = document.getElementById('pnl-payout-pct');
        const pnlHpp = document.getElementById('pnl-total-hpp');
        const pnlHppPct = document.getElementById('pnl-hpp-pct');
        const pnlNetProfitText = document.getElementById('pnl-net-profit');
        const pnlNetProfitPctText = document.getElementById('pnl-net-profit-pct');

        if (pnlGross) pnlGross.textContent = formatRupiah(displayGross);
        
        const pctDenom = displayGross > 0 ? displayGross : 1;
        const displayVouchers = Math.max(0, displayGross - totalNet - totalRefunds);
        
        if (pnlVoucher) pnlVoucher.textContent = `-${formatRupiah(displayVouchers)}`;
        if (pnlVoucherPct) pnlVoucherPct.textContent = `${((displayVouchers / pctDenom) * 100).toFixed(1)}%`;
        
        if (pnlRefund) pnlRefund.textContent = `-${formatRupiah(totalRefunds)}`;
        if (pnlRefundPct) pnlRefundPct.textContent = `${((totalRefunds / pctDenom) * 100).toFixed(1)}%`;
        
        if (pnlNetRevText) pnlNetRevText.textContent = formatRupiah(totalNet);
        if (pnlNetRevPctText) pnlNetRevPctText.textContent = `${((totalNet / pctDenom) * 100).toFixed(1)}%`;
        
        if (pnlAdmin) pnlAdmin.textContent = `-${formatRupiah(totalAdminFees)}`;
        if (pnlAdminPct) pnlAdminPct.textContent = `${((totalAdminFees / pctDenom) * 100).toFixed(1)}%`;
        
        if (pnlAds) pnlAds.textContent = `-${formatRupiah(totalAdsSpend)}`;
        if (pnlAdsPct) pnlAdsPct.textContent = `${((totalAdsSpend / pctDenom) * 100).toFixed(1)}%`;
        
        if (pnlPayout) pnlPayout.textContent = formatRupiah(totalPayout);
        if (pnlPayoutPct) pnlPayoutPct.textContent = `${((totalPayout / pctDenom) * 100).toFixed(1)}%`;
        
        if (pnlHpp) pnlHpp.textContent = `-${formatRupiah(activeHpp)}`;
        if (pnlHppPct) pnlHppPct.textContent = `${((activeHpp / pctDenom) * 100).toFixed(1)}%`;
        
        const finalNetProfitVal = totalPayout - activeHpp;
        if (pnlNetProfitText) {
            pnlNetProfitText.textContent = formatRupiah(finalNetProfitVal);
            if (finalNetProfitVal < 0) {
                pnlNetProfitText.style.color = 'var(--accent-pink)';
            } else {
                pnlNetProfitText.style.color = 'var(--accent-green)';
            }
        }
        if (pnlNetProfitPctText) {
            const netProfitPctVal = ((finalNetProfitVal / pctDenom) * 100).toFixed(1);
            pnlNetProfitPctText.textContent = `${netProfitPctVal}%`;
            if (finalNetProfitVal < 0) {
                pnlNetProfitPctText.style.color = 'var(--accent-pink)';
            } else {
                pnlNetProfitPctText.style.color = 'var(--accent-green)';
            }
        }
    }

    function renderDailyLogs() {
        logsTableBody.innerHTML = '';

        const filteredLogs = [...revenueLogs].filter(log => log.date.startsWith(analysisMonth));
        
        if (filteredLogs.length === 0) {
            logsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-gray" style="padding: 15px;">Belum ada catatan transaksi harian untuk bulan analisis yang dipilih. Silakan isi form di sebelah kiri atau unggah file.</td>
                </tr>
            `;
            return;
        }

        // Sort reverse chronological
        const sortedLogs = filteredLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedLogs.forEach(log => {
            const tr = document.createElement('tr');
            
            const d = new Date(log.date);
            const formattedDate = !isNaN(d.getTime()) ? d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : log.date;

            const netProfit = log.gross - log.refunds - (log.vouchers || 0) - (log.adminFees || 0) - (log.adsSpend || 0) + (log.adjustments || 0);

            tr.innerHTML = `
                <td><strong>${formattedDate}</strong></td>
                <td style="text-align: right;">${formatRupiah(log.gross)}</td>
                <td style="text-align: right; color: var(--accent-pink);">${log.refunds > 0 ? '-' + formatRupiah(log.refunds) : 'Rp 0'}</td>
                <td style="text-align: right; color: var(--accent-orange);">${log.vouchers > 0 ? '-' + formatRupiah(log.vouchers) : 'Rp 0'}</td>
                <td style="text-align: right; font-weight: bold; color: var(--accent-green);">${formatRupiah(netProfit)}</td>
                <td style="text-align: right;">${log.orders} pcs</td>
                <td>
                    <div class="action-btn-group">
                        <button class="btn-icon btn-icon-edit btn-edit-log" data-id="${log.id}" title="Edit Catatan"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon btn-icon-delete btn-delete-log" data-id="${log.id}" title="Hapus Catatan"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            logsTableBody.appendChild(tr);
        });

        // Attach event listeners
        document.querySelectorAll('.btn-edit-log').forEach(btn => {
            btn.addEventListener('click', () => {
                const logId = btn.getAttribute('data-id');
                const log = revenueLogs.find(x => x.id === logId);
                if (log) {
                    document.getElementById('log-id').value = log.id;
                    document.getElementById('log-date').value = log.date;
                    document.getElementById('log-orders').value = log.orders;
                    document.getElementById('log-gross').value = log.gross;
                    document.getElementById('log-refunds').value = log.refunds;
                    document.getElementById('log-vouchers').value = log.vouchers || 0;
                    document.getElementById('log-admin-fees').value = log.adminFees || 0;
                    document.getElementById('log-ads-spend').value = log.adsSpend || 0;
                    document.getElementById('log-hpp').value = log.hpp || 0;
                    document.getElementById('log-adjustments').value = log.adjustments || 0;
                    
                    document.getElementById('pct-ads').value = log.channels.ads;
                    document.getElementById('pct-affiliate').value = log.channels.affiliate;
                    document.getElementById('pct-live').value = log.channels.live;
                    document.getElementById('pct-video').value = log.channels.video;

                    formTitle.textContent = 'Edit Catatan Harian';
                    document.getElementById('btn-save-log').innerHTML = '<i class="fas fa-save"></i> Perbarui Catatan';
                    btnCancelEdit.style.display = 'block';
                    
                    // Scroll to form
                    document.querySelector('.simulator-controls').scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        document.querySelectorAll('.btn-delete-log').forEach(btn => {
            btn.addEventListener('click', () => {
                const logId = btn.getAttribute('data-id');
                if (confirm('Apakah Anda yakin ingin menghapus catatan harian ini?')) {
                    revenueLogs = revenueLogs.filter(x => x.id !== logId);
                    saveLogsToStorage();
                    renderDailyLogs();
                    calculateMetrics();
                    updateCharts();
                    showToast('Catatan harian berhasil dihapus.', 'success');
                }
            });
        });
    }

    function renderWithdrawals() {
        const container = document.getElementById('card-withdrawals');
        const tbody = document.getElementById('withdrawals-table-body');
        const totalBadge = document.getElementById('total-withdrawn-badge');

        if (!container || !tbody) return;

        if (withdrawalsList.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        tbody.innerHTML = '';

        let totalSum = 0;
        const sorted = [...withdrawalsList].sort((a, b) => new Date(b.date) - new Date(a.date));

        sorted.forEach(w => {
            totalSum += w.amount;
            const tr = document.createElement('tr');
            
            const d = new Date(w.date);
            const formattedDate = !isNaN(d.getTime()) ? d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : w.date;

            tr.innerHTML = `
                <td style="padding: 10px; border-bottom: 1px solid var(--border-color);">${formattedDate}</td>
                <td style="padding: 10px; border-bottom: 1px solid var(--border-color); color: var(--text-muted); font-size: 12px;">${w.refId}</td>
                <td style="padding: 10px; border-bottom: 1px solid var(--border-color); text-align: right; font-weight: bold; color: var(--accent-green);">Rp ${w.amount.toLocaleString('id-ID')}</td>
                <td style="padding: 10px; border-bottom: 1px solid var(--border-color); text-align: center; color: var(--accent-cyan);">${w.bank}</td>
                <td style="padding: 10px; border-bottom: 1px solid var(--border-color); text-align: center;"><span class="badge" style="background: rgba(0, 255, 135, 0.1); color: var(--accent-green); padding: 2px 6px; border-radius: 4px; font-size: 11px;">${w.status}</span></td>
            `;
            tbody.appendChild(tr);
        });

        totalBadge.textContent = `Total Cair: Rp ${totalSum.toLocaleString('id-ID')}`;
    }

    // Submit daily log
    if (revenueLogForm) {
        revenueLogForm.addEventListener('submit', (e) => {
            e.preventDefault();

            try {
                const logId = document.getElementById('log-id').value;
                const dateVal = document.getElementById('log-date').value;
                const ordersVal = parseInt(document.getElementById('log-orders').value);
                const grossVal = parseFloat(document.getElementById('log-gross').value);
                const refundsVal = parseFloat(document.getElementById('log-refunds').value) || 0;
                const vouchersVal = parseFloat(document.getElementById('log-vouchers').value) || 0;
                const adminFeesVal = parseFloat(document.getElementById('log-admin-fees').value) || 0;
                const adsSpendVal = parseFloat(document.getElementById('log-ads-spend').value) || 0;
                const hppVal = parseFloat(document.getElementById('log-hpp').value) || 0;
                const adjustmentsVal = parseFloat(document.getElementById('log-adjustments').value) || 0;

                const pctAds = parseInt(document.getElementById('pct-ads').value) || 0;
                const pctAff = parseInt(document.getElementById('pct-affiliate').value) || 0;
                const pctLive = parseInt(document.getElementById('pct-live').value) || 0;
                const pctVid = parseInt(document.getElementById('pct-video').value) || 0;

                if (!dateVal || isNaN(ordersVal) || isNaN(grossVal)) {
                    showToast('Harap isi semua kolom wajib!', 'error');
                    return;
                }

                if (pctAds + pctAff + pctLive + pctVid !== 100) {
                    showToast(`Total breakdown persentase harus tepat 100%! (Saat ini: ${pctAds + pctAff + pctLive + pctVid}%)`, 'error');
                    return;
                }

                const logEntry = {
                    id: logId || 'log_' + Date.now(),
                    date: dateVal,
                    orders: ordersVal,
                    gross: grossVal,
                    refunds: refundsVal,
                    vouchers: vouchersVal,
                    adminFees: adminFeesVal,
                    adsSpend: adsSpendVal,
                    hpp: hppVal,
                    adjustments: adjustmentsVal,
                    channels: {
                        ads: pctAds,
                        affiliate: pctAff,
                        live: pctLive,
                        video: pctVid
                    }
                };

                if (logId) {
                    // Update
                    revenueLogs = revenueLogs.map(x => x.id === logId ? logEntry : x);
                    showToast('Catatan harian berhasil diperbarui!', 'success');
                } else {
                    // Create
                    // Prevent duplicate dates
                    const duplicate = revenueLogs.find(x => x.date === dateVal);
                    if (duplicate) {
                        showToast('Catatan untuk tanggal ini sudah ada! Edit catatan yang sudah ada untuk memperbarui.', 'error');
                        return;
                    }
                    revenueLogs.push(logEntry);
                    showToast('Catatan harian berhasil disimpan!', 'success');
                }

                saveLogsToStorage();
                resetForm();
                renderDailyLogs();
                calculateMetrics();
                updateCharts();
            } catch (err) {
                console.error(err);
                showToast('Gagal memproses catatan: ' + err.message, 'error');
            }
        });
    }

    function resetForm() {
        document.getElementById('log-id').value = '';
        document.getElementById('log-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('log-orders').value = '';
        document.getElementById('log-gross').value = '';
        document.getElementById('log-refunds').value = '0';
        document.getElementById('log-vouchers').value = '0';
        document.getElementById('log-admin-fees').value = '0';
        document.getElementById('log-ads-spend').value = '0';
        document.getElementById('log-hpp').value = '0';
        document.getElementById('log-adjustments').value = '0';
        document.getElementById('pct-ads').value = '30';
        document.getElementById('pct-affiliate').value = '25';
        document.getElementById('pct-live').value = '25';
        document.getElementById('pct-video').value = '20';

        formTitle.textContent = 'Pencatatan Omset Harian';
        document.getElementById('btn-save-log').innerHTML = '<i class="fas fa-save"></i> Simpan Catatan';
        btnCancelEdit.style.display = 'none';
    }

    if (btnCancelEdit) {
        btnCancelEdit.addEventListener('click', resetForm);
    }

    // ------------------------------------------
    // Channels analysis render
    // ------------------------------------------
    function renderChannelAnalysis(totalNet) {
        if (!channelsCardsContainer) return;
        
        let adsNetTotal = 0;
        let affNetTotal = 0;
        let liveNetTotal = 0;
        let videoNetTotal = 0;
        
        let totalOrders = 0;
        let adsOrders = 0;
        let affOrders = 0;
        let liveOrders = 0;
        let videoOrders = 0;

        revenueLogs.forEach(log => {
            const net = log.gross - log.refunds - (log.vouchers || 0);
            
            adsNetTotal += net * (log.channels.ads / 100);
            affNetTotal += net * (log.channels.affiliate / 100);
            liveNetTotal += net * (log.channels.live / 100);
            videoNetTotal += net * (log.channels.video / 100);

            totalOrders += log.orders;
            adsOrders += log.orders * (log.channels.ads / 100);
            affOrders += log.orders * (log.channels.affiliate / 100);
            liveOrders += log.orders * (log.channels.live / 100);
            videoOrders += log.orders * (log.channels.video / 100);
        });

        const channels = [
            { name: 'TikTok Shop Ads', icon: 'fas fa-ad', net: adsNetTotal, orders: adsOrders, color: 'var(--accent-pink)', bg: 'rgba(254, 44, 85, 0.1)' },
            { name: 'TikTok Shop Affiliate', icon: 'fas fa-users-cog', net: affNetTotal, orders: affOrders, color: 'var(--accent-cyan)', bg: 'rgba(37, 244, 238, 0.1)' },
            { name: 'Live Shopping Organic', icon: 'fas fa-video', net: liveNetTotal, orders: liveOrders, color: 'var(--accent-green)', bg: 'rgba(0, 255, 135, 0.1)' },
            { name: 'Video & Showcase Organic', icon: 'fas fa-play', net: videoNetTotal, orders: videoOrders, color: 'var(--accent-orange)', bg: 'rgba(255, 170, 0, 0.1)' }
        ];

        channelsCardsContainer.innerHTML = '';
        channels.forEach(ch => {
            const pct = totalNet > 0 ? (ch.net / totalNet) * 100 : 0;
            const aov = ch.orders > 0 ? ch.net / ch.orders : 0;
            
            const card = document.createElement('div');
            card.className = 'kpi-card card';
            card.innerHTML = `
                <div class="kpi-icon-container" style="background: ${ch.bg}; color: ${ch.color};">
                    <i class="${ch.icon}"></i>
                </div>
                <div class="kpi-content" style="width: 100%;">
                    <span class="kpi-label">${ch.name}</span>
                    <span class="kpi-value">${formatRupiah(ch.net)}</span>
                    <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 11px; color: var(--text-muted);">
                        <span>Share: ${pct.toFixed(1)}%</span>
                        <span>AOV: ${formatRupiah(aov)}</span>
                    </div>
                </div>
            `;
            channelsCardsContainer.appendChild(card);
        });

        generateChannelRecommendations(channels, totalNet);
    }

    function generateChannelRecommendations(channels, totalNet) {
        if (!channelRecommendationsList) return;
        channelRecommendationsList.innerHTML = '';

        if (totalNet === 0) {
            channelRecommendationsList.innerHTML = `
                <div class="card text-center py-4 text-gray" style="font-size: 13px; color: var(--text-muted);">
                    Belum ada data untuk menghasilkan rekomendasi. Silakan isi catatan harian terlebih dahulu.
                </div>
            `;
            return;
        }

        const recommendations = [];

        // Analysis 1: Ads dependency
        const adsData = channels.find(c => c.name.includes('Ads'));
        const adsPct = (adsData.net / totalNet) * 100;
        if (adsPct > 50) {
            recommendations.push({
                type: 'critical',
                tag: 'Kritikal - Kebergantungan Ads',
                title: 'Omset Toko Terlalu Bergantung pada Iklan TikTok Shop Ads',
                desc: `Sebesar ${adsPct.toFixed(1)}% dari total omset bersih Anda disumbangkan oleh iklan Ads. Hal ini sangat berisiko bagi margin keuntungan Anda jika biaya bid iklan naik. Rekomendasi: Tingkatkan aktivitas Live Streaming organik dan buat video konten terjadwal minimal 3x sehari untuk mendiversifikasi sumber trafik toko.`
            });
        }

        // Analysis 2: Organic live share
        const liveData = channels.find(c => c.name.includes('Live'));
        const livePct = (liveData.net / totalNet) * 100;
        if (livePct < 15) {
            recommendations.push({
                type: 'warning',
                tag: 'Peringatan - Live Organic Rendah',
                title: 'Kontribusi Live Shopping Organik Kurang Maksimal',
                desc: `Live Shopping menyumbang kurang dari 15% dari total omset (${livePct.toFixed(1)}%). Padahal, Live Shopping adalah pendorong omset terbesar di TikTok Shop dengan biaya rendah. Rekomendasi: Latih host internal atau hire host berpengalaman, lakukan live rutin minimal 4 jam sehari pada prime time (jam 19.00 - 23.00).`
            });
        }

        // Analysis 3: Affiliate leverage
        const affData = channels.find(c => c.name.includes('Affiliate'));
        const affPct = (affData.net / totalNet) * 100;
        if (affPct < 10) {
            recommendations.push({
                type: 'good',
                tag: 'Saran - Potensi Afiliasi',
                title: 'Manfaatkan Leverage Creator / Afiliasi TikTok',
                desc: `Afiliasi menyumbang porsi kecil (${affPct.toFixed(1)}%). Rekomendasi: Buat rencana komisi terbuka (Open Commission) sebesar 10% - 15% untuk kreator pemula, lalu kirim sampel gratis (Free Sample) ke kreator yang memiliki CTR & interaksi tinggi di niche produk Anda.`
            });
        } else {
            recommendations.push({
                type: 'good',
                tag: 'Sukses - Leveraged Toko',
                title: 'Leverage Afiliasi Berjalan dengan Sangat Baik',
                desc: `Afiliasi berkontribusi sebesar ${affPct.toFixed(1)}% terhadap total omset. Ini sangat baik karena Anda memanfaatkan kreativitas kreator lain untuk mendulang penjualan tanpa harus membiayai iklan sendiri secara langsung.`
            });
        }

        recommendations.forEach(rec => {
            const div = document.createElement('div');
            div.className = 'recommendation-item';
            
            let badgeClass = 'badge-cyan';
            let badgeStyle = 'background: rgba(37, 244, 238, 0.15); color: var(--accent-cyan); border: 1px solid var(--accent-cyan);';
            if (rec.type === 'critical') {
                badgeClass = 'badge-pink';
                badgeStyle = 'background: rgba(254, 44, 85, 0.15); color: var(--accent-pink); border: 1px solid var(--accent-pink);';
            } else if (rec.type === 'good') {
                badgeClass = 'badge-green';
                badgeStyle = 'background: rgba(0, 255, 135, 0.15); color: var(--accent-green); border: 1px solid var(--accent-green);';
            }

            div.innerHTML = `
                <div class="recommendation-header">
                    <span style="color: #FFF; font-weight: 600;">${rec.title}</span>
                    <span class="badge ${badgeClass}" style="${badgeStyle}">${rec.tag}</span>
                </div>
                <div style="color: var(--text-secondary); line-height: 1.4; margin-top: 4px;">${rec.desc}</div>
            `;
            channelRecommendationsList.appendChild(div);
        });
    }

    // ------------------------------------------
    // Chart.js render methods
    // ------------------------------------------
    function updateCharts() {
        try {
            const trendCanvas = document.getElementById('chart-revenue-trend');
            const donutCanvas = document.getElementById('chart-channel-donut');
            
            if (!trendCanvas || !donutCanvas) return;

            const isLight = document.body.classList.contains('light-theme');
            const textColor = isLight ? '#64748B' : '#90A0B7';
            const gridColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)';
            const donutBorderColor = isLight ? '#FFFFFF' : '#0A0D14';

            // Destroy previous instances
            if (typeof revenueTrendChart !== 'undefined' && revenueTrendChart) revenueTrendChart.destroy();
            if (typeof channelDonutChart !== 'undefined' && channelDonutChart) channelDonutChart.destroy();

            // Prepare chart data
            const filteredLogs = [...revenueLogs].filter(log => log.date.startsWith(analysisMonth));
            const sortedLogs = filteredLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
            const labels = sortedLogs.map(log => {
                const d = new Date(log.date);
                return !isNaN(d.getTime()) ? d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }) : log.date;
            });
            const grossData = sortedLogs.map(log => log.gross);
            const netData = sortedLogs.map(log => log.gross - log.refunds - (log.vouchers || 0));

            // Chart 1: Line Chart
            revenueTrendChart = new Chart(trendCanvas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Omset Kotor',
                            data: grossData,
                            borderColor: '#25F4EE',
                            backgroundColor: 'rgba(37, 244, 238, 0.05)',
                            borderWidth: 2,
                            tension: 0.3,
                            fill: true
                        },
                        {
                            label: 'Omset Bersih Riil',
                            data: netData,
                            borderColor: '#00FF87',
                            backgroundColor: 'rgba(0, 255, 135, 0.05)',
                            borderWidth: 2,
                            tension: 0.3,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: textColor, font: { family: 'Outfit', size: 11 } } }
                    },
                    scales: {
                        x: { ticks: { color: textColor, font: { family: 'Outfit' } }, grid: { color: gridColor } },
                        y: { 
                            ticks: { 
                                color: textColor, 
                                font: { family: 'Outfit' },
                                callback: value => 'Rp ' + (value >= 1e6 ? (value/1e6).toFixed(1) + 'jt' : (value/1e3).toFixed(0) + 'rb')
                            }, 
                            grid: { color: gridColor } 
                        }
                    }
                }
            });

            // Calculate Channel distribution amounts for Donut Chart
            let adsTotal = 0;
            let affTotal = 0;
            let liveTotal = 0;
            let videoTotal = 0;

            filteredLogs.forEach(log => {
                const net = log.gross - log.refunds - (log.vouchers || 0);
                adsTotal += net * (log.channels.ads / 100);
                affTotal += net * (log.channels.affiliate / 100);
                liveTotal += net * (log.channels.live / 100);
                videoTotal += net * (log.channels.video / 100);
            });

            const hasData = (adsTotal + affTotal + liveTotal + videoTotal) > 0;

            // Chart 2: Donut Chart
            channelDonutChart = new Chart(donutCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['Ads', 'Affiliate', 'Live Shopping', 'Video Organic'],
                    datasets: [{
                        data: hasData ? [adsTotal, affTotal, liveTotal, videoTotal] : [25, 25, 25, 25],
                        backgroundColor: hasData ? ['#FE2C55', '#25F4EE', '#00FF87', '#FFAA00'] : ['#2A2F3D', '#222530', '#1C1F28', '#14161C'],
                        borderWidth: 2,
                        borderColor: donutBorderColor
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: textColor, font: { family: 'Outfit', size: 10 } }
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Error rendering ChartJS:', err);
        }
    }

    // ------------------------------------------
    // Export and Import Full Backup
    // ------------------------------------------
    if (btnExportFullBackup) {
        btnExportFullBackup.addEventListener('click', () => {
            try {
                const dbBackup = {
                    revenueLogs: revenueLogs,
                    targetRevenue: targetRevenue,
                    shopName: shopName,
                    shopLogoBase64: localStorage.getItem('shop_logo_base64') || null,
                    withdrawals: withdrawalsList
                };

                const jsonStr = JSON.stringify(dbBackup, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", url);
                downloadAnchorNode.setAttribute("download", `cadangan_omset_toko_${Date.now()}.json`);
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
                URL.revokeObjectURL(url);

                showToast('Cadangan data omset berhasil diunduh!', 'success');
            } catch (err) {
                console.error('Error exporting backup:', err);
                showToast('Gagal mencadangkan data: ' + err.message, 'error');
            }
        });
    }

    if (inputFullBackupFile) {
        inputFullBackupFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const importedData = JSON.parse(evt.target.result);
                    if (!importedData) {
                        showToast('Format file cadangan tidak valid!', 'error');
                        return;
                    }

                    let logsToImport = null;
                    if (Array.isArray(importedData)) {
                        logsToImport = importedData;
                    } else if (typeof importedData === 'object' && Array.isArray(importedData.revenueLogs)) {
                        logsToImport = importedData.revenueLogs;
                    }

                    if (logsToImport) {
                        localStorage.setItem('tiktok_revenue_logs', JSON.stringify(logsToImport));
                    } else {
                        showToast('Format data omset tidak ditemukan di file!', 'error');
                        return;
                    }

                    if (typeof importedData === 'object') {
                        if (importedData.targetRevenue) {
                            localStorage.setItem('tiktok_target_revenue', importedData.targetRevenue.toString());
                        }
                        if (importedData.shopName) {
                            localStorage.setItem('shop_name', importedData.shopName);
                        }
                        if (importedData.shopLogoBase64) {
                            localStorage.setItem('shop_logo_base64', importedData.shopLogoBase64);
                        } else {
                            localStorage.removeItem('shop_logo_base64');
                        }
                        if (Array.isArray(importedData.withdrawals)) {
                            localStorage.setItem('tiktok_withdrawals', JSON.stringify(importedData.withdrawals));
                        } else {
                            localStorage.removeItem('tiktok_withdrawals');
                        }
                    }

                    showToast('Seluruh data omset berhasil dipulihkan! Memuat ulang...', 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } catch (err) {
                    console.error('Error importing backup:', err);
                    showToast('Gagal memulihkan data: ' + err.message, 'error');
                }
            };
            reader.readAsText(file);
        });
    }

    // ------------------------------------------
    // Export CSV of Daily Logs
    // ------------------------------------------
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', () => {
            if (revenueLogs.length === 0) {
                showToast('Belum ada data untuk diekspor!', 'error');
                return;
            }

            try {
                let csvContent = "Tanggal,Omset Kotor,Nilai Retur/Refund,Diskon Voucher,Omset Bersih,Jumlah Order,Ads %,Affiliate %,Live Shopping %,Video Organic %\n";
                
                const filteredLogs = [...revenueLogs].filter(log => log.date.startsWith(analysisMonth));
                filteredLogs.forEach(log => {
                    const net = log.gross - log.refunds - (log.vouchers || 0);
                    csvContent += `${log.date},${log.gross},${log.refunds},${log.vouchers || 0},${net},${log.orders},${log.channels.ads},${log.channels.affiliate},${log.channels.live},${log.channels.video}\n`;
                });

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", url);
                downloadAnchorNode.setAttribute("download", `riwayat_omset_toko_${analysisMonth}_${Date.now()}.csv`);
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
                URL.revokeObjectURL(url);

                showToast('Ekspor CSV berhasil diunduh!', 'success');
            } catch (err) {
                console.error(err);
                showToast('Gagal mengekspor CSV: ' + err.message, 'error');
            }
        });
    }

    // ------------------------------------------
    // PDF Printing Reports
    // ------------------------------------------
    function populatePrintShopInfo() {
        document.getElementById('print-shop-name').textContent = shopName;
        document.getElementById('print-report-date').textContent = 'Tanggal Cetak: ' + new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        const printLogoContainer = document.getElementById('print-shop-logo');
        if (currentLogoBase64) {
            printLogoContainer.innerHTML = `<img src="${currentLogoBase64}" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
            printLogoContainer.innerHTML = `<i class="fas fa-store" style="font-size: 24px; color: #333;"></i>`;
        }
    }

    if (btnPrintDashboard) {
        btnPrintDashboard.addEventListener('click', () => {
            if (revenueLogs.length === 0) {
                showToast('Belum ada data transaksi untuk dicetak!', 'error');
                return;
            }

            try {
                populatePrintShopInfo();

                // Calculate KPI Totals
                let totalGross = 0;
                let totalRefunds = 0;
                let totalVouchers = 0;
                let totalOrders = 0;

                const filteredLogs = [...revenueLogs].filter(log => log.date.startsWith(analysisMonth));
                filteredLogs.forEach(log => {
                    totalGross += log.gross;
                    totalRefunds += log.refunds;
                    totalVouchers += (log.vouchers || 0);
                    totalOrders += log.orders;
                });
                const totalNet = totalGross - totalRefunds - totalVouchers;
                const targetPct = targetRevenue > 0 ? (totalNet / targetRevenue) * 100 : 0;
                const aov = totalOrders > 0 ? totalGross / totalOrders : 0;

                // Populate KPI elements in print layout
                const printKpiRow = document.getElementById('print-kpi-row');
                printKpiRow.innerHTML = `
                    <div style="border: 1px solid #ddd; padding: 12px; border-radius: 6px;">
                        <div style="font-size: 10px; color: #666; text-transform: uppercase;">Target Bulanan</div>
                        <div style="font-size: 16px; font-weight: bold; margin-top: 5px;">${formatRupiah(targetRevenue)}</div>
                        <div style="font-size: 10px; color: #444; margin-top: 2px;">Tercapai: ${targetPct.toFixed(1)}%</div>
                    </div>
                    <div style="border: 1px solid #ddd; padding: 12px; border-radius: 6px;">
                        <div style="font-size: 10px; color: #666; text-transform: uppercase;">Omset Kotor (Gross)</div>
                        <div style="font-size: 16px; font-weight: bold; margin-top: 5px;">${formatRupiah(totalGross)}</div>
                        <div style="font-size: 10px; color: #444; margin-top: 2px;">Dari ${totalOrders} order</div>
                    </div>
                    <div style="border: 1px solid #ddd; padding: 12px; border-radius: 6px; background-color: #f5fdf5;">
                        <div style="font-size: 10px; color: #666; text-transform: uppercase; font-weight: bold;">Omset Bersih Riil</div>
                        <div style="font-size: 16px; font-weight: bold; margin-top: 5px; color: #008744;">${formatRupiah(totalNet)}</div>
                        <div style="font-size: 10px; color: #008744; margin-top: 2px;">Voucher/Retur: -${formatRupiah(totalRefunds + totalVouchers)}</div>
                    </div>
                    <div style="border: 1px solid #ddd; padding: 12px; border-radius: 6px;">
                        <div style="font-size: 10px; color: #666; text-transform: uppercase;">Average Order Value</div>
                        <div style="font-size: 16px; font-weight: bold; margin-top: 5px;">${formatRupiah(aov)}</div>
                    </div>
                `;

                // Add print summary of logs
                const printTableBody = document.getElementById('print-table-body');
                printTableBody.innerHTML = '';
                const sortedLogs = [...filteredLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
                sortedLogs.forEach(log => {
                    const net = log.gross - log.refunds - (log.vouchers || 0);
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td style="padding: 6px; border-bottom: 1px solid #ddd;">${log.date}</td>
                        <td style="padding: 6px; text-align: right; border-bottom: 1px solid #ddd;">${formatRupiah(log.gross)}</td>
                        <td style="padding: 6px; text-align: right; border-bottom: 1px solid #ddd; color: #d62d20;">${formatRupiah(log.refunds)}</td>
                        <td style="padding: 6px; text-align: right; border-bottom: 1px solid #ddd; color: #FFAA00;">${formatRupiah(log.vouchers || 0)}</td>
                        <td style="padding: 6px; text-align: right; border-bottom: 1px solid #ddd; font-weight: bold; color: #008744;">${formatRupiah(net)}</td>
                        <td style="padding: 6px; text-align: right; border-bottom: 1px solid #ddd;">${log.orders} pcs</td>
                    `;
                    printTableBody.appendChild(tr);
                });

                document.getElementById('print-section-history').style.display = 'block';

                showToast('Membuka dialog pencetakan laporan bulanan...', 'info');
                setTimeout(() => {
                    window.print();
                }, 500);
            } catch (err) {
                console.error(err);
                showToast('Gagal memicu cetak: ' + err.message, 'error');
            }
        });
    }

    if (btnPrintLogs) {
        btnPrintLogs.addEventListener('click', () => {
            if (revenueLogs.length === 0) {
                showToast('Belum ada data untuk dicetak!', 'error');
                return;
            }
            // Delegate directly to dashboard print which is a clean daily overview table report
            if (btnPrintDashboard) btnPrintDashboard.click();
        });
    }



    // ------------------------------------------
    // Excel TikTok Settlement Report File Parser
    // ------------------------------------------
    const inputExcelFile = document.getElementById('input-excel-file');
    const excelFileStatus = document.getElementById('excel-file-status');
    const excelParsePreview = document.getElementById('excel-parse-preview');
    const previewDetails = document.getElementById('preview-details');
    const btnConfirmExcelImport = document.getElementById('btn-confirm-excel-import');
    
    let tempParsedLogs = [];
    let tempParsedWithdrawals = [];
    let tempParsedGmvAds = {};

    if (inputExcelFile) {
        inputExcelFile.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (!files || files.length === 0) return;

            inputExcelFile.value = ''; // Reset input to allow selecting the same file again

            tempParsedOrderPayouts = {};
            tempParsedLogs = [];
            tempParsedWithdrawals = [];
            tempParsedGmvAds = {};

            const fileNames = files.map(f => f.name).join(', ');
            excelFileStatus.textContent = files.length > 1 ? `${files.length} file dipilih` : files[0].name;
            excelParsePreview.style.display = 'block';
            previewDetails.innerHTML = `<span style="color: var(--text-muted);"><i class="fas fa-spinner fa-spin mr-1"></i> Sedang menganalisis ${files.length} file Excel...</span>`;
            btnConfirmExcelImport.style.display = 'none';

            showToast(`Membaca ${files.length} file laporan keuangan...`, 'info');

            let filesProcessed = 0;
            const allDailyAggregates = {};

            function processNextFile(fileIndex) {
                if (fileIndex >= files.length) {
                    // All files processed — finalize
                    finalizeParsedData(allDailyAggregates);
                    return;
                }

                const file = files[fileIndex];
                const reader = new FileReader();
                reader.onload = function(evt) {
                    try {
                        const data = new Uint8Array(evt.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });

                        parseKeuanganWorkbook(workbook, allDailyAggregates, file.name);
                        filesProcessed++;

                        // Process next file
                        processNextFile(fileIndex + 1);
                    } catch (err) {
                        console.error('Error parsing excel:', err);
                        showToast(`Gagal membaca file ${file.name}: ${err.message}`, 'error');
                        processNextFile(fileIndex + 1); // Continue with next file
                    }
                };
                reader.readAsArrayBuffer(file);
            }

            processNextFile(0);
        });
    }

    // Recalculates the sheet range dynamically by scanning all keys to override incorrect !ref metadata
    function updateSheetRange(ws) {
        if (!ws) return;
        let minRow = Infinity, maxRow = -Infinity;
        let minCol = Infinity, maxCol = -Infinity;
        
        for (let key in ws) {
            if (key[0] === '!') continue;
            
            const match = key.match(/^([A-Z]+)(\d+)$/);
            if (match) {
                const colStr = match[1];
                const rowNum = parseInt(match[2], 10);
                
                let colNum = 0;
                for (let i = 0; i < colStr.length; i++) {
                    colNum = colNum * 26 + (colStr.charCodeAt(i) - 64);
                }
                
                if (rowNum < minRow) minRow = rowNum;
                if (rowNum > maxRow) maxRow = rowNum;
                if (colNum < minCol) minCol = colNum;
                if (colNum > maxCol) maxCol = colNum;
            }
        }
        
        if (maxRow !== -Infinity) {
            function colToLetter(col) {
                let temp, letter = '';
                while (col > 0) {
                    temp = (col - 1) % 26;
                    letter = String.fromCharCode(65 + temp) + letter;
                    col = (col - temp - 1) / 26;
                }
                return letter;
            }
            
            const rangeStr = `${colToLetter(minCol)}${minRow}:${colToLetter(maxCol)}${maxRow}`;
            ws['!ref'] = rangeStr;
        }
    }

    // Extracted Keuangan parsing logic into a reusable function
    function parseKeuanganWorkbook(workbook, allDailyAggregates, fileName) {

                    // Dynamic Multi-Sheet Scanner to automatically find the correct sheet & header row
                    let targetSheetName = '';
                    let jsonData = null;
                    let headerIndex = -1;
                    let bestHeaderMatchCount = 0;

                    for (let s = 0; s < workbook.SheetNames.length; s++) {
                        const sheetName = workbook.SheetNames[s];
                        const worksheet = workbook.Sheets[sheetName];
                        updateSheetRange(worksheet);
                        const currentJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        
                        if (!currentJson || currentJson.length < 2) continue;

                        for (let r = 0; r < Math.min(30, currentJson.length); r++) {
                            const row = currentJson[r];
                            if (row && Array.isArray(row)) {
                                let matchCount = 0;
                                row.forEach(cell => {
                                    if (cell === null || cell === undefined) return;
                                    const cellStr = cell.toString().toLowerCase().trim();
                                    if (cellStr.includes('id pesanan') || cellStr.includes('order id')) matchCount += 2;
                                    if (cellStr.includes('jenis transaksi') || cellStr.includes('transaction type')) matchCount += 2;
                                    if (cellStr.includes('waktu pemesanan') || cellStr.includes('waktu pembayaran') || cellStr.includes('date')) matchCount += 1;
                                    if (cellStr.includes('jumlah penyelesaian') || cellStr.includes('total pendapatan') || cellStr.includes('revenue') || cellStr.includes('payout')) matchCount += 1;
                                    if (cellStr.includes('diskon penjual') || cellStr.includes('voucher')) matchCount += 1;
                                });

                                if (matchCount > bestHeaderMatchCount) {
                                    bestHeaderMatchCount = matchCount;
                                    targetSheetName = sheetName;
                                    jsonData = currentJson;
                                    headerIndex = r;
                                }
                            }
                        }
                    }

                    if (bestHeaderMatchCount < 3 || !jsonData) {
                        previewDetails.innerHTML = `
                            <span style="color: var(--accent-pink); font-weight: bold;">❌ Format kolom tidak dikenali.</span><br>
                            <span style="font-size: 11px; color: var(--text-muted);">Format transaksi pesanan tidak ditemukan di lembar (sheet) mana pun. Pastikan Anda mengunggah file Laporan Penyelesaian Keuangan (Settlement Report) atau Detail Pesanan dari TikTok Seller Center.</span>
                        `;
                        showToast('Format kolom tidak dikenali!', 'error');
                        return;
                    }



                    const headers = jsonData[headerIndex].map(h => h ? h.toString().toLowerCase().trim() : '');
                    
                    function findColIdx(keywords, excludeKeywords = []) {
                        return headers.findIndex(h => {
                            if (!h) return false;
                            const match = keywords.some(k => h.includes(k));
                            if (!match) return false;
                            if (excludeKeywords.length > 0 && excludeKeywords.some(e => h.includes(e))) return false;
                            return true;
                        });
                    }

                    // Column mapping function (highly precise for TikTok Shop reports)
                    const colMap = {
                        orderId: findColIdx(['id pesanan', 'order id', 'id pesanan/penyesuaian']),
                        type: findColIdx(['jenis transaksi', 'transaction type', 'tipe', 'status']),
                        date: findColIdx(['waktu pembayaran pesanan', 'waktu pembayaran', 'tanggal pembayaran', 'payment time']) !== -1 
                            ? findColIdx(['waktu pembayaran pesanan', 'waktu pembayaran', 'tanggal pembayaran', 'payment time']) 
                            : findColIdx(['waktu pemesanan', 'tanggal pemesanan', 'date', 'tanggal']),
                        createdTime: findColIdx(['waktu pemesanan', 'tanggal pemesanan', 'created time', 'order date', 'order time']),
                        gross: findColIdx(['subtotal sebelum diskon', 'subtotal before discount', 'original price']) !== -1 
                            ? findColIdx(['subtotal sebelum diskon', 'subtotal before discount', 'original price']) 
                            : findColIdx(['jumlah penyelesaian', 'total pendapatan', 'pendapatan', 'gross']),
                        settlement: findColIdx(['jumlah penyelesaian pembayaran', 'jumlah penyelesaian', 'payout amount', 'settlement amount']),
                        voucher: findColIdx(['diskon penjual', 'seller discount', 'diskon voucher yang ditanggung penjual'], ['subtotal', 'pengembalian']),
                        refund: findColIdx(['pengembalian dana setelah diskon', 'refund after seller discount', 'subtotal pengembalian dana setelah diskon penjual']) !== -1 
                            ? findColIdx(['pengembalian dana setelah diskon', 'refund after seller discount', 'subtotal pengembalian dana setelah diskon penjual']) 
                            : findColIdx(['pengembalian dana sebelum diskon', 'refund before seller discount', 'subtotal pengembalian dana sebelum diskon penjual']) !== -1
                                ? findColIdx(['pengembalian dana sebelum diskon', 'refund before seller discount', 'subtotal pengembalian dana sebelum diskon penjual'])
                                : findColIdx(['pengembalian dana', 'refund', 'retur']),
                        adminFees: findColIdx(['total biaya', 'platform fee', 'biaya platform', 'admin fee'], ['ongkir', 'logistik', 'produk']),
                        ads: findColIdx(['biaya iklan gmv max', 'ads cost', 'biaya iklan gmv']),
                        affiliate: findColIdx(['komisi afiliasi', 'komisi mitra', 'affiliate', 'komisi']),
                        associatedOrderId: findColIdx(['id pesanan terkait', 'associated order id', 'id pesanan referensi', 'reference order id']),
                        
                        // Detail Columns
                        ongkir: findColIdx(['ongkir'], ['ongkir yang', 'pengembalian']),
                        komisiDinamis: findColIdx(['komisi dinamis']),
                        komisiAfiliasi: findColIdx(['komisi afiliasi']),
                        biayaKomisiPlatform: findColIdx(['biaya komisi platform']),
                        biayaLayananLogistik: findColIdx(['biaya layanan logistik']),
                        biayaPemrosesanPesanan: findColIdx(['biaya pemrosesan pesanan']),
                        biayaKomisiSebelumDiskon: findColIdx(['biaya komisi sebelum diskon']),
                        diskonBelanjaIklan: findColIdx(['diskon (dari belanja iklan)']),
                        biayaLayananCashbackBonus: findColIdx(['biaya layanan cashback bonus']),
                        subtotalSetelahDiskonPenjual: findColIdx(['subtotal setelah diskon penjual', 'subtotal after seller discount']),
                        
                        // Newly added possible fee columns
                        biayaLayananPreOrder: findColIdx(['biaya layanan pre-order']),
                        biayaLayananMall: findColIdx(['biaya layanan mall']),
                        biayaPembayaran: findColIdx(['biaya pembayaran']),
                        diskonKomisiLainnya: findColIdx(['diskon komisi lainnya']),
                        handlingFeeInstallment: findColIdx(['handling fee']),
                        subsidiOngkir: findColIdx(['subsidi ongkir']),
                        biayaProgramBebasOngkir: findColIdx(['biaya layanan program bebas ongkir', 'bebas ongkir']),
                        biayaLayananKhususLive: findColIdx(['biaya layanan khusus live']),
                        biayaAksesKeuntunganEksklusif: findColIdx(['biaya akses keuntungan eksklusif']),
                        biayaProgramEams: findColIdx(['biaya layanan program eams']),
                        biayaBrandsCrazyDeal: findColIdx(['biaya layanan brands crazy deal', 'flash sale']),
                        biayaPayLater: findColIdx(['biaya program paylater']),
                        biayaCampaignSource: findColIdx(['biaya sumber daya campaign']),
                        biayaLayananKhususPlatform: findColIdx(['biaya layanan khusus platform']),
                        biayaProgramLayananTerkelola: findColIdx(['program layanan terkelola']),
                        biayaAsuransi: findColIdx(['biaya asuransi'])
                    };

                    if (colMap.date === -1 || colMap.gross === -1 || colMap.orderId === -1) {
                        previewDetails.innerHTML = `
                            <span style="color: var(--accent-pink); font-weight: bold;">❌ Kolom penting tidak ditemukan.</span><br>
                            <span style="font-size: 11px; color: var(--text-muted);">Kolom Waktu, Pendapatan, atau ID Pesanan tidak terdeteksi di baris kepala berkas Keuangan.</span>
                        `;
                        showToast('Kolom penting (Waktu, Pendapatan, atau ID Pesanan) tidak ditemukan!', 'error');
                        return;
                    }

                    // Process rows — merge into allDailyAggregates
                    const dailyAggregates = allDailyAggregates;

                    for (let r = headerIndex + 1; r < jsonData.length; r++) {
                        const row = jsonData[r];
                        if (!row || row.length === 0) continue;

                        let orderId = colMap.orderId !== -1 ? (row[colMap.orderId] || '').toString().trim() : null;
                        const assocId = (colMap.associatedOrderId && colMap.associatedOrderId !== -1) ? (row[colMap.associatedOrderId] || '').toString().trim() : null;
                        if (assocId) {
                            orderId = assocId;
                        }
                        if (!orderId) continue;

                        const typeVal = colMap.type !== -1 ? (row[colMap.type] || '').toString().toLowerCase().trim() : 'pesanan';
                        const isOrderPayment = typeVal.includes('pesanan') || 
                                               typeVal.includes('order') || 
                                               typeVal.includes('payment') || 
                                               typeVal.includes('gmv') || 
                                               typeVal.includes('penggantian') || 
                                               typeVal.includes('penyesuaian') || 
                                               typeVal.includes('reimbursement') || 
                                               typeVal.includes('adjustment') ||
                                               typeVal.includes('kompensasi') ||
                                               typeVal.includes('compensation') ||
                                               typeVal.includes('banding') ||
                                               typeVal.includes('appeal') ||
                                               !!assocId;
                        
                        if (!isOrderPayment) {
                            continue; // Discard non-order payments, ads, adjustments, etc.
                        }

                        // Try to clean and parse the order date (waktu pemesanan)
                        const rawOrderDate = (colMap.date && colMap.date !== -1) ? row[colMap.date] : null;
                        let orderDateStr = '';
                        if (rawOrderDate) {
                            if (rawOrderDate instanceof Date) {
                                const y = rawOrderDate.getFullYear();
                                const m = String(rawOrderDate.getMonth() + 1).padStart(2, '0');
                                const d = String(rawOrderDate.getDate()).padStart(2, '0');
                                orderDateStr = `${y}-${m}-${d}`;
                            } else {
                                const dateMatch = rawOrderDate.toString().match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
                                if (dateMatch) {
                                    orderDateStr = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
                                } else {
                                    const slashMatch = rawOrderDate.toString().match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
                                    if (slashMatch) {
                                        orderDateStr = `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`;
                                    }
                                }
                            }
                        }

                        // Look up in database to see if we have order details there
                        const orderInDb = orderItemsDb.find(item => item.orderId === orderId);

                        // If the order exists in the database, is cancelled/returned, and has no tracking ID (resi), 
                        // it means it was cancelled before shipping. We skip it completely from the P&L report 
                        // (gross, refunds, admin fees) so it doesn't skew the dashboard metrics.
                        if (orderInDb) {
                            const statusStr = String(orderInDb.status || '').toLowerCase();
                            const isCancelled = statusStr.includes('batal') || 
                                                statusStr.includes('cancel') ||
                                                statusStr.includes('refund') ||
                                                statusStr.includes('retur');
                            const resiStr = String(orderInDb.trackingId || '').trim();
                            const hasResi = resiStr !== '' && resiStr !== '-';
                            const shippedStr = String(orderInDb.shippedTime || '').trim();
                            const hasShipped = shippedStr !== '' && shippedStr !== '-';
                            if (isCancelled && (!hasResi || !hasShipped)) {
                                continue; // Skip pre-shipment cancellations (no movement)
                            }
                        }

                        // Determine the correct aggregation date (group by order created date if available, else payment/transaction order date)
                        const aggDate = orderInDb ? orderInDb.date : orderDateStr;
                        if (!aggDate) continue;

                        if (!dailyAggregates[aggDate]) {
                            dailyAggregates[aggDate] = {
                                date: aggDate,
                                gross: 0,
                                orders: 0,
                                refunds: 0,
                                vouchers: 0,
                                adminFees: 0,
                                adsSpend: 0,
                                adjustments: 0,
                                uniqueOrders: new Set(),
                                adsShareSum: 0,
                                affShareSum: 0,
                                ordersTotalWeight: 0,
                                orderIds: []
                            };
                        }

                        const dayData = dailyAggregates[aggDate];
                        
                        let grossVal = Math.max(0, parseFloat(row[colMap.gross]) || 0);
                        const settlementVal = colMap.settlement !== -1 ? (parseFloat(row[colMap.settlement]) || 0) : 0;
                        const voucherVal = Math.abs(parseFloat(colMap.voucher !== -1 ? row[colMap.voucher] : 0) || 0);
                        const refundVal = Math.abs(parseFloat(row[colMap.refund]) || 0);
                        const affCommission = Math.abs(parseFloat(colMap.affiliate !== -1 ? row[colMap.affiliate] : 0) || 0);
                        const adsCost = Math.abs(parseFloat(colMap.ads !== -1 ? row[colMap.ads] : 0) || 0);
                        const adminFeesVal = Math.abs(parseFloat(colMap.adminFees !== -1 ? row[colMap.adminFees] : 0) || 0);
                        
                        // Extract detailed values
                        const ongkirVal = Math.abs(parseFloat(colMap.ongkir !== -1 ? row[colMap.ongkir] : 0) || 0);
                        const komisiDinamisVal = Math.abs(parseFloat(colMap.komisiDinamis !== -1 ? row[colMap.komisiDinamis] : 0) || 0);
                        const komisiAfiliasiVal = Math.abs(parseFloat(colMap.komisiAfiliasi !== -1 ? row[colMap.komisiAfiliasi] : 0) || 0);
                        const biayaKomisiPlatformVal = Math.abs(parseFloat(colMap.biayaKomisiPlatform !== -1 ? row[colMap.biayaKomisiPlatform] : 0) || 0);
                        const biayaLayananLogistikVal = Math.abs(parseFloat(colMap.biayaLayananLogistik !== -1 ? row[colMap.biayaLayananLogistik] : 0) || 0);
                        const biayaPemrosesanPesananVal = Math.abs(parseFloat(colMap.biayaPemrosesanPesanan !== -1 ? row[colMap.biayaPemrosesanPesanan] : 0) || 0);
                        const biayaKomisiSebelumDiskonVal = Math.abs(parseFloat(colMap.biayaKomisiSebelumDiskon !== -1 ? row[colMap.biayaKomisiSebelumDiskon] : 0) || 0);
                        const diskonBelanjaIklanVal = Math.abs(parseFloat(colMap.diskonBelanjaIklan !== -1 ? row[colMap.diskonBelanjaIklan] : 0) || 0);
                        const biayaLayananCashbackBonusVal = Math.abs(parseFloat(colMap.biayaLayananCashbackBonus !== -1 ? row[colMap.biayaLayananCashbackBonus] : 0) || 0);
                        const biayaLayananPreOrderVal = Math.abs(parseFloat(colMap.biayaLayananPreOrder !== -1 ? row[colMap.biayaLayananPreOrder] : 0) || 0);
                        const biayaLayananMallVal = Math.abs(parseFloat(colMap.biayaLayananMall !== -1 ? row[colMap.biayaLayananMall] : 0) || 0);
                        const biayaPembayaranVal = Math.abs(parseFloat(colMap.biayaPembayaran !== -1 ? row[colMap.biayaPembayaran] : 0) || 0);
                        const diskonKomisiLainnyaVal = Math.abs(parseFloat(colMap.diskonKomisiLainnya !== -1 ? row[colMap.diskonKomisiLainnya] : 0) || 0);
                        const handlingFeeInstallmentVal = Math.abs(parseFloat(colMap.handlingFeeInstallment !== -1 ? row[colMap.handlingFeeInstallment] : 0) || 0);
                        const subsidiOngkirVal = Math.abs(parseFloat(colMap.subsidiOngkir !== -1 ? row[colMap.subsidiOngkir] : 0) || 0);
                        const biayaProgramBebasOngkirVal = Math.abs(parseFloat(colMap.biayaProgramBebasOngkir !== -1 ? row[colMap.biayaProgramBebasOngkir] : 0) || 0);
                        const biayaLayananKhususLiveVal = Math.abs(parseFloat(colMap.biayaLayananKhususLive !== -1 ? row[colMap.biayaLayananKhususLive] : 0) || 0);
                        const biayaAksesKeuntunganEksklusifVal = Math.abs(parseFloat(colMap.biayaAksesKeuntunganEksklusif !== -1 ? row[colMap.biayaAksesKeuntunganEksklusif] : 0) || 0);
                        const biayaProgramEamsVal = Math.abs(parseFloat(colMap.biayaProgramEams !== -1 ? row[colMap.biayaProgramEams] : 0) || 0);
                        const biayaBrandsCrazyDealVal = Math.abs(parseFloat(colMap.biayaBrandsCrazyDeal !== -1 ? row[colMap.biayaBrandsCrazyDeal] : 0) || 0);
                        const biayaPayLaterVal = Math.abs(parseFloat(colMap.biayaPayLater !== -1 ? row[colMap.biayaPayLater] : 0) || 0);
                        const biayaCampaignSourceVal = Math.abs(parseFloat(colMap.biayaCampaignSource !== -1 ? row[colMap.biayaCampaignSource] : 0) || 0);
                        const biayaLayananKhususPlatformVal = Math.abs(parseFloat(colMap.biayaLayananKhususPlatform !== -1 ? row[colMap.biayaLayananKhususPlatform] : 0) || 0);
                        const biayaProgramLayananTerkelolaVal = Math.abs(parseFloat(colMap.biayaProgramLayananTerkelola !== -1 ? row[colMap.biayaProgramLayananTerkelola] : 0) || 0);
                        const biayaAsuransiVal = Math.abs(parseFloat(colMap.biayaAsuransi !== -1 ? row[colMap.biayaAsuransi] : 0) || 0);

                        const grossHeader = headers[colMap.gross] || '';
                        if (grossHeader.includes('pendapatan') || grossHeader.includes('penyelesaian') || grossHeader.includes('payout')) {
                            grossVal = grossVal + voucherVal + refundVal;
                        }

                        dayData.gross += grossVal;
                        dayData.vouchers += voucherVal;
                        dayData.refunds += refundVal;
                        dayData.adminFees += adminFeesVal;
                        
                        dayData.uniqueOrders.add(orderId);
                        if (!dayData.orderIds.includes(orderId)) {
                            dayData.orderIds.push(orderId);
                        }

                        if (!tempParsedOrderPayouts[orderId]) {
                            tempParsedOrderPayouts[orderId] = {
                                amount: 0,
                                originalAmount: 0,
                                isAppealWon: false,
                                associatedOrderId: '',
                                date: aggDate,
                                voucher: 0,
                                refund: 0,
                                adminFees: 0,
                                ads: 0,
                                affiliate: 0,
                                ongkir: 0,
                                komisiDinamis: 0,
                                komisiAfiliasi: 0,
                                biayaKomisiPlatform: 0,
                                biayaLayananLogistik: 0,
                                biayaPemrosesanPesanan: 0,
                                biayaKomisiSebelumDiskon: 0,
                                diskonBelanjaIklan: 0,
                                biayaLayananCashbackBonus: 0,
                                subtotalSetelahDiskonPenjual: 0,
                                biayaLayananPreOrder: 0,
                                biayaLayananMall: 0,
                                biayaPembayaran: 0,
                                diskonKomisiLainnya: 0,
                                handlingFeeInstallment: 0,
                                subsidiOngkir: 0,
                                biayaProgramBebasOngkir: 0,
                                biayaLayananKhususLive: 0,
                                biayaAksesKeuntunganEksklusif: 0,
                                biayaProgramEams: 0,
                                biayaBrandsCrazyDeal: 0,
                                biayaPayLater: 0,
                                biayaCampaignSource: 0,
                                biayaLayananKhususPlatform: 0,
                                biayaProgramLayananTerkelola: 0,
                                biayaAsuransi: 0
                            };
                        }
                        tempParsedOrderPayouts[orderId].amount += settlementVal;
                        if (settlementVal > 0 && typeVal === 'pesanan') {
                            tempParsedOrderPayouts[orderId].originalAmount += settlementVal;
                        }
                        
                        const isAppealWonRow = typeVal.includes('kompensasi') || 
                                               typeVal.includes('compensation') || 
                                               typeVal.includes('banding') || 
                                               typeVal.includes('appeal') ||
                                               typeVal.includes('penggantian') ||
                                               typeVal.includes('reimbursement');
                        if (isAppealWonRow) {
                            tempParsedOrderPayouts[orderId].isAppealWon = true;
                        }
                        if (assocId) {
                            tempParsedOrderPayouts[orderId].associatedOrderId = (row[colMap.orderId] || '').toString().trim();
                        }
                        tempParsedOrderPayouts[orderId].voucher += voucherVal;
                        tempParsedOrderPayouts[orderId].refund += refundVal;
                        tempParsedOrderPayouts[orderId].adminFees += adminFeesVal;
                        tempParsedOrderPayouts[orderId].ads += adsCost;
                        tempParsedOrderPayouts[orderId].affiliate += affCommission;
                        tempParsedOrderPayouts[orderId].ongkir += ongkirVal;
                        tempParsedOrderPayouts[orderId].komisiDinamis += komisiDinamisVal;
                        tempParsedOrderPayouts[orderId].komisiAfiliasi += komisiAfiliasiVal;
                        tempParsedOrderPayouts[orderId].biayaKomisiPlatform += biayaKomisiPlatformVal;
                        tempParsedOrderPayouts[orderId].biayaLayananLogistik += biayaLayananLogistikVal;
                        tempParsedOrderPayouts[orderId].biayaPemrosesanPesanan += biayaPemrosesanPesananVal;
                        tempParsedOrderPayouts[orderId].biayaKomisiSebelumDiskon += biayaKomisiSebelumDiskonVal;
                        tempParsedOrderPayouts[orderId].diskonBelanjaIklan += diskonBelanjaIklanVal;
                        tempParsedOrderPayouts[orderId].biayaLayananCashbackBonus += biayaLayananCashbackBonusVal;
                        
                        const subtotalSetelahDiskonPenjualVal = colMap.subtotalSetelahDiskonPenjual !== -1 ? (parseFloat(row[colMap.subtotalSetelahDiskonPenjual]) || 0) : 0;
                        tempParsedOrderPayouts[orderId].subtotalSetelahDiskonPenjual = (tempParsedOrderPayouts[orderId].subtotalSetelahDiskonPenjual || 0) + subtotalSetelahDiskonPenjualVal;
                        
                        tempParsedOrderPayouts[orderId].biayaLayananPreOrder += biayaLayananPreOrderVal;
                        tempParsedOrderPayouts[orderId].biayaLayananMall += biayaLayananMallVal;
                        tempParsedOrderPayouts[orderId].biayaPembayaran += biayaPembayaranVal;
                        tempParsedOrderPayouts[orderId].diskonKomisiLainnya += diskonKomisiLainnyaVal;
                        tempParsedOrderPayouts[orderId].handlingFeeInstallment += handlingFeeInstallmentVal;
                        tempParsedOrderPayouts[orderId].subsidiOngkir += subsidiOngkirVal;
                        tempParsedOrderPayouts[orderId].biayaProgramBebasOngkir += biayaProgramBebasOngkirVal;
                        tempParsedOrderPayouts[orderId].biayaLayananKhususLive += biayaLayananKhususLiveVal;
                        tempParsedOrderPayouts[orderId].biayaAksesKeuntunganEksklusif += biayaAksesKeuntunganEksklusifVal;
                        tempParsedOrderPayouts[orderId].biayaProgramEams += biayaProgramEamsVal;
                        tempParsedOrderPayouts[orderId].biayaBrandsCrazyDeal += biayaBrandsCrazyDealVal;
                        tempParsedOrderPayouts[orderId].biayaPayLater += biayaPayLaterVal;
                        tempParsedOrderPayouts[orderId].biayaCampaignSource += biayaCampaignSourceVal;
                        tempParsedOrderPayouts[orderId].biayaLayananKhususPlatform += biayaLayananKhususPlatformVal;
                        tempParsedOrderPayouts[orderId].biayaProgramLayananTerkelola += biayaProgramLayananTerkelolaVal;
                        tempParsedOrderPayouts[orderId].biayaAsuransi += biayaAsuransiVal;

                        dayData.ordersTotalWeight += 1;
                        if (adsCost > 0) dayData.adsShareSum += 1;
                        if (affCommission > 0) dayData.affShareSum += 1;
                    }

                    // Parse Riwayat penarikan if it exists
                    const withdrawalSheetName = workbook.SheetNames.find(n => n.includes('Riwayat penarikan'));
                    if (withdrawalSheetName) {
                        const wSheet = workbook.Sheets[withdrawalSheetName];
                        updateSheetRange(wSheet);
                        const wJson = XLSX.utils.sheet_to_json(wSheet, { header: 1 });
                        if (wJson && wJson.length > 1) {
                            let wHeaderIndex = -1;
                            for (let r = 0; r < Math.min(10, wJson.length); r++) {
                                const row = wJson[r];
                                if (row && row.some(cell => cell && cell.toString().toLowerCase().includes('jenis transaksi'))) {
                                    wHeaderIndex = r;
                                    break;
                                }
                            }
                            if (wHeaderIndex !== -1) {
                                const wHeaders = wJson[wHeaderIndex].map(h => h ? h.toString().toLowerCase().trim() : '');
                                const colIdx = {
                                    type: wHeaders.findIndex(h => h.includes('jenis') || h.includes('type')),
                                    refId: wHeaders.findIndex(h => h.includes('referensi') || h.includes('ref')),
                                    date: wHeaders.findIndex(h => h.includes('waktu') || h.includes('date') || h.includes('tanggal')),
                                    total: wHeaders.findIndex(h => h.includes('total') || h.includes('jumlah') || h.includes('amount')),
                                    status: wHeaders.findIndex(h => h.includes('status')),
                                    bank: wHeaders.findIndex(h => h.includes('bank') || h.includes('rekening'))
                                };

                                // Track GMV Pay Deduction entries as ads spend
                                let gmvAdsTotal = 0;
                                const gmvAdsByDate = {};

                                for (let r = wHeaderIndex + 1; r < wJson.length; r++) {
                                    const row = wJson[r];
                                    if (!row || row.length === 0) continue;

                                    const typeVal = colIdx.type !== -1 ? (row[colIdx.type] || '').toString().toLowerCase().trim() : '';
                                    const statusVal = colIdx.status !== -1 ? (row[colIdx.status] || '').toString().toLowerCase().trim() : '';
                                    
                                    if (typeVal === 'withdrawal' && statusVal === 'transferred') {
                                        const amountVal = Math.abs(parseFloat(row[colIdx.total]) || 0);
                                        const dateVal = colIdx.date !== -1 ? (row[colIdx.date] || '').toString().split(' ')[0] : '';
                                        const refVal = colIdx.refId !== -1 ? (row[colIdx.refId] || '').toString() : '-';
                                        const bankVal = colIdx.bank !== -1 ? (row[colIdx.bank] || '').toString() : '/';

                                        tempParsedWithdrawals.push({
                                            date: dateVal.replace(/\//g, '-'),
                                            refId: refVal,
                                            amount: amountVal,
                                            bank: bankVal,
                                            status: statusVal
                                        });
                                    }

                                    // Capture GMV Pay Deduction as ads spend
                                    if (typeVal.includes('gmv') && typeVal.includes('deduction')) {
                                        const adsAmount = Math.abs(parseFloat(row[colIdx.total]) || 0);
                                        const dateVal = colIdx.date !== -1 ? (row[colIdx.date] || '').toString().split(' ')[0].replace(/\//g, '-') : '';
                                        gmvAdsTotal += adsAmount;
                                        if (dateVal) {
                                            gmvAdsByDate[dateVal] = (gmvAdsByDate[dateVal] || 0) + adsAmount;
                                        }
                                    }
                                }

                                // Save GMV ads spend to tempParsedGmvAds on their actual transaction dates
                                if (gmvAdsTotal > 0) {
                                    Object.keys(gmvAdsByDate).forEach(dateVal => {
                                        tempParsedGmvAds[dateVal] = (tempParsedGmvAds[dateVal] || 0) + gmvAdsByDate[dateVal];
                                    });
                                }
                            }
                        }
                    }

                    console.log(`[Keuangan Parser] File "${fileName}" parsed. Payouts: ${Object.keys(tempParsedOrderPayouts).length}, Aggregated days: ${Object.keys(allDailyAggregates).length}`);
    }

    // Finalize parsed data from all Keuangan files — build tempParsedLogs and show preview
    function finalizeParsedData(dailyAggregates) {
                    // Format aggregated data
                    tempParsedLogs = Object.keys(dailyAggregates).map(dateKey => {
                        const agg = dailyAggregates[dateKey];
                        const calculatedOrders = agg.uniqueOrders.size || agg.ordersTotalWeight || 1;

                        let adsPct = 30;
                        let affPct = 25;
                        let livePct = 25;
                        let videoPct = 20;

                        if (agg.ordersTotalWeight > 0) {
                            const adsRatio = agg.adsShareSum / agg.ordersTotalWeight;
                            const affRatio = agg.affShareSum / agg.ordersTotalWeight;

                            if (adsRatio > 0 || affRatio > 0) {
                                adsPct = Math.round(adsRatio * 100);
                                affPct = Math.round(affRatio * 100);
                                
                                const remaining = Math.max(0, 100 - adsPct - affPct);
                                livePct = Math.round(remaining * 0.55);
                                videoPct = Math.max(0, 100 - adsPct - affPct - livePct);
                            }
                        }

                        return {
                            id: 'log_imp_' + dateKey.replace(/-/g, '') + '_' + Date.now(),
                            date: dateKey,
                            orders: calculatedOrders,
                            gross: agg.gross,
                            refunds: agg.refunds,
                            vouchers: agg.vouchers,
                            adminFees: agg.adminFees,
                            adsSpend: agg.adsSpend,
                            adjustments: agg.adjustments,
                            orderIds: agg.orderIds,
                            channels: {
                                ads: adsPct,
                                affiliate: affPct,
                                live: livePct,
                                video: videoPct
                            }
                        };
                    });

                    tempParsedLogs.sort((a, b) => new Date(a.date) - new Date(b.date));

                    if (tempParsedLogs.length === 0) {
                        showToast('Tidak ada data transaksi pesanan yang valid!', 'error');
                        return;
                    }

                    recalculateHppForTempLogs();

                    btnConfirmExcelImport.style.display = 'inline-flex';
                    excelParsePreview.style.display = 'block';
                    showToast('File Excel berhasil dianalisis! Silakan klik Impor.', 'success');

                    // Build preview
                    const totalGrossVal = tempParsedLogs.reduce((sum, item) => sum + item.gross, 0);
                    const totalHppSum = tempParsedLogs.reduce((sum, item) => sum + (item.hpp || 0), 0);
                    const totalAdminFeesVal = tempParsedLogs.reduce((sum, item) => sum + item.adminFees, 0);
                    const totalAdsSpendVal = tempParsedLogs.reduce((sum, item) => sum + item.adsSpend, 0);
                    const totalWithdrawalsVal = tempParsedWithdrawals.reduce((sum, item) => sum + item.amount, 0);

                    let previewHtml = `
                        📅 Rentang Tanggal: <strong>${tempParsedLogs[0].date}</strong> s/d <strong>${tempParsedLogs[tempParsedLogs.length - 1].date}</strong> (${tempParsedLogs.length} hari)<br>
                        💰 Estimasi Omset Bruto: <strong>${formatRupiah(totalGrossVal)}</strong><br>
                        📦 Total Pesanan: <strong>${tempParsedLogs.reduce((sum, item) => sum + item.orders, 0)} Pcs</strong><br>
                        💸 Potongan Voucher Terdeteksi: <strong>${formatRupiah(tempParsedLogs.reduce((sum, item) => sum + item.vouchers, 0))}</strong><br>
                        ❌ Nilai Retur Terdeteksi: <strong>${formatRupiah(tempParsedLogs.reduce((sum, item) => sum + item.refunds, 0))}</strong><br>
                        🏦 Biaya Admin Platform: <strong>${formatRupiah(totalAdminFeesVal)}</strong><br>
                        📢 Biaya Iklan (Ads): <strong>${formatRupiah(totalAdsSpendVal)}</strong><br>
                        🔍 Data Pencairan Ditemukan: <strong>${Object.keys(tempParsedOrderPayouts).length} Order ID</strong>
                    `;

                    if (orderItemsDb && orderItemsDb.length > 0) {
                        if (totalHppSum > 0) {
                            previewHtml += `<br>📦 Total HPP (Modal Produk): <strong style="color: var(--accent-pink);">${formatRupiah(totalHppSum)}</strong>`;
                            const estNetPayout = totalGrossVal - tempParsedLogs.reduce((sum, item) => sum + item.vouchers, 0) - tempParsedLogs.reduce((sum, item) => sum + item.refunds, 0) - totalAdminFeesVal - totalAdsSpendVal;
                            const estNetProfit = estNetPayout - totalHppSum;
                            previewHtml += `<br>🚀 Estimasi Laba Bersih: <strong style="color: var(--accent-green);">${formatRupiah(estNetProfit)}</strong>`;
                        } else {
                            previewHtml += `<br>⚠️ HPP bernilai Rp 0 (Harap isi database HPP produk di tab Database HPP).`;
                        }
                    } else {
                        previewHtml += `<br><span style="color: #ff9f43; font-weight: bold;">⚠️ PERINGATAN: Database Daftar Pesanan Kosong!</span><br>
                        <span style="font-size: 11px; color: var(--text-muted); display: block; margin-top: 2px; line-height: 1.4;">
                            Mohon unggah file <strong>Daftar Pesanan (Order List)</strong> terlebih dahulu di tab <strong>Daftar Pesanan</strong> agar HPP dapat terhitung dan <strong>pesanan yang dibatalkan sebelum dikirim (resi kosong) dapat disaring keluar secara otomatis!</strong>
                        </span>`;
                    }

                    if (tempParsedWithdrawals.length > 0) {
                        previewHtml += `<br>💳 Riwayat Penarikan ke Bank: <strong>${tempParsedWithdrawals.length} transaksi (${formatRupiah(totalWithdrawalsVal)})</strong>`;
                    }

                    previewDetails.innerHTML = previewHtml;
    }

    if (btnConfirmExcelImport) {
        btnConfirmExcelImport.addEventListener('click', () => {
            if (tempParsedLogs.length === 0) return;

            try {
                const existingDatesMap = {};
                tempParsedLogs.forEach(log => {
                    existingDatesMap[log.date] = log;
                });

                revenueLogs = revenueLogs.filter(oldLog => !existingDatesMap[oldLog.date]);
                revenueLogs = [...revenueLogs, ...tempParsedLogs];

                saveLogsToStorage();

                // Save order payouts and items
                orderPayouts = { ...orderPayouts, ...tempParsedOrderPayouts };
                localStorage.setItem('tiktok_order_payouts', JSON.stringify(orderPayouts));

                dailyGmvAdsDb = { ...dailyGmvAdsDb, ...tempParsedGmvAds };
                localStorage.setItem('tiktok_daily_gmv_ads', JSON.stringify(dailyGmvAdsDb));

                if (tempParsedOrders.length > 0) {
                    const existingKeys = new Set(orderItemsDb.map(item => item.orderId + '_' + (item.product || '') + '_' + (item.sku || '') + '_' + (item.variation || '')));
                    const newItems = tempParsedOrders.filter(item => !existingKeys.has(item.orderId + '_' + (item.product || '') + '_' + (item.sku || '') + '_' + (item.variation || '')));
                    orderItemsDb = [...orderItemsDb, ...newItems];
                    localStorage.setItem('tiktok_order_items', JSON.stringify(orderItemsDb));
                }

                if (typeof renderPayoutsTable === 'function') renderPayoutsTable();

                if (tempParsedWithdrawals.length > 0) {
                    withdrawalsList = tempParsedWithdrawals;
                    localStorage.setItem('tiktok_withdrawals', JSON.stringify(withdrawalsList));
                    renderWithdrawals();
                }

                calculateMetrics();
                renderDailyLogs();
                updateCharts();

                excelParsePreview.style.display = 'none';
                inputExcelFile.value = '';
                excelFileStatus.textContent = 'Belum ada file terpilih';
                tempParsedLogs = [];
                tempParsedWithdrawals = [];
                tempParsedGmvAds = {};

                showToast('Seluruh data transaksi Excel berhasil diimpor!', 'success');
            } catch (err) {
                console.error(err);
                showToast('Gagal mengimpor database: ' + err.message, 'error');
            }
        });
    }

    // ------------------------------------------
    // Database HPP SKU State & UI Logic
    // ------------------------------------------
    let hppSkuDb = {};
    try {
        hppSkuDb = JSON.parse(localStorage.getItem('tiktok_sku_hpp')) || {};
    } catch (e) {
        hppSkuDb = {};
    }

    function updateHppFromDatabase() {
        let updated = false;
        revenueLogs.forEach(log => {
            if (log.skuQty) {
                let dateHpp = 0;
                for (const sku in log.skuQty) {
                    const qty = log.skuQty[sku];
                    const skuInfo = hppSkuDb[sku];
                    const hppVal = skuInfo ? (skuInfo.hpp || 0) : 0;
                    dateHpp += qty * hppVal;
                }
                if (log.hpp !== dateHpp) {
                    log.hpp = dateHpp;
                    updated = true;
                }
            }
        });
        if (updated) {
            localStorage.setItem('tiktok_revenue_logs', JSON.stringify(revenueLogs));
            calculateMetrics();
            renderDailyLogs();
            if (typeof updateCharts === 'function') updateCharts();
        }
    }

    function saveHppDb() {
        localStorage.setItem('tiktok_sku_hpp', JSON.stringify(hppSkuDb));
        updateHppFromDatabase();
        if (typeof renderPayoutsTable === 'function') renderPayoutsTable();
    }

    const hppSkuForm = document.getElementById('hpp-sku-form');
    const hppSkuCode = document.getElementById('hpp-sku-code');
    const hppProductName = document.getElementById('hpp-product-name');
    const hppVariation = document.getElementById('hpp-variation');
    const hppUnitValue = document.getElementById('hpp-unit-value');
    const hppStockValue = document.getElementById('hpp-stock-value');
    const btnCancelHppEdit = document.getElementById('btn-cancel-hpp-edit');
    const btnBackupHpp = document.getElementById('btn-backup-hpp');
    const inputRestoreHpp = document.getElementById('input-restore-hpp');
    const hppSearchInput = document.getElementById('hpp-search-input');
    const hppTableBody = document.getElementById('hpp-table-body');
    const inputOrderFile = document.getElementById('input-order-file');
    const orderFileStatus = document.getElementById('order-file-status');

    let hppEditSku = null;
    let tempParsedOrders = [];
    let tempParsedOrderPayouts = {};

    function renderStockAlerts() {
        const tableBody = document.getElementById('stock-alerts-table-body');
        const alertCard = document.getElementById('card-stock-alerts');
        if (!tableBody || !alertCard) return;

        tableBody.innerHTML = '';
        
        const velocityMap = {};
        if (orderItemsDb && orderItemsDb.length > 0) {
            let maxDateTime = 0;
            orderItemsDb.forEach(item => {
                if (item.date) {
                    const t = new Date(item.date).getTime();
                    if (t > maxDateTime) maxDateTime = t;
                }
            });
            if (maxDateTime > 0) {
                const thirtyDaysAgo = maxDateTime - (30 * 24 * 60 * 60 * 1000);
                orderItemsDb.forEach(item => {
                    if (!item.sku || !item.date) return;
                    const statusLower = (item.status || '').toLowerCase();
                    const isCancelled = statusLower.includes('batal') || statusLower.includes('cancel');
                    if (isCancelled) return;

                    const t = new Date(item.date).getTime();
                    if (t >= thirtyDaysAgo && t <= maxDateTime) {
                        if (!velocityMap[item.sku]) {
                            velocityMap[item.sku] = 0;
                        }
                        velocityMap[item.sku] += (parseInt(item.qty) || 1);
                    }
                });
                for (const sku in velocityMap) {
                    velocityMap[sku] = velocityMap[sku] / 30;
                }
            }
        }

        const skus = Object.values(hppSkuDb);
        const alertsList = [];

        skus.forEach(s => {
            const stock = s.stock !== undefined ? parseInt(s.stock) : null;
            if (stock === null) return; // Skip if stock is not defined or is not set

            const dailyVelocity = velocityMap[s.sku] || 0;
            let daysRemaining = Infinity;
            if (dailyVelocity > 0) {
                daysRemaining = stock / dailyVelocity;
            }

            // Trigger alert if stock is 0 OR days remaining <= 7
            if (stock === 0 || daysRemaining <= 7) {
                alertsList.push({
                    sku: s.sku,
                    product: s.product || '-',
                    variation: s.variation || '-',
                    stock: stock,
                    velocity: dailyVelocity,
                    daysRemaining: daysRemaining
                });
            }
        });

        if (alertsList.length === 0) {
            alertCard.style.display = 'none';
            return;
        }

        // Sort: out of stock first, then by days remaining ascending
        alertsList.sort((a, b) => {
            if (a.stock === 0 && b.stock > 0) return -1;
            if (a.stock > 0 && b.stock === 0) return 1;
            return a.daysRemaining - b.daysRemaining;
        });

        alertCard.style.display = 'block';

        alertsList.forEach(alert => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';

            const tdSku = document.createElement('td');
            tdSku.innerHTML = `<span style="font-weight: 500; color: var(--accent-cyan); font-family: monospace;">${alert.sku}</span><br><span style="font-size:11px; color: var(--text-muted);">${alert.variation}</span>`;
            tdSku.style.padding = '12px 8px';
            tdSku.style.textAlign = 'left';
            tr.appendChild(tdSku);

            const tdProduct = document.createElement('td');
            tdProduct.textContent = alert.product;
            tdProduct.style.padding = '12px 8px';
            tdProduct.style.textAlign = 'left';
            tr.appendChild(tdProduct);

            const tdStock = document.createElement('td');
            tdStock.textContent = alert.stock.toLocaleString('id-ID');
            tdStock.style.textAlign = 'right';
            tdStock.style.padding = '12px 8px';
            tdStock.style.fontWeight = '600';
            if (alert.stock === 0) {
                tdStock.style.color = 'var(--accent-pink)';
            }
            tr.appendChild(tdStock);

            const tdVelocity = document.createElement('td');
            tdVelocity.textContent = alert.velocity.toFixed(2);
            tdVelocity.style.textAlign = 'right';
            tdVelocity.style.padding = '12px 8px';
            tr.appendChild(tdVelocity);

            const tdDays = document.createElement('td');
            tdDays.textContent = alert.stock === 0 ? '-' : (alert.daysRemaining === Infinity ? '∞' : `${alert.daysRemaining.toFixed(1)} Hari`);
            tdDays.style.textAlign = 'right';
            tdDays.style.padding = '12px 8px';
            tdDays.style.fontWeight = '600';
            tr.appendChild(tdDays);

            const tdStatus = document.createElement('td');
            tdStatus.style.textAlign = 'center';
            tdStatus.style.padding = '12px 8px';
            if (alert.stock === 0) {
                tdStatus.innerHTML = '<span class="status-pill danger" style="padding: 4px 8px; border-radius: 12px; font-size:11px; font-weight:600; background: rgba(254, 44, 85, 0.1); color: var(--accent-pink);">Stok Habis</span>';
            } else if (alert.daysRemaining <= 3) {
                tdStatus.innerHTML = '<span class="status-pill danger" style="padding: 4px 8px; border-radius: 12px; font-size:11px; font-weight:600; background: rgba(254, 44, 85, 0.1); color: var(--accent-pink);">Kritis</span>';
            } else {
                tdStatus.innerHTML = '<span class="status-pill warning" style="padding: 4px 8px; border-radius: 12px; font-size:11px; font-weight:600; background: rgba(255, 170, 0, 0.1); color: var(--accent-orange);">Peringatan</span>';
            }
            tr.appendChild(tdStatus);

            tableBody.appendChild(tr);
        });
    }

    function renderBestsellers() {
        const tableBody = document.getElementById('bestsellers-table-body');
        const totalGmvEl = document.getElementById('best-total-gmv');
        const totalQtyEl = document.getElementById('best-total-qty');
        const totalShareEl = document.getElementById('best-total-share');
        const skuCountEl = document.getElementById('best-sku-count');
        const strategiesContainer = document.getElementById('bestsellers-channel-strategies');

        if (!tableBody) return;

        let sourceData = [];

        // 1. Try to compile from bcgProductData
        if (bcgProductData && bcgProductData.length > 0) {
            bcgProductData.forEach(p => {
                if (p.gmv > 0 || p.sold > 0) {
                    sourceData.push({
                        sku: p.sku || p.name.substring(0, 15).toUpperCase(), // Fallback SKU
                        name: p.name,
                        sold: p.sold || 0,
                        gmv: p.gmv || 0,
                        cvr: p.cvr || 0,
                        ctr: p.ctr || 0,
                        traffic: p.traffic || 0
                    });
                }
            });
        }

        // 2. If empty, fallback to orderItemsDb
        if (sourceData.length === 0 && orderItemsDb && orderItemsDb.length > 0) {
            const skuMap = {};
            
            // Sum sales from orders
            orderItemsDb.forEach(item => {
                if (!item.sku) return;
                const statusLower = (item.status || '').toLowerCase();
                const isCancelled = statusLower.includes('batal') || statusLower.includes('cancel');
                if (isCancelled) return;

                if (!skuMap[item.sku]) {
                    skuMap[item.sku] = { sku: item.sku, name: item.product || item.sku, sold: 0, gmv: 0 };
                }
                const qty = parseInt(item.qty) || 1;
                skuMap[item.sku].sold += qty;
                
                // Estimate GMV
                let gmv = 0;
                if (item.subtotalBeforeDiscount) {
                    gmv = item.subtotalBeforeDiscount;
                } else if (item.originalPrice) {
                    gmv = item.originalPrice * qty;
                } else {
                    const hppVal = hppSkuDb[item.sku] ? hppSkuDb[item.sku].hpp : 0;
                    gmv = (hppVal || 50000) * 1.5 * qty; 
                }
                skuMap[item.sku].gmv += gmv;
            });
            sourceData = Object.values(skuMap);
        }

        if (sourceData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-gray" style="padding: 30px;">
                        Silakan unggah berkas Kinerja Produk di menu <strong>Analisis BCG Produk</strong> atau berkas pesanan di menu utama untuk memuat data terlaris.
                    </td>
                </tr>
            `;
            if (strategiesContainer) {
                strategiesContainer.innerHTML = `
                    <div class="text-center text-gray" style="padding: 20px;">
                        Unggah berkas data produk terlebih dahulu untuk memuat rekomendasi saluran penjualan.
                    </div>
                `;
            }
            return;
        }

        // Sort by GMV descending
        sourceData.sort((a, b) => b.gmv - a.gmv);

        // Sum overall total GMV from all orders / logs for share calculation
        let overallShopGmv = sourceData.reduce((sum, p) => sum + p.gmv, 0);
        
        // Sum bestseller metrics (top 10 products)
        const topBestsellers = sourceData.slice(0, 10);
        const bestsellerGmvTotal = topBestsellers.reduce((sum, p) => sum + p.gmv, 0);
        const bestsellerQtyTotal = topBestsellers.reduce((sum, p) => sum + p.sold, 0);
        const bestsellerSharePct = overallShopGmv > 0 ? (bestsellerGmvTotal / overallShopGmv) * 100 : 0;

        // Render KPIs
        if (totalGmvEl) totalGmvEl.textContent = formatRupiah(bestsellerGmvTotal);
        if (totalQtyEl) totalQtyEl.textContent = bestsellerQtyTotal.toLocaleString('id-ID') + ' Pcs';
        if (totalShareEl) totalShareEl.textContent = bestsellerSharePct.toFixed(1) + '%';
        if (skuCountEl) skuCountEl.textContent = topBestsellers.length + ' SKU';

        // Calculate sales velocity map for restock forecast
        const velocityMap = {};
        if (orderItemsDb && orderItemsDb.length > 0) {
            let maxDateTime = 0;
            orderItemsDb.forEach(item => {
                if (item.date) {
                    const t = new Date(item.date).getTime();
                    if (t > maxDateTime) maxDateTime = t;
                }
            });
            if (maxDateTime > 0) {
                const thirtyDaysAgo = maxDateTime - (30 * 24 * 60 * 60 * 1000);
                orderItemsDb.forEach(item => {
                    if (!item.sku || !item.date) return;
                    const statusLower = (item.status || '').toLowerCase();
                    const isCancelled = statusLower.includes('batal') || statusLower.includes('cancel');
                    if (isCancelled) return;

                    const t = new Date(item.date).getTime();
                    if (t >= thirtyDaysAgo && t <= maxDateTime) {
                        if (!velocityMap[item.sku]) {
                            velocityMap[item.sku] = 0;
                        }
                        velocityMap[item.sku] += (parseInt(item.qty) || 1);
                    }
                });
                for (const sku in velocityMap) {
                    velocityMap[sku] = velocityMap[sku] / 30;
                }
            }
        }

        // Render Table Rows
        tableBody.innerHTML = '';
        topBestsellers.forEach((p, idx) => {
            // Find corresponding SKU in HPP database for stock and name
            let matchedSku = hppSkuDb[p.sku];
            if (!matchedSku) {
                // Try fuzzy lookup by name
                matchedSku = Object.values(hppSkuDb).find(s => s.product === p.name);
            }

            const stock = matchedSku ? matchedSku.stock : undefined;
            const velocity = (matchedSku && velocityMap[matchedSku.sku]) ? velocityMap[matchedSku.sku] : (velocityMap[p.sku] || 0);

            let daysRemaining = Infinity;
            if (stock !== undefined && velocity > 0) {
                daysRemaining = stock / velocity;
            }

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';

            // No
            const tdNo = document.createElement('td');
            tdNo.textContent = idx + 1;
            tdNo.style.textAlign = 'center';
            tdNo.style.fontWeight = 'bold';
            tdNo.style.color = idx === 0 ? 'var(--accent-orange)' : (idx === 1 ? 'var(--accent-cyan)' : 'var(--text-muted)');
            tr.appendChild(tdNo);

            // Product Details
            const tdDetails = document.createElement('td');
            const shortSku = matchedSku ? matchedSku.sku : p.sku;
            tdDetails.innerHTML = `
                <div style="font-weight: 600; color: #FFF; line-height: 1.3;">${p.name}</div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px; font-family: monospace;">SKU: ${shortSku}</div>
            `;
            tdDetails.style.textAlign = 'left';
            tdDetails.style.padding = '10px 8px';
            tr.appendChild(tdDetails);

            // Sold
            const tdSold = document.createElement('td');
            tdSold.textContent = p.sold.toLocaleString('id-ID');
            tdSold.style.textAlign = 'right';
            tdSold.style.fontWeight = '500';
            tr.appendChild(tdSold);

            // GMV
            const tdGmv = document.createElement('td');
            tdGmv.textContent = formatRupiah(p.gmv);
            tdGmv.style.textAlign = 'right';
            tdGmv.style.fontWeight = '600';
            tdGmv.style.color = 'var(--accent-green)';
            tr.appendChild(tdGmv);

            // Share %
            const tdShare = document.createElement('td');
            const share = overallShopGmv > 0 ? (p.gmv / overallShopGmv) * 100 : 0;
            tdShare.textContent = share.toFixed(1) + '%';
            tdShare.style.textAlign = 'right';
            tdShare.style.color = 'var(--text-muted)';
            tr.appendChild(tdShare);

            // Stock
            const tdStock = document.createElement('td');
            tdStock.textContent = stock !== undefined ? stock.toLocaleString('id-ID') : '-';
            tdStock.style.textAlign = 'right';
            tdStock.style.fontWeight = '600';
            if (stock === 0) {
                tdStock.style.color = 'var(--accent-pink)';
            }
            tr.appendChild(tdStock);

            // Days remaining
            const tdDays = document.createElement('td');
            if (stock === undefined) {
                tdDays.innerHTML = '<span style="color: var(--text-muted);">-</span>';
            } else if (stock === 0) {
                tdDays.innerHTML = '<span class="status-pill danger" style="padding: 2px 6px; border-radius: 4px; font-size:10px; background: rgba(254, 44, 85, 0.1); color: var(--accent-pink);">Habis</span>';
            } else if (daysRemaining === Infinity) {
                tdDays.innerHTML = '<span style="color: var(--accent-green);">Aman (∞)</span>';
            } else if (daysRemaining <= 3) {
                tdDays.innerHTML = `<span class="status-pill danger" style="padding: 2px 6px; border-radius: 4px; font-size:10px; background: rgba(254, 44, 85, 0.1); color: var(--accent-pink); font-weight:600;">${daysRemaining.toFixed(1)} Hari</span>`;
            } else if (daysRemaining <= 7) {
                tdDays.innerHTML = `<span class="status-pill warning" style="padding: 2px 6px; border-radius: 4px; font-size:10px; background: rgba(255, 170, 0, 0.1); color: var(--accent-orange); font-weight:600;">${daysRemaining.toFixed(1)} Hari</span>`;
            } else {
                tdDays.innerHTML = `<span style="color: var(--accent-green); font-weight:600;">${daysRemaining.toFixed(0)} Hari</span>`;
            }
            tdDays.style.textAlign = 'right';
            tr.appendChild(tdDays);

            tableBody.appendChild(tr);
        });

        // Render Channel Strategies for the No. 1 Bestseller
        if (strategiesContainer && topBestsellers.length > 0) {
            const topProd = topBestsellers[0];
            strategiesContainer.innerHTML = `
                <!-- Affiliate -->
                <div style="background: rgba(37, 244, 238, 0.02); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; font-size: 13px;">
                    <div style="font-weight: 700; color: var(--accent-cyan); display: flex; align-items: center; gap: 6px; margin-bottom: 6px; text-transform: uppercase; font-size: 11.5px;">
                        <i class="fas fa-users-cog"></i> 1. Saluran Affiliate
                    </div>
                    <div style="color: #FFF; font-weight: 600; line-height: 1.3; margin-bottom: 4px;">Pasang Komisi Terbuka 10-12%</div>
                    <div style="color: var(--text-muted); font-size: 11.5px; line-height: 1.4; text-align: left;">
                        Produk <strong>${topProd.name}</strong> terbukti sangat diminati. Berikan komisi menarik bagi kreator afiliasi, dan kirimkan sampel gratis ke kreator berkinerja tinggi di kategori parenting/kids fashion untuk melipatgandakan penjualan tanpa modal iklan.
                    </div>
                </div>

                <!-- Ads -->
                <div style="background: rgba(254, 44, 85, 0.02); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; font-size: 13px;">
                    <div style="font-weight: 700; color: var(--accent-pink); display: flex; align-items: center; gap: 6px; margin-bottom: 6px; text-transform: uppercase; font-size: 11.5px;">
                        <i class="fas fa-ad"></i> 2. Saluran TikTok Ads
                    </div>
                    <div style="color: #FFF; font-weight: 600; line-height: 1.3; margin-bottom: 4px;">Shopping Ads Kata Kunci Spesifik</div>
                    <div style="color: var(--text-muted); font-size: 11.5px; line-height: 1.4; text-align: left;">
                        Jalankan Product Shopping Ads dengan menargetkan kata kunci pencarian populer (seperti <em>"helm anak sni"</em>, <em>"helm anak karakter"</em>). Konversi produk ini sudah matang, sehingga risiko boncos sangat rendah.
                    </div>
                </div>

                <!-- Live -->
                <div style="background: rgba(0, 255, 135, 0.02); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; font-size: 13px;">
                    <div style="font-weight: 700; color: var(--accent-green); display: flex; align-items: center; gap: 6px; margin-bottom: 6px; text-transform: uppercase; font-size: 11.5px;">
                        <i class="fas fa-video"></i> 3. Saluran Live Shopping
                    </div>
                    <div style="color: #FFF; font-weight: 600; line-height: 1.3; margin-bottom: 4px;">Jadikan Produk Hook Utama</div>
                    <div style="color: var(--text-muted); font-size: 11.5px; line-height: 1.4; text-align: left;">
                        Sematkan produk ini di keranjang kuning nomor 1 selama live streaming. Lakukan demo keunggulan produk (misal: mengetuk helm untuk demo kekuatan SNI) secara berkala dan berikan voucher live-eksklusif.
                    </div>
                </div>

                <!-- Video -->
                <div style="background: rgba(255, 170, 0, 0.02); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; font-size: 13px;">
                    <div style="font-weight: 700; color: var(--accent-orange); display: flex; align-items: center; gap: 6px; margin-bottom: 6px; text-transform: uppercase; font-size: 11.5px;">
                        <i class="fas fa-play"></i> 4. Konten Video Organik
                    </div>
                    <div style="color: #FFF; font-weight: 600; line-height: 1.3; margin-bottom: 4px;">Video Komedi / Edukasi Safety</div>
                    <div style="color: var(--text-muted); font-size: 11.5px; line-height: 1.4; text-align: left;">
                        Unggah video singkat edukasi keselamatan anak berkendara bersama orang tua, lalu tautkan keranjang kuning ke produk terlaris Anda ini untuk mendatangkan traffic organik secara gratis.
                    </div>
                </div>
            `;
        }
    }

    function renderHppTable() {
        if (!hppTableBody) return;
        hppTableBody.innerHTML = '';

        const searchQuery = hppSearchInput ? hppSearchInput.value.toLowerCase().trim() : '';
        const skus = Object.values(hppSkuDb);

        let filtered = skus;
        if (searchQuery) {
            filtered = skus.filter(s => 
                (s.sku && s.sku.toLowerCase().includes(searchQuery)) ||
                (s.product && s.product.toLowerCase().includes(searchQuery)) ||
                (s.variation && s.variation.toLowerCase().includes(searchQuery))
            );
        }

        if (filtered.length === 0) {
            hppTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-gray">Tidak ada data SKU ditemukan. Silakan tambahkan baru atau impor dari JSON.</td></tr>';
            if (typeof renderStockAlerts === 'function') renderStockAlerts();
            return;
        }

        filtered.sort((a, b) => (a.sku || '').localeCompare(b.sku || ''));

        filtered.forEach(s => {
            const tr = document.createElement('tr');
            
            const tdSku = document.createElement('td');
            tdSku.textContent = s.sku;
            tdSku.style.fontWeight = '500';
            tdSku.style.color = 'var(--accent-cyan)';
            tr.appendChild(tdSku);

            const tdProduct = document.createElement('td');
            tdProduct.textContent = s.product || '-';
            tr.appendChild(tdProduct);

            const tdVariation = document.createElement('td');
            tdVariation.textContent = s.variation || '-';
            tr.appendChild(tdVariation);

            const tdHpp = document.createElement('td');
            tdHpp.textContent = formatRupiah(s.hpp || 0);
            tdHpp.style.textAlign = 'right';
            tdHpp.style.fontWeight = '500';
            tdHpp.style.color = 'var(--accent-green)';
            tr.appendChild(tdHpp);

            const tdStock = document.createElement('td');
            tdStock.textContent = (s.stock !== undefined) ? s.stock.toLocaleString('id-ID') : '0';
            tdStock.style.textAlign = 'right';
            tdStock.style.fontWeight = '500';
            tdStock.style.color = (s.stock && s.stock > 0) ? '#FFF' : 'var(--accent-pink)';
            tr.appendChild(tdStock);

            const tdActions = document.createElement('td');
            tdActions.style.textAlign = 'center';
            
            const btnEdit = document.createElement('button');
            btnEdit.className = 'btn btn-secondary btn-sm';
            btnEdit.style.padding = '4px 8px';
            btnEdit.style.marginRight = '6px';
            btnEdit.style.fontSize = '11px';
            btnEdit.innerHTML = '<i class="fas fa-edit"></i> Edit';
            btnEdit.addEventListener('click', () => {
                hppEditSku = s.sku;
                hppSkuCode.value = s.sku;
                hppSkuCode.disabled = true;
                hppProductName.value = s.product || '';
                hppVariation.value = s.variation || '';
                hppUnitValue.value = s.hpp || 0;
                if (hppStockValue) hppStockValue.value = s.stock || 0;
                
                document.getElementById('hpp-form-title').textContent = 'Perbarui HPP & Stok SKU';
                btnCancelHppEdit.style.display = 'inline-block';
            });
            tdActions.appendChild(btnEdit);

            const btnDelete = document.createElement('button');
            btnDelete.className = 'btn btn-secondary btn-sm';
            btnDelete.style.padding = '4px 8px';
            btnDelete.style.fontSize = '11px';
            btnDelete.style.borderColor = 'rgba(254, 44, 85, 0.3)';
            btnDelete.style.color = 'var(--accent-pink)';
            btnDelete.innerHTML = '<i class="fas fa-trash-alt"></i> Hapus';
            btnDelete.addEventListener('click', () => {
                if (confirm(`Apakah Anda yakin ingin menghapus HPP untuk SKU: ${s.sku}?`)) {
                    delete hppSkuDb[s.sku];
                    saveHppDb();
                    renderHppTable();
                    calculateMetrics();
                    showToast(`HPP SKU ${s.sku} berhasil dihapus.`, 'success');
                }
            });
            tdActions.appendChild(btnDelete);

            tr.appendChild(tdActions);
            hppTableBody.appendChild(tr);
        });

        if (typeof renderStockAlerts === 'function') renderStockAlerts();
        if (typeof renderBestsellers === 'function') renderBestsellers();
    }

    if (hppSkuForm) {
        hppSkuForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const sku = hppSkuCode.value.trim();
            const product = hppProductName.value.trim();
            const variation = hppVariation.value.trim();
            const hppVal = parseFloat(hppUnitValue.value) || 0;
            const stockVal = hppStockValue ? (parseInt(hppStockValue.value) || 0) : 0;

            if (!sku) {
                showToast('Kode SKU tidak boleh kosong!', 'error');
                return;
            }

            hppSkuDb[sku] = {
                sku: sku,
                product: product,
                variation: variation,
                hpp: hppVal,
                stock: stockVal
            };

            saveHppDb();
            renderHppTable();
            calculateMetrics();

            hppSkuForm.reset();
            hppSkuCode.disabled = false;
            hppEditSku = null;
            document.getElementById('hpp-form-title').textContent = 'Atur HPP per SKU';
            btnCancelHppEdit.style.display = 'none';

            showToast(`SKU ${sku} berhasil disimpan.`, 'success');
        });
    }

    if (btnCancelHppEdit) {
        btnCancelHppEdit.addEventListener('click', () => {
            hppSkuForm.reset();
            hppSkuCode.disabled = false;
            hppEditSku = null;
            document.getElementById('hpp-form-title').textContent = 'Atur HPP per SKU';
            btnCancelHppEdit.style.display = 'none';
        });
    }

    if (hppSearchInput) {
        hppSearchInput.addEventListener('input', () => {
            renderHppTable();
        });
    }

    if (btnBackupHpp) {
        btnBackupHpp.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(hppSkuDb, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `tiktok_revenue_hpp_sku_${Date.now()}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            showToast('Database HPP berhasil diekspor.', 'success');
        });
    }

    if (inputRestoreHpp) {
        inputRestoreHpp.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
            const reader = new FileReader();

            reader.onload = function(evt) {
                try {
                    let count = 0;
                    if (isExcel) {
                        const data = new Uint8Array(evt.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const sheetName = workbook.SheetNames.find(n => n.includes('Isi HPP') || n.includes('HPP'));
                        if (!sheetName) {
                            showToast('Sheet Isi HPP tidak ditemukan di file Excel!', 'error');
                            return;
                        }
                        const worksheet = workbook.Sheets[sheetName];
                        updateSheetRange(worksheet);
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        
                        // Row 0 is headers: SKU, Product Name, Variation, HPP
                        for (let r = 1; r < jsonData.length; r++) {
                            const row = jsonData[r];
                            if (!row || row.length === 0) continue;
                            let skuVal = (row[0] || '').toString().trim();
                            const productVal = (row[1] || '').toString().trim();
                            const variationVal = (row[2] || '').toString().trim();
                            const hppVal = parseFloat(row[3]) || 0;

                            if (!skuVal && productVal) {
                                skuVal = 'NO-SKU-' + productVal + (variationVal ? ' (' + variationVal + ')' : '');
                            }

                            if (skuVal) {
                                hppSkuDb[skuVal] = {
                                    sku: skuVal,
                                    product: productVal,
                                    variation: variationVal,
                                    hpp: hppVal
                                };
                                count++;
                            }
                        }
                        showToast(`Berhasil mengimpor ${count} HPP dari Excel!`, 'success');
                    } else {
                        const parsed = JSON.parse(evt.target.result);
                        if (Array.isArray(parsed)) {
                            parsed.forEach(item => {
                                const skuCode = (item.sku || item.name || item.id || '').trim();
                                if (skuCode) {
                                    hppSkuDb[skuCode] = {
                                        sku: skuCode,
                                        product: item.product || item.name || '',
                                        variation: item.variation || '',
                                        hpp: parseFloat(item.hpp) || 0
                                    };
                                    count++;
                                }
                            });
                        } else if (typeof parsed === 'object') {
                            Object.keys(parsed).forEach(skuKey => {
                                const item = parsed[skuKey];
                                hppSkuDb[skuKey] = {
                                    sku: item.sku || skuKey,
                                    product: item.product || '',
                                    variation: item.variation || '',
                                    hpp: parseFloat(item.hpp) || 0
                                };
                                count++;
                            });
                        }
                        showToast(`Berhasil mengimpor ${count} data HPP SKU dari JSON!`, 'success');
                    }

                    saveHppDb();
                    renderHppTable();
                    calculateMetrics();
                } catch(err) {
                    showToast('Gagal memproses file HPP: ' + err.message, 'error');
                }
            };

            if (isExcel) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
            inputRestoreHpp.value = '';
        });
    }

    // Recalculate HPP inside tempParsedLogs using tempParsedOrders + hppSkuDb
    function recalculateHppForTempLogs() {
        // Build orderId -> list of order items mapping (only completed orders for HPP)
        const ordersMap = {};
        
        // Combine orderItemsDb and tempParsedOrders, unique-ifying by orderId + product + sku + variation
        const uniqueItemsMap = {};
        if (orderItemsDb && orderItemsDb.length > 0) {
            orderItemsDb.forEach(o => {
                if (!o) return;
                const key = (o.orderId || '') + '_' + (o.product || '') + '_' + (o.sku || '') + '_' + (o.variation || '');
                uniqueItemsMap[key] = o;
            });
        }
        if (tempParsedOrders && tempParsedOrders.length > 0) {
            tempParsedOrders.forEach(o => {
                if (!o) return;
                const key = (o.orderId || '') + '_' + (o.product || '') + '_' + (o.sku || '') + '_' + (o.variation || '');
                uniqueItemsMap[key] = o;
            });
        }
        
        // Group by orderId (only for completed orders)
        Object.values(uniqueItemsMap).forEach(o => {
            if (!o) return;
            const st = String(o.status || '').toLowerCase();
            if (st.includes('selesai') || st.includes('completed') || st === '') {
                const oid = o.orderId;
                if (!oid) return;
                if (!ordersMap[oid]) {
                    ordersMap[oid] = [];
                }
                ordersMap[oid].push(o);
            }
        });

        let totalHppSum = 0;

        if (tempParsedLogs.length > 0) {
            tempParsedLogs.forEach(log => {
                let dateHpp = 0;
                const skuQty = {};
                if (log.orderIds && log.orderIds.length > 0) {
                    log.orderIds.forEach(oid => {
                        const items = ordersMap[oid] || [];
                        items.forEach(o => {
                            if (o.sku) {
                                skuQty[o.sku] = (skuQty[o.sku] || 0) + o.qty;
                            }
                            const skuInfo = hppSkuDb[o.sku];
                            const hppVal = skuInfo ? (skuInfo.hpp || 0) : 0;
                            dateHpp += o.qty * hppVal;
                        });
                    });
                }

                log.hpp = dateHpp;
                log.skuQty = skuQty;
                totalHppSum += dateHpp;
            });
        }

        // Also update existing database records in revenueLogs if they have orderIds
        let updatedDatabase = false;
        if (revenueLogs.length > 0 && tempParsedOrders.length > 0) {
            revenueLogs.forEach(log => {
                let dateHpp = 0;
                let hasOrders = false;
                const skuQty = {};
                if (log.orderIds && log.orderIds.length > 0) {
                    log.orderIds.forEach(oid => {
                        const items = ordersMap[oid] || [];
                        if (items.length > 0) hasOrders = true;
                        items.forEach(o => {
                            if (o.sku) {
                                skuQty[o.sku] = (skuQty[o.sku] || 0) + o.qty;
                            }
                            const skuInfo = hppSkuDb[o.sku];
                            const hppVal = skuInfo ? (skuInfo.hpp || 0) : 0;
                            dateHpp += o.qty * hppVal;
                        });
                    });
                }
                if (hasOrders || dateHpp > 0) {
                    log.hpp = dateHpp;
                    log.skuQty = skuQty;
                    updatedDatabase = true;
                }
            });
        }

        if (updatedDatabase) {
            saveLogsToStorage();
            calculateMetrics();
            renderDailyLogs();
            updateCharts();
        }

        if (tempParsedLogs.length === 0) return;

        const startDate = tempParsedLogs[0].date;
        const endDate = tempParsedLogs[tempParsedLogs.length - 1].date;
        const totalGrossVal = tempParsedLogs.reduce((sum, item) => sum + item.gross, 0);
        const totalAdminFeesVal = tempParsedLogs.reduce((sum, item) => sum + (item.adminFees || 0), 0);
        const totalAdsSpendVal = tempParsedLogs.reduce((sum, item) => sum + (item.adsSpend || 0), 0);
        const totalWithdrawalsVal = tempParsedWithdrawals.reduce((sum, item) => sum + item.amount, 0);

        let previewHtml = `
            <strong>Detail Excel Hasil Pembacaan:</strong><br>
            📅 Rentang Tanggal: <strong>${startDate} s/d ${endDate}</strong> (${tempParsedLogs.length} Hari Aktif)<br>
            💰 Total Pendapatan Kotor: <strong>${formatRupiah(totalGrossVal)}</strong><br>
            📦 Total Pesanan: <strong>${tempParsedLogs.reduce((sum, item) => sum + item.orders, 0)} Pcs</strong><br>
            💸 Potongan Voucher Terdeteksi: <strong>${formatRupiah(tempParsedLogs.reduce((sum, item) => sum + item.vouchers, 0))}</strong><br>
            ❌ Nilai Retur Terdeteksi: <strong>${formatRupiah(tempParsedLogs.reduce((sum, item) => sum + item.refunds, 0))}</strong><br>
            🏦 Biaya Admin Platform: <strong>${formatRupiah(totalAdminFeesVal)}</strong><br>
            📢 Biaya Iklan (Ads): <strong>${formatRupiah(totalAdsSpendVal)}</strong>
        `;

        if (totalHppSum > 0) {
            previewHtml += `<br>📦 Total HPP (Modal Produk): <strong style="color: var(--accent-pink);">${formatRupiah(totalHppSum)}</strong>`;
            const estNetPayout = totalGrossVal - tempParsedLogs.reduce((sum, item) => sum + item.vouchers, 0) - tempParsedLogs.reduce((sum, item) => sum + item.refunds, 0) - totalAdminFeesVal - totalAdsSpendVal;
            const estNetProfit = estNetPayout - totalHppSum;
            previewHtml += `<br>🚀 Estimasi Laba Bersih: <strong style="color: var(--accent-green);">${formatRupiah(estNetProfit)}</strong>`;
        } else {
            previewHtml += `<br>⚠️ HPP belum dihitung (Unggah berkas Daftar Pesanan untuk mencocokkan HPP).`;
        }

        if (tempParsedWithdrawals.length > 0) {
            previewHtml += `<br>💳 Riwayat Penarikan ke Bank: <strong>${tempParsedWithdrawals.length} transaksi (${formatRupiah(totalWithdrawalsVal)})</strong>`;
        }

        previewDetails.innerHTML = previewHtml;
    }

    if (inputOrderFile) {
        inputOrderFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            inputOrderFile.value = ''; // Reset input to allow selecting the same file again

            orderFileStatus.textContent = file.name;
            showToast('Membaca file daftar pesanan (SKU)...', 'info');

            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const data = new Uint8Array(evt.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    const targetSheetName = workbook.SheetNames.find(n => {
                        const nl = n.toLowerCase();
                        return nl.includes('orderskulist') || nl.includes('pesanan') || nl.includes('orders') || nl.includes('detail') || nl.includes('resi');
                    }) || workbook.SheetNames[0]; // Fallback to first sheet

                    const worksheet = workbook.Sheets[targetSheetName];
                    updateSheetRange(worksheet);
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    if (!jsonData || jsonData.length < 2) {
                        showToast('File pesanan kosong!', 'error');
                        return;
                    }

                    let headerIndex = -1;
                    for (let r = 0; r < Math.min(20, jsonData.length); r++) {
                        const row = jsonData[r];
                        if (row && row.some(cell => cell && (cell.toString().toLowerCase().includes('id pesanan') || cell.toString().toLowerCase().includes('order id')))) {
                            headerIndex = r;
                            break;
                        }
                    }

                    if (headerIndex === -1) {
                        showToast('Kolom Id Pesanan tidak ditemukan!', 'error');
                        return;
                    }

                    const headers = jsonData[headerIndex].map(h => h ? h.toString().toLowerCase().trim() : '');
                    const colMap = {
                        orderId: headers.findIndex(h => h.includes('id pesanan') || h.includes('order id')),
                        status: headers.findIndex(h => (h.includes('status pesanan') || h.includes('order status') || h === 'status') && !h.includes('pembayaran')),
                        sku: headers.findIndex(h => h.includes('seller sku') || (h.includes('sku') && !h.includes('id'))),
                        product: headers.findIndex(h => h.includes('nama produk') || h.includes('product name') || h === 'produk'),
                        variation: headers.findIndex(h => h.includes('variasi') || h.includes('variation')),
                        qty: headers.findIndex(h => h.includes('jumlah') || h.includes('quantity') || h === 'qty'),
                        createdTime: headers.findIndex(h => h.includes('waktu pemesanan') || h.includes('created time') || h.includes('tanggal order') || h.includes('tanggal pesanan')),
                        trackingId: headers.findIndex(h => h.includes('resi') || h.includes('tracking id') || h.includes('no resi') || h.includes('resi id')),
                        settlement: headers.findIndex(h => h.includes('settlement') || h.includes('penyelesaian') || h.includes('dana cair') || h.includes('payout')),
                        returnType: headers.findIndex(h => h.includes('cancelation/return type') || h.includes('tipe pembatalan/pengembalian') || h.includes('return type')),
                        returnQty: headers.findIndex(h => h.includes('sku quantity of return') || h.includes('jumlah pengembalian sku') || h.includes('return qty')),
                        shippedTime: headers.findIndex(h => h.includes('shipped time') || h.includes('waktu pengiriman') || h.includes('tanggal pengiriman') || h.includes('waktu dikirim')),
                        originalPrice: headers.findIndex(h => h.includes('sku unit original price') || h.includes('harga asli produk') || h.includes('original price') || h.includes('harga awal') || h.includes('harga asli')),
                        subtotalBeforeDiscount: headers.findIndex(h => h.includes('sku subtotal before discount') || h.includes('harga jual produk') || h.includes('subtotal sebelum diskon') || h.includes('subtotal before discount') || h.includes('harga sebelum diskon'))
                    };

                    if (colMap.orderId === -1 || colMap.sku === -1) {
                        showToast('Kolom ID Pesanan atau Seller SKU tidak ditemukan di berkas Daftar Pesanan!', 'error');
                        orderFileStatus.textContent = 'Gagal (Kolom tidak lengkap)';
                        return;
                    }

                    const hasSettlementCol = colMap.settlement !== -1;
                    if (hasSettlementCol) {
                        console.log('[Orders Parser] Settlement column detected at index', colMap.settlement, '- will auto-populate payouts.');
                    }

                    tempParsedOrders = [];
                    let newSkusFound = 0;
                    let autoPayoutsCount = 0;

                    for (let r = headerIndex + 1; r < jsonData.length; r++) {
                        const row = jsonData[r];
                        if (!row || row.length === 0) continue;

                        const orderIdVal = colMap.orderId !== -1 ? (row[colMap.orderId] || '').toString().trim() : '';
                        if (!orderIdVal) continue;

                        const statusVal = colMap.status !== -1 ? (row[colMap.status] || '').toString().trim() : 'Completed';
                        const productVal = colMap.product !== -1 ? (row[colMap.product] || '').toString().trim() : '';
                        const variationVal = colMap.variation !== -1 ? (row[colMap.variation] || '').toString().trim() : '';
                        let skuVal = colMap.sku !== -1 ? (row[colMap.sku] || '').toString().trim() : '';
                        if (!skuVal) {
                            skuVal = 'NO-SKU-' + productVal + (variationVal ? ' (' + variationVal + ')' : '');
                        }
                        const qtyVal = colMap.qty !== -1 ? parseInt(row[colMap.qty]) || 1 : 1;
                        const trackingIdVal = colMap.trackingId !== -1 ? (row[colMap.trackingId] || '').toString().trim() : '';
                        const returnTypeVal = colMap.returnType !== -1 ? (row[colMap.returnType] || '').toString().toLowerCase().trim() : '';
                        const returnQtyVal = colMap.returnQty !== -1 ? parseInt(row[colMap.returnQty]) || 0 : 0;
                        const shippedTimeVal = colMap.shippedTime !== -1 ? (row[colMap.shippedTime] || '').toString().trim() : '';
                        const originalPriceVal = colMap.originalPrice !== -1 ? parseFloat(row[colMap.originalPrice]) || 0 : 0;
                        const subtotalBeforeDiscountVal = colMap.subtotalBeforeDiscount !== -1 ? parseFloat(row[colMap.subtotalBeforeDiscount]) || 0 : 0;
                        const rawDate = colMap.createdTime !== -1 ? row[colMap.createdTime] : null;

                        let dateStr = '';
                        if (rawDate) {
                            if (rawDate instanceof Date) {
                                const y = rawDate.getFullYear();
                                const m = String(rawDate.getMonth() + 1).padStart(2, '0');
                                const d = String(rawDate.getDate()).padStart(2, '0');
                                dateStr = `${y}-${m}-${d}`;
                            } else {
                                const dateMatch = rawDate.toString().match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
                                if (dateMatch) {
                                    dateStr = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
                                } else {
                                    // Try DD/MM/YYYY format (common in Indonesian reports)
                                    const slashMatch = rawDate.toString().match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
                                    if (slashMatch) {
                                        dateStr = `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`;
                                    } else {
                                        const parsedD = new Date(rawDate);
                                        if (!isNaN(parsedD.getTime())) {
                                            const y = parsedD.getFullYear();
                                            const m = String(parsedD.getMonth() + 1).padStart(2, '0');
                                            const d = String(parsedD.getDate()).padStart(2, '0');
                                            dateStr = `${y}-${m}-${d}`;
                                        }
                                    }
                                }
                            }
                        }

                        if (!dateStr) continue; // Skip orders with no date

                        tempParsedOrders.push({
                            orderId: orderIdVal,
                            sku: skuVal,
                            product: productVal,
                            variation: variationVal,
                            qty: qtyVal,
                            date: dateStr,
                            status: statusVal,
                            trackingId: trackingIdVal,
                            returnType: returnTypeVal,
                            returnQty: returnQtyVal,
                            shippedTime: shippedTimeVal,
                            originalPrice: originalPriceVal,
                            subtotalBeforeDiscount: subtotalBeforeDiscountVal
                        });

                        if (hasSettlementCol) {
                            const settlementVal = parseFloat(row[colMap.settlement]) || 0;
                            if (settlementVal > 0) {
                                if (!tempParsedOrderPayouts[orderIdVal]) {
                                    tempParsedOrderPayouts[orderIdVal] = { amount: 0, originalAmount: 0, associatedOrderId: '', date: dateStr };
                                }
                                tempParsedOrderPayouts[orderIdVal].amount += settlementVal;
                                tempParsedOrderPayouts[orderIdVal].originalAmount += settlementVal;
                                autoPayoutsCount++;
                            }
                        }

                        if (skuVal && !hppSkuDb[skuVal]) {
                            hppSkuDb[skuVal] = {
                                sku: skuVal,
                                product: productVal,
                                variation: variationVal,
                                hpp: 0
                            };
                            newSkusFound++;
                        }
                    }

                    if (hasSettlementCol && autoPayoutsCount > 0) {
                        showToast(`Otomatis mendeteksi ${autoPayoutsCount} data pencairan dari file pesanan!`, 'success');
                    }

                    if (newSkusFound > 0) {
                        saveHppDb();
                        renderHppTable();
                        showToast(`Menemukan ${newSkusFound} SKU baru! Harap isi HPP mereka di tab Database HPP.`, 'info');
                    }

                    // Save parsed orders to database immediately (map-based merge by orderId + product + sku + variation)
                    const itemsMap = {};
                    orderItemsDb.forEach(item => {
                        const key = item.orderId + '_' + (item.product || '') + '_' + (item.sku || '') + '_' + (item.variation || '');
                        itemsMap[key] = item;
                    });
                    tempParsedOrders.forEach(item => {
                        const key = item.orderId + '_' + (item.product || '') + '_' + (item.sku || '') + '_' + (item.variation || '');
                        itemsMap[key] = item;
                    });
                    orderItemsDb = Object.values(itemsMap);
                    localStorage.setItem('tiktok_order_items', JSON.stringify(orderItemsDb));

                    // Save parsed payouts immediately if any
                    if (Object.keys(tempParsedOrderPayouts).length > 0) {
                        orderPayouts = { ...orderPayouts, ...tempParsedOrderPayouts };
                        localStorage.setItem('tiktok_order_payouts', JSON.stringify(orderPayouts));
                    }

                    orderFileStatus.textContent = `${file.name} (${tempParsedOrders.length} item)`;
                    showToast(`Selesai mengimpor ${tempParsedOrders.length} detail pesanan & memperbarui data!`, 'success');
                    
                    // Unconditionally recalculate HPP for temp logs or database
                    recalculateHppForTempLogs();
                    
                    // Refresh payouts table
                    if (typeof renderPayoutsTable === 'function') renderPayoutsTable();
                } catch(err) {
                    console.error(err);
                    showToast('Gagal membaca file Pesanan: ' + err.message, 'error');
                    orderFileStatus.textContent = 'Gagal';
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    // ------------------------------------------
    // Laporan Pencairan (Resi) UI & Logic
    // ------------------------------------------
    const searchPayouts = document.getElementById('search-payouts');
    const filterPayoutsStatus = document.getElementById('filter-payouts-status');
    const btnExportPayoutsCsv = document.getElementById('btn-export-payouts-csv');
    const payoutsTableBody = document.getElementById('payouts-table-body');

    function exportPayoutsToCsv() {
        if (orderItemsDb.length === 0) {
            showToast('Tidak ada data pencairan untuk diekspor!', 'error');
            return;
        }

        let csvContent = "\uFEFF"; // UTF-8 BOM for Excel compatibility
        csvContent += "No,Tanggal Pemesanan,No. Resi (Tracking ID),ID Pesanan,ID Terkait,Nama Produk,SKU,Variasi,Qty,Status,Dana Cair,HPP,Laba Bersih\n";

        let returnResolutions = {};
        try {
            returnResolutions = JSON.parse(localStorage.getItem('tiktok_return_resolutions')) || {};
        } catch (e) {
            returnResolutions = {};
        }

        const orderIdCounts = {};
        orderItemsDb.forEach(item => {
            orderIdCounts[item.orderId] = (orderIdCounts[item.orderId] || 0) + 1;
        });

        orderItemsDb.forEach((item, idx) => {
            const payoutInfo = orderPayouts[item.orderId];
            const statusLower = (item.status || '').toLowerCase();
            const isCancelledOnly = statusLower.includes('batal') || statusLower === 'cancelled';
            
            const resolution = returnResolutions[item.orderId] || (payoutInfo && payoutInfo.isAppealWon ? 'menang' : 'pending');
            const isSettled = (payoutInfo && payoutInfo.amount > 0) || resolution === 'menang';
            
            const hasResi = item.trackingId && item.trackingId.trim() !== '' && item.trackingId.trim() !== '-';
            const hasShipped = item.shippedTime && item.shippedTime.trim() !== '' && item.shippedTime.trim() !== '-';
            const hasValidShipment = hasResi && (!isCancelledOnly ? true : hasShipped);
            const isReturnedOnly = hasValidShipment && (statusLower.includes('retur') || 
                                   statusLower.includes('refund') || 
                                   statusLower.includes('return') || 
                                   (isCancelledOnly && item.trackingId) || 
                                   (payoutInfo && payoutInfo.isReturned) ||
                                   (item.returnType && (item.returnType.includes('return') || item.returnType.includes('refund'))) ||
                                   (item.returnQty && item.returnQty > 0)) && !isSettled;
            const isCancelled = !isSettled && (isCancelledOnly || 
                                statusLower.includes('retur') || 
                                statusLower.includes('refund') || 
                                statusLower.includes('return') || 
                                (payoutInfo && payoutInfo.isReturned) ||
                                (item.returnType && (item.returnType.includes('return') || item.returnType.includes('refund'))) ||
                                (item.returnQty && item.returnQty > 0)) && !hasValidShipment;
            
            const itemOriginalPrice = item.subtotalBeforeDiscount || (item.originalPrice * item.qty) || 1;
            
            let fullSettlementAmt = 0;
            if (isSettled) {
                if (payoutInfo) {
                    if (payoutInfo.originalAmount > 0) {
                        fullSettlementAmt = payoutInfo.originalAmount;
                    } else if (payoutInfo.amount > 0) {
                        fullSettlementAmt = payoutInfo.amount;
                    } else {
                        const localAdmin = (payoutInfo.adminFees ? payoutInfo.adminFees : 0) / (orderIdCounts[item.orderId] || 1);
                        const localVoucher = (payoutInfo.voucher ? payoutInfo.voucher : 0) / (orderIdCounts[item.orderId] || 1);
                        const localAds = (payoutInfo.ads ? payoutInfo.ads : 0) / (orderIdCounts[item.orderId] || 1);
                        const localAffiliate = (payoutInfo.affiliate ? payoutInfo.affiliate : 0) / (orderIdCounts[item.orderId] || 1);
                        const estimatedPayout = itemOriginalPrice - localAdmin - localVoucher - localAds - localAffiliate;
                        fullSettlementAmt = estimatedPayout > 0 ? estimatedPayout : itemOriginalPrice;
                    }
                } else {
                    fullSettlementAmt = itemOriginalPrice;
                }
            }
            const settlementAmt = fullSettlementAmt / (orderIdCounts[item.orderId] || 1);

            let statusStr = 'Belum Cair';
            if (isSettled) {
                statusStr = resolution === 'menang' ? 'Banding Menang' : 'Sudah Cair';
            } else if (isReturnedOnly) {
                if (resolution === 'kembali') statusStr = 'Barang Kembali';
                else if (resolution === 'rugi') statusStr = 'Rugi HPP';
                else statusStr = 'Retur (Pending)';
            } else if (isCancelled) {
                statusStr = 'Dibatalkan';
            }

            const skuInfo = hppSkuDb[item.sku];
            const hppVal = skuInfo ? (skuInfo.hpp || 0) : 0;
            const totalHpp = (isCancelled || (isReturnedOnly && resolution !== 'rugi')) ? 0 : (item.qty * hppVal);
            const netProfit = isSettled ? (settlementAmt - totalHpp) : (isReturnedOnly && resolution === 'rugi' ? -(item.qty * hppVal) : 0);

            const assocIdStr = payoutInfo && payoutInfo.associatedOrderId && payoutInfo.associatedOrderId !== item.orderId ? payoutInfo.associatedOrderId : '';
            const row = [
                idx + 1,
                item.date || '',
                `"${(item.trackingId || '').replace(/"/g, '""')}"`,
                `"${(item.orderId || '').replace(/"/g, '""')}"`,
                `"${assocIdStr.replace(/"/g, '""')}"`,
                `"${(item.product || '').replace(/"/g, '""')}"`,
                `"${(item.sku || '').replace(/"/g, '""')}"`,
                `"${(item.variation || '').replace(/"/g, '""')}"`,
                item.qty,
                `"${statusStr}"`,
                Math.round(settlementAmt),
                totalHpp,
                Math.round(netProfit)
            ];
            csvContent += row.join(",") + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `laporan_pencairan_resi_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Berhasil mengekspor Laporan Pencairan ke CSV!', 'success');
    }

    window.toggleOrderDetail = function(orderId, sku, idx) {
        const detailRow = document.getElementById(`detail-row-${idx}`);
        const toggleIcon = document.getElementById(`toggle-icon-${idx}`);
        if (detailRow) {
            if (detailRow.style.display === 'none') {
                detailRow.style.display = 'table-row';
                if (toggleIcon) {
                    toggleIcon.className = 'fas fa-eye-slash text-pink';
                }
            } else {
                detailRow.style.display = 'none';
                if (toggleIcon) {
                    toggleIcon.className = 'fas fa-eye text-cyan';
                }
            }
        }
    };

    function renderPayoutsTable() {
        if (!payoutsTableBody) return;
        
        if (orderItemsDb.length === 0) {
            payoutsTableBody.innerHTML = `
                <tr>
                    <td colspan="11" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <i class="fas fa-cloud-upload-alt" style="font-size: 28px; margin-bottom: 10px; display: block; color: var(--accent-cyan);"></i>
                        Silakan unggah berkas Keuangan & Daftar Pesanan di tab <strong>Catatan Harian</strong> terlebih dahulu.
                    </td>
                </tr>
            `;
            // Reset KPI
            if (document.getElementById('kpi-payouts-total')) document.getElementById('kpi-payouts-total').textContent = '0 Order';
            if (document.getElementById('kpi-payouts-settled')) document.getElementById('kpi-payouts-settled').textContent = 'Rp 0';
            if (document.getElementById('kpi-payouts-settled-sub')) document.getElementById('kpi-payouts-settled-sub').textContent = '0 Order Berhasil Cair';
            if (document.getElementById('kpi-payouts-returned')) document.getElementById('kpi-payouts-returned').textContent = '0 Order';
            if (document.getElementById('kpi-payouts-returned-sub')) document.getElementById('kpi-payouts-returned-sub').textContent = 'Total HPP Retur: Rp 0';
            if (document.getElementById('kpi-payouts-cancelled')) document.getElementById('kpi-payouts-cancelled').textContent = '0 Order';
            if (document.getElementById('kpi-payouts-cancelled-sub')) document.getElementById('kpi-payouts-cancelled-sub').textContent = 'Total Produk Dibatalkan';
            return;
        }

        const query = searchPayouts ? searchPayouts.value.toLowerCase().trim() : '';
        const filterStatus = filterPayoutsStatus ? filterPayoutsStatus.value : 'all';

        let returnResolutions = {};
        try {
            returnResolutions = JSON.parse(localStorage.getItem('tiktok_return_resolutions')) || {};
        } catch (e) {
            returnResolutions = {};
        }

        const totalOrderIds = new Set();
        const settledOrderIds = new Set();
        const returnedOrderIds = new Set();
        const cancelledOrderIds = new Set();
        let returnedHppSum = 0;
        let settledAmountSum = 0;

        const rowsHtml = [];

        const orderIdCounts = {};
        orderItemsDb.forEach(item => {
            orderIdCounts[item.orderId] = (orderIdCounts[item.orderId] || 0) + 1;
        });

        orderItemsDb.forEach((item, idx) => {
            const payoutInfo = orderPayouts[item.orderId];
            const statusLower = (item.status || '').toLowerCase();
            const isCancelledOnly = statusLower.includes('batal') || statusLower === 'cancelled';
            
            const resolution = returnResolutions[item.orderId] || 'pending';
            const isSettled = (payoutInfo && payoutInfo.amount > 0) || resolution === 'menang';
            
            const hasResi = item.trackingId && item.trackingId.trim() !== '' && item.trackingId.trim() !== '-';
            const hasShipped = item.shippedTime && item.shippedTime.trim() !== '' && item.shippedTime.trim() !== '-';
            const hasValidShipment = hasResi && (!isCancelledOnly ? true : hasShipped);
            const isReturnedOnly = hasValidShipment && (statusLower.includes('retur') || 
                                   statusLower.includes('refund') || 
                                   statusLower.includes('return') || 
                                   (isCancelledOnly && item.trackingId) || 
                                   (payoutInfo && payoutInfo.isReturned) ||
                                   (item.returnType && (item.returnType.includes('return') || item.returnType.includes('refund'))) ||
                                   (item.returnQty && item.returnQty > 0)) && !isSettled;
            const isCancelled = !isSettled && (isCancelledOnly || 
                                statusLower.includes('retur') || 
                                statusLower.includes('refund') || 
                                statusLower.includes('return') || 
                                (payoutInfo && payoutInfo.isReturned) ||
                                (item.returnType && (item.returnType.includes('return') || item.returnType.includes('refund'))) ||
                                (item.returnQty && item.returnQty > 0)) && !hasValidShipment;
            
            const itemOriginalPrice = item.subtotalBeforeDiscount || (item.originalPrice * item.qty) || 1;
            
            let fullSettlementAmt = 0;
            if (isSettled) {
                if (payoutInfo) {
                    if (payoutInfo.originalAmount > 0) {
                        fullSettlementAmt = payoutInfo.originalAmount;
                    } else if (payoutInfo.amount > 0) {
                        fullSettlementAmt = payoutInfo.amount;
                    } else {
                        // Banding Menang fallback: hitung estimasi dana bersih (Harga - Potongan biaya secara lokal)
                        const localAdmin = (payoutInfo && payoutInfo.adminFees ? payoutInfo.adminFees : 0) / (orderIdCounts[item.orderId] || 1);
                        const localVoucher = (payoutInfo && payoutInfo.voucher ? payoutInfo.voucher : 0) / (orderIdCounts[item.orderId] || 1);
                        const localAds = (payoutInfo && payoutInfo.ads ? payoutInfo.ads : 0) / (orderIdCounts[item.orderId] || 1);
                        const localAffiliate = (payoutInfo && payoutInfo.affiliate ? payoutInfo.affiliate : 0) / (orderIdCounts[item.orderId] || 1);
                        const estimatedPayout = itemOriginalPrice - localAdmin - localVoucher - localAds - localAffiliate;
                        fullSettlementAmt = estimatedPayout > 0 ? estimatedPayout : itemOriginalPrice;
                    }
                } else {
                    fullSettlementAmt = itemOriginalPrice;
                }
            }
            const settlementAmt = fullSettlementAmt / (orderIdCounts[item.orderId] || 1);
            
            let statusStr = 'Belum Cair';
            let statusClass = 'status-pill warning';

            if (isSettled) {
                if (resolution === 'menang') {
                    statusStr = 'Banding Menang';
                    statusClass = 'status-pill success';
                } else {
                    statusStr = 'Sudah Cair';
                    statusClass = 'status-pill success';
                }
            } else if (isReturnedOnly) {
                if (resolution === 'kembali') {
                    statusStr = 'Barang Kembali';
                    statusClass = 'status-pill info';
                } else if (resolution === 'rugi') {
                    statusStr = 'Rugi HPP';
                    statusClass = 'status-pill danger';
                } else {
                    statusStr = 'Retur (Pending)';
                    statusClass = 'status-pill warning';
                }
            } else if (isCancelled) {
                statusStr = 'Dibatalkan';
                statusClass = 'status-pill danger';
            }

            // Apply filters
            if (filterStatus === 'settled' && !isSettled) return;
            if (filterStatus === 'pending' && (isSettled || isCancelled || isReturnedOnly)) return;
            if (filterStatus === 'cancelled' && !isCancelled) return;
            if (filterStatus === 'returned' && !isReturnedOnly) return;

            // Apply search query
            const matchSearch = !query || 
                item.orderId.toLowerCase().includes(query) ||
                (item.trackingId || '').toLowerCase().includes(query) ||
                (item.product || '').toLowerCase().includes(query) ||
                (item.sku || '').toLowerCase().includes(query);

            if (!matchSearch) return;

            const skuInfo = hppSkuDb[item.sku];
            const hppVal = skuInfo ? (skuInfo.hpp || 0) : 0;
            const itemHpp = item.qty * hppVal;

            totalOrderIds.add(item.orderId);
            if (isSettled) {
                settledOrderIds.add(item.orderId);
                settledAmountSum += settlementAmt;
            } else if (isReturnedOnly) {
                returnedOrderIds.add(item.orderId);
                if (resolution === 'rugi') {
                    returnedHppSum += itemHpp;
                }
            } else if (isCancelled) {
                cancelledOrderIds.add(item.orderId);
            }

            const totalHpp = (isCancelled || (isReturnedOnly && resolution !== 'rugi')) ? 0 : itemHpp;
            const netProfit = isSettled ? (settlementAmt - totalHpp) : (isReturnedOnly && resolution === 'rugi' ? -itemHpp : 0);

            const itemAdmin = (payoutInfo && payoutInfo.adminFees ? payoutInfo.adminFees : 0) / (orderIdCounts[item.orderId] || 1);
            const itemVoucher = (payoutInfo && payoutInfo.voucher ? payoutInfo.voucher : 0) / (orderIdCounts[item.orderId] || 1);
            const itemAds = (payoutInfo && payoutInfo.ads ? payoutInfo.ads : 0) / (orderIdCounts[item.orderId] || 1);
            const itemAffiliate = (payoutInfo && payoutInfo.affiliate ? payoutInfo.affiliate : 0) / (orderIdCounts[item.orderId] || 1);
            const itemRefund = (payoutInfo && payoutInfo.refund ? payoutInfo.refund : 0) / (orderIdCounts[item.orderId] || 1);

            const itemBasePriceVal = (payoutInfo && payoutInfo.subtotalSetelahDiskonPenjual ? payoutInfo.subtotalSetelahDiskonPenjual : 0) / (orderIdCounts[item.orderId] || 1);
            const itemBasePrice = itemBasePriceVal > 0 ? itemBasePriceVal : itemOriginalPrice;
            
            const detailFields = [
                { key: 'ongkir', name: 'Ongkir' },
                { key: 'komisiDinamis', name: 'Komisi dinamis' },
                { key: 'komisiAfiliasi', name: 'Komisi Afiliasi' },
                { key: 'biayaKomisiPlatform', name: 'Biaya komisi platform' },
                { key: 'biayaLayananLogistik', name: 'Biaya layanan logistik' },
                { key: 'biayaPemrosesanPesanan', name: 'Biaya pemrosesan pesanan' },
                { key: 'biayaKomisiSebelumDiskon', name: 'Biaya komisi sebelum diskon' },
                { key: 'diskonBelanjaIklan', name: 'Diskon (dari belanja iklan)', isDiscount: true },
                { key: 'biayaLayananCashbackBonus', name: 'Biaya layanan cashback bonus' },
                
                { key: 'biayaLayananPreOrder', name: 'Biaya layanan pre-order' },
                { key: 'biayaLayananMall', name: 'Biaya layanan Mall' },
                { key: 'biayaPembayaran', name: 'Biaya Pembayaran' },
                { key: 'diskonKomisiLainnya', name: 'Diskon komisi lainnya', isDiscount: true },
                { key: 'handlingFeeInstallment', name: 'Credit card installment - Handling fee' },
                { key: 'subsidiOngkir', name: 'Subsidi ongkir', isDiscount: true },
                { key: 'biayaProgramBebasOngkir', name: 'Biaya layanan Program Bebas Ongkir' },
                { key: 'biayaLayananKhususLive', name: 'Biaya layanan Khusus LIVE' },
                { key: 'biayaAksesKeuntunganEksklusif', name: 'Biaya akses keuntungan eksklusif' },
                { key: 'biayaProgramEams', name: 'Biaya layanan Program EAMS' },
                { key: 'biayaBrandsCrazyDeal', name: 'Biaya layanan Brands Crazy Deal/Flash Sale' },
                { key: 'biayaPayLater', name: 'Biaya program PayLater' },
                { key: 'biayaCampaignSource', name: 'Biaya sumber daya campaign' },
                { key: 'biayaLayananKhususPlatform', name: 'Biaya layanan khusus platform' },
                { key: 'biayaProgramLayananTerkelola', name: 'Program layanan terkelola (Biaya per pesanan)' },
                { key: 'biayaAsuransi', name: 'Biaya asuransi' }
            ];

            let cardsHtml = '';
            let activeCardsCount = 0;
            detailFields.forEach(f => {
                const val = (payoutInfo && payoutInfo[f.key] ? payoutInfo[f.key] : 0) / (orderIdCounts[item.orderId] || 1);
                if (Math.round(val) === 0) return; // Skip zero values
                
                activeCardsCount++;
                const pct = itemBasePrice > 0 ? ((val / itemBasePrice) * 100).toFixed(1) + '%' : '0.0%';
                const isGreen = f.isDiscount;
                const valColor = isGreen ? 'var(--accent-green)' : 'var(--accent-pink)';
                cardsHtml += `
                    <div style="background: rgba(255,255,255,0.015); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px 12px; display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <div style="color: var(--text-muted); font-size: 11.5px; margin-bottom: 4px; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${f.name}">${f.name}</div>
                            <div style="color: ${valColor}; font-weight: 700; font-size: 13.5px; text-align: left; margin-bottom: 2px;">
                                ${formatRupiah(Math.round(val))}
                            </div>
                        </div>
                        <div style="color: var(--text-muted); font-size: 10px; text-align: left;">${pct}</div>
                    </div>
                `;
            });
            
            if (activeCardsCount === 0) {
                cardsHtml = `
                    <div style="grid-column: 1 / -1; padding: 20px; text-align: center; color: var(--text-muted); font-size: 12.5px;">
                        Tidak ada potongan biaya atau diskon khusus untuk pesanan ini.
                    </div>
                `;
            }

            rowsHtml.push(`
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 12px 8px;">${idx + 1}</td>
                    <td style="padding: 12px 8px;">${item.date || '-'}</td>
                    <td style="padding: 12px 8px;"><span class="text-cyan font-mono" style="font-size: 11px;">${item.trackingId || '-'}</span></td>
                    <td style="padding: 12px 8px;"><span class="text-muted font-mono" style="font-size: 11px;">${item.orderId}</span></td>
                    <td style="padding: 12px 8px;"><span class="text-muted font-mono" style="font-size: 11px;">${(payoutInfo && payoutInfo.associatedOrderId && payoutInfo.associatedOrderId !== item.orderId) ? payoutInfo.associatedOrderId : '-'}</span></td>
                    <td style="padding: 12px 8px;">
                        <div style="font-weight: 500; font-size: 13px; color: #FFF; text-align: left;">${item.product}</div>
                        <div style="font-size: 11px; color: var(--text-muted); text-align: left;">${item.sku} | ${item.variation || '-'}</div>
                    </td>
                    <td style="padding: 12px 8px;">${item.qty} Pcs</td>
                    <td style="padding: 12px 8px;"><span class="${statusClass}">${statusStr}</span></td>
                    <td style="padding: 12px 8px;"><strong class="${isSettled ? 'text-green' : ''}">${isSettled ? formatRupiah(settlementAmt) : '-'}</strong></td>
                    <td style="padding: 12px 8px; color: var(--text-muted);">${formatRupiah(totalHpp)}</td>
                    <td style="padding: 12px 8px;"><strong class="${isSettled ? (netProfit >= 0 ? 'text-green' : 'text-pink') : ''}">${isSettled ? formatRupiah(netProfit) : '-'}</strong></td>
                    <td style="padding: 12px 8px; text-align: center;">
                        <button onclick="toggleOrderDetail('${item.orderId}', '${item.sku.replace(/'/g, "\\'")}', ${idx})" style="background: none; border: none; cursor: pointer; padding: 4px;" title="Lihat Rincian Biaya">
                            <i id="toggle-icon-${idx}" class="fas fa-eye text-cyan" style="font-size: 14px;"></i>
                        </button>
                    </td>
                </tr>
                <tr id="detail-row-${idx}" class="detail-row" style="display: none; background: rgba(255, 255, 255, 0.015);">
                    <td colspan="12" style="padding: 15px 20px;">
                        <h4 style="margin-top: 0; margin-bottom: 12px; font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.5px; color: #FFF; display: flex; align-items: center; gap: 6px; text-align: left;">
                            <i class="fas fa-file-invoice-dollar text-green"></i> Rincian Pendapatan & Potongan Biaya
                        </h4>
                        
                        <!-- Top Info Bar: Product & Summary -->
                        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); padding: 10px 15px; border-radius: 6px; margin-bottom: 15px;">
                            <div style="font-size: 12px; text-align: left;">
                                Produk: <strong>${item.product}</strong> 
                                <span style="color: var(--text-muted); margin: 0 6px;">|</span>
                                Varian: <strong>${item.variation || '-'}</strong>
                                <span style="color: var(--text-muted); margin: 0 6px;">|</span>
                                SKU: <strong>${item.sku}</strong>
                            </div>
                            <div style="font-size: 12px; text-align: right;">
                                Harga Jual: <strong>${formatRupiah(item.subtotalBeforeDiscount || (item.originalPrice * item.qty))}</strong>
                                <span style="color: var(--text-muted); margin: 0 6px;">|</span>
                                HPP Satuan: <strong style="color: var(--accent-pink);">${formatRupiah(hppVal)}</strong>
                                <span style="color: var(--text-muted); margin: 0 6px;">|</span>
                                Dana Cair Bersih: <strong style="color: var(--accent-green);">${isSettled ? formatRupiah(settlementAmt) : 'Rp 0'}</strong>
                            </div>
                        </div>

                        <!-- Return Resolution Selector -->
                        ${(() => {
                            if (isReturnedOnly) {
                                return `
                                    <div style="background: rgba(255, 170, 0, 0.05); border: 1px solid rgba(255, 170, 0, 0.2); padding: 12px 15px; border-radius: 8px; margin-bottom: 15px; display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 15px; flex-wrap: wrap;">
                                        <div style="text-align: left;">
                                            <div style="font-weight: 600; color: #FFF; font-size: 13px;">
                                                <i class="fas fa-exclamation-triangle" style="color: var(--accent-orange); margin-right: 6px;"></i> Status Resolusi Masalah Retur/Batal
                                            </div>
                                            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
                                                Pilih penyelesaian retur ini untuk menyesuaikan HPP dan laporan laba/rugi toko Anda.
                                            </div>
                                        </div>
                                        <div>
                                            <select onchange="updateReturnResolution('${item.orderId}', this.value)" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); color: #FFF; border-radius: 6px; padding: 6px 12px; font-size: 12px; font-family: inherit; cursor: pointer; outline: none;">
                                                <option value="pending" ${resolution === 'pending' ? 'selected' : ''}>⏳ Retur Pending (Belum Selesai)</option>
                                                <option value="menang" ${resolution === 'menang' ? 'selected' : ''}>🏆 Banding Menang (Dana Tetap Cair +)</option>
                                                <option value="kembali" ${resolution === 'kembali' ? 'selected' : ''}>📦 Retur Sukses (Barang Kembali ke Stok)</option>
                                                <option value="rugi" ${resolution === 'rugi' ? 'selected' : ''}>❌ Retur Hilang/Rusak (Rugi HPP -)</option>
                                            </select>
                                        </div>
                                    </div>
                                `;
                            }
                            return '';
                        })()}

                        <!-- 9 Breakdown Cards Grid -->
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
                            ${cardsHtml}
                        </div>
                    </td>
                </tr>
            `);
        });

        if (rowsHtml.length === 0) {
            payoutsTableBody.innerHTML = `
                <tr>
                    <td colspan="12" style="text-align: center; padding: 30px; color: var(--text-muted);">
                        Tidak ada transaksi yang cocok dengan pencarian / filter Anda.
                    </td>
                </tr>
            `;
        } else {
            payoutsTableBody.innerHTML = rowsHtml.join('');
        }

        // Update KPI values
        if (document.getElementById('kpi-payouts-total')) document.getElementById('kpi-payouts-total').textContent = totalOrderIds.size + ' Order';
        if (document.getElementById('kpi-payouts-settled')) document.getElementById('kpi-payouts-settled').textContent = formatRupiah(settledAmountSum);
        if (document.getElementById('kpi-payouts-settled-sub')) document.getElementById('kpi-payouts-settled-sub').textContent = `${settledOrderIds.size} Order Berhasil Cair`;
        if (document.getElementById('kpi-payouts-returned')) document.getElementById('kpi-payouts-returned').textContent = `${returnedOrderIds.size} Order`;
        if (document.getElementById('kpi-payouts-returned-sub')) document.getElementById('kpi-payouts-returned-sub').textContent = `Total HPP Retur: ${formatRupiah(returnedHppSum)}`;
        if (document.getElementById('kpi-payouts-cancelled')) document.getElementById('kpi-payouts-cancelled').textContent = `${cancelledOrderIds.size} Order`;
        if (document.getElementById('kpi-payouts-cancelled-sub')) document.getElementById('kpi-payouts-cancelled-sub').textContent = 'Total Pesanan Dibatalkan';
    }

    window.updateReturnResolution = function(orderId, val) {
        let resolutions = {};
        try {
            resolutions = JSON.parse(localStorage.getItem('tiktok_return_resolutions')) || {};
        } catch (e) {
            resolutions = {};
        }
        resolutions[orderId] = val;
        localStorage.setItem('tiktok_return_resolutions', JSON.stringify(resolutions));
        showToast('Status resolusi retur berhasil diperbarui.', 'success');
        
        // Re-calculate and render everything
        renderPayoutsTable();
        calculateMetrics();
        renderDailyLogs();
    };

    if (searchPayouts) {
        searchPayouts.addEventListener('input', renderPayoutsTable);
    }
    if (filterPayoutsStatus) {
        filterPayoutsStatus.addEventListener('change', renderPayoutsTable);
    }
    if (btnExportPayoutsCsv) {
        btnExportPayoutsCsv.addEventListener('click', exportPayoutsToCsv);
    }

    // ------------------------------------------
    // BCG Analysis Logic
    // ------------------------------------------
    let bcgProductData = [];

    const inputBcgFile = document.getElementById('input-bcg-file');
    const bcgFileStatus = document.getElementById('bcg-file-status');
    const bcgThresholdTraffic = document.getElementById('bcg-threshold-traffic');
    const bcgThresholdCvr = document.getElementById('bcg-threshold-cvr');
    const btnApplyBcgThresholds = document.getElementById('btn-apply-bcg-thresholds');
    const bcgResultsArea = document.getElementById('bcg-results-area');

    const bcgCountStar = document.getElementById('bcg-count-star');
    const bcgGmvStar = document.getElementById('bcg-gmv-star');
    const bcgCountQmark = document.getElementById('bcg-count-qmark');
    const bcgGmvQmark = document.getElementById('bcg-gmv-qmark');
    const bcgCountCow = document.getElementById('bcg-count-cow');
    const bcgGmvCow = document.getElementById('bcg-gmv-cow');
    const bcgCountDog = document.getElementById('bcg-count-dog');
    const bcgGmvDog = document.getElementById('bcg-gmv-dog');

    const bcgSummaryTableBody = document.getElementById('bcg-summary-table-body');
    const bcgListStarsQmarks = document.getElementById('bcg-list-stars-qmarks');
    const bcgListCowsDogs = document.getElementById('bcg-list-cows-dogs');

    function runBcgAnalysis() {
        if (bcgProductData.length === 0) return;

        const thresholdTraffic = parseFloat(bcgThresholdTraffic.value) || 1000;
        const thresholdCvr = parseFloat(bcgThresholdCvr.value) || 1.5;

        const stars = [];
        const qmarks = [];
        const cows = [];
        const dogs = [];

        bcgProductData.forEach(p => {
            if (p.traffic >= thresholdTraffic && p.cvr >= thresholdCvr) {
                stars.push(p);
            } else if (p.traffic < thresholdTraffic && p.cvr >= thresholdCvr) {
                qmarks.push(p);
            } else if (p.traffic >= thresholdTraffic && p.cvr < thresholdCvr) {
                cows.push(p);
            } else {
                dogs.push(p);
            }
        });

        const sortGmv = (a, b) => b.gmv - a.gmv;
        stars.sort(sortGmv);
        qmarks.sort(sortGmv);
        cows.sort(sortGmv);
        dogs.sort(sortGmv);

        const sumGmv = arr => arr.reduce((sum, p) => sum + p.gmv, 0);
        const gmvStar = sumGmv(stars);
        const gmvQmark = sumGmv(qmarks);
        const gmvCow = sumGmv(cows);
        const gmvDog = sumGmv(dogs);
        const totalGmv = gmvStar + gmvQmark + gmvCow + gmvDog;

        // Update KPI
        if (bcgCountStar) bcgCountStar.textContent = stars.length;
        if (bcgGmvStar) bcgGmvStar.textContent = 'GMV: ' + formatRupiah(gmvStar);
        
        if (bcgCountQmark) bcgCountQmark.textContent = qmarks.length;
        if (bcgGmvQmark) bcgGmvQmark.textContent = 'GMV: ' + formatRupiah(gmvQmark);

        if (bcgCountCow) bcgCountCow.textContent = cows.length;
        if (bcgGmvCow) bcgGmvCow.textContent = 'GMV: ' + formatRupiah(gmvCow);

        if (bcgCountDog) bcgCountDog.textContent = dogs.length;
        if (bcgGmvDog) bcgGmvDog.textContent = 'GMV: ' + formatRupiah(gmvDog);

        // Render Summary Table
        if (bcgSummaryTableBody) {
            bcgSummaryTableBody.innerHTML = `
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="font-weight: 600; color: var(--accent-cyan); padding: 12px 8px; text-align: left;">🌟 Star (Bestseller)</td>
                    <td style="text-align: center; padding: 12px 8px;">${stars.length}</td>
                    <td style="text-align: right; font-weight: 600; padding: 12px 8px;">${formatRupiah(gmvStar)}</td>
                    <td style="text-align: right; color: var(--text-muted); padding: 12px 8px;">${totalGmv > 0 ? ((gmvStar / totalGmv) * 100).toFixed(1) + '%' : '0.0%'}</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="font-weight: 600; color: var(--accent-orange); padding: 12px 8px; text-align: left;">❓ Question Mark (Potensial)</td>
                    <td style="text-align: center; padding: 12px 8px;">${qmarks.length}</td>
                    <td style="text-align: right; font-weight: 600; padding: 12px 8px;">${formatRupiah(gmvQmark)}</td>
                    <td style="text-align: right; color: var(--text-muted); padding: 12px 8px;">${totalGmv > 0 ? ((gmvQmark / totalGmv) * 100).toFixed(1) + '%' : '0.0%'}</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="font-weight: 600; color: var(--accent-green); padding: 12px 8px; text-align: left;">🐮 Cash Cow / Traffic Magnet</td>
                    <td style="text-align: center; padding: 12px 8px;">${cows.length}</td>
                    <td style="text-align: right; font-weight: 600; padding: 12px 8px;">${formatRupiah(gmvCow)}</td>
                    <td style="text-align: right; color: var(--text-muted); padding: 12px 8px;">${totalGmv > 0 ? ((gmvCow / totalGmv) * 100).toFixed(1) + '%' : '0.0%'}</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="font-weight: 600; color: var(--accent-pink); padding: 12px 8px; text-align: left;">🐕 Dog (Slow Moving)</td>
                    <td style="text-align: center; padding: 12px 8px;">${dogs.length}</td>
                    <td style="text-align: right; font-weight: 600; padding: 12px 8px;">${formatRupiah(gmvDog)}</td>
                    <td style="text-align: right; color: var(--text-muted); padding: 12px 8px;">${totalGmv > 0 ? ((gmvDog / totalGmv) * 100).toFixed(1) + '%' : '0.0%'}</td>
                </tr>
            `;
        }

        // Render Lists
        let starsQmarksHtml = '';
        if (stars.length === 0 && qmarks.length === 0) {
            starsQmarksHtml = '<div style="color: var(--text-muted); padding: 15px; text-align: center;">Tidak ada produk Star atau Question Mark.</div>';
        } else {
            if (stars.length > 0) {
                starsQmarksHtml += '<div style="font-weight: 700; color: var(--accent-cyan); margin-bottom: 10px; font-size: 12.5px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px; text-align: left; text-transform: uppercase;">🌟 DAFTAR PRODUK STAR (BESTSELLER)</div>';
                stars.slice(0, 10).forEach(p => {
                    starsQmarksHtml += `
                        <div style="background: rgba(255,255,255,0.015); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 10px;">
                            <div style="font-weight: 600; color: #FFF; text-align: left; margin-bottom: 6px; line-height: 1.4;">${p.name}</div>
                            <div style="color: var(--text-muted); display: flex; justify-content: space-between; font-size: 11.5px; flex-wrap: wrap; gap: 5px; margin-bottom: 6px;">
                                <span>Omset: <strong style="color:#FFF;">${formatRupiah(p.gmv)}</strong></span>
                                <span>Dilihat: <strong style="color:#FFF;">${p.traffic.toLocaleString('id-ID')}</strong></span>
                                <span>CVR: <strong style="color: var(--accent-green);">${p.cvr}%</strong></span>
                            </div>
                            <div style="color: var(--accent-cyan); font-size: 11px; text-align: left; font-weight: 500; background: rgba(37, 244, 238, 0.03); padding: 6px 8px; border-radius: 4px; border-left: 3px solid var(--accent-cyan);">
                                💡 Strategi: Amankan stok produk (safety stock). Alokasikan budget iklan untuk mempertahankan posisi dominan di pasar.
                            </div>
                        </div>
                    `;
                });
            }
            if (qmarks.length > 0) {
                starsQmarksHtml += '<div style="font-weight: 700; color: var(--accent-orange); margin-top: 15px; margin-bottom: 10px; font-size: 12.5px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px; text-align: left; text-transform: uppercase;">❓ DAFTAR PRODUK QUESTION MARK (POTENSIAL)</div>';
                qmarks.slice(0, 10).forEach(p => {
                    starsQmarksHtml += `
                        <div style="background: rgba(255,255,255,0.015); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 10px;">
                            <div style="font-weight: 600; color: #FFF; text-align: left; margin-bottom: 6px; line-height: 1.4;">${p.name}</div>
                            <div style="color: var(--text-muted); display: flex; justify-content: space-between; font-size: 11.5px; flex-wrap: wrap; gap: 5px; margin-bottom: 6px;">
                                <span>Omset: <strong style="color:#FFF;">${formatRupiah(p.gmv)}</strong></span>
                                <span>Dilihat: <strong style="color:#FFF;">${p.traffic.toLocaleString('id-ID')}</strong></span>
                                <span>CVR: <strong style="color: var(--accent-green);">${p.cvr}%</strong></span>
                            </div>
                            <div style="color: var(--accent-orange); font-size: 11px; text-align: left; font-weight: 500; background: rgba(255, 170, 0, 0.03); padding: 6px 8px; border-radius: 4px; border-left: 3px solid var(--accent-orange);">
                                💡 Strategi: Konversi sudah bagus tapi kurang paparan. Dorong iklan berbayar (ads) dan lakukan optimasi SEO judul produk agar mudah dicari.
                            </div>
                        </div>
                    `;
                });
            }
        }
        if (bcgListStarsQmarks) bcgListStarsQmarks.innerHTML = starsQmarksHtml;

        let cowsDogsHtml = '';
        if (cows.length === 0 && dogs.length === 0) {
            cowsDogsHtml = '<div style="color: var(--text-muted); padding: 15px; text-align: center;">Tidak ada produk Cash Cow atau Dog.</div>';
        } else {
            if (cows.length > 0) {
                cowsDogsHtml += '<div style="font-weight: 700; color: var(--accent-green); margin-bottom: 10px; font-size: 12.5px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px; text-align: left; text-transform: uppercase;">🐮 DAFTAR PRODUK CASH COWS (TRAFFIC MAGNET)</div>';
                cows.slice(0, 10).forEach(p => {
                    cowsDogsHtml += `
                        <div style="background: rgba(255,255,255,0.015); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 10px;">
                            <div style="font-weight: 600; color: #FFF; text-align: left; margin-bottom: 6px; line-height: 1.4;">${p.name}</div>
                            <div style="color: var(--text-muted); display: flex; justify-content: space-between; font-size: 11.5px; flex-wrap: wrap; gap: 5px; margin-bottom: 6px;">
                                <span>Omset: <strong style="color:#FFF;">${formatRupiah(p.gmv)}</strong></span>
                                <span>Dilihat: <strong style="color: var(--accent-green);">${p.traffic.toLocaleString('id-ID')}</strong></span>
                                <span>CVR: <strong style="color: var(--accent-pink);">${p.cvr}%</strong></span>
                            </div>
                            <div style="color: var(--accent-pink); font-size: 11px; text-align: left; font-weight: 500; background: rgba(254, 44, 85, 0.03); padding: 6px 8px; border-radius: 4px; border-left: 3px solid var(--accent-pink);">
                                💡 Solusi: Produk banyak dilihat tapi tidak laku. Evaluasi halaman detail produk (PDP), tambahkan video panduan, dan tawarkan voucher diskon halaman.
                            </div>
                        </div>
                    `;
                });
            }
            if (dogs.length > 0) {
                cowsDogsHtml += '<div style="font-weight: 700; color: var(--accent-pink); margin-top: 15px; margin-bottom: 10px; font-size: 12.5px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px; text-align: left; text-transform: uppercase;">🐕 DAFTAR PRODUK DOGS (SLOW MOVING)</div>';
                dogs.slice(0, 10).forEach(p => {
                    cowsDogsHtml += `
                        <div style="background: rgba(255,255,255,0.015); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 10px;">
                            <div style="font-weight: 600; color: #FFF; text-align: left; margin-bottom: 6px; line-height: 1.4;">${p.name}</div>
                            <div style="color: var(--text-muted); display: flex; justify-content: space-between; font-size: 11.5px; flex-wrap: wrap; gap: 5px; margin-bottom: 6px;">
                                <span>Omset: <strong style="color:#FFF;">${formatRupiah(p.gmv)}</strong></span>
                                <span>Dilihat: <strong style="color:#FFF;">${p.traffic.toLocaleString('id-ID')}</strong></span>
                                <span>CVR: <strong style="color:#FFF;">${p.cvr}%</strong></span>
                            </div>
                            <div style="color: var(--text-muted); font-size: 11px; text-align: left; font-weight: 500; background: rgba(255,255,255,0.03); padding: 6px 8px; border-radius: 4px; border-left: 3px solid var(--text-muted);">
                                💡 Solusi: Obral cuci gudang lewat live streaming, atau gunakan sebagai hadiah gratis (Gimmick Free Gift) untuk mendongkrak penjualan produk Star.
                            </div>
                        </div>
                    `;
                });
            }
        }
        if (bcgListCowsDogs) bcgListCowsDogs.innerHTML = cowsDogsHtml;
        if (typeof renderBestsellers === 'function') renderBestsellers();
    }

    if (inputBcgFile) {
        inputBcgFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            inputBcgFile.value = ''; // Reset input
            bcgFileStatus.textContent = file.name;
            showToast('Membaca file kinerja produk...', 'info');

            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const data = new Uint8Array(evt.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    updateSheetRange(worksheet);
                    
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    if (!jsonData || jsonData.length < 3) {
                        showToast('File excel kosong!', 'error');
                        return;
                    }

                    // Find header row (usually contains 'Nama')
                    let headerIndex = -1;
                    for (let r = 0; r < Math.min(20, jsonData.length); r++) {
                        const row = jsonData[r];
                        if (row && row.some(cell => cell && cell.toString().toLowerCase().trim() === 'nama')) {
                            headerIndex = r;
                            break;
                        }
                    }

                    if (headerIndex === -1) {
                        showToast('Kolom "Nama" produk tidak ditemukan!', 'error');
                        return;
                    }

                    const headers = jsonData[headerIndex].map(h => h ? h.toString().toLowerCase().trim() : '');
                    const colMap = {
                        name: headers.indexOf('nama'),
                        gmv: headers.indexOf('gmv'),
                        traffic: headers.findIndex(h => h.includes('impresi produk unik') || h.includes('impresi unik') || h.includes('pengunjung unik') || h.includes('views') || h.includes('dilihat')),
                        ctr: headers.findIndex(h => h.includes('ctr unik') || h.includes('ctr') || h.includes('klik')),
                        cvr: headers.findIndex(h => h.includes('ctor unik') || h.includes('cvr') || h.includes('konversi') || h.includes('ctor')),
                        sold: headers.findIndex(h => h.includes('produk terjual') || h.includes('terjual') || h.includes('unit'))
                    };

                    if (colMap.name === -1) {
                        showToast('Format kolom tidak dikenali!', 'error');
                        return;
                    }

                    bcgProductData = [];
                    for (let r = headerIndex + 1; r < jsonData.length; r++) {
                        const row = jsonData[r];
                        if (!row || !row[colMap.name]) continue;

                        const cleanGmv = (val) => {
                            if (!val) return 0;
                            const cleanStr = val.toString().replace('Rp', '').replace(/\./g, '').replace(/,/g, '.').trim();
                            return parseFloat(cleanStr) || 0;
                        };

                        const cleanPct = (val) => {
                            if (!val) return 0;
                            const cleanStr = val.toString().replace('%', '').trim();
                            return parseFloat(cleanStr) || 0;
                        };

                        const productObj = {
                            name: row[colMap.name].toString(),
                            gmv: colMap.gmv !== -1 ? cleanGmv(row[colMap.gmv]) : 0,
                            traffic: colMap.traffic !== -1 ? parseInt(row[colMap.traffic].toString().replace(/\./g, '').replace(/,/g, '')) || 0 : 0,
                            ctr: colMap.ctr !== -1 ? cleanPct(row[colMap.ctr]) : 0,
                            cvr: colMap.cvr !== -1 ? cleanPct(row[colMap.cvr]) : 0,
                            sold: colMap.sold !== -1 ? parseInt(row[colMap.sold].toString().replace(/\./g, '').replace(/,/g, '')) || 0 : 0
                        };
                        bcgProductData.push(productObj);
                    }

                    if (bcgProductData.length === 0) {
                        showToast('Tidak ada produk yang diimpor!', 'warning');
                        return;
                    }

                    showToast(`Berhasil menganalisis ${bcgProductData.length} produk.`, 'success');
                    if (bcgResultsArea) bcgResultsArea.style.display = 'block';
                    runBcgAnalysis();

                } catch (err) {
                    console.error(err);
                    showToast('Gagal memproses file: ' + err.message, 'error');
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    if (btnApplyBcgThresholds) {
        btnApplyBcgThresholds.addEventListener('click', () => {
            showToast('Ambang batas diperbarui.', 'success');
            runBcgAnalysis();
        });
    }

    // ------------------------------------------
    // ------------------------------------------
    // Product Calculator Logic
    // ------------------------------------------
    const calcHpp = document.getElementById('calc-hpp');
    const calcPrice = document.getElementById('calc-price');
    const calcVoucher = document.getElementById('calc-voucher');

    const calcAdminPct = document.getElementById('calc-admin-pct');
    const calcDynamicCommissionPct = document.getElementById('calc-dynamic-commission-pct');
    const calcGrowthXtraPct = document.getElementById('calc-growth-xtra-pct');
    const calcSapPct = document.getElementById('calc-sap-pct');
    const calcAffiliatePct = document.getElementById('calc-affiliate-pct');

    const calcServiceFee = document.getElementById('calc-service-fee');
    const calcLogisticFee = document.getElementById('calc-logistic-fee');
    const calcAdsFee = document.getElementById('calc-ads-fee');

    const calcCampaignPct = document.getElementById('calc-campaign-pct');
    const calcPlatformPct = document.getElementById('calc-platform-pct');
    const calcSellerPct = document.getElementById('calc-seller-pct');
    const calcCampaignHelper = document.getElementById('calc-campaign-helper');

    const calcNetProfit = document.getElementById('calc-net-profit');
    const calcProfitStatus = document.getElementById('calc-profit-status');
    const calcMarginPctVal = document.getElementById('calc-margin-pct-val');
    const calcMarginStatus = document.getElementById('calc-margin-status');
    const calcSuggestedPrice = document.getElementById('calc-suggested-price');

    const calcBuyerPriceHelper = document.getElementById('calc-buyer-price-helper');
    const breakdownPrice = document.getElementById('breakdown-price');
    const breakdownVoucherVal = document.getElementById('breakdown-voucher-val');
    const breakdownBuyerPrice = document.getElementById('breakdown-buyer-price');

    const breakdownAdminPct = document.getElementById('breakdown-admin-pct');
    const breakdownAdminVal = document.getElementById('breakdown-admin-val');
    const breakdownCommissionPct = document.getElementById('breakdown-commission-pct');
    const breakdownCommissionVal = document.getElementById('breakdown-commission-val');
    const breakdownGrowthPct = document.getElementById('breakdown-growth-pct');
    const breakdownGrowthVal = document.getElementById('breakdown-growth-val');
    const breakdownSapPct = document.getElementById('breakdown-sap-pct');
    const breakdownSapVal = document.getElementById('breakdown-sap-val');
    const breakdownAffiliatePct = document.getElementById('breakdown-affiliate-pct');
    const breakdownAffiliateVal = document.getElementById('breakdown-affiliate-val');

    const breakdownServiceVal = document.getElementById('breakdown-service-val');
    const breakdownLogisticVal = document.getElementById('breakdown-logistic-val');

    const breakdownNetPayout = document.getElementById('breakdown-net-payout');
    const breakdownHpp = document.getElementById('breakdown-hpp');
    const breakdownNetProfit = document.getElementById('breakdown-net-profit');

    const calcProfitIconBox = document.getElementById('calc-profit-icon-box');
    const calcMarginIconBox = document.getElementById('calc-margin-icon-box');
    const calcBreakdownNetProfitBox = document.getElementById('calc-breakdown-net-profit-box');

    const calcTabsContainer = document.getElementById('calc-tabs-container');
    const btnAddCalcTab = document.getElementById('btn-add-calc-tab');

    // Load tabs database
    let calcTabsDb = [];
    let activeCalcTabId = '';

    function loadCalcTabsDb() {
        try {
            const savedTabs = localStorage.getItem('calc_product_tabs');
            const savedActiveId = localStorage.getItem('active_calc_tab_id');
            if (savedTabs) {
                calcTabsDb = JSON.parse(savedTabs);
            }
            // Remove old default tabs
            if (calcTabsDb && calcTabsDb.length > 0) {
                calcTabsDb = calcTabsDb.filter(t => 
                    t.name !== 'Produk Utama' &&
                    !t.name.includes('gtzone anak') &&
                    !t.name.includes('jm kop') &&
                    !t.name.includes('bclp')
                );
            }
            if (savedActiveId && calcTabsDb.some(t => t.id === savedActiveId)) {
                activeCalcTabId = savedActiveId;
            }
        } catch (e) {
            console.error("Error loading calculator tabs:", e);
        }

        // Initialize default tab if empty
        if (!calcTabsDb || calcTabsDb.length === 0) {
            calcTabsDb = [
                {
                    id: 'tab-1',
                    name: 'Produk 1',
                    hpp: 0,
                    price: 0,
                    voucher: 0,
                    campaignPct: 0,
                    platformPct: 90,
                    sellerPct: 10,
                    adminPct: 9.25,
                    dynamicCommissionPct: 7.50,
                    growthXtraPct: 3.50,
                    sapPct: 9.20,
                    affiliatePct: 5.50,
                    adsFee: 0,
                    serviceFee: 1250,
                    logisticFee: 3000
                }
            ];
            activeCalcTabId = calcTabsDb[0].id;
            saveCalcTabsDb();
        }

        // Migrate old tabs that don't have new fields
        calcTabsDb.forEach(t => {
            if (t.campaignPct === undefined) t.campaignPct = 0;
            if (t.platformPct === undefined) t.platformPct = 90;
            if (t.sellerPct === undefined) t.sellerPct = 10;
            if (t.adsFee === undefined) t.adsFee = 0;
        });

        if (!activeCalcTabId || !calcTabsDb.some(t => t.id === activeCalcTabId)) {
            activeCalcTabId = calcTabsDb[0] ? calcTabsDb[0].id : '';
        }
    }

    function saveCalcTabsDb() {
        localStorage.setItem('calc_product_tabs', JSON.stringify(calcTabsDb));
        localStorage.setItem('active_calc_tab_id', activeCalcTabId);
    }

    // Switch to tab
    function switchCalcTab(tabId) {
        // Save current active tab's values first if elements exist
        const currentActive = calcTabsDb.find(t => t.id === activeCalcTabId);
        if (currentActive) {
            if (calcHpp) currentActive.hpp = parseFloat(calcHpp.value) || 0;
            if (calcPrice) currentActive.price = parseFloat(calcPrice.value) || 0;
            if (calcVoucher) currentActive.voucher = parseFloat(calcVoucher.value) || 0;
            if (calcAdminPct) currentActive.adminPct = parseFloat(calcAdminPct.value) || 0;
            if (calcDynamicCommissionPct) currentActive.dynamicCommissionPct = parseFloat(calcDynamicCommissionPct.value) || 0;
            if (calcGrowthXtraPct) currentActive.growthXtraPct = parseFloat(calcGrowthXtraPct.value) || 0;
            if (calcSapPct) currentActive.sapPct = parseFloat(calcSapPct.value) || 0;
            if (calcAffiliatePct) currentActive.affiliatePct = parseFloat(calcAffiliatePct.value) || 0;
            if (calcServiceFee) currentActive.serviceFee = parseFloat(calcServiceFee.value) || 0;
            if (calcLogisticFee) currentActive.logisticFee = parseFloat(calcLogisticFee.value) || 0;
            if (calcAdsFee) currentActive.adsFee = parseFloat(calcAdsFee.value) || 0;
            if (calcCampaignPct) currentActive.campaignPct = parseFloat(calcCampaignPct.value) || 0;
            if (calcPlatformPct) currentActive.platformPct = parseFloat(calcPlatformPct.value) || 0;
            if (calcSellerPct) currentActive.sellerPct = parseFloat(calcSellerPct.value) || 0;
        }

        activeCalcTabId = tabId;
        saveCalcTabsDb();

        // Load new active tab values into form inputs
        const newActive = calcTabsDb.find(t => t.id === activeCalcTabId);
        if (newActive) {
            if (calcHpp) calcHpp.value = newActive.hpp;
            if (calcPrice) calcPrice.value = newActive.price;
            if (calcVoucher) calcVoucher.value = newActive.voucher;
            if (calcAdminPct) calcAdminPct.value = newActive.adminPct;
            if (calcDynamicCommissionPct) calcDynamicCommissionPct.value = newActive.dynamicCommissionPct;
            if (calcGrowthXtraPct) calcGrowthXtraPct.value = newActive.growthXtraPct;
            if (calcSapPct) calcSapPct.value = newActive.sapPct;
            if (calcAffiliatePct) calcAffiliatePct.value = newActive.affiliatePct;
            if (calcServiceFee) calcServiceFee.value = newActive.serviceFee;
            if (calcLogisticFee) calcLogisticFee.value = newActive.logisticFee;
            if (calcAdsFee) calcAdsFee.value = newActive.adsFee || 0;
            if (calcCampaignPct) calcCampaignPct.value = newActive.campaignPct || 0;
            if (calcPlatformPct) calcPlatformPct.value = newActive.platformPct || 90;
            if (calcSellerPct) calcSellerPct.value = newActive.sellerPct || 10;
        }

        renderCalcTabs();
        updateProductCalculator();
    }

    // Render tabs list
    function renderCalcTabs() {
        if (!calcTabsContainer) return;
        
        // Remove existing tab elements (buttons that are not btnAddCalcTab)
        const tabButtons = calcTabsContainer.querySelectorAll('.calc-tab-btn');
        tabButtons.forEach(btn => btn.remove());

        calcTabsDb.forEach(tab => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'calc-tab-btn';
            
            // Basic styling for the tab button
            const isActive = tab.id === activeCalcTabId;
            btn.style.fontSize = '12px';
            btn.style.padding = '6px 14px';
            btn.style.borderRadius = '20px';
            btn.style.border = '1px solid';
            btn.style.cursor = 'pointer';
            btn.style.display = 'inline-flex';
            btn.style.alignItems = 'center';
            btn.style.gap = '8px';
            btn.style.transition = 'all 0.2s';
            
            if (isActive) {
                btn.style.background = 'var(--accent-cyan)';
                btn.style.borderColor = 'var(--accent-cyan)';
                btn.style.color = '#000';
                btn.style.fontWeight = '600';
            } else {
                btn.style.background = 'rgba(255,255,255,0.05)';
                btn.style.borderColor = 'transparent';
                btn.style.color = 'rgba(255,255,255,0.8)';
                
                btn.addEventListener('mouseenter', () => {
                    btn.style.background = 'rgba(255,255,255,0.1)';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.background = 'rgba(255,255,255,0.05)';
                });
            }

            // Name span
            const spanName = document.createElement('span');
            spanName.textContent = tab.name;
            spanName.style.cursor = 'pointer';
            btn.appendChild(spanName);

            // Double click to rename
            btn.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                const newName = prompt(`Ubah nama produk:`, tab.name);
                if (newName && newName.trim()) {
                    tab.name = newName.trim();
                    saveCalcTabsDb();
                    renderCalcTabs();
                }
            });

            // Delete button inside tab
            if (calcTabsDb.length > 1) {
                const btnDel = document.createElement('span');
                btnDel.innerHTML = '&times;';
                btnDel.style.fontSize = '14px';
                btnDel.style.fontWeight = 'bold';
                btnDel.style.cursor = 'pointer';
                btnDel.style.opacity = '0.5';
                btnDel.style.transition = 'opacity 0.2s';
                btnDel.style.padding = '0 2px';
                
                btnDel.addEventListener('mouseenter', () => {
                    btnDel.style.opacity = '1';
                    btnDel.style.color = 'var(--accent-pink)';
                });
                btnDel.addEventListener('mouseleave', () => {
                    btnDel.style.opacity = '0.5';
                    btnDel.style.color = 'inherit';
                });

                btnDel.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`Apakah Anda yakin ingin menghapus tab kalkulator untuk produk: "${tab.name}"?`)) {
                        // Delete
                        const index = calcTabsDb.findIndex(t => t.id === tab.id);
                        calcTabsDb.splice(index, 1);
                        
                        if (tab.id === activeCalcTabId) {
                            activeCalcTabId = calcTabsDb[0].id;
                        }
                        
                        saveCalcTabsDb();
                        
                        // Switch active
                        const nextActive = calcTabsDb.find(t => t.id === activeCalcTabId);
                        if (nextActive) {
                            if (calcHpp) calcHpp.value = nextActive.hpp;
                            if (calcPrice) calcPrice.value = nextActive.price;
                            if (calcVoucher) calcVoucher.value = nextActive.voucher;
                            if (calcAdminPct) calcAdminPct.value = nextActive.adminPct;
                            if (calcDynamicCommissionPct) calcDynamicCommissionPct.value = nextActive.dynamicCommissionPct;
                            if (calcGrowthXtraPct) calcGrowthXtraPct.value = nextActive.growthXtraPct;
                            if (calcSapPct) calcSapPct.value = nextActive.sapPct;
                            if (calcAffiliatePct) calcAffiliatePct.value = nextActive.affiliatePct;
                            if (calcServiceFee) calcServiceFee.value = nextActive.serviceFee;
                            if (calcLogisticFee) calcLogisticFee.value = nextActive.logisticFee;
                        }

                        renderCalcTabs();
                        updateProductCalculator();
                        showToast('Tab produk berhasil dihapus.', 'success');
                    }
                });

                btn.appendChild(btnDel);
            }

            // Click tab to switch
            btn.addEventListener('click', () => {
                if (tab.id !== activeCalcTabId) {
                    switchCalcTab(tab.id);
                }
            });

            // Insert before the "+ Tambah Produk" button
            if (btnAddCalcTab) {
                calcTabsContainer.insertBefore(btn, btnAddCalcTab);
            } else {
                calcTabsContainer.appendChild(btn);
            }
        });
    }

    // Add Tab handler
    if (btnAddCalcTab) {
        btnAddCalcTab.addEventListener('click', () => {
            const name = prompt('Masukkan nama produk baru untuk kalkulator:');
            if (name && name.trim()) {
                const newId = 'tab-' + Date.now();
                const newTab = {
                    id: newId,
                    name: name.trim(),
                    hpp: 40000,
                    price: 75000,
                    voucher: 5000,
                    adminPct: 9.25,
                    dynamicCommissionPct: 7.50,
                    growthXtraPct: 3.50,
                    sapPct: 9.20,
                    affiliatePct: 5.50,
                    serviceFee: 1250,
                    logisticFee: 3000
                };
                
                // Add to list
                calcTabsDb.push(newTab);
                
                // Switch
                switchCalcTab(newId);
                showToast(`Tab untuk "${name.trim()}" berhasil ditambahkan. Double-click tab untuk mengubah nama.`, 'success');
            }
        });
    }

    // Export & Import Backup handlers
    const btnExportCalc = document.getElementById('btn-export-calc');
    if (btnExportCalc) {
        btnExportCalc.addEventListener('click', () => {
            // Save current active tab values first
            const currentActive = calcTabsDb.find(t => t.id === activeCalcTabId);
            if (currentActive) {
                if (calcHpp) currentActive.hpp = parseFloat(calcHpp.value) || 0;
                if (calcPrice) currentActive.price = parseFloat(calcPrice.value) || 0;
                if (calcVoucher) currentActive.voucher = parseFloat(calcVoucher.value) || 0;
                if (calcAdminPct) currentActive.adminPct = parseFloat(calcAdminPct.value) || 0;
                if (calcDynamicCommissionPct) currentActive.dynamicCommissionPct = parseFloat(calcDynamicCommissionPct.value) || 0;
                if (calcGrowthXtraPct) currentActive.growthXtraPct = parseFloat(calcGrowthXtraPct.value) || 0;
                if (calcSapPct) currentActive.sapPct = parseFloat(calcSapPct.value) || 0;
                if (calcAffiliatePct) currentActive.affiliatePct = parseFloat(calcAffiliatePct.value) || 0;
                if (calcServiceFee) currentActive.serviceFee = parseFloat(calcServiceFee.value) || 0;
                if (calcLogisticFee) currentActive.logisticFee = parseFloat(calcLogisticFee.value) || 0;
            }

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(calcTabsDb, null, 4));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", "kalkulator_produk_backup.json");
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            showToast('Backup data kalkulator berhasil diunduh.', 'success');
        });
    }

    const btnImportCalc = document.getElementById('btn-import-calc');
    const importCalcFile = document.getElementById('import-calc-file');
    if (btnImportCalc && importCalcFile) {
        btnImportCalc.addEventListener('click', () => {
            importCalcFile.click();
        });

        importCalcFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const importedData = JSON.parse(evt.target.result);
                    if (Array.isArray(importedData) && importedData.length > 0 && importedData[0].name) {
                        calcTabsDb = importedData;
                        activeCalcTabId = calcTabsDb[0].id;
                        saveCalcTabsDb();
                        switchCalcTab(activeCalcTabId);
                        showToast('Data kalkulator berhasil dipulihkan dari file backup!', 'success');
                    } else {
                        showToast('Format file backup tidak valid.', 'error');
                    }
                } catch (err) {
                    showToast('Gagal membaca file backup. Pastikan file berformat JSON.', 'error');
                }
                importCalcFile.value = ''; // Reset file input
            };
            reader.readAsText(file);
        });
    }

    function updateProductCalculator() {
        if (!calcHpp || !calcPrice) return;

        const hpp = parseFloat(calcHpp.value) || 0;
        const price = parseFloat(calcPrice.value) || 0;
        const voucher = parseFloat(calcVoucher.value) || 0;

        const campaignPct = parseFloat(calcCampaignPct ? calcCampaignPct.value : 0) || 0;
        const platformPct = parseFloat(calcPlatformPct ? calcPlatformPct.value : 90) || 0;
        const sellerPct = parseFloat(calcSellerPct ? calcSellerPct.value : 10) || 0;

        const adminPct = parseFloat(calcAdminPct.value) || 0;
        const dynamicCommissionPct = parseFloat(calcDynamicCommissionPct.value) || 0;
        const growthXtraPct = parseFloat(calcGrowthXtraPct.value) || 0;
        const sapPct = parseFloat(calcSapPct.value) || 0;
        const affiliatePct = parseFloat(calcAffiliatePct.value) || 0;

        const serviceFee = parseFloat(calcServiceFee.value) || 0;
        const logisticFee = parseFloat(calcLogisticFee.value) || 0;
        const adsFee = parseFloat(calcAdsFee ? calcAdsFee.value : 0) || 0;

        // Save current active tab's values dynamically to the db object
        const activeTab = calcTabsDb.find(t => t.id === activeCalcTabId);
        if (activeTab) {
            activeTab.hpp = hpp;
            activeTab.price = price;
            activeTab.voucher = voucher;
            activeTab.campaignPct = campaignPct;
            activeTab.platformPct = platformPct;
            activeTab.sellerPct = sellerPct;
            activeTab.adminPct = adminPct;
            activeTab.dynamicCommissionPct = dynamicCommissionPct;
            activeTab.growthXtraPct = growthXtraPct;
            activeTab.sapPct = sapPct;
            activeTab.affiliatePct = affiliatePct;
            activeTab.adsFee = adsFee;
            activeTab.serviceFee = serviceFee;
            activeTab.logisticFee = logisticFee;
            saveCalcTabsDb();
        }

        // Campaign co-funded calculation:
        // Total diskon campaign = Harga Jual × Campaign %
        // Platform menanggung = Total diskon × Platform %
        // Seller menanggung = Total diskon × Seller %
        const campaignDiscountTotal = price * (campaignPct / 100);
        const campaignPlatformCost = campaignDiscountTotal * (platformPct / 100);
        const campaignSellerCost = campaignDiscountTotal * (sellerPct / 100);

        // Update campaign helper text
        if (calcCampaignHelper) {
            calcCampaignHelper.innerHTML = `Diskon Campaign: ${formatRupiah(campaignDiscountTotal)} | Platform: ${formatRupiah(campaignPlatformCost)} | <strong>Seller: ${formatRupiah(campaignSellerCost)}</strong>`;
        }

        // Calculate values according to the formula:
        // Voucher Total = Voucher Toko + Biaya Campaign Seller
        const voucherTotal = voucher + campaignSellerCost;
        // Harga Beli = Harga Jual - Voucher Total
        const buyerPrice = price - voucherTotal;

        // Percentage fees are calculated relative to Harga Beli (buyerPrice)
        const adminVal = buyerPrice * (adminPct / 100);
        const dynamicCommissionVal = buyerPrice * (dynamicCommissionPct / 100);
        const growthXtraVal = buyerPrice * (growthXtraPct / 100);
        const sapVal = buyerPrice * (sapPct / 100);
        const affiliateVal = buyerPrice * (affiliatePct / 100);

        // Sum fees
        const totalFees = adminVal + dynamicCommissionVal + growthXtraVal + sapVal + affiliateVal + adsFee + serviceFee + logisticFee;
        const netPayout = buyerPrice - totalFees;
        const totalCost = hpp;
        const netProfit = netPayout - totalCost;
        const marginPct = price > 0 ? (netProfit / price) * 100 : 0;

        // Update UI
        if (calcBuyerPriceHelper) {
            if (campaignSellerCost > 0) {
                calcBuyerPriceHelper.innerHTML = `Harga Jual - Voucher (${formatRupiah(voucher)}) - Campaign Seller (${formatRupiah(campaignSellerCost)}) = <strong>${formatRupiah(buyerPrice)}</strong>`;
            } else {
                calcBuyerPriceHelper.textContent = `Harga Jual - Voucher = ${formatRupiah(buyerPrice)}`;
            }
        }
        if (breakdownPrice) breakdownPrice.textContent = formatRupiah(price);
        if (breakdownVoucherVal) breakdownVoucherVal.textContent = formatRupiah(voucherTotal);
        if (breakdownBuyerPrice) breakdownBuyerPrice.textContent = formatRupiah(buyerPrice);

        if (breakdownAdminPct) breakdownAdminPct.textContent = adminPct.toFixed(2);
        if (breakdownAdminVal) breakdownAdminVal.textContent = formatRupiah(adminVal);
        if (breakdownCommissionPct) breakdownCommissionPct.textContent = dynamicCommissionPct.toFixed(2);
        if (breakdownCommissionVal) breakdownCommissionVal.textContent = formatRupiah(dynamicCommissionVal);
        if (breakdownGrowthPct) breakdownGrowthPct.textContent = growthXtraPct.toFixed(2);
        if (breakdownGrowthVal) breakdownGrowthVal.textContent = formatRupiah(growthXtraVal);
        if (breakdownSapPct) breakdownSapPct.textContent = sapPct.toFixed(2);
        if (breakdownSapVal) breakdownSapVal.textContent = formatRupiah(sapVal);
        if (breakdownAffiliatePct) breakdownAffiliatePct.textContent = affiliatePct.toFixed(2);
        if (breakdownAffiliateVal) breakdownAffiliateVal.textContent = formatRupiah(affiliateVal);

        if (breakdownServiceVal) breakdownServiceVal.textContent = formatRupiah(serviceFee);
        if (breakdownLogisticVal) breakdownLogisticVal.textContent = formatRupiah(logisticFee);

        if (breakdownNetPayout) breakdownNetPayout.textContent = formatRupiah(netPayout);
        if (breakdownHpp) breakdownHpp.textContent = formatRupiah(hpp);
        if (breakdownNetProfit) breakdownNetProfit.textContent = formatRupiah(netProfit);

        if (calcNetProfit) calcNetProfit.textContent = formatRupiah(netProfit);
        if (calcMarginPctVal) calcMarginPctVal.textContent = marginPct.toFixed(1) + '%';

        // Profit card state
        if (calcProfitStatus && calcProfitIconBox) {
            if (netProfit > 0) {
                calcProfitStatus.textContent = 'Menguntungkan';
                calcNetProfit.style.color = 'var(--accent-green)';
                calcProfitIconBox.style.background = 'rgba(0, 255, 135, 0.1)';
                calcProfitIconBox.style.color = 'var(--accent-green)';
            } else if (netProfit === 0) {
                calcProfitStatus.textContent = 'Balik Modal';
                calcNetProfit.style.color = '#FFF';
                calcProfitIconBox.style.background = 'rgba(255, 255, 255, 0.1)';
                calcProfitIconBox.style.color = '#FFF';
            } else {
                calcProfitStatus.textContent = 'Rugi (Boncos)';
                calcNetProfit.style.color = 'var(--accent-pink)';
                calcProfitIconBox.style.background = 'rgba(254, 44, 85, 0.1)';
                calcProfitIconBox.style.color = 'var(--accent-pink)';
            }
        }

        // Margin card state
        if (calcMarginStatus && calcMarginIconBox) {
            if (marginPct >= 20) {
                calcMarginStatus.textContent = 'Laba Sehat (> 20%)';
                calcMarginPctVal.style.color = 'var(--accent-cyan)';
                calcMarginIconBox.style.background = 'rgba(37, 244, 238, 0.1)';
                calcMarginIconBox.style.color = 'var(--accent-cyan)';
            } else if (marginPct > 0) {
                calcMarginStatus.textContent = 'Laba Tipis (Tingkatkan harga)';
                calcMarginPctVal.style.color = 'var(--accent-orange)';
                calcMarginIconBox.style.background = 'rgba(255, 170, 0, 0.1)';
                calcMarginIconBox.style.color = 'var(--accent-orange)';
            } else {
                calcMarginStatus.textContent = 'Margin Negatif';
                calcMarginPctVal.style.color = 'var(--accent-pink)';
                calcMarginIconBox.style.background = 'rgba(254, 44, 85, 0.1)';
                calcMarginIconBox.style.color = 'var(--accent-pink)';
            }
        }

        if (calcBreakdownNetProfitBox) {
            if (netProfit >= 0) {
                calcBreakdownNetProfitBox.style.color = 'var(--accent-green)';
            } else {
                calcBreakdownNetProfitBox.style.color = 'var(--accent-pink)';
            }
        }

        // Calculate Recommended Price for 30% Net Margin on Harga Beli
        // Laba = HB * (1 - TotalPct) - Fixed - HPP
        // HB = (Fixed + HPP) / (0.70 - TotalPct)
        // Rec Harga Jual = HB + Voucher Total (termasuk campaign seller cost)
        const targetMargin = 0.30;
        const totalPct = (adminPct + dynamicCommissionPct + growthXtraPct + sapPct + affiliatePct) / 100;
        const totalFixed = serviceFee + logisticFee + hpp;
        
        let suggestedPrice = 0;
        const denominator = 1 - totalPct - targetMargin;
        if (denominator > 0) {
            const suggestedBuyerPrice = totalFixed / denominator;
            suggestedPrice = suggestedBuyerPrice + voucherTotal;
        }

        if (calcSuggestedPrice) {
            calcSuggestedPrice.textContent = suggestedPrice > 0 ? formatRupiah(suggestedPrice) : 'Tidak dapat dihitung (Potongan terlalu tinggi)';
        }
    }

    // Add event listeners for instant updates
    const inputsToWatch = [
        calcHpp, calcPrice, calcVoucher, 
        calcCampaignPct, calcPlatformPct, calcSellerPct,
        calcAdminPct, calcDynamicCommissionPct, calcGrowthXtraPct, calcSapPct, calcAffiliatePct,
        calcAdsFee, calcServiceFee, calcLogisticFee
    ];
    inputsToWatch.forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                updateProductCalculator();
            });
        }
    });

    // Run once on load to initialize values
    loadCalcTabsDb();
    switchCalcTab(activeCalcTabId);

    // ------------------------------------------
    // Initial calls
    // ------------------------------------------
    loadShopSettings();
    calculateMetrics();
    renderDailyLogs();
    renderWithdrawals();
    renderHppTable();
    renderPayoutsTable();
    updateCharts();
});
