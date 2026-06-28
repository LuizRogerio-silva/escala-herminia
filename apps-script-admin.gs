/*
  Apps Script — Escala Yuricy com JSON no Google Drive

  Como usar:
  1. Abra script.google.com.
  2. Crie/abra o projeto da Escala Yuricy.
  3. Cole este arquivo inteiro.
  4. Troque ADMIN_TOKEN para a senha real do Admin.
  5. Implante como Web App:
     - Executar como: você
     - Quem tem acesso: qualquer pessoa
  6. Copie a URL /exec para o site, se trocar a implantação.
*/

const ADMIN_TOKEN = 'troque-esta-senha';
const FOLDER_ID = '19gUe5NYSmZXuVMdQ5ltXWYIf5unHAY9J';
const JSON_FILE_NAME = 'escala_dados.json';

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'getEscalaJson');

    if (action === 'ping') {
      return json_({ ok:true, agora:new Date().toISOString() });
    }

    if (action === 'getEscalaJson') {
      return json_({
        ok:true,
        dados: readJson_()
      });
    }

    return json_({ ok:false, erro:'Ação GET inválida.' });
  } catch (err) {
    return json_({ ok:false, erro:String(err.message || err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (body.token !== ADMIN_TOKEN) {
      return json_({ ok:false, erro:'Senha de administrador inválida.' });
    }

    const action = String(body.action || '').trim();

    if (action === 'saveEscalaItem') {
      return saveEscalaItem_(body);
    }

    if (action === 'saveEscalaJson') {
      writeJson_(body.dados || {});
      return json_({ ok:true });
    }

    return json_({ ok:false, erro:'Ação POST inválida.' });
  } catch (err) {
    return json_({ ok:false, erro:String(err.message || err) });
  }
}

function saveEscalaItem_(body) {
  const data = String(body.data || '').trim();
  const trabalho = String(body.trabalho || '').trim();
  const ninfa = String(body.ninfa || '').trim().toUpperCase();
  const luaSol = String(body.luaSol || '').trim().toUpperCase();

  if (!data || !trabalho || !ninfa) {
    return json_({ ok:false, erro:'Data, trabalho e missionária são obrigatórios.' });
  }

  const dados = readJson_();
  const key = data + '||' + normalizar_(trabalho);

  dados[key] = {
    data,
    trabalho,
    ninfa,
    luaSol,
    atualizadoEm: new Date().toISOString()
  };

  writeJson_(dados);
  return json_({ ok:true, key, dados });
}

function readJson_() {
  const file = getJsonFile_();
  const txt = file.getBlob().getDataAsString('UTF-8').trim();
  if (!txt) return {};
  try {
    const parsed = JSON.parse(txt);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (err) {
    throw new Error('O arquivo ' + JSON_FILE_NAME + ' não contém JSON válido: ' + err.message);
  }
}

function writeJson_(obj) {
  const file = getJsonFile_();
  file.setContent(JSON.stringify(obj || {}, null, 2));
}

function getJsonFile_() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFilesByName(JSON_FILE_NAME);
  if (files.hasNext()) return files.next();
  return folder.createFile(JSON_FILE_NAME, '{}', MimeType.PLAIN_TEXT);
}

function normalizar_(s) {
  return String(s || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
