/**
 * The Layout1 Config object.
 * This configuration defines the settings for a vertical layout, including defaults and form structure for UI customization.
 */
const Layout1Config = {
	// Title of the layout configuration
	title: 'Layout 1 - Vertical',
	// Default settings applied to the layout
	defaults: {
		// Layout mode: 'boxed', 'fullwidth', or 'container'
		mode: 'container',
		// Width of the container in pixels when mode is 'container'
		containerWidth: 1120,
		// Navbar configuration
		navbar: {
			// Whether the navbar is visible
			display: true,
			// Navbar style: 'style-1' (slide), 'style-2' (folded), 'style-3' (tabbed), or 'style-3-dense' (tabbed dense)
			style: 'style-1',
			// Whether the navbar is folded by default (applies to style-2 and style-3)
			folded: false,
			// Navbar position: 'left' or 'right'
			position: 'left',
			// Whether the navbar is open by default
			open: true
		},
		// Toolbar configuration
		toolbar: {
			// Whether the toolbar is visible
			display: true,
			// Toolbar style: 'fixed' or 'static'
			style: 'fixed'
		},
		// Footer configuration
		footer: {
			// Whether the footer is visible
			display: false,
			// Footer style: 'fixed' or 'static'
			style: 'fixed'
		},
		// Left side panel configuration
		leftSidePanel: {
			// Whether the left side panel is visible
			display: true
		},
		// Right side panel configuration
		rightSidePanel: {
			// Whether the right side panel is visible
			display: false
		}
	},
	// Form configuration for UI customization options
	form: {
		// Mode selection for the layout
		mode: {
			// Label for the mode field
			title: 'Mode',
			// Input type for mode selection
			type: 'radio',
			// Available mode options
			options: [
				{
					// Display name for the option
					name: 'Boxed',
					// Value for the boxed mode
					value: 'boxed'
				},
				{
					// Display name for the option
					name: 'Full Width',
					// Value for the fullwidth mode
					value: 'fullwidth'
				},
				{
					// Display name for the option
					name: 'Container',
					// Value for the container mode
					value: 'container'
				}
			]
		},
		// Container width configuration
		containerWidth: {
			// Label for the container width field
			title: 'Container Width (px)',
			// Input type for container width
			type: 'number',
			// Minimum allowed value for container width
			min: 1024
		},
		// Navbar form configuration
		navbar: {
			// Type of form element (group of related fields)
			type: 'group',
			// Label for the navbar section
			title: 'Navbar',
			// Child fields for navbar configuration
			children: {
				// Navbar display toggle
				display: {
					// Label for the display field
					title: 'Display',
					// Input type for display toggle
					type: 'switch'
				},
				// Navbar position selection
				position: {
					// Label for the position field
					title: 'Position',
					// Input type for position selection
					type: 'radio',
					// Available position options
					options: [
						{
							// Display name for the option
							name: 'Left',
							// Value for left position
							value: 'left'
						},
						{
							// Display name for the option
							name: 'Right',
							// Value for right position
							value: 'right'
						}
					]
				},
				// Navbar style selection
				style: {
					// Label for the style field
					title: 'Style',
					// Input type for style selection
					type: 'radio',
					// Available style options
					options: [
						{
							// Display name for the option
							name: 'Slide (style-1)',
							// Value for slide style
							value: 'style-1'
						},
						{
							// Display name for the option
							name: 'Folded (style-2)',
							// Value for folded style
							value: 'style-2'
						},
						{
							// Display name for the option
							name: 'Tabbed (style-3)',
							// Value for tabbed style
							value: 'style-3'
						},
						{
							// Display name for the option
							name: 'Tabbed Dense (style-3-dense)',
							// Value for tabbed dense style
							value: 'style-3-dense'
						}
					]
				},
				// Navbar folded toggle
				folded: {
					// Label for the folded field
					title: 'Folded (style-2, style-3)',
					// Input type for folded toggle
					type: 'switch'
				}
			}
		},
		// Toolbar form configuration
		toolbar: {
			// Type of form element (group of related fields)
			type: 'group',
			// Label for the toolbar section
			title: 'Toolbar',
			// Child fields for toolbar configuration
			children: {
				// Toolbar display toggle
				display: {
					// Label for the display field
					title: 'Display',
					// Input type for display toggle
					type: 'switch'
				},
				// Toolbar style selection
				style: {
					// Label for the style field
					title: 'Style',
					// Input type for style selection
					type: 'radio',
					// Available style options
					options: [
						{
							// Display name for the option
							name: 'Fixed',
							// Value for fixed style
							value: 'fixed'
						},
						{
							// Display name for the option
							name: 'Static',
							// Value for static style
							value: 'static'
						}
					]
				}
			}
		},
		// Footer form configuration
		footer: {
			// Type of form element (group of related fields)
			type: 'group',
			// Label for the footer section
			title: 'Footer',
			// Child fields for footer configuration
			children: {
				// Footer display toggle
				display: {
					// Label for the display field
					title: 'Display',
					// Input type for display toggle
					type: 'switch'
				},
				// Footer style selection
				style: {
					// Label for the style field
					title: 'Style',
					// Input type for style selection
					type: 'radio',
					// Available style options
					options: [
						{
							// Display name for the option
							name: 'Fixed',
							// Value for fixed style
							value: 'fixed'
						},
						{
							// Display name for the option
							name: 'Static',
							// Value for static style
							value: 'static'
						}
					]
				}
			}
		}
	}
};

// TypeScript type definition for the defaults section of Layout1Config
export type Layout1ConfigDefaultsType = (typeof Layout1Config)['defaults'];

// Export the configuration object as default
export default Layout1Config;
