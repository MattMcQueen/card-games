import { countVisits } from '@card-games/card-kit/analytics';
import { mount } from 'svelte';
import '@card-games/card-kit/app.css';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('Missing #app element');

// This game's site in Cloudflare Web Analytics (see packages/card-kit/src/analytics.ts).
const ANALYTICS_TOKEN = '33a6fcfc739a408b8266a3ccd42aebd2';
countVisits(ANALYTICS_TOKEN);

export default mount(App, { target });
