"use client";

import { useEffect } from "react";
import { create } from "zustand";
import type { Lang, Text } from "./types";

const dict = {
  appTitle: ["Room designer", "ออกแบบห้อง", "房间设计"],
  appBlurb: [
    "Pick a floor plan of your unit and decorate it in 3D with furniture, wall and ceiling items.",
    "เลือกแปลนห้องของคุณ แล้วตกแต่งแบบ 3 มิติด้วยเฟอร์นิเจอร์ ของติดผนัง และติดเพดาน",
    "选择您的户型平面图，用家具、墙面和吊顶物品进行 3D 装饰。",
  ],
  plans: ["Plans", "แปลน", "户型"],
  recent: ["Recent", "ล่าสุด", "最近"],
  saved: ["Saved", "ที่บันทึกไว้", "已保存"],
  open: ["Open", "เปิด", "打开"],
  rename: ["Rename", "เปลี่ยนชื่อ", "重命名"],
  duplicate: ["Duplicate", "ทำซ้ำ", "复制"],
  delete: ["Delete", "ลบ", "删除"],
  cancel: ["Cancel", "ยกเลิก", "取消"],
  save: ["Save", "บันทึก", "保存"],
  close: ["Close", "ปิด", "关闭"],
  reset: ["Reset", "รีเซ็ต", "重置"],
  back: ["Back", "กลับ", "返回"],
  language: ["Language", "ภาษา", "语言"],
  emptyRecent: ["Rooms you edit but don't save appear here.", "ห้องที่แก้ไขแต่ยังไม่บันทึกจะแสดงที่นี่", "编辑但未保存的房间会显示在这里。"],
  emptySaved: ["Save a design to keep it here.", "บันทึกงานออกแบบเพื่อเก็บไว้ที่นี่", "保存设计后会显示在这里。"],
  itemsCount: ["{n} items", "{n} ชิ้น", "{n} 件"],
  unsavedChanges: ["Unsaved changes", "ยังไม่ได้บันทึก", "未保存的更改"],
  untitled: ["Untitled design", "งานออกแบบไม่มีชื่อ", "未命名设计"],
  copyOf: ["{name} (copy)", "{name} (สำเนา)", "{name}（副本）"],
  savedToast: ["Design saved", "บันทึกแล้ว", "设计已保存"],
  nameDesign: ["Name your design", "ตั้งชื่องานออกแบบ", "为设计命名"],
  renameDesign: ["Rename design", "เปลี่ยนชื่องานออกแบบ", "重命名设计"],
  deleteDesignQ: ["Delete “{name}”?", "ลบ “{name}” ใช่ไหม", "删除“{name}”？"],
  deleteDesignBody: ["This can't be undone.", "การลบนี้ย้อนกลับไม่ได้", "此操作无法撤销。"],
  discard: ["Discard", "ทิ้ง", "放弃"],
  catalog: ["Catalog", "แคตตาล็อก", "目录"],
  search: ["Search items…", "ค้นหาสินค้า…", "搜索物品…"],
  recentlyUsed: ["Recently used", "ใช้ล่าสุด", "最近使用"],
  noResults: ["No items match.", "ไม่พบสินค้า", "没有匹配的物品。"],
  noRecentItems: ["Items you add appear here.", "สินค้าที่เพิ่มจะแสดงที่นี่", "添加过的物品会显示在这里。"],
  rotation: ["Rotation", "หมุน", "旋转"],
  nudge: ["Move", "เลื่อน", "移动"],
  step: ["Step", "ระยะ", "步长"],
  colour: ["Colour", "สี", "颜色"],
  lock: ["Lock", "ล็อก", "锁定"],
  unlock: ["Unlock", "ปลดล็อก", "解锁"],
  locked: ["Locked", "ล็อกอยู่", "已锁定"],
  moveLeft: ["Move left", "เลื่อนซ้าย", "左移"],
  moveRight: ["Move right", "เลื่อนขวา", "右移"],
  moveAway: ["Move away", "เลื่อนออกห่าง", "向远处移动"],
  moveCloser: ["Move closer", "เลื่อนเข้าใกล้", "向近处移动"],
  raise: ["Raise", "ยกขึ้น", "升高"],
  lower: ["Lower", "ลดลง", "降低"],
  turnLeft: ["Turn left 45°", "หมุนซ้าย 45°", "左转 45°"],
  turnRight: ["Turn right 45°", "หมุนขวา 45°", "右转 45°"],
  noSpace: ["No free space for this item", "ไม่มีที่ว่างสำหรับสินค้านี้", "没有空间放置此物品"],
  blockedBy: ["Blocked by {what}", "ติด{what}", "被{what}挡住"],
  aWall: ["a wall", "ผนัง", "墙"],
  aFixture: ["a built-in fixture", "ของติดตั้งในห้อง", "固定设施"],
  rotateBlocked: ["Can't turn — something is in the way", "หมุนไม่ได้ มีของขวางอยู่", "无法旋转——有东西挡住"],
  moveBlocked: ["Can't move — something is in the way", "เลื่อนไม่ได้ มีของขวางอยู่", "无法移动——有东西挡住"],
  lockedToast: ["This item is locked", "สินค้านี้ถูกล็อก", "此物品已锁定"],
  room: ["Room", "ห้อง", "房间"],
  floor: ["Floor", "พื้น", "地板"],
  walls: ["Walls", "ผนัง", "墙面"],
  roomSize: ["Room size", "ขนาดห้อง", "房间尺寸"],
  width: ["Width", "กว้าง", "宽"],
  depth: ["Depth", "ลึก", "深"],
  ceilingHeight: ["Ceiling height", "ความสูงเพดาน", "层高"],
  resetQ: ["Reset this design?", "รีเซ็ตงานออกแบบนี้ใช่ไหม", "重置此设计？"],
  resetBody: [
    "All items are removed and the floor, walls, size and ceiling go back to the plan's defaults. You can undo it.",
    "สินค้าทั้งหมดจะถูกลบ และพื้น ผนัง ขนาด เพดานจะกลับเป็นค่าเริ่มต้น สามารถเลิกทำได้",
    "将移除所有物品，地板、墙面、尺寸和层高恢复为户型默认值。可以撤销。",
  ],
  shrinkBlocked: ["Furniture would no longer fit", "เฟอร์นิเจอร์จะไม่พอดีกับห้อง", "家具将放不下"],
  ceilingBlocked: ["Something is too tall for that ceiling", "มีของที่สูงเกินเพดานนั้น", "有物品高于该层高"],
  top: ["Top", "มุมบน", "俯视"],
  view3d: ["3D", "3D", "3D"],
  more: ["More", "เพิ่มเติม", "更多"],
  size: ["Size", "ขนาด", "尺寸"],
  lights: ["Lights", "ไฟ", "灯光"],
  share: ["Share", "แชร์", "分享"],
  items: ["Items", "รายการ", "物品"],
  itemSize: ["Item size", "ขนาดสินค้า", "物品尺寸"],
  distances: ["Distance to nearby things", "ระยะห่างจากสิ่งรอบข้าง", "与周围物体的距离"],
  roomSizeLines: ["Room size", "ขนาดห้อง", "房间尺寸"],
  measurements: ["Measurements", "การวัดขนาด", "尺寸标注"],
  allRooms: ["All rooms", "ทุกห้อง", "全部房间"],
  onlyThisRoom: ["Only this room", "เฉพาะห้องนี้", "仅此房间"],
  showOthers: ["Show others", "แสดงห้องอื่น", "显示其他"],
  prevRoom: ["Previous room", "ห้องก่อนหน้า", "上一个房间"],
  nextRoom: ["Next room", "ห้องถัดไป", "下一个房间"],
  select: ["Select", "เลือกหลายชิ้น", "多选"],
  selectedN: ["{n} selected", "เลือก {n} ชิ้น", "已选 {n} 件"],
  groupHint: ["Tap items to add or remove them. Drag any of them to move the group.", "แตะสินค้าเพื่อเพิ่มหรือเอาออก ลากชิ้นใดก็ได้เพื่อย้ายทั้งกลุ่ม", "点按物品以添加或移除，拖动任意一件即可移动整组。"],
  groupSkip: ["Wall items and items standing on others can't join a group", "ของติดผนังและของที่วางบนของอื่นเข้ากลุ่มไม่ได้", "墙面物品和放在其他物品上的物品不能加入组"],
  fullView: ["Full view", "เต็มจอ", "全屏视图"],
  exitFullView: ["Show toolbars", "แสดงแถบเครื่องมือ", "显示工具栏"],
  sharePicture: ["Share picture", "แชร์รูปภาพ", "分享图片"],
  shareCurrent: ["Current view", "มุมมองปัจจุบัน", "当前视图"],
  shareTop: ["Top view", "มุมมองด้านบน", "俯视图"],
  shareTitle: ["Share a picture", "แชร์รูปภาพ", "分享图片"],
  pictureSaved: ["Picture downloaded", "ดาวน์โหลดรูปแล้ว", "图片已下载"],
  placedItems: ["Placed items", "สินค้าที่วางแล้ว", "已放置物品"],
  noItems: ["No items yet — add some from the catalog.", "ยังไม่มีสินค้า เพิ่มจากแคตตาล็อกได้เลย", "还没有物品——从目录中添加吧。"],
  undo: ["Undo", "เลิกทำ", "撤销"],
  redo: ["Redo", "ทำซ้ำ", "重做"],
  loading: ["Loading 3D room…", "กำลังโหลดห้อง 3 มิติ…", "正在加载 3D 房间…"],
  planNotFound: ["We couldn't find that plan.", "ไม่พบแปลนนี้", "找不到该户型。"],
  area: ["{n} m²", "{n} ตร.ม.", "{n} m²"],
  resizable: ["Resizable · {w} × {d} m", "ปรับขนาดได้ · {w} × {d} ม.", "可调尺寸 · {w} × {d} 米"],
  unknownItem: ["Unknown item", "สินค้าที่ไม่รู้จัก", "未知物品"],
  keysHint: [
    "Arrows move · R / Shift+R turn · D duplicate · L lock · Del delete · Esc close",
    "ลูกศรเลื่อน · R / Shift+R หมุน · D ทำซ้ำ · L ล็อก · Del ลบ · Esc ปิด",
    "方向键移动 · R / Shift+R 旋转 · D 复制 · L 锁定 · Del 删除 · Esc 关闭",
  ],
  dragHint: ["Drag the item to move it", "ลากเพื่อย้ายสินค้า", "拖动物品即可移动"],
  dropHint: ["Drag onto the room or tap to add", "ลากลงในห้อง หรือแตะเพื่อเพิ่ม", "拖入房间或点按添加"],
  roomSettings: ["Room settings", "ตั้งค่าห้อง", "房间设置"],
  mat_wood: ["Wood", "ไม้", "木地板"],
  mat_tile: ["Tile", "กระเบื้อง", "瓷砖"],
  mat_marble: ["Marble", "หินอ่อน", "大理石"],
  mat_concrete: ["Concrete", "ปูนเปลือย", "水泥"],
  mat_carpet: ["Carpet", "พรม", "地毯"],
  mat_paint: ["Paint", "สีทา", "涂料"],
  mat_stripes: ["Stripes", "ลายทาง", "条纹"],
  mat_brick: ["Brick", "อิฐ", "砖墙"],
  mat_panel: ["Wood panel", "แผ่นไม้", "木饰面"],
  mat_subway: ["Subway tile", "กระเบื้องซับเวย์", "地铁砖"],
  material: ["Material", "วัสดุ", "材质"],
  fixedFinishes: ["Bathrooms keep bathroom tiles and balconies keep a concrete floor.", "ห้องน้ำใช้กระเบื้องห้องน้ำ และระเบียงใช้พื้นปูนเสมอ", "浴室保持浴室瓷砖，阳台保持水泥地面。"],
  zoom: ["Zoom", "ซูม", "缩放"],
  emptyRoom: ["Empty room", "ห้องเปล่า", "空房间"],
  quickMenu: ["Item actions", "การทำงานของสินค้า", "物品操作"],
  designName: ["Design name", "ชื่องานออกแบบ", "设计名称"],
  home: ["Home", "หน้าแรก", "首页"],
  startDesigning: ["Start designing", "เริ่มออกแบบ", "开始设计"],
} satisfies Record<string, [string, string, string]>;

export type TKey = keyof typeof dict;

const LANG_KEY = "roomDesigner:lang:v1";
const langs: Lang[] = ["en", "th", "zh"];

export const langLabels: Record<Lang, string> = { en: "English", th: "ไทย", zh: "中文" };

interface LangState {
  lang: Lang;
  setLang(lang: Lang): void;
}

export const useLangStore = create<LangState>()((set) => ({
  lang: "en",
  setLang(lang) {
    set({ lang });
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {}
    document.documentElement.lang = lang;
  },
}));

/** Restore the saved language after hydration (the server always renders English). */
export function useRestoreLang() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY) as Lang | null;
      if (saved && langs.includes(saved)) useLangStore.getState().setLang(saved);
    } catch {}
  }, []);
}

export function translate(lang: Lang, key: TKey, vars?: Record<string, string | number>): string {
  const idx = langs.indexOf(lang);
  let s: string = dict[key][idx] ?? dict[key][0];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

export function useT() {
  const lang = useLangStore((s) => s.lang);
  return (key: TKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
}

export function useLang() {
  return useLangStore((s) => s.lang);
}

export function tx(text: Text | undefined, lang: Lang): string {
  return text ? text[lang] || text.en : "";
}
