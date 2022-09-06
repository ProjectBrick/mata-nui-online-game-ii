export function bufferToHex(buffer) {
	return buffer.toString('hex')
		.replace(/(.{2})/g, '$1 ')
		.replace(/ $/, '')
		.toUpperCase();
}

export function bufferFromHex(hex) {
	return Buffer.from(
		hex.replace(/\s/g, ''),
		'hex'
	);
}
