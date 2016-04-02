// define AIML syntax
var HEADER = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<aiml version=\"1.0\">\n\n<!-- { topic } topic -->\n\n";
var CATEGORY = "<category>\n{ args }\n</category>\n\n";
var CAT_ARGS = [
    "   <pattern> { args } </pattern>\n",
    "   <that> { args } </that>\n",
    "   <template> { args } </template>"
];

// used to store the currently parsed code
var CODE_OUTPUT_CACHE = "";

const CONTRACTIONS = {
	"they're": "they are",
	"we're": "we are",
}

// add event listeners when page is loaded
document.addEventListener("DOMContentLoaded", function() {
    userInput = document.getElementById('userInput');
    codeOutput = document.getElementById('codeOutput');
    topicInput = document.getElementById('topicInput');

    // code is updated when topic and conv tree are updated and blurred
    userInput.addEventListener('keyup', updateCode);
    userInput.addEventListener('blur', updateCode);
    topicInput.addEventListener('keyup', updateCode);
    topicInput.addEventListener('blur', updateCode);

    // catches tab and prevents change of focus
    userInput.addEventListener('keydown', allowTabbing)
    codeOutput.addEventListener('keydown', allowTabbing)

    // updates code to show skeleton
    updateCode();
});


// allow the user to tab indent in text areas.
var allowTabbing = function(e) {
	if (e.keyCode == 9 || e.which == 9) {
		e.preventDefault();

		// add tab character
		var start = this.selectionStart;
		this.value = this.value.substring(0,this.selectionStart) +
					 "\t" +
					 this.value.substring(this.selectionEnd);
		this.selectionEnd = start + 1;
	}
}

// update the code textarea
var updateCode = function() {
	// get list of user input lines and remove blank lines
	var lineList = userInput.value.split("\n")
	for (var i=0; i < lineList.length; i++) {
		if (lineList[i].trim() == "") {
			lineList.splice(i, 1);
			i--;
		}
	}

	var topic = topicInput.value;
	// check if topic name is default
	if (topic == "Topic Name") {
		topic = "topicName"
	}
	CODE_OUTPUT_CACHE = HEADER.replace("{ topic }", topic);

	// create first AIML statement separately since it is an exception
	var initialStatement = removeIndent(lineList.splice(0, 1)[0]);
	CODE_OUTPUT_CACHE += makeCategory(topic.toLowerCase() + "topic", null, initialStatement);

	// recursively scan the conversation tree and push AIML to the end of CODE_OUTPUT_CACHE
	makeAiml(initialStatement, lineList);
	codeOutput.value = CODE_OUTPUT_CACHE;
}

// recursive function used to parse the conversation tree into linear code
var makeAiml = function(that, lineList) {
	var last = lineList.length;

	// check if there are enough arguments for both pattern and template
	if (last >= 2) {
		var pattern = removeIndent(lineList[0]);
		var template = removeIndent(lineList[1].trim());

		CODE_OUTPUT_CACHE += makeCategory(pattern, that, template);

		var space = getIndent(lineList[0]);
		for (var i=2; i < lineList.length; i++) {
			if (space == getIndent(lineList[i])) {
				last = i;
				break
			}
		}
		lineList.splice(0, 2);
		makeAiml(template, lineList.splice(0, last - 2));
		return makeAiml(that, lineList)
	}
}

// returns the number of whitespace characters at the start of the string
var getIndent = function(string) {
	return string.length - string.replace(/^-+/, "").length;
}

var removeIndent = function(string) {
	return string.replace(/^-*>/, "")
}

// inserts the arguments into the category template
var makeCategory = function(pattern, that, template) {
	var category = CATEGORY;
	args = "";

	if (that != null) {
		var sentences = that.split(".");
		var that = "";
		for (var i=0; i < sentences.length; i++) {
			if (sentences[i].trim() != "") {
				that = sentences[i].trim();
			}
		}
		that = that.replace(/[?.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");  // remove punctuation
		that = that.replace(/\s{2,}/g," ");  // collapse multiple spaces
		that = that.toLowerCase();
	}
	

	var argList = [pattern, that, template];
	for (var i=0; i < argList.length; i++) {
		if (!argList[i] == "") {
			args += CAT_ARGS[i].replace("{ args }", argList[i].trim())
		}
	}
	category = category.replace("{ args }", args);
	return category
}

// ran when an input is focussed, makes nice text
function inputFocus(i) {
	if (i.value == i.defaultValue) {
		i.value = "";
		i.style.color = "#000";
	}
}

// ran when an input is blurred, makes nice text
function inputBlur(i) {
	if (i.value == "") {
		i.value = i.defaultValue;
		i.style.color = "#888";
	}
}

// validates the topic name to camelcase with no spaces
function validateTopic(i) {
	var newVal = i.value.trim();
	newVal = newVal.replace(/\s+[a-z]/g, function(match) {
		return match.trim().toUpperCase();
	});
	newVal = newVal.replace(/\s^/, "");
	i.value = newVal;
}