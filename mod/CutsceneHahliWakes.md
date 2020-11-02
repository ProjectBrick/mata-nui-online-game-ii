# Fixing an audio crash in many player versions

## `scripts` -> `frame 757`

Original:

```
_root.currentScene = _root.lastScene;
_root.loadScene("HahlisHut");
stop();
```

Modified:

```
stopAllSounds();
_root.currentScene = _root.lastScene;
_root.loadScene("HahlisHut");
stop();
```
