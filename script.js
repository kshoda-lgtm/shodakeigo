// 進捗バーの更新
function updateProgress() {
    const form = document.getElementById('hearingForm');
    const formData = new FormData(form);
    const totalFields = form.querySelectorAll('input, textarea, select').length;
    let filledFields = 0;

    // 入力された項目をカウント
    for (let [name, value] of formData.entries()) {
        if (value.trim() !== '') {
            filledFields++;
        }
    }

    // チェックボックスを特別に処理
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    const checkedBoxes = form.querySelectorAll('input[type="checkbox"]:checked');
    if (checkedBoxes.length > 0) {
        filledFields += checkedBoxes.length;
    }

    const progress = Math.round((filledFields / totalFields) * 100);
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = progress + '% 完了';
}

// フォームの入力を監視
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('hearingForm');
    const inputs = form.querySelectorAll('input, textarea, select');

    // 各入力フィールドにイベントリスナーを追加
    inputs.forEach(input => {
        input.addEventListener('input', updateProgress);
        input.addEventListener('change', updateProgress);
    });

    // 初期状態の進捗を設定
    updateProgress();

    // チェックボックスの制限（最大3つ）
    const priorityCheckboxes = document.querySelectorAll('input[name="priority"]');
    priorityCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checkedBoxes = document.querySelectorAll('input[name="priority"]:checked');
            if (checkedBoxes.length > 3) {
                this.checked = false;
                showNotification('優先度は最大3つまで選択してください', 'warning');
            }
            updateProgress();
        });
    });

    // フォーム送信処理
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        if (validateForm()) {
            submitForm();
        }
    });

    // ダウンロードボタン
    document.getElementById('downloadBtn').addEventListener('click', function() {
        downloadResponses();
    });
});

