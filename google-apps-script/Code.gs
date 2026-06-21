/**
 * Evi & Pepe — RSVP endpoint (Google Apps Script)
 * ------------------------------------------------------------------
 * Receives RSVP submissions from the website and appends a row to the
 * bound Google Sheet. Free + unlimited.
 *
 * SETUP (one time):
 *   1. Open the RSVP Google Sheet.
 *   2. Extensions ▸ Apps Script. Delete any sample code, paste this file.
 *   3. Save. Then Deploy ▸ New deployment ▸ select type "Web app".
 *        - Description: RSVP endpoint
 *        - Execute as:  Me
 *        - Who has access:  Anyone
 *   4. Click Deploy, authorise when prompted, and COPY the
 *      "Web app" URL (it ends in /exec).
 *   5. Put that URL into CONFIG.GOOGLE_APPS_SCRIPT_URL in js/app.js.
 *
 * Re-deploying after edits: Deploy ▸ Manage deployments ▸ edit (pencil)
 * ▸ Version: New version ▸ Deploy. The /exec URL stays the same.
 */

var SHEET_NAME = 'RSVPs';
var HEADERS = [
  'Timestamp', 'Name(s)', 'Email', 'Attending', 'Party size',
  'Dietary needs', 'Events', 'Staying at Olympia', 'Needs bus',
  'Return bus', 'Song request', 'Message', 'Language'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // avoid races if two people submit at once
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getSheet_();
    sheet.appendRow([
      new Date(),
      data.name || '',
      data.email || '',
      data.attending || '',
      data.party || '',
      data.dietary || '',
      (data.events || []).join(', '),
      data.olympia || '',
      data.bus || '',
      data.returnBus || '',
      data.song || '',
      data.message || '',
      data.lang || ''
    ]);
    return json_({ result: 'success' });
  } catch (err) {
    return json_({ result: 'error', message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// lets you open the /exec URL in a browser to confirm it's live
function doGet() {
  return json_({ result: 'ok', message: 'Evi & Pepe RSVP endpoint is live.' });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
