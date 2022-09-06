import {
	Swf,
	Tag,
	DefineEditText
} from './swf.mjs';
import {
	bufferToHex,
	bufferFromHex
} from './buffer.mjs';

const TAG_SHOW_FRAME = 1;
const TAG_SET_BACKGROUND_COLOR = 9;
const TAG_PROTECT = 24;
const TAG_DO_ACTION = 12;

// cutScene = 1;
const codePartialCutscene1 = [
	// push 'cutScene', 1
	'96 0F 00 00 63 75 74 53 63 65 6E 65 00 07 01 00 00 00',
	// setVariable
	'1D'
].join(' ');

// gotoAndPlay(1);
const codeGotoAndPlay1 = [
	// gotoFrame 0
	'81 02 00 00 00',
	// play
	'06',
	// end
	'00'
].join(' ');

// if(_root.holder != undefined)
// {
//     gotoAndStop(4);
// }
// stop();
const codeIfRootHolderGotoAndStop4ElseStop = [
	// push '_root'
	'96 07 00 00 5F 72 6F 6F 74 00',
	// getVariable
	'1C',
	// push 'holder'
	'96 08 00 00 68 6F 6C 64 65 72 00',
	// getMember
	'4E',
	// push UNDEF
	'96 01 00 03',
	// equals
	'49',
	// not
	'12',
	// not
	'12',
	// branchIfTrue +5
	'9D 02 00 05 00',
	// gotoFrame 3
	'81 02 00 03 00',
	// stop
	'07',
	// end
	'00'
].join(' ');

// cutScene = 1;
// if(_root.holder != undefined)
// {
//     gotoAndStop(4);
// }
// stop();
const codeCutscene1IfRootHolderGotoAndStop4ElseStop = [
	codePartialCutscene1,
	codeIfRootHolderGotoAndStop4ElseStop
].join(' ');

// if(_root.holder != undefined)
// {
//     gotoAndPlay(4);
// }
const codeIfRootHolderGotoAndPlay4 = [
	// push '_root'
	'96 07 00 00 5F 72 6F 6F 74 00',
	// getVariable
	'1C',
	// push 'holder'
	'96 08 00 00 68 6F 6C 64 65 72 00',
	// getMember
	'4E',
	// push UNDEF
	'96 01 00 03',
	// equals
	'49',
	// not
	'12',
	// not
	'12',
	// branchIfTrue +6
	'9D 02 00 06 00',
	// gotoFrame 3
	'81 02 00 03 00',
	// play
	'06',
	// end
	'00'
].join(' ');

// if(_root.holder != undefined and _root.holder.__loaded)
// {
//     gotoAndPlay(3);
// }
const codeIfRootHolderLoadedGotoAndPlay3 = [
	// push '_root'
	'96 07 00 00 5F 72 6F 6F 74 00',
	// getVariable
	'1C',
	// push 'holder'
	'96 08 00 00 68 6F 6C 64 65 72 00',
	// getMember
	'4E',
	// push UNDEF
	'96 01 00 03',
	// equals
	'49',
	// not
	'12',
	// push '_root'
	'96 07 00 00 5F 72 6F 6F 74 00',
	// getVariable
	'1C',
	// push 'holder'
	'96 08 00 00 68 6F 6C 64 65 72 00',
	// getMember
	'4E',
	// push '__loaded'
	'96 0A 00 00 5F 5F 6C 6F 61 64 65 64 00',
	// getMember
	'4E',
	// and
	'10',
	// not
	'12',
	// branchIfTrue +6
	'9D 02 00 06 00',
	// gotoFrame 3
	'81 02 00 02 00',
	// play
	'06',
	// end
	'00'
].join(' ');

// cutScene = 1;
// if(_root.holder != undefined and _root.holder.__loaded)
// {
//     gotoAndPlay(3);
// }
const codeCutscene1IfRootHolderLoadedGotoAndPlay3 = [
	codePartialCutscene1,
	codeIfRootHolderLoadedGotoAndPlay3
].join(' ');

// stop();
const codeStop = [
	// stop
	'07',
	// end
	'00'
].join(' ');

function tagsByFrame(swf) {
	const headerTags = new Set([TAG_SET_BACKGROUND_COLOR, TAG_PROTECT]);
	const frames = [];
	let frame = [];
	for (const tag of swf.tags) {
		if (headerTags.has(tag.code)) {
			continue;
		}
		frame.push(tag);
		if (tag.code === TAG_SHOW_FRAME) {
			frames.push(frame);
			frame = [];
		}
	}
	return frames;
}

function getOnlyTag(file, tags, code) {
	let action = null;
	for (const tag of tags) {
		if (tag.code === code) {
			if (action) {
				throw new Error(`Duplicate tag ${code} in: ${file}`);
			}
			action = tag;
		}
	}
	if (!action) {
		throw new Error(`Missing tag ${code} in: ${file}`);
	}
	return action;
}

function fixPlayerFonts(_file, swf) {
	// Set dynamic text fields to use the embedded fonts available.
	// This avoids text issues where the font is not available.
	// Only fix those where font was embedded just not set to use.
	const unchanged = new Set([97, 103, 243, 265]);
	for (const tag of swf.tags) {
		if (tag.code !== DefineEditText.CODE) {
			continue;
		}
		const det = new DefineEditText();
		det.decode(tag.data);
		if (unchanged.has(det.fontId)) {
			continue;
		}
		det.useOutlines = true;
		tag.data = det.encode();
	}
}

