// TikTok Revenue & Omset Analyzer - Logic script
document.addEventListener('DOMContentLoaded', () => {
    console.log("TikTok Revenue & Omset Analyzer v1.1.0 loaded (Order ID Join HPP fix active).");
    // ------------------------------------------
    // State variables
    // ------------------------------------------
    let revenueLogs = JSON.parse(localStorage.getItem('tiktok_revenue_logs')) || [];
    let targetRevenue = parseFloat(localStorage.getItem('tiktok_target_revenue')) || 100000000;
    let shopName = localStorage.getItem('shop_name') || 'My TikTok Shop';
    let currentLogoBase64 = localStorage.getItem('shop_logo_base64') || null;
    let withdrawalsList = JSON.parse(localStorage.getItem('tiktok_withdrawals')) || [];

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
                
                localStorage.removeItem('tiktok_revenue_logs');
                localStorage.removeItem('tiktok_withdrawals');
                localStorage.removeItem('tiktok_sku_hpp');
                
                renderHppTable();
                renderDailyLogs();
                renderWithdrawals();
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

    function calculateMetrics() {
        let totalGross = 0;
        let totalRefunds = 0;
        let totalVouchers = 0;
        let totalOrders = 0;
        let totalAdminFees = 0;
        let totalAdsSpend = 0;
        let totalAdjustments = 0;
        let totalHppFromLogs = 0;

        revenueLogs.forEach(log => {
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
        const aov = totalOrders > 0 ? totalGross / totalOrders : 0;

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
        kpiGrossRev.textContent = formatRupiah(totalGross);
        kpiOrderCount.textContent = `Total: ${totalOrders} Order`;
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
                
                const marginPctVal = totalGross > 0 ? (netProfitVal / totalGross) * 100 : 0;
                kpiNetProfitSubtext.textContent = `HPP: ${formatRupiah(activeHpp)} | Margin Bersih: ${marginPctVal.toFixed(1)}%`;
            } else {
                cardNetProfit.style.display = 'none';
            }
        }
        
        kpiAov.textContent = formatRupiah(aov);

        const dailyAvgVal = revenueLogs.length > 0 ? totalGross / revenueLogs.length : 0;
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

        if (pnlGross) pnlGross.textContent = formatRupiah(totalGross);
        
        const pctDenom = totalGross > 0 ? totalGross : 1;
        
        if (pnlVoucher) pnlVoucher.textContent = `-${formatRupiah(totalVouchers)}`;
        if (pnlVoucherPct) pnlVoucherPct.textContent = `${((totalVouchers / pctDenom) * 100).toFixed(1)}%`;
        
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

        if (revenueLogs.length === 0) {
            logsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-gray" style="padding: 15px;">Belum ada catatan transaksi harian. Silakan isi form di sebelah kiri.</td>
                </tr>
            `;
            return;
        }

        // Sort reverse chronological
        const sortedLogs = [...revenueLogs].sort((a, b) => new Date(b.date) - new Date(a.date));

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

            // Destroy previous instances
            if (revenueTrendChart) revenueTrendChart.destroy();
            if (channelDonutChart) channelDonutChart.destroy();

            // Prepare chart data
            const sortedLogs = [...revenueLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
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
                        legend: { labels: { color: '#90A0B7', font: { family: 'Outfit', size: 11 } } }
                    },
                    scales: {
                        x: { ticks: { color: '#90A0B7', font: { family: 'Outfit' } }, grid: { color: 'rgba(255, 255, 255, 0.03)' } },
                        y: { 
                            ticks: { 
                                color: '#90A0B7', 
                                font: { family: 'Outfit' },
                                callback: value => 'Rp ' + (value >= 1e6 ? (value/1e6).toFixed(1) + 'jt' : (value/1e3).toFixed(0) + 'rb')
                            }, 
                            grid: { color: 'rgba(255, 255, 255, 0.03)' } 
                        }
                    }
                }
            });

            // Calculate Channel distribution amounts for Donut Chart
            let adsTotal = 0;
            let affTotal = 0;
            let liveTotal = 0;
            let videoTotal = 0;

            revenueLogs.forEach(log => {
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
                        borderColor: '#0A0D14'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#90A0B7', font: { family: 'Outfit', size: 10 } }
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
                
                revenueLogs.forEach(log => {
                    const net = log.gross - log.refunds - (log.vouchers || 0);
                    csvContent += `${log.date},${log.gross},${log.refunds},${log.vouchers || 0},${net},${log.orders},${log.channels.ads},${log.channels.affiliate},${log.channels.live},${log.channels.video}\n`;
                });

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", url);
                downloadAnchorNode.setAttribute("download", `riwayat_omset_toko_${Date.now()}.csv`);
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
                revenueLogs.forEach(log => {
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
                const sortedLogs = [...revenueLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
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

    if (inputExcelFile) {
        inputExcelFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            excelFileStatus.textContent = file.name;
            excelParsePreview.style.display = 'block';
            previewDetails.innerHTML = `<span style="color: var(--text-muted);"><i class="fas fa-spinner fa-spin mr-1"></i> Sedang menganalisis file Excel...</span>`;
            btnConfirmExcelImport.style.display = 'none';

            showToast('Membaca file laporan keuangan...', 'info');

            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const data = new Uint8Array(evt.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Dynamic Multi-Sheet Scanner to automatically find the correct sheet & header row
                    let targetSheetName = '';
                    let jsonData = null;
                    let headerIndex = -1;
                    let bestHeaderMatchCount = 0;

                    for (let s = 0; s < workbook.SheetNames.length; s++) {
                        const sheetName = workbook.SheetNames[s];
                        const worksheet = workbook.Sheets[sheetName];
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
                    
                    // Helper to search index defensively with exclusion support
                    function findColIdx(keywords, excludeKeywords = []) {
                        return headers.findIndex(h => {
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
                        gross: findColIdx(['subtotal sebelum diskon', 'subtotal before discount', 'original price']) !== -1 
                            ? findColIdx(['subtotal sebelum diskon', 'subtotal before discount', 'original price']) 
                            : findColIdx(['jumlah penyelesaian', 'total pendapatan', 'pendapatan', 'gross']),
                        settlement: findColIdx(['jumlah penyelesaian pembayaran', 'jumlah penyelesaian', 'payout amount', 'settlement amount']),
                        voucher: findColIdx(['diskon penjual', 'seller discount', 'diskon voucher yang ditanggung penjual'], ['subtotal', 'pengembalian']),
                        refund: findColIdx(['pengembalian dana setelah diskon', 'refund after seller discount', 'subtotal pengembalian dana setelah diskon penjual']) !== -1 
                            ? findColIdx(['pengembalian dana setelah diskon', 'refund after seller discount', 'subtotal pengembalian dana setelah diskon penjual']) 
                            : findColIdx(['pengembalian dana', 'refund', 'retur']),
                        adminFees: findColIdx(['total biaya', 'platform fee', 'biaya platform', 'admin fee'], ['ongkir', 'logistik', 'produk']),
                        ads: findColIdx(['iklan gmv max', 'ads cost', 'iklan gmv', 'ads share', 'belanja iklan']),
                        affiliate: findColIdx(['komisi afiliasi', 'komisi mitra', 'affiliate', 'komisi'])
                    };

                    if (colMap.date === -1 || colMap.gross === -1) {
                        previewDetails.innerHTML = `
                            <span style="color: var(--accent-pink); font-weight: bold;">❌ Kolom penting tidak ditemukan.</span><br>
                            <span style="font-size: 11px; color: var(--text-muted);">Kolom Waktu (Tanggal) atau Pendapatan tidak terdeteksi di baris kepala.</span>
                        `;
                        showToast('Kolom Waktu/Tanggal atau Pendapatan tidak ditemukan!', 'error');
                        return;
                    }

                    // Process rows
                    const dailyAggregates = {};

                    for (let r = headerIndex + 1; r < jsonData.length; r++) {
                        const row = jsonData[r];
                        if (!row || row.length === 0) continue;

                        const rawDate = row[colMap.date];
                        if (!rawDate) continue;

                        // Clean and parse date
                        let dateStr = '';
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
                                const parsedD = new Date(rawDate);
                                if (!isNaN(parsedD.getTime())) {
                                    const y = parsedD.getFullYear();
                                    const m = String(parsedD.getMonth() + 1).padStart(2, '0');
                                    const d = String(parsedD.getDate()).padStart(2, '0');
                                    dateStr = `${y}-${m}-${d}`;
                                }
                            }
                        }

                        if (!dateStr) continue;

                        if (!dailyAggregates[dateStr]) {
                            dailyAggregates[dateStr] = {
                                date: dateStr,
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

                        const dayData = dailyAggregates[dateStr];
                        const typeVal = colMap.type !== -1 ? (row[colMap.type] || '').toString().toLowerCase().trim() : 'pesanan';
                        
                        let grossVal = Math.max(0, parseFloat(row[colMap.gross]) || 0);
                        const settlementVal = colMap.settlement !== -1 ? (parseFloat(row[colMap.settlement]) || 0) : 0;
                        const voucherVal = Math.abs(parseFloat(colMap.voucher !== -1 ? row[colMap.voucher] : 0) || 0);
                        const refundVal = Math.abs(parseFloat(colMap.refund !== -1 ? row[colMap.refund] : 0) || 0);
                        const affCommission = Math.abs(parseFloat(colMap.affiliate !== -1 ? row[colMap.affiliate] : 0) || 0);
                        const adsCost = Math.abs(parseFloat(colMap.ads !== -1 ? row[colMap.ads] : 0) || 0);
                        const adminFeesVal = Math.abs(parseFloat(colMap.adminFees !== -1 ? row[colMap.adminFees] : 0) || 0);

                        const grossHeader = headers[colMap.gross] || '';
                        if (grossHeader.includes('pendapatan') || grossHeader.includes('penyelesaian') || grossHeader.includes('payout')) {
                            grossVal = grossVal + voucherVal + refundVal;
                        }

                        if (typeVal.includes('pesanan')) {
                            dayData.gross += grossVal;
                            dayData.vouchers += voucherVal;
                            dayData.refunds += refundVal;
                            dayData.adminFees += adminFeesVal;
                            
                            const orderId = colMap.orderId !== -1 ? (row[colMap.orderId] || '').toString().trim() : null;
                            if (orderId) {
                                dayData.uniqueOrders.add(orderId);
                                dayData.orderIds.push(orderId);
                            }

                            dayData.ordersTotalWeight += 1;
                            if (adsCost > 0) dayData.adsShareSum += 1;
                            if (affCommission > 0) dayData.affShareSum += 1;
                        } else if (typeVal.includes('iklan') || typeVal.includes('ads')) {
                            dayData.adsSpend += Math.abs(settlementVal);
                        } else if (typeVal.includes('pengembalian') || typeVal.includes('refund') || typeVal.includes('adjustment') || settlementVal < 0) {
                            dayData.refunds += Math.abs(settlementVal) + refundVal;
                            dayData.adminFees += adminFeesVal;
                        } else if (typeVal.includes('penggantian') || typeVal.includes('reimbursement') || typeVal.includes('logistik')) {
                            dayData.adjustments += Math.abs(settlementVal);
                        }
                    }

                    // Parse Riwayat penarikan if it exists
                    tempParsedWithdrawals = [];
                    const withdrawalSheetName = workbook.SheetNames.find(n => n.includes('Riwayat penarikan'));
                    if (withdrawalSheetName) {
                        const wSheet = workbook.Sheets[withdrawalSheetName];
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
                                }
                            }
                        }
                    }

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
                } catch (err) {
                    console.error('Error parsing excel:', err);
                    showToast('Gagal membaca file: ' + err.message, 'error');
                }
            };
            reader.readAsArrayBuffer(file);
        });
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

    function saveHppDb() {
        localStorage.setItem('tiktok_sku_hpp', JSON.stringify(hppSkuDb));
    }

    const hppSkuForm = document.getElementById('hpp-sku-form');
    const hppSkuCode = document.getElementById('hpp-sku-code');
    const hppProductName = document.getElementById('hpp-product-name');
    const hppVariation = document.getElementById('hpp-variation');
    const hppUnitValue = document.getElementById('hpp-unit-value');
    const btnCancelHppEdit = document.getElementById('btn-cancel-hpp-edit');
    const btnBackupHpp = document.getElementById('btn-backup-hpp');
    const inputRestoreHpp = document.getElementById('input-restore-hpp');
    const hppSearchInput = document.getElementById('hpp-search-input');
    const hppTableBody = document.getElementById('hpp-table-body');
    const inputOrderFile = document.getElementById('input-order-file');
    const orderFileStatus = document.getElementById('order-file-status');

    let hppEditSku = null;
    let tempParsedOrders = [];

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
            hppTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray">Tidak ada data SKU ditemukan. Silakan tambahkan baru atau impor dari JSON.</td></tr>';
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
                
                document.getElementById('hpp-form-title').textContent = 'Perbarui HPP SKU';
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
    }

    if (hppSkuForm) {
        hppSkuForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const sku = hppSkuCode.value.trim();
            const product = hppProductName.value.trim();
            const variation = hppVariation.value.trim();
            const hppVal = parseFloat(hppUnitValue.value) || 0;

            if (!sku) {
                showToast('Kode SKU tidak boleh kosong!', 'error');
                return;
            }

            hppSkuDb[sku] = {
                sku: sku,
                product: product,
                variation: variation,
                hpp: hppVal
            };

            saveHppDb();
            renderHppTable();
            calculateMetrics();

            hppSkuForm.reset();
            hppSkuCode.disabled = false;
            hppEditSku = null;
            document.getElementById('hpp-form-title').textContent = 'Atur HPP per SKU';
            btnCancelHppEdit.style.display = 'none';

            showToast(`HPP untuk SKU ${sku} berhasil disimpan.`, 'success');
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
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        
                        // Row 0 is headers: SKU, Product Name, Variation, HPP
                        for (let r = 1; r < jsonData.length; r++) {
                            const row = jsonData[r];
                            if (!row || row.length === 0) continue;
                            const skuVal = (row[0] || '').toString().trim();
                            const productVal = (row[1] || '').toString().trim();
                            const variationVal = (row[2] || '').toString().trim();
                            const hppVal = parseFloat(row[3]) || 0;

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
        // Build orderId -> list of order items mapping
        const ordersMap = {};
        tempParsedOrders.forEach(o => {
            const oid = o.orderId;
            if (!ordersMap[oid]) {
                ordersMap[oid] = [];
            }
            ordersMap[oid].push(o);
        });

        let totalHppSum = 0;

        if (tempParsedLogs.length > 0) {
            tempParsedLogs.forEach(log => {
                let dateHpp = 0;
                if (log.orderIds && log.orderIds.length > 0) {
                    log.orderIds.forEach(oid => {
                        const items = ordersMap[oid] || [];
                        items.forEach(o => {
                            const skuInfo = hppSkuDb[o.sku];
                            const hppVal = skuInfo ? (skuInfo.hpp || 0) : 0;
                            dateHpp += o.qty * hppVal;
                        });
                    });
                }

                log.hpp = dateHpp;
                totalHppSum += dateHpp;
            });
        }

        // Also update existing database records in revenueLogs if they have orderIds
        let updatedDatabase = false;
        if (revenueLogs.length > 0 && tempParsedOrders.length > 0) {
            revenueLogs.forEach(log => {
                let dateHpp = 0;
                let hasOrders = false;
                if (log.orderIds && log.orderIds.length > 0) {
                    log.orderIds.forEach(oid => {
                        const items = ordersMap[oid] || [];
                        if (items.length > 0) hasOrders = true;
                        items.forEach(o => {
                            const skuInfo = hppSkuDb[o.sku];
                            const hppVal = skuInfo ? (skuInfo.hpp || 0) : 0;
                            dateHpp += o.qty * hppVal;
                        });
                    });
                }
                if (hasOrders || dateHpp > 0) {
                    log.hpp = dateHpp;
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

            orderFileStatus.textContent = file.name;
            showToast('Membaca file daftar pesanan (SKU)...', 'info');

            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const data = new Uint8Array(evt.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    const targetSheetName = workbook.SheetNames.find(n => n.includes('OrderSKUList') || n.includes('pesanan') || n.includes('Orders'));
                    if (!targetSheetName) {
                        showToast('Sheet OrderSKUList tidak ditemukan di file Pesanan!', 'error');
                        orderFileStatus.textContent = 'Gagal (Sheet tidak ditemukan)';
                        return;
                    }

                    const worksheet = workbook.Sheets[targetSheetName];
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
                        status: headers.findIndex(h => h.includes('status pesanan') || h.includes('order status')),
                        sku: headers.findIndex(h => h.includes('seller sku') || (h.includes('sku') && !h.includes('id'))),
                        product: headers.findIndex(h => h.includes('nama produk') || h.includes('product name')),
                        variation: headers.findIndex(h => h.includes('variasi') || h.includes('variation')),
                        qty: headers.findIndex(h => h.includes('jumlah') || h.includes('quantity')),
                        createdTime: headers.findIndex(h => h.includes('waktu pemesanan') || h.includes('created time'))
                    };

                    tempParsedOrders = [];
                    let newSkusFound = 0;

                    for (let r = headerIndex + 1; r < jsonData.length; r++) {
                        const row = jsonData[r];
                        if (!row || row.length === 0) continue;

                        const statusVal = colMap.status !== -1 ? (row[colMap.status] || '').toString() : '';
                        
                        if (statusVal.includes('Selesai') || statusVal.toLowerCase().includes('completed')) {
                            const orderIdVal = colMap.orderId !== -1 ? (row[colMap.orderId] || '').toString().trim() : '';
                            const skuVal = colMap.sku !== -1 ? (row[colMap.sku] || '').toString().trim() : 'Unknown SKU';
                            const productVal = colMap.product !== -1 ? (row[colMap.product] || '').toString().trim() : '';
                            const variationVal = colMap.variation !== -1 ? (row[colMap.variation] || '').toString().trim() : '';
                            const qtyVal = colMap.qty !== -1 ? parseInt(row[colMap.qty]) || 1 : 1;
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
                                        const parsedD = new Date(rawDate);
                                        if (!isNaN(parsedD.getTime())) {
                                            const y = parsedD.getFullYear();
                                            const m = String(parsedD.getMonth() + 1).padStart(2, '0');
                                            const d = String(parsedD.getDate()).padStart(2, '0');
                                            dateStr = `${y}-${m}-${d}`;
                                        }
                                    }
                                    if (!dateStr) {
                                        const slashMatch = rawDate.toString().match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
                                        if (slashMatch) {
                                            dateStr = `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`;
                                        }
                                    }
                                }
                            }

                            if (!dateStr) continue;

                            tempParsedOrders.push({
                                orderId: orderIdVal,
                                sku: skuVal,
                                product: productVal,
                                variation: variationVal,
                                qty: qtyVal,
                                date: dateStr
                            });

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
                    }

                    if (newSkusFound > 0) {
                        saveHppDb();
                        renderHppTable();
                        showToast(`Menemukan ${newSkusFound} SKU baru! Harap isi HPP mereka di tab Database HPP.`, 'info');
                    }

                    orderFileStatus.textContent = `${file.name} (${tempParsedOrders.length} item)`;
                    showToast(`Selesai membaca ${tempParsedOrders.length} detail pesanan!`, 'success');
                    
                    if (tempParsedLogs.length > 0) {
                        recalculateHppForTempLogs();
                    }
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
    // Initial calls
    // ------------------------------------------
    loadShopSettings();
    calculateMetrics();
    renderDailyLogs();
    renderWithdrawals();
    renderHppTable();
    updateCharts();
});
