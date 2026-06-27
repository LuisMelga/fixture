/** Punto de entrada. */
import './styles/app.css';
import { App } from './ui/App';

const root = document.getElementById('app');
if (root) new App(root).mount();
