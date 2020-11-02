var self = this;
var truthy = function(v) {
	return typeof(v) === "string" ? !!v.length : !!v;
};
var forEach = function(a, f) {
	for (var i = 0, l = a.length; i < l; i++) {
		f(a[i], i);
	}
};
var colorRGB = function(c) {
	return c & 0xFFFFFF;
};
var colorA = function(c) {
	return ((c >>> 24) / 0xFF) * 100;
};
var drawRectangle = function(mc, x, y, w, h, r, fC, sC, sW) {
	mc.lineStyle(sW, colorRGB(sC), colorA(sC));
	mc.beginFill(colorRGB(fC), colorA(fC));
	if (r) {
		mc.moveTo(x + r, y);
		mc.lineTo(x + w - r, y);
		mc.curveTo(x + w, y, x + w, y + r);
		mc.lineTo(x + w, y + r);
		mc.lineTo(x + w, y + h - r);
		mc.curveTo(x + w, y + h, x + w - r, y + h);
		mc.lineTo(x + w - r, y + h);
		mc.lineTo(x + r, y + h);
		mc.curveTo(x, y + h, x, y + h - r);
		mc.lineTo(x, y + h - r);
		mc.lineTo(x, y + r);
		mc.curveTo(x, y, x + r, y);
		mc.lineTo(x + r, y);
	}
	else {
		mc.moveTo(x, y);
		mc.lineTo(x + w, y);
		mc.lineTo(x + w, y + h);
		mc.lineTo(x, y + h);
		mc.lineTo(x, y);
	}
	mc.endFill();
};
var newTextField = function(mc, name, level, x, y, w, h, autoSize) {
	// If width or height are automatic, use 0 or high number respectively.
	// If a set width, use multiline, if no height set, automatic size.
	var high = 0xFFFFFF;
	mc.createTextField(name, level, x, y, w < 0 ? 0 : w, h < 0 ? high : h);
	var txt = mc[name];
	txt.autoSize = h < 0 ? autoSize || "left" : "none";
	txt.wordWrap = txt.multiline = !(w < 0);
	return txt;
};
var selectTextField = function(txt, a, b) {
	a = a < 0 ? txt.text.length + 1 - a : 0;
	b = b < 0 ? txt.text.length + 1 - b : 0;
	Selection.setFocus(txt);
	Selection.setSelection(a, b);
};
var whitespaceTable = [];
whitespaceTable[0] = true;
whitespaceTable[9] = true;
whitespaceTable[0xA] = true;
whitespaceTable[0xD] = true;
whitespaceTable[0x20] = true;
var trimStart = function(s) {
	var i = 0;
	for (; i < s.length && whitespaceTable[s.charCodeAt(i)]; i++);
	return s.substr(i);
};
var trimEnd = function(s) {
	var i = s.length;
	for (; i > 0 && whitespaceTable[s.charCodeAt(i - 1)]; i--);
	return s.substr(0, i);
};
var trim = function(s) {
	return trimEnd(trimStart(s));
};

// UI styles.
var colorName = 0xFFB99359;
var colorHead = 0xFFFFFFFF;
var colorLink = 0xFFFF9900;
var colorText = 0xFF999999;
var colorEdit = 0xFFCCCCCC;
var colorBack = 0xFF333333;
var colorLine = 0xFF999999;
var colorOver = 0xC0000000;
var boxStroke = 2;

// UI layers.
var menuLayer = 1;
var dialogLayer = 2;

// Save API.
var save = Array(function() {
	var setting = LSO ?
		Array(function() {
			// Get fresh each use, avoids stale object issues.
			var getSO = function() {
				return SharedObject.getLocal("mata-nui-online-game-ii", "/");
			};
			return function(key, clean) {
				// Keep value in memory, only need to write.
				var stored = getSO().data[key];
				return {
					get: function() {
						return truthy(stored) ? stored : clean;
					},
					set: function(value) {
						var so = getSO();
						so.data[key] = stored = value;
						so.flush();
					},
					clear: function() {
						this.set(clean);
					},
					clean: function() {
						return clean;
					}
				};
			};
		})[0]() :
		Array(function() {
			var pre = "hahli_";
			var fsCmd = function(key, value) {
				// A fscommand function call is compiled to getURL.
				getURL("FSCommand:" + pre + key, value);
			};
			var swfVar = function(key) {
				return _root[pre + key];
			};
			return function(key, clean) {
				// Keep value in memory, only need to write.
				var stored = swfVar(key);
				return {
					get: function() {
						return truthy(stored) ? stored : clean;
					},
					set: function(value) {
						stored = value;
						fsCmd(key, stored);
					},
					clear: function() {
						this.set(clean);
					},
					clean: function() {
						return clean;
					}
				};
			};
		})[0]();
	return {
		state: setting("state", "&nostate=1&")
	};
})[0]();

