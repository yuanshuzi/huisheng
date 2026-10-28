'use strict';

/* ============================================================
   配置区 / CONFIG
   ============================================================ */

/**
 * CONTACT — 聊天中的两个人。
 * me 固定渲染在右侧，other 固定渲染在左侧。
 * aliases 用于解析剧本中的不同称呼。
 */
const CONTACT = {
  me: {
    name: '沈言',
    avatar: '言',
    avatarImage: '',
    status: '在线',
    accent: '#3f74e0',
    aliases: ['我', '自己', 'me'],
  },
  other: {
    name: '林雾',
    avatar: '雾',
    avatarImage: '',
    status: '在线 · 正在听雨',
    accent: '#5f83ba',
    aliases: ['她', '他', '对方', 'ta', 'TA', 'other'],
  },
};

/** 群聊里新增人物的头像底色，按加入顺序循环取用。 */
const GROUP_ACCENTS = [
  '#4a78d6',
  '#a2704f',
  '#5f83ba',
  '#7f6bb0',
  '#4f9577',
  '#b95555',
  '#3f8fa8',
  '#a86b8f',
];

/** 一个群最多 12 位人物（含自己）。 */
const MAX_CONTACTS = 12;
const DEFAULT_GROUP_NAME = '雨夜小群';
const CAST_STORAGE_KEY = 'echo-cast-v1';

/**
 * INITIAL — 进入场景时就已存在的对话。
 * 和 script 共用三种节点：message / system / time。
 */const INITIAL = [
  { type: 'time', text: '今天 21:07' },
  { type: 'system', text: '你们已互相关注' },
  { type: 'message', from: 'other', text: '你那边，雨停了吗？' },
  { type: 'message', from: 'me', text: '刚停。窗户上全是水。' },
  { type: 'message', from: 'other', text: '那正好。适合讲一个很长的故事。' },
  { type: 'message', from: 'me', text: '洗耳恭听。' },
];

/**
 * SCRIPT — 纯文本剧本。
 * 语法：
 *   林雾：台词
 *   [系统] 系统提示
 *   [时间] 21:07
 *   # 注释
 */
const SCRIPT = `
林雾：从前有一个人，住在总在下雨的城市。
林雾：她每天出门，都会带两把伞。
沈言：另一把给谁？
林雾：给一个她还没遇见的人。
沈言：后来呢？
林雾：后来那个人真的出现了。
林雾：但他从来不带伞。
[系统] 林雾撤回了一条消息
沈言：我看见了。
林雾：那就当没看见。
[时间] 21:19
林雾：故事讲完了。你那边还下雨吗？
沈言：停了。现在窗外有月亮。
林雾：那明天见？
沈言：明天见。
`;

const DEFAULT_SCRIPT = SCRIPT;

const IMPORT_SAMPLE = `# 一段雨夜对话
[时间] 今天 23:14
[系统] 你已通过好友验证
林雾：睡了吗？
沈言：还没。刚关掉电脑。
林雾：那陪我说会儿话吧。
沈言：好啊，说什么？
林雾：说一件你今天最想告诉我，却一直没说的事。
沈言：今天路过花店，看见一束很像我第一次送你的花。
[系统] 林雾正在输入…
林雾：那你怎么没买？
沈言：因为不知道你还会不会喜欢。
林雾：你明天带来，我就告诉你。
沈言：好。明天见。
`;

const GROUP_SAMPLE = `# 三个人的深夜群聊
[时间] 今天 23:40
[系统] 你邀请「江栖」加入了群聊
林雾：都睡了吗？
沈言：没。在等一个人先开口。
江栖：刚洗完澡，发生什么了？
林雾：沈言说，他有件事一直没告诉我们。
沈言：其实我明天要搬走了。
江栖：搬去哪？
沈言：海边。离这里两个小时车程。
林雾：那我们今晚把话说完。
江栖：好啊，从头讲起。
`;

/** 「文本转对话」的示例段落：一段叙述，按句号切成气泡；单独一行的时间会变成时间节点。 */
const SPLIT_SAMPLE = `23:40
雨停在凌晨三点。她把窗推开一条缝，湿气带着铁锈味涌进来。那就今晚把话说完吧。她没有回答，只是把台灯调暗了一格。
明天下午的车，走之前想再见你一次。几点？四点半，老地方。`;

/**
 * TIMING — 节奏公式。所有时长都与字数相关，单位为毫秒。
 * pace 是全局节奏系数，speed 是播放器倍速。
 */
const TIMING = {
  message: {
    waitBase: 260,
    waitPerChar: 26,
    waitMin: 420,
    waitMax: 2100,
    typingBase: 520,
    typingPerChar: 64,
    typingMin: 760,
    typingMax: 4300,
    afterIncoming: 260,
    afterOutgoing: 150,
  },
  system: {
    waitBase: 620,
    waitPerChar: 30,
    waitMin: 720,
    waitMax: 2200,
    after: 180,
  },
  time: {
    wait: 700,
    after: 120,
  },
};

const SPEED_OPTIONS = [0.75, 1, 1.5, 2];
const PACE_OPTIONS = [0.75, 1, 1.3];
const EMOJIS = ['🌧️', '🌙', '☕️', '✨', '🫧', '🌷', '🎧', '🫶', '🥲', '🐈'];

const AVATAR_STORAGE_KEY = 'echo-avatars-v1';
const TOPBAR_STORAGE_KEY = 'echo-topbar-collapsed';
const COUNTDOWN_STORAGE_KEY = 'echo-countdown';
const COUNTDOWN_DEFAULT = 6;
const AVATAR_SIZE = 256;
const AVATAR_MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/* ============================================================
   工具 / UTILITIES
   ============================================================ */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function charCount(text) {
  return Array.from(String(text ?? '').replace(/\s+/gu, '')).length;
}

function formatDuration(milliseconds) {
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function makeIcon(name, className = '') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', `icon ${className}`.trim());
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

function replaceIcon(host, name) {
  if (!host) return;
  const use = host.querySelector('use');
  if (use) use.setAttribute('href', `#i-${name}`);
}

function pad2(number) {
  return String(number).padStart(2, '0');
}

function extractClock(text) {
  const match = String(text ?? '').match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return `${pad2(hour)}:${pad2(minute)}`;
}

function getOtherId() {
  return Object.keys(CONTACT).find((id) => id !== 'me') || 'other';
}

/** 除自己之外的所有人物，按加入顺序。 */
function otherEntries() {
  return Object.entries(CONTACT).filter(([id]) => id !== 'me');
}

function otherCount() {
  return Math.max(0, Object.keys(CONTACT).length - 1);
}

function safeContact(id) {
  return CONTACT[id] || CONTACT[getOtherId()] || {
    name: '未知联系人',
    avatar: '?',
    avatarImage: '',
    status: '离线',
    accent: '#8b8b8b',
  };
}

/* ============================================================
   剧本解析器 / PARSER
   ============================================================ */

class ScriptParseError extends Error {
  constructor(message, line = 1) {
    super(message);
    this.name = 'ScriptParseError';
    this.line = line;
  }

  get display() {
    return `第 ${this.line} 行：${this.message}`;
  }
}

function normalizeSpeaker(value) {
  return String(value ?? '')
    .trim()
    .replace(/^[@＠]/, '')
    .toLowerCase();
}

function resolveContactId(speaker) {
  const target = normalizeSpeaker(speaker);
  if (!target) return null;

  for (const [id, contact] of Object.entries(CONTACT)) {
    if (normalizeSpeaker(id) === target) return id;
    if (normalizeSpeaker(contact.name) === target) return id;
    if ((contact.aliases || []).some((alias) => normalizeSpeaker(alias) === target)) return id;
  }

  return null;
}

/**
 * createContact(name) — 往人物表里加一位新角色，返回它的 id。
 * 剧本里出现未知人名时会自动调用，也可以从控制台手动添加。
 */
function createContact(name, options = {}) {
  const clean = String(name ?? '')
    .trim()
    .replace(/[:：]/gu, '');
  if (!clean) return null;

  const existing = resolveContactId(clean);
  if (existing) return existing;
  if (Object.keys(CONTACT).length >= MAX_CONTACTS) return null;

  const index = Object.keys(CONTACT).length;
  const id = options.id || `m${Date.now().toString(36)}${index}`;
  const usedAccents = new Set(Object.values(CONTACT).map((contact) => contact.accent));
  const accent =
    GROUP_ACCENTS.find((color) => !usedAccents.has(color)) ||
    GROUP_ACCENTS[index % GROUP_ACCENTS.length];

  CONTACT[id] = {
    name: clean.slice(0, 12),
    avatar: Array.from(clean)[0] || '?',
    avatarImage: '',
    status: '在线',
    accent,
    aliases: [],
  };
  return id;
}

/**
 * parseScript(text, options) -> Array<MessageNode | SystemNode | TimeNode>
 * 纯文本 → 结构化数组。
 *
 * options.autoCreate    —— 遇到不认识的说话人时自动创建人物（导入 / 应用剧本时使用）
 * options.collectUnknown —— 预览时收集未知人名，占位为人名，不写入 CONTACT
 * options.unknown       —— 传数组进来，会收到本次解析到的未知人名
 */
function parseScript(raw, options = {}) {
  if (typeof raw !== 'string') {
    throw new TypeError('剧本必须是字符串');
  }

  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const lines = text.split('\n');
  const nodes = [];
  const unknown = [];

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const line = lines[index].trim();

    if (!line || line.startsWith('#') || line.startsWith('//')) continue;

    const id = `node-${lineNumber}-${nodes.length + 1}`;

    const systemMatch = line.match(/^\[(?:系统|system)\]\s*[:：]?\s*(.+)$/iu);
    if (systemMatch) {
      const content = systemMatch[1].trim();
      if (!content) throw new ScriptParseError('系统提示不能为空', lineNumber);
      nodes.push({ id, type: 'system', text: content, line: lineNumber });
      continue;
    }

    const timeMatch = line.match(/^\[(?:时间|time)\]\s*[:：]?\s*(.+)$/iu);
    if (timeMatch) {
      const content = timeMatch[1].trim();
      if (!content) throw new ScriptParseError('时间内容不能为空', lineNumber);
      nodes.push({ id, type: 'time', text: content, line: lineNumber });
      continue;
    }

    const shortTimeMatch = line.match(/^\[(\d{1,2}:\d{2})\]$/u);
    if (shortTimeMatch) {
      nodes.push({ id, type: 'time', text: shortTimeMatch[1], line: lineNumber });
      continue;
    }

    const plainDirective = line.match(/^(系统|system)\s*[:：]\s*(.+)$/iu);
    if (plainDirective) {
      nodes.push({ id, type: 'system', text: plainDirective[2].trim(), line: lineNumber });
      continue;
    }

    const messageMatch = line.match(/^([^:：]{1,24})\s*[:：]\s*(.+)$/u);
    if (messageMatch) {
      const speaker = messageMatch[1].trim();
      const content = messageMatch[2].trim();
      let from = resolveContactId(speaker);

      if (!from) {
        if (options.autoCreate) {
          from = createContact(speaker);
        } else if (options.collectUnknown) {
          from = `pending:${speaker}`;
          if (!unknown.includes(speaker)) unknown.push(speaker);
        }
      }

      if (!from) {
        const names = Object.values(CONTACT)
          .map((contact) => contact.name)
          .join('、');
        throw new ScriptParseError(`无法识别说话人「${speaker}」，可用：${names}`, lineNumber);
      }
      if (!content) throw new ScriptParseError('台词不能为空', lineNumber);

      nodes.push({
        id,
        type: 'message',
        from,
        text: content,
        line: lineNumber,
      });
      continue;
    }

    throw new ScriptParseError('无法解析这一行，请使用「人物：内容」格式', lineNumber);
  }

  if (!nodes.length) {
    throw new ScriptParseError('剧本还是空的，先写一句台词吧', 1);
  }

  if (Array.isArray(options.unknown)) options.unknown.push(...unknown);

  return nodes;
}

