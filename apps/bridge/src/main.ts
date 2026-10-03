import { mount } from 'svelte';
import '@card-games/card-kit/app.css';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('Missing #app element');

// Visits will be counted with countVisits from '@card-games/card-kit/analytics' once the game has its own
// site in Cloudflare Web Analytics, and a token to pass it.

export default mount(App, { target });
