import './style.scss';
import './calculator/calculator.scss';
import calculatorHtml from './calculator/calculator.html?raw';
import { Calculator } from './calculator/calculator';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('O elemento #app não foi encontrado.');
}

app.innerHTML = calculatorHtml;

const calculator = new Calculator();
calculator.initialize();