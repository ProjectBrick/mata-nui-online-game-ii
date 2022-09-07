import fse from 'fs-extra';
import gulp from 'gulp';
import {Manager} from '@shockpkg/core';
import {
	Plist,
	ValueDict,
	ValueString,
	ValueBoolean
} from '@shockpkg/plist-dom';
import {
	BundleWindows32,
	BundleMacApp,
	BundleLinux32,
	BundleLinux64,
	loader
} from '@shockpkg/swf-projector';

import {
	appName,
	appDomain,
	version,
	author,
	copyright,
	appFile,
	appDmgTitle,
	versionShort,
	distName
} from './util/meta.mjs';
import {
	imageSize,
	pngs2bmps,
	readIco,
	readIcns
} from './util/image.mjs';
import {docs} from './util/doc.mjs';
import {
	makeZip,
	makeTgz,
	makeExe,
	makeDmg
} from './util/dist.mjs';
import {templateStrings} from './util/string.mjs';
import {Propercase} from './util/propercase.mjs';
import {
	SourceZip,
	SourceDir
} from './util/source.mjs';
import {mod} from './util/mod.mjs';

const sources = {
	'mod': () => new SourceDir(
		'mod'
	),
	'recreation': () => new SourceDir(
		'recreation'
	),
	'original': () => new SourceZip(
		'original/lego/hahli.zip',
		'hahli/'
	)
};

async function readSources(order, each) {
	const propercase = new Propercase('propercase.txt');
	propercase.cacheDir = '.cache/propercase';
	await propercase.init();

	const ordered = order.map(id => ({
		id,
		source: sources[id]()
	}));
	for (const {source} of ordered) {
		await source.open();
	}

	const mapped = new Map();
	for (const {id, source} of ordered) {
		await source.each(async entry => {
			const p = entry.path.toLowerCase();
			if (p.endsWith('/') || mapped.has(p)) {
				return;
			}
			mapped.set(p, {
				source: id,
				path: propercase.name(entry.path),
				read: async () => {
					let data = await propercase.dataCached(
						await entry.read()
					);
					return mod(entry.path, data);
				}
			});
		});
	}
	for (const id of [...mapped.keys()].sort()) {
		await each(mapped.get(id));
	}

	for (const {source} of ordered) {
		await source.close();
	}
}

async function readSourcesFiltered(each) {
	const sources = [
		'mod',
		'recreation',
		'original'
	];
	await readSources(sources, async entry => {
		if (!/^[^.][^\\/]+\.(swf)$/i.test(entry.path)) {
			return;
		}
		await each(entry);
	});
}

async function bundle(bundle, pkg, delay = false) {
	const swfv = 6;
	const [w, h] = [640, 480];
	const fps = 30;
	const bg = 0x000000;
	const url = 'matanuionlinegameii.swf';
	await bundle.withData(
		await (new Manager()).with(m => m.packageInstallFile(pkg)),
		loader(swfv, w, h, fps, bg, url, delay ? Math.round(fps / 2) : 0),
		async b => {
			await b.copyResourceFile(
				'matanuionlinegameii.swf',
				'src/projector/matanuionlinegameii.swf'
			);
			await readSourcesFiltered(async entry => {
				await b.createResourceFile(entry.path, await entry.read());
			});
		}
	);
}

async function browser(dest) {
	await readSourcesFiltered(async entry => {
		const data = await entry.read();
		await fse.outputFile(`${dest}/${entry.path}`, data);
	});
	await Promise.all([
		'matanuionlinegameii.swf',
		'main.js',
		'main.css'
	].map(f => fse.copy(`src/browser/${f}`, `${dest}/${f}`)));
	const defaultPrefix = 'matanuionlinegameii.';
	await fse.outputFile(`${dest}/index.html`, templateStrings(
		await fse.readFile('src/browser/index.html', 'utf8'),
		{
			LS_PREFIX: process.env.MNOGII_LS_PREFIX || defaultPrefix,
			API_PREFIX: process.env.MNOGII_API_PREFIX || defaultPrefix,
			API_URL: process.env.MNOGII_API_URL || '',
			API_NAME: process.env.MNOGII_API_NAME || '',
			API_LINK: process.env.MNOGII_API_LINK || ''
		}
	));
}