/* ============================================================
   时间计算器 / TIMING
   ============================================================ */

/**
 * calcTiming(item, { pace }) -> { chars, wait, typing, after, total }
 * 字数越多，等待越久、输入越久。
 */
function calcTiming(item, options = {}) {
  const pace = Number.isFinite(Number(options.pace)) ? Math.max(0.2, Number(options.pace)) : 1;
  const chars = charCount(item?.text);
  const type = item?.type;
  let wait = 0;
  let typing = 0;
  let after = 0;

  if (type === 'message') {
    const outgoing = item.from === 'me';
    const config = TIMING.message;

    wait = clamp(
      config.waitBase + chars * config.waitPerChar,
      config.waitMin,
      config.waitMax,
    );

    if (!outgoing) {
      typing = clamp(
        config.typingBase + chars * config.typingPerChar,
        config.typingMin,
        config.typingMax,
      );
    }

    after = outgoing ? config.afterOutgoing : config.afterIncoming;
  } else if (type === 'system') {
    const config = TIMING.system;
    wait = clamp(
      config.waitBase + chars * config.waitPerChar,
      config.waitMin,
      config.waitMax,
    );
    after = config.after;
  } else if (type === 'time') {
    wait = TIMING.time.wait;
    after = TIMING.time.after;
  } else {
    throw new TypeError(`未知节点类型：${String(type)}`);
  }

  wait = Math.round(wait * pace);
  typing = Math.round(typing * pace);
  after = Math.round(after * pace);

  return {
    chars,
    wait,
    typing,
    after,
    total: wait + typing + after,
  };
}

function estimateScriptDuration(items, options = {}) {
  const speed = clamp(Number(options.speed) || 1, 0.1, 8);
  const pace = Number(options.pace) || 1;
  return items.reduce((total, item) => total + calcTiming(item, { pace }).total, 0) / speed;
}

/* ============================================================
   渲染器 / RENDERER
   ============================================================ */

/**
 * buildNode(item) -> HTMLElement
 * 支持 message / system / time 三种类型。
 */
function buildNode(item) {
  if (!item || typeof item !== 'object') {
    throw new TypeError('buildNode 需要一个节点对象');
  }

  if (item.type === 'time') {
    const node = document.createElement('div');
    node.className = 'chat-time';
    const label = document.createElement('span');
    label.textContent = item.text || '';
    node.append(label);
    if (item.id) node.dataset.nodeId = item.id;
    node.dataset.nodeType = 'time';
    return node;
  }

  if (item.type === 'system') {
    const node = document.createElement('div');
    node.className = 'system-note';
    node.append(makeIcon('sparkle'));
    const label = document.createElement('span');
    label.textContent = item.text || '';
    node.append(label);
    if (item.id) node.dataset.nodeId = item.id;
    node.dataset.nodeType = 'system';
    return node;
  }

  if (item.type === 'message') {
    const contactId = item.from === 'me' ? 'me' : item.from || getOtherId();
    const contact = safeContact(contactId);
    const isMe = contactId === 'me';
    const group = isGroupChat();
    const showAvatar = !isMe || group || state.showSelfAvatar;

    const row = document.createElement('div');
    row.className = `message-row ${isMe ? 'is-me' : 'is-incoming'}`;
    row.classList.toggle('is-group', group);
    row.classList.toggle('has-avatar', showAvatar);
    row.dataset.from = contactId;
    if (item.id) row.dataset.nodeId = item.id;
    row.dataset.nodeType = 'message';

    if (!isMe && showAvatar) {
      row.append(buildAvatar(contact, contactId));
    }

    const stack = document.createElement('div');
    stack.className = 'message-stack';

    if (group && !isMe) {
      const author = document.createElement('div');
      author.className = 'message-author';
      author.textContent = contact.name || '某人';
      author.style.setProperty('--author-accent', contact.accent || '');
      stack.append(author);
    }

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = item.text || '';
    stack.append(bubble);

    if (isMe) {
      const meta = document.createElement('div');
      meta.className = 'message-meta';
      const label = document.createElement('span');
      label.textContent = '已读';
      meta.append(label, makeIcon('check-check'));
      stack.append(meta);
    }

    row.append(stack);

    if (isMe && showAvatar) {
      row.append(buildAvatar(contact, contactId));
    }

    return row;
  }

  throw new TypeError(`buildNode 不支持类型：${String(item.type)}`);
}

function buildAvatar(contact, contactId) {
  const avatar = document.createElement('span');
  avatar.className = 'avatar';
  avatar.dataset.contactId = contactId;
  avatar.setAttribute('aria-hidden', 'true');
  paintAvatar(avatar, contact);
  return avatar;
}

/**
 * 把文字或已保存的图片画进头像容器。
 * 保留容器内的在线状态点等附属元素。
 */
function paintAvatar(element, contact) {
  if (!element || !contact) return;

  element.style.setProperty('--avatar-accent', contact.accent || '#5f83ba');
  let media = $('.avatar-media', element);
  if (!media) {
    media = document.createElement('span');
    media.className = 'avatar-media';
    media.setAttribute('aria-hidden', 'true');
    const extras = Array.from(element.children).filter(
      (child) => !child.classList.contains('avatar-media'),
    );
    element.replaceChildren(media, ...extras);
  }

  const fallback = contact.avatar || Array.from(contact.name || '?')[0] || '?';

  if (contact.avatarImage) {
    let image = media.querySelector('img');
    if (!image) {
      media.replaceChildren();
      image = document.createElement('img');
      image.alt = '';
      image.decoding = 'async';
      image.draggable = false;
      image.addEventListener('error', () => {
        element.classList.remove('has-image');
        media.textContent = fallback;
      }, { once: true });
      media.append(image);
    }
    if (image.getAttribute('src') !== contact.avatarImage) {
      image.src = contact.avatarImage;
    }
    element.classList.add('has-image');
  } else {
    if (media.querySelector('img') || media.textContent !== fallback) {
      media.textContent = fallback;
    }
    element.classList.remove('has-image');
  }
}

function refreshChatAvatars() {
  $$('[data-contact-id]', chat).forEach((avatar) => {
    paintAvatar(avatar, safeContact(avatar.dataset.contactId));
  });
}

function syncAvatarControls() {
  $$('[data-avatar-edit]').forEach((button) => {
    const contactId = button.dataset.avatarEdit;
    const contact = CONTACT[contactId];
    if (!contact) return;
    const name = contact.name || '此联系人';
    button.setAttribute('aria-label', `更换${name}的头像`);
    button.title = contact.avatarImage ? '更换头像' : '上传头像';
  });

  $$('[data-avatar-reset]').forEach((button) => {
    const contact = CONTACT[button.dataset.avatarReset];
    button.hidden = !contact?.avatarImage;
  });
}

function refreshAvatars() {
  renderContactHeader();
  refreshChatAvatars();
}

/* ============================================================
   人物 / CAST
   ============================================================ */

