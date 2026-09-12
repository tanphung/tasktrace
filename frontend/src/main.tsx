import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import V2App from './V2App';
import deployment from './deployment.json';
import './styles.css';
import './workspace.css';
import './redesign.css';
import './v2.css';

const Root=(deployment as {protocolVersion?:string}).protocolVersion==='v2'?V2App:App;
createRoot(document.getElementById('root')!).render(<React.StrictMode><Root/></React.StrictMode>);