// Setup API exposed to the game.
var setupApi = function() {
	var stateVariables = [
		// Location:
		"scene",
		"previousScene",

		// World states:
		"HahlisRoof",
		"WaterWheel",
		"CounterWeight",
		"EastBridge",
		"GakoroProclamation",
		"SearchedSea",
		"AiyetoroTask",
		"DosneTask",
		"AziboTask",
		"ChampionshipWon",
		"TakoroDestroyed",
		"LastMatch",
		"LastPlayed",
		"OnukoroLosses",
		"OnukoroWins",
		"KokoroLosses",
		"KokoroWins",
		"LekoroLosses",
		"LekoroWins",
		"PokoroLosses",
		"PokoroWins",
		"TakoroLosses",
		"TakoroWins",

		// Tools:
		"ItemBladder",
		"ItemDisc",
		"ItemFishingPole",
		"ItemFlags",
		"ItemGakoroMap",
		"ItemHatchet",
		"ItemKolhiiBall",
		"ItemKolhiiStick",
		"ItemLargeShell",
		"ItemOar",
		"ItemRopeAndGrapple",
		"ItemSickle",
		"ItemSwimFins",
		"ItemWayfinder",
		"ItemPickaxe",
		"ItemSluice",
		"ItemDigger",

		// Artifacts:
		"ItemCrystalPurity",
		"ItemCrystalPeace",
		"ItemCrystalFaith",
		"ItemCrystalCreation",
		"ItemCrystalProsperity",
		"ItemCrystalCourage",
		"ItemCharmAccuracy",
		"ItemCharmCreation",
		"ItemCharmCourage",
		"ItemCharmDuty",
		"ItemCharmDestiny",
		"ItemCharmFaith",
		"ItemCharmPeace",
		"ItemCharmProsperity",
		"ItemCharmPurity",
		"ItemCharmSpeed",
		"ItemCharmStamina",
		"ItemCharmStrategy",
		"ItemCharmStrength",
		"ItemCharmUnity",
		"ItemCharmWillpower",
		"ItemMarkasNote",
		"ItemNixiesKey",
		"ItemSeaChart",
		"ItemStaffOfUnity",
		"ItemKolhiiKey",

		// Supplies:
		"ItemBambooPole",
		"ItemBambooWood",
		"ItemCowrieShell",
		"ItemFishhook",
		"ItemFlax",
		"ItemGrapple",
		"ItemHarakekePlants",
		"ItemLightstone",
		"ItemMangeaoPole",
		"ItemMangeaoWood",
		"ItemNails",
		"ItemNet",
		"ItemProtodermis",
		"ItemPuiriPole",
		"ItemPuiriWood",
		"ItemRigging",
		"ItemRope",
		"ItemSailcloth",
		"ItemSeaweed",
		"ItemOre",
		"ItemString",

		// Skills:
		"Accuracy",
		"Speed",
		"Stamina",
		"Strategy",
		"Strength",
		"Willpower",

		// Other:
		"Widgets",
		"charMackuState",
		"version"
	];

	var stateRead = function(cb) {
		forEach(save.state.get().split("&"), function(s) {
			var pair = s.split("=");
			if (pair.length === 2) {
				cb(pair[0], pair[1]);
			}
		});
	};

	_global.__hahli = {
		getstate: function(holder) {
			stateRead(function(k, v) {
				holder[k] = v;
			});
		},
		setstate: function(holder) {
			var current = {};
			stateRead(function(k, v) {
				current[k] = v;
			});
			for (p in holder) {
				current[p] = holder[p];
			}
			var value = "&";
			forEach(stateVariables, function(k) {
				var v = current[k];
				value += k + "=" + (truthy(v) ? v : "0") + "&";
			});
			save.state.set(value);
		}
	};
};

