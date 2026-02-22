export const getContrastColor = (colorName: string) => {
	// Create a temporary element to get computed color
	const temp = document.createElement('div');
	temp.style.color = colorName;
	document.body.appendChild(temp);
	const computedColor = window.getComputedStyle(temp).color;
	document.body.removeChild(temp);

	// Parse RGB from computed style (e.g., "rgb(255, 255, 255)")
	const rgb = computedColor.match(/\d+/g)?.map(Number) || [0, 0, 0]; // Fallback to [0, 0, 0] if match fails
	const [r, g, b] = rgb;
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return luminance > 0.5 ? 'black' : 'white';
};