/** 控制台里的人物列表：可增删、改名、换头像。 */
function renderContactEditor() {
  if (!contactEditor) return;

  const group = isGroupChat();
  const total = Object.keys(CONTACT).length;

  castCount.textContent = `${total} PEOPLE`;
  castMode.querySelectorAll('[data-mode]').forEach((button) => {
    const active = button.dataset.mode === (group ? 'group' : 'duo');
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  groupNameField.hidden = !group;
  if (group && groupNameInput.value !== state.groupName) {
    groupNameInput.value = state.groupName;
  }

  contactEditor.replaceChildren();

  Object.entries(CONTACT).forEach(([id, contact]) => {
    const isMe = id === 'me';
    const row = document.createElement('div');
    row.className = 'contact-row';
    row.dataset.contactRow = id;

    const wrap = document.createElement('div');
    wrap.className = 'avatar-edit-wrap';

    const avatarButton = document.createElement('button');
    avatarButton.type = 'button';
    avatarButton.className = 'avatar editor-avatar avatar-edit';
    avatarButton.dataset.editorAvatar = id;
    avatarButton.dataset.avatarEdit = id;
    avatarButton.style.setProperty('--avatar-accent', contact.accent || '#5f83ba');
    avatarButton.setAttribute('aria-label', `更换${contact.name || '这个人物'}的头像`);
    avatarButton.title = contact.avatarImage ? '更换头像' : '上传头像';

    const media = document.createElement('span');
    media.className = 'avatar-media';
    media.setAttribute('aria-hidden', 'true');
    avatarButton.append(media);

    const badge = document.createElement('span');
    badge.className = 'avatar-edit-badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.append(makeIcon('camera'));
    avatarButton.append(badge);

    paintAvatar(avatarButton, contact);

    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'avatar-reset';
    reset.dataset.avatarReset = id;
    reset.setAttribute('aria-label', `恢复${contact.name || '这个人物'}的默认头像`);
    reset.title = '恢复默认头像';
    reset.hidden = !contact.avatarImage;
    reset.append(makeIcon('close'));

    wrap.append(avatarButton, reset);

    const fields = document.createElement('div');
    fields.className = 'contact-fields';

    const nameInput = document.createElement('input');
    nameInput.className = 'contact-name';
    nameInput.dataset.contactField = `${id}:name`;
    nameInput.value = contact.name || '';
    nameInput.setAttribute('aria-label', isMe ? '我的昵称' : '人物昵称');

    const statusInput = document.createElement('input');
    statusInput.className = 'contact-sub';
    statusInput.dataset.contactField = `${id}:status`;
    statusInput.value = contact.status || '';
    statusInput.setAttribute('aria-label', isMe ? '我的状态' : '人物状态');

    fields.append(nameInput, statusInput);

    const tag = document.createElement('span');
    tag.className = `contact-tag${isMe ? ' is-me' : ''}`;
    tag.textContent = isMe ? '你' : '人物';

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'contact-remove';
    remove.dataset.contactRemove = id;
    remove.disabled = isMe || otherCount() <= 1;
    remove.setAttribute('aria-label', `移除${contact.name || '该人物'}`);
    remove.title = '从对话中移除';
    remove.append(makeIcon('minus'));

    row.append(wrap, fields, tag, remove);
    contactEditor.append(row);
  });

  castAddBtn.disabled = total >= MAX_CONTACTS;

  const locked = group;
  selfAvatarToggle.checked = locked || state.showSelfAvatar;
  selfAvatarToggle.disabled = locked;
  const toggleLabel = selfAvatarToggle.closest('.cast-toggle');
  if (toggleLabel) {
    toggleLabel.classList.toggle('is-locked', locked);
    toggleLabel.title = locked ? '群聊中所有人都会显示头像' : '双人对话时是否显示自己的头像';
  }
}

function applyChatModeVisuals() {
  chat.classList.toggle('is-group', isGroupChat());
  body.dataset.chatMode = state.mode;

  const group = isGroupChat();
  headerAvatar.hidden = group;
  headerStack.hidden = !group;
}

/** 生成一个还没被占用的默认名字。 */
function uniqueContactName(base = '新成员') {
  if (!resolveContactId(base)) return base;
  let index = 2;
  while (resolveContactId(`${base} ${index}`)) index += 1;
  return `${base} ${index}`;
}

/**
 * 切换双人 / 群聊。群聊至少要两位对方人物，会自动补一位。
 */
function setChatMode(mode, options = {}) {
  const next = mode === 'group' ? 'group' : 'duo';

  if (next === 'duo' && otherCount() > 1) {
    if (!options.silent) {
      showToast('还有多位人物，先移除后再切回双人对话', 'error');
    }
    renderContactEditor();
    return;
  }

  if (next === 'group' && otherCount() < 2) {
    if (!createContact(uniqueContactName())) {
      if (!options.silent) showToast(`最多支持 ${MAX_CONTACTS} 位人物`, 'error');
      return;
    }
  }

  state.mode = next;
  renderContactEditor();
  renderContactHeader();
  applyChatModeVisuals();
  rerenderChat();
  persistCast();

  if (!options.silent) {
    showToast(next === 'group' ? '已切换到群聊故事模式' : '已切换到双人对话');
  }
}

function addContact(options = {}) {
  if (Object.keys(CONTACT).length >= MAX_CONTACTS) {
    showToast(`最多支持 ${MAX_CONTACTS} 位人物`, 'error');
    return null;
  }

  const id = createContact(options.name || uniqueContactName());
  if (!id) return null;

  if (otherCount() > 1) state.mode = 'group';

  renderContactEditor();
  renderContactHeader();
  applyChatModeVisuals();
  rerenderChat();

  const input = $(`[data-contact-row="${id}"] .contact-name`);
  if (input && !options.noFocus) {
    input.focus();
    input.select();
  }

  persistCast();
  if (!options.silent) showToast('已添加一位人物，输入名字就能开聊');
  return id;
}

function removeContact(id) {
  if (id === 'me') return;
  if (!CONTACT[id]) return;
  if (otherCount() <= 1) {
    showToast('至少要保留一位对话人物', 'error');
    return;
  }

  delete CONTACT[id];
  persistAvatars();

  if (otherCount() < 2 && state.mode === 'group') state.mode = 'duo';

  renderContactEditor();
  renderContactHeader();
  applyChatModeVisuals();
  rerenderChat();
  persistCast();
  showToast('已移除该人物');
}

function setShowSelfAvatar(value) {
  state.showSelfAvatar = Boolean(value);
  persistCast();
  rerenderChat();
  renderContactEditor();
}

/** 模式或头像设置改变后，用同样的数据重建聊天记录。 */
function rerenderChat() {
  $$('.message-row[data-from]', chat).forEach((row) => {
    const bubble = $('.bubble', row);
    if (!bubble) return;
    const next = buildNode({
      type: 'message',
      from: row.dataset.from,
      text: bubble.textContent,
    });
    row.replaceWith(next);
  });
  updateAuthorLabels();
  refreshReadReceipts();
}

/** 群聊里同一个人连续发言时，只保留第一条名字。 */
function updateAuthorLabels() {
  const group = isGroupChat();
  chat.classList.toggle('is-group', group);
  if (!group) {
    $$('.message-author', chat).forEach((author) => {
      author.hidden = false;
    });
    return;
  }

  let previousFrom = null;
  Array.from(chat.children).forEach((node) => {
    if (node.classList.contains('typing-row')) return;

    if (node.classList.contains('message-row')) {
      const from = node.dataset.from || null;
      const author = $('.message-author', node);
      if (author) author.hidden = Boolean(previousFrom) && from === previousFrom;
      previousFrom = from;
      return;
    }

    if (node.classList.contains('chat-time') || node.classList.contains('system-note')) {
      previousFrom = null;
    }
  });
}

/* ============================================================
   头像存储 / AVATAR STORAGE
   ============================================================ */

function loadSavedAvatars() {
  let raw;
  try {
    raw = localStorage.getItem(AVATAR_STORAGE_KEY);
  } catch {
    return;
  }
  if (!raw) return;

  try {
    const saved = JSON.parse(raw);
    Object.entries(CONTACT).forEach(([contactId, contact]) => {
      const value = saved?.[contactId];
      if (
        typeof value === 'string' &&
        /^data:image\/(?:png|jpeg|webp);base64,/u.test(value) &&
        value.length < 600_000
      ) {
        contact.avatarImage = value;
      }
    });
  } catch {
    /* ignore malformed avatar cache */
  }
}

function persistAvatars() {
  const payload = {};
  Object.entries(CONTACT).forEach(([contactId, contact]) => {
    if (contact.avatarImage) payload[contactId] = contact.avatarImage;
  });
  try {
    if (Object.keys(payload).length) {
      localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(payload));
    } else {
      localStorage.removeItem(AVATAR_STORAGE_KEY);
    }
  } catch {
    /* storage can be unavailable or full */
  }
}

/* ============================================================
   人物列表存储 / CAST STORAGE
   ============================================================ */

function persistCast() {
  const payload = {
    mode: state.mode,
    groupName: state.groupName,
    showSelfAvatar: state.showSelfAvatar,
    members: Object.entries(CONTACT).map(([id, contact]) => ({
      id,
      name: contact.name,
      avatar: contact.avatar,
      status: contact.status,
      accent: contact.accent,
      aliases: contact.aliases || [],
    })),
  };

  try {
    localStorage.setItem(CAST_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

/**
 * 恢复上次的人物阵容。只信任结构正确的数据；
 * 头像图片由 loadSavedAvatars() 在之后单独填充。
 */
function loadSavedCast() {
  let raw;
  try {
    raw = localStorage.getItem(CAST_STORAGE_KEY);
  } catch {
    return;
  }
  if (!raw) return;

  let saved;
  try {
    saved = JSON.parse(raw);
  } catch {
    return;
  }

  if (!saved || !Array.isArray(saved.members)) return;

  const members = saved.members.filter(
    (member) =>
      member &&
      typeof member.id === 'string' &&
      member.id &&
      typeof member.name === 'string' &&
      member.name.trim(),
  );
  if (members.length < 2 || members.length > MAX_CONTACTS) return;

  const next = {};
  members.forEach((member) => {
    const name = member.name.trim().slice(0, 12);
    next[member.id] = {
      name,
      avatar:
        typeof member.avatar === 'string' && member.avatar
          ? Array.from(member.avatar)[0]
          : Array.from(name)[0] || '?',
      avatarImage: '',
      status: typeof member.status === 'string' ? member.status.slice(0, 40) : '在线',
      accent: typeof member.accent === 'string' ? member.accent : '#5f83ba',
      aliases: Array.isArray(member.aliases)
        ? member.aliases.filter((alias) => typeof alias === 'string').slice(0, 12)
        : [],
    };
  });

  if (!next.me) return;

  Object.keys(CONTACT).forEach((id) => delete CONTACT[id]);
  Object.assign(CONTACT, next);

  if (otherCount() < 1) return;

  state.mode = saved.mode === 'group' && otherCount() > 1 ? 'group' : 'duo';
  state.groupName =
    typeof saved.groupName === 'string' && saved.groupName.trim()
      ? saved.groupName.trim().slice(0, 24)
      : DEFAULT_GROUP_NAME;
  state.showSelfAvatar = saved.showSelfAvatar !== false;
}

function loadImageElement(src) {  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片读取失败，请换一张试试'));
    image.src = src;
  });
}

async function createAvatarDataUrl(file) {
  if (!file) throw new Error('没有选择图片');
  if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
    throw new Error('请选择 JPG、PNG 或 WebP 图片');
  }
  if (file.size > AVATAR_MAX_BYTES) {
    throw new Error('图片不能超过 10MB');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImageElement(objectUrl);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) throw new Error('图片尺寸无效');

    const side = Math.min(width, height);
    const sourceX = (width - side) / 2;
    const sourceY = (height - side) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('浏览器不支持图片处理');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, sourceX, sourceY, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

    let dataUrl = canvas.toDataURL('image/webp', 0.88);
    if (!dataUrl.startsWith('data:image/webp')) {
      dataUrl = canvas.toDataURL('image/png');
    }
    if (!dataUrl.startsWith('data:image/')) throw new Error('图片处理失败');
    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function applyAvatarFile(file) {
  const contactId = pendingAvatarContact;
  const contact = CONTACT[contactId];
  if (!contact) return;

  try {
    const dataUrl = await createAvatarDataUrl(file);
    contact.avatarImage = dataUrl;
    persistAvatars();
    refreshAvatars();
    showToast(`${contact.name || '联系人'}的头像已更新`);
  } catch (error) {
    showToast(error.message || '头像更新失败', 'error');
  } finally {
    pendingAvatarContact = null;
    if (avatarFile) avatarFile.value = '';
  }
}

function resetAvatar(contactId) {
  const contact = CONTACT[contactId];
  if (!contact) return;
  contact.avatarImage = '';
  persistAvatars();
  refreshAvatars();
  showToast(`已恢复${contact.name || '联系人'}的默认头像`);
}


function buildTypingNode(contactId) {
  const contact = safeContact(contactId);
  const row = document.createElement('div');
  row.className = 'message-row is-incoming typing-row';
  row.dataset.nodeType = 'typing';
  row.append(buildAvatar(contact, contactId));

  const stack = document.createElement('div');
  stack.className = 'message-stack';
  const bubble = document.createElement('div');
  bubble.className = 'bubble typing-bubble';
  bubble.setAttribute('aria-label', `${contact.name}正在输入`);

  const dots = document.createElement('span');
  dots.className = 'typing-dots';
  for (let index = 0; index < 3; index += 1) {
    dots.append(document.createElement('i'));
  }

  bubble.append(dots);
  stack.append(bubble);
  row.append(stack);
  return row;
}

/* ============================================================
   应用状态 / STATE
   ============================================================ */

const initialScriptText = SCRIPT.trim();
const initialState = parseScript(initialScriptText);

const state = {
  script: initialState,
  scriptText: initialScriptText,
  current: 0,
  total: initialState.length,
  isPlaying: false,
  isPaused: false,
  speed: 1,
  pace: 1,
  runToken: 0,
  autoScroll: true,
  unseen: 0,
  focusMode: false,
  importPreview: null,
  importPreviewText: '',
  mode: 'duo',
  groupName: DEFAULT_GROUP_NAME,
  showSelfAvatar: true,
  countdown: COUNTDOWN_DEFAULT,
  countdownActive: false,
  countdownLeft: 0,
};

function isGroupChat() {
  return state.mode === 'group' || otherCount() > 1;
}

let typingRow = null;
let typingContactId = null;
let autoStartTimer = null;
let hudTimer = null;
let countdownTimer = null;
let lastHudWake = 0;
let isComposing = false;
let pendingAvatarContact = null;
let topbarCollapsed = false;

/* DOM shortcuts */
const body = document.body;
const topbar = $('#topbar');
const topbarCollapse = $('#topbarCollapse');
const topbarRestore = $('#topbarRestore');
const avatarFile = $('#avatarFile');
const chat = $('#chat');
const composer = $('#composer');
const messageInput = $('#messageInput');
const sendBtn = $('#sendBtn');
const scrollBottomBtn = $('#scrollBottom');
const stageToolbar = $('.stage-toolbar');
const playState = $('#playState');
const countLabel = $('#countLabel');
const progressFill = $('#progressFill');
const progressTrack = $('#progressTrack');
const durationLabel = $('#durationLabel');
const playToggle = $('#playToggle');
const restartBtn = $('#restartBtn');
const header = $('.chat-header');
const headerAvatar = $('#headerAvatar');
const headerStack = $('#headerStack');
const headerName = $('#headerName');
const headerStatus = $('#headerStatus');
const statusTime = $('#statusTime');
const contactEditor = $('#contactEditor');
const castCount = $('#castCount');
const castMode = $('#castMode');
const groupNameField = $('#groupNameField');
const groupNameInput = $('#groupNameInput');
const castAddBtn = $('#castAddBtn');
const selfAvatarToggle = $('#selfAvatarToggle');
const scriptEditor = $('#scriptEditor');
const scriptStats = $('#scriptStats');
const scriptError = $('#scriptError');
const importDialog = $('#importDialog');
const importText = $('#importText');
const importConfirm = $('#importConfirm');
const importParseState = $('#importParseState');
const importEstimate = $('#importEstimate');
const splitDialog = $('#splitDialog');
const splitText = $('#splitText');
const splitList = $('#splitList');
const splitNotice = $('#splitParseState');
const splitEstimate = $('#splitEstimate');
const splitNote = $('#splitNote');
const splitAllSelect = $('#splitAllSelect');
const splitCheckAll = $('#splitCheckAll');
const splitBatchCount = $('#splitBatchCount');
const splitBatchSpeaker = $('#splitBatchSpeaker');
const splitBatchApply = $('#splitBatchApply');
const splitInsert = $('#splitInsert');
const splitPlay = $('#splitPlay');
const countdownInput = $('#countdownInput');
const countdownLayer = $('#countdownLayer');
const countdownNumber = $('#countdownNumber');
const emojiBtn = $('#emojiBtn');
const emojiPop = $('#emojiPop');
const focusPlay = $('#focusPlay');
const focusState = $('#focusState');
const focusProgress = $('#focusProgress');
const focusCount = $('#focusCount');
const toastStack = $('#toastStack');

/* ============================================================
   界面渲染 / UI
   ============================================================ */

function setHeaderStatus(text, typing = false) {
  headerStatus.replaceChildren();
  const dot = document.createElement('i');
  dot.className = 'presence-dot';
  headerStatus.append(dot, document.createTextNode(text));
  header.classList.toggle('is-typing', typing);
}

function renderContactHeader() {
  const group = isGroupChat();
  const members = otherEntries();

  headerAvatar.hidden = group;
  headerStack.hidden = !group;

  if (group) {
    renderHeaderStack(members);
    headerName.textContent = state.groupName || DEFAULT_GROUP_NAME;
    const typingName = typingContactId ? safeContact(typingContactId).name : '';
    setHeaderStatus(
      typingRow ? `${typingName || '有人'} 正在输入…` : `${members.length + 1} 人 · 在线`,
      Boolean(typingRow),
    );
    messageInput.placeholder = `发消息到${state.groupName || '群聊'}…`;
  } else {
    const other = safeContact(getOtherId());
    paintAvatar(headerAvatar, other);
    headerName.textContent = other.name || '未命名';
    setHeaderStatus(typingRow ? '正在输入…' : other.status || '离线', Boolean(typingRow));
    messageInput.placeholder = `发消息给${other.name || '对方'}…`;
  }

  $$('[data-editor-avatar]').forEach((avatar) => {
    const contact = CONTACT[avatar.dataset.editorAvatar];
    if (contact) paintAvatar(avatar, contact);
  });

  syncAvatarControls();
}

/** 群聊头部：最多叠放 3 位成员的头像。 */
function renderHeaderStack(members) {
  headerStack.replaceChildren();
  members.slice(0, 3).forEach(([id, contact]) => {
    headerStack.append(buildAvatar(contact, id));
  });
  if (members.length > 3) {
    const more = document.createElement('span');
    more.className = 'header-stack-more';
    more.textContent = `+${members.length - 3}`;
    headerStack.append(more);
  }
}

function showTyping(contactId) {
  typingContactId = contactId;
  if (!typingRow) {
    typingRow = buildTypingNode(contactId);
    chat.append(typingRow);
  }
  renderContactHeader();
  if (state.autoScroll) {
    scrollToBottom(true);
  }
}

function hideTyping() {
  if (typingRow) {
    typingRow.remove();
    typingRow = null;
  }
  typingContactId = null;
  renderContactHeader();
}

function refreshReadReceipts() {
  const rows = $$('.message-row.is-me', chat);
  rows.forEach((row, index) => {
    const meta = $('.message-meta', row);
    if (meta) meta.hidden = index !== rows.length - 1;
  });
}

function updateUnreadBadge(show) {
  const badge = $('span', scrollBottomBtn);
  if (!badge) return;
  if (show && state.unseen > 0) {
    badge.textContent = state.unseen > 9 ? '9+' : String(state.unseen);
    badge.style.display = 'grid';
    scrollBottomBtn.classList.add('is-visible');
  } else {
    badge.style.display = 'none';
    scrollBottomBtn.classList.remove('is-visible');
  }
}

function scrollToBottom(force = false) {
  if (!force && !state.autoScroll) return;
  requestAnimationFrame(() => {
    chat.scrollTo({
      top: chat.scrollHeight,
      behavior: state.isPlaying ? 'smooth' : 'auto',
    });
  });
}

function resetScrollState() {
  state.autoScroll = true;
  state.unseen = 0;
  updateUnreadBadge(false);
}

function clearChat() {
  chat.replaceChildren();
  typingRow = null;
  document.body.classList.remove('playback-paused');
}

function renderInitial(options = {}) {
  clearChat();
  const animate = options.animate !== false;

  INITIAL.forEach((item, index) => {
    const node = buildNode(item);
    if (animate) {
      node.classList.add('is-new');
      if (animate === 'stagger') {
        node.style.animationDelay = `${Math.min(index * 65, 520)}ms`;
      }
    }
    chat.append(node);
  });

  refreshReadReceipts();
  resetScrollState();
  applyChatModeVisuals();
  updateAuthorLabels();
  requestAnimationFrame(() => {
    chat.scrollTop = chat.scrollHeight;
  });

  const lastTime = [...INITIAL].reverse().find((item) => item.type === 'time');
  if (lastTime) {
    const clock = extractClock(lastTime.text);
    if (clock) statusTime.textContent = clock;
  }
}

function appendChatNode(item, options = {}) {
  const node = buildNode(item);
  if (options.animate !== false) node.classList.add('is-new');

  const existingTyping = typingRow;
  if (existingTyping && options.keepTyping !== false && item.type !== 'typing') {
    // Script messages are always appended after the typing row has been removed.
    chat.insertBefore(node, existingTyping);
  } else {
    chat.append(node);
  }

  refreshReadReceipts();
  updateAuthorLabels();

  if (item.type === 'time') {
    const clock = extractClock(item.text);
    if (clock) statusTime.textContent = clock;
  }

  if (state.autoScroll) {
    scrollToBottom(true);
  } else {
    state.unseen += 1;
    updateUnreadBadge(true);
  }

  return node;
}

function updatePlayerUi() {
  const ended = !state.isPlaying && state.current >= state.total && state.total > 0;
  const stateText = state.countdownActive
    ? `倒计时 ${state.countdownLeft}s`
    : state.isPaused
      ? '已暂停'
      : state.isPlaying
        ? '正在播放'
        : ended
          ? '回放结束'
          : '准备就绪';

  playState.replaceChildren(document.createElement('i'), document.createTextNode(stateText));
  countLabel.textContent = `${pad2(state.current)} / ${pad2(state.total)}`;

  const percentage = state.total ? clamp((state.current / state.total) * 100, 0, 100) : 0;
  progressFill.style.width = `${percentage}%`;
  progressTrack.setAttribute('aria-valuenow', String(Math.round(percentage)));

  focusState.textContent = stateText;
  focusProgress.style.width = `${percentage}%`;
  focusCount.textContent = `${pad2(state.current)} / ${pad2(state.total)}`;

  stageToolbar.classList.toggle('is-paused', state.isPaused);
  stageToolbar.classList.toggle('playback-ended', ended);
  stageToolbar.classList.toggle('is-counting', state.countdownActive);
  body.classList.toggle('playback-paused', state.isPaused);

  const iconName = state.isPlaying && !state.isPaused ? 'pause' : 'play';
  replaceIcon(playToggle, iconName);
  replaceIcon(focusPlay, iconName);
  playToggle.setAttribute('aria-label', iconName === 'pause' ? '暂停播放' : '播放');
  focusPlay.setAttribute('aria-label', iconName === 'pause' ? '暂停播放' : '播放');

  durationLabel.textContent = `约 ${formatDuration(estimateScriptDuration(state.script, { pace: state.pace, speed: state.speed }))}`;
}

function updateScriptStats() {
  const messageCount = state.script.filter((item) => item.type === 'message').length;
  const duration = estimateScriptDuration(state.script, { pace: state.pace, speed: state.speed });
  scriptStats.textContent = `${state.script.length} 个节点 · ${messageCount} 条消息 · 约 ${formatDuration(duration)}`;
  durationLabel.textContent = `约 ${formatDuration(duration)}`;
}

function updateScriptDraftStats() {
  const lines = scriptEditor.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('//')).length;
  scriptStats.textContent = `${lines} 行草稿 · 点击应用预览`;
}

function showScriptError(message) {
  scriptError.textContent = message;
  scriptError.hidden = false;
}

function clearScriptError() {
  scriptError.hidden = true;
  scriptError.textContent = '';
}

function updateFocusUi() {
  body.classList.toggle('focus-mode', state.focusMode);
  if (!state.focusMode) body.classList.remove('hud-idle');
}

function wakeFocusHud(force = false) {
  if (!state.focusMode) return;
  const now = Date.now();
  if (!force && now - lastHudWake < 110) return;
  lastHudWake = now;
  body.classList.remove('hud-idle');
  window.clearTimeout(hudTimer);
  hudTimer = window.setTimeout(() => {
    if (state.focusMode) body.classList.add('hud-idle');
  }, 2800);
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'is-error' : ''}`;
  toast.append(makeIcon(type === 'error' ? 'close' : 'sparkle'));
  const label = document.createElement('span');
  label.textContent = message;
  toast.append(label);
  toastStack.append(toast);

  window.setTimeout(() => {
    toast.classList.add('is-leaving');
    window.setTimeout(() => toast.remove(), 240);
  }, 2400);
}

/* ============================================================
   播放引擎 / ENGINE
   ============================================================ */

/**
 * 可暂停的异步等待。速度变化会实时生效。
 * 返回 false 表示本轮播放已被取消。
 */
/* ============================================================
   播放倒计时 / COUNTDOWN
   ============================================================ */

/** 播放前倒计时，秒数可调；录屏时先按播放，再开始录。 */
function setCountdown(seconds, options = {}) {
  const numeric = Number(seconds);
  const value = Number.isFinite(numeric) ? clamp(Math.round(numeric), 0, 30) : COUNTDOWN_DEFAULT;
  state.countdown = value;
  countdownInput.value = String(value);

  if (options.silent) return;
  try {
    localStorage.setItem(COUNTDOWN_STORAGE_KEY, String(value));
  } catch {
    /* localStorage can be unavailable in sandboxed contexts */
  }
}

function restoreCountdownPreference() {
  let saved = COUNTDOWN_DEFAULT;
  try {
    const raw = localStorage.getItem(COUNTDOWN_STORAGE_KEY);
    saved = raw === null ? COUNTDOWN_DEFAULT : Number(raw);
  } catch {
    saved = COUNTDOWN_DEFAULT;
  }
  setCountdown(Number.isFinite(saved) ? saved : COUNTDOWN_DEFAULT, { silent: true });
}

function paintCountdown(value) {
  countdownNumber.textContent = String(value);
  if (typeof countdownNumber.animate === 'function') {
    countdownNumber.animate(
      [
        { transform: 'scale(0.74)', opacity: 0.1 },
        { transform: 'scale(1)', opacity: 1 },
      ],
      { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );
  }
}

function cancelCountdown(options = {}) {
  if (countdownTimer !== null) {
    window.clearInterval(countdownTimer);
    countdownTimer = null;
  }
  if (!state.countdownActive) return;

  state.countdownActive = false;
  state.countdownLeft = 0;
  countdownLayer.hidden = true;
  body.classList.remove('countdown-active');
  updatePlayerUi();

  if (!options.silent) showToast('已取消倒计时');
}

function beginCountdown(seconds, callback) {
  cancelCountdown({ silent: true });
  if (seconds <= 0) {
    callback();
    return;
  }

  clearAutoStart();
  cancelPlayback();

  state.countdownActive = true;
  state.countdownLeft = seconds;
  countdownLayer.hidden = false;
  body.classList.add('countdown-active');
  paintCountdown(seconds);
  updatePlayerUi();

  countdownTimer = window.setInterval(() => {
    state.countdownLeft -= 1;

    if (state.countdownLeft > 0) {
      paintCountdown(state.countdownLeft);
      updatePlayerUi();
      return;
    }

    cancelCountdown({ silent: true });
    callback();
  }, 1000);
}

/** 所有「开始播放」的入口都先过这里，倒计时 0 秒时直接播。 */
function requestPlayback(options = {}) {
  if (state.countdownActive) {
    cancelCountdown();
    return;
  }

  const seconds = Number(state.countdown) || 0;
  if (seconds > 0) {
    beginCountdown(seconds, () => startPlayback(options));
    return;
  }

  startPlayback(options);
}

function wait(ms, token) {
  const duration = Math.max(0, Number(ms) || 0);
  return new Promise((resolve) => {
    let remaining = duration;
    let last = performance.now();

    function tick() {
      if (token !== state.runToken) {
        resolve(false);
        return;
      }

      const now = performance.now();
      const delta = Math.min(100, Math.max(0, now - last));
      last = now;

      if (!state.isPaused && state.isPlaying) {
        remaining -= delta * state.speed;
      }

      if (remaining <= 0) {
        resolve(true);
        return;
      }

      window.setTimeout(tick, 24);
    }

    tick();
  });
}

/**
 * playScript(script, options) — async/await 串行播放。
 * 每条消息都按 calcTiming 的结果等待、显示输入中、再落入聊天框。
 */
async function playScript(script = state.script, options = {}) {
  if (!Array.isArray(script) || !script.length) {
    throw new TypeError('playScript 需要非空的节点数组');
  }

  const token = ++state.runToken;
  const startIndex = clamp(Number(options.from) || 0, 0, script.length);

  state.total = script.length;
  state.current = startIndex;
  state.isPlaying = true;
  state.isPaused = false;
  hideTyping();
  updatePlayerUi();

  try {
    for (let index = startIndex; index < script.length; index += 1) {
      if (token !== state.runToken) return;

      const item = script[index];
      const timing = calcTiming(item, { pace: state.pace });
      const incoming = item.type === 'message' && item.from !== 'me';

      const waited = await wait(timing.wait, token);
      if (!waited) return;

      if (incoming) {
        showTyping(item.from);
        const typed = await wait(timing.typing, token);
        if (!typed) return;
        hideTyping();
      }

      if (token !== state.runToken) return;

      appendChatNode(item, { animate: true });
      state.current = index + 1;
      updatePlayerUi();

      const rested = await wait(timing.after, token);
      if (!rested) return;
    }

    if (token !== state.runToken) return;

    state.isPlaying = false;
    state.isPaused = false;
    state.current = script.length;
    hideTyping();
    updatePlayerUi();
  } catch (error) {
    console.error('[ChatReplay] playback failed:', error);
    if (token === state.runToken) {
      state.isPlaying = false;
      state.isPaused = false;
      hideTyping();
      updatePlayerUi();
      showToast(`播放中断：${error.message}`, 'error');
    }
  }
}

function cancelPlayback() {
  state.runToken += 1;
  state.isPlaying = false;
  state.isPaused = false;
  hideTyping();
  updatePlayerUi();
}

function clearAutoStart() {
  if (autoStartTimer !== null) {
    window.clearTimeout(autoStartTimer);
    autoStartTimer = null;
  }
}

/**
 * startPlayback({ reset }) — 从 INITIAL 之后开始。
 */
function startPlayback(options = {}) {
  clearAutoStart();
  cancelPlayback();

  const reset = options.reset !== false;
  if (reset) {
    state.current = 0;
    state.total = state.script.length;
    renderInitial({ animate: 'stagger' });
  }

  resetScrollState();
  state.isPlaying = true;
  state.isPaused = false;
  state.total = state.script.length;
  updatePlayerUi();

  void playScript(state.script, { from: state.current });
}

function togglePlayback() {
  if (state.countdownActive) {
    cancelCountdown();
    return;
  }

  if (state.isPlaying) {
    state.isPaused = !state.isPaused;
    updatePlayerUi();
    return;
  }

  requestPlayback({ reset: state.current >= state.total });
}

function restartPlayback() {
  requestPlayback({ reset: true });
}

/* ============================================================
   手动消息 / COMPOSER
   ============================================================ */

function resizeComposer() {
  messageInput.style.height = 'auto';
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 86)}px`;
  sendBtn.disabled = !messageInput.value.trim();
}

function sendManualMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  clearAutoStart();

  const item = {
    id: `manual-${Date.now()}`,
    type: 'message',
    from: 'me',
    text,
  };

  state.autoScroll = true;
  const node = buildNode(item);
  node.classList.add('is-new');

  if (typingRow) {
    chat.insertBefore(node, typingRow);
  } else {
    chat.append(node);
  }

  refreshReadReceipts();
  updateAuthorLabels();
  state.unseen = 0;
  updateUnreadBadge(false);

  messageInput.value = '';
  resizeComposer();
  scrollToBottom(true);
}

function insertEmoji(emoji) {
  clearAutoStart();
  const start = messageInput.selectionStart ?? messageInput.value.length;
  const end = messageInput.selectionEnd ?? messageInput.value.length;
  const value = messageInput.value;
  messageInput.value = `${value.slice(0, start)}${emoji}${value.slice(end)}`;
  const caret = start + emoji.length;
  messageInput.focus();
  messageInput.setSelectionRange(caret, caret);
  resizeComposer();
  emojiPop.hidden = true;
}

/* ============================================================
   导入弹窗 / IMPORT
   ============================================================ */

function setParseState(text, mode = 'idle') {
  importParseState.className = 'parse-state';
  if (mode === 'valid') importParseState.classList.add('is-valid');
  if (mode === 'error') importParseState.classList.add('is-error');
  const dot = document.createElement('i');
  importParseState.replaceChildren(dot, document.createTextNode(text));
}