gulp.task('clean', async () => {
	await fse.remove('.cache');
	await fse.remove('build');
	await fse.remove('dist');
});

gulp.task('build:pages', async () => {
	const dest = 'build/pages';
	await fse.remove(dest);
	await browser(dest);
	await docs('docs', dest);
});

gulp.task('build:browser', async () => {
	const dest = 'build/browser';
	await fse.remove(dest);
	await browser(`${dest}/data`);
	await fse.outputFile(
		`${dest}/${appFile}.html`,
		'<meta http-equiv="refresh" content="0;url=data/index.html">\n'
	);
	await docs('docs', dest);
});

gulp.task('build:windows', async () => {
	const dest = 'build/windows';
	await fse.remove(dest);
	const file = `${appFile}.exe`;
	const b = new BundleWindows32(`${dest}/${file}`);
	b.projector.versionStrings = {
		FileVersion: version,
		ProductVersion: versionShort,
		CompanyName: author,
		FileDescription: appName,
		LegalCopyright: copyright,
		ProductName: appName,
		LegalTrademarks: '',
		OriginalFilename: file,
		InternalName: appFile,
		Comments: ''
	};
	b.projector.iconData = await readIco('res/app-icon-windows');
	b.projector.patchWindowTitle = appName;
	b.projector.removeCodeSignature = true;
	await bundle(b, 'flash-player-32.0.0.465-windows-sa-debug');
	await docs('docs', dest);
});

gulp.task('build:mac', async () => {
	// Release projectors on Mac have slow performance when resized larger.
	// Debug projectors do not have this performance issue.
	const dest = 'build/mac';
	await fse.remove(dest);
	const pkgInfo = 'APPL????';
	const b = new BundleMacApp(`${dest}/${appFile}.app`);
	b.projector.binaryName = appFile;
	b.projector.pkgInfoData = pkgInfo;
	b.projector.infoPlistData = (new Plist(new ValueDict(new Map([
		['CFBundleInfoDictionaryVersion', new ValueString('6.0')],
		['CFBundleDevelopmentRegion', new ValueString('en-US')],
		['CFBundleExecutable', new ValueString('')],
		['CFBundleIconFile', new ValueString('')],
		['CFBundleName', new ValueString(appName)],
		['NSHumanReadableCopyright', new ValueString(copyright)],
		['CFBundleGetInfoString', new ValueString(copyright)],
		['CFBundleIdentifier', new ValueString(appDomain)],
		['CFBundleVersion', new ValueString(version)],
		['CFBundleLongVersionString', new ValueString(version)],
		['CFBundleShortVersionString', new ValueString(versionShort)],
		['CFBundlePackageType', new ValueString(pkgInfo.substring(0, 4))],
		['CFBundleSignature', new ValueString(pkgInfo.substring(4))],
		['NSAppTransportSecurity', new ValueDict(new Map([
			['NSAllowsArbitraryLoads', new ValueBoolean(true)]
		]))],
		['NSSupportsAutomaticGraphicsSwitching', new ValueBoolean(true)],
		['NSHighResolutionCapable', new ValueBoolean(true)],
		['CSResourcesFileMapped', new ValueBoolean(true)],
		['LSPrefersCarbon', new ValueString('YES')],
		['NSAppleScriptEnabled', new ValueString('YES')],
		['NSMainNibFile', new ValueString('MainMenu')],
		['NSPrincipalClass', new ValueString('NSApplication')]
	])))).toXml();
	b.projector.iconData = await readIcns('res/app-icon-mac.iconset');
	b.projector.patchWindowTitle = appName;
	b.projector.removeInfoPlistStrings = true;
	b.projector.removeCodeSignature = true;
	await bundle(b, 'flash-player-32.0.0.465-mac-sa-debug-zip');
	await docs('docs', dest);
});

