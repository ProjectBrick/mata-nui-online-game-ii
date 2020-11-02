# Added a way to get the Prosperity Charm

The game did not originally have a way to get the Prosperity Charm, so it was added to this conversation file.

Additional conversation text written by Biomaniac (?).

## `scripts` -> `frame 1`

Original:

```
function stateA()
{
	I_1 = {name:"I_1",children:["II_1","II_2"],question:textQ1,statement:textA1};
	II_1 = {name:"II_1",children:["III_1"],question:textQ2,statement:textA2};
	numString = _root.backpack.getItemCount("ItemString");
	numHook = _root.backpack.getItemCount("ItemFishhook");
	if(numString > 1 and numHook > 1)
	{
		III_1_children = ["IV_1"];
	}
	else
	{
		III_1_children = [];
	}
	III_1 = {name:"III_1",children:III_1_children,question:textQ3,statement:textA3};
	IV_1 = {name:"IV_1",children:["V_1"],question:textQ4,statement:textA4,actions:[["give","ItemString",1],["give","ItemFishhook",1],["recieve","widgets",25],["setWorldState","AziboTask",1]]};
	V_1 = {name:"V_1",children:[],question:textQ3,statement:textA6};
	II_2 = {name:"II_2",children:[],question:textQ5,statement:textQ5,actions:[["clearAll"]]};
}
function stateB()
{
	stateA();
	I_1.statement = textA7;
}
function stateC()
{
	stateA();
	I_1.statement = textA8;
	III_1 = {name:"III_1",children:[],question:textQ3,statement:textA6};
}
function stateD()
{
	stateC();
	I_1.statement = textA9;
}
function setConversationState()
{
	var AziboTask = _root.getWorldState("AziboTask");
	var OnukoroWins = _root.getWorldState("OnukoroWins");
	if(AziboTask == 1)
	{
		if(OnukoroWins > 0)
		{
			stateD();
		}
		else
		{
			stateC();
		}
	}
	else if(OnuKoroWins > 0)
	{
		stateB();
	}
	else
	{
		stateA();
	}
}
function initialize()
{
	setConversationState();
	statement = "";
	questionList = [];
	questionHistory = [];
	threadHistory = ["I_1"];
}
textQ1 = "Start of conversation";
textA1 = "Hm? Oh. A Ga-Matoran? If you\'re looking for the Kolhii field, the match isn\'t here. It\'s an away game, being held in Ga-Koro.";
textQ2 = "Who are you?";
textA2 = "I am one of Chief Mamru\'s prospectors. My work is based on the Principle of Onu-Koro.";
textQ3 = "Principle?";
textA3 = "Well, I\'d like to tell you about it but my Sluice has fallen in this crevice. If I had a hook and a string, I bet I could get it out!";
textQ4 = "I have a fishhook and a string.";
textA4 = "You do? Perfect! Now I\'ll be able to get back to work, and pursue our town\'s Principle. And here\'s some widgets for your trouble!";
textQ5 = "Goodbye.";
textA6 = "Onu-Koro is based on the Principle of Prosperity! Following the Principle of Prosperity requires great determination and skill. But it brings great wealth!";
textA7 = "Heard you beat our team, Ga-Matoran. Just wait until next season!";
textA8 = "Thanks again for helping me find my Sluice. Good luck in the match against Onepu and Taipu.";
textA9 = "There’s protodermis in these here mines! I’ll be able to get at it now, thanks to you, Hahli! Oh, and congratulations on your win against Onepu and Taipu. That was a great game!";
```

Modified:

```
function stateA()
{
	I_1 = {name:"I_1",children:["II_1","II_2"],question:textQ1,statement:textA1};
	II_1 = {name:"II_1",children:["III_1"],question:textQ2,statement:textA2};
	numString = _root.backpack.getItemCount("ItemString");
	numHook = _root.backpack.getItemCount("ItemFishhook");
	if(numString > 1 and numHook > 1)
	{
		III_1_children = ["IV_1"];
	}
	else
	{
		III_1_children = [];
	}
	III_1 = {name:"III_1",children:III_1_children,question:textQ3,statement:textA3};
	IV_1 = {name:"IV_1",children:["V_1"],question:textQ4,statement:textA4,actions:[["give","ItemString",1],["give","ItemFishhook",1],["recieve","widgets",25],["setWorldState","AziboTask",1]]};
	var numCharmProsperity = _root.backpack.getItemCount("ItemCharmProsperity");
	if(numCharmProsperity > 0)
	{
		V_1 = {name:"V_1",children:[],question:textQ3,statement:textA6};
	}
	else
	{
		V_1 = {name:"V_1",children:[],question:textQ3,statement:textA10,actions:[["recieve","ItemCharmProsperity",1]]};
	}
	II_2 = {name:"II_2",children:[],question:textQ5,statement:textQ5,actions:[["clearAll"]]};
}
function stateB()
{
	stateA();
	I_1.statement = textA7;
}
function stateC()
{
	stateA();
	I_1.statement = textA8;
	var numCharmProsperity = _root.backpack.getItemCount("ItemCharmProsperity");
	if(numCharmProsperity > 0)
	{
		III_1 = {name:"III_1",children:[],question:textQ3,statement:textA6};
	}
	else
	{
		III_1 = {name:"III_1",children:[],question:textQ3,statement:textA10,actions:[["recieve","ItemCharmProsperity",1]]};
	}
}
function stateD()
{
	stateC();
	I_1.statement = textA9;
}
function setConversationState()
{
	var AziboTask = _root.getWorldState("AziboTask");
	var OnukoroWins = _root.getWorldState("OnukoroWins");
	if(AziboTask == 1)
	{
		if(OnukoroWins > 0)
		{
			stateD();
		}
		else
		{
			stateC();
		}
	}
	else if(OnukoroWins > 0)
	{
		stateB();
	}
	else
	{
		stateA();
	}
}
function initialize()
{
	setConversationState();
	statement = "";
	questionList = [];
	questionHistory = [];
	threadHistory = ["I_1"];
}
textQ1 = "Start of conversation";
textA1 = "Hm? Oh. A Ga-Matoran? If you\'re looking for the Kolhii field, the match isn\'t here. It\'s an away game, being held in Ga-Koro.";
textQ2 = "Who are you?";
textA2 = "I am one of Chief Mamru\'s prospectors. My work is based on the Principle of Onu-Koro.";
textQ3 = "Principle?";
textA3 = "Well, I\'d like to tell you about it but my Sluice has fallen in this crevice. If I had a hook and a string, I bet I could get it out!";
textQ4 = "I have a fishhook and a string.";
textA4 = "You do? Perfect! Now I\'ll be able to get back to work, and pursue our town\'s Principle. And here\'s some widgets for your trouble!";
textQ5 = "Goodbye.";
textA6 = "Onu-Koro is based on the Principle of Prosperity! Following the Principle of Prosperity requires great determination and skill. But it brings great wealth!";
textA7 = "Heard you beat our team, Ga-Matoran. Just wait until next season!";
textA8 = "Thanks again for helping me find my Sluice. Good luck in the match against Onepu and Taipu.";
textA9 = "There’s protodermis in these here mines! I’ll be able to get at it now, thanks to you, Hahli! Oh, and congratulations on your win against Onepu and Taipu. That was a great game!";
textA10 = "Onu-Koro is based on the Principle of Prosperity! Following the Principle of Prosperity requires great determination and skill. But it brings great wealth! ^Here! Take this stone. It has the symbol of Prosperity on it. Maybe it can help you, somehow.";
```
