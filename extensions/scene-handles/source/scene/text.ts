/**
 * Pure text helpers of the label renderer (tested in tests/text.test.ts).
 */

export function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const TAG = /<(\/?)(b|i|color|size)(?:=([^<>]*))?>/g;

interface Token {
    start: number;
    end: number;
    close: boolean;
    name: string;
    value: string;
    open?: string;
    valid: boolean;
}

function colorValue(v: string): string | null {
    const s = v.trim().replace(/^["']|["']$/g, '');
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s)) return s;
    if (/^[a-zA-Z]{3,20}$/.test(s)) return s.toLowerCase();
    return null;
}

function sizeValue(v: string): number | null {
    const n = Number(v.trim());
    return isFinite(n) && n >= 1 && n <= 200 ? n : null;
}

/**
 * Unity's rich text (<b>, <i>, <color=#rrggbb|name>, <size=n>) to HTML.
 * Only well-formed, properly nested tags count; anything else stays as text.
 * All text is escaped, so a label can never inject markup.
 */
export function richTextToHtml(text: string, rich: boolean): string {
    if (!rich || text.indexOf('<') < 0) return escapeHtml(text);
    const tokens: Token[] = [];
    TAG.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = TAG.exec(text))) {
        tokens.push({ start: m.index, end: m.index + m[0].length, close: m[1] === '/', name: m[2], value: m[3] === undefined ? '' : m[3], valid: false });
    }
    // pair opening and closing tags with a stack
    const stack: Token[] = [];
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (!t.close) {
            const needsValue = t.name === 'color' || t.name === 'size';
            const ok = needsValue ? (t.name === 'color' ? colorValue(t.value) !== null : sizeValue(t.value) !== null) : t.value === '';
            if (ok) stack.push(t);
            continue;
        }
        if (t.value !== '') continue;
        const top = stack[stack.length - 1];
        if (top && top.name === t.name) {
            stack.pop();
            top.valid = true;
            t.valid = true;
        }
    }
    let out = '';
    let pos = 0;
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (!t.valid) continue;
        out += escapeHtml(text.slice(pos, t.start));
        pos = t.end;
        if (t.close) {
            out += t.name === 'b' ? '</b>' : t.name === 'i' ? '</i>' : '</span>';
        } else if (t.name === 'b') {
            out += '<b>';
        } else if (t.name === 'i') {
            out += '<i>';
        } else if (t.name === 'color') {
            out += '<span style="color:' + colorValue(t.value) + '">';
        } else {
            out += '<span style="font-size:' + sizeValue(t.value) + 'px">';
        }
    }
    return out + escapeHtml(text.slice(pos));
}

/** A cc.Color-like object or a CSS string as a CSS color; `fallback` for anything else. */
export function cssColor(c: any, fallback: string): string {
    if (typeof c === 'string') return c;
    if (c && typeof c.r === 'number') {
        const a = typeof c.a === 'number' ? c.a / 255 : 1;
        return 'rgba(' + Math.round(c.r) + ',' + Math.round(c.g) + ',' + Math.round(c.b) + ',' + (Math.round(a * 1000) / 1000) + ')';
    }
    return fallback;
}

/** CSS translate (percent of the label's size) that puts the anchor corner on the point. */
export function anchorShift(anchor: number | undefined): { x: number; y: number } {
    const a = typeof anchor === 'number' && anchor >= 0 && anchor <= 8 ? Math.floor(anchor) : 0;
    const col = a % 3;
    const row = Math.floor(a / 3);
    return { x: col === 0 ? 0 : col === 1 ? -50 : -100, y: row === 0 ? 0 : row === 1 ? -50 : -100 };
}
