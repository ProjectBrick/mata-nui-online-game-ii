all: matanuionlinegameii.swf

matanuionlinegameii.swf:
	printf '%s' 'Array(function(WIDTH, HEIGHT, MENU, LSO) {' > matanuionlinegameii.as
	cat ../shared/matanuionlinegameii.as >> matanuionlinegameii.as
	printf '\n%s' '})[0].call(this, 640, 480, true, true);' >> matanuionlinegameii.as
	makeswf \
		-c -1 \
		-v 6 \
		-s 640x480 \
		-r 30 \
		-b 000000 \
		-o matanuionlinegameii.main.swf \
		matanuionlinegameii.as
	swfcombine \
		-v \
		-z \
		-m \
		-l \
		-o matanuionlinegameii.swf \
		matanuionlinegameii.main.swf \
		-f 1=../shared/fonts/trademarker_light.swf \
		-f 1=../shared/fonts/gillsans.swf
	chmod -x matanuionlinegameii.swf
	rm matanuionlinegameii.as matanuionlinegameii.main.swf*
