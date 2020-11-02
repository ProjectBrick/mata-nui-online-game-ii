# Fixing Takoro Destroyed softlock

## `scripts` -> `DefineSprite (16)` -> `frame 1`

Original:

```
function derive(matoran)
{
	var ChampionshipWon = _root.getWorldState("ChampionshipWon");
	var TakoroDestroyed = _root.getWorldState("TakoroDestroyed");
	if(ChampionshipWon == 1 and TakoroDestroyed == 0)
	{
		newScene = "cutSceneTakoroDestroyed";
	}
	else
	{
		newScene = "TakoroTownSquareNorth";
	}
	_root.exitScene(matoran,newScene);
}
```

Modified:

```
function derive(matoran)
{
	var ChampionshipWon = _root.getWorldState("ChampionshipWon");
	var haveCharmCourage = _root.backpack.getItemCount("ItemCharmCourage");
	var haveCharmDuty = _root.backpack.getItemCount("ItemCharmDuty");
	var haveCrystalCreation = _root.backpack.getItemCount("ItemCrystalCreation");
	var haveCrystalFaith = _root.backpack.getItemCount("ItemCrystalFaith");
	var haveCrystalPeace = _root.backpack.getItemCount("ItemCrystalPeace");
	var haveCrystalProsperity = _root.backpack.getItemCount("ItemCrystalProsperity");
	var haveCrystalPurity = _root.backpack.getItemCount("ItemCrystalPurity");
	if(ChampionshipWon == 1 and haveCharmCourage > 0 and haveCharmDuty > 0 and haveCrystalCreation > 0 and haveCrystalFaith > 0 and haveCrystalPeace > 0 and haveCrystalProsperity > 0 and haveCrystalPurity > 0)
	{
		newScene = "cutSceneTakoroDestroyed";
	}
	else
	{
		newScene = "TakoroTownSquareNorth";
	}
	_root.exitScene(matoran,newScene);
}
```