function fixNoteRiddleDestinyFrames(file, swf) {
	// This file has a bunch of extra/duplicate frames.
	// They appear to be accidentally added by the authors.
	// To be consistent for the new loading code, remove them.
	const frames = tagsByFrame(swf);

	// Remove extra blank and gotoAndPlay(1); frames.
	const remove = new Set([frames.slice(0, 4), frames.slice(5, 9)].flat(2));
	for (const tag of remove) {
		if (tag.code === TAG_SHOW_FRAME) {
			continue;
		}
		if (
			tag.code === TAG_DO_ACTION &&
			bufferToHex(tag.data) === codeGotoAndPlay1
		) {
			continue;
		}
		throw new Error(`Unexpected tag ${tag.code} in: ${file}`);
	}
	swf.tags = swf.tags.filter(t => !remove.has(t));

	// Need to adjust goto in the first action.
	const [action] = frames[4].filter(t => t.code === TAG_DO_ACTION);

	// Currently goes to frame 12 (11 zero-indexed).
	const gotoTargetOffset = 38;
	const expected = bufferFromHex(codeIfRootHolderGotoAndStop4ElseStop);
	expected.writeUInt16LE(11, gotoTargetOffset);
	if (action.data.compare(expected)) {
		throw new Error(`Unexpected bytecode in: ${file}`);
	}

	// Change it to frame 4 (3 zero-indexed).
	expected.writeUInt16LE(3, gotoTargetOffset);
	action.data = expected;
}

function fixLoadCheck(file, swf) {
	// The gotoAndStop(4)/gotoAndPlay(4) code has a race condition and/or bug.
	// For reasons unclear, it is unsafe to go directly to frame 4.
	// Instead wait until full movie is loaded, then go to frame before.
	// Playing into frame 4 from frame 3 allows everything to setup properly.
	// In the case of gotoAndStop, insert stop action on the frame itself.
	const frames = tagsByFrame(swf);
	const f1 = getOnlyTag(file, frames[0], TAG_DO_ACTION);
	const f2 = getOnlyTag(file, frames[1], TAG_DO_ACTION);
	const f3 = getOnlyTag(file, frames[2], TAG_DO_ACTION);

	// Check which code is being replaced.
	let hasCutscene = null;
	let hasStop = null;
	const match = bufferToHex(f1.data);
	for (const [expected, stop, cutscene] of [
		[codeIfRootHolderGotoAndStop4ElseStop, true, false],
		[codeIfRootHolderGotoAndPlay4, false, false],
		[codeCutscene1IfRootHolderGotoAndStop4ElseStop, true, true]
	]) {
		if (match === expected) {
			hasCutscene = cutscene;
			hasStop = stop;
			break;
		}
	}
	if (hasCutscene === null) {
		throw new Error(`No load check found in: ${file}`);
	}
	if (bufferToHex(f2.data) !== codeGotoAndPlay1) {
		throw new Error(`Unexpected frame 2 actions in: ${file}`);
	}
	if (bufferToHex(f3.data) !== codeGotoAndPlay1) {
		throw new Error(`Unexpected frame 3 actions in: ${file}`);
	}

	// Replace code on frame 1 to go to frame 3 instead.
	f1.data = bufferFromHex(
		hasCutscene ?
			codeCutscene1IfRootHolderLoadedGotoAndPlay3 :
			codeIfRootHolderLoadedGotoAndPlay3
	);

	// Remove code from frame 3 that goes back to frame 1.
	f3.data = Buffer.alloc(1);

	// Maybe add new stop action on frame 4 since not using gotoAndStop.
	if (!hasStop) {
		return;
	}
	const stopBeforeType = new Set([TAG_DO_ACTION, TAG_SHOW_FRAME]);
	const [stopBeforeTag] = frames[3].filter(t => stopBeforeType.has(t.code));
	const stopTag = new Tag();
	stopTag.code = TAG_DO_ACTION;
	stopTag.data = bufferFromHex(codeStop);
	swf.tags.splice(swf.tags.indexOf(stopBeforeTag), 0, stopTag);
}

const mods = [
	[/^Player\.swf$/i, [fixPlayerFonts]],
	[/^(CutScene|Music|Turaga).*\.swf$/i, []],
	[/(Conversation|-Wahi)\.swf$/i, []],
	[/^(MataNuiInterior|Items|MatoranArt|Particles)\.swf$/i, []],
	[/^Matoran\.swf$/i, []],
	[/^GamePoleBalance\.swf$/i, []],
	[/^LostReefDais\.swf$/i, []],
	[/^NoteRiddleDestiny\.swf$/i, [fixNoteRiddleDestinyFrames, fixLoadCheck]],
	[/\.swf$/, [fixLoadCheck]]
];

export function mod(file, data) {
	for (const [reg, funs] of mods) {
		if (reg.test(file)) {
			if (funs.length) {
				const swf = new Swf();
				swf.decode(data);
				for (const f of funs) {
					f(file, swf);
				}
				return swf.encode();
			}
			return data;
		}
	}
	throw new Error(`No mod for: ${file}`);
}
