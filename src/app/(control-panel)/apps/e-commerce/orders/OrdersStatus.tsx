import _ from 'lodash';
import clsx from 'clsx';
import orderStatuses from './constants/orderStatuses';

/**
 * The orders status properties.
 */
type OrdersStatusProps = {
	name: string;
};

/**
 * The orders status component.
 */
function OrdersStatus(props: OrdersStatusProps) {
	const { name } = props;
	// Capitalize the name for lookup in orderStatuses
	const capitalizedName = _.capitalize(name);

	return (
		<div
			className={clsx(
				'inline text-md font-semibold py-1 px-3 rounded-full truncate',
				_.find(orderStatuses, { name: capitalizedName })?.color || 'bg-gray-500 text-white'
			)}
		>
			{capitalizedName}
		</div>
	);
}

export default OrdersStatus;
