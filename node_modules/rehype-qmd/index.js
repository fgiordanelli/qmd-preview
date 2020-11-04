module.exports = () => (rootNode) => {
	if (rootNode.length === 0)
		return [];

	const slides = [];

	for (let node of rootNode.children) {
		if (["h1"].includes(node.tagName)) {
			const value = node.children[0].value;
			if (!['q', 'r', 's'].includes(value)) {
				slides.push({
					type: "element",
					tagName: "input",
					properties: { value: value, id: value, type: "radio", name: "qmd" },
					children: []
				});
			} else {
				if (['s'].includes(value)) {
					slides.push({
						type: "element",
						tagName: "input",
						properties: { type: "checkbox", id: "solution" },
						children: []
					});
					slides.push({
						type: "element",
						tagName: "label",
						properties: { for: "solution" },
						children: [{
							type: "text",
							value: "Solution"
						}]
					});
				}
				if (['r'].includes(value)) {
					slides.unshift({
						type: "element",
						tagName: "label",
						properties: { for: "right-answer" },
						children: [{
							type: "text",
							value: "Right Answer"
						}]
					});
					slides.unshift({
						type: "element",
						tagName: "input",
						properties: { type: "checkbox", id: "right-answer" },
						children: []
					});
				}
				slides.push({
					type: "element",
					tagName: "div",
					properties: { class: value },
					children: []
				});
			}
		} else {
			if (slides[slides.length - 1].tagName == "input") {
				slides.push({
					type: "element",
					tagName: "label",
					properties: { for: slides[slides.length - 1].properties.id },
					children: [node]
				});
			} else {
				slides[slides.length - 1].children.push(node);
			}
		}
	}
	const form = [{
		type: "element",
		tagName: "form",
		properties: { class: 'qmd' },
		children: slides
	}];

	return { type: "root", children: form };
};