gulp.task('build:linux-i386', async () => {
	const dest = 'build/linux-i386';
	await fse.remove(dest);
	const b = new BundleLinux32(`${dest}/${appFile}`);
	b.projector.patchProjectorPath = true;
	b.projector.patchWindowTitle = appName;
	await bundle(b, 'flash-player-11.2.202.644-linux-i386-sa-debug', true);
	await docs('docs', dest);
});

gulp.task('build:linux-x86_64', async () => {
	const dest = 'build/linux-x86_64';
	await fse.remove(dest);
	const b = new BundleLinux64(`${dest}/${appFile}`);
	b.projector.patchProjectorPath = true;
	b.projector.patchProjectorOffset = true;
	b.projector.patchWindowTitle = appName;
	await bundle(b, 'flash-player-32.0.0.465-linux-x86_64-sa-debug', true);
	await docs('docs', dest);
});

gulp.task('dist:browser:zip', async () => {
	await makeZip(`dist/${distName}-Browser.zip`, 'build/browser');
});

gulp.task('dist:browser:tgz', async () => {
	await makeTgz(`dist/${distName}-Browser.tgz`, 'build/browser');
});

gulp.task('dist:windows:zip', async () => {
	await makeZip(`dist/${distName}-Windows.zip`, 'build/windows');
});

gulp.task('dist:windows:exe', async () => {
	const outDir = 'dist';
	const outFile = `${distName}-Windows`;
	const target = `${outDir}/${outFile}.exe`;
	await fse.remove(target);
	const res = `${target}.res`;
	const resIcon = `${res}/icon.ico`;
	const resHeaders = `${res}/headers`;
	const resSidebars = `${res}/sidebars`;
	await fse.remove(res);
	await Promise.all([
		readIco('res/inno-icon').then(d => fse.outputFile(resIcon, d)),
		pngs2bmps('res/inno-header', resHeaders),
		pngs2bmps('res/inno-sidebar', resSidebars),
	]);
	await makeExe('innosetup.iss', {
		VarId: appDomain,
		VarName: appName,
		VarNameFile: appFile,
		VarVersion: version,
		VarPublisher: author,
		VarCopyright: copyright,
		VarLicense: 'LICENSE.txt',
		VarIcon: resIcon,
		VarWizardImageHeader: `${resHeaders}/*.bmp`,
		VarWizardImageSidebar: `${resSidebars}/*.bmp`,
		VarWizardImageAlphaFormat: 'none',
		VarExeName: `${appFile}.exe`,
		VarOutDir: outDir,
		VarOutFile: outFile,
		VarSource: 'build/windows/*',
		VarArchitecturesInstallIn64BitMode: '',
		VarArchitecturesAllowed: '',
		VarReadMeName: `${appFile} - README`,
		VarReadMeFile: 'README.html'
	});
	await fse.remove(res);
});

gulp.task('dist:mac:tgz', async () => {
	await makeTgz(`dist/${distName}-Mac.tgz`, 'build/mac');
});

gulp.task('dist:mac:dmg', async () => {
	const background = 'res/dmg-background/dmg-background.png';
	const {width, height} = await imageSize(background);
	const output = `dist/${distName}-Mac.dmg`;
	const icon = `${output}.icns`;
	await fse.outputFile(icon, await readIcns('res/dmg-icon.iconset'));
	await makeDmg(output, {
		format: 'UDBZ',
		title: appDmgTitle,
		'icon-size': 128,
		icon,
		background,
		window: {
			size: {
				width,
				height
			}
		},
		contents: [
			{
				x: (width / 2) - 160,
				y: 108,
				type: 'file',
				path: `build/mac/${appFile}.app`
			},
			{
				x: (width / 2) + 160,
				y: 108,
				type: 'link',
				path: '/Applications'
			},
			{
				x: (width / 2),
				y: 364,
				type: 'file',
				path: 'build/mac/README.html'
			}
		]
	});
	await fse.remove(icon);
});

gulp.task('dist:linux-i386:tgz', async () => {
	await makeTgz(`dist/${distName}-Linux-i386.tgz`, 'build/linux-i386');
});

gulp.task('dist:linux-x86_64:tgz', async () => {
	await makeTgz(`dist/${distName}-Linux-x86_64.tgz`, 'build/linux-x86_64');
});
