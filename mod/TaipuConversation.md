# Added a way to get the Stamina Charm

The game did not originally have a way to get the Stamina Charm, so it was added to this conversation file.

Additional conversation text written by Biomaniac (?).

## `scripts` -> `frame 1`

Original:

```
function stateA()
{
	I_1 = {name:"I_1",children:["II_1","II_2","II_3"],question:textQ1,statement:textA1};
	II_1 = {name:"II_1",children:[],question:textQ2,statement:textA2};
	II_2 = {name:"II_2",children:[],question:textQ3,statement:textA3};
	II_3 = {name:"II_3",children:[],question:textQ4,statement:textA4,actions:[["clearAll"]]};
}
function stateB()
{
	I_1 = {name:"I_1",children:["II_1","II_2"],question:textQ1,statement:textA5};
	II_1 = {name:"II_1",children:["III_1"],question:textQ6,statement:textA6};
	III_1 = {name:"III_1",children:["IV_1"],question:textQ7,statement:textA7};
	dosneTask = _root.getWorldState("DosneTask");
	if(dosneTask == 1)
	{
		IV_1 = {name:"IV_1",children:[],question:textQ8,statement:textA8,actions:[["loadScene","GameRockHaul"]]};
	}
	else
	{
		IV_1 = {name:"IV_1",children:[],question:textQ8,statement:textA9};
	}
	II_2 = {name:"II_2",children:[],question:textQ4,statement:textA4,actions:[["clearAll"]]};
}
function setConversationState()
{
	var currentScene = _root.currentScene;
	if(currentScene == "GakoroBeachB")
	{
		stateA();
	}
	else
	{
		stateB();
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
textA1 = "Hello. Is it always so bright here by the sea? The waves are so loud! It is very pretty, though. ^Do you have anything for a headache?";
textQ2 = "Hello, Hafu!";
textA2 = "I am not Hafu! I am Taipu! Why does everyone think I am Hafu, and he is me? We are not even from the same village!";
textQ3 = "Headache?";
textA3 = "When we left Onu-Koro, Turaga Whenua said we can win if we use our heads. When the ball is headed for the goal, it is my job to stop it, so I use my head! Onepu says that is not what he meant. We have been practicing a lot.";
textQ4 = "Goodbye.";
textA4 = "Goodbye!";
textA5 = "Hello! You are the lady from bright Ga-Koro! Are you here to help me dig?";
textQ6 = "Dig?";
textA6 = "I carry the ore from the mines to the work-piles. It is hard work. I can carry rocks for a long time. Onepu says it is because I have Stamina.";
textQ7 = "I would like to learn Stamina.";
textA7 = "I can show you! Let us carry rocks together.";
textQ8 = "Okay!";
textA8 = "Here...";
textA9 = "Dosne is the mining captain. If he says it is okay, I will show you!";
```

Modified:

```
function stateA()
{
	I_1 = {name:"I_1",children:["II_1","II_2","II_3"],question:textQ1,statement:textA1};
	II_1 = {name:"II_1",children:[],question:textQ2,statement:textA2};
	II_2 = {name:"II_2",children:[],question:textQ3,statement:textA3};
	II_3 = {name:"II_3",children:[],question:textQ4,statement:textA4,actions:[["clearAll"]]};
}
function stateB()
{
	I_1 = {name:"I_1",children:["II_1","II_2"],question:textQ1,statement:textA5};
	var numCharmStamina = _root.backpack.getItemCount("ItemCharmStamina");
	if(numCharmStamina > 0)
	{
		II_1 = {name:"II_1",children:["III_1"],question:textQ6,statement:textA6};
	}
	else
	{
		II_1 = {name:"II_1",children:["III_1"],question:textQ6,statement:textA10,actions:[["recieve","ItemCharmStamina",1]]};
	}
	III_1 = {name:"III_1",children:["IV_1"],question:textQ7,statement:textA7};
	dosneTask = _root.getWorldState("DosneTask");
	if(dosneTask == 1)
	{
		IV_1 = {name:"IV_1",children:[],question:textQ8,statement:textA8,actions:[["loadScene","GameRockHaul"]]};
	}
	else
	{
		IV_1 = {name:"IV_1",children:[],question:textQ8,statement:textA9};
	}
	II_2 = {name:"II_2",children:[],question:textQ4,statement:textA4,actions:[["clearAll"]]};
}
function setConversationState()
{
	var currentScene = _root.currentScene;
	if(currentScene == "GakoroBeachB")
	{
		stateA();
	}
	else
	{
		stateB();
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
textA1 = "Hello. Is it always so bright here by the sea? The waves are so loud! It is very pretty, though. ^Do you have anything for a headache?";
textQ2 = "Hello, Hafu!";
textA2 = "I am not Hafu! I am Taipu! Why does everyone think I am Hafu, and he is me? We are not even from the same village!";
textQ3 = "Headache?";
textA3 = "When we left Onu-Koro, Turaga Whenua said we can win if we use our heads. When the ball is headed for the goal, it is my job to stop it, so I use my head! Onepu says that is not what he meant. We have been practicing a lot.";
textQ4 = "Goodbye.";
textA4 = "Goodbye!";
textA5 = "Hello! You are the lady from bright Ga-Koro! Are you here to help me dig?";
textQ6 = "Dig?";
textA6 = "I carry the ore from the mines to the work-piles. It is hard work. I can carry rocks for a long time. Onepu says it is because I have Stamina.";
textQ7 = "I would like to learn Stamina.";
textA7 = "I can show you! Let us carry rocks together.";
textQ8 = "Okay!";
textA8 = "Here...";
textA9 = "Dosne is the mining captain. If he says it is okay, I will show you!";
textA10 = "I carry the ore from the mines to the work-piles. It is hard work. I can carry rocks for a long time. Onepu says it is because I have Stamina. ^Take this Stone. It represents Stamina. I found it while moving ore just a little while ago. Maybe it will bring you luck!";
```