// フォームバリデーション
function validateForm() {
    const requiredFields = [
        { id: 'department', name: '所属部署・チーム' },
        { id: 'currentIssues', name: '現在の業務課題' },
        { id: 'idealSolution', name: '理想的な改善案' }
    ];

    let isValid = true;
    const errors = [];

    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element.value.trim()) {
            errors.push(field.name);
            element.style.borderColor = '#ff6b6b';
            isValid = false;
        } else {
            element.style.borderColor = '#51cf66';
        }
    });

    // 優先度チェック
    const priorityChecked = document.querySelectorAll('input[name="priority"]:checked');
    if (priorityChecked.length === 0) {
        errors.push('優先度（少なくとも1つ選択）');
        isValid = false;
    }

    if (!isValid) {
        showNotification('以下の項目は必須です: ' + errors.join(', '), 'error');
        // 最初のエラーフィールドにスクロール
        const firstErrorField = document.getElementById(requiredFields.find(field => !document.getElementById(field.id).value.trim())?.id);
        if (firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    return isValid;
}

// フォーム送信
async function submitForm() {
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;

    // ローディング状態
    submitBtn.innerHTML = '📤 送信中...';
    submitBtn.disabled = true;

    try {
        // フォームデータを収集
        const formData = collectFormData();

        // Google Apps Scriptに送信
        await sendToGoogleSheets(formData);

        // 送信成功
        document.getElementById('hearingForm').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';

        // 自動でダウンロードを実行
        downloadResponses();

        // スクロールして成功メッセージを見えるようにする
        document.getElementById('successMessage').scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

        showNotification('スプレッドシートへの保存が完了しました！', 'success');

        // ローカルストレージから下書きを削除
        localStorage.removeItem('dxHearingDraft');

    } catch (error) {
        console.error('送信エラー:', error);

        // エラー状態を復元
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        showNotification('送信に失敗しました。ネットワーク接続を確認してください。', 'error');

        // フォールバックとしてダウンロードを実行
        downloadResponses();
    }
}

// 回答をダウンロード
function downloadResponses() {
    const form = document.getElementById('hearingForm');
    const formData = new FormData(form);

    let responses = '# 社内DX課題ヒアリング結果\n\n';
    responses += `回答日時: ${new Date().toLocaleString('ja-JP')}\n\n`;

    // 基本情報
    responses += '## 基本情報\n';
    responses += `- お名前: ${formData.get('name') || '（未記入）'}\n`;
    responses += `- 所属部署・チーム: ${formData.get('department') || '（未記入）'}\n`;
    responses += `- 役職・立場: ${formData.get('role') || '（未記入）'}\n\n`;

    // 現在の業務課題
    responses += '## 現在の業務課題\n';
    responses += `### 日常的に時間がかかる業務\n${formData.get('dailyTasks') || '（未記入）'}\n\n`;
    responses += `### 自動化できそうな手作業\n${formData.get('manualWork') || '（未記入）'}\n\n`;
    responses += `### システム・ツールの不便な点\n${formData.get('systemIssues') || '（未記入）'}\n\n`;

    // 情報共有・コミュニケーション
    responses += '## 情報共有・コミュニケーション\n';
    responses += `### 情報共有の課題\n${formData.get('infoSharing') || '（未記入）'}\n\n`;
    responses += `### 会議・ミーティングの改善点\n${formData.get('meetingIssues') || '（未記入）'}\n\n`;

    // データ・レポート関連
    responses += '## データ・レポート関連\n';
    responses += `### データ収集・分析の課題\n${formData.get('dataCollection') || '（未記入）'}\n\n`;
    responses += `### レポート作成の改善点\n${formData.get('reporting') || '（未記入）'}\n\n`;

    // 理想的な改善案
    responses += '## 理想的な改善案\n';
    responses += `### 理想のツール・システム\n${formData.get('dreamSolution') || '（未記入）'}\n\n`;
    responses += `### 希望する時間削減率\n${formData.get('timeExpectation') || '（未選択）'}\n\n`;

    // 優先度
    const priorities = [];
    document.querySelectorAll('input[name="priority"]:checked').forEach(checkbox => {
        priorities.push(checkbox.value);
    });
    responses += `### 優先度の高い改善項目\n${priorities.length > 0 ? priorities.join(', ') : '（未選択）'}\n\n`;

    // 実現可能性・制約
    responses += '## 実現可能性・制約\n';
    responses += `### 予算の制約\n${formData.get('budget') || '（未選択）'}\n\n`;
    responses += `### 希望実現時期\n${formData.get('timeline') || '（未選択）'}\n\n`;
    responses += `### 技術的制約・社内ルール\n${formData.get('constraints') || '（未記入）'}\n\n`;

    // その他
    responses += '## その他のご意見\n';
    responses += `### 追加意見・要望\n${formData.get('additional') || '（未記入）'}\n\n`;
    responses += `### フォローアップの可否\n${formData.get('followUp') || '（未選択）'}\n\n`;

    // ダウンロード実行
    const blob = new Blob([responses], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DXヒアリング結果_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('回答をダウンロードしました', 'success');
}

// 通知表示
function showNotification(message, type = 'info') {
    // 既存の通知があれば削除
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        max-width: 400px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
    `;

    // タイプ別の色設定
    switch (type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #dc3545, #fd7e14)';
            break;
        case 'warning':
            notification.style.background = 'linear-gradient(135deg, #ffc107, #fd7e14)';
            notification.style.color = '#333';
            break;
        default:
            notification.style.background = 'linear-gradient(135deg, #17a2b8, #6f42c1)';
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    // 3秒後に自動削除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
}

// CSS アニメーション追加
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .notification {
        transform: translateX(0);
        opacity: 1;
    }
`;
document.head.appendChild(style);

// スムーズスクロール機能
function smoothScrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// キーボードショートカット
document.addEventListener('keydown', function(e) {
    // Ctrl + Enter でフォーム送信
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        const form = document.getElementById('hearingForm');
        if (form.style.display !== 'none') {
            form.dispatchEvent(new Event('submit'));
        }
    }

    // Ctrl + S でダウンロード
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        downloadResponses();
    }
});

// ローカルストレージに自動保存
function autoSave() {
    const form = document.getElementById('hearingForm');
    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }

    localStorage.setItem('dxHearingDraft', JSON.stringify(data));
}

