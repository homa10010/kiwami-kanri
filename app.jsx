import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  getRedirectResult, onAuthStateChanged, signOut,
} from 'firebase/auth';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, getDoc, getDocs, onSnapshot, writeBatch,
  updateDoc, addDoc, deleteDoc,
} from 'firebase/firestore';
import { firebaseConfig } from './firebase-config.js';

const CONFIG_PLACEHOLDER = firebaseConfig.apiKey.indexOf('PASTE_YOUR') !== -1;

let auth = null, db = null;
if (!CONFIG_PLACEHOLDER) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // オフライン永続化 (複数タブ対応) を有効にして初期化
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
}

/* ---- インライン SVG アイコン ---- */
const Icon = ({ children, size = 16, fill = 'none', strokeWidth = 2, className = '', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
       fill={fill} stroke="currentColor" strokeWidth={strokeWidth}
       strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    {children}
  </svg>
);
const Plus       = (p) => <Icon {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Icon>;
const Minus      = (p) => <Icon {...p}><line x1="5" y1="12" x2="19" y2="12"/></Icon>;
const SearchIcon = (p) => <Icon {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Icon>;
const XIcon      = (p) => <Icon {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Icon>;
const Trash2     = (p) => <Icon {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></Icon>;
const Star       = (p) => <Icon {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Icon>;
const ChevronDown= (p) => <Icon {...p}><polyline points="6 9 12 15 18 9"/></Icon>;
const ChevronUp  = (p) => <Icon {...p}><polyline points="18 15 12 9 6 15"/></Icon>;
const Sparkles   = (p) => <Icon {...p}><path d="M12 3l1.9 5.7a1 1 0 0 0 .63.63L20.24 11l-5.7 1.9a1 1 0 0 0-.63.63L12 19l-1.9-5.7a1 1 0 0 0-.63-.63L3.76 11l5.7-1.9a1 1 0 0 0 .63-.63L12 3z"/></Icon>;
const RotateCcw  = (p) => <Icon {...p}><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></Icon>;
const Pencil     = (p) => <Icon {...p}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></Icon>;
const Download   = (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Icon>;
const Upload     = (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Icon>;
const MoreH      = (p) => <Icon {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></Icon>;
const LogOut     = (p) => <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Icon>;

const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

/* ---- 球団マスタ ---- */
const TEAMS = [
  { code: 'ソ', name: 'ソフトバンク', bg: '#FCC800', fg: '#0A0A0A' },
  { code: '日', name: '日本ハム',    bg: '#003831', fg: '#FFFFFF' },
  { code: 'オ', name: 'オリックス',  bg: '#111827', fg: '#FFFFFF' },
  { code: '楽', name: '楽天',        bg: '#870010', fg: '#FFFFFF' },
  { code: '西', name: '西武',        bg: '#1F286F', fg: '#FFFFFF' },
  { code: 'ロ', name: 'ロッテ',      bg: '#111111', fg: '#FFFFFF' },
  { code: '阪', name: '阪神',        bg: '#FFE100', fg: '#0A0A0A' },
  { code: 'De', name: 'DeNA',        bg: '#0055A5', fg: '#FFFFFF' },
  { code: '巨', name: '巨人',        bg: '#F97709', fg: '#FFFFFF' },
  { code: '中', name: '中日',        bg: '#002569', fg: '#FFFFFF' },
  { code: '広', name: '広島',        bg: '#FF2A00', fg: '#FFFFFF' },
  { code: 'ヤ', name: 'ヤクルト',    bg: '#00873C', fg: '#FFFFFF' },
];
const TEAM_ORDER = TEAMS.map(t => t.code);

const INITIAL_PLAYERS = [
  { team: 'オ', name: '頓宮',       count: 5, hasMotherBody: true },
  { team: '楽', name: '岸',         count: 5, hasMotherBody: true },
  { team: '広', name: 'ファビアン', count: 5, hasMotherBody: true },
  { team: 'ソ', name: '今宮',       count: 5, hasMotherBody: true },
  { team: 'ソ', name: '周東',       count: 5 }, { team: 'ソ', name: '山川',       count: 5 },
  { team: 'ソ', name: '近藤',       count: 5 }, { team: 'ソ', name: '山本佑大',   count: 5 },
  { team: '日', name: '伊藤',       count: 5 }, { team: '日', name: '金村',       count: 5 },
  { team: '日', name: '田宮',       count: 5 },
  { team: 'オ', name: '宗',         count: 5 }, { team: 'オ', name: '太田',       count: 5 },
  { team: '楽', name: '鈴木翔',     count: 5 }, { team: '楽', name: '則本',       count: 5 },
  { team: '楽', name: '藤井',       count: 5 }, { team: '楽', name: '荘司',       count: 5 },
  { team: '西', name: '古賀',       count: 5 }, { team: '西', name: '隅田',       count: 5 },
  { team: '西', name: '滝澤',       count: 5 }, { team: '西', name: '甲斐野',     count: 5 },
  { team: '西', name: '桑原',       count: 5 },
  { team: 'ロ', name: '種市',       count: 5 }, { team: 'ロ', name: '佐藤',       count: 5 },
  { team: 'ロ', name: '鈴木',       count: 5 },
  { team: 'De', name: '伊勢',       count: 5 }, { team: 'De', name: '牧',         count: 5 },
  { team: 'De', name: '森原',       count: 5 }, { team: 'De', name: '東',         count: 5 },
  { team: '巨', name: '岡本',       count: 5 }, { team: '巨', name: '吉川尚輝',   count: 5 },
  { team: '巨', name: '大城',       count: 5 }, { team: '巨', name: '丸',         count: 5 },
  { team: '中', name: '岡林',       count: 5 }, { team: '中', name: '細川',       count: 5 },
  { team: '中', name: '田中',       count: 5 }, { team: '中', name: '村松',       count: 5 },
  { team: '中', name: '高橋宏斗',   count: 5 }, { team: '中', name: '木下',       count: 5 },
  { team: '広', name: '菊池',       count: 5 },
  { team: 'ヤ', name: '小川',       count: 5 }, { team: 'ヤ', name: '吉村',       count: 5 },
  { team: 'ソ', name: '藤井',       count: 4 }, { team: 'ソ', name: '松本裕',     count: 4 },
  { team: 'ソ', name: '杉山',       count: 4 },
  { team: '日', name: '水谷',       count: 4 },
  { team: 'オ', name: 'ペルドモ',   count: 4 }, { team: 'オ', name: '中川',       count: 4 },
  { team: 'オ', name: '曽谷',       count: 4 }, { team: 'オ', name: 'エスピ',     count: 4 },
  { team: 'オ', name: '西川',       count: 4 },
  { team: '楽', name: '辰己',       count: 4 }, { team: '楽', name: '安田',       count: 4 },
  { team: '楽', name: '渡辺',       count: 4 }, { team: '楽', name: '酒居',       count: 4 },
  { team: '西', name: '平良',       count: 4 }, { team: '西', name: '炭谷',       count: 4 },
  { team: '西', name: '外崎',       count: 4 }, { team: '西', name: '水上',       count: 4 },
  { team: 'ロ', name: '岡',         count: 4 }, { team: 'ロ', name: '山口',       count: 4 },
  { team: 'ロ', name: '藤岡',       count: 4 }, { team: 'ロ', name: '中村',       count: 4 },
  { team: 'De', name: '大貫',       count: 4 },
  { team: '巨', name: '門脇',       count: 4 }, { team: '巨', name: '大勢',       count: 4 },
  { team: '中', name: '小笠原',     count: 4 },
  { team: '広', name: '末包',       count: 4 }, { team: '広', name: '塹江',       count: 4 },
  { team: '広', name: '中崎',       count: 4 }, { team: '広', name: '森浦',       count: 4 },
  { team: 'ヤ', name: '石山',       count: 4 },
];

const STATUS_DEF = {
  ready:      { label: '極待機',   bg: '#FBF0CE', fg: '#7A5C00', border: '#E5BF5A', accent: '#C89B3C' },
  stocked:    { label: '5体以上',  bg: '#E3EFDF', fg: '#2B5A32', border: '#8EBB8A', accent: '#4A7C59' },
  four:       { label: '4体',      bg: '#DBE8F3', fg: '#274870', border: '#7FA1C7', accent: '#2E5A87' },
  collecting: { label: '収集中',   bg: '#EEEBE4', fg: '#4A4740', border: '#C7C3BA', accent: '#6B655A' },
};
const getStatus = (p) => {
  if (p.count >= 5 && p.hasMotherBody) return 'ready';
  if (p.count >= 5) return 'stocked';
  if (p.count === 4) return 'four';
  return 'collecting';
};
const getTeam = (code) => TEAMS.find(t => t.code === code) || { code, name: code, bg: '#6b7280', fg: '#fff' };

/* ---- 共通パーツ ---- */
const TeamBadge = ({ code, size = 36 }) => {
  const t = getTeam(code);
  return (
    <div className="flex items-center justify-center rounded-md font-bold shrink-0 select-none"
         style={{ backgroundColor: t.bg, color: t.fg, width: size, height: size, fontSize: size * 0.42, letterSpacing: '-0.02em' }}>
      {code}
    </div>
  );
};

const StatusPill = ({ status }) => {
  const s = STATUS_DEF[status];
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ backgroundColor: s.bg, color: s.fg, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
};

const SummaryCard = ({ label, value, status, onClick, active }) => {
  const s = STATUS_DEF[status];
  return (
    <button onClick={onClick}
            className="p-2 rounded-lg text-left transition-all active:scale-95"
            style={{
              backgroundColor: s.bg, color: s.fg,
              border: `1.5px solid ${active ? s.accent : s.border}`,
              boxShadow: active ? `0 0 0 2px ${s.accent}33` : 'none',
            }}>
      <div className="text-[10px] font-semibold opacity-80 leading-tight">{label}</div>
      <div className="font-mono font-bold text-xl tabular-nums leading-tight mt-0.5">{value}</div>
    </button>
  );
};

/* ---- 選手行 ---- */
const PlayerRow = ({ player, onUpdate, onDelete, onEdit }) => {
  const status = getStatus(player);
  const isReady = status === 'ready';
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmKiwami, setConfirmKiwami] = useState(false);

  return (
    <div className="px-3 py-2.5 flex items-start gap-2.5 transition-colors"
         style={{
           backgroundColor: isReady ? '#FEFAE8' : '#fff',
           borderLeft: isReady ? '3px solid #C89B3C' : '3px solid transparent',
         }}>
      <TeamBadge code={player.team} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1.5 min-h-[20px]">
          <button onClick={onEdit}
                  className="font-semibold text-stone-900 truncate text-[15px] text-left hover:underline underline-offset-2 decoration-stone-400">
            {player.name}
          </button>
          <StatusPill status={status} />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <div className="flex items-center gap-1">
            <button onClick={() => onUpdate({ count: Math.max(0, player.count - 1) })}
                    disabled={player.count <= 0}
                    className="w-8 h-8 rounded border border-stone-300 bg-white flex items-center justify-center disabled:opacity-30 active:bg-stone-100"
                    aria-label="所持数を減らす">
              <Minus size={16} />
            </button>
            <span className="font-mono font-bold text-lg tabular-nums w-7 text-center"
                  style={{ color: player.count >= 5 ? '#1F5C2C' : '#1A1D24' }}>
              {player.count}
            </span>
            <button onClick={() => onUpdate({ count: player.count + 1 })}
                    className="w-8 h-8 rounded border border-stone-300 bg-white flex items-center justify-center active:bg-stone-100"
                    aria-label="所持数を増やす">
              <Plus size={16} />
            </button>
          </div>
          <div className="w-px h-6 bg-stone-200 mx-1" />
          <button onClick={() => onUpdate({ hasMotherBody: !player.hasMotherBody })}
                  className={`h-8 px-2 rounded border text-xs font-semibold flex items-center gap-1 transition-colors ${
                    player.hasMotherBody
                      ? 'bg-amber-100 border-amber-400 text-amber-800'
                      : 'bg-white border-stone-300 text-stone-400'
                  }`}
                  aria-label="S母体所持を切り替え">
            <Star size={12} fill={player.hasMotherBody ? '#B45309' : 'none'} strokeWidth={2.5} />
            S母
          </button>
          <div className="ml-auto flex items-center gap-1">
            {isReady && (
              confirmKiwami ? (
                <div className="flex items-center gap-1">
                  <button onClick={() => { onUpdate({ count: player.count - 5 }); setConfirmKiwami(false); }}
                          className="h-8 px-2 rounded bg-amber-500 text-white text-xs font-bold">
                    5体消費
                  </button>
                  <button onClick={() => setConfirmKiwami(false)}
                          className="h-8 px-2 rounded border border-stone-300 text-xs text-stone-600">
                    取消
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmKiwami(true)}
                        className="h-8 px-2 rounded bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1">
                  <Sparkles size={12} />
                  極化
                </button>
              )
            )}
            <button onClick={onEdit}
                    className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700"
                    aria-label={`${player.name}を編集`}>
              <Pencil size={14} />
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button onClick={onDelete} className="h-7 px-2 rounded bg-red-600 text-white text-xs font-bold">削除</button>
                <button onClick={() => setConfirmDelete(false)} className="h-7 px-2 rounded border border-stone-300 text-xs text-stone-600">取消</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                      className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-red-500"
                      aria-label={`${player.name}を削除`}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---- 選手フォーム ---- */
const PlayerForm = ({ mode, initialData, onSubmit, onClose }) => {
  const [team, setTeam] = useState(initialData?.team ?? 'ソ');
  const [name, setName] = useState(initialData?.name ?? '');
  const [count, setCount] = useState(initialData?.count ?? 0);
  const [hasMotherBody, setHasMotherBody] = useState(initialData?.hasMotherBody ?? false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      await onSubmit({ team, name: name.trim(), count, hasMotherBody });
      onClose();
    } catch (e) {
      alert('保存に失敗しました: ' + e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-900">{mode === 'edit' ? '選手を編集' : '選手を追加'}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600" aria-label="閉じる">
            <XIcon size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-stone-600 mb-2 block">球団</label>
            <div className="grid grid-cols-6 gap-1.5">
              {TEAMS.map(t => (
                <button key={t.code} onClick={() => setTeam(t.code)}
                        className={`h-10 rounded font-bold text-sm transition-all ${team === t.code ? '' : 'opacity-50'}`}
                        style={{ backgroundColor: t.bg, color: t.fg,
                                 boxShadow: team === t.code ? '0 0 0 2px #1A1D24' : 'none' }}>
                  {t.code}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-600 mb-1.5 block">選手名</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
                   placeholder="例: 山本由伸"
                   className="w-full px-3 py-2.5 border border-stone-300 rounded text-base focus:outline-none focus:border-stone-900"
                   autoFocus={mode !== 'edit'} />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-600 mb-1.5 block">現在の所持数</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setCount(Math.max(0, count - 1))}
                      className="w-11 h-11 rounded border border-stone-300 flex items-center justify-center">
                <Minus size={18} />
              </button>
              <span className="font-mono font-bold text-2xl tabular-nums min-w-[40px] text-center">{count}</span>
              <button onClick={() => setCount(count + 1)}
                      className="w-11 h-11 rounded border border-stone-300 flex items-center justify-center">
                <Plus size={18} />
              </button>
            </div>
          </div>
          <button onClick={() => setHasMotherBody(!hasMotherBody)}
                  className={`w-full h-11 rounded border text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    hasMotherBody
                      ? 'bg-amber-100 border-amber-400 text-amber-800'
                      : 'bg-white border-stone-300 text-stone-500'
                  }`}>
            <Star size={16} fill={hasMotherBody ? '#B45309' : 'none'} strokeWidth={2.5} />
            S母体を所持している
          </button>
          <button onClick={submit} disabled={!name.trim() || busy}
                  className="w-full h-12 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-bold disabled:opacity-40">
            {busy ? '保存中…' : (mode === 'edit' ? '変更を保存' : '追加する')}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---- メニュー ---- */
const Menu = ({ user, onExport, onImport, onReset, onSignOut, onClose }) => (
  <div className="fixed inset-0 z-40" onClick={onClose}>
    <div className="absolute right-3 top-14 bg-white rounded-lg border border-stone-200 shadow-lg py-1 w-64"
         onClick={e => e.stopPropagation()}>
      <div className="px-3 py-2 border-b border-stone-100">
        <div className="text-xs text-stone-500">サインイン中</div>
        <div className="text-sm font-semibold text-stone-800 truncate">{user.displayName || user.email}</div>
      </div>
      <button onClick={() => { onExport(); onClose(); }}
              className="w-full px-3 py-2.5 flex items-center gap-2.5 text-sm text-stone-700 hover:bg-stone-100 text-left">
        <Download size={16} /> データをエクスポート
      </button>
      <button onClick={() => { onImport(); onClose(); }}
              className="w-full px-3 py-2.5 flex items-center gap-2.5 text-sm text-stone-700 hover:bg-stone-100 text-left">
        <Upload size={16} /> データをインポート
      </button>
      <div className="h-px bg-stone-200 my-1" />
      <button onClick={() => { onReset(); onClose(); }}
              className="w-full px-3 py-2.5 flex items-center gap-2.5 text-sm text-red-600 hover:bg-red-50 text-left">
        <RotateCcw size={16} /> 初期データにリセット
      </button>
      <button onClick={() => { onSignOut(); onClose(); }}
              className="w-full px-3 py-2.5 flex items-center gap-2.5 text-sm text-stone-700 hover:bg-stone-100 text-left">
        <LogOut size={16} /> サインアウト
      </button>
    </div>
  </div>
);

/* ---- サインイン画面 ---- */
function SignInScreen() {
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState(null);
  const signIn = async () => {
    setSigning(true); setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
        try { await signInWithRedirect(auth, new GoogleAuthProvider()); return; }
        catch (e2) { setError(e2.message); }
      } else if (e.code !== 'auth/cancelled-popup-request' && e.code !== 'auth/popup-closed-by-user') {
        setError(e.message);
      }
    } finally { setSigning(false); }
  };
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 rounded-2xl font-black text-4xl flex items-center justify-center mb-5"
           style={{ backgroundColor: '#FFC800', color: '#1A1D24' }}>極</div>
      <h1 className="text-2xl font-bold text-stone-900 mb-1">極管理</h1>
      <p className="text-sm text-stone-500 mb-8 text-center">プロスピA Aランク収集をクラウド管理</p>
      <button onClick={signIn} disabled={signing}
              className="w-full max-w-xs h-12 bg-white border border-stone-300 rounded-lg font-semibold text-stone-800 flex items-center justify-center gap-3 hover:bg-stone-50 disabled:opacity-50 shadow-sm">
        <GoogleG />
        {signing ? 'サインイン中…' : 'Googleでサインイン'}
      </button>
      {error && <p className="text-xs text-red-600 mt-4 max-w-xs text-center">{error}</p>}
      <p className="text-xs text-stone-400 mt-8 text-center max-w-xs leading-relaxed">
        サインインすると、複数端末でデータを同期できます。<br/>
        データはあなたのGoogleアカウントに紐付いて保存されます。
      </p>
    </div>
  );
}

/* ---- セットアップ手順画面 ---- */
function SetupScreen() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="max-w-lg bg-white border border-stone-200 rounded-lg p-6 shadow-sm">
        <h1 className="text-lg font-bold text-stone-900 mb-3">🔧 セットアップが必要です</h1>
        <p className="text-sm text-stone-700 mb-3 leading-relaxed">
          このアプリを起動するには、Firebase プロジェクトの設定情報を <code className="bg-stone-100 px-1 py-0.5 rounded text-xs">src/firebase-config.js</code> に貼り付けて、<code className="bg-stone-100 px-1 py-0.5 rounded text-xs">npm run build</code> を実行してください。
        </p>
        <p className="text-sm text-stone-700 mb-4 leading-relaxed">
          詳しい手順は <code className="bg-stone-100 px-1 py-0.5 rounded text-xs">README.md</code> を参照してください。
        </p>
        <div className="bg-stone-900 text-stone-100 rounded p-3 font-mono text-[11px] overflow-x-auto whitespace-pre">
{`export const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "xxx.firebaseapp.com",
  projectId: "xxx",
  storageBucket: "xxx.appspot.com",
  messagingSenderId: "...",
  appId: "1:...:web:..."
};`}
        </div>
      </div>
    </div>
  );
}

/* ---- メインアプリ ---- */
function TrackerApp({ user }) {
  const [players, setPlayers] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [collapsedTeams, setCollapsedTeams] = useState({});
  const [showMenu, setShowMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importPending, setImportPending] = useState(null);
  const fileInputRef = useRef(null);

  const userRef = doc(db, 'users', user.uid);
  const playersRef = collection(userRef, 'players');

  useEffect(() => {
    let unsub = () => {};
    let cancelled = false;
    (async () => {
      try {
        const snapshot = await getDoc(userRef);
        if (!cancelled && (!snapshot.exists() || !snapshot.data().seeded)) {
          setSeeding(true);
          const batch = writeBatch(db);
          INITIAL_PLAYERS.forEach((p, i) => {
            batch.set(doc(playersRef, `seed_${i}`), {
              team: p.team, name: p.name, count: p.count,
              hasMotherBody: p.hasMotherBody ?? false,
              updatedAt: Date.now(),
            });
          });
          batch.set(userRef, { seeded: true, seededAt: Date.now() }, { merge: true });
          await batch.commit();
          setSeeding(false);
        }
      } catch (e) {
        console.error(e);
        setSeeding(false);
      }
      if (cancelled) return;
      unsub = onSnapshot(playersRef, snap => {
        setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, err => {
        console.error('snapshot error:', err);
        setPlayers([]);
      });
    })();
    return () => { cancelled = true; unsub(); };
  }, [user.uid]);

  const updatePlayer = (id, updates) => updateDoc(doc(playersRef, id), { ...updates, updatedAt: Date.now() });
  const addPlayer = (data) => addDoc(playersRef, { ...data, updatedAt: Date.now() });
  const deletePlayer = (id) => deleteDoc(doc(playersRef, id));

  // 500 op/batch の制約に合わせて分割コミット
  const commitChunked = async (ops) => {
    let batch = writeBatch(db); let n = 0;
    for (const apply of ops) {
      apply(batch); n++;
      if (n >= 400) { await batch.commit(); batch = writeBatch(db); n = 0; }
    }
    if (n > 0) await batch.commit();
  };

  const replaceAll = async (newPlayers) => {
    const snap = await getDocs(playersRef);
    const ops = [];
    snap.docs.forEach(d => ops.push(b => b.delete(d.ref)));
    const stamp = Date.now();
    newPlayers.forEach((p, i) => ops.push(b => b.set(doc(playersRef, `${p._idPrefix || 'p'}_${stamp}_${i}`), {
      team: p.team ?? 'ソ',
      name: String(p.name ?? '').trim() || '(無名)',
      count: Number.isFinite(p.count) ? p.count : 0,
      hasMotherBody: !!p.hasMotherBody,
      updatedAt: stamp,
    })));
    await commitChunked(ops);
  };

  const resetToInitial = async () => {
    setShowResetConfirm(false);
    await replaceAll(INITIAL_PLAYERS.map(p => ({ ...p, _idPrefix: 'seed' })));
  };

  const exportData = () => {
    const data = { format: 'prospia-tracker', version: 1, exportedAt: new Date().toISOString(), players };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kiwami-kanri-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const triggerImport = () => fileInputRef.current?.click();
  const handleImportFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data || !Array.isArray(data.players)) { alert('形式が正しくありません'); return; }
        setImportPending(data.players);
      } catch { alert('ファイルを読み込めませんでした'); }
    };
    reader.readAsText(file);
  };
  const applyImport = async () => {
    const list = importPending;
    setImportPending(null);
    await replaceAll(list.map(p => ({ ...p, _idPrefix: 'imp' })));
  };

  const filtered = useMemo(() => {
    if (!players) return [];
    return players.filter(p => {
      if (search && !p.name.includes(search)) return false;
      if (teamFilter !== 'all' && p.team !== teamFilter) return false;
      if (statusFilter !== 'all' && getStatus(p) !== statusFilter) return false;
      return true;
    });
  }, [players, search, teamFilter, statusFilter]);

  const showGrouped = !search && statusFilter === 'all';

  const grouped = useMemo(() => {
    if (!showGrouped) return null;
    const groups = {};
    filtered.forEach(p => {
      if (!groups[p.team]) groups[p.team] = [];
      groups[p.team].push(p);
    });
    const order = { ready: 0, stocked: 1, four: 2, collecting: 3 };
    Object.values(groups).forEach(g => g.sort((a, b) => {
      const d = order[getStatus(a)] - order[getStatus(b)];
      if (d !== 0) return d;
      return b.count - a.count;
    }));
    return groups;
  }, [filtered, showGrouped]);

  const flatList = useMemo(() => {
    if (showGrouped) return null;
    return [...filtered].sort((a, b) => {
      const td = TEAM_ORDER.indexOf(a.team) - TEAM_ORDER.indexOf(b.team);
      if (td !== 0) return td;
      return b.count - a.count;
    });
  }, [filtered, showGrouped]);

  const summary = useMemo(() => {
    const s = { total: 0, ready: 0, stocked: 0, four: 0, collecting: 0 };
    if (!players) return s;
    s.total = players.length;
    players.forEach(p => { s[getStatus(p)]++; });
    return s;
  }, [players]);

  const isFiltered = statusFilter !== 'all' || teamFilter !== 'all' || !!search;

  if (players === null) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-500 text-sm">{seeding ? '初期データを準備中…' : '読み込み中…'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-stone-900 tracking-tight leading-tight">
                極管理 <span className="text-stone-400 font-normal">/ プロスピA</span>
              </h1>
              <p className="text-[11px] text-stone-500 mt-0.5">Aランク収集管理 · 全 {summary.total} 選手</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setShowAdd(true)}
                      className="h-9 px-3 rounded bg-stone-900 text-white text-sm font-semibold flex items-center gap-1 hover:bg-stone-800">
                <Plus size={16} /> 追加
              </button>
              <button onClick={() => setShowMenu(true)}
                      className="w-9 h-9 rounded border border-stone-300 bg-white flex items-center justify-center text-stone-500 hover:text-stone-700"
                      aria-label="メニュー">
                <MoreH size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            <SummaryCard label="極待機"   value={summary.ready}      status="ready"      active={statusFilter === 'ready'}      onClick={() => setStatusFilter(statusFilter === 'ready' ? 'all' : 'ready')} />
            <SummaryCard label="5体以上"  value={summary.stocked}    status="stocked"    active={statusFilter === 'stocked'}    onClick={() => setStatusFilter(statusFilter === 'stocked' ? 'all' : 'stocked')} />
            <SummaryCard label="4体"      value={summary.four}       status="four"       active={statusFilter === 'four'}       onClick={() => setStatusFilter(statusFilter === 'four' ? 'all' : 'four')} />
            <SummaryCard label="収集中"   value={summary.collecting} status="collecting" active={statusFilter === 'collecting'} onClick={() => setStatusFilter(statusFilter === 'collecting' ? 'all' : 'collecting')} />
          </div>

          <div className="mt-3 flex gap-2">
            <div className="flex-1 relative">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                     placeholder="選手名で検索"
                     className="w-full h-10 pl-9 pr-9 border border-stone-300 rounded bg-white text-sm focus:outline-none focus:border-stone-900" />
              {search && (
                <button onClick={() => setSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                        aria-label="検索をクリア">
                  <XIcon size={16} />
                </button>
              )}
            </div>
            <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}
                    className="h-10 px-2 border border-stone-300 rounded bg-white text-sm font-semibold text-stone-700">
              <option value="all">全球団</option>
              {TEAMS.map(t => (
                <option key={t.code} value={t.code}>{t.code} {t.name}</option>
              ))}
            </select>
          </div>

          {isFiltered && (
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span className="text-xs text-stone-500">
                絞り込み中 · <span className="font-mono font-bold tabular-nums text-stone-800">{filtered.length}</span> 件
              </span>
              <button onClick={() => { setSearch(''); setStatusFilter('all'); setTeamFilter('all'); }}
                      className="h-8 px-3 rounded-full bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform">
                <XIcon size={14} strokeWidth={2.5} />
                絞り込みをクリア
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto" style={{ paddingBottom: 'max(5rem, env(safe-area-inset-bottom))' }}>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-stone-400 text-sm">該当する選手がいません</div>
        )}

        {showGrouped ? (
          TEAM_ORDER.filter(code => grouped[code]).map(code => {
            const team = getTeam(code);
            const list = grouped[code];
            const readyCount = list.filter(p => getStatus(p) === 'ready').length;
            const isCollapsed = collapsedTeams[code];
            return (
              <section key={code} className="bg-white border-b border-stone-200">
                <button onClick={() => setCollapsedTeams(prev => ({ ...prev, [code]: !prev[code] }))}
                        className="w-full px-4 py-2.5 flex items-center gap-3 bg-stone-100/80 border-b border-stone-200 hover:bg-stone-200/60">
                  <TeamBadge code={code} size={28} />
                  <div className="flex-1 text-left">
                    <div className="font-bold text-sm text-stone-900">{team.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {readyCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: '#FBF0CE', color: '#7A5C00', border: '1px solid #E5BF5A' }}>
                        極待機 {readyCount}
                      </span>
                    )}
                    <span className="text-xs text-stone-500 font-mono tabular-nums">{list.length}</span>
                    {isCollapsed ? <ChevronDown size={16} className="text-stone-400" /> : <ChevronUp size={16} className="text-stone-400" />}
                  </div>
                </button>
                {!isCollapsed && (
                  <div className="divide-y divide-stone-100">
                    {list.map(p => (
                      <PlayerRow key={p.id} player={p}
                                 onUpdate={u => updatePlayer(p.id, u)}
                                 onDelete={() => deletePlayer(p.id)}
                                 onEdit={() => setEditTarget(p)} />
                    ))}
                  </div>
                )}
              </section>
            );
          })
        ) : (
          <section className="bg-white divide-y divide-stone-100 border-b border-stone-200">
            {flatList.map(p => (
              <PlayerRow key={p.id} player={p}
                         onUpdate={u => updatePlayer(p.id, u)}
                         onDelete={() => deletePlayer(p.id)}
                         onEdit={() => setEditTarget(p)} />
            ))}
          </section>
        )}
      </main>

      <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden"
             onChange={(e) => {
               const f = e.target.files?.[0];
               if (f) handleImportFile(f);
               e.target.value = '';
             }} />

      {showAdd && <PlayerForm mode="add" onSubmit={addPlayer} onClose={() => setShowAdd(false)} />}
      {editTarget && (
        <PlayerForm mode="edit" initialData={editTarget}
                    onSubmit={(data) => updatePlayer(editTarget.id, data)}
                    onClose={() => setEditTarget(null)} />
      )}
      {showMenu && (
        <Menu user={user}
              onExport={exportData}
              onImport={triggerImport}
              onReset={() => setShowResetConfirm(true)}
              onSignOut={() => signOut(auth)}
              onClose={() => setShowMenu(false)} />
      )}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowResetConfirm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-stone-900 mb-2">初期データにリセット</h3>
            <p className="text-sm text-stone-600 mb-4">クラウド上のデータをすべて上書きします。全端末に反映され、元に戻せません。</p>
            <div className="flex gap-2">
              <button onClick={() => setShowResetConfirm(false)}
                      className="flex-1 h-10 border border-stone-300 rounded font-semibold text-sm text-stone-700">キャンセル</button>
              <button onClick={resetToInitial}
                      className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white rounded font-semibold text-sm">リセット</button>
            </div>
          </div>
        </div>
      )}
      {importPending && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setImportPending(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-stone-900 mb-2">データをインポート</h3>
            <p className="text-sm text-stone-600 mb-4">
              <span className="font-mono font-bold text-stone-900">{importPending.length}</span> 人分のデータを読み込みます。クラウド上の現在のデータは上書きされます。
            </p>
            <div className="flex gap-2">
              <button onClick={() => setImportPending(null)}
                      className="flex-1 h-10 border border-stone-300 rounded font-semibold text-sm text-stone-700">キャンセル</button>
              <button onClick={applyImport}
                      className="flex-1 h-10 bg-stone-900 hover:bg-stone-800 text-white rounded font-semibold text-sm">インポート</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- ルート ---- */
function App() {
  if (CONFIG_PLACEHOLDER) return <SetupScreen />;
  const [user, setUser] = useState(undefined);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    getRedirectResult(auth).catch(() => {});
    return unsub;
  }, []);
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-500 text-sm">読み込み中…</div>
      </div>
    );
  }
  if (user === null) return <SignInScreen />;
  return <TrackerApp user={user} />;
}

createRoot(document.getElementById('root')).render(<App />);
