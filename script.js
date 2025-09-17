// プログレスバーの更新
function updateProgress() {
    const form = document.getElementById('hearingForm');
    const requiredFields = form.querySelectorAll('[required]');
    const totalFields = form.querySelectorAll('input, textarea').length;
    let filledFields = 0;

    form.querySelectorAll('input, textarea').forEach(field => {
        if (field.value.trim() !== '') {
            filledFields++;
        }
    });

    const percentage = Math.round((filledFields / totalFields) * 100);
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    if (progressFill) {
        progressFill.style.width = percentage + '%';
    }
    if (progressText) {
        progressText.textContent = percentage + '% 完了';
    }
}

// Google Apps Script WebアプリのURL（デプロイ後に設定）
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwTaejYh_X2JLteHK3A2LVAOuI7ST_p08D72XZjHQAHP9ZIMz9kpLkCgJXcwTGdZiJJIQ/exec'; // GASのWebアプリURL

// フォーム送信処理
function handleFormSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    const form = document.getElementById('hearingForm');
    const formData = new FormData(form);

    // 必須フィールドのチェック
    const currentIssues = document.getElementById('currentIssues');
    if (!currentIssues.value.trim()) {
        alert('「現在の業務で困っていること」は必須項目です。');
        currentIssues.focus();
        return false;
    }

    // フォームデータの整理（GAS用フォーマット）
    const data = {
        timestamp: new Date().toLocaleString('ja-JP'),
        name: formData.get('name') || '匿名',
        currentIssues: formData.get('currentIssues'),
        freeComment: formData.get('freeComment'),
        // GASで期待される追加フィールド
        dailyTasks: formData.get('currentIssues'), // 現在の課題を日常業務として送信
        manualWork: '', // 手作業の内容（必要に応じて追加）
        systemIssues: '', // システムの問題（必要に応じて追加）
        infoSharing: '', // 情報共有の問題（必要に応じて追加）
        dreamSolution: formData.get('freeComment'), // 理想的な解決案として自由記述を使用
        priority: [], // 優先度（必要に応じて追加）
        timeline: '未定',
        budget: '未定'
    };

    // ローカルストレージに保存
    try {
        const savedData = JSON.parse(localStorage.getItem('dxHearingData') || '[]');
        savedData.push(data);
        localStorage.setItem('dxHearingData', JSON.stringify(savedData));
    } catch (error) {
        console.error('ローカル保存エラー:', error);
    }

    // Google Apps Scriptに送信
    if (GAS_WEB_APP_URL && GAS_WEB_APP_URL !== 'YOUR_GAS_WEB_APP_URL_HERE') {
        sendToGoogleSheets(data);
    } else {
        console.warn('GAS WebアプリURLが設定されていません。スプレッドシートへの送信はスキップされます。');
        showSuccessMessage();
    }

    return false;
}

