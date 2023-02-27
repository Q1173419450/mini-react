import React, { useState, useEffect } from 'react';

export default function App() {
	const [num, updateNum] = useState(100);
	useEffect(() => {
		console.log('App mount');
	}, []);

	return (
		<ul onClick={() => updateNum(50)}>
			{new Array(num).fill(0).map((_, i) => {
				return <Child key={i}>{i}</Child>;
			})}
		</ul>
	);
}

function Child({ children }) {
	const now = performance.now();
	while (performance.now() - now < 4) {
		// doSomething
	}
	return <li>{children}</li>;
}
