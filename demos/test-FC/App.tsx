import React from 'react';
import { useState } from 'react';

export default function App() {
	const [name, setName] = useState('big-react');
	return (
		<div>
			<span>{name}</span>
		</div>
	);
}

// function Child() {
// 	const [name, setName] = useState('big-react');
// 	return <span>{name}</span>;
// }
