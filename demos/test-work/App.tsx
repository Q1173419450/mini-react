import React, { useState, useEffect } from 'react';

export default function App() {
	const [num, updateNum] = useState(0);
	useEffect(() => {
		console.log('App mount');
	}, []);

	useEffect(() => {
		console.log('num change create', num);
		return () => {
			console.log('num change destroy', num);
		};
	}, [num]);

	return (
		<div onClick={() => updateNum(num + 1)}>
			{num % 2 == 0 ? <Child /> : <div>noop{num}</div>}
		</div>
	);
}

function Child() {
	useEffect(() => {
		console.log('Child mount');
		return () => console.log('Child unmount');
	}, []);

	return <>I am child</>;
}
