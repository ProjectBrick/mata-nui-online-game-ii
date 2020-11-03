'use strict';

const path = require('path');
const util = require('util');
const stream = require('stream');

const fse = require('fs-extra');
const {task} = require('gulp');
const {
	Plist,
	ValueDict,
	ValueString,
	ValueBoolean
} = require('@shockpkg/plist-dom');
const {Manager} = require('@shockpkg/core');
const {
	BundleWindows32,
	BundleMacApp,
	BundleLinux32,
	BundleLinux64
} = require('@shockpkg/swf-projector');
const slugify = require('slugify');
const archiver = require('archiver');
const tar = require('tar');
const innosetup = require('innosetup');

const {Propercase} = require('./util/propercase');
const {
	SourceZip,
	SourceDir
} = require('./util/sources');
const {Server} = require('./util/server');
const {
	version,
	author,
	copyright
} = require('./package.json');

const pipelineP = util.promisify(stream.pipeline);
const innosetupP = util.promisify(innosetup);

const appName = 'Mata Nui Online Game II';
const appNameShort = 'MNOG II';
const appDomain = 'io.github.projectbrick.MataNuiOnlineGameII';
const distName = slugify(`${appName} ${version}`);
const versionShort = version.split('.').slice(0, 2).join('.');
const serverPort = +process.env.SERVER_PORT;

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

async function shockpkgFile(pkg) {
	return (new Manager()).with(
		async manager => manager.packageInstallFile(pkg)
	);
}

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
				read: async () => propercase.dataCached(await entry.read())
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

async function addLicense(dir) {
	await fse.copy('LICENSE.txt', `${dir}/LICENSE.txt`);
}

async function makeZip(target, source, name) {
	await fse.remove(target);
	await fse.ensureDir(path.dirname(target));
	const archive = archiver('zip', {
		zlib: {
			level: 9
		}
	});
	archive.on('warning', err => {
		archive.emit('error', err);
	});
	const done = pipelineP(archive, fse.createWriteStream(target));
	archive.directory(source, name);
	archive.finalize();
	await done;
}

async function makeTgz(target, source, name) {
	await fse.remove(target);
	await fse.ensureDir(path.dirname(target));
	await tar.create(
		{
			gzip: true,
			portable: true,
			file: target,
			cwd: source,
			prefix: name
		},
		['.']
	);
}

async function makeExe(target, source, id, name, file, exe) {
	await fse.remove(target);
	const vars = {
		Id: id,
		Name: name,
		NameFile: file,
		Version: version,
		Publisher: author,
		Copyright: copyright,
		License: `${source}/LICENSE.txt`,
		Icon: 'res/exe-icon.ico',
		WizardImageHeader: 'res/exe-header-*.bmp',
		WizardImageSidebar: 'res/exe-sidebar-*.bmp',
		WizardImageAlphaFormat: 'none',
		ExeName: exe,
		OutDir: path.dirname(target),
		OutFile: path.basename(target).replace(/\.exe$/i, ''),
		Source: `${source}/*`,
		ArchitecturesInstallIn64BitMode: '',
		ArchitecturesAllowed: ''
	};
	await innosetupP('innosetup.iss', {
		gui: false,
		verbose: false,
		...Object.fromEntries(
			Object.entries(vars).map(([k, v]) => ([`DVar${k}`, v]))
		)
	});
}

async function makeDmg(target, specification) {
	const appdmg = require('appdmg');
	await fse.remove(target);
	await fse.ensureDir(path.dirname(target));
	await new Promise((resolve, reject) => {
		const dmg = appdmg({
			basepath: '.',
			target,
			specification
		});
		dmg.on('error', reject);
		dmg.on('finish', resolve);
	});
}

async function bundle(bundle, pkg) {
	await bundle.withFile(
		await shockpkgFile(pkg),
		'src/projector/matanuionlinegameii.swf',
		async b => {
			await readSourcesFiltered(async entry => {
				await b.createResourceFile(entry.path, await entry.read());
			});
		}
	);
}

