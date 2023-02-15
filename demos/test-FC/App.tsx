import React from 'react';
import { useState } from 'react';

export default function App() {
	const [num, setNum] = useState(0);
	window.setNum = setNum;
	return <div>{num === 3 ? <Child /> : <div>{num}</div>}</div>;
}

function Child() {
	const [name, setName] = useState('big-react');
	return (
		<span title={name} onClick={() => setName(name + 1)}>
			{name}
		</span>
	);
}