// Google Sheetsへのデータ送信
function sendToGoogleSheets(data) {
    // 送信中の表示
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '送信中...';
    submitBtn.disabled = true;

    // フォームデータとして送信するためのURLSearchParams作成
    const formData = new URLSearchParams();
    formData.append('name', data.name || '匿名');
    formData.append('currentIssues', data.currentIssues || '');
    formData.append('freeComment', data.freeComment || '');
    formData.append('timestamp', data.timestamp || '');

    console.log('送信データ:', Object.fromEntries(formData));

    fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors', // CORSエラーを回避
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
    })
    .then(() => {
        // no-corsモードではレスポンスを読めないため、送信完了と見なす
        console.log('データ送信完了（フォームデータ形式）');
        showSuccessMessage();
    })
    .catch(error => {
        console.error('送信エラー:', error);
        alert('スプレッドシートへの送信に失敗しました。ただし、データはローカルに保存されています。');
        showSuccessMessage();
    })
    .finally(() => {
        // ボタンを元に戻す
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// 成功メッセージ表示
function showSuccessMessage() {
    const form = document.getElementById('hearingForm');
    const successMessage = document.getElementById('successMessage');

    if (successMessage) {
        form.style.display = 'none';
        successMessage.style.display = 'block';

        // 3秒後にフォームをリセット
        setTimeout(() => {
            form.reset();
            updateProgress();
            form.style.display = 'block';
            successMessage.style.display = 'none';
        }, 3000);
    }
}

// ダウンロード処理
function handleDownload(e) {
    e.preventDefault();
    e.stopPropagation();

    const form = document.getElementById('hearingForm');
    const formData = new FormData(form);

    const data = {
        timestamp: new Date().toLocaleString('ja-JP'),
        name: formData.get('name') || '匿名',
        currentIssues: formData.get('currentIssues'),
        freeComment: formData.get('freeComment')
    };

    // テキストファイルとして作成
    const content = `社内DX課題ヒアリングシート
=====================================
記入日時: ${data.timestamp}
お名前: ${data.name}

【現在の業務で困っていること・改善したいこと】
${data.currentIssues || '未記入'}

【その他・要望】
${data.freeComment || '未記入'}
=====================================`;

    // Blob作成とダウンロード
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DXヒアリング_${data.timestamp.replace(/[\/\s:]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return false;
}

// DOMContentLoaded時の処理
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('hearingForm');
    const submitBtn = document.getElementById('submitBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    // ページ読み込み時にフォームをリセット
    if (form) {
        form.reset();
    }

    // プログレスバー初期化
    updateProgress();

    // 入力フィールドの変更を監視
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', updateProgress);
        input.addEventListener('change', updateProgress);
    });

    // フォーム送信イベント（PC・モバイル両対応）
    if (form) {
        // formのsubmitイベント
        form.addEventListener('submit', handleFormSubmit, { passive: false });
    }

    // 送信ボタンのイベント（モバイル対応強化）
    if (submitBtn) {
        // タッチイベントのフラグ
        let touchHandled = false;

        // タッチスタートイベント
        submitBtn.addEventListener('touchstart', function(e) {
            touchHandled = false;
        }, { passive: true });

        // タッチエンドイベント（モバイル専用）
        submitBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            touchHandled = true;
            handleFormSubmit(e);
        }, { passive: false });

        // クリックイベント（PCとモバイルのフォールバック）
        submitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // タッチイベントが処理された場合はスキップ
            if (touchHandled) {
                touchHandled = false;
                return;
            }
            handleFormSubmit(e);
        }, { passive: false });

        // ボタンのスタイル調整（モバイル対応）
        submitBtn.style.touchAction = 'manipulation';
        submitBtn.style.webkitTapHighlightColor = 'transparent';
        submitBtn.style.cursor = 'pointer';
    }

    // ダウンロードボタンのイベント（モバイル対応強化）
    if (downloadBtn) {
        // タッチイベントのフラグ
        let downloadTouchHandled = false;

        // タッチスタートイベント
        downloadBtn.addEventListener('touchstart', function(e) {
            downloadTouchHandled = false;
        }, { passive: true });

        // タッチエンドイベント（モバイル専用）
        downloadBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            downloadTouchHandled = true;
            handleDownload(e);
        }, { passive: false });

        // クリックイベント（PCとモバイルのフォールバック）
        downloadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // タッチイベントが処理された場合はスキップ
            if (downloadTouchHandled) {
                downloadTouchHandled = false;
                return;
            }
            handleDownload(e);
        }, { passive: false });

        // ボタンのスタイル調整（モバイル対応）
        downloadBtn.style.touchAction = 'manipulation';
        downloadBtn.style.webkitTapHighlightColor = 'transparent';
        downloadBtn.style.cursor = 'pointer';
    }

    // iOSのズーム防止
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    // ダブルタップによるズーム防止
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
});

// デバッグ用：コンソールに情報を出力
console.log('Script loaded successfully');
console.log('User Agent:', navigator.userAgent);
console.log('Touch Supported:', 'ontouchstart' in window);