/**
 * Google Apps Script - DXヒアリング結果をスプレッドシートに保存
 * シンプルなフォームデータ対応版
 */

// スプレッドシートのIDを設定（URLから取得）
const SPREADSHEET_ID = '1feK-LdtIj902SUUWr74yeXiy84LWiOaSf1MLS7tsv7U';

/**
 * Webアプリのエントリーポイント（POST リクエスト処理）
 */
function doPost(e) {
  try {
    console.log('受信データ:', JSON.stringify(e, null, 2));

    let data;

    // フォームデータまたはJSONデータを処理
    if (e.postData && e.postData.contents) {
      try {
        // JSONデータの場合
        data = JSON.parse(e.postData.contents);
        console.log('JSONデータとして処理:', data);
      } catch (jsonError) {
        console.log('JSON解析失敗、フォームデータとして処理');
        data = e.parameter;
      }
    } else if (e.parameter) {
      // フォームデータの場合
      data = e.parameter;
      console.log('フォームデータとして処理:', data);
    } else {
      throw new Error('データが受信されませんでした');
    }

    // データの検証
    if (!data || Object.keys(data).length === 0) {
      throw new Error('空のデータが送信されました');
    }

    // スプレッドシートにデータを保存
    const result = saveToSheet(data);

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'データが正常に保存されました',
        rowNumber: result.rowNumber,
        spreadsheetUrl: result.spreadsheetUrl
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('Error in doPost:', error);

    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'データの保存に失敗しました: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
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
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('スプレッドシート取得成功:', SPREADSHEET_ID);

    // 「待機中常駐用課題」シートを取得または作成
    let sheet;
    try {
      sheet = spreadsheet.getSheetByName('待機中常駐用課題');
    } catch (e) {
      console.log('シートが見つからないため新規作成');
      sheet = spreadsheet.insertSheet('待機中常駐用課題');
    }

    // ヘッダー行の設定（初回のみ）
    if (sheet.getLastRow() === 0) {
      const headers = ['提出日時', 'ステータス', '提出者', '現在の課題', '自由記述'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

      // ヘッダーのスタイリング
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4a90e2');
      headerRange.setFontColor('#ffffff');

      console.log('ヘッダー行を作成しました');
    }

    // 現在の日時を取得
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');

    // データ行を作成
    const rowData = [
      timestamp,                              // A列: 提出日時
      '未対応',                               // B列: ステータス
      data.name || '匿名',                    // C列: 提出者
      data.currentIssues || '',               // D列: 現在の課題
      data.freeComment || ''                  // E列: 自由記述
    ];

    // 新しい行を追加
    sheet.appendRow(rowData);

    const lastRow = sheet.getLastRow();
    console.log('データを追加しました。行番号:', lastRow);

    return {
      rowNumber: lastRow,
      spreadsheetId: spreadsheet.getId(),
      spreadsheetUrl: spreadsheet.getUrl(),
      success: true
    };

  } catch (error) {
    console.error('saveToSheet エラー:', error);
    throw new Error('スプレッドシートへの保存に失敗: ' + error.toString());
  }
}

/**
 * テスト用関数 - 手動実行でテストデータを保存
 */
function testSaveData() {
  const testData = {
    name: 'テスト太郎',
    currentIssues: '月次レポートの作成に時間がかかる',
    freeComment: '自動化したい'
  };

  try {
    const result = saveToSheet(testData);
    console.log('テスト完了:', result);
    return result;
  } catch (error) {
    console.error('テスト失敗:', error);
    throw error;
  }
}