//app/(control-panel)/(user)/accounts
'use client';

import GlobalStyles from '@mui/material/GlobalStyles';
import vendorsHeader from './vendorsHeader';
import vendorsTable from './vendorsTable';

/**
 * The products page.
 */
function vendors() {
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
                <vendorsHeader />
                <vendorsTable />
            </div>
        </>
    );
}

export default vendors;