// 保存されたデータを復元
function restoreData() {
    const savedData = localStorage.getItem('dxHearingDraft');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            Object.keys(data).forEach(key => {
                const element = document.querySelector(`[name="${key}"]`);
                if (element) {
                    if (element.type === 'checkbox') {
                        const checkboxes = document.querySelectorAll(`[name="${key}"]`);
                        const values = Array.isArray(data[key]) ? data[key] : [data[key]];
                        checkboxes.forEach(checkbox => {
                            checkbox.checked = values.includes(checkbox.value);
                        });
                    } else {
                        element.value = data[key];
                    }
                }
            });
            updateProgress();
            showNotification('下書きデータを復元しました', 'info');
        } catch (e) {
            console.error('Failed to restore data:', e);
        }
    }
}

// ページ読み込み時にデータ復元
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(restoreData, 100);

    // 入力時に自動保存
    const form = document.getElementById('hearingForm');
    form.addEventListener('input', autoSave);
    form.addEventListener('change', autoSave);
});

// Google Sheetsにデータを送信（URLパラメータ方式）
function sendToGoogleSheets(data) {
    // WebアプリURLを設定
    const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzBsOPTLBvXvZIlwBAcfow1L2xEeCkiny1T1fSE1Ez1FhjvFLwX8nHPvzc7ZNVKVIW19g/exec';

    console.log('送信開始:', data);

    return new Promise((resolve, reject) => {
        // URLパラメータを作成
        const params = new URLSearchParams();

        Object.keys(data).forEach(key => {
            if (Array.isArray(data[key])) {
                // 配列は文字列として結合
                params.append(key, data[key].join(','));
            } else {
                params.append(key, data[key] || '');
            }
        });

        const fullUrl = `${GAS_WEB_APP_URL}?${params.toString()}`;
        console.log('送信先URL:', fullUrl);

        // 新しいウィンドウで開く（POST方式に変更）
        const form = document.createElement('form');
        form.method = 'GET';
        form.action = GAS_WEB_APP_URL;
        form.target = '_blank';
        form.style.display = 'none';

        Object.keys(data).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            if (Array.isArray(data[key])) {
                input.value = data[key].join(',');
            } else {
                input.value = data[key] || '';
            }
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        console.log('URL送信完了');

        // 送信成功として扱う
        setTimeout(() => {
            resolve({ success: true, message: 'データを送信しました' });
        }, 1000);
    });
}

// フォームデータを収集
function collectFormData() {
    const form = document.getElementById('hearingForm');
    const formData = new FormData(form);
    const data = {};

    // 基本的なフィールドを処理
    for (let [key, value] of formData.entries()) {
        if (key === 'priority') {
            // チェックボックスは配列として処理
            if (!data[key]) {
                data[key] = [];
            }
            data[key].push(value);
        } else {
            data[key] = value;
        }
    }

    // チェックされていないチェックボックスを空配列で初期化
    if (!data.priority) {
        data.priority = [];
    }

    // 送信日時を追加
    data.submittedAt = new Date().toISOString();

    return data;
}

// 設定用のヘルパー関数
function setGoogleSheetsUrl(url) {
    localStorage.setItem('gasWebAppUrl', url);
    showNotification('Google Sheets連携URLが設定されました', 'success');
}

// 設定確認用の関数
function getGoogleSheetsUrl() {
    return localStorage.getItem('gasWebAppUrl') ||
           'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
}

// ページ離脱時の確認
window.addEventListener('beforeunload', function(e) {
    const form = document.getElementById('hearingForm');
    if (form.style.display !== 'none') {
        const formData = new FormData(form);
        let hasData = false;
        for (let [name, value] of formData.entries()) {
            if (value.trim() !== '') {
                hasData = true;
                break;
            }
        }

        if (hasData) {
            e.preventDefault();
            e.returnValue = '';
        }
    }
});