function createBundleMac(path) {
	const pkgInfo = 'APPL????';
	const infoPlist = new Plist(new ValueDict(new Map(Object.entries({
		CFBundleInfoDictionaryVersion: new ValueString('6.0'),
		CFBundleDevelopmentRegion: new ValueString('en-US'),
		CFBundleExecutable: new ValueString(''),
		CFBundleIconFile: new ValueString(''),
		CFBundleName: new ValueString(appName),
		NSHumanReadableCopyright: new ValueString(copyright),
		CFBundleGetInfoString: new ValueString(copyright),
		CFBundleIdentifier: new ValueString(appDomain),
		CFBundleVersion: new ValueString(version),
		CFBundleLongVersionString: new ValueString(version),
		CFBundleShortVersionString: new ValueString(versionShort),
		CFBundlePackageType: new ValueString(pkgInfo.substr(0, 4)),
		CFBundleSignature: new ValueString(pkgInfo.substr(4)),
		NSAppTransportSecurity: new ValueDict(new Map(Object.entries({
			NSAllowsArbitraryLoads: new ValueBoolean(true)
		}))),
		NSSupportsAutomaticGraphicsSwitching: new ValueBoolean(true),
		NSHighResolutionCapable: new ValueBoolean(true),
		CSResourcesFileMapped: new ValueBoolean(true),
		LSPrefersCarbon: new ValueString('YES'),
		NSAppleScriptEnabled: new ValueString('YES'),
		NSMainNibFile: new ValueString('MainMenu'),
		NSPrincipalClass: new ValueString('NSApplication')
	}))));

	const bundle = new BundleMacApp(path);
	const {projector} = bundle;
	projector.binaryName = appName;
	projector.pkgInfoData = pkgInfo;
	projector.infoPlistDocument = infoPlist;
	projector.iconFile = 'res/icon.icns';
	projector.patchWindowTitle = appName;
	projector.removeInfoPlistStrings = true;
	projector.removeCodeSignature = true;
	return bundle;
}

function createBundleWindows(path) {
	const file = path.split(/[/\\]/).pop();
	const fileName = file.replace(/\.exe$/i, '');
	const versionStrings = {
		FileVersion: version,
		ProductVersion: versionShort,
		CompanyName: author,
		FileDescription: appName,
		LegalCopyright: copyright,
		ProductName: appName,
		LegalTrademarks: '',
		OriginalFilename: file,
		InternalName: fileName,
		Comments: ''
	};

	const bundle = new BundleWindows32(path);
	const {projector} = bundle;
	projector.versionStrings = versionStrings;
	projector.iconFile = 'res/icon.ico';
	projector.patchWindowTitle = appNameShort;
	projector.removeCodeSignature = true;
	return bundle;
}

function createBundleLinux32(path) {
	const bundle = new BundleLinux32(path);
	const {projector} = bundle;
	projector.patchProjectorPath = true;
	projector.patchWindowTitle = appName;
	return bundle;
}

function createBundleLinux64(path) {
	const bundle = new BundleLinux64(path);
	const {projector} = bundle;
	projector.patchProjectorPath = true;
	projector.patchProjectorOffset = true;
	projector.patchWindowTitle = appName;
	return bundle;
}

async function buildBrowser(dir) {
	const dest = `build/${dir}`;
	const destData = `${dest}/data`;
	await fse.remove(dest);
	await readSourcesFiltered(async entry => {
		const data = await entry.read();
		await fse.outputFile(`${destData}/${entry.path}`, data);
	});
	await Promise.all([
		'matanuionlinegameii.swf',
		'main.js',
		'main.css'
	].map(f => fse.copy(`src/browser/${f}`, `${destData}/${f}`)));
	const defaultPrefix = 'matanuionlinegameii.';
	const vars = {
		LS_PREFIX: process.env.MNOGII_LS_PREFIX || defaultPrefix,
		API_PREFIX: process.env.MNOGII_API_PREFIX || defaultPrefix,
		API_URL: process.env.MNOGII_API_URL || '',
		API_NAME: process.env.MNOGII_API_NAME || '',
		API_LINK: process.env.MNOGII_API_LINK || ''
	};
	await fse.outputFile(
		`${destData}/index.html`,
		(await fse.readFile('src/browser/index.html', 'utf8')).replace(
			/\$\{([^\}]*)\}/g,
			(_all, p1) => {
				const value = vars[p1];
				if (typeof value !== 'string') {
					throw new Error(`Undefined template variable: ${p1}`);
				}
				return vars[p1];
			}
		)
	);
	await fse.outputFile(
		`${dest}/${appName}.html`,
		'<meta http-equiv="refresh" content="0;url=data/index.html">\n'
	);
	await addLicense(dest);
}

