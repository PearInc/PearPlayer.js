
var backgroundURLRegex = (/(.*?url\(["\']?)(.*?\.(?:png|jpg|gif))(["\']?\).*?;?)/i);


function matchBackgroundImages(declarationValue, cb) {
	var backgroundURLMatchAllRegex = new RegExp(backgroundURLRegex.source, "gi");

	return declarationValue.replace(backgroundURLMatchAllRegex, function(match, p1, p2, p3, offset, string) {
		var imagePath = p2;

		return p1 + cb(imagePath) + p3;
	});
}



module.exports = {
	'backgroundURLRegex': backgroundURLRegex,
	'matchBackgroundImages':matchBackgroundImages
};
