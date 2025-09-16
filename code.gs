/**
 * Google Apps Script - DXヒアリング結果をスプレッドシートに保存
 *
 * 設定手順:
 * 1. Google Apps Scriptで新しいプロジェクトを作成
 * 2. このコードを貼り付け
 * 3. SPREADSHEET_ID を対象のスプレッドシートIDに変更
 * 4. doPost関数をWebアプリとして公開
 * 5. アクセス権限を「全員」に設定
 */

// スプレッドシートのIDを設定（URLから取得）
const SPREADSHEET_ID = '1feK-LdtIj902SUUWr74yeXiy84LWiOaSf1MLS7tsv7U';
// 対象シート名を設定
const SHEET_NAME = '待機中常駐用課題';

/**
 * Webアプリのエントリーポイント（GET リクエスト処理）
 */
function doGet(e) {
  try {
    console.log('GET受信データ:', JSON.stringify(e.parameter, null, 2));

    const data = e.parameter || {};

    // データが空の場合はテスト画面を表示
    if (Object.keys(data).length === 0) {
      return HtmlService.createHtmlOutput(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>DXヒアリングフォーム - 受信待機中</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .info { color: #666; font-size: 18px; margin-bottom: 20px; }
            .status { color: #28a745; font-size: 24px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="status">✅ Webアプリは正常に動作しています</div>
          <div class="info">DXヒアリングフォームからの送信をお待ちしています</div>
          <div class="info">このページは直接アクセス用です</div>
        </body>
        </html>
      `);
    }

    // priorityが文字列の場合は配列に変換
    if (data.priority && typeof data.priority === 'string') {
      data.priority = data.priority.split(',').map(item => item.trim());
    }

    console.log('最終処理データ:', JSON.stringify(data, null, 2));

    // スプレッドシートにデータを保存
    const result = saveToSheet(data);

    // 成功ページを表示
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>送信完了</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
          .info { color: #666; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="success">✅ 送信完了！</div>
        <div class="info">ヒアリング内容がスプレッドシートに保存されました</div>
        <div class="info">追加された業務項目数: ${result.itemsAdded}</div>
        <div class="info">このタブは閉じていただいて構いません</div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Error in doGet:', error);

    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>送信エラー</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #dc3545; font-size: 24px; margin-bottom: 20px; }
          .info { color: #666; }
        </style>
      </head>
      <body>
        <div class="error">❌ 送信エラー</div>
        <div class="info">エラー: ${error.toString()}</div>
      </body>
      </html>
    `);
  }
}

/**
 * Webアプリのエントリーポイント（POST リクエスト処理）
 */
function doPost(e) {
  try {
    let data;

    console.log('受信した生データ:', JSON.stringify(e, null, 2));

    // 必ずフォームデータとして処理（e.parameterを使用）
    data = e.parameter || {};
    console.log('フォームデータとして処理:', JSON.stringify(data, null, 2));

    // データが空の場合はエラー
    if (Object.keys(data).length === 0) {
      throw new Error('フォームデータが受信されませんでした');
    }

    // 配列データを解析（JSON文字列になっている場合）
    if (data.priority && typeof data.priority === 'string') {
      try {
        data.priority = JSON.parse(data.priority);
        console.log('priority配列を解析:', data.priority);
      } catch (parseError) {
        // JSON解析に失敗した場合は単一値として扱う
        data.priority = [data.priority];
        console.log('priorityを単一値として処理:', data.priority);
      }
    }

    console.log('最終処理データ:', JSON.stringify(data, null, 2));

    // スプレッドシートにデータを保存
    const result = saveToSheet(data);

    // 成功ページを表示
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>送信完了</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
          .info { color: #666; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="success">✅ 送信完了！</div>
        <div class="info">ヒアリング内容がスプレッドシートに保存されました</div>
        <div class="info">追加された業務項目数: ${result.itemsAdded}</div>
        <div class="info">このタブは閉じていただいて構いません</div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Error in doPost:', error);

    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>送信エラー</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #dc3545; font-size: 24px; margin-bottom: 20px; }
          .info { color: #666; }
        </style>
      </head>
      <body>
        <div class="error">❌ 送信エラー</div>
        <div class="info">エラー: ${error.toString()}</div>
      </body>
      </html>
    `);
  }
}

/**
 * プリフライトリクエスト処理（CORS対応）
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

/**
 * ヒアリングデータをスプレッドシートに保存
 */
function saveToSheet(data) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet;

  // まずシート名で取得を試行
  try {
    sheet = spreadsheet.getSheetByName(SHEET_NAME);
  } catch (e) {
    console.warn('指定されたシート名が見つかりません:', SHEET_NAME);
  }

  // シート名で取得できない場合は、最初のシートを使用
  if (!sheet) {
    const sheets = spreadsheet.getSheets();
    if (sheets.length > 0) {
      sheet = sheets[0];
      console.log('最初のシートを使用:', sheet.getName());
    } else {
      // シートが全くない場合は新規作成
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      console.log('新しいシートを作成:', SHEET_NAME);
    }
  }

  // ヘッダー行が存在するかチェック（A1セルが空の場合はヘッダーを追加）
  if (sheet.getRange(1, 1).getValue() === '') {
    sheet.getRange(1, 1, 1, 3).setValues([['業務', '依頼人', '業務内容']]);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
  }

  // ヒアリング内容を解析して業務リストを作成
  const businessItems = extractBusinessItems(data);

  // 各業務項目をシートに追加
  const results = [];

  businessItems.forEach((item, index) => {
    const rowData = [
      item.business,           // A列: 業務
      data.name || '匿名',     // B列: 依頼人
      item.content             // C列: 業務内容
    ];

    // 新しい行を追加
    sheet.appendRow(rowData);

    results.push({
      rowNumber: sheet.getLastRow(),
      business: item.business,
      content: item.content
    });
  });

  return {
    rowNumber: sheet.getLastRow(),
    itemsAdded: results.length,
    items: results
  };
}

/**
 * ヒアリング回答から具体的な業務項目を抽出
 */
function extractBusinessItems(data) {
  const items = [];

  // 現在の課題から抽出
  if (data.currentIssues) {
    const issues = parseTasksFromText(data.currentIssues);
    issues.forEach(issue => {
      items.push({
        business: '現在の課題',
        content: issue
      });
    });
  }

  // 理想的な解決案から抽出
  if (data.idealSolution) {
    const solutions = parseTasksFromText(data.idealSolution);
    solutions.forEach(solution => {
      items.push({
        business: '理想的な解決案',
        content: solution
      });
    });
  }

  // 自由記述欄から抽出
  if (data.freeComment) {
    const comments = parseTasksFromText(data.freeComment);
    comments.forEach(comment => {
      items.push({
        business: '自由記述',
        content: comment
      });
    });
  }

  // 旧フィールド名との互換性維持（念のため）
  if (data.dailyTasks) {
    const tasks = parseTasksFromText(data.dailyTasks);
    tasks.forEach(task => {
      items.push({
        business: '日常業務効率化',
        content: task
      });
    });
  }

  if (data.dreamSolution) {
    const solutions = parseTasksFromText(data.dreamSolution);
    solutions.forEach(solution => {
      items.push({
        business: '新規ツール開発',
        content: solution
      });
    });
  }

  // 最低1つは確実に項目を作成
  if (items.length === 0) {
    items.push({
      business: 'DX全般相談',
      content: `${data.department || '部署不明'}でのDX化推進に関する相談`
    });
  }

  return items;
}

/**
 * テキストから個別のタスクを抽出
 */
function parseTasksFromText(text) {
  if (!text || text.trim() === '') return [];

  // 改行、句点、「など」で分割
  const tasks = text
    .split(/[\n。、，]|など/)
    .map(task => task.trim())
    .filter(task => task.length > 5) // 短すぎるものは除外
    .slice(0, 3); // 最大3つまで

  return tasks.length > 0 ? tasks : [text.trim()];
}


/**
 * テスト用関数 - 手動実行でテストデータを保存
 */
function testSaveData() {
  const testData = {
    name: 'テスト太郎',
    department: 'システム部',
    role: 'マネージャー',
    dailyTasks: '月次レポートの作成に丸一日かかる。データ集計が手作業で大変。',
    manualWork: '毎週エクセルで売上データを集計している',
    systemIssues: 'システムが重くて作業効率が悪い',
    infoSharing: '部署間の情報共有が滞っている',
    dataCollection: 'データが散在していて分析が困難',
    dreamSolution: '全自動でレポートが作成されるシステム',
    priority: ['業務の自動化', 'データ集計・分析の効率化'],
    timeline: '3ヶ月以内',
    budget: 'ROI重視'
  };

  try {
    const result = saveToSheet(testData);
    console.log('Test completed:', result);
    return result;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}