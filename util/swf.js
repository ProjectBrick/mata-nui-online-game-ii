'use strict';

function subview(data, start, size = null) {
	size = size === null ? data.length - start : size;
	const r = data.subarray(start, start + size);
	if (r.length < size) {
		throw new Error(`Buffer is too small: ${r.length} < ${size}`);
	}
	return r;
}
exports.subview = subview;

function bitCountU(i) {
	let n = 0;
	for (; i; i >>= 1) {
		n++;
	}
	return n;
}
exports.bitCountU = bitCountU;

function bitCountS(i) {
	return bitCountU(i < 0 ? i ^ -1 : i) + 1;
}
exports.bitCountS = bitCountS;

function bitReader(data, start) {
	return (c, b, s = false) => {
		let r = 0;
		for (let i = 0; i < c; i++) {
			const bI = b + i;
			const bitI = bI % 8;
			const byteI = (bI - bitI) / 8;
			const v = (data.readUInt8(start + byteI) >> (7 - bitI)) & 1;
			r = (r << 1) | v;
		}
		r >>= 0;
		if (s && c && (r >> (c - 1)) & 1) {
			r |= -1 << c;
		}
		return r;
	};
}
exports.bitReader = bitReader;

function bitWriter(data, start) {
	return (v, c, b) => {
		for (let i = 0; i < c; i++) {
			const bI = b + i;
			const bitI = bI % 8;
			const byteI = (bI - bitI) / 8;
			let byteV = data.readUInt8(start + byteI);
			const flag = 1 << (7 - bitI);
			if ((v >> ((c - 1) - i)) & 1) {
				byteV |= flag;
			}
			else {
				byteV &= ~flag;
			}
			data.writeUInt8(byteV, start + byteI);
		}
	};
}
exports.bitWriter = bitWriter;

function bitCountToBytes(count) {
	const over = count % 8;
	return ((count - over) / 8) + (over ? 1 : 0);
}
exports.bitCountToBytes = bitCountToBytes;

function bufferReadCstr(buffer, offset) {
	const chars = [];
	for (;;) {
		const c = buffer.readUInt8(offset++);
		if (!c) {
			break;
		}
		chars.push(c);
	}
	return String.fromCharCode(...chars);
}
exports.bufferReadCstr = bufferReadCstr;

function bufferWriteCstr(buffer, str, offset) {
	const l = str.length;
	const d = buffer.subarray(offset, offset + l + 1);
	d.write(str, 'ascii');
	d.writeUInt8(0, l);
	return d;
}
exports.bufferWriteCstr = bufferWriteCstr;

class Data extends Object {
	constructor() {
		super();
	}

	decoder(data) {
		throw new Error('Override in child class');
	}

	decode(data, offset = 0) {
		return this.decoder(data.subarray(offset));
	}

	encoder(data) {
		throw new Error('Override in child class');
	}

	encode(data = null, offset = 0) {
		const {size} = this;
		data = data ? subview(data, offset, size) : Buffer.alloc(size);
		this.encoder(data);
		return data;
	}
}
exports.Data = Data;

class Fixed8 extends Data {
	constructor() {
		super();

		this.numerator = 0;
		this.denominator = 0;
	}

	get size() {
		return 2;
	}

	decoder(data) {
		this.denominator = data.readUInt8(0);
		this.numerator = data.readUInt8(1);
		return 2;
	}

	encoder(data) {
		data.writeUInt8(this.denominator, 0);
		data.writeUInt8(this.numerator, 1);
	}
}
exports.Fixed8 = Fixed8;

class RGBA extends Data {
	constructor() {
		super();

		this.r = 0;
		this.g = 0;
		this.b = 0;
		this.a = 0;
	}

	get size() {
		return 4;
	}

	decoder(data) {
		const r = data.readUInt8(0);
		const g = data.readUInt8(1);
		const b = data.readUInt8(2);
		const a = data.readUInt8(3);
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
		return 4;
	}

	encoder(data) {
		data.writeUInt8(this.r, 0);
		data.writeUInt8(this.g, 1);
		data.writeUInt8(this.b, 2);
		data.writeUInt8(this.a, 3);
	}
}
exports.Fixed8 = Fixed8;

class Rect extends Data {
	constructor() {
		super();

		this.xMin = 0;
		this.xMax = 0;
		this.yMin = 0;
		this.yMax = 0;
		this.forceNBits = 0;
	}

	get nBits() {
		return Math.max(this.forceNBits, Math.max(
			bitCountS(this.xMin),
			bitCountS(this.xMax),
			bitCountS(this.yMin),
			bitCountS(this.yMax)
		));
	}

	get size() {
		return bitCountToBytes(5 + (this.nBits * 4));
	}

