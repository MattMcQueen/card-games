import { mount } from 'svelte';
import '@card-games/card-kit/app.css';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('Missing #app element');

// Visits are not counted yet: Spades needs its own site in Cloudflare Web Analytics first, and then
// `countVisits(<its token>)` from '@card-games/card-kit/analytics', as in the other games.

export default mount(App, { target });