function previewImport() {
  const raw = importText.value;
  state.importPreview = null;
  state.importPreviewText = raw;

  if (!raw.trim()) {
    setParseState('等待输入', 'idle');
    importEstimate.textContent = '按字数自动计算节奏';
    importEstimate.title = '';
    importConfirm.disabled = true;
    return;
  }

  try {
    const unknown = [];
    const parsed = parseScript(raw, { collectUnknown: true, unknown });
    const duration = estimateScriptDuration(parsed, { pace: state.pace, speed: state.speed });
    const messages = parsed.filter((item) => item.type === 'message').length;
    state.importPreview = parsed;
    state.importPreviewText = raw;
    setParseState(
      unknown.length
        ? `识别到 ${parsed.length} 个节点 · 新增 ${unknown.length} 人`
        : `识别到 ${parsed.length} 个节点`,
      'valid',
    );
    importEstimate.textContent = unknown.length
      ? `将创建：${unknown.join('、')}`
      : `${messages} 条消息 · 约 ${formatDuration(duration)}`;
    importEstimate.title = importEstimate.textContent;
    importConfirm.disabled = false;
  } catch (error) {
    setParseState(error instanceof ScriptParseError ? `第 ${error.line} 行无法解析` : '解析失败', 'error');
    importEstimate.textContent = error instanceof ScriptParseError ? error.message : String(error.message);
    importEstimate.title = importEstimate.textContent;
    importConfirm.disabled = true;
  }
}

function openImportDialog() {
  clearAutoStart();
  closePanel();
  emojiPop.hidden = true;
  previewImport();
  if (typeof importDialog.showModal === 'function') {
    importDialog.showModal();
  } else {
    importDialog.setAttribute('open', '');
  }
  window.setTimeout(() => importText.focus(), 60);
}

function closeImportDialog() {
  if (importDialog.open && typeof importDialog.close === 'function') {
    importDialog.close();
  } else {
    importDialog.removeAttribute('open');
  }
}

function applyParsedScript(raw) {
  parseScript(raw, { collectUnknown: true });
  const before = new Set(Object.keys(CONTACT));
  const parsed = parseScript(raw, { autoCreate: true });
  const added = Object.keys(CONTACT).filter((id) => !before.has(id));

  state.script = parsed;
  state.scriptText = raw.trim();
  state.current = 0;

  if (otherCount() > 1) state.mode = 'group';

  renderContactEditor();
  renderContactHeader();
  applyChatModeVisuals();
  updateScriptStats();
  persistCast();

  return added;
}

function applyImportedText(raw) {
  const added = applyParsedScript(raw);
  scriptEditor.value = state.scriptText;
  clearScriptError();
  closeImportDialog();
  requestPlayback({ reset: true });
  showToast(
    added.length
      ? `已导入剧本，并新增 ${added.length} 位人物`
      : `已导入 ${state.script.length} 个节点，开始播放`,
  );
}

/* ============================================================
   文本转对话 / TEXT → DIALOGUE
   ============================================================ */

/** 当前分句结果：{ type, text, speaker, manual }。manual 表示这一句被手动指定过。 */
let splitRows = [];

/* 单独一行的时间：23:40 / 今天 23:40 / 昨晚 23:58 / 2024-05-01 23:40 / 5月1日 晚上八点 / [时间] 昨晚十点 */
const SPLIT_TIME_PREFIX = /^[[【]\s*(?:时间|time)\s*[\]】]\s*[:：]?\s*(.+)$/iu;
const SPLIT_TIME_LABEL = /^(?:时间|time)\s*[:：]\s*(.+)$/iu;
const SPLIT_TIME_SHAPE =
  /^(?:(?:今天|今日|昨天|昨日|昨晚|前天|今晚|今早|明早|明天|刚才|刚刚)\s*)?(?:(?:凌晨|早上|早晨|上午|中午|下午|傍晚|晚上|夜里|深夜|半夜)\s*)?(?:(?:\d{4}\s*[-/年.]\s*\d{1,2}\s*[-/月.]\s*\d{1,2}\s*日?)|(?:\d{1,2}\s*月\s*\d{1,2}\s*日?)|(?:\d{1,2}\s*[-/.]\s*\d{1,2}))?\s*(?:\d{1,2}\s*[:：]\s*\d{2}(?:\s*[:：]\s*\d{2})?)?$/u;
