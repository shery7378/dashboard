//app/(control-panel)/(user)/accounts
'use client';

import GlobalStyles from '@mui/material/GlobalStyles';
import VendorsHeader from './VendorsHeader';
import VendorsTable from './VendorsTable';

/**
 * The products page.
 */
function Vendors() {
    return (
        <>
            <GlobalStyles
                styles={() => ({
                    '#root': {
                        maxHeight: '100vh'
                    }
                })}
            />
            <div className="w-full h-full flex flex-col px-4">
                <VendorsHeader />
                <VendorsTable />
            </div>
        </>
    );
}

export default Vendors;