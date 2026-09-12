/**
 * Cloudflare Worker：GitHub 共同房號寫入閘道
 *
 * 不使用資料庫。Worker 本身不保存房號；每次寫入時：
 * 1. 從 GitHub 取得 rooms.txt 最新內容 + blob SHA，並讀取其中的 GUIDE_PASSWORD
 * 2. 驗證導遊密碼
 * 3. 僅修改指定 memberId 的一列
 * 4. 使用 GitHub Contents API 寫回
 * 5. 若多人同時修改造成版本衝突，重新讀取並重試一次
 *
 * Cloudflare Secret：
 *   GITHUB_TOKEN       GitHub fine-grained token，至少 Contents: write
 *
 * GUIDE_PASSWORD 直接記錄於 data/rooms.txt；此設定不適合重要密碼。
 * 可選 Vars：
 *   ALLOWED_ORIGIN     GitHub Pages 網址，例如 https://example.github.io
 */

const CONFIG = {
  githubApi: 'https://api.github.com',
  owner: 'YOUR_GITHUB_OWNER',
  repo: 'YOUR_GITHUB_REPO',
  branch: 'main',
  path: 'data/rooms.txt',
  tourId: '26091304D',
  maxAttempts: 2,
};

function corsHeaders(origin, env) {
  const allowed = env.ALLOWED_ORIGIN || '*';
  const allowOrigin = allowed === '*' ? '*' : (origin === allowed ? origin : allowed);
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function jsonResponse(body, status, origin, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      ...corsHeaders(origin, env),
    },
  });
}

function githubHeaders(env) {
  return {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
    'X-GitHub-Api-Version': '2026-03-10',
    'User-Agent': 'travel-room-gateway',
  };
}

function validateMemberId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id >= 1 && id <= 15 ? id : null;
}

function validateRoom(value) {
  const room = String(value ?? '').trim();
  return room === '' || /^[0-9A-Za-z-]{1,12}$/.test(room) ? room : null;
}

function parseGitHubContent(payload) {
  if (!payload?.content || !payload?.sha) {
    throw new Error('GitHub 回傳檔案資料不完整。');
  }

  const normalized = payload.content.replace(/\n/g, '');
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return {
    text: new TextDecoder('utf-8').decode(bytes),
    sha: payload.sha,
  };
}

function extractGuidePassword(text) {
  const match = String(text).match(/^\s*#\s*GUIDE_PASSWORD\s*=\s*(.*?)\s*$/mi);
  return match ? match[1].trim() : '';
}

function updateRoomsText(text, memberId, room) {
  const lines = String(text).split(/\r?\n/);
  let found = false;

  const updated = lines.map(line => {
    const match = line.match(/^\s*(\d+)\|([^\r\n]*)$/);
    if (!match || Number(match[1]) !== memberId) return line;
    found = true;
    return `${memberId}|${room}`;
  });

  if (!found) updated.push(`${memberId}|${room}`);
  return updated.join('\n');
}

async function getRoomsFile(env) {
  const url = `${CONFIG.githubApi}/repos/${encodeURIComponent(CONFIG.owner)}/${encodeURIComponent(CONFIG.repo)}/contents/${CONFIG.path}?ref=${encodeURIComponent(CONFIG.branch)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: githubHeaders(env),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub 讀取失敗 (${response.status}): ${detail.slice(0, 300)}`);
  }

  return parseGitHubContent(await response.json());
}

async function putRoomsFile(env, text, sha, memberId) {
  const url = `${CONFIG.githubApi}/repos/${encodeURIComponent(CONFIG.owner)}/${encodeURIComponent(CONFIG.repo)}/contents/${CONFIG.path}`;
  const contentBase64 = btoa(String.fromCharCode(...new TextEncoder().encode(text)));

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      ...githubHeaders(env),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Update room for member ${memberId}`,
      content: contentBase64,
      sha,
      branch: CONFIG.branch,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`GitHub 寫入失敗 (${response.status}): ${detail.slice(0, 300)}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function handleRoomUpdate(request, env) {
  const origin = request.headers.get('Origin') || '';

  if (!env.GITHUB_TOKEN) {
    return jsonResponse({ error: 'Worker 尚未設定 GITHUB_TOKEN Secret。' }, 500, origin, env);
  }

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return jsonResponse({ error: '請求內容不是有效 JSON。' }, 400, origin, env);
  }

  if (body.tourId !== CONFIG.tourId) {
    return jsonResponse({ error: '團號不符。' }, 400, origin, env);
  }

  // 密碼位於 rooms.txt，避免前端直接取得或在 HTML 內暴露。
  // 由於 rooms.txt 本身可被公開讀取，這只是低重要性用途的操作門檻，不是安全認證。
  let currentForPassword;
  try {
    currentForPassword = await getRoomsFile(env);
  } catch (error) {
    return jsonResponse({ error: error?.message || '無法讀取共同房號資料。' }, 500, origin, env);
  }
  const guidePassword = extractGuidePassword(currentForPassword.text);
  if (!guidePassword || String(body.password ?? '') !== guidePassword) {
    return jsonResponse({ error: '導遊密碼錯誤。' }, 401, origin, env);
  }

  const memberId = validateMemberId(body.memberId);
  if (!memberId) {
    return jsonResponse({ error: '團員編號無效。' }, 400, origin, env);
  }

  const room = validateRoom(body.room);
  if (room === null) {
    return jsonResponse({ error: '房號格式無效。' }, 400, origin, env);
  }

  let lastError = null;
  for (let attempt = 1; attempt <= CONFIG.maxAttempts; attempt += 1) {
    try {
      const current = attempt === 1 ? currentForPassword : await getRoomsFile(env);
      const nextText = updateRoomsText(current.text, memberId, room);
      await putRoomsFile(env, nextText, current.sha, memberId);
      return jsonResponse({ ok: true, memberId, room, attempt }, 200, origin, env);
    } catch (error) {
      lastError = error;
      // GitHub Contents API 在多人同時更新時可能回 409/422；重新讀取最新 SHA 後再試一次。
      if (![409, 422].includes(error.status) || attempt >= CONFIG.maxAttempts) break;
    }
  }

  return jsonResponse({ error: lastError?.message || '寫入失敗。' }, 500, origin, env);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/room') {
      return jsonResponse({ error: 'Not Found' }, 404, origin, env);
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method Not Allowed' }, 405, origin, env);
    }

    try {
      return await handleRoomUpdate(request, env);
    } catch (error) {
      console.error(error);
      return jsonResponse({ error: error?.message || 'Server error' }, 500, origin, env);
    }
  },
};