const SPLIT_TIME_HAS_NUMBER =
  /(?:\d{1,2}\s*[:：]\s*\d{2})|(?:\d{4}\s*[-/年.]\s*\d{1,2})|(?:\d{1,2}\s*月\s*\d{1,2}\s*日?)/u;
const SPLIT_TIME_CHINESE =
  /^(?:(?:\d{1,2}\s*月\s*\d{1,2}\s*日|\d{4}\s*[-/年.]\s*\d{1,2}\s*[-/月.]\s*\d{1,2}\s*日?)\s*)?(?:(?:今天|今日|昨天|昨日|昨晚|前天|今晚|今早|明早|明天|刚才|刚刚)\s*)?(?:(?:凌晨|早上|早晨|上午|中午|下午|傍晚|晚上|夜里|深夜|半夜)\s*)?(?:\d{1,2}|[零一二三四五六七八九十两]{1,3})\s*点(?:\s*(?:半|一刻|三刻|\d{1,2}\s*分|[零一二三四五六七八九十]{1,3}\s*分?))?$/u;

/** 判断一行是不是时间；是的话返回时间文本，否则返回 null。 */
function matchTimeLine(line) {
  const text = String(line ?? '').trim();
  if (!text) return null;
  if (/[。！？!?…]/u.test(text)) return null;

  const prefixed = text.match(SPLIT_TIME_PREFIX) || text.match(SPLIT_TIME_LABEL);
  if (prefixed) return prefixed[1].trim() || null;

  if (text.length > 24) return null;
  if (SPLIT_TIME_CHINESE.test(text)) return text;
  if (SPLIT_TIME_HAS_NUMBER.test(text) && SPLIT_TIME_SHAPE.test(text)) return text;
  return null;
}

/** 一行文字 → 若干气泡（以「。」为主，顺带按 ！？… 切句）。 */
function splitLineSentences(line) {
  const sentences = [];

  const flush = (value) => {
    const text = value.trim();
    if (!text) return;
    if (!/[\p{L}\p{N}]/u.test(text)) return;
    sentences.push(text);
  };

  const chars = Array.from(String(line ?? '').replace(/[ \t]+/gu, ' ').trim());
  let buffer = '';

  for (let index = 0; index < chars.length; index += 1) {
    buffer += chars[index];
    if (!/[。！？!?…]/u.test(chars[index])) continue;

    while (index + 1 < chars.length && /[。！？!?…]/u.test(chars[index + 1])) {
      index += 1;
      buffer += chars[index];
    }
    while (index + 1 < chars.length && /[”"』」’）)】]/u.test(chars[index + 1])) {
      index += 1;
      buffer += chars[index];
    }

    flush(buffer);
    buffer = '';
  }

  flush(buffer);

  return sentences;
}

/**
 * splitSentences(raw) -> string[]
 * 一段叙述 → 气泡数组（不含时间行）。
 */
function splitSentences(raw) {
  const sentences = [];

  String(raw ?? '')
    .replace(/\r\n?/gu, '\n')
    .split('\n')
    .forEach((line) => {
      if (matchTimeLine(line)) return;
      sentences.push(...splitLineSentences(line));
    });

  return sentences;
}

/** splitBlocks(raw) -> [{ type: 'message' | 'time', text }]，时间行单独成块。 */
function splitBlocks(raw) {
  const blocks = [];

  String(raw ?? '')
    .replace(/\r\n?/gu, '\n')
    .split('\n')
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const time = matchTimeLine(trimmed);
      if (time) {
        blocks.push({ type: 'time', text: time });
        return;
      }

      splitLineSentences(trimmed).forEach((text) => {
        blocks.push({ type: 'message', text });
      });
    });

  return blocks;
}

/** 句首的「名字：」只有在名字是已有的人物时才当作说话人。 */
function splitSpeakerLabel(sentence) {
  const match = sentence.match(/^([^:：]{1,12})\s*[:：]\s*(.+)$/u);
  if (!match) return null;

  const id = resolveContactId(match[1].trim());
  if (!id) return null;

  return { id, text: match[2].trim() };
}

/**
 * 把文字切成若干气泡，并给每一句安排说话人。
 * 没指定人物时默认沿用上一句的人；第一句默认给对方。
 */
function buildSplitRows(raw) {
  const rows = [];
  let previous = getOtherId();

  splitBlocks(raw).forEach((block) => {
    if (block.type === 'time') {
      rows.push({
        type: 'time',
        text: block.text,
        source: block.text,
        speaker: null,
        manual: false,
        labeled: false,
        edited: false,
        selected: false,
      });
      return;
    }

    const labeled = splitSpeakerLabel(block.text);
    const speaker = labeled ? labeled.id : previous;
    rows.push({
      type: 'message',
      text: labeled ? labeled.text : block.text,
      speaker,
      manual: false,
      labeled: Boolean(labeled),
      selected: false,
    });
    previous = speaker;
  });

  return rows;
}

function fillSplitSpeakerSelect(select, currentId) {
  select.replaceChildren();
  Object.entries(CONTACT).forEach(([id, contact]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = id === 'me' ? `${contact.name || '我'}（我）` : contact.name || '未命名';
    select.append(option);
  });
  select.value = CONTACT[currentId] ? currentId : getOtherId();
}

function fillSplitAllSelect() {
  splitAllSelect.replaceChildren();

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '指定';
  splitAllSelect.append(placeholder);

  Object.entries(CONTACT).forEach(([id, contact]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = id === 'me' ? `${contact.name || '我'}（我）` : contact.name || '未命名';
    splitAllSelect.append(option);
  });

  const messages = splitRows.filter((row) => row.type !== 'time');
  const uniform =
    messages.length && messages.every((row) => row.speaker === messages[0].speaker)
      ? messages[0].speaker
      : '';
  splitAllSelect.value = uniform;
}

/** 批量设定用的下拉：默认停在「批量指定」，选好人物才会启用按钮。 */
function fillSplitBatchSpeaker() {
  const current = splitBatchSpeaker.value;
  splitBatchSpeaker.replaceChildren();

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '批量指定';
  splitBatchSpeaker.append(placeholder);

  Object.entries(CONTACT).forEach(([id, contact]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = id === 'me' ? `${contact.name || '我'}（我）` : contact.name || '未命名';
    splitBatchSpeaker.append(option);
  });

  splitBatchSpeaker.value = CONTACT[current] ? current : '';
}

function updateSplitBatch() {
  const selected = splitRows.filter((row) => row.selected);
  const assignable = selected.filter((row) => row.type !== 'time');

  splitBatchCount.textContent = `已选 ${selected.length}`;
  splitBatchApply.disabled = !assignable.length || !splitBatchSpeaker.value;

  const allSelected = splitRows.length > 0 && selected.length === splitRows.length;
  splitCheckAll.checked = allSelected;
  splitCheckAll.indeterminate = !allSelected && selected.length > 0;
}

function setSplitState(text, mode = 'idle') {
  splitNotice.className = 'parse-state';
  if (mode === 'valid') splitNotice.classList.add('is-valid');
  if (mode === 'error') splitNotice.classList.add('is-error');
  const dot = document.createElement('i');
  splitNotice.replaceChildren(dot, document.createTextNode(text));
}

function renderSplitList() {
  splitList.replaceChildren();

  if (!splitRows.length) {
    const empty = document.createElement('p');
    empty.className = 'split-empty';
    empty.textContent = '左边粘一段文字，这里会按句号列出每一句。单独一行的时间会识别成时间节点。';
    splitList.append(empty);
    updateSplitBatch();
    return;
  }

  splitRows.forEach((row, index) => {
    const isTime = row.type === 'time';
    const item = document.createElement('div');
    item.className = isTime ? 'split-row is-time' : 'split-row';
    item.dataset.splitRow = String(index);

    const head = document.createElement('div');
    head.className = 'split-row-head';

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'split-row-check';
    check.dataset.splitCheck = String(index);
    check.checked = Boolean(row.selected);
    check.setAttribute('aria-label', `选择第 ${index + 1} 项`);

    const number = document.createElement('span');
    number.className = 'split-index';
    number.textContent = pad2(index + 1);

    head.append(check, number);

    if (isTime) {
      const tag = document.createElement('span');
      tag.className = 'split-time-tag';
      tag.textContent = '时间';

      const input = document.createElement('input');
      input.className = 'split-time-input';
      input.dataset.splitTime = String(index);
      input.value = row.text;
      input.spellcheck = false;
      input.setAttribute('aria-label', `第 ${index + 1} 项时间`);

      head.append(tag, input);
      item.append(head);
    } else {
      const select = document.createElement('select');
      select.className = 'split-select';
      select.dataset.splitSpeaker = String(index);
      select.setAttribute('aria-label', `第 ${index + 1} 句的说话人`);
      fillSplitSpeakerSelect(select, row.speaker);

      const text = document.createElement('p');
      text.className = 'split-sentence';
      text.textContent = row.text;

      head.append(select);
      item.append(head, text);
    }

    splitList.append(item);
  });

  updateSplitBatch();
}