var createButtons = function(
	parent,
	buttons,
	size,
	vertical,
	wide,
	stroke,
	padding
) {
	var buttonW = vertical ? wide : ((
		wide - (buttons.length - 1) * padding
	) / buttons.length);
	var buttonY = 0;
	forEach(buttons, function(d, i) {
		var btn = parent.createEmptyMovieClip(
			"btn_" + i,
			i + 1
		);
		var txtW = buttonW - (padding * 2);
		var txt = newTextField(
			btn, "text", 1, padding, padding, txtW, -1, "center"
		);
		txt.selectable = false;
		txt._alpha = colorA(colorLink);
		txt.text = d.title;
		txt.embedFonts = true;
		var fmt = new TextFormat();
		fmt.font = "font_trademarker_light";
		fmt.size = size;
		fmt.align = "center";
		fmt.color = colorRGB(colorLink);
		txt.setTextFormat(fmt);

		var boxW = buttonW - (stroke * 2);
		var boxH = txt._height + (padding * 2) - (stroke * 2);
		drawRectangle(
			btn, stroke, stroke, boxW, boxH, 0, colorBack, colorLine, stroke
		);

		if (vertical) {
			btn._y = buttonY;
			buttonY = btn._y + btn._height + padding;
		}
		else {
			btn._x = i * (buttonW + padding);
		}

		btn.onRelease = function() {
			d.action();
		};
	});
};

// Dialog API.
var dialog = Array(function() {
	var mc = null;
	var boxContent = null;
	var clean = null;
	var destroy = function() {
		if (!mc) {
			return;
		}
		if (clean) {
			clean(boxContent);
		}
		mc.removeMovieClip();
		mc = boxContent = clean = null;
	};
	return {
		open: function(
			wide,
			padding,
			vertical,
			title,
			buttons,
			createContent,
			cleanup
		) {
			destroy();
			clean = cleanup;
			mc = self.createEmptyMovieClip("dialog", dialogLayer);
			mc._visible = false;

			var overlay = mc.createEmptyMovieClip("overlay", 1);
			var box = mc.createEmptyMovieClip("box", 2);
			boxContent = box.createEmptyMovieClip("content", 1);
			var boxTitle = box.createEmptyMovieClip("title", 2);
			var boxButtons = box.createEmptyMovieClip("buttons", 3);

			// Draw overlay, prevent clicking through it.
			drawRectangle(
				overlay, 0, 0, WIDTH, HEIGHT, 0, colorOver, 0, 0
			);
			overlay.onRelease = function() {};
			overlay.useHandCursor = false;

			if (createContent) {
				createContent(boxContent, wide);
			}

			// Create title.
			var boxTitleText = newTextField(
				boxTitle, "text", 1, 0, 0, wide, -1, "center"
			);
			boxTitleText._alpha = colorA(colorHead);
			boxTitleText.selectable = false;
			boxTitleText.text = title;
			boxTitleText.embedFonts = true;
			var boxTitleTextFmt = new TextFormat();
			boxTitleTextFmt.font = "font_trademarker_light";
			boxTitleTextFmt.size = 30;
			boxTitleTextFmt.align = "center";
			boxTitleTextFmt.color = colorRGB(colorHead);
			boxTitleText.setTextFormat(boxTitleTextFmt);

			// Position title, content, and buttons.
			boxTitle._x = padding;
			boxTitle._y = padding;
			boxContent._x = padding;
			boxContent._y = boxTitle._y + boxTitle._height + (padding * 2);
			boxButtons._x = padding;
			boxButtons._y = boxContent._y;
			if (boxContent._height) {
				boxButtons._y += boxContent._height + (padding * 2);
			}

			createButtons(
				boxButtons,
				buttons,
				20,
				vertical,
				wide,
				boxStroke,
				padding
			);

			// Draw background.
			var boxW = wide + (padding * 2);
			var boxH = boxButtons._y + boxButtons._height + padding;
			drawRectangle(
				box, 0, 0, boxW, boxH, 0, colorBack, colorLine, boxStroke
			);

			// Draw line between title and content.
			var hrY = boxTitle._y + boxTitle._height + padding;
			var hrW = wide + (padding * 2);
			drawRectangle(box, 0, hrY, hrW, 0, 0, 0, colorLine, boxStroke);

			// Center dialog.
			box._x = (WIDTH - (box._width - (boxStroke * 2))) * 0.5;
			box._y = (HEIGHT - (box._height - (boxStroke * 2))) * 0.5;

			mc._visible = true;
		},
		close: function() {
			destroy();
		}
	};
})[0]();

var player = function() {
	loadMovieNum("Player.swf", 0);
};