async function buildWindows(dir, pkg) {
	const dest = `build/${dir}`;
	await fse.remove(dest);
	await bundle(createBundleWindows(`${dest}/${appName}.exe`), pkg);
	await addLicense(dest);
}

async function buildMac(dir, pkg) {
	const dest = `build/${dir}`;
	await fse.remove(dest);
	await bundle(createBundleMac(`${dest}/${appName}.app`), pkg);
	await addLicense(dest);
}

async function buildLinux32(dir, pkg) {
	const dest = `build/${dir}`;
	await fse.remove(dest);
	await bundle(createBundleLinux32(`${dest}/${appName}`), pkg);
	await addLicense(dest);
}

async function buildLinux64(dir, pkg) {
	const dest = `build/${dir}`;
	await fse.remove(dest);
	await bundle(createBundleLinux64(`${dest}/${appName}`), pkg);
	await addLicense(dest);
}

async function server(dir) {
	const server = new Server();
	server.dir = dir;
	if (serverPort) {
		server.port = serverPort;
	}
	await server.run(() => {
		console.log(`Server running at: ${server.base}`);
	});
}

task('clean', async () => {
	await fse.remove('.cache');
	await fse.remove('build');
	await fse.remove('dist');
});

task('build:browser', async () => {
	await buildBrowser('browser');
});

task('build:windows', async () => {
	await buildWindows(
		'windows',
		'flash-player-32.0.0.445-windows-sa-debug'
	);
});

task('build:mac', async () => {
	// Release versions on Mac have slow performance when resized larger.
	// Debug versions do not have this performance issue.
	await buildMac(
		'mac',
		'flash-player-32.0.0.445-mac-sa-debug'
	);
});

task('build:linux-i386', async () => {
	await buildLinux32(
		'linux-i386',
		'flash-player-11.2.202.644-linux-i386-sa-debug'
	);
});

task('build:linux-x86_64', async () => {
	await buildLinux64(
		'linux-x86_64',
		'flash-player-32.0.0.445-linux-x86_64-sa-debug'
	);
});

task('dist:browser:zip', async () => {
	const name = `${distName}-Browser`;
	await makeZip(
		`dist/${name}.zip`,
		'build/browser',
		name
	);
});

task('dist:browser:tgz', async () => {
	const name = `${distName}-Browser`;
	await makeTgz(
		`dist/${name}.tgz`,
		'build/browser',
		name
	);
});

task('dist:windows:zip', async () => {
	const name = `${distName}-Windows`;
	await makeZip(
		`dist/${name}.zip`,
		'build/windows',
		name
	);
});

task('dist:windows:exe', async () => {
	const name = `${distName}-Windows`;
	await makeExe(
		`dist/${name}.exe`,
		'build/windows',
		appDomain,
		appName,
		appName,
		`${appName}.exe`
	);
});

task('dist:mac:tgz', async () => {
	const name = `${distName}-Mac`;
	await makeTgz(
		`dist/${name}.tgz`,
		'build/mac',
		name
	);
});

task('dist:mac:dmg', async () => {
	const width = 600;
	const height = 500;
	await makeDmg(`dist/${distName}-Mac.dmg`, {
		format: 'UDBZ',
		title: appName,
		'icon-size': 128,
		icon: 'res/dmg-icon.icns',
		background: 'res/dmg-background.png',
		window: {
			size: {
				width,
				height
			}
		},
		contents: [
			{
				x: (width / 2) + 150,
				y: 100,
				type: 'link',
				path: '/Applications'
			},
			{
				x: (width / 2) - 150,
				y: 100,
				type: 'file',
				path: `build/mac/${appName}.app`
			},
			{
				x: (width / 2),
				y: 350,
				type: 'file',
				path: 'build/mac/LICENSE.txt'
			}
		]
	});
});

task('dist:linux-i386:tgz', async () => {
	const name = `${distName}-Linux-i386`;
	await makeTgz(
		`dist/${name}.tgz`,
		'build/linux-i386',
		name
	);
});

task('dist:linux-x86_64:tgz', async () => {
	const name = `${distName}-Linux-x86_64`;
	await makeTgz(
		`dist/${name}.tgz`,
		'build/linux-x86_64',
		name
	);
});

task('run:browser', async () => {
	await server('build/browser/data');
});