	decoder(data) {
		const bR = bitReader(data, 0);
		let b = 0;
		const nBits = bR(5, b);
		b += 5;
		const values = [];
		for (let i = 0; i < 4; i++) {
			values.push(bR(nBits, b, true));
			b += nBits;
		}
		this.forceNBits = nBits;
		[this.xMin, this.xMax, this.yMin, this.yMax] = values;
		return bitCountToBytes(b);
	}

	encoder(data) {
		const {nBits} = this;
		const bW = bitWriter(data, 0);
		let b = 0;
		bW(nBits, 5, b);
		b += 5;
		for (const value of [this.xMin, this.xMax, this.yMin, this.yMax]) {
			bW(value, nBits, b);
			b += nBits;
		}
		const over = b % 8;
		if (over) {
			bW(0, 8 - over, b);
		}
	}
}
exports.Rect = Rect;

class Tag extends Data {
	constructor() {
		super();

		this.code = 0;
		this.data = Buffer.alloc(0);
		this.forceLong = false;
	}

	get long() {
		return this.forceLong || this.data.length >= 0b111111;
	}

	get size() {
		return 2 + (this.long ? 4 : 0) + this.data.length;
	}

	decoder(data) {
		let i = 0;
		const head = data.readUInt16LE(i);
		const code = head >> 6;
		let len = head & 0b111111;
		i += 2;
		let forceLong = false;
		if (len === 0b111111) {
			len = data.readUInt32LE(i);
			i += 4;
			forceLong = len < 0b111111;
		}
		const d = data.slice(i, i + len);
		this.code = code;
		this.data = d;
		this.forceLong = forceLong;
		return i + len;
	}

	encoder(data) {
		let i = 0;
		const {code, data: d, long} = this;
		const head = (code << 6) | (long ? 0b111111 : d.length);
		data.writeUInt16LE(head, i);
		i += 2;
		if (long) {
			data.writeUInt32LE(d.length, i);
			i += 4;
		}
		d.copy(data, i);
	}
}
exports.Tag = Tag;

class DefineEditText extends Data {
	static CODE = 37;

	constructor() {
		super();

		this.characterId = 0;
		this.bounds = new Rect();
		this.hasText = false;
		this.wordWrap = false;
		this.multiline = false;
		this.password = false;
		this.readOnly = false;
		this.hasTextColor = false;
		this.hasMaxLength = false;
		this.hasFont = false;
		this.hasFontClass = false;
		this.autoSize = false;
		this.hasLayout = false;
		this.noSelect = false;
		this.border = false;
		this.wasStatic = false;
		this.html = false;
		this.useOutlines = false;
		this.fontId = 0;
		this.fontHeight = 0;
		this.textColor = new RGBA();
		this.align = 0;
		this.leftMargin = 0;
		this.rightMargin = 0;
		this.indent = 0;
		this.leading = 0;
		this.variableName = '';
		this.initialText = '';
	}

	get size() {
		return (
			2 + this.bounds.size +
			1 + 1 + 2 + 2 +
			this.textColor.size +
			1 + 2 + 2 + 2 + 2 +
			this.variableName.length + 1 +
			(this.hasText ? this.initialText.length + 1 : 0)
		);
	}

	decoder(data) {
		let i = 0;
		const characterId = data.readUInt16LE(i);
		i += 2;

		const bounds = new Rect();
		i += bounds.decode(data, i);

		const flagsA = data.readUInt8(i++);
		const hasText = !!((flagsA >> 7) & 1);
		const wordWrap = !!((flagsA >> 6) & 1);
		const multiline = !!((flagsA >> 5) & 1);
		const password = !!((flagsA >> 4) & 1);
		const readOnly = !!((flagsA >> 3) & 1);
		const hasTextColor = !!((flagsA >> 2) & 1);
		const hasMaxLength = !!((flagsA >> 1) & 1);
		const hasFont = !!(flagsA & 1);

		const flagsB = data.readUInt8(i++);
		const hasFontClass = !!((flagsB >> 7) & 1);
		const autoSize = !!((flagsB >> 6) & 1);
		const hasLayout = !!((flagsB >> 5) & 1);
		const noSelect = !!((flagsB >> 4) & 1);
		const border = !!((flagsB >> 3) & 1);
		const wasStatic = !!((flagsB >> 2) & 1);
		const html = !!((flagsB >> 1) & 1);
		const useOutlines = !!(flagsB & 1);

		const fontId = data.readUInt16LE(i);
		i += 2;

		const fontHeight = data.readUInt16LE(i);
		i += 2;

		const textColor = new RGBA();
		i += textColor.decode(data, i);

		const align = data.readUInt8(i++);

		const leftMargin = data.readUInt16LE(i);
		i += 2;

		const rightMargin = data.readUInt16LE(i);
		i += 2;

		const indent = data.readUInt16LE(i);
		i += 2;

		const leading = data.readInt16LE(i);
		i += 2;

		const variableName = bufferReadCstr(data, i);
		i += variableName.length + 1;

		const initialText = hasText ? bufferReadCstr(data, i) : '';
		if (hasText) {
			i += initialText.length + 1;
		}

		this.characterId = characterId;
		this.bounds = bounds;
		this.hasText = hasText;
		this.wordWrap = wordWrap;
		this.multiline = multiline;
		this.password = password;
		this.readOnly = readOnly;
		this.hasTextColor = hasTextColor;
		this.hasMaxLength = hasMaxLength;
		this.hasFont = hasFont;
		this.hasFontClass = hasFontClass;
		this.autoSize = autoSize;
		this.hasLayout = hasLayout;
		this.noSelect = noSelect;
		this.border = border;
		this.wasStatic = wasStatic;
		this.html = html;
		this.useOutlines = useOutlines;
		this.fontId = fontId;
		this.fontHeight = fontHeight;
		this.textColor = textColor;
		this.align = align;
		this.leftMargin = leftMargin;
		this.rightMargin = rightMargin;
		this.indent = indent;
		this.leading = leading;
		this.variableName = variableName;
		this.initialText = initialText;
		return i;
	}