var setupMenu = function() {
	var menu = self.createEmptyMovieClip("menu", menuLayer);
	var buttonPlay = function() {
		return {
			title: "Play",
			action: function() {
				menu.removeMovieClip();
				player();
			}
		};
	};
	var buttonRestart = function() {
		var buttonCancel = function() {
			return {
				title: "Cancel",
				action: function() {
					dialog.close();
				}
			};
		};
		var buttonStartNew = function() {
			return {
				title: "Start New",
				action: function() {
					dialog.close();
					save.state.clear();
					menu.removeMovieClip();
					player();
				}
			};
		};
		return {
			title: "Restart",
			action: function() {
				dialog.open(
					400,
					4,
					false,
					"Start New Game?",
					[
						buttonCancel(),
						buttonStartNew()
					],
					function(content, wide) {
						var txt = newTextField(
							content, "text", 1, 0, 0, wide, -1, null
						);
						txt.selectable = false;
						txt._alpha = colorA(colorText);
						txt.text = Array(
							"Are you sure you want to start a new game?",
							"",
							"This action cannot be undone."
						).join("\n");
						txt.embedFonts = true;
						var fmt = new TextFormat();
						fmt.font = "font_gillsans";
						fmt.size = 20;
						fmt.color = colorRGB(colorText);
						txt.setTextFormat(fmt);
					},
					null
				);
			}
		};
	};
	var buttonProgress = function() {
		var box = null;
		var txt = null;
		var fmt = new TextFormat();
		fmt.font = "_typewriter";
		fmt.size = 13;
		fmt.color = colorRGB(colorEdit);
		var selectAll = function() {
			selectTextField(txt, 0, -1);
		};
		var getInput = function() {
			return trim(txt.text);
		};
		var setFormat = function() {
			// Empty text fields can lose format, keep space.
			if (!txt.text.length) {
				txt.text = " ";
			}
			txt.setTextFormat(fmt);
		};
		var buttonCancel = function() {
			return {
				title: "Cancel",
				action: function() {
					dialog.close();
				}
			};
		};
		var buttonSelect = function() {
			return {
				title: "Select",
				action: function() {
					selectAll();
				}
			};
		};
		var buttonCopy = function() {
			return {
				title: "Copy",
				action: function() {
					selectAll();
					System.setClipboard(getInput());
				}
			};
		};
		var buttonUpdate = function() {
			return {
				title: "Update",
				action: function() {
					var input = getInput();
					dialog.close();
					save.state.set(input);
				}
			};
		};
		return {
			title: "Progress",
			action: function() {
				dialog.open(
					624,
					4,
					false,
					"Progress",
					[
						buttonCancel(),
						buttonSelect(),
						buttonCopy(),
						buttonUpdate()
					],
					function(content, wide) {
						var lW = boxStroke;
						var pad = lW * 2;
						var bW = wide;
						var bH = 372;
						box = content.createEmptyMovieClip("box", 1);
						var oX = pad * 0.5;
						var oY = pad * 0.5;
						var oW = bW - pad;
						var oH = bH - pad;
						drawRectangle(
							box, oX, oY, oW, oH, 0, colorBack, colorLine, lW
						);
						var tW = bW - (pad * 2);
						var tH = bH - (pad * 2);
						txt = newTextField(
							box, "text", 1, pad, pad, tW, tH, null
						);
						txt.type = "input";
						txt._alpha = colorA(colorEdit);
						txt.text = save.state.get();
						txt.embedFonts = false;
						setFormat();
						box.onEnterFrame = setFormat;
						selectTextField(txt, -1, -1);
					},
					function() {
						box.onEnterFrame = null;
					}
				);
			}
		};
	};
	var title = function() {
		var title = menu.createEmptyMovieClip("title", 1);
		var titleText = newTextField(
			title, "text", 1, 0, 0, WIDTH, -1, "center"
		);
		titleText._x = 0;
		titleText._y = 60;
		titleText._alpha = colorA(colorName);
		titleText.selectable = false;
		titleText.text = Array(
			"Mata Nui Online Game II:",
			"The Final Chronicle"
		).join("\n");
		titleText.embedFonts = true;
		var titleTextFmt = new TextFormat();
		titleTextFmt.font = "font_trademarker_light";
		titleTextFmt.size = 40;
		titleTextFmt.align = "center";
		titleTextFmt.color = colorRGB(colorName);
		titleText.setTextFormat(titleTextFmt);
	};
	var buttons = function() {
		var wide = 400;
		var list = [
			buttonPlay(),
			buttonRestart(),
			buttonProgress()
		];
		var buttons = menu.createEmptyMovieClip("buttons", 2);
		buttons._x = (WIDTH - wide) * 0.5;
		buttons._y = 200;
		createButtons(buttons, list, 26, true, wide, boxStroke, 10);
	};
	title();
	buttons();
};

var main = function() {
	setupApi();
	if (MENU) {
		setupMenu();
	}
	else {
		player();
	}
};

main();
