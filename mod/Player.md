# Version detecting 10+ bug

## `scripts` -> `frame 2`

Original:

```
var numFramesLoaded = _root._framesloaded;
if(numFramesLoaded > 4)
{
	var flashVersion = getVersion();
	i = 0;
	while(i < flashVersion.length)
	{
		currentCharacter = flashVersion.substr(i,1);
		if(currentCharacter == " ")
		{
			var flashPlatform = flashVersion.substr(1,i - 1);
			var majorVersion = flashVersion.substr(i + 1,1);
		}
		i++;
	}
	var neededMajorVersion = 6;
	if(MajorVersion < neededMajorVersion)
	{
		trace("Version insufficient");
	}
	else
	{
		gotoAndPlay(4);
	}
}
else
{
	gotoAndPlay(1);
}
```

Modified:

```
var numFramesLoaded = _root._framesloaded;
if(numFramesLoaded > 4)
{
	var flashVersion = getVersion();
	i = 0;
	while(i < flashVersion.length)
	{
		currentCharacter = flashVersion.substr(i,1);
		if(currentCharacter == " ")
		{
			var flashPlatform = flashVersion.substr(1,i - 1);
			var majorVersion = flashVersion.substr(i + 1);
			i = 0;
			while (i < majorVersion.length) {
				currentCharacter = majorVersion.substr(i, 1);
				if(currentCharacter == ",") {
					majorVersion = majorVersion.substr(0, i);
					break;
				}
				i++;
			}
			break;
		}
		i++;
	}
	var neededMajorVersion = 6;
	if(majorVersion < neededMajorVersion)
	{
		trace("Version insufficient");
	}
	else
	{
		gotoAndPlay(4);
	}
}
else
{
	gotoAndPlay(1);
}
```


# Loading glitch from reloading race condition

## `scripts` -> `DefineSprite (134)` -> `frame 13`

Original:

```
var numFramesTotal = _root.holder._totalframes;
var numFramesLoaded = _root.holder._framesloaded;
var numBytesTotal = _root.holder.getBytesTotal();
var numBytesLoaded = _root.holder.getBytesLoaded();
percent = 100 * (numBytesLoaded / numBytesTotal);
LoadingBar.setPercent(percent,numBytesTotal);
debugLoading = "preLoad :: Total -- " + numFramesLoaded + " :: " + numFramesTotal;
debugBytes = "preLoad :: Total -- " + numBytesLoaded + " :: " + numBytesTotal;
if(numBytesTotal > 100)
{
	if(numBytesLoaded == numBytesTotal and numFramesLoaded == numFramesTotal)
	{
		loadURL(sceneURL);
	}
	else
	{
		gotoAndPlay(12);
	}
}
else
{
	gotoAndPlay(12);
}
```

Modified:

```
var numFramesTotal = _root.holder._totalframes;
var numFramesLoaded = _root.holder._framesloaded;
var numBytesTotal = _root.holder.getBytesTotal();
var numBytesLoaded = _root.holder.getBytesLoaded();
percent = 100 * (numBytesLoaded / numBytesTotal);
LoadingBar.setPercent(percent,numBytesTotal);
debugLoading = "preLoad :: Total -- " + numFramesLoaded + " :: " + numFramesTotal;
debugBytes = "preLoad :: Total -- " + numBytesLoaded + " :: " + numBytesTotal;
if(numBytesTotal > 100)
{
	if(numBytesLoaded == numBytesTotal and numFramesLoaded == numFramesTotal and numFramesLoaded > 0)
	{
		_root.holder.gotoAndPlay(1);
	}
	else
	{
		gotoAndPlay(12);
	}
}
else
{
	gotoAndPlay(12);
}
```


# Alternative saving

## `scripts` -> `DefineSprite (224)` -> `frame 1`

Original:

```
function getState()
{
	output("State -- calling getState");
	checkResults = 1;
	getStateObject = new LoadVars();
	var currentDate = new Date();
	var noCache = currentDate.getTime();
	if(stateURL.length < 1)
	{
		var loadURL = "getstate.asp";
	}
	else
	{
		var loadURL = stateURL + "getstate.asp" + "?noCache=" + noCache;
	}
	getStateObject.load(loadURL);
}
function setState()
{
	if(_root.loggedIn == 1)
	{
		output("State -- sending state to the server");
		initializeStateObject();
		sendURL = stateURL + "setstate.asp";
		configureSendState();
		addStateVariable("version",_root.version);
		addStateVariable("scene",_root.currentScene);
		addStateVariable("previousScene",_root.lastScene);
		hashSignature = calculateHash(updateState);
		setStateObject.signature = hashSignature;
		output("State -- signature is " + hashSignature);
		setStateObject.sendAndLoad(sendURL,setStateObject,"POST");
		checkSetState = 1;
	}
	else
	{
		output("State -- user is not logged in, sending no update");
	}
}
function initializeStateObject()
{
	setStateObject = new LoadVars();
}
function initGame()
{
	checkResults = 0;
	_root.initializeGame();
}
```

Modified:

```
function getState()
{
	output("State -- calling getState");
	checkResults = 1;
	getStateObject = new LoadVars();
	var currentDate = new Date();
	var noCache = currentDate.getTime();
	if(typeof _root.getstate_url == "string" && _root.getstate_url.length) {
		var loadURL = getstate_url + "?noCache=" + noCache;
	}
	else if(stateURL.length < 1)
	{
		var loadURL = "getstate.asp";
	}
	else
	{
		var loadURL = stateURL + "getstate.asp" + "?noCache=" + noCache;
	}
	if(_global.__hahli) {
		_global.__hahli.getstate(getStateObject);
	}
	else
	{
		getStateObject.load(loadURL);
	}
}
function setState()
{
	if(_root.loggedIn == 1)
	{
		output("State -- sending state to the server");
		initializeStateObject();
		if(typeof _root.setstate_url == "string" && _root.setstate_url.length) {
			sendURL = _root.setstate_url;
		}
		else
		{
			sendURL = stateURL + "setstate.asp";
		}
		configureSendState();
		addStateVariable("version",_root.version);
		addStateVariable("scene",_root.currentScene);
		addStateVariable("previousScene",_root.lastScene);
		hashSignature = calculateHash(updateState);
		setStateObject.signature = hashSignature;
		output("State -- signature is " + hashSignature);
		if(_global.__hahli) {
			_global.__hahli.setstate(setStateObject);
		}
		else
		{
			setStateObject.sendAndLoad(sendURL,setStateObject,"POST");
		}
		checkSetState = 1;
	}
	else
	{
		output("State -- user is not logged in, sending no update");
	}
}
function initializeStateObject()
{
	setStateObject = new LoadVars();
}
function initGame()
{
	checkResults = 0;
	_root.initializeGame();
}
```


# Using system fonts instead of the embedded fonts

1.  Open `Player.swf` in FFDec.
2.  Right-click `player.swf`, select `Export SWF as XML`.
3.  Find and replace all `useOutlines="false"` instances with `useOutlines="true"` in XML.
4.  Right-click `Player.swf`, select `Import SWF XML`.
5.  Click `Save`.
