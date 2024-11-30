import React from 'react';
// import { useState } from 'react';

export default function App() {
	// const [num, setNum] = useState(1);
	// const arr =
	// 	num % 2 === 0
	// 		? [<li key="1">1</li>, <li key="2">2</li>, <li key="3">3</li>]
	// 		: [<li key="3">3</li>, <li key="2">2</li>, <li key="1">1</li>];
	return (
		<ul>
			<li key="1">1</li>
			<li key="2">2</li>
			<li key="3">3</li>
		</ul>
	);
	// return (
	// 	<ul
	// 		onClickCapture={() => {
	// 			setNum((num) => num + 1);
	// 			setNum((num) => num + 1);
	// 			setNum((num) => num + 1);
	// 		}}
	// 	>
	// 		{num}
	// 	</ul>
	// );
	// return <div>{num === 3 ? <Child /> : <div>{num}</div>}</div>;
}

// function Child() {
// 	const [name, setName] = useState('big-react');
// 	return (
// 		<span title={name} onClick={() => setName(name + 1)}>
// 			{name}
// 		</span>
// 	);
// }