	encoder(data) {
		let i = 0;
		data.writeUInt16LE(this.characterId, i);
		i += 2;

		i += this.bounds.encode(data, i).length;

		const flagsA =
			((this.hasText ? 1 : 0) << 7) |
			((this.wordWrap ? 1 : 0) << 6) |
			((this.multiline ? 1 : 0) << 5) |
			((this.password ? 1 : 0) << 4) |
			((this.readOnly ? 1 : 0) << 3) |
			((this.hasTextColor ? 1 : 0) << 2) |
			((this.hasMaxLength ? 1 : 0) << 1) |
			(this.hasFont ? 1 : 0);
		data.writeUInt8(flagsA, i++);

		const flagsB =
			((this.hasFontClass ? 1 : 0) << 7) |
			((this.autoSize ? 1 : 0) << 6) |
			((this.hasLayout ? 1 : 0) << 5) |
			((this.noSelect ? 1 : 0) << 4) |
			((this.border ? 1 : 0) << 3) |
			((this.wasStatic ? 1 : 0) << 2) |
			((this.html ? 1 : 0) << 1) |
			(this.useOutlines ? 1 : 0);
		data.writeUInt8(flagsB, i++);

		data.writeUInt16LE(this.fontId, i);
		i += 2;

		data.writeUInt16LE(this.fontHeight, i);
		i += 2;

		i += this.textColor.encode(data, i).length;

		data.writeUInt8(this.align, i++);

		data.writeUInt16LE(this.leftMargin, i);
		i += 2;

		data.writeUInt16LE(this.rightMargin, i);
		i += 2;

		data.writeUInt16LE(this.indent, i);
		i += 2;

		data.writeInt16LE(this.leading, i);
		i += 2;

		i += bufferWriteCstr(data, this.variableName, i).length;

		if (this.hasText) {
			i += bufferWriteCstr(data, this.initialText, i).length;
		}
	}
}
exports.DefineEditText = DefineEditText;

class Swf extends Data {
	constructor() {
		super();

		this.version = 0;
		this.frameSize = new Rect();
		this.frameRate = new Fixed8();
		this.frameCount = 0;
		this.tags = [];
	}

	get size() {
		return this.tags.reduce(
			(v, t) => t.size + v,
			3 + 1 + 4 + this.frameSize.size + this.frameRate.size + 2
		);
	}

	decoder(data) {
		let i = 0;
		const sig = data.toString('ascii', i, 3);
		i += 3;
		if (sig !== 'FWS') {
			throw new Error(
				`Unexpected SWF signature: ${JSON.stringify(sig)}`
			);
		}

		const version = data.readUInt8(i++);

		const size = data.readUInt32LE(i);
		i += 4;
		if (size > data.length) {
			throw new Error(`Unexpected SWF size: ${size} > ${data.length}`);
		}
		data = data.subarray(0, size);

		const rect = new Rect();
		i += rect.decode(data, i);

		const frameRate = new Fixed8();
		i += frameRate.decode(data, i);

		const frameCount = data.readUInt16LE(i);
		i += 2;

		const tags = [];
		while (i < size) {
			const tag = new Tag();
			i += tag.decode(data, i);
			tags.push(tag);
		}

		this.version = version;
		this.frameSize = rect;
		this.frameRate = frameRate;
		this.frameCount = frameCount;
		this.tags = tags;

		return size;
	}

	encoder(data) {
		let i = 0;
		const sig = data.write('FWS', i, 'ascii');
		i += 3;

		data.writeUInt8(this.version, i++);

		data.writeUInt32LE(this.size, i);
		i += 4;

		i += this.frameSize.encode(data, i).length;

		i += this.frameRate.encode(data, i).length;

		data.writeUInt16LE(this.frameCount, i);
		i += 2;

		for (const tag of this.tags) {
			i += tag.encode(data, i).length;
		}
	}
}
exports.Swf = Swf;
