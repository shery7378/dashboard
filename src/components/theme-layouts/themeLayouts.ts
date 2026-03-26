import dynamic from 'next/dynamic';
import React, { ComponentType } from 'react';

const Layout1 = dynamic(() => import('./layout1/Layout1'));
const Layout2 = dynamic(() => import('./layout2/Layout2'));
const Layout3 = dynamic(() => import('./layout3/Layout3'));
const Layout4 = dynamic(() => import('./layout4/Layout4'));

/**
 * The type definition for the theme layouts.
 */
export type themeLayoutsType = Record<string, ComponentType<{ children?: React.ReactNode }>>;

/**
 * The theme layouts.
 */
const themeLayouts: themeLayoutsType = {
	layout1: Layout1,
	layout2: Layout2,
	layout3: Layout3,
	layout4: Layout4
};

export default themeLayouts;