/** 根据当前分句结果刷新统计与按钮状态（不重新分句）。 */
function updateSplitStats() {
  const messages = splitRows.filter((row) => row.type !== 'time');
  const timeCount = splitRows.length - messages.length;
  const speakers = new Set(messages.map((row) => row.speaker));
  const chars = messages.reduce((total, row) => total + charCount(row.text), 0);
  const nodes = splitRows.map((row) =>
    row.type === 'time'
      ? { type: 'time', text: row.text }
      : { type: 'message', from: row.speaker, text: row.text },
  );
  const duration = splitRows.length
    ? estimateScriptDuration(nodes, { pace: state.pace, speed: state.speed })
    : 0;

  const summary = [
    messages.length ? `${messages.length} 句` : '',
    timeCount ? `${timeCount} 个时间` : '',
    messages.length ? `${speakers.size} 人` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  setSplitState(summary || '没有可用的句子', splitRows.length ? 'valid' : 'idle');

  const timeNote = timeCount ? `含 ${timeCount} 个时间 · ` : '';
  splitEstimate.textContent = splitRows.length
    ? `${timeNote}${chars} 字 · 约 ${formatDuration(duration)}`
    : '每句一个气泡';
  splitInsert.disabled = !splitRows.length;
  splitPlay.disabled = !splitRows.length;

  const hasStop = /[。！？!?…]/u.test(splitText.value);
  const tooLong = splitRows.length > 120;
  splitNote.textContent = tooLong
    ? `已经切出 ${splitRows.length} 段，建议分成几段分别生成。`
    : hasStop || !splitRows.length
      ? '没指定人物时沿用上一句；单独一行的时间会变成时间节点。'
      : '这段文字里没有句号，整段会合成一个气泡。';
  splitNote.classList.toggle('is-warn', tooLong || (!hasStop && splitRows.length > 1));

  fillSplitAllSelect();
  if (splitBatchSpeaker.options.length !== Object.keys(CONTACT).length + 1) {
    fillSplitBatchSpeaker();
  }
  updateSplitBatch();
}

/** 粗略的文本相似度（二元组重合率），用来判断某一句是否只是被改了错别字。 */
function textSimilarity(a, b) {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const grams = (value) => {
    const map = new Map();
    for (let index = 0; index < value.length - 1; index += 1) {
      const gram = value.slice(index, index + 2);
      map.set(gram, (map.get(gram) || 0) + 1);
    }
    return map;
  };

  const first = grams(a);
  const second = grams(b);
  let overlap = 0;
  let totalFirst = 0;
  let totalSecond = 0;

  first.forEach((count, gram) => {
    overlap += Math.min(count, second.get(gram) || 0);
  });
  first.forEach((count) => {
    totalFirst += count;
  });
  second.forEach((count) => {
    totalSecond += count;
  });

  return (2 * overlap) / Math.max(1, totalFirst + totalSecond);
}

/** 重新分句（输入框变化时调用），并尽量保留手动指定的人物、改过的时间与勾选。 */
function previewSplit() {
  const previousRows = splitRows;
  const nextRows = buildSplitRows(splitText.value);

  nextRows.forEach((row, index) => {
    const previous = previousRows[index];
    if (!previous || previous.type !== row.type) return;

    if (row.type === 'time') {
      if (previous.edited && previous.source === row.source) {
        row.text = previous.text;
        row.edited = true;
      }
      row.selected = Boolean(previous.selected);
      return;
    }

    /* 同一句被改了错别字时保留手动选择；整段换成新文字则重新分配 */
    if (previous.manual && textSimilarity(previous.text, row.text) >= 0.5) {
      row.speaker = previous.speaker;
      row.manual = true;
    }
    row.selected = Boolean(previous.selected);
  });

  /* 没指定人物、也不是「名字：」开头的句子，继续跟随上一句（时间节点不打断） */
  let lastSpeaker = getOtherId();
  nextRows.forEach((row) => {
    if (row.type === 'time') return;
    if (!row.manual && !row.labeled) row.speaker = lastSpeaker;
    lastSpeaker = row.speaker;
  });

  splitRows = nextRows;

  const scroll = splitList.scrollTop;
  renderSplitList();
  splitList.scrollTop = scroll;
  updateSplitStats();
}

/** 分句结果 → 剧本纯文本。 */
function generatedSplitScript() {
  return splitRows
    .map((row) => {
      if (row.type === 'time') {
        const label = String(row.text || '').trim();
        return label ? `[时间] ${label}` : '';
      }
      return `${safeContact(row.speaker).name || '某人'}：${row.text}`;
    })
    .filter(Boolean)
    .join('\n');
}

function insertSplitScript() {
  const text = generatedSplitScript();
  if (!text) return;

  const current = scriptEditor.value.replace(/\s+$/u, '');
  scriptEditor.value = current ? `${current}\n${text}` : text;
  updateScriptDraftStats();

  const count = splitRows.length;
  closeSplitDialog();
  scriptEditor.focus();
  scriptEditor.setSelectionRange(scriptEditor.value.length, scriptEditor.value.length);
  scriptEditor.scrollTop = scriptEditor.scrollHeight;
  showToast(`已把 ${count} 段插入剧本末尾，记得点「应用并回放」`);
}

function applySplitScript() {
  const text = generatedSplitScript();
  if (!text) return;
  scriptEditor.value = text;
  closeSplitDialog();
  applyEditorScript();
}

function openSplitDialog() {
  clearAutoStart();
  closePanel();
  emojiPop.hidden = true;
  previewSplit();
  fillSplitBatchSpeaker();
  if (typeof splitDialog.showModal === 'function') {
    splitDialog.showModal();
  } else {
    splitDialog.setAttribute('open', '');
  }
  window.setTimeout(() => splitText.focus(), 60);
}

function closeSplitDialog() {
  if (splitDialog.open && typeof splitDialog.close === 'function') {
    splitDialog.close();
  } else {
    splitDialog.removeAttribute('open');
  }
}

/** 某一句换了人物后，后面没手动指定的句子继续跟着上一句。 */
function setSplitSpeaker(index, speakerId) {
  const row = splitRows[index];
  if (!row || row.type === 'time') return;

  row.speaker = speakerId;
  row.manual = true;

  let lastSpeaker = row.speaker;
  for (let next = index + 1; next < splitRows.length; next += 1) {
    const nextRow = splitRows[next];
    if (nextRow.type === 'time') continue;

    if (!nextRow.manual && !nextRow.labeled) {
      nextRow.speaker = lastSpeaker;
      const select = splitList.querySelector(`[data-split-speaker="${next}"]`);
      if (select) select.value = lastSpeaker;
    }

    lastSpeaker = nextRow.speaker;
  }

  updateSplitStats();
}

/** 批量修改：把勾选的句子统一改成同一个人物。 */
function applySplitBatch() {
  const speakerId = splitBatchSpeaker.value;
  if (!speakerId) return;

  const targets = splitRows.filter((row) => row.selected && row.type !== 'time');
  if (!targets.length) return;

  targets.forEach((row) => {
    row.speaker = speakerId;
    row.manual = true;
  });

  const scroll = splitList.scrollTop;
  renderSplitList();
  splitList.scrollTop = scroll;
  updateSplitStats();
  showToast(`已把 ${targets.length} 句批量改成 ${safeContact(speakerId).name || '新人物'}`);
}


/* ============================================================
   面板 / PANEL
   ============================================================ */

function applyEditorScript() {
  try {
    const raw = scriptEditor.value.trim();
    const added = applyParsedScript(raw);
    clearScriptError();
    requestPlayback({ reset: true });
    showToast(
      added.length
        ? `剧本已更新 · 新增 ${added.length} 位人物`
        : `剧本已更新 · ${state.script.length} 个节点`,
    );
  } catch (error) {
    const message = error instanceof ScriptParseError ? error.display : error.message;
    showScriptError(message);
    showToast('剧本解析失败，请检查格式', 'error');
  }
}

function resetToSample() {
  state.scriptText = DEFAULT_SCRIPT.trim();
  state.script = parseScript(state.scriptText, { autoCreate: true });
  state.current = 0;
  scriptEditor.value = state.scriptText;
  clearScriptError();
  updateScriptStats();
  renderContactEditor();
  renderContactHeader();
  requestPlayback({ reset: true });
  showToast('已恢复示例剧本');
}

function setSpeed(speed) {
  if (!SPEED_OPTIONS.includes(speed)) return;
  state.speed = speed;
  $$('[data-speed]').forEach((button) => {
    button.classList.toggle('is-active', Number(button.dataset.speed) === speed);
  });
  updateScriptStats();
  updatePlayerUi();
}

function setPace(pace) {
  if (!PACE_OPTIONS.includes(pace)) return;
  state.pace = pace;
  $$('[data-pace]').forEach((button) => {
    button.classList.toggle('is-active', Number(button.dataset.pace) === pace);
  });
  updateScriptStats();
  updatePlayerUi();
}

function openPanel() {
  body.classList.add('panel-open');
  const toggle = $('#panelToggle');
  if (toggle) toggle.setAttribute('aria-expanded', 'true');
}

function closePanel() {
  body.classList.remove('panel-open');
  const toggle = $('#panelToggle');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

function togglePanel() {
  if (body.classList.contains('panel-open')) closePanel();
  else {
    openPanel();
    clearAutoStart();
  }
}

/* ============================================================
   录屏模式 / FOCUS
   ============================================================ */

function enterFocusMode() {
  closePanel();
  toastStack.replaceChildren();
  state.focusMode = true;
  updateFocusUi();
  wakeFocusHud(true);
}

function exitFocusMode() {
  state.focusMode = false;
  updateFocusUi();
  window.clearTimeout(hudTimer);
}

function toggleFocusMode() {
  if (state.focusMode) exitFocusMode();
  else enterFocusMode();
}

/* ============================================================
   主题 / THEME
   ============================================================ */

function normalizeTheme(theme) {
  return theme === 'night' ? 'night' : 'day';
}

function applyTheme(theme, options = {}) {
  const next = normalizeTheme(theme);
  body.dataset.theme = next;

  const themeBtn = $('#themeBtn');
  replaceIcon(themeBtn, next === 'day' ? 'moon' : 'sun');
  themeBtn.setAttribute('aria-label', next === 'day' ? '切换到夜间主题' : '切换到日间主题');
  themeBtn.title = next === 'day' ? '切换到夜间主题 (夜晚)' : '切换到日间主题 (白天)';

  const themeColor = $('meta[name="theme-color"]');
  if (themeColor) themeColor.content = next === 'day' ? '#f4f8ff' : '#0f1720';

  try {
    localStorage.setItem('echo-theme', next);
  } catch {
    /* localStorage can be unavailable in sandboxed contexts */
  }

  if (!options.silent) {
    showToast(next === 'day' ? '已切换到白日主题' : '已切换到夜晚主题');
  }
}

function toggleTheme() {
  applyTheme(body.dataset.theme === 'night' ? 'day' : 'night');
}

/* ============================================================
   顶栏收起 / COLLAPSIBLE TOPBAR
   ============================================================ */

function setTopbarCollapsed(collapsed, options = {}) {
  const next = Boolean(collapsed);
  topbarCollapsed = next;

  body.classList.toggle('topbar-collapsed', next);

  if (next) {
    if (options.moveFocus) topbarRestore.focus({ preventScroll: true });
    topbar.inert = true;
    topbar.setAttribute('aria-hidden', 'true');
    topbarCollapse.setAttribute('aria-expanded', 'false');
    topbarRestore.setAttribute('aria-expanded', 'false');
  } else {
    topbar.inert = false;
    topbar.removeAttribute('aria-hidden');
    topbarCollapse.setAttribute('aria-expanded', 'true');
    topbarRestore.setAttribute('aria-expanded', 'true');
    if (options.moveFocus) topbarCollapse.focus({ preventScroll: true });
  }

  if (!options.silent) {
    try {
      localStorage.setItem(TOPBAR_STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  }
}

function toggleTopbar() {
  setTopbarCollapsed(!topbarCollapsed, { moveFocus: true });
}

function restoreTopbarPreference() {
  let saved = false;
  try {
    saved = localStorage.getItem(TOPBAR_STORAGE_KEY) === '1';
  } catch {
    saved = false;
  }
  setTopbarCollapsed(saved, { silent: true });
}

/* ============================================================
   事件绑定 / EVENTS
   ============================================================ */

function bindEvents() {
  /* playback */
  playToggle.addEventListener('click', togglePlayback);
  restartBtn.addEventListener('click', restartPlayback);
  focusPlay.addEventListener('click', togglePlayback);
  $('#focusRestart').addEventListener('click', restartPlayback);

  $('#speedSwitch').addEventListener('click', (event) => {
    const button = event.target.closest('[data-speed]');
    if (button) setSpeed(Number(button.dataset.speed));
  });

  $('#paceSwitch').addEventListener('click', (event) => {
    const button = event.target.closest('[data-pace]');
    if (button) setPace(Number(button.dataset.pace));
  });

  countdownInput.addEventListener('input', () => {
    const raw = Number(countdownInput.value);
    if (!Number.isFinite(raw)) return;
    state.countdown = clamp(Math.round(raw), 0, 30);
  });

  countdownInput.addEventListener('change', () => {
    setCountdown(countdownInput.value);
  });

  countdownInput.addEventListener('blur', () => {
    setCountdown(countdownInput.value);
  });

  /* composer */
  messageInput.addEventListener('input', () => {
    clearAutoStart();
    resizeComposer();
  });

  messageInput.addEventListener('compositionstart', () => {
    isComposing = true;
  });

  messageInput.addEventListener('compositionend', () => {
    isComposing = false;
    resizeComposer();
  });

  messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      if (event.isComposing || isComposing) return;
      event.preventDefault();
      sendManualMessage();
    }
  });

  messageInput.addEventListener('focus', clearAutoStart);
  messageInput.addEventListener('pointerdown', clearAutoStart);

  composer.addEventListener('submit', (event) => {
    event.preventDefault();
    sendManualMessage();
  });

  $('#composerImport').addEventListener('click', openImportDialog);
  $('#importBtn').addEventListener('click', openImportDialog);

  scrollBottomBtn.addEventListener('click', () => {
    state.autoScroll = true;
    state.unseen = 0;
    updateUnreadBadge(false);
    scrollToBottom(true);
    wakeFocusHud();
  });

  chat.addEventListener('scroll', () => {
    const distance = chat.scrollHeight - chat.scrollTop - chat.clientHeight;
    const nearBottom = distance < 70;
    state.autoScroll = nearBottom;
    if (nearBottom) {
      state.unseen = 0;
      updateUnreadBadge(false);
    }
  }, { passive: true });

  /* emoji */
  EMOJIS.forEach((emoji) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = emoji;
    button.setAttribute('aria-label', `插入 ${emoji}`);
    button.addEventListener('click', () => insertEmoji(emoji));
    emojiPop.append(button);
  });

  emojiBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    emojiPop.hidden = !emojiPop.hidden;
  });

  document.addEventListener('pointerdown', (event) => {
    if (emojiPop.hidden) return;
    if (!emojiPop.contains(event.target) && !emojiBtn.contains(event.target)) {
      emojiPop.hidden = true;
    }
  });

  /* script editor */
  $('#applyScriptBtn').addEventListener('click', applyEditorScript);
  $('#resetScriptBtn').addEventListener('click', resetToSample);
  scriptEditor.addEventListener('input', () => {
    clearAutoStart();
    clearScriptError();
    updateScriptDraftStats();
  });

  scriptEditor.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      applyEditorScript();
    }
  });

  /* contacts — delegated so dynamically added people work too */
  contactEditor.addEventListener('input', (event) => {
    const input = event.target.closest('[data-contact-field]');
    if (!input) return;

    const [contactId, field] = input.dataset.contactField.split(':');
    const contact = CONTACT[contactId];
    if (!contact) return;

    const previous = contact[field];
    contact[field] = input.value;

    if (field === 'name') {
      if (previous && previous !== input.value) {
        contact.aliases = Array.from(new Set([...(contact.aliases || []), previous]));
      }
      const letter = Array.from(input.value.trim())[0];
      if (letter) contact.avatar = letter;
    }

    renderContactHeader();
    if (field === 'name') refreshChatAvatars();
    persistCast();
  });

  contactEditor.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-contact-remove]');
    if (remove) {
      removeContact(remove.dataset.contactRemove);
      return;
    }

    const reset = event.target.closest('[data-avatar-reset]');
    if (reset) resetAvatar(reset.dataset.avatarReset);
  });

  castMode.addEventListener('click', (event) => {
    const button = event.target.closest('[data-mode]');
    if (button) setChatMode(button.dataset.mode);
  });

  castAddBtn.addEventListener('click', () => addContact());

  selfAvatarToggle.addEventListener('change', () => {
    setShowSelfAvatar(selfAvatarToggle.checked);
  });

  groupNameInput.addEventListener('input', () => {
    state.groupName = groupNameInput.value.trim() || DEFAULT_GROUP_NAME;
    renderContactHeader();
    persistCast();
  });

  /* avatars */
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-avatar-edit]');
    if (!button || button.hidden) return;
    pendingAvatarContact = button.dataset.avatarEdit;
    avatarFile.value = '';
    avatarFile.click();
  });

  avatarFile.addEventListener('change', () => {
    const file = avatarFile.files?.[0];
    if (file) applyAvatarFile(file);
  });

  /* theme */
  $('#themeBtn').addEventListener('click', toggleTheme);

  /* topbar */
  topbarCollapse.addEventListener('click', toggleTopbar);
  topbarRestore.addEventListener('click', toggleTopbar);

  /* focus */
  $('#focusBtn').addEventListener('click', enterFocusMode);
  $('#focusExit').addEventListener('click', exitFocusMode);

  document.addEventListener('pointermove', () => wakeFocusHud(), { passive: true });
  document.addEventListener('pointerdown', () => wakeFocusHud(), { passive: true });

  /* panel */
  $('#panelToggle').addEventListener('click', togglePanel);
  $('#panelClose').addEventListener('click', closePanel);
  document.addEventListener('click', (event) => {
    if (!body.classList.contains('panel-open')) return;
    const panel = $('#panel');
    const toggle = $('#panelToggle');
    if (!panel.contains(event.target) && !toggle.contains(event.target)) closePanel();
  });

  /* import dialog */
  $('#dialogClose').addEventListener('click', closeImportDialog);
  $('#dialogCancel').addEventListener('click', closeImportDialog);
  $('#fillSampleBtn').addEventListener('click', () => {
    importText.value = IMPORT_SAMPLE;
    previewImport();
    importText.focus();
  });
  $('#fillGroupSampleBtn').addEventListener('click', () => {
    importText.value = GROUP_SAMPLE;
    previewImport();
    importText.focus();
  });
  importText.addEventListener('input', previewImport);
  importDialog.addEventListener('click', (event) => {
    if (event.target === importDialog) closeImportDialog();
  });

  $('#importForm').addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const raw = importText.value;
      if (!raw.trim()) {
        previewImport();
        return;
      }
      const parsed = state.importPreviewText === raw && state.importPreview ? state.importPreview : parseScript(raw);
      if (!parsed.length) return;
      applyImportedText(raw);
    } catch (error) {
      previewImport();
      showToast(error instanceof ScriptParseError ? error.display : error.message, 'error');
    }
  });

  /* text -> dialogue dialog */
  $('#splitDialogBtn').addEventListener('click', openSplitDialog);
  $('#splitClose').addEventListener('click', closeSplitDialog);
  $('#splitCancel').addEventListener('click', closeSplitDialog);
  $('#splitSampleBtn').addEventListener('click', () => {
    splitText.value = SPLIT_SAMPLE;
    previewSplit();
    splitText.focus();
  });

  $('#splitAddPerson').addEventListener('click', () => {
    closeSplitDialog();
    const id = addContact({ silent: true });
    if (!id) return;
    /* 等这次点击冒泡结束，否则会被面板的“点空白关闭”逻辑收起来 */
    window.setTimeout(openPanel, 0);
    showToast('新人物已添加，改个名字再回到「文本转对话」');
  });

  splitText.addEventListener('input', () => {
    clearAutoStart();
    previewSplit();
  });

  splitInsert.addEventListener('click', insertSplitScript);
  splitPlay.addEventListener('click', applySplitScript);

  splitList.addEventListener('change', (event) => {
    const check = event.target.closest('[data-split-check]');
    if (check) {
      const row = splitRows[Number(check.dataset.splitCheck)];
      if (row) row.selected = check.checked;
      updateSplitBatch();
      return;
    }

    const select = event.target.closest('[data-split-speaker]');
    if (!select) return;
    setSplitSpeaker(Number(select.dataset.splitSpeaker), select.value);
  });

  /* 时间节点：识别出来之后就在列表里直接改 */
  splitList.addEventListener('input', (event) => {
    const input = event.target.closest('[data-split-time]');
    if (!input) return;

    const row = splitRows[Number(input.dataset.splitTime)];
    if (!row) return;

    row.text = input.value;
    row.edited = true;
    updateSplitStats();
  });

  splitCheckAll.addEventListener('change', () => {
    const checked = splitCheckAll.checked;
    splitRows.forEach((row) => {
      row.selected = checked;
    });

    const scroll = splitList.scrollTop;
    renderSplitList();
    splitList.scrollTop = scroll;
  });

  splitBatchSpeaker.addEventListener('change', updateSplitBatch);
  splitBatchApply.addEventListener('click', applySplitBatch);

  splitAllSelect.addEventListener('change', () => {
    const speakerId = splitAllSelect.value;
    if (!speakerId) return;

    splitRows.forEach((row, index) => {
      if (row.type === 'time') return;
      row.speaker = speakerId;
      row.manual = true;
      const select = splitList.querySelector(`[data-split-speaker="${index}"]`);
      if (select) select.value = speakerId;
    });
    updateSplitStats();
  });

  $('#splitForm').addEventListener('submit', (event) => event.preventDefault());
  splitDialog.addEventListener('click', (event) => {
    if (event.target === splitDialog) closeSplitDialog();
  });

  /* keyboard */
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const isEditable =
      target instanceof HTMLElement &&
      (target.matches('input, textarea, select') || target.isContentEditable);

    if (event.key === 'Escape' && state.countdownActive) {
      cancelCountdown();
      return;
    }

    if (event.key === 'Escape') {
      if (importDialog.open || splitDialog.open) return;
      if (body.classList.contains('panel-open')) {
        closePanel();
        return;
      }
      if (state.focusMode) {
        exitFocusMode();
        return;
      }
    }

    if (importDialog.open || splitDialog.open) return;

    if (event.code === 'Space' && !isEditable && !(target instanceof HTMLButtonElement)) {
      event.preventDefault();
      togglePlayback();
      wakeFocusHud(true);
      return;
    }

    if (!isEditable && event.key.toLowerCase() === 'r') {
      event.preventDefault();
      restartPlayback();
      wakeFocusHud(true);
      return;
    }

    if (!isEditable && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      toggleFocusMode();
      return;
    }

    if (!isEditable && event.key.toLowerCase() === 'h') {
      event.preventDefault();
      setTopbarCollapsed(!topbarCollapsed, { moveFocus: true });
      return;
    }

    wakeFocusHud();
  });
}

