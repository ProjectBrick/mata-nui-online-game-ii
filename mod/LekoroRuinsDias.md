# Fixing Faith Crystal collection

## `scripts` -> `frame 4`

Original:

```
frontScale = 80;
scaleAmount = 20;
depthRange = 20;
FG01._Depth = 1001;
NoClick.useHandCursor = false;
haveCrystal = _root.backpack.getItemCount("ItemCrystalProsperity");
if(haveCrystal > 0)
{
	CrystalProsperity._visible = false;
}
CrystalProsperity._name = "Item";
```

Modified:

```
frontScale = 80;
scaleAmount = 20;
depthRange = 20;
FG01._Depth = 1001;
NoClick.useHandCursor = false;
haveCrystal = _root.backpack.getItemCount("ItemCrystalFaith");
if(haveCrystal > 0)
{
	CrystalProsperity._visible = false;
}
CrystalProsperity._name = "Item";
```
