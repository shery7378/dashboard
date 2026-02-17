//app/(control-panel)/(user)/accounts
'use client';

import GlobalStyles from '@mui/material/GlobalStyles';
import SellersHeader from './SellersHeader';
import SellersTable from './SellersTable';

/**
 * The products page.
 */
function Sellers() {
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
                <SellersHeader />
                <SellersTable />
            </div>
        </>
    );
}

export default Sellers;