/* ============================================================
   初始化 / INIT
   ============================================================ */

function initialize() {
  /* restore theme */
  let savedTheme = 'day';
  try {
    savedTheme = localStorage.getItem('echo-theme') || 'day';
  } catch {
    savedTheme = 'day';
  }
  if (savedTheme === 'warm') savedTheme = 'day';
  applyTheme(savedTheme, { silent: true });

  loadSavedCast();
  loadSavedAvatars();
  restoreTopbarPreference();
  restoreCountdownPreference();

  scriptEditor.value = state.scriptText;
  updateScriptStats();

  renderContactEditor();
  renderContactHeader();
  applyChatModeVisuals();
  renderInitial({ animate: 'stagger' });
  updatePlayerUi();
  bindEvents();
  resizeComposer();

  /* initial auto start */
  autoStartTimer = window.setTimeout(() => {
    autoStartTimer = null;
    if (!state.isPlaying && state.current === 0) {
      startPlayback({ reset: false });
    }
  }, 1800);
}

/* Expose a small API for console-driven scenes and tests. */
window.ChatReplay = Object.freeze({
  CONTACT,
  INITIAL,
  SCRIPT,
  TIMING,
  state,
  parseScript,
  calcTiming,
  estimateScriptDuration,
  buildNode,
  refreshAvatars,
  playScript,
  startPlayback,
  togglePlayback,
  restartPlayback,
  setSpeed,
  setPace,
  setChatMode,
  addContact,
  removeContact,
  setShowSelfAvatar,
  GROUP_SAMPLE,
  SPLIT_SAMPLE,
  splitSentences,
  splitBlocks,
  matchTimeLine,
  buildSplitRows,
  openSplitDialog,
  setCountdown,
  requestPlayback,
});

initialize();
