# Fixing the Le-Koro Kolhii complete glitch

## `scripts` -> `frame 122`

Original:

```
KoliLocation = _root.KoliLocation;
if(KoliLocation == "Gakoro")
{
	var newScene = "KoliLilypad";
}
else if(KoliLocation == "Onukoro")
{
	var newScene = "OnukoroKolhiiGate";
}
else if(KoliLocation == "Kokoro")
{
	var newScene = "KokoroKolhiiGate";
}
else if(KoliLocation == "Kokoro")
{
	var newScene = "LekoroPlatformB";
}
else if(KoliLocation == "Takoro")
{
	var newScene = "TakoroKolhiiGate";
}
else if(KoliLocation == "Pokoro")
{
	var newScene = "PokoroKolhiiGate";
}
_root.loadscene(newScene);
stop();
```

Modified:

```
KoliLocation = _root.KoliLocation;
if(KoliLocation == "Gakoro")
{
	var newScene = "KoliLilypad";
}
else if(KoliLocation == "Onukoro")
{
	var newScene = "OnukoroKolhiiGate";
}
else if(KoliLocation == "Kokoro")
{
	var newScene = "KokoroKolhiiGate";
}
else if(KoliLocation == "Lekoro")
{
	var newScene = "LekoroPlatformB";
}
else if(KoliLocation == "Takoro")
{
	var newScene = "TakoroKolhiiGate";
}
else if(KoliLocation == "Pokoro")
{
	var newScene = "PokoroKolhiiGate";
}
_root.loadscene(newScene);
stop();
```
