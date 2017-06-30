var extend = require('extend');


function getMetaInfoForDeclaration(declarations, declarationIndex) {
	var resultantMetaData = {};

	if(declarationIndex > 0 && declarationIndex < declarations.length) {
		var mainDeclaration = declarations[declarationIndex];
		if(mainDeclaration) {

			// Meta data can exist before or on the same line as the declaration.
			// Both Meta blocks are valid for the background property
			// ex.
			// /* @meta {"spritesheet": {"include": false}} */
			// background: url('../images/aenean-purple.png'); /* @meta {"sprite": {"skip": true}} */
			var beforeDeclaration = declarations[declarationIndex-1];
			var afterDeclaration = declarations[declarationIndex+1];


			if(beforeDeclaration) {
				// The before declaration should be valid no matter what (even if multiple lines above)
				// The parse function does all the nice checking for us
				extend(resultantMetaData, parseCommentDecarationForMeta(beforeDeclaration));
			}

			if(afterDeclaration) {
				//console.log(mainDeclaration);
				//console.log(afterDeclaration);
				//console.log(afterDeclaration.position.start.line, mainDeclaration.position.start.line);
				// Make sure that the comment starts on the same line as the main declaration
				if((((afterDeclaration || {}).position || {}).start || {}).line === (((mainDeclaration || {}).position || {}).start || {}).line) {
					extend(resultantMetaData, parseCommentDecarationForMeta(afterDeclaration));
				}
			}
		}
	}


	return resultantMetaData;
}

function parseCommentDecarationForMeta(declaration) {
	if(declaration.type === "comment") {
		//console.log(declaration);

		var metaMatches = declaration.comment.match(/@meta\s*({.*?}(?!}))/);

		if(metaMatches) {
			var parsedMeta = {};
			try {
				parsedMeta = JSON.parse(metaMatches[1]);
			}
			catch(e) {
				//console.warn('Meta info was found but failed was not valid JSON');
			}

			return parsedMeta;
		}
	}
}



module.exports = getMetaInfoForDeclaration;