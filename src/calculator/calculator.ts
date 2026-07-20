type Operator = '+' | '-' | '*' | '/';

export class Calculator {
  private readonly historyStorageKey = 'kawaii-calculator-history';

  private displayElement: HTMLElement;
  private operationElement: HTMLElement;
  private historyList: HTMLDivElement;

  private history: string[] = [];

  private currentValue = '0';
  private previousValue: number | null = null;
  private operator: Operator | null = null;

  private waitingForNewValue = false;
  private calculationFinished = false;

  constructor() {
    const displayElement =
      document.querySelector<HTMLElement>('[data-display]');

    const operationElement =
      document.querySelector<HTMLElement>('[data-operation]');

    const historyList =
      document.querySelector<HTMLDivElement>('[data-history-list]');

    if (!displayElement || !operationElement || !historyList) {
      throw new Error(
        'Os elementos da calculadora ou do histórico não foram encontrados.',
      );
    }

    this.displayElement = displayElement;
    this.operationElement = operationElement;
    this.historyList = historyList;
  }

  public initialize(): void {
    this.loadHistory();
    this.addButtonEvents();
    this.addKeyboardEvents();
    this.updateDisplay();
    this.renderHistory();
  }

  private addButtonEvents(): void {
    const numberButtons =
      document.querySelectorAll<HTMLButtonElement>('[data-number]');

    const operatorButtons =
      document.querySelectorAll<HTMLButtonElement>('[data-operator]');

    numberButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const number = button.dataset.number;

        if (number) {
          this.inputNumber(number);
        }
      });
    });

    operatorButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const operator = button.dataset.operator as Operator | undefined;

        if (operator) {
          this.chooseOperator(operator);
        }
      });
    });

    document
      .querySelector<HTMLButtonElement>('[data-action="clear"]')
      ?.addEventListener('click', () => this.clear());

    document
      .querySelector<HTMLButtonElement>('[data-action="toggle-sign"]')
      ?.addEventListener('click', () => this.toggleSign());

    document
      .querySelector<HTMLButtonElement>('[data-action="percentage"]')
      ?.addEventListener('click', () => this.percentage());

    document
      .querySelector<HTMLButtonElement>('[data-action="decimal"]')
      ?.addEventListener('click', () => this.inputDecimal());

    document
      .querySelector<HTMLButtonElement>('[data-action="equals"]')
      ?.addEventListener('click', () => this.calculate());

    document
      .querySelector<HTMLButtonElement>('[data-action="clear-history"]')
      ?.addEventListener('click', () => this.clearHistory());
  }

  private addKeyboardEvents(): void {
    document.addEventListener('keydown', (event) => {
      if (/^[0-9]$/.test(event.key)) {
        this.inputNumber(event.key);
        return;
      }

      if (event.key === '.' || event.key === ',') {
        this.inputDecimal();
        return;
      }

      if (['+', '-', '*', '/'].includes(event.key)) {
        this.chooseOperator(event.key as Operator);
        return;
      }

      if (event.key === 'Enter' || event.key === '=') {
        event.preventDefault();
        this.calculate();
        return;
      }

      if (event.key === 'Escape') {
        this.clear();
        return;
      }

      if (event.key === 'Backspace') {
        this.removeLastDigit();
      }
    });
  }

  private inputNumber(number: string): void {
    if (this.waitingForNewValue || this.calculationFinished) {
      this.currentValue = number;
      this.waitingForNewValue = false;
      this.calculationFinished = false;
      this.updateDisplay();
      return;
    }

    if (this.currentValue === '0') {
      this.currentValue = number;
    } else if (this.currentValue.replace('-', '').length < 12) {
      this.currentValue += number;
    }

    this.updateDisplay();
  }

  private inputDecimal(): void {
    if (this.waitingForNewValue || this.calculationFinished) {
      this.currentValue = '0.';
      this.waitingForNewValue = false;
      this.calculationFinished = false;
      this.updateDisplay();
      return;
    }

    if (!this.currentValue.includes('.')) {
      this.currentValue += '.';
    }

    this.updateDisplay();
  }

  private chooseOperator(operator: Operator): void {
    if (
      this.operator &&
      this.previousValue !== null &&
      !this.waitingForNewValue
    ) {
      this.calculate();

      if (this.currentValue === 'Erro') {
        return;
      }
    }

    this.previousValue = Number(this.currentValue);
    this.operator = operator;
    this.waitingForNewValue = true;
    this.calculationFinished = false;

    this.operationElement.textContent =
      `${this.formatValue(this.previousValue)} ` +
      `${this.getOperatorSymbol(operator)}`;
  }

  private calculate(): void {
    if (
      this.operator === null ||
      this.previousValue === null ||
      this.waitingForNewValue
    ) {
      return;
    }

    const currentNumber = Number(this.currentValue);
    const previousNumber = this.previousValue;
    const selectedOperator = this.operator;

    let result: number;

    switch (selectedOperator) {
      case '+':
        result = previousNumber + currentNumber;
        break;

      case '-':
        result = previousNumber - currentNumber;
        break;

      case '*':
        result = previousNumber * currentNumber;
        break;

      case '/':
        if (currentNumber === 0) {
          this.showError('Não é possível dividir por zero');
          return;
        }

        result = previousNumber / currentNumber;
        break;
    }

    const formattedPreviousNumber = this.formatValue(previousNumber);
    const formattedCurrentNumber = this.formatValue(currentNumber);
    const formattedResult = this.formatValue(result);
    const operatorSymbol = this.getOperatorSymbol(selectedOperator);

    const operation =
      `${formattedPreviousNumber} ` +
      `${operatorSymbol} ` +
      `${formattedCurrentNumber} =`;

    this.operationElement.textContent = operation;

    const historyItem =
      `${formattedPreviousNumber} ` +
      `${operatorSymbol} ` +
      `${formattedCurrentNumber} = ` +
      `${formattedResult}`;

    this.history.unshift(historyItem);

    if (this.history.length > 20) {
      this.history = this.history.slice(0, 20);
    }

    this.saveHistory();
    this.renderHistory();

    this.currentValue = this.normalizeResult(result);
    this.previousValue = null;
    this.operator = null;
    this.waitingForNewValue = false;
    this.calculationFinished = true;

    this.updateDisplay();
  }

  private clear(): void {
    this.currentValue = '0';
    this.previousValue = null;
    this.operator = null;
    this.waitingForNewValue = false;
    this.calculationFinished = false;

    this.operationElement.innerHTML = '&nbsp;';
    this.updateDisplay();
  }

  private clearHistory(): void {
    this.history = [];
    localStorage.removeItem(this.historyStorageKey);
    this.renderHistory();
  }

  private toggleSign(): void {
    if (this.currentValue === '0' || this.currentValue === 'Erro') {
      return;
    }

    this.currentValue = this.currentValue.startsWith('-')
      ? this.currentValue.slice(1)
      : `-${this.currentValue}`;

    this.updateDisplay();
  }

  private percentage(): void {
    if (this.currentValue === 'Erro') {
      return;
    }

    const value = Number(this.currentValue) / 100;

    this.currentValue = this.normalizeResult(value);
    this.updateDisplay();
  }

  private removeLastDigit(): void {
    if (
      this.waitingForNewValue ||
      this.calculationFinished ||
      this.currentValue === 'Erro'
    ) {
      return;
    }

    this.currentValue =
      this.currentValue.length > 1
        ? this.currentValue.slice(0, -1)
        : '0';

    if (this.currentValue === '-') {
      this.currentValue = '0';
    }

    this.updateDisplay();
  }

  private updateDisplay(): void {
    if (this.currentValue === 'Erro') {
      this.displayElement.textContent = this.currentValue;
      return;
    }

    const numericValue = Number(this.currentValue);

    if (this.currentValue.endsWith('.')) {
      this.displayElement.textContent =
        `${this.formatValue(numericValue)}.`;

      return;
    }

    this.displayElement.textContent = this.formatValue(numericValue);
  }

  private renderHistory(): void {
    if (this.history.length === 0) {
      this.historyList.innerHTML = `
        <p class="history__empty">
          Nenhum cálculo realizado ainda.
        </p>
      `;

      return;
    }

    this.historyList.innerHTML = this.history
      .map(
        (item) => `
          <div class="history__item">
            ${item}
          </div>
        `,
      )
      .join('');
  }

  private saveHistory(): void {
    localStorage.setItem(
      this.historyStorageKey,
      JSON.stringify(this.history),
    );
  }

  private loadHistory(): void {
    const savedHistory = localStorage.getItem(this.historyStorageKey);

    if (!savedHistory) {
      return;
    }

    try {
      const parsedHistory: unknown = JSON.parse(savedHistory);

      if (
        Array.isArray(parsedHistory) &&
        parsedHistory.every((item) => typeof item === 'string')
      ) {
        this.history = parsedHistory;
      }
    } catch {
      localStorage.removeItem(this.historyStorageKey);
      this.history = [];
    }
  }

  private formatValue(value: number): string {
    if (!Number.isFinite(value)) {
      return 'Erro';
    }

    return new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: 8,
    }).format(value);
  }

  private normalizeResult(value: number): string {
    return Number(value.toFixed(8)).toString();
  }

  private getOperatorSymbol(operator: Operator): string {
    const symbols: Record<Operator, string> = {
      '+': '+',
      '-': '−',
      '*': '×',
      '/': '÷',
    };

    return symbols[operator];
  }

  private showError(message: string): void {
    this.currentValue = 'Erro';
    this.previousValue = null;
    this.operator = null;
    this.waitingForNewValue = false;
    this.calculationFinished = true;

    this.operationElement.textContent = message;
    this.updateDisplay();
  }
}