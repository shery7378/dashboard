//app/(control-panel)/(user)/accounts
'use client';

import GlobalStyles from '@mui/material/GlobalStyles';
import UsersHeader from './UsersHeader';
import UsersTable from './UsersTable';

/**
 * The products page.
 */
function Users() {
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
                <UsersHeader />
                <UsersTable />
            </div>
        </>
    );
}

export default Users;